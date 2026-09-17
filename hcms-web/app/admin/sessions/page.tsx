'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone, Tablet, Trash2, Shield, RefreshCw } from 'lucide-react';
import { sessionService } from '@/services/adminService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatDate } from '@/lib/utils';
import { toast, confirmDialog } from '@/stores/alertStore';

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>('last_activity_at');
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

  const { data: sessionsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-sessions', activeOnly, page, perPage, sortField, sortOrder],
    queryFn: () =>
      sessionService.getSessions({
        active_only: activeOnly,
        page,
        per_page: perPage,
        sort_by: sortField || undefined,
        sort_order: sortOrder,
      }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => sessionService.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast.success('Sesi perangkat berhasil dicabut.', 'Sesi Dicabut');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mencabut sesi.', 'Gagal Mencabut');
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: () => sessionService.revokeOtherSessions(),
    onSuccess: (res) => {
      toast.success(`Berhasil mencabut ${res.data?.revoked_count || 0} sesi aktif pada perangkat lain.`, 'Sesi Berhasil Dicabut');
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mencabut sesi lain.', 'Gagal Mencabut');
    },
  });

  const sessions = sessionsData?.data?.data || [];
  const meta = sessionsData?.data;

  const getDeviceIcon = (device?: string | null) => {
    if (device?.toLowerCase().includes('mobile')) return <Smartphone className="h-4 w-4 text-slate-500" />;
    if (device?.toLowerCase().includes('tablet')) return <Tablet className="h-4 w-4 text-slate-500" />;
    return <Monitor className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Sesi Pengguna"
        subtitle="Pantau sesi perangkat terhubung, metadata klien pengguna, dan lakukan terminasi akses sesi secara administratif"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Sesi Pengguna' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => refetch()}
            >
              Segarkan
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: 'Cabut Sesi Perangkat Lain',
                  message: 'Apakah Anda yakin ingin mencabut seluruh sesi aktif Anda di perangkat lain? Seluruh sesi login selain perangkat ini akan segera dihentikan.',
                  confirmText: 'Ya, Cabut Sesi',
                  cancelText: 'Batal',
                  variant: 'danger',
                });
                if (confirmed) {
                  revokeOthersMutation.mutate();
                }
              }}
              isLoading={revokeOthersMutation.isPending}
            >
              Cabut Sesi Lain
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="font-medium">Hanya Tampilkan Sesi Aktif</span>
        </label>
      </Card>

      {/* Sessions Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Tidak ada data sesi aktif yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Pengguna</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Perangkat / Browser" field="browser" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Alamat IP" field="ip_address" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Aktivitas Terakhir" field="last_activity_at" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Waktu Masuk" field="created_at" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{s.user?.name || 'Pengguna Tidak Diketahui'}</p>
                      <p className="text-[11px] text-slate-400">@{s.user?.username || 'user'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(s.device)}
                        <div>
                          <p className="font-medium text-slate-800">{s.browser || 'Tidak Diketahui'}</p>
                          <p className="text-[10px] text-slate-400">{s.operating_system} • {s.device}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700">{s.ip_address}</td>
                    <td className="px-4 py-3.5">
                      {s.revoked_at ? (
                        <Badge variant="neutral">Dicabut</Badge>
                      ) : (
                        <Badge variant="success">Aktif</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(s.last_activity_at)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {!s.revoked_at && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Cabut Sesi Perangkat',
                              message: `Apakah Anda yakin ingin mencabut sesi dari perangkat "${s.device || 'Workstation'}" (${s.ip_address})? Pengguna akan langsung dikeluarkan dari sistem.`,
                              confirmText: 'Ya, Cabut Sesi',
                              cancelText: 'Batal',
                              variant: 'danger',
                            });
                            if (confirmed) {
                              revokeMutation.mutate(s.id);
                            }
                          }}
                          isLoading={revokeMutation.isPending}
                          title="Cabut paksa sesi ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
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
          itemLabel="sesi"
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
