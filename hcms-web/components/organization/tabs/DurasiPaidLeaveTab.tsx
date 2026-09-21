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
  Clock,
  Filter,
  ChevronDown,
  RotateCcw
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
      {/* Action Toolbar / Filter Component */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-slate-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari kode, nama cuti, lampiran syarat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="relative w-56">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="ANNUAL">Tahunan (Annual)</option>
              <option value="FAMILY_EVENT">Keperluan Keluarga</option>
              <option value="MATERNITY">Melahirkan</option>
              <option value="RELIGIOUS">Ibadah Agama</option>
              <option value="MEDICAL">Kesehatan / Medis</option>
              <option value="OTHER">Lain-lain</option>
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {(search || filterCategory !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterCategory('ALL');
              }}
              className="h-9 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
              title="Reset Filter"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Unduh CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Segarkan
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Kebijakan Cuti" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Kategori" field="category" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Durasi" field="duration_days" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} align="center" />
                </th>
                <th className="px-4 py-3.5">Dokumen Pendukung</th>
                <th className="px-4 py-3.5">Keterangan / UU</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
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
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Palmtree className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada kebijakan paid leave ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: PaidLeavePolicyItem, index: number) => {
                  const itemNumber = (currentPage - 1) * perPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                        {itemNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-800 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
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
                          <span className="text-xs text-slate-400">Tidak Wajib</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
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
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200"
                            title="Edit Kebijakan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
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

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Kebijakan Paid Leave' : 'Edit Kebijakan Paid Leave'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Kebijakan <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: LV-ANNUAL"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Izin / Cuti Berbayar <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: Cuti Tahunan Reguler"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Cuti <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                options={[
                  { value: 'ANNUAL', label: 'Cuti Tahunan (Annual Leave)' },
                  { value: 'FAMILY_EVENT', label: 'Keperluan Keluarga (Pernikahan, Kematian, Khitanan)' },
                  { value: 'MATERNITY', label: 'Melahirkan / Keguguran (Maternity / Miscarriage)' },
                  { value: 'RELIGIOUS', label: 'Ibadah Keagamaan (Haji / Umroh)' },
                  { value: 'MEDICAL', label: 'Kesehatan / Rawat Medis' },
                  { value: 'OTHER', label: 'Alasan Khusus Lainnya' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Durasi Cuti <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan Durasi <span className="text-rose-500">*</span>
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

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requires_document}
                onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-xs text-slate-800 font-semibold">
                Wajib Melampirkan Dokumen Pendukung (Bukti)
              </span>
            </label>

            {formData.requires_document && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama / Jenis Dokumen Persyaratan
                </label>
                <Input
                  placeholder="Contoh: Buku Nikah / Surat Undangan Pernikahan"
                  value={formData.required_document_name}
                  onChange={(e) => setFormData({ ...formData, required_document_name: e.target.value })}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dasar Hukum / Kebijakan
              </label>
              <Input
                placeholder="Contoh: UU Ketenagakerjaan No 13/2003"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={submitting}
            >
              {modalMode === 'create' ? 'Simpan Kebijakan' : 'Perbarui Kebijakan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
