'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  Download,
  ShieldAlert,
  FileWarning
} from 'lucide-react';
import { WarningLetterDurationItem } from '@/types';
import { warningLetterDurationService } from '@/services/masterDataService';
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

interface DurasiSpTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const DurasiSpTab: React.FC<DurasiSpTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<WarningLetterDurationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    level: 'SP_1' as 'TEGURAN' | 'SP_1' | 'SP_2' | 'SP_3',
    name: '',
    duration_months: 6,
    validity_unit: 'BULAN',
    consequence_description: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await warningLetterDurationService.getWarningLetterDurations({ per_page: 500 });
      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load warning letter durations:', err);
      toast.error('Gagal memuat data durasi SP.', 'Kesalahan Data');
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
      level: 'SP_1',
      name: '',
      duration_months: 6,
      validity_unit: 'BULAN',
      consequence_description: '',
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

  const handleOpenEdit = (item: WarningLetterDurationItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      level: item.level,
      name: item.name,
      duration_months: item.duration_months,
      validity_unit: item.validity_unit || 'BULAN',
      consequence_description: item.consequence_description || '',
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.duration_months <= 0) {
      toast.warning('Kode, nama, dan masa berlaku (>0) harus diisi dengan benar.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await warningLetterDurationService.createWarningLetterDuration(formData);
        if (res.success) {
          toast.success('Tingkat & durasi SP berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await warningLetterDurationService.updateWarningLetterDuration(formData.id, formData);
        if (res.success) {
          toast.success('Tingkat & durasi SP berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Error saving warning letter duration:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan tingkat SP.';
      toast.error(msg, 'Terjadi Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: WarningLetterDurationItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Tingkat SP',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await warningLetterDurationService.deleteWarningLetterDuration(item.id);
      if (res.success) {
        toast.success('Tingkat SP berhasil dihapus.');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Error deleting warning letter duration:', err);
      const msg = err?.response?.data?.message || 'Gagal menghapus tingkat SP.';
      toast.error(msg, 'Gagal');
    }
  };

  // Filter items
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.consequence_description && item.consequence_description.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchLevel = filterLevel === 'ALL' || item.level === filterLevel;

      return matchSearch && matchLevel;
    });
  }, [items, search, filterLevel]);

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
  } = useClientTable(filteredData, { defaultSortField: 'level', defaultSortOrder: 'asc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.info('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['Kode', 'Tingkat', 'Nama SP', 'Masa Berlaku (Bulan)', 'Konsekuensi', 'Dasar Hukum', 'Status'];
    const rows = filteredData.map((item) => [
      `"${item.code}"`,
      `"${item.level}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.duration_months,
      `"${(item.consequence_description || '').replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `durasi_sp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh.');
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'TEGURAN':
        return <Badge variant="info" className="text-xs">Surat Teguran</Badge>;
      case 'SP_1':
        return <Badge variant="warning" className="text-xs">SP 1 (Pertama)</Badge>;
      case 'SP_2':
        return <Badge variant="danger" className="text-xs">SP 2 (Kedua)</Badge>;
      case 'SP_3':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
            <ShieldAlert className="h-3 w-3" />
            SP 3 (Terakhir)
          </span>
        );
      default:
        return <Badge variant="secondary" className="text-xs">{level}</Badge>;
    }
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
              placeholder="Cari kode, nama SP, sanksi/konsekuensi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 text-sm w-full"
            />
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Tingkatan SP' },
                { value: 'TEGURAN', label: 'Teguran Lisan/Tertulis' },
                { value: 'SP_1', label: 'SP 1 (Pertama)' },
                { value: 'SP_2', label: 'SP 2 (Kedua)' },
                { value: 'SP_3', label: 'SP 3 (Ketiga / Terakhir)' },
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
                    field="level"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Tingkat SP
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Nama SP / Sanksi
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <SortableHeader
                    field="duration_months"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Masa Berlaku
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">Dampak & Konsekuensi</th>
                <th className="py-3.5 px-4">Dasar Ketentuan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <FileWarning className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">Tidak ada tingkatan SP ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: WarningLetterDurationItem, index: number) => {
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getLevelBadge(item.level)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          {item.duration_months} Bulan
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-700 max-w-sm">
                        <p className="line-clamp-2" title={item.consequence_description || '-'}>
                          {item.consequence_description || '-'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs truncate">
                        {item.description || '-'}
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
                            title="Edit Tingkat SP"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                            title="Hapus Tingkat SP"
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
        title={modalMode === 'create' ? 'Tambah Tingkat / Durasi SP' : 'Edit Tingkat / Durasi SP'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode SP <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: SP_1"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tingkat Surat <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                options={[
                  { value: 'TEGURAN', label: 'Teguran Lisan/Tertulis' },
                  { value: 'SP_1', label: 'SP 1 (Pertama)' },
                  { value: 'SP_2', label: 'SP 2 (Kedua)' },
                  { value: 'SP_3', label: 'SP 3 (Ketiga / Terakhir)' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Dokumen Peringatan <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Surat Peringatan Pertama (SP 1)"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Masa Berlaku (Bulan) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.duration_months}
                onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) || 6 })}
              />
              <p className="text-[11px] text-gray-400 mt-1">Standar UU Ketenagakerjaan: 6 Bulan</p>
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Dampak & Konsekuensi Pelanggaran
            </label>
            <textarea
              rows={3}
              className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 placeholder-gray-400"
              placeholder="Contoh: Penundaan kenaikan grade, penundaan promosi jabatan, evaluasi KPI..."
              value={formData.consequence_description}
              onChange={(e) => setFormData({ ...formData, consequence_description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Keterangan / Dasar Regulasi
            </label>
            <Input
              placeholder="Contoh: PP 35/2021 & Peraturan Perusahaan Bab Disiplin"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Tingkat SP' : 'Perbarui Tingkat SP'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
