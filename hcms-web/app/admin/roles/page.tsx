'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Plus,
  Key,
  Users,
  Edit,
  Trash2,
  Search,
  Lock,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  RefreshCw,
  Award,
} from 'lucide-react';
import { roleService } from '@/services/adminService';
import { Role, DataScope } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast, confirmDialog } from '@/stores/alertStore';

const SCOPE_BADGE: Record<DataScope, { label: string; cls: string }> = {
  SELF:         { label: 'SELF',         cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  SUBORDINATES: { label: 'SUBORDINATES', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  DEPARTMENT:   { label: 'DEPARTMENT',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  SITE:         { label: 'SITE',         cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  COMPANY:      { label: 'COMPANY',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  GLOBAL:       { label: 'GLOBAL',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export default function RolesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch]       = useState('');
  const [sortField, setSortField] = useState<'display_name' | 'data_scope' | 'permissions_count' | 'users_count'>('display_name');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc');

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: rolesData, isLoading: isRolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => roleService.getRoles(),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-grades-list'] });
      toast.success('Peran berhasil dihapus.', 'Berhasil Dihapus');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus peran.', 'Gagal Menghapus');
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => roleService.syncEmployeeRoles(),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-grades-list'] });
      toast.success(
        res.message || 'Sinkronisasi peran seluruh pengguna karyawan berhasil diselesaikan.',
        'Sinkronisasi Berhasil'
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menyinkronkan peran karyawan.', 'Gagal Sinkronisasi');
    },
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allRoles: Role[] = rolesData?.data || [];

  const filteredRoles = allRoles
    .filter(
      (r) =>
        !search ||
        r.display_name.toLowerCase().includes(search.toLowerCase()) ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase()) ||
        r.grades?.some(
          (g) =>
            g.code.toLowerCase().includes(search.toLowerCase()) ||
            g.name.toLowerCase().includes(search.toLowerCase())
        )
    )
    .sort((a, b) => {
      let va: any, vb: any;
      if (sortField === 'display_name') {
        va = a.display_name;
        vb = b.display_name;
      } else if (sortField === 'data_scope') {
        va = a.data_scope;
        vb = b.data_scope;
      } else if (sortField === 'permissions_count') {
        va = a.permissions_count ?? 0;
        vb = b.permissions_count ?? 0;
      } else {
        va = a.users_count ?? 0;
        vb = b.users_count ?? 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tata Kelola Peran & Cakupan Akses Data"
        subtitle="Manajemen wewenang RBAC dinamis, penugasan izin operasional, dan hierarki cakupan organisasi bertingkat"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Peran & Hak Akses' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? 'animate-spin text-blue-600' : ''}`} />}
              isLoading={syncMutation.isPending}
              onClick={async () => {
                const confirmed = await confirmDialog({
                  title: 'Sinkronisasi Peran Seluruh Karyawan',
                  message: 'Sistem akan mengevaluasi seluruh karyawan yang memiliki akun pengguna dan otomatis menetapkan peran serta cakupan akses data (Data Scope) sesuai level jabatan (Grade) masing-masing. Lanjutkan sinkronisasi?',
                  confirmText: 'Ya, Jalankan Sinkronisasi',
                  cancelText: 'Batal',
                  variant: 'primary',
                });
                if (confirmed) {
                  syncMutation.mutate();
                }
              }}
            >
              Sinkronisasi Peran Karyawan
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => router.push('/admin/roles/create')}
            >
              Tambah Peran
            </Button>
          </div>
        }
      />

      {/* Banner Integrasi Level Jabatan */}
      <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-4 text-xs text-blue-900 shadow-sm flex items-start gap-3.5 dark:border-blue-800/80 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900 dark:text-blue-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
          <Shield className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-blue-950 dark:text-blue-100 text-sm">
            Integrasi Otomatis Peran Berbasis Level Jabatan (Job Grade RBAC)
          </p>
          <p className="text-blue-800/90 dark:text-blue-300/80 leading-relaxed text-[11px]">
            Setiap karyawan yang didaftarkan atau mengalami promosi/mutasi level jabatan akan secara otomatis diberikan peran operasional dan batasan cakupan data (<em>Data Scope: SELF, SUBORDINATES, DEPARTMENT, SITE</em>) sesuai Grade yang ditetapkan di Master Data Organisasi.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <Card className="p-4">
        <div className="max-w-sm">
          <Input
            placeholder="Cari peran berdasarkan nama, kode, atau level..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isRolesLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="Tidak ada peran ditemukan"
            description={search ? `Tidak ada peran yang cocok dengan "${search}".` : 'Belum ada peran yang dibuat.'}
            actionLabel={search ? 'Reset Pencarian' : undefined}
            onAction={search ? () => setSearch('') : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 select-none">
                <tr>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('display_name')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-blue-400"
                    >
                      Nama Peran <SortIcon field="display_name" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Kode Peran</th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('data_scope')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-blue-400"
                    >
                      Cakupan Data <SortIcon field="data_scope" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Level Jabatan Terhubung</th>
                  <th className="px-4 py-3.5">Deskripsi</th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('permissions_count')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-blue-400"
                    >
                      Izin <SortIcon field="permissions_count" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => toggleSort('users_count')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer dark:text-slate-300 dark:hover:text-blue-400"
                    >
                      Personel <SortIcon field="users_count" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRoles.map((r) => {
                  const scope = SCOPE_BADGE[r.data_scope] ?? {
                    label: r.data_scope,
                    cls: 'bg-slate-100 text-slate-600 border-slate-200',
                  };
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors dark:hover:bg-slate-800/40">
                      {/* Nama */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 shrink-0 dark:bg-blue-950/50 dark:border-blue-850 dark:text-blue-400">
                            <Shield className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{r.display_name}</span>
                              {r.is_system && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                  <Lock className="h-2.5 w-2.5" /> SISTEM
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kode */}
                      <td className="px-4 py-3.5">
                        <code className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                          {r.name}
                        </code>
                      </td>

                      {/* Scope */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${scope.cls}`}>
                          {scope.label}
                        </span>
                      </td>

                      {/* Level Jabatan Terhubung */}
                      <td className="px-4 py-3.5">
                        {r.grades && r.grades.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1 max-w-[240px]">
                            {r.grades.map((g) => (
                              <span
                                key={g.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                title={`${g.name} (${g.pangkat}) — Level ${g.level}`}
                              >
                                <span>{g.code}</span>
                                <span className="text-[9px] opacity-70">L{g.level}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Deskripsi */}
                      <td className="px-4 py-3.5 max-w-xs">
                        <p className="truncate text-slate-500 italic text-[11px] dark:text-slate-400">
                          {r.description || '—'}
                        </p>
                      </td>

                      {/* Izin */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1 text-blue-700 font-semibold dark:text-blue-400">
                          <Key className="h-3 w-3 text-blue-500" />
                          {r.permissions_count ?? r.permissions?.length ?? 0}
                        </div>
                      </td>

                      {/* Personel */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold dark:text-emerald-400">
                          <Users className="h-3 w-3 text-emerald-500" />
                          {r.users_count ?? 0}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/roles/${r.id}/edit`)}
                            title="Edit Peran"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-slate-800"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          {r.name === 'SUPER_ADMIN' || r.id === 1 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0 text-slate-300 cursor-not-allowed opacity-40 hover:bg-transparent dark:text-slate-600"
                              title="Peran Super Administrator adalah peran sistem utama dan tidak dapat dihapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800"
                              title="Hapus Peran"
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Hapus Peran Pengguna',
                                  message: `Apakah Anda yakin ingin menghapus peran "${r.display_name}"? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
                                  confirmText: 'Ya, Hapus Peran',
                                  cancelText: 'Batal',
                                  variant: 'danger',
                                });
                                if (confirmed) deleteMutation.mutate(r.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer summary */}
            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 flex items-center justify-between bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <span>
                Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredRoles.length}</span> dari{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">{allRoles.length}</span> peran
              </span>
              <span className="text-slate-400 italic">
                {allRoles.filter((r) => r.is_system).length} peran sistem · {allRoles.filter((r) => !r.is_system).length} peran kustom
              </span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
