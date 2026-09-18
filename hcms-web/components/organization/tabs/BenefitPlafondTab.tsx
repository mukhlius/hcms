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
  X,
  Glasses,
  ChevronDown,
  Download
} from 'lucide-react';
import { BenefitPlafondItem, SalaryGradeItem } from '@/types';
import { benefitPlafondService, salaryGradeService, importExportService } from '@/services/masterDataService';
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

const LENS_PRESETS = [
  'Monofokus',
  'Monofokus Silindris',
  'Bifokus',
  'Bifokus Silindris',
  'Progresif',
  'Progresif Silindris',
];

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
  const isKacamata = benefitType === 'KACAMATA';

  const [items, setItems] = useState<BenefitPlafondItem[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Filters for Pengobatan & Persalinan
  const [filterGolongan, setFilterGolongan] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Menikah' | 'Tidak Menikah'>('ALL');

  // Filters for Kacamata
  const [filterLensType, setFilterLensType] = useState<string>('ALL');

  // Common Filter
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    salary_grade_id: 0,
    lens_type: 'Monofokus',
    frame_amount: '',
    lens_amount: '',
    marital_category: 'Menikah' as 'Menikah' | 'Tidak Menikah' | 'SEMUA',
    amount: '',
    period_type: defaultPeriod,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (isKacamata) {
        const plafondRes = await benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType });
        if (plafondRes.success && plafondRes.data) {
          setItems(plafondRes.data);
        }
      } else {
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
      }
    } catch (err) {
      console.error(`Failed to load ${title} data:`, err);
      toast.error(`Gagal memuat data ${title}.`, 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [benefitType, isKacamata, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalMode('create');
    if (isKacamata) {
      setFormData({
        id: 0,
        salary_grade_id: 0,
        lens_type: LENS_PRESETS[0],
        frame_amount: '',
        lens_amount: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: defaultPeriod || '2_TAHUNAN',
        description: '',
        status: 'ACTIVE',
      });
    } else {
      setFormData({
        id: 0,
        salary_grade_id: salaryGrades.length > 0 ? salaryGrades[0].id : 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        marital_category: 'Menikah',
        amount: '',
        period_type: defaultPeriod,
        description: '',
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: BenefitPlafondItem) => {
    setModalMode('edit');
    if (isKacamata) {
      setFormData({
        id: item.id,
        salary_grade_id: 0,
        lens_type: item.lens_type || LENS_PRESETS[0],
        frame_amount: item.frame_amount !== null && item.frame_amount !== undefined ? String(item.frame_amount) : '',
        lens_amount: item.lens_amount !== null && item.lens_amount !== undefined ? String(item.lens_amount) : '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || defaultPeriod || '2_TAHUNAN',
        description: item.description || '',
        status: item.status,
      });
    } else {
      setFormData({
        id: item.id,
        salary_grade_id: item.salary_grade_id || item.salary_grade?.id || item.grade_id || 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        marital_category: item.marital_category,
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || defaultPeriod,
        description: item.description || '',
        status: item.status,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isKacamata) {
      if (!formData.lens_type || !formData.lens_type.trim()) {
        toast.warning('Kriteria / Jenis Lensa harus diisi.', 'Form Belum Lengkap');
        return;
      }
      if (formData.frame_amount === '' || isNaN(parseFloat(formData.frame_amount))) {
        toast.warning('Nominal bantuan frame harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
      if (formData.lens_amount === '' || isNaN(parseFloat(formData.lens_amount))) {
        toast.warning('Nominal bantuan lensa harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
    } else {
      if (!formData.salary_grade_id || formData.salary_grade_id === 0) {
        toast.warning('Pilih Golongan terlebih dahulu.', 'Form Belum Lengkap');
        return;
      }
      if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
        toast.warning('Nominal plafon harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
    }

    try {
      setSubmitting(true);
      let payload: Partial<BenefitPlafondItem>;

      if (isKacamata) {
        const frame = parseFloat(formData.frame_amount);
        const lens = parseFloat(formData.lens_amount);
        payload = {
          benefit_type: benefitType,
          lens_type: formData.lens_type.trim(),
          frame_amount: frame,
          lens_amount: lens,
          amount: frame + lens,
          marital_category: 'SEMUA',
          period_type: formData.period_type,
          description: formData.description.trim() || undefined,
          status: formData.status,
        };
      } else {
        payload = {
          benefit_type: benefitType,
          salary_grade_id: Number(formData.salary_grade_id),
          marital_category: formData.marital_category,
          amount: parseFloat(formData.amount),
          period_type: formData.period_type,
          description: formData.description.trim() || undefined,
          status: formData.status,
        };
      }

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
    let confirmMsg = '';
    if (isKacamata) {
      confirmMsg = `Apakah Anda yakin ingin menghapus data plafon kacamata untuk kriteria "${item.lens_type}" dengan total bantuan ${formatRupiah(item.amount)}?`;
    } else {
      const golName = item.salary_grade?.name || item.salary_grade?.code || `ID ${item.salary_grade_id}`;
      confirmMsg = `Apakah Anda yakin ingin menghapus data plafon untuk Golongan "${golName}" (${item.marital_category}) senilai ${formatRupiah(item.amount)}?`;
    }

    const confirmed = await confirmDialog({
      title: `Hapus ${title}`,
      message: confirmMsg,
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

  // Distinct lens type list for filter dropdown
  const availableLensTypes = useMemo(() => {
    const set = new Set<string>();
    LENS_PRESETS.forEach((p) => set.add(p));
    items.forEach((item) => {
      if (item.lens_type) set.add(item.lens_type);
    });
    return Array.from(set);
  }, [items]);

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      if (isKacamata) {
        const lens = (item.lens_type || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const matchSearch = !search || lens.includes(q) || desc.includes(q);
        const matchLens = filterLensType === 'ALL' || item.lens_type === filterLensType;
        return matchSearch && matchLens && matchStatus;
      }

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

      return matchSearch && matchGolongan && matchCategory && matchStatus;
    });
  }, [items, search, isKacamata, filterLensType, filterGolongan, filterCategory, filterStatus]);

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
    defaultSortField: isKacamata ? 'lens_type' : 'salary_grade.code',
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

  const isAnyFilterActive = isKacamata
    ? Boolean(search || filterLensType !== 'ALL' || filterStatus !== 'ALL')
    : Boolean(search || filterGolongan !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL');

  const handleResetFilter = () => {
    setSearch('');
    setFilterStatus('ALL');
    if (isKacamata) {
      setFilterLensType('ALL');
    } else {
      setFilterGolongan('ALL');
      setFilterCategory('ALL');
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
                placeholder={isKacamata ? 'Cari jenis lensa atau ketentuan...' : 'Cari kode, nama golongan, atau ketentuan...'}
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

            {/* 2. Mode Specific Filters */}
            {isKacamata ? (
              /* Filter Kriteria Lensa */
              <div className="relative min-w-[200px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterLensType}
                  onChange={(e) => setFilterLensType(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Kriteria Lensa</option>
                  {availableLensTypes.map((lt) => (
                    <option key={lt} value={lt}>{lt}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            ) : (
              <>
                {/* Filter Golongan */}
                <div className="relative min-w-[200px] group">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                  <select
                    value={filterGolongan}
                    onChange={(e) => setFilterGolongan(e.target.value)}
                    className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ALL">Semua Golongan</option>
                    {salaryGrades.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.code} - {g.name.replace(/^Golongan\s+[0-9A-Z]+\s*-\s*/i, '')}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>

                {/* Filter Kategori Pernikahan */}
                <div className="relative min-w-[170px] group">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ALL">Semua Status Marital</option>
                    <option value="Menikah">Menikah (Keluarga)</option>
                    <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </>
            )}

            {/* 3. Filter Status */}
            <div className="relative min-w-[140px] group">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>

            {/* 4. Tombol Reset Filter */}
            {isAnyFilterActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
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
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => {
                const entity = benefitType === 'PENGOBATAN'
                  ? 'plafon-pengobatan'
                  : benefitType === 'KACAMATA'
                  ? 'plafon-kacamata'
                  : 'plafon-persalinan';
                window.open(importExportService.getExportUrl(entity), '_blank');
              }}
            >
              Ekspor CSV
            </Button>
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
              {isKacamata ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kriteria / Jenis Lensa" field="lens_type" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Bantuan Frame" field="frame_amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Bantuan Lensa" field="lens_amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Total Plafon" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Ketentuan / Keterangan</th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : (
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
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
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
              ) : isKacamata ? (
                /* Kacamata Table Rows */
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 1. Kriteria / Jenis Lensa */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-semibold px-2.5 py-1">
                          <Glasses className="h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                          {item.lens_type || '-'}
                        </Badge>
                      </div>
                    </td>

                    {/* 2. Bantuan Frame */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.frame_amount)}
                    </td>

                    {/* 3. Bantuan Lensa */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.lens_amount)}
                    </td>

                    {/* 4. Total Plafon */}
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
                ))
              ) : (
                /* Pengobatan & Persalinan Table Rows */
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
          {isKacamata ? (
            /* ================= FORM KHUSUS KACAMATA ================= */
            <>
              {/* 1. Kriteria / Jenis Lensa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Kriteria / Jenis Lensa <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={LENS_PRESETS.includes(formData.lens_type) ? formData.lens_type : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setFormData({ ...formData, lens_type: '' });
                        } else {
                          setFormData({ ...formData, lens_type: e.target.value });
                        }
                      }}
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      {LENS_PRESETS.map((preset) => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                      <option value="CUSTOM">-- Kriteria Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {(!LENS_PRESETS.includes(formData.lens_type) || formData.lens_type === '') && (
                    <Input
                      placeholder="Ketik kriteria/jenis lensa baru..."
                      value={formData.lens_type}
                      onChange={(e) => setFormData({ ...formData, lens_type: e.target.value })}
                      required
                      className="h-9.5 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* 2. Bantuan Biaya Frame */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Bantuan Biaya Frame (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 600000"
                  value={formData.frame_amount}
                  onChange={(e) => setFormData({ ...formData, frame_amount: e.target.value })}
                  required
                  className="h-9.5 text-xs font-mono"
                />
                {formData.frame_amount && !isNaN(parseFloat(formData.frame_amount)) && (
                  <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Bantuan Frame: {formatRupiah(formData.frame_amount)}
                  </p>
                )}
              </div>

              {/* 3. Bantuan Biaya Lensa */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Bantuan Biaya Lensa (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 400000"
                  value={formData.lens_amount}
                  onChange={(e) => setFormData({ ...formData, lens_amount: e.target.value })}
                  required
                  className="h-9.5 text-xs font-mono"
                />
                {formData.lens_amount && !isNaN(parseFloat(formData.lens_amount)) && (
                  <p className="mt-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Bantuan Lensa: {formatRupiah(formData.lens_amount)}
                  </p>
                )}
              </div>

              {/* 4. Total Plafon Otomatis */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <Glasses className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Total Plafon Kacamata:</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(
                      (parseFloat(formData.frame_amount) || 0) + (parseFloat(formData.lens_amount) || 0)
                    )}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Akumulasi dari Bantuan Frame ({formatRupiah(formData.frame_amount || 0)}) + Bantuan Lensa ({formatRupiah(formData.lens_amount || 0)})
                </p>
              </div>

              {/* 5. Periode Manfaat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  5. Periode / Frekuensi Plafon <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="2_TAHUNAN">Per 2 Tahun (Standar Optik/Kacamata)</option>
                    <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                    <option value="SEUMUR_HIDUP">Seumur Hidup</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              {/* 6. Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  6. Ketentuan Tambahan / Keterangan
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Penggantian kacamata per 2 tahun, disertai resep dokter spesialis mata atau optik rekanan..."
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {/* 7. Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  7. Status Plafon
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : (
            /* ================= FORM PENGOBATAN & PERSALINAN ================= */
            <>
              {/* 1. Golongan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Golongan <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.salary_grade_id}
                    onChange={(e) => setFormData({ ...formData, salary_grade_id: Number(e.target.value) })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="0" disabled>-- Pilih Golongan --</option>
                    {salaryGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code} - {g.name}{g.pangkat ? ` (${g.pangkat})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              {/* 2. Kategori Pernikahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Kategori Pernikahan <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.marital_category}
                    onChange={(e) => setFormData({ ...formData, marital_category: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="Menikah">Menikah (Keluarga)</option>
                    <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
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
                  className="h-9.5 text-xs font-mono"
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
                <div className="relative flex items-center group">
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                    <option value="PER_KASUS">Per Kasus / Kejadian (Khusus Persalinan)</option>
                    <option value="2_TAHUNAN">Per 2 Tahun</option>
                    <option value="SEUMUR_HIDUP">Seumur Hidup</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
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
                <div className="relative flex items-center group">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          )}

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
