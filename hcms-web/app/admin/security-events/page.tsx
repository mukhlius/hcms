'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import { securityService } from '@/services/adminService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatDate } from '@/lib/utils';

export default function SecurityEventsPage() {
  const [severityFilter, setSeverityFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const { data: eventsData, isLoading, refetch } = useQuery({
    queryKey: ['security-events', severityFilter, eventTypeFilter, page, perPage, sortField, sortOrder],
    queryFn: () =>
      securityService.getEvents({
        severity: severityFilter || undefined,
        event_type: eventTypeFilter || undefined,
        page,
        per_page: perPage,
        sort_by: sortField || undefined,
        sort_order: sortOrder,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['security-stats'],
    queryFn: () => securityService.getStats(),
  });

  const events = eventsData?.data?.data || [];
  const meta = eventsData?.data;
  const stats = statsData?.data || {};

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
      case 'HIGH':
        return <Badge variant="danger">{sev}</Badge>;
      case 'WARNING':
        return <Badge variant="warning">{sev}</Badge>;
      default:
        return <Badge variant="info">{sev}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Peristiwa & Peringatan Keamanan"
        subtitle="Telemetri keamanan real-time, deteksi anomali autentikasi, blokir akun, dan pemantauan ID korelasi"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Peristiwa Keamanan' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
          >
            Segarkan Data
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Peristiwa Info" value={stats['INFO'] ?? 0} subtitle="Operasional normal" />
        <StatCard title="Peringatan (Warning)" value={stats['WARNING'] ?? 0} subtitle="Percobaan gagal / modifikasi" />
        <StatCard title="Tingkat Tinggi (High)" value={stats['HIGH'] ?? 0} subtitle="Pemblokiran akun personel" />
        <StatCard title="Tingkat Kritis" value={stats['CRITICAL'] ?? 0} subtitle="Ancaman keamanan sistem" />
      </div>

      {/* Filter bar */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <Select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Tingkat Keparahan</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Peringatan (Warning)</option>
            <option value="HIGH">Tinggi (High)</option>
            <option value="CRITICAL">Kritis (Critical)</option>
          </Select>
        </div>

        <div className="w-72">
          <Select
            value={eventTypeFilter}
            onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Jenis Peristiwa</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS (Login Berhasil)</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED (Login Gagal)</option>
            <option value="ACCOUNT_LOCKED">ACCOUNT_LOCKED (Akun Terkunci)</option>
            <option value="ACCOUNT_UNLOCKED">ACCOUNT_UNLOCKED (Akun Dibuka)</option>
            <option value="PASSWORD_CHANGED">PASSWORD_CHANGED (Sandi Diubah)</option>
            <option value="SESSION_REVOKED">SESSION_REVOKED (Sesi Dicabut)</option>
          </Select>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Tidak ada peristiwa keamanan yang sesuai dengan kriteria saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Keparahan" field="severity" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Jenis Peristiwa" field="event_type" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Pengguna Target</th>
                  <th className="px-4 py-3.5">Inisiator / Aktor</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Alamat IP" field="ip_address" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">ID Korelasi</th>
                  <th className="px-5 py-3.5 text-right">
                    <SortableHeader label="Waktu Kejadian" field="created_at" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">{getSeverityBadge(ev.severity)}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{ev.event_type}</td>
                    <td className="px-4 py-3.5 text-slate-800">
                      {ev.user ? ev.user.name : <span className="text-slate-400 italic">Nihil</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {ev.actor ? ev.actor.name : <span className="text-slate-400 italic">Sistem</span>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{ev.ip_address}</td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{ev.request_id || '-'}</td>
                    <td className="px-5 py-3.5 text-right text-slate-400">{formatDate(ev.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={meta?.current_page || 1}
          totalPages={meta?.last_page || 1}
          perPage={meta?.per_page || perPage}
          totalItems={meta?.total || 0}
          itemLabel="peristiwa keamanan"
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(pp) => {
            setPerPage(pp);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
