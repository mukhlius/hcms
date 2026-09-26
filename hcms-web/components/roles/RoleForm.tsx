'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  ArrowLeft,
  Key,
  Award,
  Save,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Layers,
  Check,
} from 'lucide-react';
import { roleService, permissionService } from '@/services/adminService';
import { jobGradeService } from '@/services/masterDataService';
import { Role, DataScope, GradeItem, Permission } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { toast } from '@/stores/alertStore';

interface RoleFormProps {
  mode: 'create' | 'edit';
  roleId?: number;
}

export default function RoleForm({ mode, roleId }: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<{
    name: string;
    display_name: string;
    description: string;
    data_scope: DataScope;
    permission_ids: number[];
    grade_ids: number[];
  }>({
    name: '',
    display_name: '',
    description: '',
    data_scope: 'SELF',
    permission_ids: [],
    grade_ids: [],
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [gradeSearch, setGradeSearch] = useState('');

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: roleDetailData, isLoading: isRoleLoading } = useQuery({
    queryKey: ['admin-role-detail', roleId],
    queryFn: () => roleService.getRole(roleId!),
    enabled: mode === 'edit' && Boolean(roleId),
  });

  const { data: permissionsData, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => permissionService.getPermissions(),
  });

  const { data: gradesData, isLoading: isGradesLoading } = useQuery({
    queryKey: ['admin-grades-list'],
    queryFn: () => jobGradeService.getGrades(),
  });

  const allGrades: GradeItem[] = useMemo(() => {
    return (gradesData?.data || []).slice().sort((a, b) => a.level - b.level);
  }, [gradesData]);

  const permissionGroups: Record<string, Permission[]> = permissionsData?.data || {};

  // Populate data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && roleDetailData?.data) {
      const r: Role = roleDetailData.data;
      const permIds = r.permissions?.map((p: any) => p.id) || [];
      const gradeIds = r.grades?.map((g: any) => g.id) || [];

      setFormData({
        name: r.name,
        display_name: r.display_name,
        description: r.description || '',
        data_scope: r.data_scope,
        permission_ids: permIds,
        grade_ids: gradeIds,
      });
    }
  }, [mode, roleDetailData]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: any) => roleService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-grades-list'] });
      toast.success('Peran baru berhasil ditambahkan.', 'Berhasil');
      router.push('/admin/roles');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan peran baru.';
      setFormError(msg);
      toast.error(msg, 'Gagal Menyimpan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => roleService.updateRole(roleId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-grades-list'] });
      queryClient.invalidateQueries({ queryKey: ['admin-role-detail', roleId] });
      toast.success('Data peran berhasil diperbarui.', 'Berhasil');
      router.push('/admin/roles');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui data peran.';
      setFormError(msg);
      toast.error(msg, 'Gagal Memperbarui');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Kode Peran wajib diisi.');
      return;
    }
    if (!formData.display_name.trim()) {
      setFormError('Nama Tampilan Peran wajib diisi.');
      return;
    }

    if (mode === 'edit') {
      updateMutation.mutate({
        display_name: formData.display_name,
        description: formData.description,
        data_scope: formData.data_scope,
        permission_ids: formData.permission_ids,
        grade_ids: formData.grade_ids,
      });
    } else {
      createMutation.mutate({
        name: formData.name.trim().toUpperCase(),
        display_name: formData.display_name.trim(),
        description: formData.description,
        data_scope: formData.data_scope,
        permission_ids: formData.permission_ids,
        grade_ids: formData.grade_ids,
      });
    }
  };

  // Grade helpers
  const filteredGrades = useMemo(() => {
    if (!gradeSearch.trim()) return allGrades;
    const q = gradeSearch.toLowerCase();
    return allGrades.filter(
      (g) =>
        g.code.toLowerCase().includes(q) ||
        g.name.toLowerCase().includes(q) ||
        (g.pangkat && g.pangkat.toLowerCase().includes(q)) ||
        `level ${g.level}`.includes(q)
    );
  }, [allGrades, gradeSearch]);

  const handleSelectAllGrades = () => {
    setFormData((prev) => ({
      ...prev,
      grade_ids: allGrades.map((g) => g.id),
    }));
  };

  const handleClearAllGrades = () => {
    setFormData((prev) => ({
      ...prev,
      grade_ids: [],
    }));
  };

  // Permission helpers
  const allPermissionIds = useMemo(() => {
    const ids: number[] = [];
    Object.values(permissionGroups).forEach((perms) => {
      perms.forEach((p) => ids.push(p.id));
    });
    return ids;
  }, [permissionGroups]);

  const filteredPermissionGroups = useMemo(() => {
    if (!permissionSearch.trim()) return permissionGroups;
    const q = permissionSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};

    Object.entries(permissionGroups).forEach(([group, perms]) => {
      const matched = perms.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          group.toLowerCase().includes(q)
      );
      if (matched.length > 0) {
        result[group] = matched;
      }
    });

    return result;
  }, [permissionGroups, permissionSearch]);

  const handleSelectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: [...allPermissionIds],
    }));
  };

  const handleClearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: [],
    }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (mode === 'edit' && isRoleLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Memuat Data Peran..."
          breadcrumbs={[
            { label: 'Beranda', href: '/' },
            { label: 'Konfigurasi' },
            { label: 'Peran & Hak Akses', href: '/admin/roles' },
            { label: 'Edit Peran' },
          ]}
        />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const role = roleDetailData?.data;

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header & Breadcrumb */}
      <PageHeader
        title={mode === 'create' ? 'Tambah Peran Baru' : `Edit Peran: ${role?.display_name || formData.display_name || ''}`}
        subtitle={
          mode === 'create'
            ? 'Konfigurasi identitas peran, cakupan data hierarki, level jabatan terhubung, dan matriks hak izin wewenang'
            : 'Perbarui parameter peran, cakupan data hierarki, level jabatan terhubung, atau hak akses matriks izin wewenang'
        }
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Peran & Hak Akses', href: '/admin/roles' },
          { label: mode === 'create' ? 'Tambah Peran' : 'Edit Peran' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push('/admin/roles')}
          >
            Kembali ke Daftar Peran
          </Button>
        }
      />

      {formError && <Alert variant="danger" message={formError} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── SEKSI 1: IDENTITAS & CAKUPAN DATA ─────────────────────────────── */}
        <Card className="p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Identitas Peran & Batasan Cakupan Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan kode identifikasi unik, nama jabatan peran, dan jangkauan visibilitas data operasional (Data Scope).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <Input
              label="Kode Peran (Identifier Unik)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="Contoh: INSPEKTUR_K3"
              disabled={mode === 'edit'}
              helperText={
                mode === 'edit'
                  ? 'Kode peran unik dikunci dan tidak dapat diubah setelah dibuat.'
                  : 'Gunakan format huruf kapital dan garis bawah (misal: HR_MANAGER, SITE_SUPERVISOR)'
              }
              required
            />

            <Input
              label="Nama Tampilan Peran"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Contoh: Inspektur K3 Operasional Tambang"
              helperText="Nama yang akan ditampilkan pada profil pengguna dan antarmuka sistem."
              required
            />

            <Select
              label="Cakupan Akses Data (Scope Hierarki)"
              value={formData.data_scope}
              onChange={(e) => setFormData({ ...formData, data_scope: e.target.value as DataScope })}
              helperText="Menentukan seberapa luas data yang dapat dilihat dan dikelola oleh personel pemegang peran ini."
            >
              <option value="SELF">SELF — Hanya dapat mengakses data pribadi pengguna sendiri</option>
              <option value="SUBORDINATES">SUBORDINATES — Akses staf bawahan langsung & hierarki berjenjang</option>
              <option value="DEPARTMENT">DEPARTMENT — Akses seluruh personel dalam satu departemen</option>
              <option value="SITE">SITE — Akses seluruh unit dan departemen pada site tambang</option>
              <option value="COMPANY">COMPANY — Akses ke seluruh entitas perusahaan</option>
              <option value="GLOBAL">GLOBAL — Wewenang korporasi penuh lintas seluruh unit bisnis</option>
            </Select>

            <Input
              label="Deskripsi Operasional"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan ruang lingkup tugas dan tanggung jawab wewenang peran ini..."
              helperText="Keterangan singkat mengenai peran ini (opsional)."
            />
          </div>
        </Card>

        {/* ── SEKSI 2: LEVEL JABATAN TERHUBUNG (JOB GRADES) ────────────────── */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Level Jabatan Terhubung (Job Grades RBAC)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Karyawan dengan level jabatan terpilih akan otomatis memiliki peran ini dan batasan cakupan datanya.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                {formData.grade_ids.length} level dipilih
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-600 hover:text-indigo-800 h-8"
                onClick={handleSelectAllGrades}
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 hover:text-slate-700 h-8"
                onClick={handleClearAllGrades}
              >
                Kosongkan
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="max-w-md">
              <Input
                placeholder="Cari level jabatan berdasarkan kode, nama, atau pangkat..."
                value={gradeSearch}
                onChange={(e) => setGradeSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {isGradesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredGrades.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {gradeSearch ? `Tidak ada level jabatan yang cocok dengan "${gradeSearch}".` : 'Tidak ada data level jabatan.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredGrades.map((g) => {
                  const isChecked = formData.grade_ids.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className={`flex items-start gap-3 rounded-xl p-3 border cursor-pointer text-xs transition-all select-none ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 shadow-xs dark:bg-indigo-950/30 dark:border-indigo-800'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, grade_ids: [...formData.grade_ids, g.id] });
                          } else {
                            setFormData({ ...formData, grade_ids: formData.grade_ids.filter((id) => id !== g.id) });
                          }
                        }}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-700">
                            {g.code}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {g.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">Level {g.level}</span>
                          <span>•</span>
                          <span
                            className={
                              g.pangkat === 'Non Staff'
                                ? 'text-amber-700 dark:text-amber-400 font-semibold'
                                : 'text-blue-700 dark:text-blue-400 font-semibold'
                            }
                          >
                            {g.pangkat}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* ── SEKSI 3: MATRIKS PENUGASAN HAK IZIN AKSES ─────────────────────── */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Matriks Penugasan Hak Izin Akses (Permissions Matrix)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delegasikan izin fitur, modul, dan aksi operasional yang diizinkan untuk peran ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                {formData.permission_ids.length} izin dipilih
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-800 h-8"
                onClick={handleSelectAllPermissions}
              >
                Pilih Semua
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-slate-500 hover:text-slate-700 h-8"
                onClick={handleClearAllPermissions}
              >
                Kosongkan
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="max-w-md">
              <Input
                placeholder="Cari izin berdasarkan nama atau kata kunci modul..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {isPermissionsLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : Object.keys(filteredPermissionGroups).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {permissionSearch
                  ? `Tidak ada izin yang cocok dengan "${permissionSearch}".`
                  : 'Tidak ada data izin yang tersedia.'}
              </p>
            ) : (
              <div className="space-y-5">
                {Object.entries(filteredPermissionGroups).map(([group, perms]) => {
                  const groupIds = perms.map((p) => p.id);
                  const allGroupSelected = groupIds.every((id) => formData.permission_ids.includes(id));
                  const someGroupSelected = groupIds.some((id) => formData.permission_ids.includes(id));

                  return (
                    <div
                      key={group}
                      className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900 dark:text-blue-300">
                            {perms.length}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Modul: {group}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 cursor-pointer"
                          onClick={() => {
                            if (allGroupSelected) {
                              setFormData({
                                ...formData,
                                permission_ids: formData.permission_ids.filter((id) => !groupIds.includes(id)),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permission_ids: [...new Set([...formData.permission_ids, ...groupIds])],
                              });
                            }
                          }}
                        >
                          {allGroupSelected ? 'Batalkan Semua Modul' : 'Pilih Semua Modul'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {perms.map((p) => {
                          const isChecked = formData.permission_ids.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`flex items-start gap-2.5 rounded-lg p-2.5 border cursor-pointer text-xs transition-all select-none ${
                                isChecked
                                  ? 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-2xs dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, permission_ids: [...formData.permission_ids, p.id] });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      permission_ids: formData.permission_ids.filter((id) => id !== p.id),
                                    });
                                  }
                                }}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                  {p.display_name}
                                </span>
                                <code className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate">
                                  {p.name}
                                </code>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* ── ACTION FOOTER ─────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-4 shadow-lg dark:bg-slate-900/95 dark:border-slate-800">
          <div className="text-xs text-slate-500">
            <span>
              Total: <strong className="text-slate-800 dark:text-slate-200">{formData.grade_ids.length}</strong> level
              jabatan dan <strong className="text-slate-800 dark:text-slate-200">{formData.permission_ids.length}</strong> izin
              terpilih.
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/roles')}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              leftIcon={<Save className="h-4 w-4" />}
              isLoading={isSaving}
            >
              {mode === 'edit' ? 'Simpan Perubahan' : 'Buat Peran Baru'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
