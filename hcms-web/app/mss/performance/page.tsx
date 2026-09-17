'use client';

import React from 'react';
import { Award, TrendingUp, CheckCircle2, UserCheck, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MssPerformancePage() {
  const reviews = [
    { name: 'Rian Hidayat', nik: 'HRS-98124', position: 'Operator Excavator', kpiScore: '92.5%', grade: 'A (Sangat Baik)', achievements: 'Nol insiden keselamatan (Zero Accident), target produktivitas pit tercapai 105%' },
    { name: 'Doni Firmansyah', nik: 'HRS-99105', position: 'Drilling & Blasting', kpiScore: '88.0%', grade: 'B+ (Baik)', achievements: 'Efisiensi bahan peledak bench 4, kepatuhan K3LH 100%' },
    { name: 'Syaiful Anwar', nik: 'HRS-97330', position: 'Pit Surveyor', kpiScore: '94.0%', grade: 'A (Sangat Baik)', achievements: 'Akurasi perhitungan volume batubara tinggi dan drone topography tepat waktu' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluasi & Kinerja Tim"
        subtitle="Review capaian Key Performance Indicators (KPI), keselamatan kerja (K3LH), dan usulan kenaikan grade/kompetensi personel"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((rev) => (
          <Card key={rev.nik} className="p-5 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{rev.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{rev.nik} • {rev.position}</p>
              </div>
              <Badge variant="success" className="text-xs font-bold">{rev.grade}</Badge>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Skor Capaian KPI:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{rev.kpiScore}</span>
              </div>
              <div className="pt-1 text-[11px] text-slate-500 leading-relaxed">
                Catatan: {rev.achievements}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
