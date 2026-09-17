'use client';

import React from 'react';
import { 
  User as UserIcon, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Award, 
  FileText, 
  HeartHandshake, 
  HardHat 
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function EssProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil & Dokumen Saya"
        subtitle="Informasi personalia, data kepegawaian operasional tambang, serta sertifikasi keselamatan kerja Anda"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Kartu Identitas Personel */}
        <FadeIn className="lg:col-span-1 space-y-6">
          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold text-3xl shadow-inner border border-emerald-200 dark:border-emerald-800">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              {user?.name || 'Nama Karyawan'}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              NIK: {user?.username || 'HRS-99210'}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <Badge variant="success" className="text-xs">
                {user?.status || 'AKTIF'}
              </Badge>
              <Badge variant="primary" className="text-xs">
                Tetap (PKWTT)
              </Badge>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-left space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="truncate">{user?.email || 'karyawan@hasnur.co.id'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="truncate">{user?.department?.name || 'Mining Operation Dept'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span className="truncate">{user?.site?.name || 'Site Tambang Rantau (B4)'}</span>
              </div>
            </div>
          </Card>

          {/* Sertifikat K3 Tambang & SIMPER */}
          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HardHat className="h-4 w-4 text-amber-500" />
              Sertifikasi & SIMPER Tambang
            </h4>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-200/80 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">SIMPER Full Unit LV</span>
                  <Badge variant="success" className="text-[10px]">Aktif</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Berlaku s/d 14 Desember 2027</p>
              </div>
              <div className="rounded-lg border border-slate-200/80 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">POP (Pengawas Operasional)</span>
                  <Badge variant="success" className="text-[10px]">Tersertifikasi</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">BNSP ESDM • No. 7114-K3-2024</p>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Kolom Kanan: Rincian Lengkap Data Kepegawaian */}
        <FadeIn className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Informasi Kepegawaian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Jabatan / Posisi</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Mining Pit Supervisor</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Level Organisasi</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Level 3 (Supervisor / Specialist)</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Golongan (Grade)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Grade 4B</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Point of Hire (POH)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Banjarmasin (Local Site Hire)</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Tanggal Mulai Bekerja (Join Date)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">01 Maret 2021 (Masa Kerja: 5 thn 6 bln)</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Atasan Langsung</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Agus Pratama (Superintendent)</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              Data Pribadi & Jaminan Sosial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Nomor Induk Kependudukan (NIK KTP)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">6303051408890001</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Nomor Pokok Wajib Pajak (NPWP)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">82.912.441.2-732.000</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">BPJS Ketenagakerjaan (JHT & JP)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">21098452109</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">BPJS Kesehatan</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 font-mono">0001874291882</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Kontak Darurat (Emergency Contact)</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Siti Rahmah (Istri) • 0812-5541-9921</p>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Golongan Darah</label>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">O (Rhesus Positif)</p>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
