'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Key, Users, Check, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { roleService, permissionService } from '@/services/adminService';
import { Role, DataScope } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { toast, confirmDialog } from '@/stores/alertStore';

export default function RolesPage() {
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    data_scope: 'SELF' as DataScope,
    permission_ids: [] as number[],
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: rolesData, isLoading: isRolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => roleService.getRoles(),
  });

  const { data: permissionsData, isLoading: isPermsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => permissionService.getPermissions(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => roleService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setModalOpen(false);
      resetForm();
      toast.success('Peran baru berhasil ditambahkan.', 'Berhasil');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan peran baru.';
      setFormError(msg);
      toast.error(msg, 'Gagal Menyimpan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => roleService.updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setModalOpen(false);
      resetForm();
      toast.success('Data peran berhasil diperbarui.', 'Berhasil');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui data peran.';
      setFormError(msg);
      toast.error(msg, 'Gagal Memperbarui');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      toast.success('Peran berhasil dihapus.', 'Berhasil Dihapus');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus peran.', 'Gagal Menghapus');
    },
  });

  const resetForm = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      data_scope: 'SELF',
      permission_ids: [],
    });
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = async (role: Role) => {
    setEditingRole(role);
    try {
      const res = await roleService.getRole(role.id);
      const permIds = res.data?.permissions?.map((p) => p.id) || [];
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        data_scope: role.data_scope,
        permission_ids: permIds,
      });
      setFormError(null);
      setModalOpen(true);
    } catch {
      toast.error('Gagal memuat izin peran dari server.', 'Gagal');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        payload: {
          display_name: formData.display_name,
          description: formData.description,
          data_scope: formData.data_scope,
          permission_ids: formData.permission_ids,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const permissionGroups = permissionsData?.data || {};

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
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={handleOpenCreate}>
            Tambah Peran
          </Button>
        }
      />

      {/* Role Cards Grid */}
      {isRolesLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rolesData?.data?.map((r) => (
            <Card key={r.id} className="flex flex-col justify-between p-5 space-y-4 hover:border-slate-300 transition-colors">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {r.display_name}
                      {r.is_system && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          SISTEM
                        </span>
                      )}
                    </h3>
                    <p className="font-mono text-[11px] text-slate-400">{r.name}</p>
                  </div>
                  <Badge variant={r.data_scope === 'GLOBAL' ? 'primary' : 'neutral'}>
                    {r.data_scope}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 min-h-8">
                  {r.description || 'Tidak ada deskripsi perincian wewenang.'}
                </p>

                <div className="pt-2 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-blue-600" />
                    <span>{r.permissions_count ?? r.permissions?.length ?? 0} Izin</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{r.users_count ?? 0} Personel</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(r)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Ubah Matriks
                </Button>
                {!r.is_system && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={async () => {
                      const confirmed = await confirmDialog({
                        title: 'Hapus Peran Pengguna',
                        message: `Apakah Anda yakin ingin menghapus peran "${r.display_name}"? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
                        confirmText: 'Ya, Hapus Peran',
                        cancelText: 'Batal',
                        variant: 'danger',
                      });
                      if (confirmed) {
                        deleteMutation.mutate(r.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Role Editor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRole ? `Ubah Peran: ${editingRole.display_name}` : 'Tambah Peran Enterprise Baru'}
        description="Konfigurasi parameter peran, cakupan data hierarki, dan matriks izin wewenang"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <Alert variant="danger" message={formError} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Peran (Identifier Unik)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              placeholder="Contoh: INSPEKTUR_K3"
              disabled={Boolean(editingRole)}
              required
            />
            <Input
              label="Nama Tampilan Peran"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Contoh: Inspektur K3 Operasional Tambang"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Cakupan Akses Data (Scope)"
              value={formData.data_scope}
              onChange={(e) => setFormData({ ...formData, data_scope: e.target.value as DataScope })}
            >
              <option value="SELF">SELF (Hanya data pribadi)</option>
              <option value="SUBORDINATES">SUBORDINATES (Staf bawahan langsung & berjenjang)</option>
              <option value="DEPARTMENT">DEPARTMENT (Satu departemen)</option>
              <option value="SITE">SITE (Seluruh unit di site tambang)</option>
              <option value="COMPANY">COMPANY (Seluruh entitas perusahaan)</option>
              <option value="GLOBAL">GLOBAL (Korporasi lintas unit bisnis)</option>
            </Select>
            <Input
              label="Deskripsi Operasional"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tanggung jawab wewenang operasional..."
            />
          </div>

          {/* Granular Permissions Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Matriks Penugasan Hak Izin Akses
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.permission_ids.length} izin dipilih
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              {Object.entries(permissionGroups).map(([group, perms]) => (
                <div key={group} className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Modul {group}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((p) => {
                      const isChecked = formData.permission_ids.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded bg-white p-2 border border-slate-200 hover:border-slate-300 cursor-pointer text-[11px]"
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
                            className="rounded text-blue-600"
                          />
                          <span className="font-medium text-slate-800">{p.display_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              Simpan Matriks Peran
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
