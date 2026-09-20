'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Download,
  BookmarkCheck,
  FileText
} from 'lucide-react';
import { MasterJenjangItem } from '@/types';
import {
  masterJenjangService,
  importExportService
} from '@/services/masterDataService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';
import { toast, confirmDialog } from '@/stores/alertStore';

interface MasterJenjangTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const MasterJenjangTab: React.FC<MasterJenjangTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<MasterJenjangItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    level: '' as number | string,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await masterJenjangService.getMasterJenjangs({
        search: search || undefined,
        status: filterStatus || undefined,
      });

      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load master jenjang list:', err);
      toast.error('Gagal memuat katalog master jenjang.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open create modal if parent triggers it
  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  // Client Table hooks
  const {
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems,
    paginatedData: paginatedItems,
  } = useClientTable(items, {
    defaultSortField: 'level',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      code: '',
      name: '',
      level: '',
      description: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MasterJenjangItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      level: item.level !== null && item.level !== undefined ? item.level : '',
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning('Nama jenjang wajib diisi.', 'Validasi Form');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<MasterJenjangItem> = {
        code: formData.code.trim() ? formData.code.trim().toUpperCase() : undefined,
        name: formData.name.trim(),
        level: formData.level !== '' && formData.level !== null && formData.level !== undefined ? Number(formData.level) : null,
        description: formData.description.trim() || null,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await masterJenjangService.createMasterJenjang(payload);
        if (res.success) {
          toast.success('Master jenjang berhasil ditambahkan!', 'Sukses');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await masterJenjangService.updateMasterJenjang(formData.id, payload);
        if (res.success) {
          toast.success('Master jenjang berhasil diperbarui!', 'Sukses');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMsg = err.response?.data?.message || 'Gagal menyimpan master jenjang.';
      toast.error(errorMsg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: MasterJenjangItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Master Jenjang?',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})? Data ini tidak dapat dihapus jika masih digunakan oleh pemetaan jenjang jabatan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await masterJenjangService.deleteMasterJenjang(item.id);
      if (res.success) {
        toast.success('Master jenjang berhasil dihapus.', 'Terhapus');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMsg = err.response?.data?.message || 'Gagal menghapus master jenjang.';
      toast.error(errorMsg, 'Gagal');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <Card className="p-4 border-slate-200/80 shadow-xs bg-white rounded-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kode atau nama jenjang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs bg-slate-50/60 border-slate-200 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Status */}
            <div className="w-[140px]">
              <Select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 text-xs bg-slate-50/60 border-slate-200"
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </Select>
            </div>

            {(search || filterStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                  setCurrentPage(1);
                }}
                className="h-9 text-xs text-slate-500 hover:text-slate-700"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(importExportService.getExportUrl('master-jenjang'), '_blank')}
              className="h-9 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-9 text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Muat Ulang
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="p-0 border-slate-200/80 shadow-xs overflow-hidden bg-white rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5 w-14 text-center">No</th>
                <th className="px-5 py-3.5">
                  <SortableHeader
                    label="Kode Jenjang"
                    field="code"
                    currentField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-3.5">
                  <SortableHeader
                    label="Nama Jenjang"
                    field="name"
                    currentField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-center">
                  <SortableHeader
                    label="Level"
                    field="level"
                    align="center"
                    currentField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-3.5">Deskripsi</th>
                <th className="px-5 py-3.5 text-center">Digunakan</th>
                <th className="px-5 py-3.5 text-center">
                  <SortableHeader
                    label="Status"
                    field="status"
                    align="center"
                    currentField={sortField}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-5 py-4 text-center"><Skeleton className="h-4 w-14 mx-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-5 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                      <p className="font-medium text-slate-500">Tidak ada data Master Jenjang</p>
                      <p className="text-xs text-slate-400">
                        {search || filterStatus
                          ? 'Coba sesuaikan filter pencarian Anda.'
                          : 'Klik tombol "Tambah Master Jenjang" untuk membuat data baru.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => {
                  const itemIndex = (currentPage - 1) * perPage + idx + 1;
                  const usageCount = item.salary_grade_jenjangs_count ?? 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* 1. No */}
                      <td className="px-5 py-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {itemIndex}
                      </td>

                      {/* 2. Kode Jenjang */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                          <Award className="h-3 w-3 text-indigo-500" />
                          {item.code}
                        </span>
                      </td>

                      {/* 3. Nama Jenjang */}
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <BookmarkCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{item.name}</span>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-5 py-3.5 text-center">
                        {item.level !== null && item.level !== undefined ? (
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Level {item.level}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* 4. Deskripsi */}
                      <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">
                        {item.description ? (
                          <span>{item.description}</span>
                        ) : (
                          <span className="text-slate-300 italic text-[11px]">Tanpa keterangan</span>
                        )}
                      </td>

                      {/* 5. Digunakan */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${usageCount > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-500'
                          }`}>
                          {usageCount} Pemetaan
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}
                          className="text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold"
                        >
                          {item.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                      </td>

                      {/* 7. Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Master Jenjang"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Master Jenjang"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="master jenjang"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Master Jenjang' : 'Edit Master Jenjang'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Kode Jenjang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Jenjang <span className="text-slate-400 font-normal">(Opsional - Otomatis jika kosong)</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Contoh: JNJ-001, SGL, JSV"
              className="text-xs font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Identifikasi unik katalog jenjang. Jika dibiarkan kosong, sistem akan menghasilkan kode otomatis berurutan.
            </p>
          </div>

          {/* 2. Nama Jenjang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Jenjang <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Manager, Asisten Manager, Supervisor"
              required
              className="text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Nama sebutan jenjang standar yang akan dipilih pada saat pemetaan Golongan & Level Jabatan.
            </p>
          </div>

          {/* 3. Level Jenjang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Level Jenjang <span className="text-slate-400 font-normal">(Contoh: 1 untuk Manager, 2 untuk Asisten Manager, dst)</span>
            </label>
            <Input
              type="number"
              min={1}
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              placeholder="Contoh: 1, 2, 3..."
              className="text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tingkatan hierarki jenjang organisasi. Semakin kecil angkanya, semakin tinggi level jabatannya.
            </p>
          </div>

          {/* 4. Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deskripsi / Keterangan
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Keterangan singkat peran atau kriteria jenjang..."
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 4. Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Jenjang
            </label>
            <div className="flex items-center gap-4 pt-0.5">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="font-medium text-emerald-700">Aktif</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formData.status === 'INACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span className="font-medium text-slate-500">Non-Aktif</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Master Jenjang' : 'Perbarui Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
