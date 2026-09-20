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
  Download,
  GitMerge,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { BenefitPlafondItem, SalaryGradeItem, GradeItem, SalaryGradeJenjangItem, MasterJenjangItem, PositionItem } from '@/types';
import { benefitPlafondService, salaryGradeService, jobGradeService, positionService, jenjangService, masterJenjangService, importExportService } from '@/services/masterDataService';
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


const PERSALINAN_CATEGORIES = [
  'Persalinan di Bidan',
  'Persalinan di Dokter',
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
  const isPersalinan = benefitType === 'PERSALINAN';
  const isPengobatan = benefitType === 'PENGOBATAN';
  const isSalaryGradeBased = !isKacamata && !isTunjanganLapangan && !isUangPerdin && !isBantuanKomunikasi;

  const [items, setItems] = useState<BenefitPlafondItem[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeItem[]>([]);
  const [jobGrades, setJobGrades] = useState<GradeItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [jenjangList, setJenjangList] = useState<SalaryGradeJenjangItem[]>([]);
  const [masterJenjangList, setMasterJenjangList] = useState<MasterJenjangItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Filters
  const [filterGolongan, setFilterGolongan] = useState<string>('ALL');
  const [filterBasis, setFilterBasis] = useState<'ALL' | 'LEVEL_JABATAN' | 'POSITION'>('ALL');
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
    basis: 'LEVEL_JABATAN' as 'LEVEL_JABATAN' | 'POSITION',
    salary_grade_id: 0,
    grade_id: 0,
    position_id: 0,
    salary_grade_jenjang_id: 0,
    master_jenjang_id: 0,
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
      } else if (isUangPerdin) {
        const [plafondRes, masterJenjangRes] = await Promise.all([
          benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType }),
          masterJenjangService.getMasterJenjangs(),
        ]);

        if (plafondRes.success && plafondRes.data) {
          setItems(plafondRes.data);
        }
        if (masterJenjangRes.success && masterJenjangRes.data) {
          setMasterJenjangList(masterJenjangRes.data);
        }
      } else if (isTunjanganLapangan) {
        const [plafondRes, jobGradeRes] = await Promise.all([
          benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType }),
          jobGradeService.getGrades(),
        ]);

        if (plafondRes.success && plafondRes.data) {
          setItems(plafondRes.data);
        }
        if (jobGradeRes.success && jobGradeRes.data) {
          setJobGrades(jobGradeRes.data);
        }
      } else if (isBantuanKomunikasi) {
        const [plafondRes, jobGradeRes, posRes] = await Promise.all([
          benefitPlafondService.getBenefitPlafonds({ benefit_type: benefitType }),
          jobGradeService.getGrades(),
          positionService.getPositions({ per_page: 500 }),
        ]);

        if (plafondRes.success && plafondRes.data) {
          setItems(plafondRes.data);
        }
        if (jobGradeRes.success && jobGradeRes.data) {
          setJobGrades(jobGradeRes.data);
        }
        if (posRes.success && posRes.data) {
          setPositions(Array.isArray(posRes.data) ? posRes.data : (posRes.data as any).data || []);
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
  }, [benefitType, isKacamata, isTunjanganLapangan, isUangPerdin, isBantuanKomunikasi, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstGradeId = salaryGrades.length > 0 ? salaryGrades[0].id : 0;
    const firstJobGradeId = jobGrades.length > 0 ? jobGrades[0].id : 0;
    const firstJenjangId = jenjangList.length > 0 ? jenjangList[0].id : 0;
    const firstMasterJenjangId = masterJenjangList.length > 0 ? masterJenjangList[0].id : 0;

    if (isKacamata) {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
    } else if (isUangPerdin) {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: firstMasterJenjangId,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'HARIAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isTunjanganLapangan) {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: firstJobGradeId,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'BULANAN',
        description: '',
        status: 'ACTIVE',
      });
    } else if (isBantuanLumpsum) {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: firstGradeId,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: firstJobGradeId,
        position_id: positions.length > 0 ? positions[0].id : 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
        basis: 'LEVEL_JABATAN',
        salary_grade_id: firstGradeId,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
    } else if (isPersalinan) {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: firstGradeId,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: PERSALINAN_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: '',
        period_type: 'PER_KASUS',
        description: '',
        status: 'ACTIVE',
      });
    } else {
      setFormData({
        id: 0,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: firstGradeId,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
    } else if (isUangPerdin) {
      setFormData({
        id: item.id,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: item.salary_grade_jenjang_id || item.jenjang?.id || 0,
        master_jenjang_id: item.master_jenjang_id || item.master_jenjang?.id || 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || 'HARIAN',
        description: '',
        status: item.status,
      });
    } else if (isTunjanganLapangan) {
      setFormData({
        id: item.id,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: item.grade_id || item.grade?.id || 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: '',
        zone_name: '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || 'BULANAN',
        description: '',
        status: item.status,
      });
    } else if (isBantuanKomunikasi) {
      const isPos = Boolean(item.position_id || item.position);
      setFormData({
        id: item.id,
        basis: isPos ? 'POSITION' : 'LEVEL_JABATAN',
        salary_grade_id: 0,
        grade_id: item.grade_id || (item.grade as any)?.id || (jobGrades[0]?.id || 0),
        position_id: item.position_id || item.position?.id || (positions[0]?.id || 0),
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: item.category_name || KOMUNIKASI_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || 'BULANAN',
        description: item.description || '',
        status: item.status,
      });
    } else if (isPersalinan) {
      setFormData({
        id: item.id,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: item.salary_grade_id || item.salary_grade?.id || 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
        lens_type: '',
        frame_amount: '',
        lens_amount: '',
        category_name: item.category_name || PERSALINAN_CATEGORIES[0],
        zone_name: '',
        marital_category: 'SEMUA',
        amount: String(item.amount || ''),
        period_type: (item.period_type as any) || 'PER_KASUS',
        description: item.description || '',
        status: item.status,
      });
    } else {
      setFormData({
        id: item.id,
        basis: 'LEVEL_JABATAN',
        salary_grade_id: item.salary_grade_id || item.salary_grade?.id || 0,
        grade_id: 0,
        position_id: 0,
        salary_grade_jenjang_id: 0,
        master_jenjang_id: 0,
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
    } else if (isUangPerdin) {
      if (!formData.master_jenjang_id || formData.master_jenjang_id === 0) {
        toast.warning('Pilih Master Jenjang terlebih dahulu.', 'Form Belum Lengkap');
        return;
      }
      if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
        toast.warning('Nominal uang perdin harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
    } else if (isTunjanganLapangan) {
      if (!formData.grade_id || formData.grade_id === 0) {
        toast.warning('Pilih Level Jabatan terlebih dahulu.', 'Form Belum Lengkap');
        return;
      }
      if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
        toast.warning('Nominal tunjangan harus diisi dengan angka valid.', 'Form Belum Lengkap');
        return;
      }
    } else if (isBantuanKomunikasi) {
      if (formData.basis === 'LEVEL_JABATAN') {
        if (!formData.grade_id || formData.grade_id === 0) {
          toast.warning('Pilih Level Jabatan terlebih dahulu.', 'Form Belum Lengkap');
          return;
        }
      } else {
        if (!formData.position_id || formData.position_id === 0) {
          toast.warning('Pilih Posisi / Jabatan Spesifik terlebih dahulu.', 'Form Belum Lengkap');
          return;
        }
      }
      if (!formData.category_name || !formData.category_name.trim()) {
        toast.warning('Kategori bantuan komunikasi harus diisi.', 'Form Belum Lengkap');
        return;
      }
      if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
        toast.warning('Nominal bantuan komunikasi harus diisi dengan angka valid.', 'Form Belum Lengkap');
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
      if (isPersalinan) {
        if (!formData.category_name || !formData.category_name.trim()) {
          toast.warning('Kriteria persalinan harus diisi.', 'Form Belum Lengkap');
          return;
        }
      } else if (isBantuanLumpsum || isBantuanPerumahan) {
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
          master_jenjang_id: Number(formData.master_jenjang_id),
          salary_grade_jenjang_id: undefined,
          category_name: null as any,
          zone_name: null as any,
          amount: parseFloat(formData.amount),
          marital_category: 'SEMUA',
          period_type: formData.period_type || 'HARIAN',
          description: undefined,
          status: formData.status,
        };
      } else if (isTunjanganLapangan) {
        payload = {
          benefit_type: benefitType,
          grade_id: Number(formData.grade_id),
          category_name: null as any,
          zone_name: null as any,
          amount: parseFloat(formData.amount),
          marital_category: 'SEMUA',
          period_type: formData.period_type || 'BULANAN',
          description: undefined,
          status: formData.status,
        };
      } else if (isBantuanKomunikasi) {
        payload = {
          benefit_type: benefitType,
          grade_id: formData.basis === 'LEVEL_JABATAN' ? Number(formData.grade_id) : undefined,
          position_id: formData.basis === 'POSITION' ? Number(formData.position_id) : undefined,
          salary_grade_id: undefined,
          category_name: formData.category_name.trim(),
          amount: parseFloat(formData.amount),
          marital_category: 'SEMUA',
          period_type: formData.period_type,
          description: formData.description.trim() || undefined,
          status: formData.status,
        };
      } else if (isBantuanLumpsum || isBantuanPerumahan || isPersalinan) {
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
      const mjName = item.master_jenjang?.name || item.jenjang?.name || `ID ${item.master_jenjang_id || item.salary_grade_jenjang_id}`;
      const mjLvl = item.master_jenjang?.level ? `(Level ${item.master_jenjang.level})` : '';
      confirmMsg = `Apakah Anda yakin ingin menghapus tarif uang perdin untuk Master Jenjang "${mjName}" ${mjLvl} senilai ${formatRupiah(item.amount)}?`;
    } else if (isTunjanganLapangan) {
      const lvlName = item.grade?.name || item.grade?.code || `ID ${item.grade_id}`;
      confirmMsg = `Apakah Anda yakin ingin menghapus tunjangan lapangan Level Jabatan "${lvlName}" senilai ${formatRupiah(item.amount)}?`;
    } else if (isBantuanLumpsum) {
      confirmMsg = `Apakah Anda yakin ingin menghapus bantuan lumpsum Golongan "${golName}" (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
    } else if (isBantuanKomunikasi) {
      const criteriaName = item.position_id || item.position
        ? `Posisi "${item.position?.title || item.position?.code || 'ID ' + item.position_id}"`
        : `Level Jabatan "${(item.grade as GradeItem)?.name || item.grade?.code || 'ID ' + item.grade_id}"`;
      confirmMsg = `Apakah Anda yakin ingin menghapus bantuan komunikasi untuk ${criteriaName} (${item.category_name}) senilai ${formatRupiah(item.amount)}?`;
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

  // Distinct category names for Persalinan, Lumpsum, Komunikasi, Perumahan
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    if (isPersalinan) PERSALINAN_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanLumpsum) LUMPSUM_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanKomunikasi) KOMUNIKASI_CATEGORIES.forEach((c) => set.add(c));
    if (isBantuanPerumahan) PERUMAHAN_CATEGORIES.forEach((c) => set.add(c));
    items.forEach((item) => {
      if (item.category_name) set.add(item.category_name);
    });
    return Array.from(set);
  }, [items, isPersalinan, isBantuanLumpsum, isBantuanKomunikasi, isBantuanPerumahan]);

  // Distinct zones
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.zone_name) set.add(item.zone_name);
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

      if (isUangPerdin) {
        const mj = item.master_jenjang;
        const j = item.jenjang;
        const mjName = (mj?.name || j?.name || '').toLowerCase();
        const mjCode = (mj?.code || '').toLowerCase();
        const mjLvl = mj?.level !== undefined && mj?.level !== null ? `level ${mj.level}` : '';

        const matchSearch =
          !search ||
          mjName.includes(q) ||
          mjCode.includes(q) ||
          mjLvl.includes(q);

        const targetId = item.master_jenjang_id || item.master_jenjang?.id || item.salary_grade_jenjang_id || item.jenjang?.id;
        const matchGolongan = filterGolongan === 'ALL' || String(targetId) === filterGolongan;

        return matchSearch && matchGolongan && matchStatus;
      }

      if (isBantuanKomunikasi) {
        const isPos = Boolean(item.position_id || item.position);
        const posTitle = (item.position?.title || '').toLowerCase();
        const posCode = (item.position?.code || '').toLowerCase();
        const posDept = (item.position?.department?.name || '').toLowerCase();
        const lvl = item.grade as GradeItem | undefined;
        const lvlName = (lvl?.name || '').toLowerCase();
        const lvlCode = (lvl?.code || '').toLowerCase();
        const lvlPangkat = (lvl?.pangkat || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const cat = (item.category_name || '').toLowerCase();

        const matchSearch =
          !search ||
          posTitle.includes(q) ||
          posCode.includes(q) ||
          posDept.includes(q) ||
          lvlName.includes(q) ||
          lvlCode.includes(q) ||
          lvlPangkat.includes(q) ||
          desc.includes(q) ||
          cat.includes(q);

        const matchBasis =
          filterBasis === 'ALL' ||
          (filterBasis === 'POSITION' && isPos) ||
          (filterBasis === 'LEVEL_JABATAN' && !isPos);

        const matchCategory = filterCategory === 'ALL' || item.category_name === filterCategory;

        return matchSearch && matchBasis && matchCategory && matchStatus;
      }

      const gol = item.salary_grade;
      const lvl = item.grade as GradeItem | undefined;
      const golName = (gol?.name || '').toLowerCase();
      const golCode = (gol?.code || '').toLowerCase();
      const lvlName = (lvl?.name || '').toLowerCase();
      const lvlCode = (lvl?.code || '').toLowerCase();
      const lvlPangkat = (lvl?.pangkat || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.category_name || '').toLowerCase();
      const zone = (item.zone_name || '').toLowerCase();
      const marital = (item.marital_category || '').toLowerCase();

      const matchSearch =
        !search ||
        golName.includes(q) ||
        golCode.includes(q) ||
        lvlName.includes(q) ||
        lvlCode.includes(q) ||
        lvlPangkat.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        zone.includes(q) ||
        marital.includes(q);

      const targetId = isTunjanganLapangan ? (item.grade_id || item.grade?.id) : (item.salary_grade_id || item.salary_grade?.id);
      const matchGolongan = filterGolongan === 'ALL' || String(targetId) === filterGolongan;

      let matchCategory = true;
      if (isPengobatan) {
        matchCategory = filterCategory === 'ALL' || item.marital_category === filterCategory;
      } else if (!isTunjanganLapangan) {
        matchCategory = filterCategory === 'ALL' || item.category_name === filterCategory;
      }

      return matchSearch && matchGolongan && matchCategory && matchStatus;
    });
  }, [
    items,
    search,
    isKacamata,
    isTunjanganLapangan,
    isBantuanKomunikasi,
    isPersalinan,
    isPengobatan,
    isUangPerdin,
    filterLensType,
    filterGolongan,
    filterBasis,
    filterCategory,
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
    defaultSortField: isKacamata ? 'lens_type' : isUangPerdin ? 'master_jenjang.level' : isTunjanganLapangan ? 'grade.code' : isBantuanKomunikasi ? 'category_name' : 'salary_grade.code',
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
    : isBantuanKomunikasi
      ? Boolean(search || filterBasis !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL')
      : isTunjanganLapangan || isUangPerdin
        ? Boolean(search || filterGolongan !== 'ALL' || filterStatus !== 'ALL')
        : Boolean(search || filterGolongan !== 'ALL' || filterCategory !== 'ALL' || filterStatus !== 'ALL');

  const handleResetFilter = () => {
    setSearch('');
    setFilterStatus('ALL');
    setFilterLensType('ALL');
    setFilterBasis('ALL');
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
    if (isUangPerdin) return 'Cari master jenjang, kode, level...';
    if (isTunjanganLapangan) return 'Cari level jabatan, pangkat...';
    if (isPersalinan) return 'Cari golongan, kriteria persalinan...';
    if (isBantuanLumpsum) return 'Cari golongan, jenis bantuan lumpsum...';
    if (isBantuanKomunikasi) return 'Cari level jabatan, posisi spesifik, paket data...';
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

            {/* 2. Filter Golongan / Level / Jenjang Jabatan */}
            {isUangPerdin ? (
              <div className="relative min-w-[200px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterGolongan}
                  onChange={(e) => setFilterGolongan(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Master Jenjang</option>
                  {masterJenjangList.map((mj) => (
                    <option key={mj.id} value={String(mj.id)}>
                      {mj.code} - {mj.name}{mj.level ? ` (Level ${mj.level})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            ) : isTunjanganLapangan ? (
              <div className="relative min-w-[200px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterGolongan}
                  onChange={(e) => setFilterGolongan(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Level Jabatan</option>
                  {jobGrades.map((g) => (
                    <option key={g.id} value={String(g.id)}>
                      {g.code} - {g.name}{g.pangkat ? ` (${g.pangkat})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            ) : isBantuanKomunikasi ? (
              <div className="relative min-w-[210px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterBasis}
                  onChange={(e) => setFilterBasis(e.target.value as any)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">Semua Basis (Level & Posisi)</option>
                  <option value="LEVEL_JABATAN">Basis Level Jabatan</option>
                  <option value="POSITION">Basis Posisi Spesifik</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </div>
            ) : isSalaryGradeBased ? (
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
            ) : null}

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
            ) : isPengobatan ? (
              /* Filter Kategori Pernikahan (Khusus Pengobatan) */
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
            ) : isTunjanganLapangan || isUangPerdin ? null : (
              /* Filter Kategori / Jenis Bantuan / Kriteria Persalinan */
              <div className="relative min-w-[190px] group">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full h-9 appearance-none pl-8 pr-8 text-xs font-medium bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-700 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                >
                  <option value="ALL">{isPersalinan ? 'Semua Kriteria Persalinan' : 'Semua Kategori / Jenis'}</option>
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
                    <SortableHeader label="Kode Jenjang" field="master_jenjang.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Master Jenjang" field="master_jenjang.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Level Jenjang" field="master_jenjang.level" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Besaran Uang Perdin" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              ) : isTunjanganLapangan ? (
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode Level" field="grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Level Jabatan" field="grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Pangkat" field="grade.pangkat" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-right">
                    <SortableHeader label="Besaran Tunjangan" field="amount" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Periode" field="period_type" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
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
                  <th className="px-5 py-3.5 text-center">
                    <SortableHeader label="Basis" field="position_id" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Kriteria (Level / Posisi)" field="grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Detail / Departemen</th>
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
              ) : isPersalinan ? (
                /* Plafon Persalinan */
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="salary_grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Golongan" field="salary_grade.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Kriteria Persalinan" field="category_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
              ) : (
                /* Pengobatan */
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
                  <td colSpan={isTunjanganLapangan || isUangPerdin ? 7 : 8} className="px-5 py-12 text-center text-slate-400">
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
                /* Uang Perdin Rows (Berdasarkan Master Jenjang) */
                paginatedData.map((item) => {
                  const mj = item.master_jenjang;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <Badge variant="outline" className="font-mono bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                          {mj?.code || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <GitMerge className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{mj?.name || item.jenjang?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {mj?.level !== undefined && mj?.level !== null ? (
                          <Badge variant="primary" className="font-semibold text-[11px]">
                            Level {mj.level}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                        {getPeriodLabel(item.period_type)}
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
              ) : isTunjanganLapangan ? (
                /* Tunjangan Lapangan Rows (Berdasarkan Level Jabatan) */
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <Badge variant="outline" className="font-mono bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                        {item.grade?.code || item.salary_grade?.code || '-'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <span>{item.grade?.name || item.salary_grade?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {(() => {
                        const lvl = item.grade as GradeItem | undefined;
                        return (
                          <Badge variant={lvl?.pangkat === 'Staff' ? 'primary' : 'neutral'}>
                            {lvl?.pangkat || '-'}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(item.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-700 dark:text-slate-300">
                      {getPeriodLabel(item.period_type)}
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
              ) : isBantuanKomunikasi ? (
                /* Bantuan Komunikasi Rows (Dual Kriteria: Level Jabatan vs Posisi) */
                paginatedData.map((item) => {
                  const isPos = Boolean(item.position_id || item.position);
                  const lvl = item.grade as GradeItem | undefined;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-center">
                        {isPos ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-semibold inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            Posisi
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold inline-flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            Level Jabatan
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isPos ? (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {item.position?.title || '-'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {item.position?.code}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {lvl?.name || item.grade?.name || '-'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {lvl?.code || item.grade?.code}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {isPos ? (
                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            <span>{item.position?.department?.name || item.position?.site?.name || '-'}</span>
                          </div>
                        ) : (
                          <Badge variant={lvl?.pangkat === 'Staff' ? 'primary' : 'neutral'}>
                            {lvl?.pangkat || '-'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-medium">
                          {item.category_name || '-'}
                        </Badge>
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
                /* Lumpsum, Perumahan, Pengobatan, Persalinan */
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
                        {isBantuanLumpsum ? (
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
                        ) : isPersalinan ? (
                          <Badge variant="outline" className="bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800 font-medium">
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
            /* ================= FORM KHUSUS UANG PERDIN (MASTER JENJANG) ================= */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Master Jenjang <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.master_jenjang_id}
                    onChange={(e) => setFormData({ ...formData, master_jenjang_id: Number(e.target.value) })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="0" disabled>-- Pilih Master Jenjang --</option>
                    {masterJenjangList.map((mj) => (
                      <option key={mj.id} value={mj.id}>
                        {mj.code} - {mj.name} {mj.level ? `(Level ${mj.level})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
                {formData.master_jenjang_id > 0 && (() => {
                  const selectedMj = masterJenjangList.find((m) => m.id === Number(formData.master_jenjang_id));
                  if (!selectedMj) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-lg border border-blue-100 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20 text-xs flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500">Kode:</span>
                        <Badge variant="outline" className="font-mono font-semibold bg-white dark:bg-slate-800">
                          {selectedMj.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="text-slate-500">Jenjang:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedMj.name}</span>
                      </div>
                      {selectedMj.level !== undefined && selectedMj.level !== null && (
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="text-slate-500">Hierarki Level:</span>
                          <Badge variant="primary" className="font-bold">
                            Level {selectedMj.level}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Besaran Uang Perdin (Per Hari) <span className="text-rose-500">*</span>
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
                  3. Periode / Frekuensi <span className="text-rose-500">*</span>
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
          ) : isTunjanganLapangan ? (
            /* ================= FORM KHUSUS TUNJANGAN LAPANGAN (LEVEL JABATAN) ================= */
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  1. Level Jabatan <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.grade_id}
                    onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="0" disabled>-- Pilih Level Jabatan --</option>
                    {jobGrades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.code} - {g.name}{g.pangkat ? ` (${g.pangkat})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  2. Nominal Tunjangan (Rp) <span className="text-rose-500">*</span>
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
                  3. Periode / Frekuensi <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center group">
                  <select
                    value={formData.period_type}
                    onChange={(e) => setFormData({ ...formData, period_type: e.target.value as any })}
                    required
                    className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                  >
                    <option value="BULANAN">Per Bulan (Bulanan)</option>
                    <option value="HARIAN">Per Hari (Harian)</option>
                    <option value="PER_KASUS">Per Kasus / Per Penugasan</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : isBantuanKomunikasi ? (
            /* ================= FORM KHUSUS BANTUAN KOMUNIKASI (DUAL KRITERIA: LEVEL VS POSISI) ================= */
            <>
              {/* Selector Basis Penentuan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  1. Pilih Basis Penentuan Bantuan Komunikasi <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        basis: 'LEVEL_JABATAN',
                        grade_id: prev.grade_id || (jobGrades[0]?.id || 0),
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${formData.basis === 'LEVEL_JABATAN'
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <UserCheck className={`h-4 w-4 ${formData.basis === 'LEVEL_JABATAN' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span>Berdasarkan Level Jabatan</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Berlaku umum untuk seluruh karyawan di level jabatan ini (e.g. Manager, Supervisor).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        basis: 'POSITION',
                        position_id: prev.position_id || (positions[0]?.id || 0),
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 ${formData.basis === 'POSITION'
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      <Briefcase className={`h-4 w-4 ${formData.basis === 'POSITION' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                      <span>Berdasarkan Posisi Spesifik</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Berlaku khusus untuk posisi tertentu (e.g. Kepala Teknik Tambang, Superintendent).
                    </p>
                  </button>
                </div>
              </div>

              {/* Kriteria Input (Level atau Posisi) */}
              {formData.basis === 'LEVEL_JABATAN' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2. Level Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <select
                      value={formData.grade_id}
                      onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                      required
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      <option value="0" disabled>-- Pilih Level Jabatan --</option>
                      {jobGrades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.code} - {g.name}{g.pangkat ? ` (${g.pangkat})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2. Posisi / Jabatan Spesifik <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center group">
                    <select
                      value={formData.position_id}
                      onChange={(e) => setFormData({ ...formData, position_id: Number(e.target.value) })}
                      required
                      className="w-full h-9.5 appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50/40 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600"
                    >
                      <option value="0" disabled>-- Pilih Posisi Spesifik --</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.title}{p.department?.name ? ` [${p.department.name}]` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              )}

              {/* Kategori Komunikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  3. Kategori Bantuan Komunikasi <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={
                        KOMUNIKASI_CATEGORIES.includes(formData.category_name)
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
                      {KOMUNIKASI_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="CUSTOM">-- Kategori Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {(!KOMUNIKASI_CATEGORIES.includes(formData.category_name) || formData.category_name === '') && (
                    <Input
                      placeholder="Ketik kategori / jenis paket komunikasi..."
                      value={formData.category_name}
                      onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                      required
                      className="h-9.5 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Nominal Bantuan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  4. Nominal Bantuan Komunikasi (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 500000"
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

              {/* Periode / Frekuensi */}
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
                    <option value="BULANAN">Per Bulan (Bulanan)</option>
                    <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                    <option value="PER_KASUS">Per Kasus / Insidental</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : isBantuanLumpsum || isBantuanPerumahan ? (
            /* ================= FORM KHUSUS LUMPSUM & PERUMAHAN ================= */
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
                  2. {isBantuanLumpsum ? 'Jenis Bantuan Lumpsum' : 'Kategori Bantuan Perumahan'} <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={
                        (isBantuanLumpsum && LUMPSUM_CATEGORIES.includes(formData.category_name)) ||
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
                      {isBantuanLumpsum && LUMPSUM_CATEGORIES.map((c) => (
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
                  3. {isBantuanLumpsum ? 'Besaran Bantuan' : 'Nominal Bantuan Perumahan'} (Rp) <span className="text-rose-500">*</span>
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
                    {isBantuanLumpsum && (
                      <>
                        <option value="PER_KASUS">Per Kasus / Kejadian</option>
                        <option value="SEUMUR_HIDUP">Seumur Hidup (Sekali Saja)</option>
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
          ) : isPersalinan ? (
            /* ================= FORM KHUSUS PLAFON PERSALINAN ================= */
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
                  2. Kriteria Persalinan <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative flex items-center group">
                    <select
                      value={
                        PERSALINAN_CATEGORIES.includes(formData.category_name)
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
                      {PERSALINAN_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="CUSTOM">-- Kriteria Lainnya (Ketik Manual) --</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>

                  {(!PERSALINAN_CATEGORIES.includes(formData.category_name) || formData.category_name === '') && (
                    <Input
                      placeholder="Ketik kriteria persalinan..."
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
                  3. Nominal Plafon (Rp) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Contoh: 8000000"
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
                    <option value="PER_KASUS">Per Kasus / Kejadian</option>
                    <option value="TAHUNAN">Per Tahun (Tahunan)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          ) : (
            /* ================= FORM KHUSUS PENGOBATAN ================= */
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
                    <option value="2_TAHUNAN">Per 2 Tahun</option>
                    <option value="SEUMUR_HIDUP">Seumur Hidup</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </>
          )}

          {/* Ketentuan Tambahan / Keterangan (Common) */}
          {!isTunjanganLapangan && !isUangPerdin && (
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
          )}

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
