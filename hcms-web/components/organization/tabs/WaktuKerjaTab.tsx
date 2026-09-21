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
  Moon,
  Sun,
  Filter,
  ChevronDown,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { PositionWorkTimeItem, PositionItem, ShiftItem } from '@/types';
import { positionWorkTimeService, positionService, scheduleMasterService } from '@/services/masterDataService';
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

// Helper: menit → 'HH:MM'
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};
// Helper: 'HH:MM' → menit
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

interface WaktuKerjaTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const WaktuKerjaTab: React.FC<WaktuKerjaTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<PositionWorkTimeItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterShiftType, setFilterShiftType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    position_id: '',
    shift_id: '',
    shift_type: 'DAY' as 'DAY' | 'NIGHT' | 'CUSTOM',
    start_time: '07:00',
    end_time: '15:00',
    late_tolerance: '00:15',
    early_out_tolerance: '00:15',
    daily_hours: 8,
    weekly_days: 5,
    break_minutes: 60,
    is_overtime_eligible: false,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, posRes, shiftRes] = await Promise.all([
        positionWorkTimeService.getPositionWorkTimes({ per_page: 500 }),
        positionService.getPositions({ per_page: 500 }),
        scheduleMasterService.getShifts(),
      ]);

      if (res.success && res.data) setItems(res.data.data || []);
      if (posRes.success && posRes.data) setPositions(posRes.data.data || []);
      if (shiftRes.success && shiftRes.data) setShifts(shiftRes.data || []);
    } catch (err) {
      console.error('Failed to load position work times:', err);
      toast.error('Gagal memuat data waktu kerja posisi.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => ({
    id: 0,
    position_id: '',
    shift_id: '',
    shift_type: 'DAY' as const,
    start_time: '07:00',
    end_time: '15:00',
    late_tolerance: '00:15',
    early_out_tolerance: '00:15',
    daily_hours: 8,
    weekly_days: 5,
    break_minutes: 60,
    is_overtime_eligible: false,
    description: '',
    status: 'ACTIVE' as const,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(resetForm());
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) handleOpenCreate();
  }, [createTrigger]);

  const handleOpenEdit = (item: PositionWorkTimeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      position_id: String(item.position_id),
      shift_id: item.shift_id ? String(item.shift_id) : '',
      shift_type: (item.shift_type as any) || 'DAY',
      start_time: item.start_time ? item.start_time.substring(0, 5) : '07:00',
      end_time: item.end_time ? item.end_time.substring(0, 5) : '15:00',
      late_tolerance: minutesToTime(item.late_tolerance_minutes ?? 15),
      early_out_tolerance: minutesToTime(item.early_out_tolerance_minutes ?? 15),
      daily_hours: Number(item.daily_hours),
      weekly_days: item.weekly_days,
      break_minutes: item.break_minutes,
      is_overtime_eligible: item.is_overtime_eligible,
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleShiftChange = (shiftId: string) => {
    setFormData((prev) => {
      const selectedShift = shifts.find((s) => String(s.id) === shiftId);
      if (selectedShift) {
        // Auto-detect shift type by start time
        const startHour = parseInt(selectedShift.start_time.substring(0, 2), 10);
        const autoType = startHour >= 18 || startHour < 6 ? 'NIGHT' : 'DAY';
        return {
          ...prev,
          shift_id: shiftId,
          shift_type: autoType,
          start_time: selectedShift.start_time.substring(0, 5),
          end_time: selectedShift.end_time.substring(0, 5),
          late_tolerance: minutesToTime(selectedShift.grace_period_minutes ?? 15),
        };
      }
      return { ...prev, shift_id: shiftId };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.position_id) {
      toast.warning('Posisi jabatan harus dipilih.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<PositionWorkTimeItem> = {
        position_id: Number(formData.position_id),
        shift_id: formData.shift_id ? Number(formData.shift_id) : null,
        shift_type: formData.shift_type,
        work_type: 'SHIFT',
        start_time: formData.start_time ? `${formData.start_time}:00` : null,
        end_time: formData.end_time ? `${formData.end_time}:00` : null,
        late_tolerance_minutes: timeToMinutes(formData.late_tolerance),
        early_out_tolerance_minutes: timeToMinutes(formData.early_out_tolerance),
        daily_hours: Number(formData.daily_hours),
        weekly_days: Number(formData.weekly_days),
        break_minutes: Number(formData.break_minutes),
        is_overtime_eligible: Boolean(formData.is_overtime_eligible),
        description: formData.description.trim() || null,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await positionWorkTimeService.createPositionWorkTime(payload);
        if (res.success) {
          toast.success('Pengaturan waktu kerja posisi berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await positionWorkTimeService.updatePositionWorkTime(formData.id, payload);
        if (res.success) {
          toast.success('Pengaturan waktu kerja posisi berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan waktu kerja posisi.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: PositionWorkTimeItem) => {
    const posTitle = item.position?.title || 'Posisi terpilih';
    const confirmed = await confirmDialog({
      title: 'Hapus Waktu Kerja Posisi',
      message: `Apakah Anda yakin ingin menghapus jadwal waktu kerja untuk "${posTitle}"?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const res = await positionWorkTimeService.deletePositionWorkTime(item.id);
      if (res.success) {
        toast.success(`Waktu kerja untuk "${posTitle}" berhasil dihapus.`);
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus waktu kerja.', 'Gagal');
    }
  };

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const posCode = item.position?.code || '';
      const posTitle = item.position?.title || '';
      const deptName = item.position?.department?.name || '';
      const shiftName = item.shift?.name || '';

      const matchSearch =
        !search.trim() ||
        posCode.toLowerCase().includes(search.toLowerCase()) ||
        posTitle.toLowerCase().includes(search.toLowerCase()) ||
        deptName.toLowerCase().includes(search.toLowerCase()) ||
        shiftName.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase());

      const matchShiftType = filterShiftType === 'ALL' || item.shift_type === filterShiftType;
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchShiftType && matchStatus;
    });
  }, [items, search, filterShiftType, filterStatus]);

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
  } = useClientTable(filteredData, { defaultSortField: 'id', defaultSortOrder: 'desc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.warning('Tidak ada data untuk diekspor.', 'Ekspor Dibatalkan');
      return;
    }
    const headers = ['Posisi Jabatan', 'Shift', 'Jenis Shift', 'Jam Mulai', 'Toleransi Mulai (mnt)', 'Jam Akhir', 'Toleransi Akhir (mnt)', 'Keterangan', 'Status'];
    const rows = filteredData.map((item) => [
      `"${(item.position?.title || '').replace(/"/g, '""')}"`,
      `"${(item.shift?.name || '').replace(/"/g, '""')}"`,
      item.shift_type || '-',
      item.start_time ? item.start_time.substring(0, 5) : '-',
      item.late_tolerance_minutes ?? 0,
      item.end_time ? item.end_time.substring(0, 5) : '-',
      item.early_out_tolerance_minutes ?? 0,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `waktu_kerja_posisi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV waktu kerja posisi berhasil diunduh.');
  };

  const hasActiveFilter = search || filterShiftType !== 'ALL' || filterStatus !== 'ALL';

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari posisi, shift, departemen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Shift Type */}
            <div className="relative w-36">
              <select
                value={filterShiftType}
                onChange={(e) => setFilterShiftType(e.target.value)}
                className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
              >
                <option value="ALL">Semua Shift</option>
                <option value="DAY">Shift Day</option>
                <option value="NIGHT">Shift Night</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Filter Status */}
            <div className="relative w-36">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Reset Filter */}
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setFilterShiftType('ALL'); setFilterStatus('ALL'); }}
                className="h-9 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
                title="Reset Filter"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleExportCsv} leftIcon={<Download className="h-3.5 w-3.5" />}>
              Unduh CSV
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} isLoading={loading} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Segarkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Posisi Jabatan" field="position.title" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Shift" field="shift.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Day / Night" field="shift_type" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} align="center" />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Jam Mulai" field="start_time" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} align="center" />
                </th>
                <th className="px-4 py-3.5 text-center">Tol. Mulai</th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Jam Akhir" field="end_time" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} align="center" />
                </th>
                <th className="px-4 py-3.5 text-center">Tol. Akhir</th>
                <th className="px-4 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-3.5"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-3.5 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400">
                    <Clock className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Belum ada pengaturan waktu kerja</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan tombol &quot;Tambah Waktu Kerja&quot; untuk menambahkan jadwal shift posisi.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Posisi Jabatan */}
                    <td className="px-5 py-3.5">
                      <div className="font-mono text-[11px] text-blue-700 font-bold">{item.position?.code}</div>
                      <div className="font-semibold text-slate-800 mt-0.5">{item.position?.title}</div>
                      <div className="text-[11px] text-slate-400">{item.position?.department?.name}</div>
                    </td>

                    {/* Shift */}
                    <td className="px-4 py-3.5">
                      {item.shift ? (
                        <div>
                          <div className="font-semibold text-slate-800">{item.shift.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{item.shift.code}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Day / Night */}
                    <td className="px-4 py-3.5 text-center">
                      {item.shift_type === 'DAY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Sun className="h-3 w-3" /> Day
                        </span>
                      ) : item.shift_type === 'NIGHT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Moon className="h-3 w-3" /> Night
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Custom
                        </span>
                      )}
                    </td>

                    {/* Jam Mulai */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.start_time ? item.start_time.substring(0, 5) : '-'}
                      </span>
                    </td>

                    {/* Toleransi Mulai */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Timer className="h-2.5 w-2.5" />
                        {minutesToTime(item.late_tolerance_minutes ?? 0)}
                      </span>
                    </td>

                    {/* Jam Akhir */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.end_time ? item.end_time.substring(0, 5) : '-'}
                      </span>
                    </td>

                    {/* Toleransi Akhir */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <Timer className="h-2.5 w-2.5" />
                        {minutesToTime(item.early_out_tolerance_minutes ?? 0)}
                      </span>
                    </td>

                    {/* Keterangan */}
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <span className="text-slate-500 text-[11px] truncate block" title={item.description || '-'}>
                        {item.description || <span className="italic text-slate-300">-</span>}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                        {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </Card>

      {/* Modal: Tambah / Edit Waktu Kerja Posisi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Waktu Kerja Posisi' : 'Edit Waktu Kerja Posisi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Posisi */}
          <Select
            label="Posisi / Jabatan"
            value={formData.position_id}
            onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
            options={[
              { value: '', label: '-- Pilih Posisi Jabatan --' },
              ...positions.map((p) => ({
                value: String(p.id),
                label: `${p.code} - ${p.title} (${p.department?.name || 'Umum'})`,
              })),
            ]}
            required
            disabled={modalMode === 'edit'}
          />

          {/* Template Shift + Shift Type */}
          <div className="space-y-4">
            <Select
              label="Template Shift (Opsional)"
              value={formData.shift_id}
              onChange={(e) => handleShiftChange(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Template --' },
                ...shifts.map((s) => ({
                  value: String(s.id),
                  label: `${s.code} — ${s.start_time.substring(0, 5)} s/d ${s.end_time.substring(0, 5)}`,
                })),
              ]}
            />
          </div>

          {/* Jam Mulai & Akhir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
            <Input
              label="Jam Akhir"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>

          {/* Toleransi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Toleransi Masuk (HH:MM)"
              type="time"
              value={formData.late_tolerance}
              onChange={(e) => setFormData({ ...formData, late_tolerance: e.target.value })}
            />
            <Input
              label="Toleransi Pulang Awal (HH:MM)"
              type="time"
              value={formData.early_out_tolerance}
              onChange={(e) => setFormData({ ...formData, early_out_tolerance: e.target.value })}
            />
          </div>

          {/* Status */}
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'INACTIVE', label: 'Nonaktif' },
            ]}
          />

          {/* Keterangan */}
          <Input
            label="Keterangan"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Catatan tambahan untuk shift ini..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan' : 'Perbarui'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
