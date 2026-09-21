'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Clock,
  Briefcase,
  Layers,
  Download,
  Moon,
  Sun,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronDown
} from 'lucide-react';
import { PositionWorkTimeItem, PositionItem, ShiftItem, WorkScheduleItem } from '@/types';
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

interface WaktuKerjaTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const WaktuKerjaTab: React.FC<WaktuKerjaTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<PositionWorkTimeItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [schedules, setSchedules] = useState<WorkScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    position_id: '',
    shift_id: '',
    work_schedule_id: '',
    work_type: 'SHIFT' as 'SHIFT' | 'NON_SHIFT' | 'FLEXIBLE',
    start_time: '06:00',
    end_time: '18:00',
    daily_hours: 12.00,
    weekly_days: 6,
    break_minutes: 60,
    is_overtime_eligible: true,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, posRes, shiftRes, schedRes] = await Promise.all([
        positionWorkTimeService.getPositionWorkTimes({ per_page: 500 }),
        positionService.getPositions({ per_page: 500 }),
        scheduleMasterService.getShifts(),
        scheduleMasterService.getWorkSchedules(),
      ]);

      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
      if (posRes.success && posRes.data) {
        setPositions(posRes.data.data || []);
      }
      if (shiftRes.success && shiftRes.data) {
        setShifts(shiftRes.data || []);
      }
      if (schedRes.success && schedRes.data) {
        setSchedules(schedRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load position work times:', err);
      toast.error('Gagal memuat data waktu kerja posisi.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      position_id: '',
      shift_id: '',
      work_schedule_id: '',
      work_type: 'SHIFT',
      start_time: '06:00',
      end_time: '18:00',
      daily_hours: 12.00,
      weekly_days: 6,
      break_minutes: 60,
      is_overtime_eligible: true,
      description: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: PositionWorkTimeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      position_id: String(item.position_id),
      shift_id: item.shift_id ? String(item.shift_id) : '',
      work_schedule_id: item.work_schedule_id ? String(item.work_schedule_id) : '',
      work_type: item.work_type,
      start_time: item.start_time ? item.start_time.substring(0, 5) : '06:00',
      end_time: item.end_time ? item.end_time.substring(0, 5) : '18:00',
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
        return {
          ...prev,
          shift_id: shiftId,
          start_time: selectedShift.start_time.substring(0, 5),
          end_time: selectedShift.end_time.substring(0, 5),
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
        work_schedule_id: formData.work_schedule_id ? Number(formData.work_schedule_id) : null,
        work_type: formData.work_type,
        start_time: formData.start_time ? `${formData.start_time}:00` : null,
        end_time: formData.end_time ? `${formData.end_time}:00` : null,
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

      const matchSearch =
        posCode.toLowerCase().includes(search.toLowerCase()) ||
        posTitle.toLowerCase().includes(search.toLowerCase()) ||
        deptName.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === 'ALL' || item.work_type === filterType;

      return matchSearch && matchType;
    });
  }, [items, search, filterType]);

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

    const headers = ['Kode Posisi', 'Nama Posisi Jabatan', 'Departemen', 'Tipe Kerja', 'Jam Kerja', 'Jam/Hari', 'Hari/Minggu', 'Lembur Berbayar', 'Status'];
    const rows = filteredData.map((item) => [
      `"${item.position?.code || ''}"`,
      `"${(item.position?.title || '').replace(/"/g, '""')}"`,
      `"${(item.position?.department?.name || '').replace(/"/g, '""')}"`,
      item.work_type,
      `"${item.start_time ? item.start_time.substring(0, 5) : '-'} - ${item.end_time ? item.end_time.substring(0, 5) : '-'}"`,
      item.daily_hours,
      item.weekly_days,
      item.is_overtime_eligible ? 'YA' : 'TIDAK',
      item.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `waktu_kerja_posisi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV waktu kerja posisi berhasil diunduh.');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari kode/nama posisi, departemen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="relative w-44">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
              >
                <option value="ALL">Semua Tipe Kerja</option>
                <option value="SHIFT">Shift Tambang</option>
                <option value="NON_SHIFT">Non-Shift (Reguler)</option>
                <option value="FLEXIBLE">Jam Fleksibel</option>
              </select>
              <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
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
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Posisi Jabatan</th>
                <th className="px-4 py-3.5">Departemen</th>
                <th className="px-4 py-3.5">Tipe Kerja</th>
                <th className="px-4 py-3.5 text-center">Jadwal Jam</th>
                <th className="px-4 py-3.5 text-center">Jam / Hari</th>
                <th className="px-4 py-3.5 text-center">Hari / Minggu</th>
                <th className="px-4 py-3.5 text-center">Lembur</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-44" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Clock className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Belum ada pengaturan waktu kerja posisi</p>
                    <p className="text-xs text-slate-400 mt-1">Klik tombol &quot;Tambah Waktu Kerja&quot; untuk menetapkan jam kerja posisi.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="font-mono text-xs text-blue-700 font-bold">{item.position?.code}</div>
                      <div className="text-slate-900 font-semibold">{item.position?.title}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.position?.department?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.work_type === 'SHIFT' ? 'primary' : item.work_type === 'NON_SHIFT' ? 'secondary' : 'warning'}>
                        {item.work_type === 'SHIFT' ? 'Shift Tambang' : item.work_type === 'NON_SHIFT' ? 'Non-Shift' : 'Fleksibel'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-700">
                      {item.start_time && item.end_time ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {item.daily_hours} Jam
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">
                      {item.weekly_days} Hari
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={item.is_overtime_eligible ? 'success' : 'secondary'}>
                        {item.is_overtime_eligible ? 'Berbayar' : 'Tidak'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)} className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} className="h-7 w-7 p-0 text-red-600 hover:bg-red-50">
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
        title={modalMode === 'create' ? 'Tetapkan Waktu Kerja Posisi' : 'Edit Waktu Kerja Posisi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Pilih Posisi / Jabatan"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipe Kerja"
              value={formData.work_type}
              onChange={(e) => setFormData({ ...formData, work_type: e.target.value as any })}
              options={[
                { value: 'SHIFT', label: 'Shift Kerja Tambang' },
                { value: 'NON_SHIFT', label: 'Non-Shift (Hari Kerja Normal)' },
                { value: 'FLEXIBLE', label: 'Jam Fleksibel' },
              ]}
              required
            />

            <Select
              label="Template Shift (Opsional)"
              value={formData.shift_id}
              onChange={(e) => handleShiftChange(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Template Shift --' },
                ...shifts.map((s) => ({
                  value: String(s.id),
                  label: `${s.code} (${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)})`,
                })),
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="Jam Selesai"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Jam Kerja / Hari"
              type="number"
              step="0.5"
              min={1}
              max={24}
              value={formData.daily_hours}
              onChange={(e) => setFormData({ ...formData, daily_hours: Number(e.target.value) })}
              required
            />
            <Input
              label="Hari Kerja / Minggu"
              type="number"
              min={1}
              max={7}
              value={formData.weekly_days}
              onChange={(e) => setFormData({ ...formData, weekly_days: Number(e.target.value) })}
              required
            />
            <Input
              label="Istirahat (Menit)"
              type="number"
              min={0}
              max={240}
              value={formData.break_minutes}
              onChange={(e) => setFormData({ ...formData, break_minutes: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Hak Lembur (Overtime)"
              value={formData.is_overtime_eligible ? '1' : '0'}
              onChange={(e) => setFormData({ ...formData, is_overtime_eligible: e.target.value === '1' })}
              options={[
                { value: '1', label: 'Ya - Berhak Uang Lembur' },
                { value: '0', label: 'Tidak - Jabatan Non-Overtime' },
              ]}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Nonaktif' },
              ]}
            />
          </div>

          <Input
            label="Keterangan / Catatan Shift"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Catatan ketentuan pergantian shift atau rotasi pengawas..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Waktu Kerja' : 'Perbarui Waktu Kerja'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
