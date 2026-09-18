'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  FileCheck2,
  CheckCircle2,
  Power,
  Info,
  Briefcase,
  Download
} from 'lucide-react';
import { EmploymentTypeItem } from '@/types';
import { employmentTypeService, importExportService } from '@/services/masterDataService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';
import { toast, confirmDialog } from '@/stores/alertStore';

interface HubunganKerjaTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const HubunganKerjaTab: React.FC<HubunganKerjaTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<EmploymentTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'PERMANENT' | 'CONTRACT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    is_permanent: false,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employmentTypeService.getEmploymentTypes();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load Employment Types:', err);
      toast.error('Gagal memuat data Hubungan Kerja.', 'Kesalahan Data');
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
      is_permanent: false,
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

  const handleOpenEdit = (item: EmploymentTypeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      is_permanent: Boolean(item.is_permanent),
      description: item.description || '',
      status: (item.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.warning('Kode hubungan kerja harus diisi.', 'Form Tidak Lengkap');
      return;
    }
    if (!formData.name.trim()) {
      toast.warning('Nama hubungan kerja harus diisi.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        is_permanent: formData.is_permanent,
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await employmentTypeService.createEmploymentType(payload);
        if (res.success) {
          toast.success(`Hubungan kerja "${payload.name}" berhasil dibuat.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        } else {
          toast.error(res.message || 'Gagal menambahkan hubungan kerja.', 'Gagal');
        }
      } else {
        const res = await employmentTypeService.updateEmploymentType(formData.id, payload);
        if (res.success) {
          toast.success(`Hubungan kerja "${payload.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        } else {
          toast.error(res.message || 'Gagal mengubah hubungan kerja.', 'Gagal');
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan sistem.', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: EmploymentTypeItem) => {
    const isActivating = item.status !== 'ACTIVE';
    const actionText = isActivating ? 'mengaktifkan' : 'menonaktifkan';

    const confirmed = await confirmDialog({
      title: `${isActivating ? 'Aktifkan' : 'Nonaktifkan'} Hubungan Kerja`,
      message: `Apakah Anda yakin ingin ${actionText} "${item.name}" (${item.code})?`,
      confirmText: isActivating ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
      cancelText: 'Batal',
      variant: isActivating ? 'primary' : 'warning',
    });

    if (!confirmed) return;

    try {
      const res = isActivating
        ? await employmentTypeService.activateEmploymentType(item.id)
        : await employmentTypeService.deactivateEmploymentType(item.id);

      if (res.success) {
        toast.success(`Hubungan kerja berhasil di${isActivating ? 'aktifkan' : 'nonaktifkan'}.`, 'Status Diperbarui');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal ${actionText} hubungan kerja.`, 'Gagal');
    }
  };

  const handleDelete = async (item: EmploymentTypeItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Hubungan Kerja',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})? Personel dengan hubungan kerja ini dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Hubungan Kerja',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await employmentTypeService.deleteEmploymentType(item.id);
      if (res.success) {
        toast.success(`Hubungan kerja "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus hubungan kerja.', 'Gagal Dihapus');
    }
  };

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchType =
        filterType === 'ALL' ||
        (filterType === 'PERMANENT' && item.is_permanent) ||
        (filterType === 'CONTRACT' && !item.is_permanent);

      const matchStatus =
        filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchType && matchStatus;
    });
  }, [items, search, filterType, filterStatus]);

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
    paginatedData,
  } = useClientTable<EmploymentTypeItem>(filteredItems, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari kode atau nama hubungan kerja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Filter Sifat Hubungan */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Sifat Kerja</option>
              <option value="PERMANENT">Tetap (PKWTT)</option>
              <option value="CONTRACT">Waktu Tertentu / Kontrak</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => window.open(importExportService.getExportUrl('employment-types'), '_blank')}
            >
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
              isLoading={loading}
            >
              Segarkan
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenCreate}
            >
              Tambah Hubungan Kerja
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Main Data Table */}
      <Card className="overflow-hidden border-slate-200/80 shadow-xs dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="py-3.5 pl-4 pr-3">
                  <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-3 py-3.5">
                  <SortableHeader label="Hubungan Kerja / Jenis Ketenagakerjaan" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-3 py-3.5">
                  <SortableHeader label="Sifat Perjanjian" field="is_permanent" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-3 py-3.5 font-semibold">Keterangan</th>
                <th className="px-3 py-3.5 text-center">
                  <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-3 py-3.5 pr-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 pl-4 pr-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-3 py-3.5 text-center"><Skeleton className="mx-auto h-5 w-16" /></td>
                    <td className="px-3 py-3.5 pr-4 text-right"><Skeleton className="ml-auto h-7 w-20" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Briefcase className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Tidak ada data hubungan kerja ditemukan
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {search ? 'Coba ubah kata kunci pencarian Anda' : 'Klik tombol Tambah Hubungan Kerja untuk membuat data baru'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    {/* Kode */}
                    <td className="py-3.5 pl-4 pr-3 font-semibold text-slate-900 dark:text-slate-100">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {item.code}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="px-3 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Sifat Perjanjian */}
                    <td className="px-3 py-3.5">
                      {item.is_permanent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Tetap (PKWTT)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                          <Info className="h-3 w-3" />
                          Waktu Tertentu / Kontrak
                        </span>
                      )}
                    </td>

                    {/* Deskripsi */}
                    <td className="px-3 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.description || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 text-center">
                      {item.status === 'ACTIVE' ? (
                        <Badge variant="success">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Nonaktif
                        </Badge>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                          title="Ubah Hubungan Kerja"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            item.status === 'ACTIVE'
                              ? 'text-amber-500 hover:text-amber-700 dark:text-amber-400'
                              : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                          }`}
                          title={item.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
                          onClick={() => handleToggleStatus(item)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 dark:text-rose-400"
                          title="Hapus Hubungan Kerja"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="Hubungan Kerja"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* 3. Modal Form (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Hubungan Kerja' : 'Ubah Hubungan Kerja'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Kode Hubungan Kerja <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: PKWT, PKWTT, PROBATION, MAGANG"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              className="font-mono text-sm"
              disabled={modalMode === 'edit'}
            />
            <p className="mt-1 text-xs text-slate-400">
              {modalMode === 'create'
                ? 'Gunakan singkatan baku ketenagakerjaan (contoh: PKWT, PKWTT, INTERNSHIP).'
                : 'Kode bersifat unik dan tidak dapat diubah.'}
            </p>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nama Hubungan Kerja <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Perjanjian Kerja Waktu Tertentu (Kontrak)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="text-sm"
            />
          </div>

          {/* Sifat Perjanjian (Tetap vs Tertentu) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Sifat / Kategori Perjanjian
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                  formData.is_permanent
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="is_permanent"
                    checked={formData.is_permanent}
                    onChange={() => setFormData({ ...formData, is_permanent: true })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold">Tetap (PKWTT)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Tidak ada tanggal berakhir</p>
                  </div>
                </div>
                <CheckCircle2 className={`h-4 w-4 ${formData.is_permanent ? 'text-emerald-600' : 'text-slate-300'}`} />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                  !formData.is_permanent
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="is_permanent"
                    checked={!formData.is_permanent}
                    onChange={() => setFormData({ ...formData, is_permanent: false })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold">Waktu Tertentu / Kontrak</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">PKWT, Magang, Alih Daya</p>
                  </div>
                </div>
                <Info className={`h-4 w-4 ${!formData.is_permanent ? 'text-indigo-600' : 'text-slate-300'}`} />
              </label>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Keterangan / Deskripsi
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Catatan tambahan mengenai ketentuan hubungan kerja ini..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status Data
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Aktif</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formData.status === 'INACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-500">Nonaktif</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={submitting}
              leftIcon={<FileCheck2 className="h-4 w-4" />}
            >
              {modalMode === 'create' ? 'Simpan Hubungan Kerja' : 'Perbarui Hubungan Kerja'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
