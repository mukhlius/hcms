'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Filter, CalendarDays, Briefcase, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function MssApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'leave' | 'overtime' | 'claims'>('all');

  const [items, setItems] = useState([
    {
      id: 'LV-2026-089',
      employee: 'Rian Hidayat',
      nik: 'HRS-98124',
      position: 'Operator Excavator PC-400',
      category: 'leave',
      type: 'Cuti Tahunan',
      period: '20 Sep - 24 Sep 2026 (5 Hari)',
      note: 'Pernikahan adik kandung di Samarinda',
      created_at: '16 Sep 2026',
    },
    {
      id: 'SPL-2026-041',
      employee: 'Doni Firmansyah',
      nik: 'HRS-99105',
      position: 'Drilling & Blasting Crew',
      category: 'overtime',
      type: 'Lembur Shift Tambang (SPL)',
      period: '17 Sep 2026 (4 Jam: 16:00 - 20:00)',
      note: 'Persiapan peledakan bench 4A sebelum hujan',
      created_at: '15 Sep 2026',
    },
    {
      id: 'CLM-2026-012',
      employee: 'Syaiful Anwar',
      nik: 'HRS-97330',
      position: 'Pit Surveyor',
      category: 'claims',
      type: 'Klaim Medis Rawat Jalan',
      period: 'Rp 420.000 (Spesialis Penyakit Dalam)',
      note: 'Kuitansi RSUD Ulin Banjarmasin',
      created_at: '15 Sep 2026',
    },
    {
      id: 'LV-2026-088',
      employee: 'Hendra Wijaya',
      nik: 'HRS-99042',
      position: 'Mekanik Heavy Equipment',
      category: 'leave',
      type: 'Cuti Kompensasi Roster',
      period: '25 Sep - 27 Sep 2026 (3 Hari)',
      note: 'Kompensasi shift standby perbaikan dozer',
      created_at: '14 Sep 2026',
    },
  ]);

  const handleProcess = (id: string, action: 'approve' | 'reject') => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    alert(`Pengajuan ${id} berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`);
  };

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter((i) => i.category === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Persetujuan (Approval Center)"
        subtitle="Verifikasi dan berikan persetujuan berjenjang atas permohonan cuti, perintah lembur, dan klaim dari tim Anda"
      />

      {/* Tab Filter Kategori */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Semua Pengajuan ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('leave')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'leave'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Cuti & Izin ({items.filter(i => i.category === 'leave').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('overtime')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'overtime'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Lembur SPL ({items.filter(i => i.category === 'overtime').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('claims')}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'claims'
              ? 'bg-amber-500 text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          Klaim Medis ({items.filter(i => i.category === 'claims').length})
        </button>
      </div>

      {/* Daftar Pengajuan */}
      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 opacity-80" />
            <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              Antrean Bersih
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Tidak ada pengajuan pending pada kategori ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => (
              <div key={item.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.employee}</span>
                    <span className="text-slate-400 font-mono">({item.nik})</span>
                    <Badge variant="primary" className="text-[10px]">{item.position}</Badge>
                    <Badge variant="warning" className="text-[10px]">{item.type}</Badge>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.period}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Catatan: &ldquo;{item.note}&rdquo; • Diajukan: <span className="text-slate-400">{item.created_at}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => handleProcess(item.id, 'reject')}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                  >
                    Tolak
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcess(item.id, 'approve')}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white shadow-xs hover:bg-emerald-500 cursor-pointer"
                  >
                    Setujui
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
