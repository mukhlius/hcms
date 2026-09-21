'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  LogOut,
  Clock,
  Download,
  FileCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ResignationTypeItem } from '@/types';
import { resignationTypeService } from '@/services/masterDataService';
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

interface JenisResignTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const JenisResignTab: React.FC<JenisResignTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<ResignationTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterNotice, setFilterNotice] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    notice_period_days: 30,
    requires_clearance: true,
    entitled_to_uang_pisah: true,
    entitled_to_sisa_cuti: true,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await resignationTypeService.getResignationTypes({ per_page: 500 });
      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load resignation types:', err);
      toast.error('Gagal memuat data jenis resign.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      code: '',
      name: '',
      notice_period_days: 30,
      requires_clearance: true,
      entitled_to_uang_pisah: true,
      entitled_to_sisa_cuti: true,
      description: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: ResignationTypeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      notice_period_days: item.notice_period_days,
      requires_clearance: Boolean(item.requires_clearance),
      entitled_to_uang_pisah: Boolean(item.entitled_to_uang_pisah),
      entitled_to_sisa_cuti: Boolean(item.entitled_to_sisa_cuti),
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.notice_period_days < 0) {
      toast.warning('Kode, nama, dan notice period (>=0) harus diisi dengan benar.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await resignationTypeService.createResignationType(formData);
        if (res.success) {
          toast.success('Jenis resign berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await resignationTypeService.updateResignationType(formData.id, formData);
        if (res.success) {
          toast.success('Jenis resign berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Error saving resignation type:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan jenis resign.';
      toast.error(msg, 'Terjadi Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ResignationTypeItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Jenis Resign',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await resignationTypeService.deleteResignationType(item.id);
      if (res.success) {
        toast.success('Jenis resign berhasil dihapus.');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Error deleting resignation type:', err);
      const msg = err?.response?.data?.message || 'Gagal menghapus jenis resign.';
      toast.error(msg, 'Gagal');
    }
  };

  // Filter items
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      let matchNotice = true;
      if (filterNotice === '30_DAYS') {
        matchNotice = item.notice_period_days >= 30;
      } else if (filterNotice === 'SHORT') {
        matchNotice = item.notice_period_days > 0 && item.notice_period_days < 30;
      } else if (filterNotice === 'IMMEDIATE') {
        matchNotice = item.notice_period_days === 0;
      }

      return matchSearch && matchNotice;
    });
  }, [items, search, filterNotice]);

  const {
    paginatedData,
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems,
  } = useClientTable(filteredData, { defaultSortField: 'notice_period_days', defaultSortOrder: 'desc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.info('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['Kode', 'Nama Jenis Resign', 'Notice Period (Hari)', 'Wajib Exit Clearance', 'Uang Pisah', 'Kompensasi Cuti', 'Status', 'Keterangan'];
    const rows = filteredData.map((item) => [
      `"${item.code}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.notice_period_days,
      item.requires_clearance ? 'Ya' : 'Tidak',
      item.entitled_to_uang_pisah ? 'Ya' : 'Tidak',
      item.entitled_to_sisa_cuti ? 'Ya' : 'Tidak',
      item.status,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jenis_resign_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh.');
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari kode, jenis resign, keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 text-sm w-full"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={filterNotice}
              onChange={(e) => setFilterNotice(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Notice Period' },
                { value: '30_DAYS', label: 'One Month Notice (>= 30 Hari)' },
                { value: 'SHORT', label: 'Short Notice (< 30 Hari)' },
                { value: 'IMMEDIATE', label: 'Tanpa Notice (0 Hari)' },
              ]}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 border-gray-200"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 border-gray-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="code"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Kode
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Nama Jenis Resign
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <SortableHeader
                    field="notice_period_days"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Notice Period
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4 text-center">Exit Clearance</th>
                <th className="py-3.5 px-4 text-center">Uang Pisah</th>
                <th className="py-3.5 px-4 text-center">Sisa Cuti Dibayar</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <LogOut className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">Tidak ada data jenis resign ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: ResignationTypeItem, index: number) => {
                  const itemNumber = (currentPage - 1) * perPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                        {itemNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-gray-800 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Clock className="h-3.5 w-3.5 text-purple-600" />
                          {item.notice_period_days} Hari
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.requires_clearance ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <FileCheck className="h-3 w-3" />
                            Wajib
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Tidak Wajib</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.entitled_to_uang_pisah ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Berhak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            <XCircle className="h-3 w-3 text-gray-400" />
                            Tidak
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.entitled_to_sisa_cuti ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Dibayar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            <XCircle className="h-3 w-3 text-gray-400" />
                            Hangus
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                            title="Edit Jenis Resign"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                            title="Hapus Jenis Resign"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {/* Pagination */}
        {filteredData.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Jenis Pengunduran Diri' : 'Edit Jenis Pengunduran Diri'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode Jenis Resign <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: RESIGN_1_MONTH"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notice Period (Hari) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                required
                value={formData.notice_period_days}
                onChange={(e) => setFormData({ ...formData, notice_period_days: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama / Alasan Resign <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Resign Sukarela (One Month Notice)"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Policy Toggles */}
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_clearance}
                onChange={(e) => setFormData({ ...formData, requires_clearance: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Wajib Melakukan Exit Clearance & Serah Terima Inventaris
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entitled_to_uang_pisah}
                onChange={(e) => setFormData({ ...formData, entitled_to_uang_pisah: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Berhak Menerima Uang Pisah (Sesuai Masa Kerja & PKB)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entitled_to_sisa_cuti}
                onChange={(e) => setFormData({ ...formData, entitled_to_sisa_cuti: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Berhak Penggantian Sisa Cuti Tahunan yang Belum Gugur
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'INACTIVE', label: 'Nonaktif' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Keterangan Tambahan
              </label>
              <Input
                placeholder="Penjelasan ketentuan..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Jenis Resign' : 'Perbarui Jenis Resign'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
