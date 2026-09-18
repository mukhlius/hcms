'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  ShieldCheck,
  RotateCcw,
  X
} from 'lucide-react';
import { BenefitPlafondItem, SalaryGradeItem } from '@/types';
import { benefitPlafondService, salaryGradeService } from '@/services/masterDataService';
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
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
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
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterGolongan, setFilterGolongan] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Menikah' | 'Tidak Menikah'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Data (Golongan based)
  const [formData, setFormData] = useState({
    id: 0,
    salary_grade_id: 0,
    marital_category: 'Menikah' as 'Menikah' | 'Tidak Menikah' | 'SEMUA',
    amount: '',
    period_type: defaultPeriod,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [plafondRes, salaryGradeRes] = await Promise.all([
        benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType }),
        salaryGradeService.getSalaryGrades(),
      ]);

      if (plafondRes.success && plafondRes.data) {
        setItems(plafondRes.data);
      }
      if (salaryGradeRes.success && salaryGradeRes.data) {
        setSalaryGrades(salaryGradeRes.data);
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
      salary_grade_id: salaryGrades.length > 0 ? salaryGrades[0].id : 0,
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
      salary_grade_id: item.salary_grade_id || item.salary_grade?.id || item.grade_id || 0,
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

    if (!formData.salary_grade_id || formData.salary_grade_id === 0) {
      toast.warning('Pilih Golongan terlebih dahulu.', 'Form Belum Lengkap');
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
        salary_grade_id: Number(formData.salary_grade_id),
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

  const handleDelete = async (item: BenefitPlafondItem) => {
    const golName = item.salary_grade?.name || item.salary_grade?.code || `ID ${item.salary_grade_id}`;
    const confirmed = await confirmDialog({
      title: `Hapus ${title}`,
      message: `Apakah Anda yakin ingin menghapus data plafon untuk Golongan "${golName}" (${item.marital_category}) senilai ${formatRupiah(item.amount)}?`,
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
      const gol = item.salary_grade || (item.grade as any);
      const golName = (gol?.name || '').toLowerCase();
      const golCode = (gol?.code || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const marital = (item.marital_category || '').toLowerCase();

      const matchSearch =
        !search ||
        golName.includes(q) ||
        golCode.includes(q) ||
        desc.includes(q) ||
        marital.includes(q);

      const targetId = item.salary_grade_id || item.grade_id;
      const matchGolongan = filterGolongan === 'ALL' || String(targetId) === filterGolongan;
      const matchCategory = filterCategory === 'ALL' || item.marital_category === filterCategory;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchGolongan && matchCategory && matchStatus;
    });
  }, [items, search, filterGolongan, filterCategory, filterStatus]);

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
    defaultSortField: 'salary_grade.code',
    defaultPerPage: 10,
  });

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'TAHUNAN': return 'Per Tahun';
      case '2_TAHUNAN': return 'Per 2 Tahun';
      case 'PER_KASUS': return 'Per Kasus';
      case 'SEUMUR_HIDUP': return 'Seumur Hidup';
      default: return period;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={`Cari kode, nama golongan, atau ketentuan...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* 2. Filter Golongan */}
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filterGolongan}
                onChange={(e) => setFilterGolongan(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Golongan</option>
                {salaryGrades.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.code} - {g.name.replace(/^Golongan\s+[0-9A-Z]+\s*-\s*/i, '')}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filter Kategori Pernikahan */}
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Status Marital</option>
                <option value="Menikah">Menikah (Keluarga)</option>
                <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
              </select>
            </div>

            {/* 4. Filter Status */}
            <div className="relative min-w-[130px]">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
            </div>

            {/* 5. Tombol Reset Filter */}
            {(search || filterGolongan !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilterGolongan('ALL');
                  setFilterCategory('ALL');
                  setFilterStatus('ALL');
                }}
                className="h-9 px-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                leftIcon={<RotateCcw className="h-3 w-3" />}
              >
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              isLoading={loading}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Data Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Kategori Pernikahan" field="marital_category" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortableHeader label="Nominal Plafon" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">Ketentuan / Cakupan</th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada data {title.toLowerCase()} ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan data plafon baru atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const gol = item.salary_grade || (item.grade as any);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Kode */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800">
                          {gol?.code || '-'}
                        </Badge>
                      </td>

                      {/* 2. Nama Golongan */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{gol?.name || '-'}</span>
                          {gol?.pangkat && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({gol.pangkat})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Kategori Pernikahan */}
                      <td className="px-4 py-3.5">
                        {item.marital_category === 'Menikah' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-medium">
                            Menikah (Keluarga)
                          </Badge>
                        ) : item.marital_category === 'Tidak Menikah' ? (
                          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-medium">
                            Tidak Menikah (Lajang)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-medium">
                            Semua
                          </Badge>
                        )}
                      </td>

                      {/* 4. Nominal Plafon */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.amount)}
                      </td>

                      {/* 5. Periode */}
                      <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                        {getPeriodLabel(item.period_type)}
                      </td>

                      {/* 6. Ketentuan */}
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.description || '-'}
                      </td>

                      {/* 7. Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                      </td>

                      {/* 8. Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
                            title={`Edit ${title}`}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800"
                            title={`Hapus ${title}`}
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

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel={title.toLowerCase()}
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal strictly aligned with Organization Reference style */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? `Tambah ${title}` : `Edit ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Golongan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              1. Golongan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.salary_grade_id}
              onChange={(e) => setFormData({ ...formData, salary_grade_id: Number(e.target.value) })}
              required
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="0" disabled>-- Pilih Golongan --</option>
              {salaryGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.name}{g.pangkat ? ` (${g.pangkat})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kategori Pernikahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              2. Kategori Pernikahan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.marital_category}
              onChange={(e) => setFormData({ ...formData, marital_category: e.target.value as any })}
              required
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="Menikah">Menikah (Keluarga)</option>
              <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
            </select>
          </div>

          {/* 3. Nominal Plafon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              3. Nominal Plafon (Rp) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="1000"
              placeholder="Contoh: 25000000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="h-9 text-xs font-mono"
            />
            {formData.amount && !isNaN(parseFloat(formData.amount)) && (
              <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Terbaca: {formatRupiah(formData.amount)}
              </p>
            )}
          </div>

          {/* 4. Periode Manfaat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              4. Periode / Frekuensi Plafon <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.period_type}
              onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
              required
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="TAHUNAN">Per Tahun (Tahunan)</option>
              <option value="2_TAHUNAN">Per 2 Tahun (Khusus Kacamata / Optik)</option>
              <option value="PER_KASUS">Per Kasus / Kejadian (Khusus Persalinan)</option>
              <option value="SEUMUR_HIDUP">Seumur Hidup</option>
            </select>
          </div>

          {/* 5. Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              5. Ketentuan Tambahan / Cakupan
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Termasuk rawat jalan, rawat inap, tes diagnostik, dan obat resep..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* 6. Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              6. Status Plafon
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
            >
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
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
            >
              {modalMode === 'create' ? `Simpan` : `Perbarui`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
