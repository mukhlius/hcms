'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  Download,
  Sun,
  Moon,
  Filter,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { ShiftItem } from '@/types';
import { scheduleMasterService } from '@/services/masterDataService';
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

interface PolaShiftTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const PolaShiftTab: React.FC<PolaShiftTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterCrossDay, setFilterCrossDay] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    start_time: '06:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    cross_day: false,
    grace_period_minutes: 15,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await scheduleMasterService.getShifts();
      if (res.success && res.data) {
        setItems(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load shifts:', err);
      toast.error('Gagal memuat data master shift kerja.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => ({
    id: 0,
    code: '',
    name: '',
    start_time: '06:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    cross_day: false,
    grace_period_minutes: 15,
    status: 'ACTIVE' as const,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(resetForm());
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: ShiftItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      start_time: item.start_time ? item.start_time.substring(0, 5) : '06:00',
      end_time: item.end_time ? item.end_time.substring(0, 5) : '18:00',
      break_start: item.break_start ? item.break_start.substring(0, 5) : '',
      break_end: item.break_end ? item.break_end.substring(0, 5) : '',
      cross_day: Boolean(item.cross_day),
      grace_period_minutes: item.grace_period_minutes ?? 15,
      status: item.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.warning('Kode dan Nama Shift harus diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<ShiftItem> = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_start: formData.break_start ? formData.break_start : null,
        break_end: formData.break_end ? formData.break_end : null,
        cross_day: formData.cross_day,
        grace_period_minutes: Number(formData.grace_period_minutes) || 0,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await scheduleMasterService.createShift(payload);
        if (res.success) {
          toast.success(`Pola shift "${formData.name}" berhasil dibuat.`, 'Berhasil Menambahkan');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await scheduleMasterService.updateShift(formData.id, payload);
        if (res.success) {
          toast.success(`Pola shift "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menyimpan data master shift.',
        'Gagal Menyimpan'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ShiftItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Pola Shift Kerja',
      message: `Apakah Anda yakin ingin menghapus master shift "${item.name}" (${item.code})? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus Shift',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await scheduleMasterService.deleteShift(item.id);
      if (res.success) {
        toast.success(`Shift kerja "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Gagal menghapus pola shift kerja.',
        'Gagal Menghapus'
      );
    }
  };

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.code?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase());

      const matchCrossDay =
        filterCrossDay === 'ALL' ||
        (filterCrossDay === 'CROSS_DAY' && item.cross_day) ||
        (filterCrossDay === 'STANDARD' && !item.cross_day);

      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchCrossDay && matchStatus;
    });
  }, [items, search, filterCrossDay, filterStatus]);

  const {
    paginatedData,
    sortField,
    sortOrder,
    handleSort,
    currentPage,
    setCurrentPage,
    perPage,
    handlePerPageChange,
    totalPages,
    totalItems,
  } = useClientTable(filteredData, { defaultSortField: 'code', defaultPerPage: 10 });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.warning('Tidak ada data untuk diekspor.', 'Ekspor Dibatalkan');
      return;
    }
    const headers = [
      'Kode Shift',
      'Nama Shift',
      'Jam Mulai',
      'Jam Selesai',
      'Istirahat Mulai',
      'Istirahat Selesai',
      'Lintas Hari',
      'Toleransi Keterlambatan (Menit)',
      'Status',
    ];
    const rows = filteredData.map((item) => [
      `"${(item.code || '').replace(/"/g, '""')}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      item.start_time ? item.start_time.substring(0, 5) : '-',
      item.end_time ? item.end_time.substring(0, 5) : '-',
      item.break_start ? item.break_start.substring(0, 5) : '-',
      item.break_end ? item.break_end.substring(0, 5) : '-',
      item.cross_day ? 'Ya (Cross-Day)' : 'Tidak',
      item.grace_period_minutes ?? 0,
      item.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `pola_shift_kerja_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterCrossDay('ALL');
    setFilterStatus('ALL');
  };

  const hasActiveFilters = search !== '' || filterCrossDay !== 'ALL' || filterStatus !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Filter and Action Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari kode atau nama shift..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Lintas Hari */}
            <div className="w-full sm:w-44">
              <Select
                value={filterCrossDay}
                onChange={(e) => setFilterCrossDay(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="ALL">Semua Jenis Hari</option>
                <option value="CROSS_DAY">Lintas Malam (Cross-Day)</option>
                <option value="STANDARD">Reguler (Satu Hari)</option>
              </Select>
            </div>

            {/* Filter Status */}
            <div className="w-full sm:w-36">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shrink-0"
                title="Reset Filter"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="h-3.5 w-3.5" />}
              className="h-9 text-xs"
            >
              Ekspor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              isLoading={loading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              className="h-9 text-xs"
            >
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Shift Table */}
      <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
            <p className="font-medium text-slate-600 dark:text-slate-400">Tidak ada data shift kerja ditemukan.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {hasActiveFilters ? 'Coba ubah kata kunci atau bersihkan filter pencarian.' : 'Klik "Tambah Shift Kerja" untuk menambahkan data baru.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader field="code" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                      Kode
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader field="name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                      Nama Shift
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader field="start_time" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                      Jam Kerja (Mulai - Selesai)
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3.5">Waktu Istirahat</th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader field="cross_day" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                      Lintas Malam
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader field="grace_period_minutes" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                      Toleransi
                    </SortableHeader>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader field="status" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                      Status
                    </SortableHeader>
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{s.code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {s.cross_day ? (
                          <Moon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : (
                          <Sun className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                      {s.break_start ? `${s.break_start.slice(0, 5)} - ${s.break_end?.slice(0, 5)}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {s.cross_day ? (
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800">
                          Ya (Cross-Day)
                        </Badge>
                      ) : (
                        <span className="text-slate-400">Tidak</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {s.grace_period_minutes ?? 0} Menit
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Shift"
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s)}
                          title="Hapus Shift"
                          className="h-8 w-8 p-0 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              totalItems={totalItems}
              itemLabel="shift"
              onPageChange={setCurrentPage}
              onPerPageChange={handlePerPageChange}
            />
          </div>
        )}
      </Card>

      {/* Modal: Tambah & Edit Master Shift */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Master Shift Kerja' : `Edit Shift: ${formData.name}`}
        description="Konfigurasi parameter jam kerja operasional dan batas toleransi absensi."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Shift"
              placeholder="Contoh: DS-12"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Nama Shift"
              placeholder="Contoh: Day Shift 12 Jam"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Istirahat Mulai (Opsional)"
              type="time"
              value={formData.break_start}
              onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
            />
            <Input
              label="Istirahat Selesai (Opsional)"
              type="time"
              value={formData.break_end}
              onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Toleransi Terlambat (Menit)"
              type="number"
              min="0"
              value={formData.grace_period_minutes}
              onChange={(e) =>
                setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) || 0 })
              }
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="ACTIVE">Aktif (ACTIVE)</option>
              <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
            </Select>
          </div>

          <div className="pt-1 pb-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.cross_day}
                onChange={(e) => setFormData({ ...formData, cross_day: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <span>Lintas Tengah Malam (Cross-Day / Shift Berganti Hari)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Master Shift' : 'Perbarui Shift'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
