'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Edit,
  Trash2,
  CalendarDays,
  Download,
  Layers,
  Filter,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { LevelWorkRosterItem, GradeItem } from '@/types';
import { levelRosterService, jobGradeService } from '@/services/masterDataService';
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

interface RosterKerjaTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const RosterKerjaTab: React.FC<RosterKerjaTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<LevelWorkRosterItem[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    level: 1,
    grade_id: '',
    roster_name: '',
    days_on: 14,
    days_off: 7,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [res, gradesRes] = await Promise.all([
        levelRosterService.getLevelRosters({ per_page: 500 }),
        jobGradeService.getGrades(),
      ]);

      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
      if (gradesRes.success && gradesRes.data) {
        setGrades(gradesRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load level rosters:', err);
      toast.error('Gagal memuat data roster kerja level jabatan.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGradeName = useCallback((level: number, gradeId?: number | null) => {
    if (gradeId) {
      const found = grades.find((g) => g.id === gradeId);
      if (found) return found.name;
    }
    const foundByLevel = grades.find((g) => g.level === level);
    return foundByLevel ? foundByLevel.name : `Level ${level}`;
  }, [grades]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstGrade = grades[0];
    setFormData({
      id: 0,
      level: firstGrade ? firstGrade.level : 1,
      grade_id: firstGrade ? String(firstGrade.id) : '',
      roster_name: '',
      days_on: 14,
      days_off: 7,
      description: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  // Header "+ Tambah Roster Kerja" trigger
  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: LevelWorkRosterItem) => {
    setModalMode('edit');
    let gId = item.grade_id ? String(item.grade_id) : '';
    if (!gId) {
      const match = grades.find((g) => g.level === item.level);
      if (match) gId = String(match.id);
    }
    setFormData({
      id: item.id,
      level: item.level,
      grade_id: gId,
      roster_name: item.roster_name,
      days_on: item.days_on,
      days_off: item.days_off,
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roster_name.trim()) {
      toast.warning('Nama pola roster kerja harus diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<LevelWorkRosterItem> = {
        level: Number(formData.level),
        grade_id: formData.grade_id ? Number(formData.grade_id) : null,
        roster_name: formData.roster_name.trim(),
        days_on: Number(formData.days_on),
        days_off: Number(formData.days_off),
        description: (formData.description || '').trim() || null,
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await levelRosterService.createLevelRoster(payload);
        if (res.success) {
          toast.success(`Roster "${formData.roster_name}" berhasil ditambahkan.`);
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await levelRosterService.updateLevelRoster(formData.id, payload);
        if (res.success) {
          toast.success(`Roster "${formData.roster_name}" berhasil diperbarui.`);
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data roster.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: LevelWorkRosterItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Roster Kerja',
      message: `Apakah Anda yakin ingin menghapus data roster "${item.roster_name}" untuk Level ${item.level}?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await levelRosterService.deleteLevelRoster(item.id);
      if (res.success) {
        toast.success(`Roster "${item.roster_name}" berhasil dihapus.`);
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus roster.', 'Gagal');
    }
  };

  // Client-side filtering
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const gradeName = item.grade?.name || getGradeName(item.level, item.grade_id);
      const gradeCode = item.grade?.code || '';

      const matchSearch =
        !search.trim() ||
        item.roster_name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
        gradeName.toLowerCase().includes(search.toLowerCase()) ||
        gradeCode.toLowerCase().includes(search.toLowerCase()) ||
        `level ${item.level}`.includes(search.toLowerCase());

      let matchLevel = true;
      if (filterLevel !== 'ALL') {
        const targetGradeId = parseInt(filterLevel);
        const targetGrade = grades.find((g) => g.id === targetGradeId);
        if (targetGrade) {
          matchLevel =
            item.grade_id === targetGradeId ||
            item.grade?.id === targetGradeId ||
            item.level === targetGrade.level;
        }
      }

      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

      return matchSearch && matchLevel && matchStatus;
    });
  }, [items, search, filterLevel, filterStatus, grades, getGradeName]);

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
  } = useClientTable(filteredData, { defaultSortField: 'level', defaultSortOrder: 'asc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.warning('Tidak ada data untuk diekspor.', 'Ekspor Dibatalkan');
      return;
    }

    const headers = ['Level', 'Nama Level Jabatan', 'Nama Pola Roster', 'Hari Kerja (ON)', 'Hari Cuti (OFF)', 'Catatan', 'Status'];
    const rows = filteredData.map((item) => [
      `Level ${item.level}`,
      `"${(item.grade?.name || getGradeName(item.level, item.grade_id)).replace(/"/g, '""')}"`,
      `"${item.roster_name.replace(/"/g, '""')}"`,
      item.days_on,
      item.days_off,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roster_kerja_level_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV roster kerja berhasil diunduh.');
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar / Filter Component */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-slate-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          {/* Input Pencarian */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari level jabatan, nama pola roster, catatan..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Dropdown Filter Level Jabatan */}
          <div className="relative w-52">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none truncate"
            >
              <option value="ALL">Semua Level Jabatan</option>
              {grades.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  Level {g.level} - {g.name}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Dropdown Filter Status */}
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

          {/* Tombol Reset Filter */}
          {(search || filterLevel !== 'ALL' || filterStatus !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterLevel('ALL');
                setFilterStatus('ALL');
              }}
              className="h-9 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
              title="Reset Filter"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Tombol Aksi Kanan (Unduh CSV & Segarkan) */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Unduh CSV
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

      {/* Main Table Card */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">
                  <SortableHeader field="level" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                    Level (Jabatan)
                  </SortableHeader>
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader field="roster_name" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                    Nama Pola Roster
                  </SortableHeader>
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader field="days_on" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                    Hari Kerja (ON)
                  </SortableHeader>
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader field="days_off" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                    Hari Cuti (OFF)
                  </SortableHeader>
                </th>
                <th className="px-4 py-3.5">Catatan</th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader field="status" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                    Status
                  </SortableHeader>
                </th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <CalendarDays className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Belum ada data roster kerja level</p>
                    <p className="text-xs text-slate-400 mt-1">Gunakan tombol &quot;+ Tambah Roster Kerja&quot; di atas untuk menambahkan jadwal rotasi kerja.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const gradeName = item.grade?.name || getGradeName(item.level, item.grade_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            <Layers className="h-3 w-3" />
                            Level {item.level}
                          </span>
                          <span className="font-semibold text-slate-800 text-xs">
                            {gradeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.roster_name}</div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.days_on} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {item.days_off} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs text-xs">
                        <span className="line-clamp-2" title={item.description || '-'}>
                          {item.description || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
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
                  );
                })
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

      {/* Modal: Tambah / Edit Roster Level */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Roster Kerja Level' : 'Edit Roster Kerja Level'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Level Jabatan *"
            value={formData.grade_id}
            onChange={(e) => {
              const gId = e.target.value;
              const selectedGrade = grades.find((g) => String(g.id) === gId);
              setFormData({
                ...formData,
                grade_id: gId,
                level: selectedGrade ? selectedGrade.level : formData.level,
              });
            }}
            options={[
              { value: '', label: '-- Pilih Level Jabatan --' },
              ...grades.map((g) => ({
                value: String(g.id),
                label: `Level ${g.level} - ${g.name} (${g.code})`,
              })),
            ]}
            required
          />

          <Input
            label="Nama Pola Roster *"
            value={formData.roster_name}
            onChange={(e) => setFormData({ ...formData, roster_name: e.target.value })}
            placeholder="Contoh: Roster Operasional 14:7"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Hari Kerja (ON) *"
              type="number"
              min={1}
              max={365}
              value={formData.days_on}
              onChange={(e) => setFormData({ ...formData, days_on: Number(e.target.value) })}
              required
            />
            <Input
              label="Hari Cuti (OFF) *"
              type="number"
              min={1}
              max={365}
              value={formData.days_off}
              onChange={(e) => setFormData({ ...formData, days_off: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Catatan"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Catatan ketentuan rotasi kerja, fasilitas cuti, tiket kepulangan, atau keterangan lainnya..."
          />

          <Select
            label="Status *"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'INACTIVE', label: 'Nonaktif' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Roster' : 'Perbarui Roster'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
