'use client';

import React from 'react';
import { UserCheck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MssAttendancePage() {
  const teamAttendance = [
    { name: 'Rian Hidayat', nik: 'HRS-98124', position: 'Operator PC-400', clockIn: '06:42 WITA', status: 'HADIR', location: 'Pit Central Rantau' },
    { name: 'Doni Firmansyah', nik: 'HRS-99105', position: 'Drill & Blast Crew', clockIn: '06:48 WITA', status: 'HADIR', location: 'Pit Central Rantau' },
    { name: 'Syaiful Anwar', nik: 'HRS-97330', position: 'Pit Surveyor', clockIn: '06:35 WITA', status: 'HADIR', location: 'Pit Central Rantau' },
    { name: 'Hendra Wijaya', nik: 'HRS-99042', position: 'Mekanik Heavy Equip', clockIn: '--:--', status: 'OFF_ROSTER', location: 'Home Roster' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presensi & Kehadiran Tim"
        subtitle="Monitoring kehadiran langsung (real-time) anggota regu kerja tambang Anda hari ini"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Kekuatan Regu Shift</span>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">18 <span className="text-xs font-normal text-slate-400">Total</span></p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Hadir Masuk (Clock In)</span>
          <p className="mt-2 text-2xl font-bold text-emerald-600">15 <span className="text-xs font-normal text-slate-400">Personel</span></p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Keterlambatan</span>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">0 <span className="text-xs font-normal text-slate-400">Kasus</span></p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Off / Cuti Roster</span>
          <p className="mt-2 text-2xl font-bold text-purple-600">3 <span className="text-xs font-normal text-slate-400">Personel</span></p>
        </Card>
      </div>

      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Log Presensi Tim Hari Ini (Rabu, 16 Sep 2026)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Nama Personel</th>
                <th className="py-2.5 px-3 font-semibold">Posisi</th>
                <th className="py-2.5 px-3 font-semibold">Waktu Clock In</th>
                <th className="py-2.5 px-3 font-semibold">Lokasi Geotag</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamAttendance.map((t) => (
                <tr key={t.nik} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                    {t.name} <span className="text-slate-400 font-mono">({t.nik})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{t.position}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{t.clockIn}</td>
                  <td className="py-3 px-3 text-slate-500">{t.location}</td>
                  <td className="py-3 px-3">
                    {t.status === 'HADIR' ? (
                      <Badge variant="success">Hadir Di Site</Badge>
                    ) : (
                      <Badge variant="neutral">Off Roster</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
