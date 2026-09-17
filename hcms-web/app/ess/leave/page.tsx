'use client';

import React, { useState } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function EssLeavePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const leaveBalances = [
    { title: 'Cuti Tahunan', balance: 10, used: 2, total: 12, unit: 'Hari' },
    { title: 'Cuti Kompensasi Roster', balance: 2, used: 4, total: 6, unit: 'Hari' },
    { title: 'Cuti Khusus (Pernikahan/Duka)', balance: 3, used: 0, total: 3, unit: 'Hari' },
    { title: 'Izin Sakit Terverifikasi', balance: 14, used: 0, total: 14, unit: 'Hari' },
  ];

  const leaveRequests = [
    {
      id: 'LV-2026-0901',
      type: 'Cuti Tahunan',
      dates: '22 Sep 2026 - 26 Sep 2026',
      duration: '5 Hari Kerja',
      reason: 'Keperluan keluarga di Banjarmasin',
      status: 'PENDING',
      approver: 'Budi Santoso (Foreman)',
      created_at: '14 Sep 2026',
    },
    {
      id: 'LV-2026-0412',
      type: 'Cuti Kompensasi Roster',
      dates: '10 Mei 2026 - 12 Mei 2026',
      duration: '3 Hari Kerja',
      reason: 'Kompensasi shift berturut-turut',
      status: 'APPROVED',
      approver: 'Agus Pratama (Superintendent)',
      created_at: '02 Mei 2026',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(false);
    alert('Permohonan cuti berhasil diajukan dan diteruskan ke atasan Anda.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Pengajuan & Saldo Cuti"
          subtitle="Pantau hak cuti tahunan, cuti kompensasi roster, dan riwayat permohonan izin Anda"
        />
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-98 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Ajukan Cuti Baru
        </button>
      </div>

      {/* Kartu Saldo Cuti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalances.map((item, idx) => (
          <FadeInUp key={item.title} delay={0.05 * idx}>
            <Card className="p-4 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <span className="text-xs font-medium text-slate-500">{item.title}</span>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{item.balance}</span>
                <span className="text-xs text-slate-400">/ {item.total} {item.unit}</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${(item.balance / item.total) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Terpakai: {item.used} {item.unit}</p>
            </Card>
          </FadeInUp>
        ))}
      </div>

      {/* Tabel Permohonan Cuti */}
      <Card className="p-6 border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          Daftar Pengajuan Cuti & Izin
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {leaveRequests.map((req) => (
            <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{req.id}</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">• {req.type}</span>
                  <Badge variant="primary" className="text-[10px]">{req.duration}</Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Periode: <span className="font-medium text-slate-800 dark:text-slate-200">{req.dates}</span>
                </p>
                <p className="text-[11px] text-slate-400">Alasan: {req.reason}</p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
                <div className="text-right">
                  {req.status === 'PENDING' && (
                    <Badge variant="warning" className="font-semibold">Menunggu Persetujuan</Badge>
                  )}
                  {req.status === 'APPROVED' && (
                    <Badge variant="success" className="font-semibold">Disetujui</Badge>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Oleh: {req.approver}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal Form Pengajuan Cuti */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Permohonan Cuti Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jenis Cuti
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="ANNUAL">Cuti Tahunan (Sisa: 10 Hari)</option>
              <option value="ROSTER">Cuti Kompensasi Roster (Sisa: 2 Hari)</option>
              <option value="SPECIAL">Cuti Khusus / Pernikahan</option>
              <option value="SICK">Izin Sakit (Wajib Surat Dokter)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai Cuti
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Berakhir Cuti
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Permohonan & Keterangan Tambahan
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan kebutuhan cuti dan delegasi tanggung jawab darurat di site..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-blue-500"
            >
              Kirim Permohonan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
