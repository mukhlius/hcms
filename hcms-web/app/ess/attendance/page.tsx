'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  History,
  Timer,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function EssAttendancePage() {
  const [clockedIn, setClockedIn] = useState(true);
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const attendanceHistory = [
    { date: '16 Sep 2026', day: 'Rabu', in: '06:48', out: '--:--', status: 'ON_TIME', shift: 'Shift 1 (07:00 - 15:00)', location: 'Pit Central Rantau' },
    { date: '15 Sep 2026', day: 'Selasa', in: '06:40', out: '15:15', status: 'ON_TIME', shift: 'Shift 1 (07:00 - 15:00)', location: 'Pit Central Rantau' },
    { date: '14 Sep 2026', day: 'Senin', in: '06:55', out: '17:30', status: 'OVERTIME', shift: 'Shift 1 + Lembur', location: 'Pit Central Rantau' },
    { date: '13 Sep 2026', day: 'Minggu', in: '06:42', out: '15:10', status: 'ON_TIME', shift: 'Shift 1 (07:00 - 15:00)', location: 'Pit Central Rantau' },
    { date: '12 Sep 2026', day: 'Sabtu', in: '--:--', out: '--:--', status: 'OFF_ROSTER', shift: 'Off Roster', location: '-' },
    { date: '11 Sep 2026', day: 'Jumat', in: '--:--', out: '--:--', status: 'OFF_ROSTER', shift: 'Off Roster', location: '-' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presensi & Kehadiran"
        subtitle="Pencatatan waktu kerja (Clock-in / Clock-out) berbasis geolokasi dan riwayat kehadiran operasional tambang"
      />

      {/* Widget Clock-In / Clock-Out */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FadeIn className="lg:col-span-1">
          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Shift Hari Ini</span>
              <Badge variant="primary">Shift 1 (Pagi)</Badge>
            </div>

            <div className="py-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                {currentTime} <span className="text-xs font-normal text-slate-400">WITA</span>
              </span>
              <p className="text-xs text-slate-500 mt-1">Rabu, 16 September 2026</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 dark:bg-slate-800/50 dark:border-slate-700/60 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jam Masuk (Clock In):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">06:48 WITA</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Jam Pulang (Clock Out):</span>
                <span className="font-bold text-slate-400 font-mono">-- : --</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                <span>Radius Valid: Pit B4 (Geofence OK)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setClockedIn(!clockedIn)}
              className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-500 active:scale-98 cursor-pointer"
            >
              {clockedIn ? 'Absen Pulang (Clock Out)' : 'Absen Masuk (Clock In)'}
            </button>
          </Card>
        </FadeIn>

        {/* Ringkasan Akumulasi Bulan Berjalan */}
        <FadeIn className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-full">
            <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500">Hari Hadir Kerja</span>
              <div className="my-2">
                <span className="text-2xl font-bold text-emerald-600">14</span>
                <span className="text-xs text-slate-400 ml-1">Hari</span>
              </div>
              <p className="text-[11px] text-slate-400">100% dari jadwal shift</p>
            </Card>

            <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500">Keterlambatan</span>
              <div className="my-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">0</span>
                <span className="text-xs text-slate-400 ml-1">Kali</span>
              </div>
              <p className="text-[11px] text-emerald-500">Disiplin presensi prima</p>
            </Card>

            <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500">Total Lembur</span>
              <div className="my-2">
                <span className="text-2xl font-bold text-amber-600">6.5</span>
                <span className="text-xs text-slate-400 ml-1">Jam</span>
              </div>
              <p className="text-[11px] text-slate-400">Terverifikasi SPL</p>
            </Card>

            <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <span className="text-xs font-medium text-slate-500">Cuti / Izin</span>
              <div className="my-2">
                <span className="text-2xl font-bold text-purple-600">0</span>
                <span className="text-xs text-slate-400 ml-1">Hari</span>
              </div>
              <p className="text-[11px] text-slate-400">Bulan September 2026</p>
            </Card>
          </div>
        </FadeIn>
      </div>

      {/* Tabel Riwayat Kehadiran */}
      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Riwayat Presensi Bulan Ini
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi catatan waktu dan lokasi presensi harian
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Tanggal</th>
                <th className="py-2.5 px-3 font-semibold">Jadwal Shift</th>
                <th className="py-2.5 px-3 font-semibold">Clock In</th>
                <th className="py-2.5 px-3 font-semibold">Clock Out</th>
                <th className="py-2.5 px-3 font-semibold">Lokasi Tap</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceHistory.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                    {row.date} <span className="text-slate-400 font-normal">({row.day})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.shift}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{row.in}</td>
                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{row.out}</td>
                  <td className="py-3 px-3 text-slate-500">{row.location}</td>
                  <td className="py-3 px-3">
                    {row.status === 'ON_TIME' && <Badge variant="success">Tepat Waktu</Badge>}
                    {row.status === 'OVERTIME' && <Badge variant="warning">Ada Lembur</Badge>}
                    {row.status === 'OFF_ROSTER' && <Badge variant="neutral">Off Roster</Badge>}
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
