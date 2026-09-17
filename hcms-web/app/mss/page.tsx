'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CalendarRange, 
  Award, 
  ArrowUpRight, 
  ChevronRight, 
  Building2, 
  MapPin, 
  UserCheck, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function MssDashboardPage() {
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState([
    {
      id: 'REQ-LV-089',
      name: 'Rian Hidayat',
      nik: 'HRS-98124',
      position: 'Operator Excavator PC-400',
      type: 'Cuti Tahunan',
      details: '20 Sep 2026 - 24 Sep 2026 (5 Hari)',
      reason: 'Pernikahan adik kandung di Samarinda',
      created_at: 'Hari ini, 09:15',
    },
    {
      id: 'REQ-SPL-041',
      name: 'Doni Firmansyah',
      nik: 'HRS-99105',
      position: 'Drilling & Blasting Crew',
      type: 'Lembur Shift Tambang (SPL)',
      details: '17 Sep 2026 • 4 Jam (16:00 - 20:00)',
      reason: 'Persiapan peledakan bench 4A sebelum hujan',
      created_at: 'Kemarin, 16:40',
    },
    {
      id: 'REQ-CLM-012',
      name: 'Syaiful Anwar',
      nik: 'HRS-97330',
      position: 'Pit Surveyor',
      type: 'Klaim Medis Rawat Jalan',
      details: 'Rp 420.000 (Pemeriksaan Dokter Spesialis)',
      reason: 'Kuitansi RSUD Ulin Banjarmasin',
      created_at: 'Kemarin, 11:20',
    },
  ]);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setApprovals((prev) => prev.filter((item) => item.id !== id));
    alert(`Pengajuan ${id} berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`);
  };

  const mssShortcuts = [
    {
      title: 'Pusat Persetujuan (Approval)',
      desc: 'Kelola seluruh daftar antrean pengajuan cuti, SPL, dan klaim bawahan',
      href: '/mss/approvals',
      icon: <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    },
    {
      title: 'Direktori Tim (Team Hub)',
      desc: 'Pantau profil, kompetensi, status sertifikat, dan penugasan bawahan',
      href: '/mss/team',
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: 'Presensi & Kehadiran Tim',
      desc: 'Laporan real-time kehadiran regu kerja, keterlambatan, dan status shift',
      href: '/mss/attendance',
      icon: <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      title: 'Jadwal Roster & Gilir Shift',
      desc: 'Pengaturan jadwal gilir kerja lapangan, pergantian regu, dan off-roster',
      href: '/mss/roster',
      icon: <CalendarRange className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    },
    {
      title: 'Evaluasi & Penilaian Kinerja',
      desc: 'Review berkala performa KPI individu dan rekomendasi peningkatan grade',
      href: '/mss/performance',
      icon: <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <PageHeader
        title={`Portal Atasan (MSS) — ${user?.name || 'Manager'}`}
        subtitle="Manager Self-Service — Pusat pengawasan regu kerja, persetujuan mandiri (approval), dan pengelolaan operasional tim Anda"
      />

      {/* Kartu Metrik Ringkas Tim */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FadeInUp delay={0.05}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Anggota Tim Langsung</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">18</span>
              <span className="text-xs text-slate-500">Personel</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Regu Pit Central B4</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.1}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Bertugas Hari Ini</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">15</span>
              <span className="text-xs text-slate-500">Hadir Aktif</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Shift 1 Pagi (83% Kapasitas)</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.15}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Sedang Cuti / Off</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
              <span className="text-xs text-slate-500">Personel</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">1 Cuti Tahunan, 2 Off Roster</p>
          </Card>
        </FadeInUp>

        <FadeInUp delay={0.2}>
          <Card className="p-4.5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Menunggu Persetujuan</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{approvals.length}</span>
              <span className="text-xs text-slate-500">Perlu Verifikasi</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Memerlukan persetujuan Anda</p>
          </Card>
        </FadeInUp>
      </div>

      {/* Antrean Persetujuan Cepat (Approval Center) */}
      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Pusat Persetujuan Cepat</span>
              <Badge variant="warning" className="text-xs font-semibold">
                {approvals.length} Menunggu
              </Badge>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setujui atau tolak permohonan bawahan langsung secara instan
            </p>
          </div>
          <Link
            href="/mss/approvals"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Buka Approval Center <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {approvals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 opacity-80" />
            <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              Tidak Ada Pengajuan Menunggu
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Semua permohonan cuti, SPL, dan klaim dari tim Anda sudah selesai diproses.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {approvals.map((item) => (
              <div key={item.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</span>
                    <span className="font-mono text-[11px] text-slate-400">({item.nik})</span>
                    <Badge variant="primary" className="text-[10px]">{item.position}</Badge>
                    <Badge variant="warning" className="text-[10px]">{item.type}</Badge>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.details}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Alasan: &ldquo;{item.reason}&rdquo; • <span className="text-slate-400">{item.created_at}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end lg:self-auto">
                  <button
                    type="button"
                    onClick={() => handleAction(item.id, 'reject')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition-colors cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(item.id, 'approve')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
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

      {/* Navigasi Modul Manajerial (MSS Hub) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Modul Pengelolaan Tim & Operasional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mssShortcuts.map((sc, idx) => (
            <FadeInUp key={sc.title} delay={0.05 * idx}>
              <Link href={sc.href} className="block group">
                <Card className="p-5 transition-all duration-200 border-slate-200/80 hover:shadow-md hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                      {sc.icon}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {sc.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {sc.desc}
                  </p>
                </Card>
              </Link>
            </FadeInUp>
          ))}
        </div>
      </div>
    </div>
  );
}
