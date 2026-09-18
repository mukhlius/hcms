'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  Palmtree,
  Wallet,
  Gift,
  Plane,
  UserCheck,
  Filter,
  Download
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields:
  // 1. Kode, 2. Level, 3. Pangkat (Staff / Non Staff), 4. Nama Level Jabatan, 5. Durasi Dinas Lapangan, 6. Durasi Cuti Lapangan,
  // 7. Uang Tunjangan Lapangan, 8. Bantuan Uang Lumpsum Cuti, 9. Uang Perjalanan Dinas Perhari
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    level: 1,
    pangkat: 'Staff',
    name: '',
    field_duty_duration_days: '42',
    field_leave_duration_days: '14',
    field_allowance: '4500000',
    leave_lumpsum_allowance: '2500000',
    business_trip_allowance_daily: '375000',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await jobGradeService.getGrades({
        search: search || undefined,
        pangkat: selectedPangkat || undefined,
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
  }, [search, selectedPangkat]);

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
    const nextLevel = grades.length > 0 ? Math.max(...grades.map(g => g.level)) + 1 : 1;
    const formattedCode = nextLevel < 10 ? `LVL-0${nextLevel}` : `LVL-${nextLevel}`;
    setFormData({
      id: 0,
      code: formattedCode,
      level: nextLevel,
      pangkat: nextLevel <= 6 ? 'Staff' : 'Non Staff',
      name: '',
      field_duty_duration_days: '28',
      field_leave_duration_days: '14',
      field_allowance: '5000000',
      leave_lumpsum_allowance: '3000000',
      business_trip_allowance_daily: '450000',
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
      pangkat: item.pangkat || (item.level <= 6 ? 'Staff' : 'Non Staff'),
      name: item.name,
      field_duty_duration_days: item.field_duty_duration_days ? String(item.field_duty_duration_days) : '',
      field_leave_duration_days: item.field_leave_duration_days ? String(item.field_leave_duration_days) : '',
      field_allowance: item.field_allowance ? String(item.field_allowance) : '',
      leave_lumpsum_allowance: item.leave_lumpsum_allowance ? String(item.leave_lumpsum_allowance) : '',
      business_trip_allowance_daily: item.business_trip_allowance_daily ? String(item.business_trip_allowance_daily) : '',
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
        field_duty_duration_days: formData.field_duty_duration_days ? parseInt(formData.field_duty_duration_days) : null,
        field_leave_duration_days: formData.field_leave_duration_days ? parseInt(formData.field_leave_duration_days) : null,
        field_allowance: formData.field_allowance ? parseFloat(formData.field_allowance) : null,
        leave_lumpsum_allowance: formData.leave_lumpsum_allowance ? parseFloat(formData.leave_lumpsum_allowance) : null,
        business_trip_allowance_daily: formData.business_trip_allowance_daily ? parseFloat(formData.business_trip_allowance_daily) : null,
        status: 'ACTIVE',
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
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Gagal menyimpan level jabatan.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
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

  const formatCurrency = (val?: number | null) => {
    if (!val || isNaN(val)) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama level jabatan..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="relative w-40">
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
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => window.open(importExportService.getExportUrl('levels'), '_blank')}
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
                  <SortableHeader label="Durasi Dinas" field="field_duty_duration_days" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Durasi Cuti" field="field_leave_duration_days" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Uang Tunjangan Lapangan" field="field_allowance" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Bantuan Lumpsum Cuti" field="leave_lumpsum_allowance" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Uang Perjalanan Dinas" field="business_trip_allowance_daily" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    <Award className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data level jabatan ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan level jabatan atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedGrades.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 1. Kode */}
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
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

                    {/* 4. Durasi Dinas Lapangan */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      {item.field_duty_duration_days ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-emerald-600" />
                          {item.field_duty_duration_days} Hari
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* 5. Durasi Cuti Lapangan */}
                    <td className="px-4 py-3.5 text-center font-mono">
                      {item.field_leave_duration_days ? (
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 font-mono inline-flex items-center gap-1">
                          <Palmtree className="h-3 w-3 text-sky-600" />
                          {item.field_leave_duration_days} Hari
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* 6. Uang Tunjangan Lapangan */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-amber-700">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>{formatCurrency(item.field_allowance)}</span>
                      </div>
                    </td>

                    {/* 7. Bantuan Uang Lumpsum Cuti */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-purple-700">
                      <div className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span>{formatCurrency(item.leave_lumpsum_allowance)}</span>
                      </div>
                    </td>

                    {/* 8. Uang Perjalanan Dinas Perhari */}
                    <td className="px-4 py-3.5 font-mono font-semibold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <Plane className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span>{formatCurrency(item.business_trip_allowance_daily)} / hari</span>
                      </div>
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

      {/* Create / Edit Modal strictly with the 8 requested fields */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Level Jabatan' : 'Edit Level Jabatan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Kode, 2. Level, & 3. Pangkat */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                1. Kode Level <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Contoh: G01, LVL-01"
                required
                className="font-mono uppercase text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                2. Level<span className="text-rose-500">*</span>
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
                Level 1 adalah level tertinggi dan menurun ke jenjang berikutnya.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Pangkat <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.pangkat}
                onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-semibold"
              >
                <option value="Staff">Staff</option>
                <option value="Non Staff">Non Staff</option>
              </select>
            </div>
          </div>

          {/* 4. Nama Level Jabatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Nama Level Jabatan <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Operator / Junior Staff, Supervisor, Manager"
              required
              className="text-xs"
            />
          </div>

          {/* 5. Durasi Dinas Lapangan & 6. Durasi Cuti Lapangan */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <span className="text-xs font-bold text-slate-800">Durasi Lapangan (Hari)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  5. Durasi Dinas Lapangan
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.field_duty_duration_days}
                    onChange={(e) => setFormData({ ...formData, field_duty_duration_days: e.target.value })}
                    placeholder="Contoh: 70, 56, 42, 28"
                    className="font-mono text-xs pr-12"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  6. Durasi Cuti Lapangan
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.field_leave_duration_days}
                    onChange={(e) => setFormData({ ...formData, field_leave_duration_days: e.target.value })}
                    placeholder="Contoh: 14, 12, 7"
                    className="font-mono text-xs pr-12"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Uang Tunjangan Lapangan, 8. Bantuan Uang Lumpsum Cuti, 9. Uang Perjalanan Dinas Perhari */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800">Tunjangan & Fasilitas Keuangan</span>

            {/* 7. Uang Tunjangan Lapangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                7. Uang Tunjangan Lapangan/Hari (IDR)
              </label>
              <Input
                type="number"
                min="0"
                step="100000"
                value={formData.field_allowance}
                onChange={(e) => setFormData({ ...formData, field_allowance: e.target.value })}
                placeholder="Contoh: 4500000"
                className="font-mono text-xs"
              />
            </div>

            {/* 8. Bantuan Uang Lumpsum Cuti */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                8. Bantuan Uang Lumpsum Cuti (IDR)
              </label>
              <Input
                type="number"
                min="0"
                step="100000"
                value={formData.leave_lumpsum_allowance}
                onChange={(e) => setFormData({ ...formData, leave_lumpsum_allowance: e.target.value })}
                placeholder="Contoh: 2500000"
                className="font-mono text-xs"
              />
            </div>

            {/* 9. Uang Perjalanan Dinas Perhari */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                9. Uang Perjalanan Dinas Perhari (IDR)
              </label>
              <Input
                type="number"
                min="0"
                step="25000"
                value={formData.business_trip_allowance_daily}
                onChange={(e) => setFormData({ ...formData, business_trip_allowance_daily: e.target.value })}
                placeholder="Contoh: 375000"
                className="font-mono text-xs"
              />
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
              {modalMode === 'create' ? 'Simpan Level' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
