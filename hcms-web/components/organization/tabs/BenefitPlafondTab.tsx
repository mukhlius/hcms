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
  HardHat,
  PlaneTakeoff,
  Coins,
  Smartphone,
  Home,
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
  benefitType:
  | 'PENGOBATAN'
  | 'KACAMATA'
  | 'PERSALINAN'
  | 'TUNJANGAN_LAPANGAN'
  | 'UANG_PERDIN'
  | 'BANTUAN_LUMPSUM'
  | 'BANTUAN_KOMUNIKASI'
  | 'BANTUAN_PERUMAHAN';
  title: string;
  icon: React.ReactNode;
  defaultPeriod?: 'HARIAN' | 'BULANAN' | 'TAHUNAN' | '2_TAHUNAN' | 'PER_KASUS' | 'SEUMUR_HIDUP';
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

const TUNJANGAN_LAPANGAN_CATEGORIES = [
  'Pit Tambang & Operasional Front',
  'CPP & Coal Processing Plant',
  'Port & Jetty Facility',
  'Workshop & Heavy Equipment Maintenance',
  'Office / Camp Site Tambang',
];

const PERDIN_ZONES = [
  'Luar Kota / Antar Provinsi',
  'Antar Site Tambang',
  'Jabodetabek / HO',
  'Luar Negeri',
];

const PERDIN_CATEGORIES = [
  'Uang Saku Harian',
  'Uang Makan',
  'Uang Transport Lokal',
  'Akomodasi & Penginapan',
];

const LUMPSUM_CATEGORIES = [
  'Relokasi Site Tambang',
  'Bantuan Duka Cita',
  'Bencana Alam & Evakuasi Medis',
  'Bantuan Rawat Inap Darurat',
  'Bantuan Pernikahan Pertama',
];

const KOMUNIKASI_CATEGORIES = [
  'Paket Data & Komunikasi Lapangan',
  'Tunjangan Pulsa On-Call & Radio',
  'Paket Data Operasional Heavy Equipment',
  'Executive Communication Allowance',
];

