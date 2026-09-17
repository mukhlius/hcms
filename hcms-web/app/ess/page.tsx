'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CalendarDays, 
  Clock, 
  Briefcase, 
  CreditCard, 
  FileSpreadsheet, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Building2, 
  HardHat, 
  ChevronRight,
  ShieldCheck,
  CalendarCheck,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { hasSubordinates } from '@/config/workspaces';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function EssDashboardPage() {
  const { user } = useAuthStore();
  const isManager = hasSubordinates(user);

  const [teamApprovals, setTeamApprovals] = React.useState([
    {
      id: 'REQ-LV-089',
      name: 'Rian Hidayat',
      nik: 'HRS-98124',
      position: 'Operator Excavator PC-400',
      type: 'Cuti Tahunan',
      details: '20 Sep - 24 Sep 2026 (5 Hari)',
      reason: 'Pernikahan adik kandung di Samarinda',
    },
    {
      id: 'REQ-SPL-041',
      name: 'Doni Firmansyah',
      nik: 'HRS-99105',
      position: 'Drilling & Blasting Crew',
      type: 'Lembur SPL',
      details: '17 Sep 2026 • 4 Jam (16:00 - 20:00)',
      reason: 'Persiapan peledakan bench 4A sebelum hujan',
    },
  ]);

  const handleManagerAction = (id: string, action: 'approve' | 'reject') => {
    setTeamApprovals((prev) => prev.filter((item) => item.id !== id));
    alert(`Pengajuan ${id} berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`);
  };

  const quickActions = [
    {
      title: 'Ajukan Cuti / Izin',
      desc: 'Form permohonan cuti tahunan, sakit, atau izin dinas lapangan',
      href: '/ess/leave',
      icon: <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      color: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    {
      title: 'Presensi & Kehadiran',
      desc: 'Catat presensi masuk/pulang kerja dan riwayat tap absensi',
      href: '/ess/attendance',
      icon: <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      color: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    {
      title: 'Pengajuan Lembur (SPL)',
      desc: 'Daftar penugasan lembur shift operasional dan verifikasi SPL',
      href: '/ess/overtime',
      icon: <Briefcase className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      color: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    {
      title: 'Klaim & Benefit',
      desc: 'Klaim rawat jalan, pergantian kacamata, dan kompensasi tugas',
      href: '/ess/claims',
      icon: <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      color: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    {
      title: 'Slip Gaji Digital',
      desc: 'Lihat rincian penerimaan gaji bulanan dan unduh format PDF resmi',
      href: '/ess/payslip',
      icon: <FileSpreadsheet className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      color: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
    {
      title: 'Biodata & Berkas Saya',
      desc: 'Perbarui sertifikat tambang, dokumen KTP/BPJS, dan kontak darurat',
      href: '/ess/profile',
      icon: <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      color: 'hover:border-teal-300 dark:hover:border-teal-700',
    },
  ];

  const recentSubmissions = [
    {
      id: 'REQ-2026-081',
      type: 'Cuti Tahunan',
      dates: '22 Sep 2026 - 26 Sep 2026 (5 Hari)',
      status: 'PENDING',
      approver: 'Budi Santoso (Foreman)',
      created_at: 'Kemarin, 14:20',
    },
    {
      id: 'SPL-2026-114',
      type: 'Lembur Shift Operasional',
      dates: '15 Sep 2026 (3 Jam)',
      status: 'APPROVED',
      approver: 'Agus Pratama (Superintendent)',
      created_at: '15 Sep 2026',
    },
    {
      id: 'CLM-2026-042',
      type: 'Klaim Kacamata Kerja',
      dates: 'Kuitansi Optik Sejahtera (Rp 750.000)',
      status: 'APPROVED',
      approver: 'HR Compensation & Benefit',
      created_at: '08 Sep 2026',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <PageHeader
        title={`Halo, ${user?.name || 'Karyawan'}`}
        subtitle="Portal Layanan Mandiri Karyawan (Employee Self-Service) — Kelola administrasi personel Anda secara mandiri dan transparan"
      />

      {/* Kartu Profil Personel Singkat */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 text-white shadow-md dark:border-slate-800">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 font-bold text-2xl border border-emerald-500/30 shadow-inner">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-white">{user?.name || 'Karyawan'}</h2>
                  <Badge variant="success" className="text-xs">
                    {user?.status || 'AKTIF'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 font-mono">
                  NIK: <span className="font-semibold text-emerald-300">{user?.username || 'HRS-99210'}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-slate-300" />
                    {user?.department?.name || 'Operasional Penambangan (Mining Ops)'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-300" />
                    {user?.site?.name || 'Site Batubara Rantau (B4)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/ess/attendance"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-98 cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                Presensi Hari Ini
              </Link>
              <Link
                href="/ess/leave"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white shadow-xs backdrop-blur-xs transition-all hover:bg-white/20 active:scale-98 cursor-pointer"
              >
                <CalendarDays className="h-4 w-4" />
                Ajukan Cuti
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 4 Kartu Metrik Ringkas Karyawan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeInUp delay={0.05}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sisa Hak Cuti</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">12</span>
              <span className="text-xs text-slate-500">Hari Kerja</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">10 Cuti Tahunan + 2 Kompensasi Roster</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Presensi Hari Ini</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Hadir (On Duty)</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">Masuk: 06:48 WITA (Shift Pagi)</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pengajuan Berjalan</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">1</span>
              <span className="text-xs text-slate-500">Menunggu Verifikasi</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Pengajuan Cuti Tahunan 22 Sep</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pola Roster Tambang</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <CalendarCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">6 : 2</span>
              <span className="text-xs text-slate-500">Mingguan</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Hari ke-4 bertugas aktif di Site</p>
          </Card>
        </FadeInUp>
      </div>

      {/* KHUSUS ATASAN / MANAGER: Antrean Persetujuan Tim Bawahan */}
      {isManager && (
        <FadeIn>
          <Card className="p-6 border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-white to-white dark:border-amber-900/50 dark:bg-slate-900 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Pusat Persetujuan Tim (Approval Queue)
                    </h3>
                    <Badge variant="warning" className="text-xs font-semibold">
                      {teamApprovals.length} Menunggu
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Permohonan cuti dan lembur dari anggota tim bawahan langsung Anda
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Link
                  href="/mss/approvals"
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300/80 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-300 transition-colors"
                >
                  Semua Approval <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/mss/team"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  Direktori Tim <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {teamApprovals.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
                  Semua pengajuan bawahan telah Anda proses
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teamApprovals.map((item) => (
                  <div key={item.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">({item.nik})</span>
                        <Badge variant="primary" className="text-[10px]">{item.position}</Badge>
                        <Badge variant="warning" className="text-[10px]">{item.type}</Badge>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.details} — &ldquo;{item.reason}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleManagerAction(item.id, 'reject')}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition-colors cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleManagerAction(item.id, 'approve')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Setujui
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </FadeIn>
      )}

      {/* Menu Aksi Cepat Mandiri */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Pusat Administrasi Mandiri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <FadeInUp key={action.title} delay={0.05 * idx}>
              <Link href={action.href} className="block group">
                <Card className={`p-5 transition-all duration-200 border-slate-200/80 hover:shadow-md ${action.color} dark:border-slate-800 dark:bg-slate-900`}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                      {action.icon}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {action.desc}
                  </p>
                </Card>
              </Link>
            </FadeInUp>
          ))}
        </div>
      </div>

      {/* Riwayat Pengajuan Terkini */}
      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Riwayat Pengajuan Terkini
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau status persetujuan atas pengajuan cuti, SPL, dan klaim Anda
            </p>
          </div>
          <Link
            href="/ess/leave"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentSubmissions.map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    • {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.dates} — Diajukan kepada: <span className="font-medium text-slate-700 dark:text-slate-300">{item.approver}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400">
                  {item.created_at}
                </span>
                {item.status === 'APPROVED' && (
                  <Badge variant="success" className="text-xs font-semibold">
                    Disetujui
                  </Badge>
                )}
                {item.status === 'PENDING' && (
                  <Badge variant="warning" className="text-xs font-semibold">
                    Menunggu Atasan
                  </Badge>
                )}
                {item.status === 'REJECTED' && (
                  <Badge variant="danger" className="text-xs font-semibold">
                    Ditolak
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
