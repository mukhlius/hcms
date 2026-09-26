'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Plus, 
  Unlock, 
  Key, 
  Edit, 
  Eye, 
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserX,
  Link2,
} from 'lucide-react';
import { userService, UserFilterParams } from '@/services/userService';
import { organizationService, roleService } from '@/services/adminService';
import { User, UserStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { Tabs } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import { toast, confirmDialog } from '@/stores/alertStore';

export default function UsersPage() {
  const queryClient = useQueryClient();

  // State Filter & Pagination
  const [params, setParams] = useState<UserFilterParams>({
    page: 1,
    per_page: 10,
    search: '',
    status: '',
    role: '',
    site_id: '',
    department_id: '',
    linked_to_employee: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Tab aktif: 'all' | 'linked' | 'standalone'
  const [activeTab, setActiveTab] = useState<'all' | 'linked' | 'standalone'>('all');

  const handleTabChange = (tab: 'all' | 'linked' | 'standalone') => {
    setActiveTab(tab);
    setParams((prev) => ({
      ...prev,
      page: 1,
      linked_to_employee: tab === 'linked' ? '1' : tab === 'standalone' ? '0' : '',
    }));
  };

  // Toggle sort handler
  const handleSort = (column: string) => {
    setParams((prev) => {
      const isSameColumn = prev.sort_by === column;
      const newOrder = isSameColumn && prev.sort_order === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sort_by: column,
        sort_order: newOrder,
        page: 1,
      };
    });
  };

  const renderSortIcon = (column: string) => {
    if (params.sort_by !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return params.sort_order === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
    );
  };

  // State Modal & Drawer
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('identity');

  // State Formulir
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    status: 'ACTIVE' as UserStatus,
    site_id: '',
    department_id: '',
    role_ids: [] as number[],
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Fetch Pengguna
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => userService.getUsers(params),
  });

  // Fetch Metadata
  const { data: orgData } = useQuery({
    queryKey: ['org-metadata'],
    queryFn: () => organizationService.getMetadata(),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => roleService.getRoles(),
  });

  // Fetch Detail Pengguna Tunggal untuk Drawer
  const { data: singleUserDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => (selectedUserId ? userService.getUser(selectedUserId) : null),
    enabled: Boolean(selectedUserId && detailDrawerOpen),
  });

  // Mutasi Data
  const createMutation = useMutation({
    mutationFn: (payload: any) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateModalOpen(false);
      resetForm();
      toast.success('Akun personel baru berhasil ditambahkan.', 'Berhasil');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan pengguna baru.';
      setFormError(msg);
      toast.error(msg, 'Gagal Menyimpan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => userService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditModalOpen(false);
      toast.success('Profil pengguna berhasil diperbarui.', 'Berhasil');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui profil pengguna.';
      setFormError(msg);
      toast.error(msg, 'Gagal Memperbarui');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => userService.unlockUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedUserId) queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      toast.success('Akun pengguna berhasil dibuka kunci.', 'Berhasil');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuka kunci akun.', 'Gagal');
    },
  });

  const resetPassMutation = useMutation({
    mutationFn: ({ id, pass }: { id: number; pass: string }) => userService.resetPassword(id, pass),
    onSuccess: () => {
      setResetPassModalOpen(false);
      setNewPasswordValue('');
      toast.success('Kata sandi pengguna berhasil diatur ulang.', 'Berhasil');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal mengatur ulang password.';
      setFormError(msg);
      toast.error(msg, 'Gagal');
    },
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: (id: number) => userService.revokeSessions(id),
    onSuccess: () => {
      if (selectedUserId) queryClient.invalidateQueries({ queryKey: ['admin-user-detail', selectedUserId] });
      toast.success('Seluruh sesi aktif pengguna berhasil dicabut.', 'Berhasil');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mencabut sesi aktif.', 'Gagal');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Pengguna berhasil dihapus dan dipindahkan ke Tempat Sampah.', 'Berhasil Dihapus');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna.', 'Gagal Menghapus');
    },
  });

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      status: 'ACTIVE',
      site_id: '',
      department_id: '',
      role_ids: [],
    });
    setFormError(null);
  };

  const handleOpenDetail = (user: User) => {
    setSelectedUserId(user.id);
    setActiveDetailTab('identity');
    setDetailDrawerOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUserId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      password: '',
      status: user.status,
      site_id: user.site_id ? String(user.site_id) : '',
      department_id: user.department_id ? String(user.department_id) : '',
      role_ids: user.roles ? user.roles.map((r) => r.id) : [],
    });
    setFormError(null);
    setEditModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate({
      ...formData,
      site_id: formData.site_id ? Number(formData.site_id) : null,
      department_id: formData.department_id ? Number(formData.department_id) : null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setFormError(null);
    updateMutation.mutate({
      id: selectedUserId,
      payload: {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        site_id: formData.site_id ? Number(formData.site_id) : null,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        role_ids: formData.role_ids,
      },
    });
  };

  const users = usersData?.data || [];
  const meta = usersData?.meta;

  const detailTabs = [
    { id: 'identity', label: 'Identitas' },
    { id: 'account', label: 'Status Akun' },
    { id: 'roles', label: 'Peran' },
    { id: 'permissions', label: 'Izin Efektif' },
    { id: 'sessions', label: 'Sesi Aktif' },
    { id: 'login_history', label: 'Riwayat Login' },
    { id: 'security_events', label: 'Event Keamanan' },
    { id: 'audit_trail', label: 'Audit Trail' },
  ];

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">AKTIF</Badge>;
      case 'LOCKED':
        return <Badge variant="danger">TERKUNCI</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">DITANGGUHKAN</Badge>;
      case 'INACTIVE':
        return <Badge variant="neutral">NON-AKTIF</Badge>;
      case 'PENDING':
        return <Badge variant="warning">MENUNGGU</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Pengguna & Personel"
        subtitle="Kelola data akun personel tambang, penugasan peran RBAC, cakupan data, dan riwayat audit"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Pengguna' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
          >
            Tambah Pengguna
          </Button>
        }
      />

      {/* Tab Kategori Pengguna */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Semua Pengguna
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('linked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'linked'
              ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Personel Karyawan
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('standalone')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'standalone'
              ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <UserX className="h-3.5 w-3.5" />
          Pengguna Sistem
        </button>
      </div>

      {/* Info konteks tab */}
      {activeTab === 'linked' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
          <UserCheck className="h-4 w-4 mt-0.5 shrink-0" />
          <p><span className="font-bold">Personel Karyawan</span> — Akun yang terhubung langsung dengan data karyawan (employee record). Perubahan identitas karyawan otomatis berdampak pada akun ini.</p>
        </div>
      )}
      {activeTab === 'standalone' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <UserX className="h-4 w-4 mt-0.5 shrink-0" />
          <p><span className="font-bold">Pengguna Sistem</span> — Akun yang <em>tidak</em> terhubung dengan data karyawan. Biasanya digunakan untuk akun admin sistem, integrasi layanan, atau akun teknis.</p>
        </div>
      )}

      {/* Bar Filter */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Pencarian */}
          <div className="lg:col-span-2">
            <Input
              placeholder={activeTab === 'linked' ? 'Cari personel karyawan...' : activeTab === 'standalone' ? 'Cari pengguna sistem...' : 'Cari berdasarkan nama, username, email...'}
              value={params.search || ''}
              onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Filter Status */}
          <Select
            value={params.status || ''}
            onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="LOCKED">Terkunci</option>
            <option value="SUSPENDED">Ditangguhkan</option>
            <option value="INACTIVE">Non-Aktif</option>
            <option value="PENDING">Menunggu</option>
          </Select>

          {/* Filter Peran */}
          <Select
            value={params.role || ''}
            onChange={(e) => setParams({ ...params, role: e.target.value, page: 1 })}
          >
            <option value="">Semua Peran</option>
            {rolesData?.data?.map((r) => (
              <option key={r.id} value={r.name}>{r.display_name}</option>
            ))}
          </Select>

          {/* Filter Site Tambang */}
          <Select
            value={params.site_id || ''}
            onChange={(e) => setParams({ ...params, site_id: e.target.value, page: 1 })}
          >
            <option value="">Semua Site Tambang</option>
            {orgData?.data?.sites?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Tabel Pengguna */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="Tidak ada data pengguna"
            description="Tidak ada akun personel yang cocok dengan kriteria filter yang Anda tentukan."
            actionLabel="Reset Filter"
            onAction={() => setParams({ page: 1, per_page: 10, search: '', status: '', role: '', site_id: '', department_id: '', linked_to_employee: activeTab === 'linked' ? '1' : activeTab === 'standalone' ? '0' : '' })}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                <tr>
                  <th className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Urutkan berdasarkan Nama"
                    >
                      <span>Pengguna / Personel</span>
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('status')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Urutkan berdasarkan Status"
                    >
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Peran Ditugaskan</th>
                  <th className="px-4 py-3.5">Site Tambang</th>
                  <th className="px-4 py-3.5">Departemen</th>
                  <th className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSort('created_at')}
                      className="group inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Urutkan berdasarkan Tanggal Dibuat"
                    >
                      <span>Tanggal Dibuat</span>
                      {renderSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs border ${
                          (u as any).has_employee
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900">{u.name}</p>
                            {(u as any).has_employee ? (
                              <span title="Terhubung dengan data karyawan" className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <Link2 className="h-2.5 w-2.5" /> Karyawan
                              </span>
                            ) : (
                              <span title="Pengguna sistem tanpa data karyawan" className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                                <UserX className="h-2.5 w-2.5" /> Sistem
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">@{u.username} • {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(u.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r: any) => (
                            <Badge key={r.id} variant="neutral" className="text-[10px]">
                              {r.display_name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Tanpa peran</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {u.site?.name || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {u.department?.name || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(u)}
                          title="Inspeksi Rincian Profil 8 Panel"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Profil Pengguna"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {u.status === 'LOCKED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:bg-amber-50"
                            onClick={async () => {
                              const confirmed = await confirmDialog({
                                title: 'Buka Kunci Akun Pengguna',
                                message: `Apakah Anda yakin ingin membuka kunci akun "${u.name}" (@${u.username})? Pengguna akan dapat masuk kembali ke sistem.`,
                                confirmText: 'Buka Kunci Akun',
                                cancelText: 'Batal',
                                variant: 'primary',
                              });
                              if (confirmed) {
                                unlockMutation.mutate(u.id);
                              }
                            }}
                            title="Buka Kunci Akun"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setResetPassModalOpen(true);
                          }}
                          title="Reset Password"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={async () => {
                            const confirmed = await confirmDialog({
                              title: 'Hapus Akun Pengguna',
                              message: `Apakah Anda yakin ingin menghapus akun personel "${u.name}" (@${u.username})? Data pengguna akan dipindahkan ke Tempat Sampah dan dapat dipulihkan sewaktu-waktu.`,
                              confirmText: 'Ya, Hapus Pengguna',
                              cancelText: 'Batal',
                              variant: 'danger',
                            });
                            if (confirmed) {
                              deleteUserMutation.mutate(u.id);
                            }
                          }}
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bar Paginasi & Pengaturan Jumlah Baris */}
        {meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>
                Menampilkan <span className="font-semibold text-slate-700">{users.length}</span> dari <span className="font-semibold text-slate-700">{meta.total}</span> pengguna
              </span>
              
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <span className="text-slate-500">Tampilkan:</span>
                <select
                  value={params.per_page || 10}
                  onChange={(e) => setParams({ ...params, per_page: Number(e.target.value), page: 1 })}
                  className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10 baris</option>
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === 1}
                onClick={() => setParams({ ...params, page: (params.page || 1) - 1 })}
              >
                Sebelumnya
              </Button>
              <span className="font-semibold text-slate-700 px-1">
                Halaman {meta.current_page} dari {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === meta.last_page}
                onClick={() => setParams({ ...params, page: (params.page || 1) + 1 })}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Drawer Inspeksi Mendalam 8 Panel */}
      <Drawer
        isOpen={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title="Profil Personel & Audit Keamanan"
        subtitle={singleUserDetail?.data?.identity?.name}
        width="3xl"
      >
        {isDetailLoading || !singleUserDetail?.data ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <Tabs
              tabs={detailTabs}
              activeTab={activeDetailTab}
              onChange={setActiveDetailTab}
            />

            {/* Panel 1: Identitas */}
            {activeDetailTab === 'identity' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Nama Lengkap</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{singleUserDetail.data.identity.name}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Username</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{singleUserDetail.data.identity.username}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Email Perusahaan</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{singleUserDetail.data.identity.email}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">UUID Unik</p>
                    <p className="font-mono text-[11px] text-slate-600 mt-0.5">{singleUserDetail.data.identity.uuid}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Site Tambang</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{singleUserDetail.data.identity.site?.name || 'Semua Site'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Departemen</p>
                    <p className="font-semibold text-slate-900 mt-0.5">{singleUserDetail.data.identity.department?.name || 'Kantor Pusat'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2: Status Akun */}
            {activeDetailTab === 'account' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                  <span>Status Akun Saat Ini</span>
                  {getStatusBadge(singleUserDetail.data.account.status)}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                  <span>Jumlah Percobaan Login Gagal</span>
                  <span className="font-bold text-slate-900">{singleUserDetail.data.account.failed_login_attempts}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                  <span>Terkunci Hingga</span>
                  <span className="text-slate-700">{formatDate(singleUserDetail.data.account.locked_until)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-200/80">
                  <span>Terakhir Ubah Password</span>
                  <span className="text-slate-700">{formatDate(singleUserDetail.data.account.password_changed_at)}</span>
                </div>

                {singleUserDetail.data.account.status === 'LOCKED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => unlockMutation.mutate(singleUserDetail.data.identity.id)}
                  >
                    Buka Kunci Akun Sekarang
                  </Button>
                )}
              </div>
            )}

            {/* Panel 3: Peran */}
            {activeDetailTab === 'roles' && (
              <div className="space-y-3">
                {singleUserDetail.data.roles.map((r: any) => (
                  <div key={r.id} className="rounded-lg border border-slate-200 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{r.display_name}</span>
                      <Badge variant="default">CAKUPAN {r.data_scope}</Badge>
                    </div>
                    <p className="text-slate-500 text-[11px]">{r.description || 'Peran enterprise'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Panel 4: Izin Efektif */}
            {activeDetailTab === 'permissions' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Izin wewenang efektif hasil kalkulasi peran dan penugasan langsung:</p>
                <div className="flex flex-wrap gap-1.5 max-h-80 overflow-y-auto">
                  {singleUserDetail.data.permissions.effective.map((p: string) => (
                    <span key={p} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 border border-slate-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Panel 5: Sesi Aktif */}
            {activeDetailTab === 'sessions' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">Sesi perangkat yang aktif dan riwayat terkini</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Cabut Seluruh Sesi Aktif',
                        message: `Apakah Anda yakin ingin mencabut seluruh sesi aktif untuk personel "${singleUserDetail.data.identity.name}"? Pengguna akan segera diputus dari seluruh sesi perangkat.`,
                        confirmText: 'Ya, Cabut Seluruh Sesi',
                        cancelText: 'Batal',
                        variant: 'danger',
                      });
                      if (confirmed) {
                        revokeSessionsMutation.mutate(singleUserDetail.data.identity.id);
                      }
                    }}
                  >
                    Cabut Seluruh Sesi
                  </Button>
                </div>
                {singleUserDetail.data.sessions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada sesi aktif tercatat.</p>
                ) : (
                  <div className="space-y-2">
                    {singleUserDetail.data.sessions.map((s: any) => (
                      <div key={s.id} className="rounded-lg border border-slate-200 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{s.device || 'Workstation'} • {s.browser}</span>
                          {s.revoked_at ? (
                            <Badge variant="neutral">Dicabut</Badge>
                          ) : (
                            <Badge variant="success">Aktif</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">IP: {s.ip_address} • OS: {s.operating_system}</p>
                        <p className="text-[10px] text-slate-400">Aktivitas terakhir: {formatDate(s.last_activity_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Panel 6: Riwayat Login */}
            {activeDetailTab === 'login_history' && (
              <div className="space-y-2">
                {singleUserDetail.data.login_history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada riwayat login.</p>
                ) : (
                  singleUserDetail.data.login_history.map((h: any) => (
                    <div key={h.id} className="rounded-lg border border-slate-200 p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{h.status}</p>
                        <p className="text-[11px] text-slate-400">{h.ip_address} • {h.device}</p>
                        {h.failure_reason && <p className="text-[10px] text-rose-500">{h.failure_reason}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(h.logged_in_at)}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Panel 7: Event Keamanan */}
            {activeDetailTab === 'security_events' && (
              <div className="space-y-2">
                {singleUserDetail.data.security_events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Tidak ada insiden keamanan terkait.</p>
                ) : (
                  singleUserDetail.data.security_events.map((ev: any) => (
                    <div key={ev.id} className="rounded-lg border border-slate-200 p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{ev.event_type}</span>
                        <p className="text-[10px] text-slate-400">IP: {ev.ip_address}</p>
                      </div>
                      <Badge variant={ev.severity === 'HIGH' || ev.severity === 'CRITICAL' ? 'danger' : 'neutral'}>
                        {ev.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Panel 8: Audit Trail */}
            {activeDetailTab === 'audit_trail' && (
              <div className="space-y-2">
                {singleUserDetail.data.audit_trail.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada catatan mutasi data.</p>
                ) : (
                  singleUserDetail.data.audit_trail.map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-slate-200 p-2.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{a.action} ({a.module})</span>
                        <span className="text-[10px] text-slate-400">{formatDate(a.created_at)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">Req ID: {a.request_id}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal Tambah Pengguna */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Pendaftaran Akun Personel Baru"
        description="Daftarkan akun karyawan baru dengan penugasan peran dan penempatan site tambang"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Contoh: agus.pratama"
              required
            />
            <Input
              label="Nama Lengkap"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Agus Pratama"
              required
            />
          </div>

          <Input
            label="Email Perusahaan"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="nama@cmn.mining.local"
            required
          />

          <PasswordInput
            label="Password Awal"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText="Minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol."
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Site Tambang"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
            >
              <option value="">Pilih Site Tambang</option>
              {orgData?.data?.sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              label="Departemen"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">Pilih Departemen</option>
              {orgData?.data?.departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Penugasan Peran Enterprise</label>
            <div className="grid grid-cols-2 gap-2">
              {rolesData?.data?.map((r) => (
                <label key={r.id} className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.role_ids.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, role_ids: [...formData.role_ids, r.id] });
                      } else {
                        setFormData({ ...formData, role_ids: formData.role_ids.filter((id) => id !== r.id) });
                      }
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>{r.display_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Pengguna */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profil Personel"
        description="Perbarui data status karyawan, penempatan organisasi, dan peran"
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username (Tidak Dapat Diubah)"
              value={formData.username}
              disabled
            />
            <Input
              label="Nama Lengkap"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email Perusahaan"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Select
              label="Status Akun"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
            >
              <option value="ACTIVE">AKTIF</option>
              <option value="INACTIVE">NON-AKTIF</option>
              <option value="SUSPENDED">DITANGGUHKAN</option>
              <option value="PENDING">MENUNGGU</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Site Tambang"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
            >
              <option value="">Pilih Site</option>
              {orgData?.data?.sites?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            <Select
              label="Departemen"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <option value="">Pilih Departemen</option>
              {orgData?.data?.departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Peran</label>
            <div className="grid grid-cols-2 gap-2">
              {rolesData?.data?.map((r) => (
                <label key={r.id} className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.role_ids.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, role_ids: [...formData.role_ids, r.id] });
                      } else {
                        setFormData({ ...formData, role_ids: formData.role_ids.filter((id) => id !== r.id) });
                      }
                    }}
                    className="rounded text-blue-600"
                  />
                  <span>{r.display_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={resetPassModalOpen}
        onClose={() => setResetPassModalOpen(false)}
        title="Reset Password Administratif"
        description="Paksa reset password dan putuskan seluruh sesi aktif untuk akun ini"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <div className="rounded bg-rose-50 p-2.5 text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <PasswordInput
            label="Password Baru"
            value={newPasswordValue}
            onChange={(e) => setNewPasswordValue(e.target.value)}
            helperText="Minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol."
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setResetPassModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={resetPassMutation.isPending}
              onClick={() => {
                if (selectedUserId && newPasswordValue) {
                  resetPassMutation.mutate({ id: selectedUserId, pass: newPasswordValue });
                }
              }}
            >
              Reset & Putuskan Sesi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
