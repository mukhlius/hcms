'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  UserX,
  Power,
  ShieldCheck,
  CreditCard,
  Info
} from 'lucide-react';
import { BenefitPlafondItem, GradeItem } from '@/types';
import { benefitPlafondService, jobGradeService } from '@/services/masterDataService';
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

interface BenefitPlafondTabProps {
  benefitType: 'PENGOBATAN' | 'KACAMATA' | 'PERSALINAN';
  title: string;
  icon: React.ReactNode;
  defaultPeriod?: 'TAHUNAN' | '2_TAHUNAN' | 'PER_KASUS' | 'SEUMUR_HIDUP';
  onRefreshAll?: () => void;
  createTrigger?: number;
}

const formatRupiah = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null) return 'Rp 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const BenefitPlafondTab: React.FC<BenefitPlafondTabProps> = ({
  benefitType,
  title,
  icon,
  defaultPeriod = 'TAHUNAN',
  onRefreshAll,
  createTrigger,
}) => {
  const [items, setItems] = useState<BenefitPlafondItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Menikah' | 'Tidak Menikah'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    grade_id: 0,
    marital_category: 'Menikah' as 'Menikah' | 'Tidak Menikah' | 'SEMUA',
    amount: '',
    period_type: defaultPeriod,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plafondRes, gradeRes] = await Promise.all([
        benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType }),
        jobGradeService.getGrades(),
      ]);

      if (plafondRes.success && plafondRes.data) {
        setItems(plafondRes.data);
      }
      if (gradeRes.success && gradeRes.data) {
        setGrades(gradeRes.data);
      }
    } catch (err) {
      console.error(`Failed to load ${title} data:`, err);
      toast.error(`Gagal memuat data ${title}.`, 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [benefitType, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      grade_id: grades.length > 0 ? grades[0].id : 0,
      marital_category: 'Menikah',
      amount: '',
      period_type: defaultPeriod,
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

  const handleOpenEdit = (item: BenefitPlafondItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      grade_id: item.grade_id,
      marital_category: item.marital_category,
      amount: String(item.amount || ''),
      period_type: (item.period_type as any) || defaultPeriod,
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.grade_id || formData.grade_id === 0) {
      toast.warning('Pilih Grade / Level terlebih dahulu.', 'Form Belum Lengkap');
      return;
    }
    if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
      toast.warning('Nominal plafon harus diisi dengan angka valid.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        benefit_type: benefitType,
        grade_id: Number(formData.grade_id),
        marital_category: formData.marital_category,
        amount: parseFloat(formData.amount),
        period_type: formData.period_type,
        description: formData.description.trim() || undefined,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await benefitPlafondService.createBenefitPlafond(payload);
        if (res.success) {
          toast.success(`${title} berhasil ditambahkan.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        } else {
          toast.error(res.message || `Gagal menambahkan ${title}.`, 'Gagal');
        }
      } else {
        const res = await benefitPlafondService.updateBenefitPlafond(formData.id, payload);
        if (res.success) {
          toast.success(`${title} berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        } else {
          toast.error(res.message || `Gagal memperbarui ${title}.`, 'Gagal');
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Terjadi kesalahan sistem saat menyimpan.', 'Gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: BenefitPlafondItem) => {
    const isActivating = item.status !== 'ACTIVE';
    const actionText = isActivating ? 'mengaktifkan' : 'menonaktifkan';

    const confirmed = await confirmDialog({
      title: `${isActivating ? 'Aktifkan' : 'Nonaktifkan'} ${title}`,
      message: `Apakah Anda yakin ingin ${actionText} plafon untuk Grade "${item.grade?.name || item.grade_id}" (${item.marital_category})?`,
      confirmText: isActivating ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan',
      cancelText: 'Batal',
      variant: isActivating ? 'primary' : 'warning',
    });

    if (!confirmed) return;

    try {
      const res = isActivating
        ? await benefitPlafondService.activateBenefitPlafond(item.id)
        : await benefitPlafondService.deactivateBenefitPlafond(item.id);

      if (res.success) {
        toast.success(`${title} berhasil di${isActivating ? 'aktifkan' : 'nonaktifkan'}.`, 'Status Diperbarui');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal ${actionText} ${title}.`, 'Gagal');
    }
  };

  const handleDelete = async (item: BenefitPlafondItem) => {
    const confirmed = await confirmDialog({
      title: `Hapus ${title}`,
      message: `Apakah Anda yakin ingin menghapus data plafon untuk Grade "${item.grade?.name || item.grade_id}" (${item.marital_category}) senilai ${formatRupiah(item.amount)}?`,
      confirmText: 'Ya, Hapus Plafon',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await benefitPlafondService.deleteBenefitPlafond(item.id);
      if (res.success) {
        toast.success(`${title} berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal menghapus ${title}.`, 'Gagal Dihapus');
    }
  };

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const gradeName = (item.grade?.name || '').toLowerCase();
      const gradeCode = (item.grade?.code || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const marital = (item.marital_category || '').toLowerCase();

      const matchSearch =
        !search ||
        gradeName.includes(q) ||
        gradeCode.includes(q) ||
        desc.includes(q) ||
        marital.includes(q);

      const matchGrade = filterGrade === 'ALL' || String(item.grade_id) === filterGrade;
      const matchCategory = filterCategory === 'ALL' || item.marital_category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchGrade && matchCategory && matchStatus;
    });
  }, [items, search, filterGrade, filterCategory, filterStatus]);

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
  } = useClientTable<BenefitPlafondItem>(filteredItems, {
    defaultSortField: 'amount',
    defaultPerPage: 10,
  });

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'TAHUNAN': return 'Per Tahun';
      case '2_TAHUNAN': return 'Per 2 Tahun';
      case 'PER_KASUS': return 'Per Kasus / Kejadian';
      case 'SEUMUR_HIDUP': return 'Seumur Hidup';
      default: return period;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={`Cari ${title.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* Filter Grade / Level */}
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Grade / Level</option>
              {grades.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.code} - {g.name} (Lvl {g.level})
                </option>
              ))}
            </select>

            {/* Filter Kategori Pernikahan */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Kategori Marital</option>
              <option value="Menikah">Menikah (Keluarga)</option>
              <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
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
              Tambah {title}
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
                {/* 1. Grade / Level */}
                <th className="py-3.5 pl-4 pr-3">
                  <SortableHeader label="Grade / Level" field="grade_id" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>

                {/* 2. Kategori Pernikahan */}
                <th className="px-3 py-3.5">
                  <SortableHeader label="Kategori Pernikahan" field="marital_category" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>

                {/* 3. Nominal Plafon */}
                <th className="px-3 py-3.5 text-right">
                  <SortableHeader label="Nominal Plafon" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>

                {/* 4. Periode Manfaat */}
                <th className="px-3 py-3.5 text-center">
                  <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>

                {/* 5. Keterangan */}
                <th className="px-3 py-3.5 font-semibold">Ketentuan / Cakupan</th>

                {/* 6. Status */}
                <th className="px-3 py-3.5 text-center">
                  <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>

                {/* Aksi */}
                <th className="px-3 py-3.5 pr-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 pl-4 pr-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-3 py-3.5 text-right"><Skeleton className="ml-auto h-5 w-28" /></td>
                    <td className="px-3 py-3.5 text-center"><Skeleton className="mx-auto h-5 w-20" /></td>
                    <td className="px-3 py-3.5"><Skeleton className="h-5 w-36" /></td>
                    <td className="px-3 py-3.5 text-center"><Skeleton className="mx-auto h-5 w-16" /></td>
                    <td className="px-3 py-3.5 pr-4 text-right"><Skeleton className="ml-auto h-7 w-20" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {icon}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                      Belum ada data {title.toLowerCase()} ditemukan
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {search ? 'Coba ubah kata kunci atau filter Anda' : `Klik tombol Tambah ${title} untuk menentukan nominal plafon per Grade`}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    {/* Grade / Level */}
                    <td className="py-3.5 pl-4 pr-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            {item.grade?.code || `GRD-${item.grade_id}`}
                          </span>
                          {item.grade?.pangkat && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({item.grade.pangkat})
                            </span>
                          )}
                        </div>
                        <span className="mt-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {item.grade?.name || 'Grade'} (Level {item.grade?.level || '-'})
                        </span>
                      </div>
                    </td>

                    {/* Kategori Pernikahan */}
                    <td className="px-3 py-3.5">
                      {item.marital_category === 'Menikah' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          Menikah (Keluarga)
                        </span>
                      ) : item.marital_category === 'Tidak Menikah' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                          <UserX className="h-3 w-3" />
                          Tidak Menikah (Lajang)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                          Semua Kategori
                        </span>
                      )}
                    </td>

                    {/* Nominal Plafon */}
                    <td className="px-3 py-3.5 text-right font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formatRupiah(item.amount)}
                    </td>

                    {/* Periode */}
                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getPeriodLabel(item.period_type)}
                      </span>
                    </td>

                    {/* Deskripsi */}
                    <td className="px-3 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.description || '-'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5 text-center">
                      {item.status === 'ACTIVE' ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Nonaktif</Badge>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                          title={`Ubah ${title}`}
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
                          title={`Hapus ${title}`}
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
          itemLabel={title}
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* 3. Modal Form (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? `Tambah ${title}` : `Ubah ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Grade / Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Grade / Level Jabatan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.grade_id}
              onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="0" disabled>-- Pilih Grade / Level --</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.name} (Level {g.level}{g.pangkat ? ` - ${g.pangkat}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kategori Pernikahan (Menikah vs Tidak Menikah) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Kategori Pernikahan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                  formData.marital_category === 'Menikah'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="marital_category"
                    checked={formData.marital_category === 'Menikah'}
                    onChange={() => setFormData({ ...formData, marital_category: 'Menikah' })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-xs font-bold">Menikah</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Karyawan + Tanggungan</p>
                  </div>
                </div>
                <CheckCircle2 className={`h-4 w-4 ${formData.marital_category === 'Menikah' ? 'text-emerald-600' : 'text-slate-300'}`} />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                  formData.marital_category === 'Tidak Menikah'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-900 dark:border-sky-600 dark:bg-sky-950/30 dark:text-sky-200'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="marital_category"
                    checked={formData.marital_category === 'Tidak Menikah'}
                    onChange={() => setFormData({ ...formData, marital_category: 'Tidak Menikah' })}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <p className="text-xs font-bold">Tidak Menikah</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Lajang (Perorangan)</p>
                  </div>
                </div>
                <UserX className={`h-4 w-4 ${formData.marital_category === 'Tidak Menikah' ? 'text-sky-600' : 'text-slate-300'}`} />
              </label>
            </div>
          </div>

          {/* 3. Nominal Plafon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nominal Plafon (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Rp</span>
              <Input
                type="number"
                min="0"
                step="1000"
                placeholder="Contoh: 25000000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="pl-9 font-mono text-sm"
              />
            </div>
            {formData.amount && !isNaN(parseFloat(formData.amount)) && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Terbaca: {formatRupiah(formData.amount)}
              </p>
            )}
          </div>

          {/* 4. Periode Manfaat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Periode / Frekuensi Plafon <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.period_type}
              onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
              required
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="TAHUNAN">Per Tahun (Tahunan)</option>
              <option value="2_TAHUNAN">Per 2 Tahun (Khusus Kacamata / Optik)</option>
              <option value="PER_KASUS">Per Kasus / Kejadian (Khusus Persalinan)</option>
              <option value="SEUMUR_HIDUP">Seumur Hidup</option>
            </select>
          </div>

          {/* 5. Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Ketentuan Tambahan / Catatan Cakupan
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Termasuk rawat jalan, rawat inap, tes diagnostik, dan obat resep..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* 6. Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Status Plafon
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
              leftIcon={<CreditCard className="h-4 w-4" />}
            >
              {modalMode === 'create' ? `Simpan ${title}` : `Perbarui ${title}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
