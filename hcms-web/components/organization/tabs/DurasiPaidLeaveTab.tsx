'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Palmtree,
  FileCheck,
  Download,
  Clock
} from 'lucide-react';
import { PaidLeavePolicyItem } from '@/types';
import { paidLeavePolicyService } from '@/services/masterDataService';
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

interface DurasiPaidLeaveTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const DurasiPaidLeaveTab: React.FC<DurasiPaidLeaveTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<PaidLeavePolicyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    category: 'ANNUAL' as 'ANNUAL' | 'MATERNITY' | 'FAMILY_EVENT' | 'RELIGIOUS' | 'MEDICAL' | 'OTHER',
    duration_days: 12,
    duration_unit: 'HARI_KERJA' as 'HARI_KERJA' | 'HARI_KALENDER' | 'BULAN',
    requires_document: false,
    required_document_name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await paidLeavePolicyService.getPaidLeavePolicies({ per_page: 500 });
      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load paid leave policies:', err);
      toast.error('Gagal memuat data durasi paid leave.', 'Kesalahan Data');
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
      category: 'ANNUAL',
      duration_days: 1,
      duration_unit: 'HARI_KERJA',
      requires_document: false,
      required_document_name: '',
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

  const handleOpenEdit = (item: PaidLeavePolicyItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      duration_days: item.duration_days,
      duration_unit: item.duration_unit,
      requires_document: Boolean(item.requires_document),
      required_document_name: item.required_document_name || '',
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || formData.duration_days <= 0) {
      toast.warning('Kode, nama, dan durasi (>0) harus diisi dengan benar.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await paidLeavePolicyService.createPaidLeavePolicy(formData);
        if (res.success) {
          toast.success('Kebijakan Paid Leave berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await paidLeavePolicyService.updatePaidLeavePolicy(formData.id, formData);
        if (res.success) {
          toast.success('Kebijakan Paid Leave berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Error saving paid leave policy:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan kebijakan paid leave.';
      toast.error(msg, 'Terjadi Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: PaidLeavePolicyItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Kebijakan Cuti Berbayar',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await paidLeavePolicyService.deletePaidLeavePolicy(item.id);
      if (res.success) {
        toast.success('Kebijakan cuti berbayar berhasil dihapus.');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Error deleting paid leave policy:', err);
      const msg = err?.response?.data?.message || 'Gagal menghapus kebijakan cuti berbayar.';
      toast.error(msg, 'Gagal');
    }
  };

  // Filter items
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.required_document_name && item.required_document_name.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = filterCategory === 'ALL' || item.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [items, search, filterCategory]);

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
  } = useClientTable(filteredData, { defaultSortField: 'code', defaultSortOrder: 'asc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.info('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['Kode', 'Nama Kebijakan', 'Kategori', 'Durasi', 'Satuan', 'Wajib Dokumen', 'Nama Dokumen', 'Status', 'Keterangan'];
    const rows = filteredData.map((item) => [
      `"${item.code}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      item.duration_days,
      `"${item.duration_unit}"`,
      item.requires_document ? 'Ya' : 'Tidak',
      `"${(item.required_document_name || '').replace(/"/g, '""')}"`,
      item.status,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `durasi_paid_leave_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh.');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'ANNUAL':
        return <Badge variant="primary" className="text-xs">Tahunan (Annual)</Badge>;
      case 'MATERNITY':
        return <Badge variant="warning" className="text-xs">Melahirkan / Hamil</Badge>;
      case 'FAMILY_EVENT':
        return <Badge variant="info" className="text-xs">Keluarga (Pernikahan/Duka)</Badge>;
      case 'RELIGIOUS':
        return <Badge variant="primary" className="text-xs">Ibadah Keagamaan</Badge>;
      case 'MEDICAL':
        return <Badge variant="danger" className="text-xs">Sakit / Medis</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Lainnya</Badge>;
    }
  };

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'HARI_KERJA':
        return 'Hari Kerja';
      case 'HARI_KALENDER':
        return 'Hari Kalender';
      case 'BULAN':
        return 'Bulan';
      default:
        return unit;
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
              placeholder="Cari kode, nama cuti, lampiran syarat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 text-sm w-full"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Kategori' },
                { value: 'ANNUAL', label: 'Tahunan (Annual)' },
                { value: 'FAMILY_EVENT', label: 'Keperluan Keluarga' },
                { value: 'MATERNITY', label: 'Melahirkan' },
                { value: 'RELIGIOUS', label: 'Ibadah Agama' },
                { value: 'MEDICAL', label: 'Kesehatan / Medis' },
                { value: 'OTHER', label: 'Lain-lain' },
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
                    Nama Kebijakan Cuti
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="category"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Kategori
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4 text-center">
                  <SortableHeader
                    field="duration_days"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Durasi
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">Dokumen Pendukung</th>
                <th className="py-3.5 px-4">Keterangan / UU</th>
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
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <Palmtree className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">Tidak ada kebijakan paid leave ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: PaidLeavePolicyItem, index: number) => {
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
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getCategoryBadge(item.category)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" />
                          {item.duration_days} {formatUnit(item.duration_unit)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.requires_document ? (
                          <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 max-w-xs">
                            <FileCheck className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <span className="truncate" title={item.required_document_name || 'Wajib melampirkan bukti'}>
                              {item.required_document_name || 'Wajib Dokumen'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Tidak Wajib</span>
                        )}
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
                            title="Edit Kebijakan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                            title="Hapus Kebijakan"
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
        title={modalMode === 'create' ? 'Tambah Kebijakan Paid Leave' : 'Edit Kebijakan Paid Leave'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode Kebijakan <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: CUTI_NIKAH"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kategori Cuti <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                options={[
                  { value: 'ANNUAL', label: 'Tahunan (Annual)' },
                  { value: 'FAMILY_EVENT', label: 'Keperluan Keluarga' },
                  { value: 'MATERNITY', label: 'Melahirkan / Keguguran' },
                  { value: 'RELIGIOUS', label: 'Ibadah Keagamaan' },
                  { value: 'MEDICAL', label: 'Kesehatan / Medis' },
                  { value: 'OTHER', label: 'Lain-lain' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Kebijakan Cuti <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Cuti Pernikahan Karyawan"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Durasi Cuti <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Satuan Durasi <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.duration_unit}
                onChange={(e) => setFormData({ ...formData, duration_unit: e.target.value as any })}
                options={[
                  { value: 'HARI_KERJA', label: 'Hari Kerja' },
                  { value: 'HARI_KALENDER', label: 'Hari Kalender' },
                  { value: 'BULAN', label: 'Bulan' },
                ]}
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_document}
                onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Wajib Melampirkan Dokumen Pendukung (Bukti)
              </span>
            </label>

            {formData.requires_document && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama / Jenis Dokumen Persyaratan
                </label>
                <Input
                  placeholder="Contoh: Buku Nikah / Surat Undangan Pernikahan"
                  value={formData.required_document_name}
                  onChange={(e) => setFormData({ ...formData, required_document_name: e.target.value })}
                />
              </div>
            )}
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
                Dasar Hukum / Kebijakan
              </label>
              <Input
                placeholder="Contoh: UU Ketenagakerjaan No 13/2003"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Kebijakan' : 'Perbarui Kebijakan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
