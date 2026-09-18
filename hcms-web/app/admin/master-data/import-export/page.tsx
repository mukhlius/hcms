'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCheck,
  Table,
  Check,
  Database,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  Network,
  Clock,
  User,
  ShieldCheck,
  FileDown,
  History,
  Search,
  ExternalLink,
  ShieldAlert,
  Info,
  HeartPulse,
  Glasses,
  Baby,
  HardHat,
  PlaneTakeoff,
  Coins,
  Smartphone,
  Compass,
  Users,
  Home
} from 'lucide-react';
import { importExportService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { toast } from '@/stores/alertStore';

interface EntityMeta {
  id: string;
  name: string;
  category: 'Organisasi' | 'Benefit & Plafon' | 'Jabatan & Formasi' | 'Operasional' | 'Akses & Akun';
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  columns: string[];
}

export const FIELD_DEFINITIONS: Record<string, { label: string; required?: boolean; aliases: string[] }> = {
  // Common
  code: { label: 'Kode Entitas (code)', required: true, aliases: ['kode', 'code', 'kode unik', 'kode entitas', 'kode perusahaan', 'kode site', 'kode departemen', 'kode seksi', 'kode posisi', 'kode golongan', 'kode level', 'kode status'] },
  name: { label: 'Nama Entitas (name)', required: true, aliases: ['nama', 'name', 'nama entitas', 'nama lengkap', 'nama perusahaan', 'nama site', 'nama departemen', 'nama seksi', 'nama posisi', 'nama golongan', 'nama level', 'nama status', 'nama area'] },
  status: { label: 'Status (status)', required: false, aliases: ['status', 'aktif', 'is_active', 'status akun'] },
  description: { label: 'Deskripsi / Keterangan (description)', required: false, aliases: ['deskripsi', 'description', 'keterangan', 'fungsi', 'ketentuan', 'cakupan', 'fungsi / keterangan', 'ketentuan / cakupan', 'ketentuan / keterangan'] },

  // Perusahaan & Site
  short_name: { label: 'Nama Singkat (short_name)', required: false, aliases: ['nama singkat', 'short_name', 'alias', 'singkatan'] },
  tax_identifier: { label: 'NPWP Perusahaan (tax_identifier)', required: false, aliases: ['npwp', 'tax_identifier', 'nomor npwp', 'tax id'] },
  address: { label: 'Alamat Lengkap (address)', required: false, aliases: ['alamat', 'address', 'alamat lengkap', 'lokasi'] },
  company_code: { label: 'Kode Perusahaan Induk (company_code)', required: false, aliases: ['perusahaan', 'company_code', 'perusahaan induk', 'kode perusahaan', 'perusahaan_induk'] },
  site_code: { 
    label: 'Site Tambang / Fasilitas (site_code)', 
    required: false, 
    aliases: [
      'site', 
      'site_code', 
      'kode site', 
      'site tambang', 
      'site operasional', 
      'site tambang/fasilitas', 
      'site tambang / fasilitas', 
      'site tambang / fasilitas *',
      'site fasilitas',
      'nama site',
      'site name',
      'lokasi site',
      'kode site operasional'
    ] 
  },

  // Departemen & Seksi & Posisi
  department_code: { label: 'Kode Departemen (department_code)', required: false, aliases: ['departemen', 'department_code', 'kode departemen', 'departemen induk'] },
  section_code: { label: 'Kode Seksi Lapangan (section_code)', required: false, aliases: ['seksi', 'section_code', 'kode seksi', 'section', 'section (seksi)'] },
  grade_code: { label: 'Kode Level/Grade (grade_code)', required: false, aliases: ['level', 'grade', 'grade_code', 'level/grade', 'level grade'] },
  title: { label: 'Nama / Judul Posisi (title)', required: true, aliases: ['judul', 'title', 'nama posisi', 'nama jabatan', 'posisi'] },
  reports_to_code: { label: 'Kode Posisi Atasan (reports_to_code)', required: false, aliases: ['atasan', 'reports_to', 'reports_to_code', 'atasan langsung', 'posisi atasan'] },
  approved_headcount: { label: 'Kuota MPP / Headcount (approved_headcount)', required: false, aliases: ['mpp', 'headcount', 'approved_headcount', 'kuota'] },

  // Golongan & Level & Hubungan Kerja
  housing_allowance: { label: 'Bantuan Perumahan (housing_allowance)', required: false, aliases: ['perumahan', 'housing_allowance', 'bantuan perumahan'] },
  level: { label: 'Tingkat Level (level)', required: true, aliases: ['tingkat level', 'level', 'tingkatan'] },
  pangkat: { label: 'Pangkat Pegawai (pangkat)', required: false, aliases: ['pangkat', 'golongan pangkat', 'staff/non staff'] },
  is_permanent: { label: 'Sifat Hubungan / Permanen (is_permanent)', required: false, aliases: ['sifat', 'is_permanent', 'permanent', 'tetap', 'sifat hubungan'] },

  // Area Kerja & POH & Status Menikah
  risk_level: { label: 'Tingkat Risiko K3 (risk_level)', required: false, aliases: ['risiko', 'risk_level', 'risiko k3', 'tingkat risiko'] },
  destination_airport: { label: 'Bandara Tujuan (destination_airport)', required: false, aliases: ['bandara', 'destination_airport', 'bandara tujuan'] },
  additional_travel_days: { label: 'Tambahan Hari Cuti (additional_travel_days)', required: false, aliases: ['hari perjalanan', 'additional_travel_days', 'cuti perjalanan', 'hari perjalanan cuti'] },
  category: { label: 'Kategori Pernikahan (category)', required: true, aliases: ['kategori', 'category', 'kategori status', 'kategori pernikahan'] },

  // Benefit Plafon
  salary_grade_code: { label: 'Kode Golongan Gaji (salary_grade_code)', required: true, aliases: ['kode golongan', 'salary_grade_code', 'golongan', 'grade'] },
  marital_category: { label: 'Kategori Pernikahan (marital_category)', required: true, aliases: ['kategori pernikahan', 'marital_category', 'status pernikahan'] },
  amount: { label: 'Nominal Plafon (amount)', required: true, aliases: ['nominal', 'amount', 'nominal plafon', 'plafon', 'total plafon'] },
  period_type: { label: 'Periode Plafon (period_type)', required: false, aliases: ['periode', 'period_type', 'jangka waktu'] },
  lens_type: { label: 'Kriteria / Tipe Lensa (lens_type)', required: true, aliases: ['kriteria lensa', 'lens_type', 'tipe lensa', 'lensa', 'kriteria / jenis lensa'] },
  frame_amount: { label: 'Bantuan Biaya Frame (frame_amount)', required: true, aliases: ['bantuan frame', 'frame_amount', 'frame'] },
  lens_amount: { label: 'Bantuan Biaya Lensa (lens_amount)', required: true, aliases: ['bantuan lensa', 'lens_amount', 'lensa'] },
  category_name: { label: 'Kategori / Jenis Bantuan (category_name)', required: false, aliases: ['kategori penempatan', 'jenis bantuan lumpsum', 'kategori komunikasi', 'komponen perdin', 'kategori_name', 'kategori', 'jenis bantuan', 'komponen'] },
  zone_name: { label: 'Zona / Wilayah Perdin (zone_name)', required: false, aliases: ['zona / wilayah', 'zona', 'wilayah', 'zone_name', 'zona wilayah'] },

  // Shift & User
  start_time: { label: 'Jam Masuk (start_time)', required: false, aliases: ['jam masuk', 'start_time', 'mulai'] },
  end_time: { label: 'Jam Pulang (end_time)', required: false, aliases: ['jam pulang', 'end_time', 'selesai'] },
  break_minutes: { label: 'Istirahat Menit (break_minutes)', required: false, aliases: ['istirahat', 'break_minutes', 'durasi istirahat', 'istirahat (menit)'] },
  username: { label: 'Username Akun (username)', required: true, aliases: ['username', 'nama pengguna', 'user id'] },
  email: { label: 'Alamat Email (email)', required: true, aliases: ['email', 'surel', 'alamat surel'] },
  data_scope: { label: 'Cakupan Akses Data (data_scope)', required: false, aliases: ['cakupan', 'data_scope', 'akses data', 'cakupan akses'] },
};

const ENTITY_CATALOG: EntityMeta[] = [
  // 1. ORGANISASI
  {
    id: 'companies',
    name: 'Perusahaan',
    category: 'Organisasi',
    description: 'Data legalitas holding, anak perusahaan, NPWP, dan kantor operasional.',
    icon: <Building2 className="h-5 w-5 text-blue-600" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    columns: ['code', 'name', 'short_name', 'tax_identifier', 'address', 'status'],
  },
  {
    id: 'sites',
    name: 'Site Operasional',
    category: 'Organisasi',
    description: 'Area konsesi tambang batubara, pit operasional, pelabuhan, dan fasilitas camp.',
    icon: <MapPin className="h-5 w-5 text-indigo-600" />,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    columns: ['company_code', 'code', 'short_name', 'name', 'address', 'status'],
  },
  {
    id: 'departments',
    name: 'Departemen',
    category: 'Organisasi',
    description: 'Struktur departemen operasional pit, engineering tambang, HR, dan SHE.',
    icon: <Network className="h-5 w-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    columns: ['company_code', 'site_code', 'code', 'name', 'description', 'status'],
  },
  {
    id: 'sections',
    name: 'Seksi / Section',
    category: 'Organisasi',
    description: 'Unit kerja seksi lini operasional di bawah naungan departemen terkait.',
    icon: <Layers className="h-5 w-5 text-teal-600" />,
    iconBg: 'bg-teal-50 dark:bg-teal-950/50',
    columns: ['company_code', 'department_code', 'site_code', 'code', 'name', 'description', 'status'],
  },
  {
    id: 'positions',
    name: 'Posisi & Formasi Jabatan',
    category: 'Organisasi',
    description: 'Spesifikasi posisi formasi, kuota approved headcount/MPP, dan garis atasan.',
    icon: <Briefcase className="h-5 w-5 text-purple-600" />,
    iconBg: 'bg-purple-50 dark:bg-purple-950/50',
    columns: ['site_code', 'department_code', 'section_code', 'grade_code', 'code', 'title', 'reports_to_code', 'approved_headcount', 'status'],
  },
  {
    id: 'salary-grades',
    name: 'Golongan Karyawan',
    category: 'Organisasi',
    description: 'Master golongan karyawan dan ketentuan tunjangan bantuan perumahan.',
    icon: <Table className="h-5 w-5 text-amber-600" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    columns: ['code', 'name', 'housing_allowance', 'status'],
  },
  {
    id: 'levels',
    name: 'Level Jabatan',
    category: 'Organisasi',
    description: 'Tingkatan jenjang karir manajerial, pimpinan, dan pangkat karyawan.',
    icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    columns: ['code', 'level', 'pangkat', 'name', 'description', 'status'],
  },
  {
    id: 'employment-types',
    name: 'Hubungan Kerja',
    category: 'Organisasi',
    description: 'Status ikatan kerja pegawai (PKWTT/Permanen, PKWT/Kontrak, Magang, Harian).',
    icon: <FileCheck className="h-5 w-5 text-green-600" />,
    iconBg: 'bg-green-50 dark:bg-green-950/50',
    columns: ['code', 'name', 'is_permanent', 'description', 'status'],
  },
  {
    id: 'work-areas',
    name: 'Area Kerja & Risiko K3',
    category: 'Organisasi',
    description: 'Zonasi area pit tambang, fasilitas pabrik/workshop, dan klasifikasi risiko K3.',
    icon: <MapPin className="h-5 w-5 text-rose-600" />,
    iconBg: 'bg-rose-50 dark:bg-rose-950/50',
    columns: ['code', 'name', 'description', 'risk_level', 'status'],
  },
  {
    id: 'poh',
    name: 'Titik Penerimaan (POH)',
    category: 'Organisasi',
    description: 'Point of Hire, bandara tujuan cuti roster, dan alokasi hari perjalanan.',
    icon: <Compass className="h-5 w-5 text-sky-600" />,
    iconBg: 'bg-sky-50 dark:bg-sky-950/50',
    columns: ['code', 'name', 'destination_airport', 'additional_travel_days', 'status'],
  },
  {
    id: 'marital-statuses',
    name: 'Status Menikah',
    category: 'Organisasi',
    description: 'Klasifikasi status perkawinan karyawan untuk acuan benefit dan perpajakan.',
    icon: <Users className="h-5 w-5 text-pink-600" />,
    iconBg: 'bg-pink-50 dark:bg-pink-950/50',
    columns: ['code', 'name', 'category', 'status'],
  },

  // 2. BENEFIT & PLAFON
  {
    id: 'plafon-pengobatan',
    name: 'Plafon Pengobatan',
    category: 'Benefit & Plafon',
    description: 'Plafon biaya rawat jalan & pengobatan per golongan gaji dan kategori nikah.',
    icon: <HeartPulse className="h-5 w-5 text-emerald-600" />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    columns: ['salary_grade_code', 'marital_category', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'plafon-kacamata',
    name: 'Plafon Kacamata',
    category: 'Benefit & Plafon',
    description: 'Bantuan biaya kacamata (frame dan lensa) berdasarkan kriteria tipe lensa.',
    icon: <Glasses className="h-5 w-5 text-cyan-600" />,
    iconBg: 'bg-cyan-50 dark:bg-cyan-950/50',
    columns: ['lens_type', 'frame_amount', 'lens_amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'plafon-persalinan',
    name: 'Plafon Persalinan',
    category: 'Benefit & Plafon',
    description: 'Plafon bantuan biaya persalinan normal/caesar per golongan gaji dan status nikah.',
    icon: <Baby className="h-5 w-5 text-amber-600" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    columns: ['salary_grade_code', 'marital_category', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'tunjangan-lapangan',
    name: 'Tunjangan Lapangan',
    category: 'Benefit & Plafon',
    description: 'Tunjangan penempatan kerja lapangan (pit tambang, hauling road, processing plant).',
    icon: <HardHat className="h-5 w-5 text-amber-600" />,
    iconBg: 'bg-amber-50 dark:bg-amber-950/50',
    columns: ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'uang-perdin',
    name: 'Uang Perdin',
    category: 'Benefit & Plafon',
    description: 'Tarif uang saku, makan, dan transport dinas per zona wilayah & golongan.',
    icon: <PlaneTakeoff className="h-5 w-5 text-blue-600" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    columns: ['salary_grade_code', 'zone_name', 'category_name', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'bantuan-lumpsum',
    name: 'Bantuan Lumpsum',
    category: 'Benefit & Plafon',
    description: 'Bantuan biaya relokasi site tambang, duka cita, dan bantuan darurat bencana.',
    icon: <Coins className="h-5 w-5 text-teal-600" />,
    iconBg: 'bg-teal-50 dark:bg-teal-950/50',
    columns: ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'bantuan-komunikasi',
    name: 'Bantuan Komunikasi',
    category: 'Benefit & Plafon',
    description: 'Bantuan pulsa on-call, paket data komunikasi lapangan, dan voucher kuota.',
    icon: <Smartphone className="h-5 w-5 text-indigo-600" />,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    columns: ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
  },
  {
    id: 'bantuan-perumahan',
    name: 'Bantuan Perumahan',
    category: 'Benefit & Plafon',
    description: 'Bantuan sewa perumahan dinas, tunjangan tempat tinggal mandiri, dan mess site tambang.',
    icon: <Home className="h-5 w-5 text-orange-600" />,
    iconBg: 'bg-orange-50 dark:bg-orange-950/50',
    columns: ['salary_grade_code', 'category_name', 'amount', 'period_type', 'description', 'status'],
  },

  // 3. OPERASIONAL & AKUN
  {
    id: 'shifts',
    name: 'Shift Operasional Tambang',
    category: 'Operasional',
    description: 'Jam masuk kerja bergilir pit lapangan, durasi istirahat, dan pengaturan lembur.',
    icon: <Clock className="h-5 w-5 text-violet-600" />,
    iconBg: 'bg-violet-50 dark:bg-violet-950/50',
    columns: ['code', 'name', 'start_time', 'end_time', 'break_minutes', 'status'],
  },
  {
    id: 'users',
    name: 'Akun Pengguna Sistem',
    category: 'Akses & Akun',
    description: 'Identitas akun login, email resmi, penugasan peranan, dan cakupan data (RBAC).',
    icon: <User className="h-5 w-5 text-blue-700" />,
    iconBg: 'bg-blue-50 dark:bg-blue-950/50',
    columns: ['username', 'name', 'email', 'status', 'data_scope'],
  },
];

const WIZARD_STEPS = [
  { step: 1, title: 'Unggah Berkas', desc: 'Pilih file CSV' },
  { step: 2, title: 'Pemetaan Kolom', desc: 'Cocokkan atribut' },
  { step: 3, title: 'Pratinjau Data', desc: 'Periksa isi berkas' },
  { step: 4, title: 'Validasi Sistem', desc: 'Uji integritas data' },
  { step: 5, title: 'Laporan Error', desc: 'Tinjau baris salah' },
  { step: 6, title: 'Eksekusi Impor', desc: 'Transaksi DB' },
  { step: 7, title: 'Selesai', desc: 'Hasil & audit trail' },
];

export default function ImportExportCenterPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'templates' | 'history'>('import');

  // Export search filter
  const [exportSearch, setExportSearch] = useState('');
  const [exportCategory, setExportCategory] = useState('ALL');
  const [downloadingEntity, setDownloadingEntity] = useState<string | null>(null);

  // Template download state
  const [downloadingTemplate, setDownloadingTemplate] = useState<string | null>(null);

  // Import Wizard State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEntity, setSelectedEntity] = useState<string>('companies');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    code: '',
    name: '',
  });
  const [importStrategy, setImportStrategy] = useState<'STRICT' | 'PARTIAL'>('STRICT');

  const [validationResult, setValidationResult] = useState<{
    is_valid: boolean;
    total: number;
    valid_count: number;
    error_count: number;
    errors: Array<{ row: number; field: string; value: any; message: string }>;
    valid_data: any[];
  } | null>(null);

  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported_count: number;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch History Query
  const { data: historyData, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['import-export-history'],
    queryFn: () => importExportService.getHistory(),
    enabled: activeTab === 'history',
  });

  // Handle Export Download
  const handleExportDownload = async (entityId: string, entityName: string) => {
    try {
      setDownloadingEntity(entityId);
      await importExportService.downloadExport(entityId);
      toast.success(`Data ${entityName} berhasil diekspor ke format CSV.`, 'Ekspor Sukses');
      queryClient.invalidateQueries({ queryKey: ['import-export-history'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengekspor data entitas.', 'Gagal Mengekspor');
    } finally {
      setDownloadingEntity(null);
    }
  };

  // Handle Template Download
  const handleTemplateDownload = async (entityId: string, entityName: string) => {
    try {
      setDownloadingTemplate(entityId);
      await importExportService.downloadTemplate(entityId);
      toast.success(`Template impor resmi untuk ${entityName} berhasil diunduh.`, 'Template Diunduh');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunduh template.', 'Gagal');
    } finally {
      setDownloadingTemplate(null);
    }
  };

  // Helper to auto-map CSV headers to entity target columns based on aliases
  const autoMapHeaders = (csvHeaders: string[], entityId: string) => {
    const ent = ENTITY_CATALOG.find(e => e.id === entityId);
    const targetCols = ent ? ent.columns : ['code', 'name'];
    const newMapping: Record<string, string> = {};

    targetCols.forEach(col => {
      const def = FIELD_DEFINITIONS[col];
      const aliases = def ? [col, ...def.aliases] : [col];

      const found = csvHeaders.find(h => {
        const rawH = h.trim().toLowerCase();
        // Exact raw check first
        if (aliases.some(a => a.trim().toLowerCase() === rawH)) {
          return true;
        }

        // Normalized check (collapsing symbols, slashes, extra spaces)
        const cleanH = rawH.replace(/[^a-z0-9_]+/g, ' ').trim();
        return aliases.some(alias => {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9_]+/g, ' ').trim();
          return cleanH === cleanAlias || cleanH.includes(cleanAlias) || cleanAlias.includes(cleanH);
        });
      });

      newMapping[col] = found || '';
    });

    return newMapping;
  };

  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(entityId);
    if (headers.length > 0) {
      setColumnMapping(autoMapHeaders(headers, entityId));
    } else {
      const ent = ENTITY_CATALOG.find(e => e.id === entityId);
      const initialMap: Record<string, string> = {};
      (ent?.columns || ['code', 'name']).forEach(col => {
        initialMap[col] = '';
      });
      setColumnMapping(initialMap);
    }
  };

  // Step 1: Upload and Inspect
  const handleFileUpload = async () => {
    if (!file) {
      setErrorMsg('Pilih berkas CSV terlebih dahulu.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.uploadAndInspect(file);
      if (res.success && res.data) {
        setHeaders(res.data.headers);
        setSampleRows(res.data.sample_rows);
        setAllRows(res.data.all_rows);

        const newMap = autoMapHeaders(res.data.headers, selectedEntity);
        setColumnMapping(newMap);
        setCurrentStep(2);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memproses berkas CSV.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Validate Data
  const handleValidate = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.validateImport({
        entity: selectedEntity,
        headers,
        rows: allRows,
        mapping: columnMapping,
      });

      if (res.success && res.data) {
        setValidationResult(res.data);
        if (res.data.is_valid || res.data.error_count === 0) {
          setCurrentStep(6);
        } else {
          setCurrentStep(5);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memvalidasi data.');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Execute Import
  const handleExecuteImport = async () => {
    if (!validationResult || !validationResult.valid_data) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await importExportService.executeImport({
        entity: selectedEntity,
        data: validationResult.valid_data,
        strategy: importStrategy,
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setCurrentStep(7);
        toast.success(`Berhasil mengimpor ${res.data.imported_count} baris data ke database.`, 'Impor Berhasil');
        queryClient.invalidateQueries({ queryKey: ['import-export-history'] });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengeksekusi impor ke database.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetImport = () => {
    setFile(null);
    setHeaders([]);
    setSampleRows([]);
    setAllRows([]);
    setValidationResult(null);
    setImportResult(null);
    setErrorMsg(null);
    setCurrentStep(1);
  };

  // Filtered export entities
  const filteredExportEntities = ENTITY_CATALOG.filter(e => {
    const matchCat = exportCategory === 'ALL' || e.category === exportCategory;
    const matchSearch = exportSearch === '' || 
      e.name.toLowerCase().includes(exportSearch.toLowerCase()) || 
      e.description.toLowerCase().includes(exportSearch.toLowerCase()) ||
      e.id.toLowerCase().includes(exportSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Import & Export Center"
        subtitle="Pusat integrasi data massal, unduhan rekapitulasi data enterprise, dan template impor standar sistem HCMS"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FileDown className="h-4 w-4" />}
              onClick={() => setActiveTab('templates')}
            >
              Unduh Template
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UploadCloud className="h-4 w-4" />}
              onClick={() => {
                setActiveTab('import');
                handleResetImport();
              }}
            >
              Mulai Impor Baru
            </Button>
          </div>
        }
      />

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Entitas Terdaftar</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{ENTITY_CATALOG.length} Modul</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Perusahaan, Site, Jabatan, Shift & User</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Standar Berkas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">CSV & Excel</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Dukungan UTF-8 BOM Otomatis</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Integritas Transaksi</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Atomic DB</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Rollback otomatis jika validasi gagal</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kepatuhan Audit</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Audit Trail</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <History className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Perekaman aktor & waktu eksekusi</p>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50/50 px-4 dark:border-slate-800 dark:bg-slate-900/50">
          <Tabs
            tabs={[
              { id: 'import', label: '📥 Impor Data (Wizard)' },
              { id: 'export', label: '📤 Ekspor Data' },
              { id: 'templates', label: '📑 Template Standar' },
              { id: 'history', label: '📜 Riwayat & Audit Trail' },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />
        </div>

        <div className="p-6">
          {/* TAB 1: IMPORT WIZARD */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* Wizard Step Indicator */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center justify-between min-w-[700px] border-b border-slate-200 pb-4 dark:border-slate-800">
                  {WIZARD_STEPS.map((s, idx) => {
                    const isPassed = currentStep > s.step;
                    const isCurrent = currentStep === s.step;
                    return (
                      <div key={s.step} className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                            isPassed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40 shadow-xs'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          }`}
                        >
                          {isPassed ? <Check className="h-4 w-4" /> : s.step}
                        </div>
                        <div className="text-left">
                          <p className={`text-xs font-bold leading-none ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {s.title}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.desc}</p>
                        </div>
                        {idx < WIZARD_STEPS.length - 1 && (
                          <div className={`h-0.5 w-6 sm:w-10 transition-colors ${isPassed ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error Message Box */}
              {errorMsg && (
                <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Terjadi Kesalahan</p>
                    <p className="mt-1 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* STEP 1: UPLOAD & ENTITY SELECT */}
              {currentStep === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto py-4">
                  <div className="space-y-1.5 text-center">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Langkah 1: Tentukan Entitas & Unggah File CSV</h3>
                    <p className="text-xs text-slate-500">Pilih modul data target dan unggah berkas spreadsheet CSV Anda</p>
                  </div>

                  <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Target Entitas Master Data:
                      </label>
                      <Select
                        value={selectedEntity}
                        onChange={(e) => handleEntityChange(e.target.value)}
                        options={ENTITY_CATALOG.map(e => ({ value: e.id, label: `${e.name} (${e.category})` }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Berkas CSV Sumber:
                      </label>
                      <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center hover:border-blue-500 dark:border-slate-700 dark:bg-slate-900 transition-colors cursor-pointer">
                        <UploadCloud className="h-10 w-10 text-blue-500 mb-2" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {file ? file.name : 'Seret & letakkan file CSV di sini atau klik untuk memilih'}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Maksimal 5MB • Format CSV UTF-8</p>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<FileDown className="h-4 w-4" />}
                        onClick={() => handleTemplateDownload(selectedEntity, selectedEntity)}
                      >
                        Unduh Template Entitas Ini
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleFileUpload}
                        isLoading={loading}
                        disabled={!file}
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        Lanjut ke Pemetaan Kolom
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: COLUMN MAPPING */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Langkah 2: Pemetaan Atribut Kolom</h3>
                      <p className="text-xs text-slate-500">Cocokkan kolom pada berkas CSV Anda dengan field formulir sistem</p>
                    </div>
                    <Badge variant="neutral">{headers.length} Kolom Ditemukan</Badge>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                        <tr>
                          <th className="p-3">Atribut Target Database</th>
                          <th className="p-3">Wajib/Opsional</th>
                          <th className="p-3">Kolom pada Berkas CSV</th>
                          <th className="p-3">Contoh Nilai (Baris 1)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {(() => {
                          const currentEntityMeta = ENTITY_CATALOG.find(e => e.id === selectedEntity) || ENTITY_CATALOG[0];
                          return currentEntityMeta.columns.map((field) => {
                            const def = FIELD_DEFINITIONS[field] || { label: field, required: false };
                            const mappedCol = columnMapping[field] || '';
                            const mappedColIdx = headers.indexOf(mappedCol);
                            const sampleVal = mappedColIdx !== -1 && sampleRows[0] ? sampleRows[0][mappedColIdx] : '-';

                            return (
                              <tr key={field} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {def.label}
                                </td>
                                <td className="p-3">
                                  {def.required ? (
                                    <Badge variant="danger">Wajib</Badge>
                                  ) : (
                                    <Badge variant="neutral">Opsional</Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={mappedCol}
                                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                                    options={[
                                      { value: '', label: '-- Lewati / Tidak Ada --' },
                                      ...headers.map(h => ({ value: h, label: h }))
                                    ]}
                                  />
                                </td>
                                <td className="p-3 font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                                  {sampleVal}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                      Kembali
                    </Button>
                    <Button variant="primary" onClick={() => setCurrentStep(3)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Pratinjau Data
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: PREVIEW DATA */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Langkah 3: Pratinjau Baris Data Berkas</h3>
                      <p className="text-xs text-slate-500">Menampilkan {sampleRows.length} baris sampel pertama dari total {allRows.length} baris data</p>
                    </div>
                    <Badge variant="primary">Total {allRows.length} Baris</Badge>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 max-h-96">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                        <tr>
                          <th className="p-3 w-12">#</th>
                          {headers.map((h, i) => (
                            <th key={i} className="p-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                        {sampleRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-3 text-slate-400">{rIdx + 1}</td>
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="p-3 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-xs truncate">
                                {val || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setCurrentStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                      Kembali
                    </Button>
                    <Button variant="primary" onClick={handleValidate} isLoading={loading} rightIcon={<ShieldCheck className="h-4 w-4" />}>
                      Jalankan Validasi Sistem
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 5: ERROR REPORTING & STRATEGY */}
              {currentStep === 5 && validationResult && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Langkah 5: Laporan Validasi Data</h3>
                      <p className="text-xs text-slate-500">Terdapat data yang tidak lolos validasi integritas sistem</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{validationResult.valid_count} Baris Valid</Badge>
                      <Badge variant="danger">{validationResult.error_count} Baris Error</Badge>
                    </div>
                  </div>

                  {/* Strategy Selection */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Pilih Strategi Penyelesaian Impor:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        importStrategy === 'STRICT'
                          ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 dark:bg-slate-900/60'
                      }`}>
                        <input
                          type="radio"
                          name="strategy"
                          checked={importStrategy === 'STRICT'}
                          onChange={() => setImportStrategy('STRICT')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Ketat (STRICT - Rekomendasi)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Batalkan seluruh proses transaksi jika terdapat error untuk menjaga konsistensi database.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        importStrategy === 'PARTIAL'
                          ? 'border-blue-600 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 dark:bg-slate-900/60'
                      }`}>
                        <input
                          type="radio"
                          name="strategy"
                          checked={importStrategy === 'PARTIAL'}
                          onChange={() => setImportStrategy('PARTIAL')}
                          className="mt-0.5 text-blue-600"
                        />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">Parsial (PARTIAL)</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Hanya impor baris yang valid ({validationResult.valid_count} baris), dan lewati baris yang bermasalah.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Errors Table */}
                  <div className="overflow-x-auto rounded-lg border border-rose-200 dark:border-rose-900 max-h-80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-rose-50 text-rose-800 font-semibold sticky top-0 dark:bg-rose-950 dark:text-rose-300">
                        <tr>
                          <th className="p-3 w-16">Baris</th>
                          <th className="p-3">Atribut Kolom</th>
                          <th className="p-3">Nilai Masukan</th>
                          <th className="p-3">Keterangan Kesalahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40">
                        {validationResult.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20">
                            <td className="p-3 font-mono font-bold text-rose-600">#{err.row}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{err.field}</td>
                            <td className="p-3 font-mono text-slate-500">{String(err.value || '-')}</td>
                            <td className="p-3 text-rose-600 dark:text-rose-400 font-medium">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                      Kembali ke Pratinjau
                    </Button>
                    <Button
                      variant={importStrategy === 'PARTIAL' ? 'primary' : 'danger'}
                      onClick={handleExecuteImport}
                      isLoading={loading}
                      disabled={importStrategy === 'STRICT' && validationResult.error_count > 0}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      {importStrategy === 'PARTIAL'
                        ? `Lanjutkan Impor (${validationResult.valid_count} Baris Valid)`
                        : 'Perbaiki Berkas Terlebih Dahulu'}
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 6: READY TO EXECUTE */}
              {currentStep === 6 && validationResult && (
                <div className="space-y-6 max-w-xl mx-auto py-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-sm">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Data Siap Dieksekusi ke Database</h3>
                    <p className="text-xs text-slate-500">
                      Seluruh <strong>{validationResult.valid_count}</strong> baris data lolos verifikasi aturan sistem tanpa kesalahan.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Target Entitas:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">{selectedEntity}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                      <span className="text-slate-500">Total Baris Disimpan:</span>
                      <span className="font-semibold text-emerald-600 font-mono">{validationResult.valid_count} Baris</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Keamanan Transaksi:</span>
                      <span className="font-semibold text-blue-600">DB Transaction (ACID)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="outline" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                      Kembali
                    </Button>
                    <Button variant="primary" size="lg" onClick={handleExecuteImport} isLoading={loading} leftIcon={<Check className="h-5 w-5" />}>
                      Eksekusi & Simpan Sekarang
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 7: FINISHED */}
              {currentStep === 7 && importResult && (
                <div className="space-y-6 max-w-xl mx-auto py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-md">
                    <Check className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Impor Data Berhasil Selesai!</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Sebanyak <strong className="text-emerald-600">{importResult.imported_count}</strong> baris data berhasil disinkronkan ke dalam sistem HCMS.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={handleResetImport} leftIcon={<RefreshCw className="h-4 w-4" />}>
                      Lakukan Impor Lainnya
                    </Button>
                    <Button variant="primary" onClick={() => setActiveTab('history')} leftIcon={<History className="h-4 w-4" />}>
                      Lihat di Riwayat Audit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPORT CENTER */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={exportSearch}
                    onChange={(e) => setExportSearch(e.target.value)}
                    placeholder="Cari modul atau entitas ekspor..."
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Kategori:</span>
                  <div className="flex flex-wrap gap-1">
                    {['ALL', 'Organisasi', 'Benefit & Plafon', 'Operasional', 'Akses & Akun'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setExportCategory(cat)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          exportCategory === cat
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {cat === 'ALL' ? 'Semua' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Entity Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExportEntities.map((ent) => {
                  const isDownloading = downloadingEntity === ent.id;

                  return (
                    <Card
                      key={ent.id}
                      className="p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all border border-slate-200 dark:border-slate-800"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className={`p-2.5 rounded-xl ${ent.iconBg}`}>
                            {ent.icon}
                          </div>
                          <Badge variant="neutral">{ent.category}</Badge>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ent.name}</h4>
                          <span className="font-mono text-[10px] text-slate-400">entity: {ent.id}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                            {ent.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">CSV • UTF-8 BOM</span>
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={isDownloading}
                          leftIcon={<Download className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => handleExportDownload(ent.id, ent.name)}
                        >
                          Ekspor CSV
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STARTER TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300 flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Pedoman Format Berkas Template</p>
                  <p className="mt-1 leading-relaxed">
                    Setiap file template telah dilengkapi dengan header kolom resmi dan 2-3 baris contoh data operasional tambang batubara (contoh Site Sangatta, kode unit HCGA, dll). Anda dapat langsung membuka template di Excel, mengisi baris baru, dan mengunggahnya pada tab <strong>Impor Data</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ENTITY_CATALOG.map((ent) => {
                  const isDownloading = downloadingTemplate === ent.id;

                  return (
                    <Card
                      key={ent.id}
                      className="p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${ent.iconBg}`}>
                            {ent.icon}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">.csv template</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{ent.name}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{ent.description}</p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kolom Termasuk:</span>
                          <div className="flex flex-wrap gap-1">
                            {ent.columns.map((col) => (
                              <span
                                key={col}
                                className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {col}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
                          isLoading={isDownloading}
                          leftIcon={<FileDown className="h-4 w-4" />}
                          onClick={() => handleTemplateDownload(ent.id, ent.name)}
                        >
                          Unduh Template CSV
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL / HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Riwayat Impor & Ekspor Terakhir</h3>
                  <p className="text-xs text-slate-500">Mencatat aktivitas mutasi dan penarikan data untuk pemenuhan kepatuhan audit</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  onClick={() => refetchHistory()}
                >
                  Segarkan
                </Button>
              </div>

              {isHistoryLoading ? (
                <div className="p-12 text-center text-xs text-slate-400">Memuat riwayat audit...</div>
              ) : !historyData?.data || historyData.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-500 dark:border-slate-800">
                  <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">Belum Ada Riwayat Aktivitas</p>
                  <p className="text-xs text-slate-400 mt-1">Aktivitas ekspor dan impor pertama kali akan tercatat otomatis di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                      <tr>
                        <th className="p-3">Waktu Eksekusi</th>
                        <th className="p-3">Aktivitas</th>
                        <th className="p-3">Modul / Entitas</th>
                        <th className="p-3">Nama Berkas</th>
                        <th className="p-3">Aktor Pelaksana</th>
                        <th className="p-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {historyData.data.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{log.created_at}</span>
                            <span className="block text-[10px] text-slate-400">{log.time_ago}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={log.action === 'IMPORT' ? 'success' : 'primary'}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-3 font-semibold text-slate-700 dark:text-slate-300 uppercase">
                            {log.module}
                          </td>
                          <td className="p-3 font-mono text-slate-600 dark:text-slate-400 truncate max-w-xs">
                            {log.filename}
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{log.actor}</span>
                            <span className="block text-[10px] font-mono text-slate-400">@{log.username}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
