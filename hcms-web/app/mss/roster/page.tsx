'use client';

import React from 'react';
import { CalendarRange, Users, CalendarCheck, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MssRosterPage() {
  const rosterSchedules = [
    { name: 'Regu Alpha (Pit Production)', rosterPattern: '6 : 2 (6 Hari Kerja, 2 Hari Off)', totalCrew: '8 Orang', currentShift: 'Shift 1 (07:00 - 15:00)', offDate: 'Sabtu - Minggu' },
    { name: 'Regu Bravo (Drilling & Blasting)', rosterPattern: '6 : 2 (6 Hari Kerja, 2 Hari Off)', totalCrew: '6 Orang', currentShift: 'Shift 1 (07:00 - 15:00)', offDate: 'Senin - Selasa' },
    { name: 'Regu Charlie (Hauling & Disposal)', rosterPattern: '10 : 4 (Site Fly-In Fly-Out)', totalCrew: '4 Orang', currentShift: 'Shift 2 (15:00 - 23:00)', offDate: 'Minggu Depan' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Roster & Shift Tim"
        subtitle="Pengaturan dan pemantauan siklus kerja lapangan (Roster 6:2, 10:4) dan giliran shift regu operasional"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rosterSchedules.map((r) => (
          <Card key={r.name} className="p-5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="primary" className="text-[10px]">{r.totalCrew}</Badge>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{r.currentShift}</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.name}</h4>
            <p className="text-xs text-slate-500 font-medium">Pola: {r.rosterPattern}</p>
            <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Jadwal Libur / Off: <span className="font-semibold text-slate-800 dark:text-slate-200">{r.offDate}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
