'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  MapPin,
  Briefcase,
  Edit,
  Layers,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  Heart,
  HardHat,
  GraduationCap,
  PhoneCall,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Copy,
  Check,
  FileText,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Home,
  Eye,
  Download,
  UploadCloud,
  FileCheck,
  ClipboardCheck,
  Printer,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { documentTypeService } from '@/services/masterDataService';
import { authService } from '@/services/authService';
import { Employee, EmployeeCareerHistory, EmployeeDocument, DocumentType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { toast, confirmDialog } from '@/stores/alertStore';
import { formatDate } from '@/lib/utils';

export const TABS_CONFIG = [
  { id: 'overview', label: 'Ringkasan & Profil', shortLabel: 'Profil', icon: Users },
  { id: 'career', label: 'Riwayat Karir (Snapshot Baku)', shortLabel: 'Karir', icon: ArrowRightLeft },
  { id: 'family', label: 'Keluarga & Tanggungan', shortLabel: 'Keluarga', icon: Heart },
  { id: 'health', label: 'Data Fisik & APD Tambang', shortLabel: 'Fisik & APD', icon: HardHat },
  { id: 'education', label: 'Pendidikan', shortLabel: 'Pendidikan', icon: GraduationCap },
  { id: 'emergency', label: 'Kontak Darurat', shortLabel: 'Kontak Darurat', icon: PhoneCall },
  { id: 'documents', label: 'Dokumen Karyawan', shortLabel: 'Dokumen', icon: FileText },
  { id: 'account', label: 'Akun Login & Keamanan', shortLabel: 'Akun & Keamanan', icon: Key },
] as const;

export type EmployeeDetailTabId = (typeof TABS_CONFIG)[number]['id'];

interface EmployeeDetailViewProps {
  employee: Employee;
  mode?: 'admin' | 'ess';
  onRefresh?: () => void;
}

export default function EmployeeDetailView({
  employee,
  mode = 'admin',
  onRefresh,
}: EmployeeDetailViewProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EmployeeDetailTabId>('overview');

  // Directional Tab Scroll & Navigation State
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (el) {
      el.scrollBy({ left: direction === 'left' ? -260 : 260, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  const goToTab = (tabId: EmployeeDetailTabId) => {
    setActiveTab(tabId);
    const element = tabRefs.current[tabId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    // Smooth scroll page slightly down to the tab content if scrolled past
    if (typeof window !== 'undefined' && window.scrollY > 280) {
      window.scrollTo({ top: 220, behavior: 'smooth' });
    }
  };

  const currentTabIndex = TABS_CONFIG.findIndex((t) => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? TABS_CONFIG[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < TABS_CONFIG.length - 1 ? TABS_CONFIG[currentTabIndex + 1] : null;

  // Admin Reset Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ username: string; temporary_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // ESS Change Password Modal
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Document Upload Modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch Document Types for Upload Modal
  const { data: docTypesData } = useQuery({
    queryKey: ['master-document-types'],
    queryFn: () => documentTypeService.getDocumentTypes(),
    enabled: uploadModalOpen,
  });

  const documentTypes: DocumentType[] = Array.isArray(docTypesData?.data)
    ? docTypesData.data
    : Array.isArray((docTypesData as any)?.data?.data)
    ? (docTypesData as any).data.data
    : [];

  // Toggle Status Mutation (Admin only)
  const toggleStatusMutation = useMutation({
    mutationFn: (status: string) => employeeService.toggleStatus(employee.id, status),
    onSuccess: () => {
      toast.success('Status kepegawaian berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employee.id] });
      onRefresh?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    },
  });

  // Reset Password Mutation (Admin only)
  const resetPasswordMutation = useMutation({
    mutationFn: () => employeeService.resetPassword(employee.id),
    onSuccess: (response) => {
      setResetResult(response.data);
      setResetModalOpen(true);
      toast.success('Password login karyawan berhasil di-reset');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employee.id] });
      onRefresh?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal me-reset password');
    },
  });

  // Change Password Mutation (ESS only)
  const changePasswordMutation = useMutation({
    mutationFn: (payload: any) => authService.changePassword(payload),
    onSuccess: () => {
      toast.success('Password akun berhasil diperbarui. Silakan gunakan password baru ini pada login berikutnya.');
      setChangePasswordModalOpen(false);
      setChangePasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setChangePasswordError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui password.';
      setChangePasswordError(msg);
      toast.error(msg, 'Gagal Mengubah Password');
    },
  });

  // Upload Document Mutation
  const uploadDocMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (mode === 'ess') {
        return employeeService.uploadMyDocument(formData);
      }
      return employeeService.uploadDocument(employee.id, formData);
    },
    onSuccess: () => {
      toast.success('Dokumen berhasil diunggah');
      setUploadModalOpen(false);
      setSelectedDocType('');
      setDocNumber('');
      setExpiryDate('');
      setNotes('');
      setSelectedFile(null);
      setUploadError(null);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['ess-my-profile'] });
      onRefresh?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengunggah dokumen.';
      setUploadError(msg);
      toast.error(msg, 'Gagal Unggah');
    },
  });

  // Delete Document Mutation
  const deleteDocMutation = useMutation({
    mutationFn: async (documentId: number) => {
      if (mode === 'ess') {
        return employeeService.deleteMyDocument(documentId);
      }
      return employeeService.deleteDocument(employee.id, documentId);
    },
    onSuccess: () => {
      toast.success('Dokumen berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['ess-my-profile'] });
      onRefresh?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus dokumen');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedDocType) {
      setUploadError('Pilih jenis dokumen.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Pilih berkas file yang akan diunggah.');
      return;
    }

    const fd = new FormData();
    fd.append('document_type_id', selectedDocType);
    fd.append('file', selectedFile);
    if (docNumber) fd.append('document_number', docNumber);
    if (expiryDate) fd.append('expiry_date', expiryDate);
    if (notes) fd.append('notes', notes);

    uploadDocMutation.mutate(fd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Password disalin ke clipboard');
  };

  const isActive = employee.employment_status === 'ACTIVE';

  const previewBaseUrl = mode === 'ess' ? '/api/v1/ess/documents' : `/api/v1/admin/employees/${employee.id}/documents`;
  const downloadBaseUrl = mode === 'ess' ? '/api/v1/ess/documents' : `/api/v1/admin/employees/${employee.id}/documents`;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      {mode === 'admin' ? (
        <div className="flex items-center justify-between">
          <Link
            href="/admin/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Karyawan
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/ess" className="hover:text-emerald-600 transition-colors font-medium">
              Portal Mandiri (ESS)
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Profil & Dokumen Saya
            </span>
          </div>
        </div>
      )}

      {/* Hero Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-2xl shadow-lg ${
                mode === 'ess'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'
              }`}
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {employee.name}
                </h1>
                <Badge variant={isActive ? 'success' : 'neutral'}>
                  {employee.employment_status}
                </Badge>
                {employee.employment_type?.name && (
                  <Badge variant="outline" className="text-xs">
                    {employee.employment_type.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  NRP: {employee.nrp}
                </span>
                <span>•</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {employee.position?.title || 'Jabatan Belum Ditentukan'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {employee.department?.name || 'Departemen Belum Ditentukan'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {employee.site?.name || 'HO'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {mode === 'admin' ? (
              <>
                <Link href={`/admin/employees/${employee.id}/edit`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
                  >
                    <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Edit Data Karyawan
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetPasswordMutation.mutate()}
                  className="flex items-center gap-1.5"
                >
                  <Key className="h-4 w-4 text-amber-500" />
                  Reset Password
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
                    const confirmed = await confirmDialog({
                      title: `${isActive ? 'Nonaktifkan' : 'Aktifkan'} Karyawan`,
                      message: isActive
                        ? `Nonaktifkan karyawan "${employee.name}"? Sesi login aktif akan segera diputus.`
                        : `Aktifkan kembali karyawan "${employee.name}"?`,
                      confirmText: isActive ? 'Nonaktifkan' : 'Aktifkan',
                      cancelText: 'Batal',
                      variant: isActive ? 'warning' : 'primary',
                    });
                    if (confirmed) {
                      toggleStatusMutation.mutate(nextStatus);
                    }
                  }}
                  className="flex items-center gap-1.5"
                >
                  {isActive ? (
                    <>
                      <UserX className="h-4 w-4 text-rose-500" />
                      Nonaktifkan
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 text-emerald-500" />
                      Aktifkan
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  Cetak Profil
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangePasswordError(null);
                    setChangePasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
                    setChangePasswordModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
                >
                  <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Ubah Kata Sandi
                </Button>

                <Link href="/ess/re-registration">
                  <Button
                    size="sm"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Registrasi Ulang Mandiri
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tab Navigation with Direction Arrows & Scroll Controls (Data Arah Navigasi Tab Samping) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Seksi Menu Tab ({currentTabIndex + 1} dari {TABS_CONFIG.length}):
            </span>
            <span
              className={`font-medium px-2 py-0.5 rounded-md border ${
                mode === 'ess'
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                  : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
              }`}
            >
              {TABS_CONFIG[currentTabIndex]?.label}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Gunakan panah arah (‹ ›) untuk menggeser menu tab samping</span>
          </div>
        </div>

        <div className="relative flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Tombol Arah Geser Kiri */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            disabled={!canScrollLeft}
            aria-label="Geser tab ke kiri"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
              canScrollLeft
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 shadow-xs cursor-pointer'
                : 'bg-slate-100/50 dark:bg-slate-850/30 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Geser tab ke kiri (arah sebelumnya)"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Area Tab Horizontal yang Memanjang ke Samping */}
          <div
            ref={tabsContainerRef}
            onScroll={checkScroll}
            className="flex flex-1 items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 scroll-smooth"
          >
            {TABS_CONFIG.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              let badgeCount: number | undefined;
              if (tab.id === 'career') badgeCount = employee.career_histories?.length;
              if (tab.id === 'family') badgeCount = employee.families?.length;
              if (tab.id === 'education') badgeCount = employee.educations?.length;
              if (tab.id === 'emergency') badgeCount = employee.emergency_contacts?.length;
              if (tab.id === 'documents') badgeCount = employee.documents?.length;

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  onClick={() => goToTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? mode === 'ess'
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {badgeCount !== undefined && badgeCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tombol Arah Geser Kanan */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            disabled={!canScrollRight}
            aria-label="Geser tab ke kanan"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
              canScrollRight
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 shadow-xs cursor-pointer'
                : 'bg-slate-100/50 dark:bg-slate-850/30 border-transparent text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Geser tab ke kanan (arah selanjutnya)"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: RINGKASAN & IDENTITAS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Data Pribadi & Kontak */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Data Pribadi & Identitas Legal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Nama Lengkap</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{employee.name}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Jenis Kelamin</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Tempat & Tanggal Lahir</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.birth_place || '-'}, {formatDate(employee.birth_date)}{' '}
                    {employee.age !== null && employee.age !== undefined && (
                      <span className="text-slate-400 font-normal">({employee.age} tahun)</span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Agama</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{employee.religion || '-'}</span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Nomor KTP (NIK)</span>
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.id_card_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Nomor NPWP</span>
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.tax_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Status Pernikahan & PTKP</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.marital_status || 'SINGLE'} • Status Pajak: {employee.tax_status || 'TK/0'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Tanggal Pernikahan</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.marriage_date ? formatDate(employee.marriage_date) : '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Alamat KTP & Domisili */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Alamat Tempat Tinggal
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Alamat Sesuai KTP (Legal)</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.ktp_address || 'Belum diisi'}
                    {employee.ktp_village && `, Desa/Kel. ${employee.ktp_village}`}
                    {employee.ktp_district && `, Kec. ${employee.ktp_district}`}
                    {employee.ktp_city && `, ${employee.ktp_city}`}
                    {employee.ktp_province && `, ${employee.ktp_province}`}
                    {employee.ktp_postal_code && ` (${employee.ktp_postal_code})`}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Alamat Tinggal Saat Ini (Domisili / Mess Site)</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.residential_address || 'Sama dengan KTP'}
                    {employee.residential_village && `, Desa/Kel. ${employee.residential_village}`}
                    {employee.residential_district && `, Kec. ${employee.residential_district}`}
                    {employee.residential_city && `, ${employee.residential_city}`}
                    {employee.residential_province && `, ${employee.residential_province}`}
                    {employee.residential_postal_code && ` (${employee.residential_postal_code})`}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Kolom Kanan: Kontak & Kepegawaian */}
          <div className="space-y-6">
            {/* Status Kepegawaian */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Penempatan & Status Kerja
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Perusahaan (PT)</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.company?.name || employee.company?.code || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Departemen & Section</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.department?.name || '-'} {employee.section ? `• ${employee.section.name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Site & Area Kerja Tambang</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.site?.name || 'HO'} {employee.work_area ? `• Area ${employee.work_area}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Pangkat</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.pangkat || employee.grade?.pangkat || 'Staff'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Level Jabatan (Grade)</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.grade?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Golongan & Jenjang</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.salary_grade?.name ? `Golongan ${employee.salary_grade.name}` : '-'} {employee.salary_grade_jenjang?.name ? `• ${employee.salary_grade_jenjang.name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Hubungan Kerja</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.employment_type?.name || 'PKWTT'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Point of Hire (POH)</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.poh || 'Lokal Site'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Tanggal Masuk (Hire Date)</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(employee.hire_date)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Kontak Karyawan */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Kontak & Komunikasi
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">No. Handphone / WA</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.phone_mobile || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Email Kantor</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.email_company || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-0.5">Email Pribadi</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {employee.email_personal || '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Rekening Payroll */}
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Rekening Gaji (Payroll)
              </h3>
              {employee.bank_accounts && employee.bank_accounts.length > 0 ? (
                employee.bank_accounts.map((b, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{b.bank_name}</span>
                    <div className="font-mono text-base text-blue-600 dark:text-blue-400 font-bold">{b.account_number}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">A/N: {b.account_holder}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Belum ada data rekening bank yang terdaftar.</p>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: RIWAYAT KARIR & MUTASI (SNAPSHOT BAKU) */}
      {activeTab === 'career' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Perjalanan Karir & Mutasi Historis (Data Baku / Immutable)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Catatan historis ini bersifat permanen. Sekalipun master jabatan atau departemen diubah di masa depan, data di bawah ini tetap mempertahankan nama aslinya saat SK diterbitkan.
            </p>
          </div>

          {employee.career_histories && employee.career_histories.length > 0 ? (
            <div className="relative pl-6 border-l-2 border-blue-500/20 dark:border-blue-500/30 space-y-8">
              {employee.career_histories.map((hist: EmployeeCareerHistory, idx: number) => {
                const isCurrent = hist.is_current;

                return (
                  <div key={hist.id || idx} className="relative">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${
                        isCurrent
                          ? 'border-emerald-500 text-emerald-500 ring-4 ring-emerald-500/20'
                          : 'border-blue-500 text-blue-500'
                      }`}
                    >
                      <div className={`h-2 w-2 rounded-full ${isCurrent ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    </div>

                    {/* Timeline Content Card */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={isCurrent ? 'success' : 'neutral'} className="text-[10px]">
                            {hist.movement_type}
                          </Badge>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Posisi Saat Ini
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          <span>TMT: {formatDate(hist.effective_date)}</span>
                          {hist.end_date && <span>s/d {formatDate(hist.end_date)}</span>}
                        </div>
                      </div>

                      {/* Snapshot Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Jabatan Baku</span>
                          <strong className="text-slate-900 dark:text-white font-bold">
                            {hist.position_title_snapshot}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Departemen & Site</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {hist.department_name_snapshot} • {hist.site_name_snapshot}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Pangkat & Level Jabatan</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {hist.grade_name_snapshot || '-'} ({hist.pangkat_snapshot || 'Staff'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Golongan & Jenjang</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {hist.golongan_snapshot ? `Gol. ${hist.golongan_snapshot}` : '-'} {hist.level_jenjang_snapshot ? `• ${hist.level_jenjang_snapshot}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Area Tambang & POH</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {hist.work_area_snapshot || '-'} {hist.poh_snapshot ? `• POH ${hist.poh_snapshot}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* SK Details */}
                      {(hist.letter_number || hist.reason) && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex flex-col sm:flex-row sm:justify-between gap-1 text-slate-500 dark:text-slate-400">
                          {hist.letter_number && (
                            <span>
                              No. SK: <strong className="font-mono text-slate-700 dark:text-slate-300">{hist.letter_number}</strong>
                              {hist.letter_date && ` (${formatDate(hist.letter_date)})`}
                            </span>
                          )}
                          {hist.reason && <span>Alasan: {hist.reason}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada catatan riwayat karir.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 3: KELUARGA & TANGGUNGAN */}
      {activeTab === 'family' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              Susunan Anggota Keluarga & Tanggungan
            </h3>
          </div>

          {employee.families && employee.families.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.families.map((fam, idx) => (
                <div
                  key={fam.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {fam.relation_type === 'SPOUSE'
                        ? 'Pasangan (Suami/Istri)'
                        : fam.relation_type === 'CHILD'
                        ? `Anak ke-${fam.child_order || 1}`
                        : fam.relation_type === 'FATHER'
                        ? 'Ayah Kandung'
                        : fam.relation_type === 'MOTHER'
                        ? 'Ibu Kandung'
                        : fam.relation_type === 'FATHER_IN_LAW'
                        ? 'Ayah Mertua'
                        : fam.relation_type === 'MOTHER_IN_LAW'
                        ? 'Ibu Mertua'
                        : 'Keluarga Lainnya'}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {fam.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{fam.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Lahir: {formatDate(fam.birth_date)}{' '}
                      {fam.birth_place && `di ${fam.birth_place}`}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Tanggungan Asuransi / BPJS:</span>
                    <strong className={fam.is_covered_insurance ? 'text-emerald-600' : 'text-slate-500'}>
                      {fam.is_covered_insurance ? 'Ya (Ditanggung)' : 'Tidak Ditanggung'}
                    </strong>
                  </div>

                  {(fam.insurance_no || fam.bpjs_kesehatan_no) && (
                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      {fam.bpjs_kesehatan_no && <div>BPJS Kesehatan: <span className="font-mono">{fam.bpjs_kesehatan_no}</span></div>}
                      {fam.insurance_no && <div>Asuransi: <span className="font-mono">{fam.insurance_no}</span></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada data keluarga yang tercatat.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 4: DATA KESEHATAN & FISIK */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          {/* Parameter Fisik & APD */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <HardHat className="h-5 w-5 text-amber-500" />
              Parameter Fisik & Ukuran Perlengkapan APD Tambang
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Golongan Darah & Rhesus</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.blood_type || '-'} {employee.health_safety?.rhesus ? `(${employee.health_safety.rhesus})` : ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Tinggi / Berat Badan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.height_cm ? `${employee.health_safety.height_cm} cm` : '-'} / {employee.health_safety?.weight_kg ? `${employee.health_safety.weight_kg} kg` : '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Ukuran Baju & Coverall</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.shirt_size || '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Ukuran Celana Safety</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.pants_size || '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Ukuran Sepatu Safety</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.safety_shoe_size ? `Size ${employee.health_safety.safety_shoe_size}` : '-'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <span className="text-slate-400 block mb-1">Ukuran Wearpack / Coverall</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {employee.health_safety?.coverall_size || '-'}
                </span>
              </div>
            </div>
          </Card>

          {/* MCU & Riwayat Medis */}
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Catatan Medis & Alergi Obat
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
              {employee.health_safety?.medical_notes || 'Tidak ada riwayat alergi atau penyakit khusus yang dicatat.'}
            </p>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: PENDIDIKAN */}
      {activeTab === 'education' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Riwayat Pendidikan Formal & Ijazah
          </h3>

          {employee.educations && employee.educations.length > 0 ? (
            <div className="space-y-3">
              {employee.educations.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {edu.level}
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {edu.institution_name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Jurusan: {edu.major || '-'} {edu.gpa && `• IPK/Nilai: ${edu.gpa}`}
                    </p>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Lulus Tahun {edu.graduation_year || '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat pendidikan yang tercatat.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 6: KONTAK DARURAT */}
      {activeTab === 'emergency' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Kontak Darurat (Emergency Contacts)
          </h3>

          {employee.emergency_contacts && employee.emergency_contacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.emergency_contacts.map((em, idx) => (
                <div
                  key={em.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{em.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {em.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{em.phone_number}</span>
                  </div>
                  {em.address && <p className="text-slate-500 dark:text-slate-400 text-xs">{em.address}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada kontak darurat yang didaftarkan.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 7: DOKUMEN KARYAWAN */}
      {activeTab === 'documents' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Berkas & Dokumen Legalitas Karyawan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar arsip dokumen identitas, pajak, BPJS, KIMPER, dan sertifikat kesehatan (Fit to Work).
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setUploadError(null);
                setSelectedDocType('');
                setDocNumber('');
                setExpiryDate('');
                setNotes('');
                setSelectedFile(null);
                setUploadModalOpen(true);
              }}
              className="text-xs font-semibold flex items-center gap-1.5"
            >
              <UploadCloud className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Unggah Dokumen Baru
            </Button>
          </div>

          {employee.documents && employee.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {doc.document_type?.name || 'Dokumen Karyawan'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            {doc.document_type?.code || 'DOC'}
                          </span>
                          {doc.document_type?.category && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {doc.document_type.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Badge variant="success" className="text-[10px]">
                      {doc.status}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Nama Berkas:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                        {doc.file_name}
                      </span>
                    </div>
                    {doc.document_number && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Nomor Dokumen:</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {doc.document_number}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Ukuran:</span>
                      <span className="font-mono">
                        {doc.formatted_file_size || `${Math.round((doc.file_size || 0) / 1024)} KB`}
                      </span>
                    </div>
                    {doc.expiry_date && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Kedaluwarsa:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {formatDate(doc.expiry_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const confirmed = await confirmDialog({
                          title: 'Hapus Dokumen',
                          message: `Apakah Anda yakin ingin menghapus berkas "${doc.file_name}"? Tindakan ini tidak dapat dibatalkan.`,
                          confirmText: 'Ya, Hapus',
                          cancelText: 'Batal',
                          variant: 'danger',
                        });
                        if (confirmed) {
                          deleteDocMutation.mutate(doc.id);
                        }
                      }}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-7 px-2"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Hapus
                    </Button>

                    <div className="flex items-center gap-2">
                      <a
                        href={`${previewBaseUrl}/${doc.id}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Pratinjau
                      </a>
                      <a
                        href={`${downloadBaseUrl}/${doc.id}/download`}
                        download
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Unduh
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-slate-500">Belum ada dokumen standar yang diunggah untuk karyawan ini.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setUploadModalOpen(true)}
                className="text-xs font-semibold"
              >
                <UploadCloud className="h-3.5 w-3.5 mr-1 text-blue-600" />
                Mulai Unggah Dokumen Standar
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT 8: AKUN LOGIN & KEAMANAN */}
      {activeTab === 'account' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            Akun Akses Portal ESS / Mobile
          </h3>

          {employee.user ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Username Login</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                    {employee.user.username}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Status Akun Login</span>
                  <Badge variant={employee.user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                    {employee.user.status}
                  </Badge>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Wajib Ganti Password (Force Password Change)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.user.force_password_change ? 'Ya (Belum ganti password)' : 'Tidak (Sudah diganti)'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-400 block mb-0.5">Email Terdaftar</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.user.email}
                  </span>
                </div>
              </div>

              {mode === 'admin' ? (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Reset Password Karyawan</h4>
                    <p className="text-[11px] text-slate-500">
                      Kembalikan password ke pola baku (HCMS#TglLahir) jika karyawan lupa password.
                    </p>
                  </div>

                  <Button
                    onClick={() => resetPasswordMutation.mutate()}
                    disabled={resetPasswordMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                  >
                    <Key className="h-4 w-4" />
                    Reset Password Sekarang
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ubah Password Akun</h4>
                    <p className="text-[11px] text-slate-500">
                      Perbarui kata sandi akun login Anda secara berkala untuk menjaga keamanan akses portal.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setChangePasswordError(null);
                      setChangePasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
                      setChangePasswordModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <Key className="h-4 w-4" />
                    Ubah Password Sekarang
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400">Karyawan ini belum terhubung dengan akun login ESS.</p>
            </div>
          )}
        </Card>
      )}

      {/* ── NAVIGASI ARAH ANTAR TAB (BOTTOM DIRECTIONAL BAR) ──────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-8 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 rounded-2xl border shadow-xs">
        {prevTab ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToTab(prevTab.id)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-full sm:w-auto"
          >
            <span className="text-slate-400 font-normal mr-1">Sebelumnya:</span> {prevTab.label}
          </Button>
        ) : (
          <div className="hidden sm:block w-32" />
        )}

        {/* Indikator Posisi Tab & Dot Bulatan */}
        <div className="flex flex-col items-center gap-1.5 order-first sm:order-none">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Tab {currentTabIndex + 1} dari {TABS_CONFIG.length} • {TABS_CONFIG[currentTabIndex]?.shortLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {TABS_CONFIG.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                onClick={() => goToTab(t.id)}
                title={t.label}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentTabIndex
                    ? mode === 'ess'
                      ? 'w-7 bg-emerald-600'
                      : 'w-7 bg-blue-600'
                    : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {nextTab ? (
          <Button
            type="button"
            size="sm"
            onClick={() => goToTab(nextTab.id)}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className={`text-xs font-semibold w-full sm:w-auto ${
              mode === 'ess'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            <span className="opacity-90 font-normal mr-1">Selanjutnya:</span> {nextTab.label}
          </Button>
        ) : (
          <div className="hidden sm:block w-32" />
        )}
      </div>

      {/* ── MODAL UPLOAD DOKUMEN ─────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Unggah Dokumen Karyawan"
        description="Pilih jenis dokumen dan berkas file legalitas yang valid (PDF / JPG / PNG max 20MB)"
        maxWidth="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {uploadError && <Alert variant="danger" message={uploadError} />}

          <div>
            <Select
              label="Jenis Dokumen Standar"
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              required
            >
              <option value="">-- Pilih Jenis Dokumen --</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name} ({dt.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nomor Dokumen (Opsional)"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Contoh: No. KTP / SIMPER"
            />
            <Input
              label="Tanggal Kedaluwarsa"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Berkas File (PDF / JPG / PNG / DOCX) <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 cursor-pointer"
              required
            />
          </div>

          <Input
            label="Catatan Dokumen (Opsional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Keterangan tambahan mengenai dokumen ini..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={uploadDocMutation.isPending}>
              Unggah Dokumen
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL UBAH PASSWORD (ESS) ────────────────────────────────────────── */}
      <Modal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
        title="Ubah Kata Sandi Akun"
        description="Perbarui kata sandi akun login portal mandiri Anda dengan kombinasi yang aman"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setChangePasswordError(null);
            if (changePasswordForm.new_password !== changePasswordForm.new_password_confirmation) {
              setChangePasswordError('Konfirmasi password baru tidak cocok.');
              return;
            }
            if (changePasswordForm.new_password.length < 8) {
              setChangePasswordError('Password baru minimal 8 karakter.');
              return;
            }
            changePasswordMutation.mutate(changePasswordForm);
          }}
          className="space-y-4 text-xs"
        >
          {changePasswordError && <Alert variant="danger" message={changePasswordError} />}

          <Input
            label="Kata Sandi Saat Ini"
            type="password"
            value={changePasswordForm.current_password}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, current_password: e.target.value })}
            placeholder="Masukkan kata sandi lama Anda"
            required
          />

          <Input
            label="Kata Sandi Baru"
            type="password"
            value={changePasswordForm.new_password}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, new_password: e.target.value })}
            placeholder="Minimal 8 karakter"
            required
          />

          <Input
            label="Konfirmasi Kata Sandi Baru"
            type="password"
            value={changePasswordForm.new_password_confirmation}
            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, new_password_confirmation: e.target.value })}
            placeholder="Ulangi kata sandi baru"
            required
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setChangePasswordModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={changePasswordMutation.isPending}>
              Simpan Password Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL HASIL RESET PASSWORD (ADMIN) ───────────────────────────────── */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Password Karyawan Berhasil Di-Reset"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Kredensial Login Baru
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Berikan password sementara ini kepada karyawan yang bersangkutan:
            </p>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1.5 font-mono text-left">
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Username:</span>
              <strong className="text-slate-800 dark:text-slate-200">{resetResult?.username}</strong>
            </div>
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>Password Baru:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                {resetResult?.temporary_password}
              </strong>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => copyToClipboard(resetResult?.temporary_password || '')}
            className="w-full flex items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Tersalin!' : 'Salin Password Sementara'}
          </Button>

          <Button
            type="button"
            onClick={() => setResetModalOpen(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Selesai
          </Button>
        </div>
      </Modal>
    </div>
  );
}