const PERUMAHAN_CATEGORIES = [
  'Tunjangan Perumahan Mandiri',
  'Sewa Rumah Dinas / Family Housing',
  'Mess Site Tambang & Camp Fasilitas',
  'Tunjangan Relokasi Domisili Keluarga',
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
  const isTunjanganLapangan = benefitType === 'TUNJANGAN_LAPANGAN';
  const isUangPerdin = benefitType === 'UANG_PERDIN';
  const isBantuanLumpsum = benefitType === 'BANTUAN_LUMPSUM';
  const isBantuanKomunikasi = benefitType === 'BANTUAN_KOMUNIKASI';
  const isBantuanPerumahan = benefitType === 'BANTUAN_PERUMAHAN';
  const isPengobatanOrPersalinan = benefitType === 'PENGOBATAN' || benefitType === 'PERSALINAN';
  const isSalaryGradeBased = !isKacamata;

  const [items, setItems] = useState<BenefitPlafondItem[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Filters
  const [filterGolongan, setFilterGolongan] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterLensType, setFilterLensType] = useState<string>('ALL');
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
    category_name: '',
    zone_name: '',
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
    const firstGradeId = salaryGrades.length > 0 ? salaryGrades[0].id : 0;

    if (isKacamata) {
      setFormData({
        id: 0,
        salary_grade_id: 0,
        lens_type: LENS_PRESETS[0],
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: '2_TAHUNAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isTunjanganLapangan) {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: TUNJANGAN_LAPANGAN_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'BULANAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isUangPerdin) {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: PERDIN_CATEGORIES[0],
        zone_name: PERDIN_ZONES[0],
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'HARIAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isBantuanLumpsum) {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: LUMPSUM_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'PER_KASUS',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isBantuanKomunikasi) {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: KOMUNIKASI_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'BULANAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isBantuanPerumahan) {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: PERUMAHAN_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'BULANAN',
        description: '',
        status: 'ACTIVE',
      });
    } else {
      setFormData({
        id: 0,
        salary_grade_id: firstGradeId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
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
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || '2_TAHUNAN',
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
        category_name: item.category_name || '',
        zone_name: item.zone_name || '',
        marital_category: item.marital_category || 'SEMUA',
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
        toast.warning('Nominal plafon / tunjangan harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
      if (isUangPerdin) {
        if (!formData.zone_name || !formData.zone_name.trim()) {
          toast.warning('Zona / Wilayah Perdin harus diisi.', 'Form Belum Lengkap');
          return;
        }
        if (!formData.category_name || !formData.category_name.trim()) {
          toast.warning('Komponen Perdin harus diisi.', 'Form Belum Lengkap');
          return;
        }
      } else if (isTunjanganLapangan || isBantuanLumpsum || isBantuanKomunikasi || isBantuanPerumahan) {
        if (!formData.category_name || !formData.category_name.trim()) {
          toast.warning('Kategori / Jenis bantuan harus diisi.', 'Form Belum Lengkap');
          return;
        }
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
      } else if (isUangPerdin) {
        payload = {
          benefit_type: benefitType,
          salary_grade_id: Number(formData.salary_grade_id),
          zone_name: formData.zone_name.trim(),
          category_name: formData.category_name.trim(),
          amount: parseFloat(formData.amount),
          marital_category: 'SEMUA',
          period_type: formData.period_type,
          description: formData.description.trim() || undefined,
          status: formData.status,
        };
      } else if (isTunjanganLapangan || isBantuanLumpsum || isBantuanKomunikasi || isBantuanPerumahan) {
        payload = {
          benefit_type: benefitType,
          salary_grade_id: Number(formData.salary_grade_id),
          category_name: formData.category_name.trim(),
          amount: parseFloat(formData.amount),
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
    const golName = item.salary_grade?.name || item.salary_grade?.code || `ID ${item.salary_grade_id}`;

    if (isKacamata) {
      confirmMsg = `Apakah Anda yakin ingin menghapus data plafon kacamata untuk kriteria "${item.lens_type}" dengan total bantuan ${formatRupiah(item.amount)}?`;
    } else if (isUangPerdin) {
      confirmMsg = `Apakah Anda yakin ingin menghapus tarif uang perdin Golongan "${golName}" (${item.zone_name} - ${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else if (isTunjanganLapangan) {
      confirmMsg = `Apakah Anda yakin ingin menghapus tunjangan lapangan Golongan "${golName}" (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else if (isBantuanLumpsum) {
      confirmMsg = `Apakah Anda yakin ingin menghapus bantuan lumpsum Golongan "${golName}" (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else if (isBantuanKomunikasi) {
      confirmMsg = `Apakah Anda yakin ingin menghapus bantuan komunikasi Golongan "${golName}" (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else if (isBantuanPerumahan) {
      confirmMsg = `Apakah Anda yakin ingin menghapus bantuan perumahan Golongan "${golName}" (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else {
      confirmMsg = `Apakah Anda yakin ingin menghapus data plafon untuk Golongan "${golName}" (${item.marital_category}) senilai ${formatRupiah(item.amount)}?`;
    }

    const confirmed = await confirmDialog({
      title: `Hapus ${title}`,
      message: confirmMsg,
      confirmText: 'Ya, Hapus Data',
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

  // Distinct category names for Tunjangan Lapangan, Lumpsum, Komunikasi, Perumahan, Perdin
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    if (isTunjanganLapangan) TUNJANGAN_LAPANGAN_CATEGORIES.forEach((c) => set.add(c));
    if (isUangPerdin) PERDIN_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanLumpsum) LUMPSUM_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanKomunikasi) KOMUNIKASI_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanPerumahan) PERUMAHAN_CATEGORIES.forEach((c) => set.add(c));
    items.forEach((item) => {
      if (item.category_name) set.add(item.category_name);
    });
    return Array.from(set);
  }, [items, isTunjanganLapangan, isUangPerdin, isBantuanLumpsum, isBantuanKomunikasi, isBantuanPerumahan]);

  // Distinct zones for Uang Perdin
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    if (isUangPerdin) PERDIN_ZONES.forEach((z) => set.add(z));
    items.forEach((item) => {
      if (item.zone_name) set.add(item.zone_name);
    });
    return Array.from(set);
  }, [items, isUangPerdin]);

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
      const cat = (item.category_name || '').toLowerCase();
      const zone = (item.zone_name || '').toLowerCase();
      const marital = (item.marital_category || '').toLowerCase();

      const matchSearch =
        !search ||
        golName.includes(q) ||
        golCode.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        zone.includes(q) ||
        marital.includes(q);

      const targetId = item.salary_grade_id || item.grade_id;
      const matchGolongan = filterGolongan === 'ALL' || String(targetId) === filterGolongan;

      let matchCategory = true;
      if (isPengobatanOrPersalinan) {
        matchCategory = filterCategory === 'ALL' || item.marital_category === filterCategory;
      } else {
        matchCategory = filterCategory === 'ALL' || item.category_name === filterCategory;
      }

      const matchZone = !isUangPerdin || filterZone === 'ALL' || item.zone_name === filterZone;

      return matchSearch && matchGolongan && matchCategory && matchZone && matchStatus;
    });
  }, [
    items,
    search,
    isKacamata,
    isPengobatanOrPersalinan,
    isUangPerdin,
    filterLensType,
    filterGolongan,
    filterCategory,
    filterZone,
    filterStatus,
  ]);

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
      case 'HARIAN': return 'Per Hari';
      case 'BULANAN': return 'Per Bulan';
      case 'TAHUNAN': return 'Per Tahun';
      case '2_TAHUNAN': return 'Per 2 Tahun';
      case 'PER_KASUS': return 'Per Kasus';
      case 'SEUMUR_HIDUP': return 'Seumur Hidup';
      default: return period;
    }
  };

  const isAnyFilterActive = isKacamata
    ? Boolean(search || filterLensType !== 'ALL' || filterStatus !== 'ALL')
    : isUangPerdin
      ? Boolean(search || filterGolongan !== 'ALL' || filterZone !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL')
      : Boolean(search || filterGolongan !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL');

  const handleResetFilter = () => {
    setSearch('');
    setFilterStatus('ALL');
    setFilterLensType('ALL');
    setFilterGolongan('ALL');
    setFilterCategory('ALL');
    setFilterZone('ALL');
  };

  const getExportEntityName = () => {
    switch (benefitType) {
      case 'PENGOBATAN': return 'plafon-pengobatan';
      case 'KACAMATA': return 'plafon-kacamata';
      case 'PERSALINAN': return 'plafon-persalinan';
      case 'TUNJANGAN_LAPANGAN': return 'tunjangan-lapangan';
      case 'UANG_PERDIN': return 'uang-perdin';
      case 'BANTUAN_LUMPSUM': return 'bantuan-lumpsum';
      case 'BANTUAN_KOMUNIKASI': return 'bantuan-komunikasi';
      case 'BANTUAN_PERUMAHAN': return 'bantuan-perumahan';
      default: return 'plafon-pengobatan';
    }
  };

  const getSearchPlaceholder = () => {
    if (isKacamata) return 'Cari jenis lensa atau ketentuan...';
    if (isUangPerdin) return 'Cari golongan, zona, komponen perdin...';
    if (isTunjanganLapangan) return 'Cari golongan, kategori penempatan...';
    if (isBantuanLumpsum) return 'Cari golongan, jenis bantuan lumpsum...';
    if (isBantuanKomunikasi) return 'Cari golongan, paket komunikasi...';
    if (isBantuanPerumahan) return 'Cari golongan, kategori perumahan...';
    return 'Cari kode, nama golongan, atau ketentuan...';
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
                placeholder={getSearchPlaceholder()}
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

            {/* 2. Filter Golongan (For all except Kacamata) */}
            {isSalaryGradeBased && (
              <div className="relative min-w-[190px] group">
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
            )}

            {/* 3. Mode Specific Filters */}
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
            ) : isPengobatanOrPersalinan ? (
              /* Filter Kategori Pernikahan */
              <div className="relative min-w-[170px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Status Marital</option>
                  <option value="Menikah">Menikah (Keluarga)</option>
                  <option value="Tidak Menikah">Tidak Menikah (Lajang)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            ) : isUangPerdin ? (
              <>
                {/* Filter Zona / Wilayah */}
                <div className="relative min-w-[180px] group">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                  <select
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value)}
                    className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ALL">Semua Zona Wilayah</option>
                    {availableZones.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>

                {/* Filter Komponen Perdin */}
                <div className="relative min-w-[170px] group">
                  <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="ALL">Semua Komponen</option>
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </>
            ) : (
              /* Filter Kategori / Jenis Bantuan */
              <div className="relative min-w-[190px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Kategori / Jenis</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            )}

            {/* 4. Filter Status */}
            <div className="relative min-w-[130px] group">
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

            {/* 5. Tombol Reset Filter */}
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
                window.open(importExportService.getExportUrl(getExportEntityName()), '_blank');
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
              ) : isUangPerdin ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Zona / Wilayah" field="zone_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Komponen Perdin" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Nominal Per Hari" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
              ) : isTunjanganLapangan ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Kategori Penempatan" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Besaran Tunjangan" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
              ) : isBantuanLumpsum ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Jenis Bantuan Lumpsum" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Besaran Bantuan" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Ketentuan / Syarat</th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : isBantuanKomunikasi ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Kategori Komunikasi" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Nominal Bantuan" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Ketentuan / Fasilitas</th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : isBantuanPerumahan ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Kategori Perumahan" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Besaran Bantuan" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Ketentuan / Fasilitas</th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : (
                /* Pengobatan & Persalinan */
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
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
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
                  <td colSpan={isUangPerdin ? 9 : 8} className="px-5 py-12 text-center text-slate-400">
                    <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Tidak ada data {title.toLowerCase()} ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan data baru atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : isKacamata ? (
                /* Kacamata Table Rows */
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-semibold px-2.5 py-1">
                          <Glasses className="h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400" />
                          {item.lens_type || '-'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.frame_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(item.lens_amount)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                      {getPeriodLabel(item.period_type)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {item.description || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                      </Badge>
                    </td>
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
              ) : isUangPerdin ? (
                /* Uang Perdin Rows */
                paginatedData.map((item) => {
                  const gol = item.salary_grade || (item.grade as any);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800">
                          {gol?.code || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{gol?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-medium">
                          {item.zone_name || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-300">
                        {item.category_name || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                        {getPeriodLabel(item.period_type)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                      </td>
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
              ) : (
                /* Tunjangan Lapangan, Lumpsum, Komunikasi, Perumahan, Pengobatan, Persalinan */
                paginatedData.map((item) => {
                  const gol = item.salary_grade || (item.grade as any);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800">
                          {gol?.code || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{gol?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {isTunjanganLapangan ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-medium">
                            {item.category_name || '-'}
                          </Badge>
                        ) : isBantuanLumpsum ? (
                          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 font-medium">
                            {item.category_name || '-'}
                          </Badge>
                        ) : isBantuanKomunikasi ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-medium">
                            {item.category_name || '-'}
                          </Badge>
                        ) : isBantuanPerumahan ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-medium">
                            {item.category_name || '-'}
                          </Badge>
                        ) : item.marital_category === 'Menikah' ? (
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
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                        {getPeriodLabel(item.period_type)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                      </td>
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? `Tambah ${title}` : `Edit ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isKacamata ? (
            /* ================= FORM KHUSUS KACAMATA ================= */
            <>
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
                    <option value="2_TAHUNAN">Per 2 Tahun (Standar Optik/Kacamata)</option>
                    <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                    <option value="SEUMUR_HIDUP">Seumur Hidup</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : isUangPerdin ? (
            /* ================= FORM KHUSUS UANG PERDIN ================= */
            <>
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
                        {g.code} - {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Zona / Wilayah Perdin <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={PERDIN_ZONES.includes(formData.zone_name) ? formData.zone_name : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setFormData({ ...formData, zone_name: '' });
                        } else {
                          setFormData({ ...formData, zone_name: e.target.value });
                        }
                      }}
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      {PERDIN_ZONES.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                      <option value="CUSTOM">-- Zona Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {(!PERDIN_ZONES.includes(formData.zone_name) || formData.zone_name === '') && (
                    <Input
                      placeholder="Ketik nama zona perdin..."
                      value={formData.zone_name}
                      onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                      required
                      className="h-9.5 text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Komponen Perdin <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={PERDIN_CATEGORIES.includes(formData.category_name) ? formData.category_name : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setFormData({ ...formData, category_name: '' });
                        } else {
                          setFormData({ ...formData, category_name: e.target.value });
                        }
                      }}
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      {PERDIN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="CUSTOM">-- Komponen Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {(!PERDIN_CATEGORIES.includes(formData.category_name) || formData.category_name === '') && (
                    <Input
                      placeholder="Ketik nama komponen perdin..."
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                      required
                      className="h-9.5 text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4. Nominal Per Hari (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 350000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="h-9.5 text-xs font-mono"
                />
                {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Terbaca: {formatRupiah(formData.amount)} / hari
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  5. Periode / Frekuensi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="HARIAN">Per Hari (Harian Perdin)</option>
                    <option value="PER_KASUS">Per Kasus / Per Trip</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : isTunjanganLapangan || isBantuanLumpsum || isBantuanKomunikasi || isBantuanPerumahan ? (
            /* ================= FORM KHUSUS TUNJANGAN LAPANGAN, LUMPSUM, KOMUNIKASI, PERUMAHAN ================= */
            <>
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
                        {g.code} - {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. {isTunjanganLapangan ? 'Kategori Penempatan' : isBantuanLumpsum ? 'Jenis Bantuan Lumpsum' : isBantuanKomunikasi ? 'Kategori Komunikasi' : 'Kategori Bantuan Perumahan'} <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={
                        (isTunjanganLapangan && TUNJANGAN_LAPANGAN_CATEGORIES.includes(formData.category_name)) ||
                          (isBantuanLumpsum && LUMPSUM_CATEGORIES.includes(formData.category_name)) ||
                          (isBantuanKomunikasi && KOMUNIKASI_CATEGORIES.includes(formData.category_name)) ||
                          (isBantuanPerumahan && PERUMAHAN_CATEGORIES.includes(formData.category_name))
                          ? formData.category_name
                          : 'CUSTOM'
                      }
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setFormData({ ...formData, category_name: '' });
                        } else {
                          setFormData({ ...formData, category_name: e.target.value });
                        }
                      }}
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      {isTunjanganLapangan && TUNJANGAN_LAPANGAN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {isBantuanLumpsum && LUMPSUM_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {isBantuanKomunikasi && KOMUNIKASI_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {isBantuanPerumahan && PERUMAHAN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="CUSTOM">-- Kategori Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {formData.category_name === '' && (
                    <Input
                      placeholder="Ketik nama kategori / jenis bantuan..."
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                      required
                      className="h-9.5 text-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. {isTunjanganLapangan ? 'Nominal Tunjangan' : isBantuanLumpsum ? 'Besaran Bantuan' : isBantuanKomunikasi ? 'Nominal Bantuan' : 'Nominal Bantuan Perumahan'} (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 1500000"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4. Periode / Frekuensi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    {isTunjanganLapangan && (
                      <>
                        <option value="BULANAN">Per Bulan (Bulanan)</option>
                        <option value="HARIAN">Per Hari (Harian)</option>
                      </>
                    )}
                    {isBantuanLumpsum && (
                      <>
                        <option value="PER_KASUS">Per Kasus / Kejadian</option>
                        <option value="SEUMUR_HIDUP">Seumur Hidup (Sekali Saja)</option>
                        <option value="TAHUNAN">Per Tahun</option>
                      </>
                    )}
                    {isBantuanKomunikasi && (
                      <>
                        <option value="BULANAN">Per Bulan (Bulanan)</option>
                        <option value="TAHUNAN">Per Tahun</option>
                      </>
                    )}
                    {isBantuanPerumahan && (
                      <>
                        <option value="BULANAN">Per Bulan (Bulanan)</option>
                        <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : (
            /* ================= FORM PENGOBATAN & PERSALINAN ================= */
            <>
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
                        {g.code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

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
            </>
          )}

          {/* Ketentuan Tambahan / Keterangan (Common) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ketentuan Tambahan / Keterangan
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Ketentuan khusus, persyaratan klaim, atau catatan kebijakan operasional..."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Status (Common) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Data
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

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
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
              {modalMode === 'create' ? 'Simpan Data' : 'Perbarui Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
