'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  User,
  ArrowRight,
  RefreshCw,
  FileText,
  Building2,
  Phone,
  Calendar,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { reRegistrationService, AdminDetailData } from '@/services/reRegistrationService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { TablePagination } from '@/components/ui/TablePagination';
import { toast } from '@/stores/alertStore';
import { formatDate } from '@/lib/utils';
import { EmployeeReregistration, DifferenceItem } from '@/types/reregistration';

export default function AdminEmployeeReregistrationsPage() {
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Modal States
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Approval / Rejection states
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // ── QUERY LIST & STATS ─────────────────────────────────────────────────────
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['admin-reregistration-stats'],
    queryFn: () => reRegistrationService.getAdminStats(),
  });

  const {
    data: listData,
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: ['admin-reregistration-list', statusFilter, searchTerm, page, perPage],
    queryFn: () =>
      reRegistrationService.getAdminList({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchTerm || undefined,
        page,
        per_page: perPage,
      }),
  });

  // Query detail of single ticket for inspection
  const {
    data: detailDataResponse,
    isLoading: isLoadingDetail,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['admin-reregistration-detail', selectedTicketId],
    queryFn: () => (selectedTicketId ? reRegistrationService.getAdminDetail(selectedTicketId) : null),
    enabled: !!selectedTicketId && isDetailModalOpen,
  });

  const stats = statsData?.data;
  const tickets: EmployeeReregistration[] = Array.isArray(listData?.data?.data)
    ? listData.data.data
    : Array.isArray(listData?.data)
    ? listData.data
    : [];
  const totalItems = (listData?.data?.total ?? listData?.meta?.total ?? tickets.length) as number;
  const detailData: AdminDetailData | undefined = detailDataResponse?.data;
  const currentTicket = detailData?.ticket;
  const differences = detailData?.differences;

  // ── MUTATIONS ──────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
      reRegistrationService.approveReRegistration(id, notes),
    onSuccess: (res) => {
      toast.success(res.message || 'Pengajuan registrasi ulang berhasil disetujui!');
      setIsApproveConfirmOpen(false);
      setIsDetailModalOpen(false);
      setApprovalNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-detail', selectedTicketId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyetujui pengajuan');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      reRegistrationService.rejectReRegistration(id, notes),
    onSuccess: (res) => {
      toast.success(res.message || 'Pengajuan registrasi ulang telah ditolak');
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setRejectionNotes('');
      setRejectionError(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reregistration-detail', selectedTicketId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menolak pengajuan';
      setRejectionError(msg);
      toast.error(msg);
    },
  });

  const handleOpenDetail = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsDetailModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionNotes.trim() || rejectionNotes.trim().length < 5) {
      setRejectionError('Alasan penolakan minimal 5 karakter.');
      return;
    }
    if (selectedTicketId) {
      rejectMutation.mutate({ id: selectedTicketId, notes: rejectionNotes.trim() });
    }
  };

  const handleConfirmApprove = () => {
    if (selectedTicketId) {
      approveMutation.mutate({ id: selectedTicketId, notes: approvalNotes.trim() || undefined });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Halaman */}
      <PageHeader
        title="Verifikasi Registrasi Ulang Karyawan"
        subtitle="Pusat tinjauan dan persetujuan pengajuan registrasi ulang & pembaruan data mandiri karyawan. Data yang disetujui akan otomatis tersinkronisasi ke data master profil karyawan."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchStats();
                refetchList();
              }}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Segarkan
            </Button>
          </div>
        }
      />

      {/* KPI STATISTICAL CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card
          onClick={() => {
            setStatusFilter('PENDING');
            setPage(1);
          }}
          className={`p-4 transition-all cursor-pointer border ${
            statusFilter === 'PENDING'
              ? 'ring-2 ring-amber-500 bg-amber-50/50 dark:bg-amber-950/20 border-amber-300'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats?.pending ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Perlu tindakan verifikasi</span>
        </Card>

        <Card
          onClick={() => {
            setStatusFilter('APPROVED');
            setPage(1);
          }}
          className={`p-4 transition-all cursor-pointer border ${
            statusFilter === 'APPROVED'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Telah Disetujui</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats?.approved ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Tersinkron ke master data</span>
        </Card>

        <Card
          onClick={() => {
            setStatusFilter('REJECTED');
            setPage(1);
          }}
          className={`p-4 transition-all cursor-pointer border ${
            statusFilter === 'REJECTED'
              ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-950/20 border-rose-300'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ditolak HC</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {stats?.rejected ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Dengan catatan penolakan</span>
        </Card>

        <Card
          onClick={() => {
            setStatusFilter('ALL');
            setPage(1);
          }}
          className={`p-4 transition-all cursor-pointer border ${
            statusFilter === 'ALL'
              ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-blue-300'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengajuan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <ClipboardCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {stats?.total ?? 0}
          </p>
          <span className="text-[11px] text-slate-400">Semua riwayat pengajuan</span>
        </Card>
      </div>

      {/* FILTER BAR & PENCARIAN */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'PENDING', label: 'Menunggu Review', count: stats?.pending },
              { id: 'APPROVED', label: 'Disetujui', count: stats?.approved },
              { id: 'REJECTED', label: 'Ditolak', count: stats?.rejected },
              { id: 'ALL', label: 'Semua Status', count: stats?.total },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NRP, nama, atau no. tiket..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </Card>

      {/* TABEL DAFTAR PENGAJUAN */}
      <Card className="overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Nomor Tiket</th>
                <th className="py-3 px-4">Karyawan (NRP / Nama)</th>
                <th className="py-3 px-4">Unit Kerja & Jabatan</th>
                <th className="py-3 px-4">Tanggal Pengajuan</th>
                <th className="py-3 px-4">Catatan Karyawan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Verifikator HC</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingList ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memuat daftar pengajuan registrasi ulang...
                    </div>
                  </td>
                </tr>
              ) : tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {ticket.ticket_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {ticket.employee?.name || '-'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {ticket.employee?.nrp || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 dark:text-slate-200">
                        {ticket.employee?.position?.title || (ticket.employee?.position as any)?.name || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ticket.employee?.department?.name || ticket.employee?.site?.name || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {ticket.submission_notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ticket.status === 'PENDING' && (
                        <Badge variant="warning" className="text-[11px] font-bold">
                          Menunggu Review
                        </Badge>
                      )}
                      {ticket.status === 'APPROVED' && (
                        <Badge variant="success" className="text-[11px] font-bold">
                          Disetujui
                        </Badge>
                      )}
                      {ticket.status === 'REJECTED' && (
                        <Badge variant="danger" className="text-[11px] font-bold">
                          Ditolak
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {ticket.reviewer ? (
                        <div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {ticket.reviewer.name}
                          </span>
                          <span className="text-[10px] block text-slate-400">
                            {ticket.reviewed_at ? formatDate(ticket.reviewed_at) : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenDetail(ticket.id)}
                        className={`h-8 text-xs font-semibold ${
                          ticket.status === 'PENDING'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                      >
                        {ticket.status === 'PENDING' ? 'Verifikasi' : 'Detail'}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada pengajuan registrasi ulang yang sesuai kriteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > perPage && (
          <TablePagination
            currentPage={page}
            totalPages={Math.ceil(totalItems / perPage)}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </Card>

      {/* ── MODAL VERIFIKASI & KOMPARASI DATA (SIDE-BY-SIDE DIFF) ─────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Verifikasi Registrasi Ulang: ${currentTicket?.ticket_number}`}
        description={`Diajukan oleh ${currentTicket?.employee?.name} (${currentTicket?.employee?.nrp}) pada ${
          currentTicket ? formatDate(currentTicket.created_at) : ''
        }`}
        maxWidth="2xl"
      >
        {isLoadingDetail ? (
          <div className="space-y-4 py-8 text-center text-xs text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600" />
            <p>Memuat rincian perbandingan data...</p>
          </div>
        ) : currentTicket ? (
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Informasi Pegawai & Status */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Karyawan Pemohon
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentTicket.employee?.name} ({currentTicket.employee?.nrp})
                </h4>
                <p className="text-slate-500 mt-0.5">
                  {currentTicket.employee?.position?.title || (currentTicket.employee?.position as any)?.name} • {currentTicket.employee?.department?.name} • {currentTicket.employee?.site?.name}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Status Tiket
                </span>
                {currentTicket.status === 'PENDING' && (
                  <Badge variant="warning" className="text-xs font-bold mt-0.5">
                    Menunggu Verifikasi HC
                  </Badge>
                )}
                {currentTicket.status === 'APPROVED' && (
                  <Badge variant="success" className="text-xs font-bold mt-0.5">
                    Telah Disetujui
                  </Badge>
                )}
                {currentTicket.status === 'REJECTED' && (
                  <Badge variant="danger" className="text-xs font-bold mt-0.5">
                    Ditolak
                  </Badge>
                )}
              </div>
            </div>

            {/* Catatan Karyawan */}
            {currentTicket.submission_notes && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
                  Catatan / Keterangan Karyawan:
                </span>
                <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                  &ldquo;{currentTicket.submission_notes}&rdquo;
                </p>
              </div>
            )}

            {/* Riwayat Verifikator jika sudah diproses */}
            {currentTicket.reviewed_by_user_id && (
              <div
                className={`p-3.5 rounded-xl border ${
                  currentTicket.status === 'APPROVED'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">
                    Ditinjau oleh: {currentTicket.reviewer?.name} ({currentTicket.reviewer?.username})
                  </span>
                  <span className="text-[11px] opacity-80">
                    {currentTicket.reviewed_at ? formatDate(currentTicket.reviewed_at) : ''}
                  </span>
                </div>
                {currentTicket.review_notes && (
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">
                    Catatan Review: &ldquo;{currentTicket.review_notes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* KOMPARASI PERUBAHAN DATA (DIFF TABLE) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Rincian Perubahan Field Data Pribadi & Kontak
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {differences?.scalar_changes.length || 0} Data Berubah
                </Badge>
              </div>

              {differences && differences.scalar_changes.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="p-2.5 w-1/3">Field / Data</th>
                        <th className="p-2.5 w-1/3 text-rose-700 dark:text-rose-400">Data Sebelumnya (Lama)</th>
                        <th className="p-2.5 w-1/3 text-emerald-700 dark:text-emerald-400">Data Baru yang Diajukan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {differences.scalar_changes.map((diff: DifferenceItem, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            {diff.label}
                          </td>
                          <td className="p-2.5 text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 font-mono">
                            {diff.old_value !== null && diff.old_value !== '' ? String(diff.old_value) : '(Kosong)'}
                          </td>
                          <td className="p-2.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 font-mono font-bold">
                            {diff.new_value !== null && diff.new_value !== '' ? String(diff.new_value) : '(Dikosongkan)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-400">
                  Tidak ada perubahan pada data identitas pokok atau kontak.
                </div>
              )}
            </div>

            {/* RINGKASAN PERUBAHAN RELASI (Keluarga, Kontak Darurat, Fisik & Rekening) */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                Perubahan Data Relasi & Tambahan
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Anggota Keluarga</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-slate-500">{differences?.families_count_old || 0}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono font-bold text-emerald-600">
                      {differences?.families_count_new || 0}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Kontak Darurat</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-slate-500">{differences?.emergency_contacts_count_old || 0}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono font-bold text-emerald-600">
                      {differences?.emergency_contacts_count_new || 0}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Rekening Payroll</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-slate-500">{differences?.bank_accounts_count_old || 0}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-mono font-bold text-emerald-600">
                      {differences?.bank_accounts_count_new || 0}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Ukuran Fisik & APD</span>
                  <div className="mt-1">
                    {differences?.has_health_safety_change ? (
                      <span className="font-bold text-emerald-600">Ada Pembaruan</span>
                    ) : (
                      <span className="text-slate-400">Tidak Berubah</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AKSI TOMBOL PERSETUJUAN (HANYA MUNCUL JIKA STATUS PENDING) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Tutup Jendela
              </Button>

              {currentTicket.status === 'PENDING' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setRejectionError(null);
                      setRejectionNotes('');
                      setIsRejectModalOpen(true);
                    }}
                    leftIcon={<X className="h-4 w-4" />}
                    className="w-full sm:w-auto"
                  >
                    Tolak Pengajuan
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setApprovalNotes('');
                      setIsApproveConfirmOpen(true);
                    }}
                    leftIcon={<Check className="h-4 w-4" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto shadow-sm"
                  >
                    Setujui & Terapkan
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── MODAL KONFIRMASI PERSETUJUAN (APPROVE) ───────────────────────────── */}
      <Modal
        isOpen={isApproveConfirmOpen}
        onClose={() => setIsApproveConfirmOpen(false)}
        title="Setujui & Terapkan Perubahan Data Karyawan"
        description={`Anda akan menyetujui pengajuan tiket ${currentTicket?.ticket_number} untuk ${currentTicket?.employee?.name}.`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Penerapan Otomatis ke Master Karyawan:</strong>
              Seluruh data baru yang diajukan oleh karyawan akan langsung menggantikan data lama pada tabel master karyawan resmi.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Persetujuan (Opsional)
            </label>
            <textarea
              rows={2}
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Contoh: Telah diverifikasi dengan berkas pendukung."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsApproveConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              isLoading={approveMutation.isPending}
              onClick={handleConfirmApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ya, Setujui Sekarang
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL PENOLAKAN DENGAN ALASAN (REJECT) ────────────────────────────── */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Registrasi Ulang"
        description={`Berikan alasan penolakan tiket ${currentTicket?.ticket_number} yang akan dikirimkan kepada ${currentTicket?.employee?.name}.`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
          {rejectionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {rejectionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alasan Penolakan <span className="text-rose-500">* (Wajib diisi)</span>
            </label>
            <textarea
              rows={4}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Contoh: Nomor NIK tidak sesuai dengan dokumen KTP terlampir, atau nomor rekening bank bukan atas nama karyawan yang bersangkutan."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={rejectMutation.isPending}
            >
              Tolak Pengajuan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
