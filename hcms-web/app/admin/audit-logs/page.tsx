'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Eye, RefreshCw, Search } from 'lucide-react';
import { auditService } from '@/services/adminService';
import { AuditLog } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { formatDate } from '@/lib/utils';

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<string | null>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [inspectLog, setInspectLog] = useState<AuditLog | null>(null);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, moduleFilter, searchTerm, page, perPage, sortField, sortOrder],
    queryFn: () =>
      auditService.getLogs({
        action: actionFilter || undefined,
        module: moduleFilter || undefined,
        search: searchTerm || undefined,
        page,
        per_page: perPage,
        sort_by: sortField || undefined,
        sort_order: sortOrder,
      }),
  });

  const logs = logsData?.data?.data || [];
  const meta = logsData?.data;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="info">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      case 'LOGIN':
      case 'LOGOUT':
        return <Badge variant="neutral">{action}</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jejak Audit & Log Kepatuhan Sistem"
        subtitle="Pencatatan kepatuhan yang tidak dapat diubah (immutable), melacak aktor, mutasi nilai sebelum/sesudah, dan ID korelasi"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Log Audit Kepatuhan' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => refetch()}
          >
            Segarkan
          </Button>
        }
      />

      {/* Filter bar */}
      <Card className="p-4 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            placeholder="Cari ID entitas atau ID Permintaan..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="w-52">
          <Select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Tindakan</option>
            <option value="CREATE">CREATE (Tambah Data)</option>
            <option value="UPDATE">UPDATE (Ubah Data)</option>
            <option value="DELETE">DELETE (Hapus Data)</option>
            <option value="LOGIN">LOGIN (Masuk Sistem)</option>
            <option value="LOGOUT">LOGOUT (Keluar Sistem)</option>
          </Select>
        </div>

        <div className="w-56">
          <Select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
          >
            <option value="">Semua Modul</option>
            <option value="users">Pengguna (Users)</option>
            <option value="roles">Peran & Hak Akses (Roles)</option>
            <option value="auth">Autentikasi (Auth)</option>
            <option value="settings">Konfigurasi (Settings)</option>
            <option value="sessions">Sesi Pengguna (Sessions)</option>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Tidak ada log audit yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Tindakan" field="action" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Modul" field="module" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">Aktor (Pelaksana)</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Target Entitas" field="entity_id" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Alamat IP" field="ip_address" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">ID Permintaan</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Waktu Eksekusi" field="created_at" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Detail Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3.5 font-bold uppercase text-[11px] text-slate-800">{log.module}</td>
                    <td className="px-4 py-3.5 text-slate-800">
                      {log.actor ? log.actor.name : <span className="text-slate-400 italic">Sistem</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-700">{log.entity_type ? log.entity_type.split('\\').pop() : '-'}</span>
                      {log.entity_id && <span className="ml-1 text-[11px] text-slate-400">#{log.entity_id}</span>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">{log.ip_address}</td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{log.request_id || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(log.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {(log.old_values || log.new_values) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectLog(log)}
                          title="Inspeksi perubahan data"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
          itemLabel="log audit"
          onPageChange={(p) => setPage(p)}
          onPerPageChange={(pp) => {
            setPerPage(pp);
            setPage(1);
          }}
        />
      </Card>

      {/* Diff Inspection Modal */}
      <Modal
        isOpen={Boolean(inspectLog)}
        onClose={() => setInspectLog(null)}
        title={`Inspeksi Perubahan Audit: ${inspectLog?.action} pada ${inspectLog?.module}`}
        description={`ID Korelasi Permintaan: ${inspectLog?.request_id || 'N/A'}`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Sebelum Mutasi (Nilai Lama)</span>
              <pre className="rounded-lg bg-slate-900 p-3 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60">
                {inspectLog?.old_values ? JSON.stringify(inspectLog.old_values, null, 2) : 'null (Tidak ada data lama)'}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Sesudah Mutasi (Nilai Baru)</span>
              <pre className="rounded-lg bg-slate-900 p-3 text-blue-400 font-mono text-[11px] overflow-x-auto max-h-60">
                {inspectLog?.new_values ? JSON.stringify(inspectLog.new_values, null, 2) : 'null (Dihapus / Kosong)'}
              </pre>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button variant="outline" onClick={() => setInspectLog(null)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
