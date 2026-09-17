'use client';

import React from 'react';
import { Briefcase, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EssOvertimePage() {
  const overtimeList = [
    {
      id: 'SPL-2026-114',
      date: '15 Sep 2026',
      hours: '3 Jam (17:00 - 20:00)',
      reason: 'Penanganan breakdown unit excavator Pit B4',
      status: 'APPROVED',
      supervisor: 'Agus Pratama (Superintendent)',
      multiplier: '1.5x - 2x',
    },
    {
      id: 'SPL-2026-089',
      date: '02 Sep 2026',
      hours: '4 Jam (16:00 - 20:00)',
      reason: 'Pemenuhan target hauling batubara akhir shift',
      status: 'APPROVED',
      supervisor: 'Budi Santoso (Foreman)',
      multiplier: '1.5x - 2x',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Surat Perintah Lembur (SPL)"
          subtitle="Daftar perintah lembur kerja resmi, verifikasi jam aktual, dan akumulasi perhitungan kompensasi lembur"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Total Lembur Bulan Ini</span>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">7.0 <span className="text-xs font-normal text-slate-400">Jam</span></p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">SPL Terverifikasi</span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">2 <span className="text-xs font-normal text-slate-400">Surat Tugas</span></p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Estimasi Pengali Upah</span>
          <p className="mt-2 text-2xl font-bold text-blue-600">12.5 <span className="text-xs font-normal text-slate-400">Jam Setara</span></p>
        </Card>
      </div>

      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Riwayat Perintah Kerja Lembur
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {overtimeList.map((spl) => (
            <div key={spl.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{spl.id}</span>
                  <span className="text-slate-400">• {spl.date}</span>
                  <Badge variant="primary" className="text-[10px]">{spl.hours}</Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{spl.reason}</p>
                <p className="text-[11px] text-slate-400">Pemberi Tugas: {spl.supervisor}</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="success">Disetujui</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
