'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Building2,
  MapPin,
  Briefcase,
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
  Home
} from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { Employee, EmployeeCareerHistory } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast, confirmDialog } from '@/stores/alertStore';
import { formatDate } from '@/lib/utils';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = Number(params.id);

  const [activeTab, setActiveTab] = useState<'overview' | 'career' | 'family' | 'health' | 'education' | 'emergency' | 'account'>('overview');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ username: string; temporary_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Load Employee Details
  const { data: res, isLoading, error } = useQuery({
    queryKey: ['employee-detail', employeeId],
    queryFn: () => employeeService.getEmployee(employeeId),
    enabled: !isNaN(employeeId),
  });

  const employee: Employee | undefined = res?.data;

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (status: string) => employeeService.toggleStatus(employeeId, status),
    onSuccess: () => {
      toast.success('Status kepegawaian berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: () => employeeService.resetPassword(employeeId),
    onSuccess: (response) => {
      setResetResult(response.data);
      setResetModalOpen(true);
      toast.success('Password login karyawan berhasil di-reset');
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal me-reset password');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Password disalin ke clipboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Karyawan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">ID karyawan tidak valid atau sudah dihapus dari sistem.</p>
        <Link href="/admin/employees">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Karyawan
          </Button>
        </Link>
      </div>
    );
  }

  const isActive = employee.employment_status === 'ACTIVE';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Karyawan
        </Link>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
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
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {employee.site?.name || 'HO'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
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
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: 'overview', label: 'Ringkasan & Profil', icon: Users },
          { id: 'career', label: 'Riwayat Karir (Snapshot Baku)', icon: ArrowRightLeft, badge: employee.career_histories?.length },
          { id: 'family', label: 'Keluarga & Tanggungan', icon: Heart, badge: employee.families?.length },
          { id: 'health', label: 'Data Fisik & APD Tambang', icon: HardHat },
          { id: 'education', label: 'Pendidikan', icon: GraduationCap, badge: employee.educations?.length },
          { id: 'emergency', label: 'Kontak Darurat', icon: PhoneCall, badge: employee.emergency_contacts?.length },
          { id: 'account', label: 'Akun Login & Keamanan', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: RINGKASAN & IDENTITAS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Data Pribadi & Kontak */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Data Pribadi & Identitas Legal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Nama Lengkap</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Jenis Kelamin</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Tempat & Tanggal Lahir</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.birth_place || '-'}, {formatDate(employee.birth_date)}{' '}
                    {employee.age !== null && <span className="text-slate-400">({employee.age} tahun)</span>}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Agama</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.religion || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nomor KTP (NIK)</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {employee.id_card_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Nomor NPWP</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {employee.tax_number || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Status Pernikahan & PTKP</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.marital_status || 'SINGLE'} • Status Pajak: {employee.tax_status || 'TK/0'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Tanggal Pernikahan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.marriage_date ? formatDate(employee.marriage_date) : '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Alamat KTP & Domisili */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-600" />
                Alamat Tempat Tinggal
              </h3>
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Alamat Sesuai KTP (Legal)</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-medium text-slate-700 dark:text-slate-300">
                    {employee.ktp_address || 'Belum diisi'}
                    {employee.ktp_city && `, ${employee.ktp_city}`}
                    {employee.ktp_province && `, ${employee.ktp_province}`}
                    {employee.ktp_postal_code && ` (${employee.ktp_postal_code})`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Alamat Tinggal Saat Ini (Domisili / Mess Site)</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-medium text-slate-700 dark:text-slate-300">
                    {employee.residential_address || 'Sama dengan KTP'}
                    {employee.residential_city && `, ${employee.residential_city}`}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Kolom Kanan: Kontak & Kepegawaian */}
          <div className="space-y-6">
            {/* Status Kepegawaian */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" />
                Penempatan & Status Kerja
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Perusahaan (PT)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.company?.name || employee.company?.code || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Departemen & Section</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.department?.name || '-'} {employee.section ? `• ${employee.section.name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Site & Area Kerja Tambang</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.site?.name || 'HO'} {employee.work_area ? `• Area ${employee.work_area}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Pangkat</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.pangkat || employee.grade?.pangkat || 'Staff'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Level Jabatan (Grade)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.grade?.name || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Golongan & Jenjang</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.salary_grade?.name ? `Golongan ${employee.salary_grade.name}` : '-'} {employee.salary_grade_jenjang?.name ? `• ${employee.salary_grade_jenjang.name}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Hubungan Kerja</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.employment_type?.name || 'PKWTT'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Point of Hire (POH)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.poh || 'Lokal Site'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Tanggal Masuk (Hire Date)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(employee.hire_date)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Kontak Karyawan */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Kontak & Komunikasi
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">No. Handphone / WA</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.phone_mobile || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email Kantor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.email_company || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email Pribadi</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {employee.email_personal || '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Rekening Payroll */}
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Rekening Gaji (Payroll)
              </h3>
              {employee.bank_accounts && employee.bank_accounts.length > 0 ? (
                employee.bank_accounts.map((b, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{b.bank_name}</span>
                    <div className="font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">{b.account_number}</div>
                    <div className="text-[11px] text-slate-500">A/N: {b.account_holder}</div>
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
              <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
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

                        <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
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
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs flex flex-col sm:flex-row sm:justify-between gap-1 text-slate-500">
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Daftar Anggota Keluarga & Tanggungan Asuransi
          </h3>

          {employee.families && employee.families.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Hubungan</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">NIK / No. KTP</th>
                    <th className="px-4 py-3">L/P</th>
                    <th className="px-4 py-3">Tempat &amp; Tgl Lahir / Usia</th>
                    <th className="px-4 py-3">No. BPJS / Asuransi</th>
                    <th className="px-4 py-3 text-center">Tanggungan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employee.families.map((fam, i) => {
                    const isEligible = fam.relation_type === 'SPOUSE' || fam.relation_type === 'CHILD';

                    return (
                      <tr key={fam.id || i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {fam.relation_type === 'SPOUSE'
                            ? 'Pasangan (Istri/Suami)'
                            : fam.relation_type === 'CHILD'
                            ? `Anak ke-${fam.child_order || '-'}`
                            : fam.relation_type === 'FATHER'
                            ? 'Ayah Kandung'
                            : fam.relation_type === 'MOTHER'
                            ? 'Ibu Kandung'
                            : fam.relation_type === 'FATHER_IN_LAW'
                            ? 'Ayah Mertua'
                            : fam.relation_type === 'MOTHER_IN_LAW'
                            ? 'Ibu Mertua'
                            : fam.relation_type}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{fam.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {fam.id_card_number || '-'}
                        </td>
                        <td className="px-4 py-3">{fam.gender === 'MALE' ? 'L' : 'P'}</td>
                        <td className="px-4 py-3">
                          <span>{fam.birth_place ? `${fam.birth_place}, ` : ''}{fam.birth_date ? formatDate(fam.birth_date) : '-'}</span>
                          {fam.age !== null && <span className="text-slate-400"> ({fam.age} thn)</span>}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {isEligible ? (
                            fam.health_provider_no || '-'
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Bukan Tanggungan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isEligible ? (
                            <Badge variant={fam.is_covered_insurance ? 'success' : 'neutral'} className="text-[10px]">
                              {fam.is_covered_insurance ? 'Ditanggung' : 'Mandiri'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200 dark:border-slate-800">
                              Non-Fasilitas
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada data keluarga yang tercatat.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 4: DATA FISIK & APD TAMBANG */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <HardHat className="h-5 w-5 text-amber-500" />
              Alat Pelindung Diri (APD Lapangan Tambang)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-500 block mb-1">Sepatu Safety</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {employee.health_safety?.safety_shoe_size || '-'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Ukuran Standar</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-500 block mb-1">Baju / Wearpack</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {employee.health_safety?.shirt_size || '-'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Seragam Pit Tambang</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-500 block mb-1">Celana Kerja</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {employee.health_safety?.pants_size || '-'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Ukuran Pinggang</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] text-slate-500 block mb-1">Golongan Darah</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {employee.health_safety?.blood_type || '-'}
                  {employee.health_safety?.rhesus && (
                    <span className="text-sm font-normal">({employee.health_safety.rhesus})</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">First Aid Emergency</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Tinggi & Berat Badan</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.health_safety?.height_cm ? `${employee.health_safety.height_cm} cm` : '-'} •{' '}
                  {employee.health_safety?.weight_kg ? `${employee.health_safety.weight_kg} kg` : '-'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Catatan Medis & Alergi Obat</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.health_safety?.medical_notes || 'Tidak ada riwayat alergi yang dilaporkan.'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB CONTENT 5: PENDIDIKAN */}
      {activeTab === 'education' && (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
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
                      <Badge variant="outline" className="text-[10px]">
                        {edu.level}
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {edu.institution_name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
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
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-emerald-600" />
            Kontak Darurat (Emergency Contacts)
          </h3>

          {employee.emergency_contacts && employee.emergency_contacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employee.emergency_contacts.map((em, idx) => (
                <div
                  key={em.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{em.name}</h4>
                    <Badge variant="outline" className="text-[10px]">
                      {em.relationship}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{em.phone_number}</span>
                  </div>
                  {em.address && <p className="text-slate-500 text-[11px]">{em.address}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-8">Belum ada kontak darurat yang didaftarkan.</p>
          )}
        </Card>
      )}

      {/* TAB CONTENT 7: AKUN LOGIN & KEAMANAN */}
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
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-400">Karyawan ini belum terhubung dengan akun login ESS.</p>
            </div>
          )}
        </Card>
      )}

      {/* MODAL HASIL RESET PASSWORD */}
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
