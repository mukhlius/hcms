'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Home,
  Layers
} from 'lucide-react';
import { SalaryGradeItem } from '@/types';
import { salaryGradeService } from '@/services/masterDataService';
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

interface GradeTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

const formatRupiah = (val?: number | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const GradeTab: React.FC<GradeTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<SalaryGradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // 4 Specific Form Fields:
  // 1. Kode, 2. Nama Golongan, 3. Uang Bantuan Perumahan, 4. Status
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    housing_allowance: '1500000',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salaryGradeService.getSalaryGrades({
        search: search || undefined,
      });

      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load salary grades:', err);
      toast.error('Gagal memuat data Golongan / Grade.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, [search]);

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
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      code: 'GOL-',
      name: '',
      housing_allowance: '2000000',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: SalaryGradeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      housing_allowance: item.housing_allowance !== undefined && item.housing_allowance !== null ? String(item.housing_allowance) : '0',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama Golongan wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<SalaryGradeItem> = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        housing_allowance: parseFloat(formData.housing_allowance) || 0,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await salaryGradeService.createSalaryGrade(payload);
        if (res.success) {
          toast.success(`Golongan "${formData.name}" berhasil dibuat.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      } else {
        const res = await salaryGradeService.updateSalaryGrade(formData.id, payload);
        if (res.success) {
          toast.success(`Golongan "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Gagal menyimpan Golongan / Grade.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: SalaryGradeItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Golongan / Grade',
      message: `Apakah Anda yakin ingin menghapus Golongan "${item.name}" (${item.code})? Data posisi atau personel terkait dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Golongan',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await salaryGradeService.deleteSalaryGrade(item.id);
      if (res.success) {
        toast.success(`Golongan "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus Golongan / Grade.', 'Gagal Dihapus');
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama golongan..."
              className="pl-9 h-9 text-xs"
            />
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

      {/* Table Card - strictly showing the 5 requested fields */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Golongan" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-right">
                  <SortableHeader label="Uang Bantuan Perumahan" field="housing_allowance" align="right" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-28 ml-auto" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <ShieldCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data Golongan / Grade ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan data golongan baru atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Kode */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        <Badge variant="outline" className="font-mono bg-cyan-50 text-cyan-800 border-cyan-200">
                          {item.code}
                        </Badge>
                      </td>

                      {/* 2. Nama Golongan */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* 3. Uang Bantuan Perumahan */}
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                        <div className="flex items-center justify-end gap-1.5">
                          <Home className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{formatRupiah(item.housing_allowance)}</span>
                        </div>
                      </td>

                      {/* 4. Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {item.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
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
                            title="Edit Golongan"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Golongan"
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
          itemLabel="golongan"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal strictly with the 5 requested fields */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Golongan / Grade' : 'Edit Golongan / Grade'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Kode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Kode Golongan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Contoh: GOL-1A, GOL-2B, GR-01"
              required
              className="font-mono uppercase text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kode unik untuk penjenjangan kepangkatan dan tunjangan perumahan.
            </p>
          </div>

          {/* 2. Nama Golongan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Nama Golongan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Golongan 1A, Golongan 2B - Senior Operator"
              required
              className="text-xs"
            />
          </div>

          {/* 3. Uang Bantuan Perumahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Uang Bantuan Perumahan (IDR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Home className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600" />
              <Input
                type="number"
                min="0"
                step="50000"
                value={formData.housing_allowance}
                onChange={(e) => setFormData({ ...formData, housing_allowance: e.target.value })}
                placeholder="Contoh: 1500000"
                required
                className="pl-9 font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Besaran kompensasi bantuan tunjangan sewa rumah / perumahan bulanan sesuai golongan.
            </p>
          </div>

          {/* 4. Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Status Golongan
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
              {modalMode === 'create' ? 'Simpan Golongan' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
