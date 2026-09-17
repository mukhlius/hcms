'use client';

import React from 'react';
import { CreditCard, Plus, Receipt, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EssClaimsPage() {
  const claims = [
    {
      id: 'CLM-2026-042',
      type: 'Klaim Kacamata Kerja',
      amount: 'Rp 750.000',
      date: '08 Sep 2026',
      receiptNo: 'INV/OPT/8821',
      status: 'APPROVED',
      paidDate: 'Payroll 25 Sep 2026',
    },
    {
      id: 'CLM-2026-019',
      type: 'Reimbursement Rawat Jalan (Spesialis)',
      amount: 'Rp 450.000',
      date: '12 Jul 2026',
      receiptNo: 'KW-RS-4109',
      status: 'PAID',
      paidDate: 'Payroll 25 Jul 2026',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Klaim & Manfaat Karyawan"
        subtitle="Pengajuan penggantian biaya rawat jalan, kacamata kerja, dan tunjangan operasional lainnya"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Plafon Kacamata Tahunan</span>
          <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Rp 1.000.000</p>
          <p className="text-[11px] text-emerald-600 mt-1">Sisa Plafon: Rp 250.000</p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Plafon Rawat Jalan Mandiri</span>
          <p className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Rp 5.000.000</p>
          <p className="text-[11px] text-slate-400 mt-1">Sisa Plafon: Rp 4.550.000</p>
        </Card>
        <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-medium text-slate-500">Menunggu Pencairan</span>
          <p className="mt-2 text-xl font-bold text-amber-600">Rp 750.000</p>
          <p className="text-[11px] text-slate-400 mt-1">Dijadwalkan gajian 25 Sep</p>
        </Card>
      </div>

      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Riwayat Klaim Medis & Penggantian Biaya
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {claims.map((c) => (
            <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{c.id}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">• {c.type}</span>
                </div>
                <p className="text-slate-500">
                  Tanggal Bukti: {c.date} (No. Kuitansi: <span className="font-mono text-slate-700 dark:text-slate-300">{c.receiptNo}</span>)
                </p>
                <p className="text-[11px] text-slate-400">Jadwal Bayar: {c.paidDate}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.amount}</span>
                {c.status === 'APPROVED' && <Badge variant="success">Disetujui HR</Badge>}
                {c.status === 'PAID' && <Badge variant="primary">Tercairkan</Badge>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
