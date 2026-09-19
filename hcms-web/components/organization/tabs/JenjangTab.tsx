'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  GitMerge, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Download,
  Award,
  Layers,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { SalaryGradeJenjangItem, SalaryGradeItem, GradeItem } from '@/types';
import { 
  jenjangService, 
  salaryGradeService, 
  jobGradeService, 
  importExportService 
} from '@/services/masterDataService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';
import { toast, confirmDialog } from '@/stores/alertStore';

interface JenjangTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const JenjangTab: React.FC<JenjangTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<SalaryGradeJenjangItem[]>([]);
  const [salaryGrades, setSalaryGrades] = useState<SalaryGradeItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [filterSalaryGradeId, setFilterSalaryGradeId] = useState<string>('');
  const [filterGradeId, setFilterGradeId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    id: 0,
    salary_grade_id: '',
    grade_id: '',
    name: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Load masters for dropdowns
  const loadDropdownMasters = async () => {
    try {
      const [sgRes, gRes] = await Promise.all([
        salaryGradeService.getSalaryGrades(),
        jobGradeService.getGrades(),
      ]);
      if (sgRes.success && sgRes.data) setSalaryGrades(sgRes.data);
      if (gRes.success && gRes.data) setGrades(gRes.data);
    } catch (err) {
      console.error('Failed to load dropdown masters:', err);
    }
  };

  useEffect(() => {
    loadDropdownMasters();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jenjangService.getJenjangs({
        search: search || undefined,
        salary_grade_id: filterSalaryGradeId ? Number(filterSalaryGradeId) : undefined,
        grade_id: filterGradeId ? Number(filterGradeId) : undefined,
        status: filterStatus || undefined,
      });

      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load jenjang list:', err);
      toast.error('Gagal memuat data jenjang jabatan.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [search, filterSalaryGradeId, filterGradeId, filterStatus]);

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
    paginatedData: paginatedItems,
  } = useClientTable(items, {
    defaultSortField: 'name',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      salary_grade_id: filterSalaryGradeId || (salaryGrades[0]?.id ? String(salaryGrades[0].id) : ''),
      grade_id: filterGradeId || (grades[0]?.id ? String(grades[0].id) : ''),
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

  const handleOpenEdit = (item: SalaryGradeJenjangItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      salary_grade_id: String(item.salary_grade_id),
      grade_id: String(item.grade_id),
      name: item.name,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.salary_grade_id || !formData.grade_id || !formData.name.trim()) {
      toast.error('Golongan, Level Jabatan, dan Nama Jenjang wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<SalaryGradeJenjangItem> = {
        salary_grade_id: Number(formData.salary_grade_id),
        grade_id: Number(formData.grade_id),
        name: formData.name.trim(),
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await jenjangService.createJenjang(payload);
        if (res.success) {
          toast.success(`Jenjang "${formData.name}" berhasil ditambahkan.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      } else {
        const res = await jenjangService.updateJenjang(formData.id, payload);
        if (res.success) {
          toast.success(`Jenjang "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan data jenjang jabatan.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: SalaryGradeJenjangItem) => {
    const sgCode = item.salary_grade?.code || '';
    const gName = item.grade?.name || '';
    const confirmed = await confirmDialog({
      title: 'Hapus Jenjang Jabatan',
      message: `Apakah Anda yakin ingin menghapus jenjang "${item.name}" (Golongan: ${sgCode}, Level: ${gName})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await jenjangService.deleteJenjang(item.id);
      if (res.success) {
        toast.success(`Jenjang "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus jenjang jabatan.', 'Gagal');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter & Toolbar Card */}
      <Card className="p-4 bg-white/80 backdrop-blur-xs border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama jenjang, kode level, golongan..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Golongan */}
          <div className="w-full md:w-44">
            <Select
              value={filterSalaryGradeId}
              onChange={(e) => setFilterSalaryGradeId(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">Semua Golongan</option>
              {salaryGrades.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  Golongan {sg.code}
                </option>
              ))}
            </Select>
          </div>

          {/* Filter Level Jabatan */}
          <div className="w-full md:w-48">
            <Select
              value={filterGradeId}
              onChange={(e) => setFilterGradeId(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">Semua Level Jabatan</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.code} - {g.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Filter Status */}
          <div className="w-full md:w-36">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Non-Aktif</option>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => window.open(importExportService.getExportUrl('jenjang'), '_blank')}
            >
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              isLoading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Segarkan
            </Button>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Tambah Jenjang
            </Button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Golongan" field="salary_grade_id" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Level Jabatan" field="grade_id" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Jenjang" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">Pangkat</th>
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
                    <td className="px-4 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <GitMerge className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data Jenjang Jabatan ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tambahkan pemetaan jenjang antara Golongan dan Level Jabatan atau sesuaikan filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Golongan */}
                      <td className="px-5 py-3.5 font-mono font-bold">
                        <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-200">
                          {item.salary_grade?.code || '-'}
                        </Badge>
                      </td>

                      {/* 2. Level Jabatan */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-mono text-[10px]">
                            {item.grade?.code || '-'}
                          </Badge>
                          <span className="font-medium text-slate-800">
                            {item.grade?.name || '-'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Nama Jenjang */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <GitMerge className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* 4. Pangkat */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                          {item.grade?.pangkat || 'Staff'}
                        </Badge>
                      </td>

                      {/* 5. Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                      </td>

                      {/* 7. Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Jenjang"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Jenjang"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="jenjang"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Jenjang Jabatan' : 'Edit Jenjang Jabatan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Golongan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Golongan Karyawan <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.salary_grade_id}
              onChange={(e) => setFormData({ ...formData, salary_grade_id: e.target.value })}
              required
              className="text-xs"
            >
              <option value="">Pilih Golongan</option>
              {salaryGrades.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  Golongan {sg.code} ({sg.name})
                </option>
              ))}
            </Select>
            <p className="text-[11px] text-slate-400 mt-1">
              Golongan yang akan dipetakan ke jenjang jabatan ini (maksimal 4 jenjang per golongan).
            </p>
          </div>

          {/* 2. Level Jabatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Level Jabatan <span className="text-rose-500">*</span>
            </label>
            <Select
              value={formData.grade_id}
              onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
              required
              className="text-xs"
            >
              <option value="">Pilih Level Jabatan</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.name} - {g.pangkat || 'Staff'}
                </option>
              ))}
            </Select>
          </div>

          {/* 3. Nama Jenjang */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Nama Jenjang Jabatan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Senior Group Leader, Junior Supervisor, Senior Officer"
              required
              className="text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Sebutan resmi jenjang karir untuk kombinasi golongan dan level jabatan ini.
            </p>
          </div>

          {/* 4. Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Status Jenjang
            </label>
            <div className="flex items-center gap-4 pt-0.5">
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="ACTIVE"
                  checked={formData.status === 'ACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium">Aktif</span>
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="INACTIVE"
                  checked={formData.status === 'INACTIVE'}
                  onChange={() => setFormData({ ...formData, status: 'INACTIVE' })}
                  className="text-slate-400 focus:ring-slate-400"
                />
                <span className="font-medium text-slate-500">Non-Aktif</span>
              </label>
            </div>
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
              {modalMode === 'create' ? 'Simpan Jenjang' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
