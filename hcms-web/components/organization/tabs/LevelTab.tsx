'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Power,
  Trash2,
  TrendingUp,
  UserCheck,
  Filter,
  Download,
  Shield,
} from 'lucide-react';
import { GradeItem } from '@/types';
import { jobGradeService, importExportService } from '@/services/masterDataService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';
import { toast, confirmDialog } from '@/stores/alertStore';

interface LevelTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const LevelTab: React.FC<LevelTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedPangkat, setSelectedPangkat] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields strictly: kode, level, pangkat, nama level jabatan, status
  const [formData, setFormData] = useState<{
    id: number;
    code: string;
    level: number;
    pangkat: 'Staff' | 'Non Staff';
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    id: 0,
    code: '',
    level: 1,
    pangkat: 'Staff',
    name: '',
    status: 'ACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobGradeService.getGrades({
        search: search || undefined,
        pangkat: selectedPangkat || undefined,
        status: selectedStatus || undefined,
      });
      if (res.success && res.data) {
        setGrades(res.data);
      }
    } catch (err) {
      console.error('Failed to load grades:', err);
      toast.error('Gagal memuat data level jabatan.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [search, selectedPangkat, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems,
    paginatedData: paginatedGrades,
  } = useClientTable(grades, {
    defaultSortField: 'level',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const nextLevel = grades.length > 0 ? Math.max(...grades.map((g) => g.level)) + 1 : 1;
    const formattedCode = nextLevel < 10 ? `LVL-0${nextLevel}` : `LVL-${nextLevel}`;
    setFormData({
      id: 0,
      code: formattedCode,
      level: nextLevel,
      pangkat: nextLevel <= 6 ? 'Staff' : 'Non Staff',
      name: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: GradeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      level: item.level,
      pangkat: item.pangkat === 'Non Staff' ? 'Non Staff' : 'Staff',
      name: item.name,
      status: item.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama level jabatan wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<GradeItem> = {
        code: formData.code.toUpperCase().trim(),
        level: Number(formData.level),
        pangkat: formData.pangkat,
        name: formData.name.trim(),
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await jobGradeService.createGrade(payload);
        if (res.success) {
          toast.success(`Level jabatan "${formData.name}" berhasil dibuat.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      } else {
        const res = await jobGradeService.updateGrade(formData.id, payload);
        if (res.success) {
          toast.success(`Level jabatan "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.code?.[0] ||
        'Gagal menyimpan level jabatan.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: GradeItem) => {
    try {
      const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await jobGradeService.updateGrade(item.id, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(
          `Status level "${item.name}" berhasil diubah menjadi ${newStatus === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}.`,
          'Status Diperbarui'
        );
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status level jabatan.', 'Gagal');
    }
  };

  const handleDelete = async (item: GradeItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Level Jabatan',
      message: `Apakah Anda yakin ingin menghapus level "${item.name}" (${item.code})? Data jabatan yang mengacu ke level ini mungkin terpengaruh.`,
      confirmText: 'Ya, Hapus Level',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await jobGradeService.deleteGrade(item.id);
      if (res.success) {
        toast.success(`Level jabatan "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus level jabatan.', 'Gagal Dihapus');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama level jabatan..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="relative w-36">
            <select
              value={selectedPangkat}
              onChange={(e) => setSelectedPangkat(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="">Semua Pangkat</option>
              <option value="Staff">Staff</option>
              <option value="Non Staff">Non Staff</option>
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Non-Aktif</option>
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Segarkan
          </Button>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Level" field="level" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Pangkat" field="pangkat" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Level Jabatan" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <Award className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data level jabatan ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan level jabatan atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedGrades.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Kode */}
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {item.code}
                    </td>

                    {/* 2. Level */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                      <Badge
                        variant="outline"
                        className={
                          item.level === 1
                            ? 'font-mono bg-purple-50 text-purple-700 border-purple-200 font-bold inline-flex items-center gap-1 shadow-2xs'
                            : 'font-mono bg-blue-50 text-blue-700 border-blue-200'
                        }
                      >
                        Level {item.level} {item.level === 1 && '(Tertinggi)'}
                      </Badge>
                    </td>

                    {/* 3. Pangkat (Staff / Non Staff) */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge
                        variant="outline"
                        className={
                          item.pangkat === 'Non Staff'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold inline-flex items-center gap-1'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold inline-flex items-center gap-1'
                        }
                      >
                        <UserCheck className="h-3 w-3" />
                        {item.pangkat || 'Staff'}
                      </Badge>
                    </td>

                    {/* 4. Nama Level Jabatan */}
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        {item.name}
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {item.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Level"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(item)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          title={item.status === 'ACTIVE' ? 'Nonaktifkan Level' : 'Aktifkan Level'}
                        >
                          <Power
                            className={`h-3.5 w-3.5 ${item.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Level"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="level jabatan"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal strictly with the 5 requested fields: kode, level, pangkat, nama level jabatan, status */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Level Jabatan' : 'Edit Level Jabatan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Kode & 2. Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Level <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: LVL-01, G01"
                required
                className="font-mono uppercase text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Level <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="99"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                required
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Level 1 adalah jenjang tertinggi.
              </p>
            </div>
          </div>

          {/* 3. Pangkat & 5. Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pangkat <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.pangkat}
                onChange={(e) =>
                  setFormData({ ...formData, pangkat: e.target.value as 'Staff' | 'Non Staff' })
                }
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="Staff">Staff</option>
                <option value="Non Staff">Non Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                }
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-semibold cursor-pointer"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </select>
            </div>
          </div>

          {/* 4. Nama Level Jabatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Level Jabatan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Operator / Junior Staff, Supervisor, Manager"
              required
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={submitting}
            >
              {modalMode === 'create' ? 'Simpan Level' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
