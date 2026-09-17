'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Eye, Lock, ShieldCheck, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuthStore } from '@/stores/authStore';

export default function EssPayslipPage() {
  const { user } = useAuthStore();
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const payslips = [
    { period: 'Agustus 2026', monthValue: '2026-08', takeHomePay: 'Rp 14.850.000', transferDate: '25 Agu 2026', status: 'DITRANSFER' },
    { period: 'Juli 2026', monthValue: '2026-07', takeHomePay: 'Rp 14.320.000', transferDate: '25 Jul 2026', status: 'DITRANSFER' },
    { period: 'Juni 2026', monthValue: '2026-06', takeHomePay: 'Rp 15.100.000', transferDate: '25 Jun 2026', status: 'DITRANSFER' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Slip Gaji Digital (Payslip)"
        subtitle="Rincian kompensasi, tunjangan operasional site tambang, dan potongan BPJS/Pajak PPh 21 Anda"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Periode Gaji */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Arsip Slip Gaji
            </h3>
            <div className="space-y-2">
              {payslips.map((p) => {
                const isSelected = p.monthValue === selectedMonth;
                return (
                  <button
                    key={p.monthValue}
                    type="button"
                    onClick={() => setSelectedMonth(p.monthValue)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/70 text-blue-950 dark:bg-blue-950/40 dark:text-blue-200 shadow-xs' 
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{p.period}</span>
                      <Badge variant="success" className="text-[10px]">Lunas</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{p.takeHomePay}</span>
                      <span className="text-[11px] text-slate-400">{p.transferDate}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Rincian Slip Gaji Periode Terpilih */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rincian Dokumen Resmi</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Slip Gaji Periode Agustus 2026
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID Dokumen: HRS/PAY/202608/{user?.username || '99210'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => alert('Mengunduh Slip Gaji resmi berenkripsi PDF...')}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Download className="h-4 w-4" />
                Unduh PDF
              </button>
            </div>

            {/* Komponen Penghasilan */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                A. Komponen Penghasilan (Earnings)
              </h4>
              <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gaji Pokok (Basic Salary)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp 9.500.000</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tunjangan Site Tambang (Site Allowance)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp 3.200.000</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tunjangan Posisi / Jabatan</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp 1.500.000</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Upah Lembur Resmi (Overtime Pay - 7 Jam)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">Rp 1.450.000</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>Total Penghasilan Kotor</span>
                  <span className="font-mono text-emerald-600">Rp 15.650.000</span>
                </div>
              </div>
            </div>

            {/* Komponen Potongan */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                B. Komponen Potongan (Deductions)
              </h4>
              <div className="rounded-xl border border-slate-200/80 p-4 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>BPJS Ketenagakerjaan (JHT & JP Karyawan)</span>
                  <span className="font-mono text-rose-600">- Rp 285.000</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>BPJS Kesehatan (1%)</span>
                  <span className="font-mono text-rose-600">- Rp 95.000</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pajak Penghasilan (PPh 21 TER)</span>
                  <span className="font-mono text-rose-600">- Rp 420.000</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>Total Potongan</span>
                  <span className="font-mono text-rose-600">- Rp 800.000</span>
                </div>
              </div>
            </div>

            {/* Total Penerimaan Bersih */}
            <div className="rounded-xl bg-blue-50/80 p-4 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                  Take Home Pay (Gaji Bersih)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ditransfer ke Bank Mandiri a.n. {user?.name || 'Karyawan'} (Rek: 1420-0019-9921)
                </p>
              </div>
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">
                Rp 14.850.000
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
