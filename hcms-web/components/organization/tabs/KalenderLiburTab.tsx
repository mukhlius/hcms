'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CalendarCheck,
  CalendarDays,
  Download,
  Repeat,
  Filter,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { PublicHolidayItem } from '@/types';
import { publicHolidayService } from '@/services/masterDataService';
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

interface KalenderLiburTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const KalenderLiburTab: React.FC<KalenderLiburTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<PublicHolidayItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    holiday_date: new Date().toISOString().split('T')[0],
    name: '',
    type: 'HARI_LIBUR_NASIONAL' as 'HARI_LIBUR_NASIONAL' | 'CUTI_BERSAMA' | 'LIBUR_KHUSUS_SITE',
    year: new Date().getFullYear(),
    is_recurring: false,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await publicHolidayService.getPublicHolidays({ per_page: 500 });
      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load public holidays:', err);
      toast.error('Gagal memuat data kalender tanggal merah.', 'Kesalahan Data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    const curYear = new Date().getFullYear();
    setModalMode('create');
    setFormData({
      id: 0,
      holiday_date: `${curYear}-01-01`,
      name: '',
      type: 'HARI_LIBUR_NASIONAL',
      year: curYear,
      is_recurring: false,
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

  const handleOpenEdit = (item: PublicHolidayItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      holiday_date: item.holiday_date,
      name: item.name,
      type: item.type,
      year: item.year,
      is_recurring: Boolean(item.is_recurring),
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.holiday_date) {
      toast.warning('Nama libur dan tanggal harus diisi.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await publicHolidayService.createPublicHoliday(formData);
        if (res.success) {
          toast.success('Hari libur berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await publicHolidayService.updatePublicHoliday(formData.id, formData);
        if (res.success) {
          toast.success('Hari libur berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Error saving public holiday:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan hari libur.';
      toast.error(msg, 'Terjadi Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: PublicHolidayItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Hari Libur',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.holiday_date})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await publicHolidayService.deletePublicHoliday(item.id);
      if (res.success) {
        toast.success('Hari libur berhasil dihapus.');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Error deleting public holiday:', err);
      const msg = err?.response?.data?.message || 'Gagal menghapus hari libur.';
      toast.error(msg, 'Gagal');
    }
  };

  // Filter items
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.holiday_date.includes(search) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchYear = filterYear === 'ALL' || item.year.toString() === filterYear;
      const matchType = filterType === 'ALL' || item.type === filterType;

      return matchSearch && matchYear && matchType;
    });
  }, [items, search, filterYear, filterType]);

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
  } = useClientTable(filteredData, { defaultSortField: 'holiday_date', defaultSortOrder: 'asc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.info('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['Tanggal', 'Nama Libur', 'Tipe', 'Tahun', 'Berulang', 'Status', 'Keterangan'];
    const rows = filteredData.map((item) => [
      `"${item.holiday_date}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      item.year,
      item.is_recurring ? 'Ya' : 'Tidak',
      item.status,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kalender_libur_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh.');
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar / Filter Component */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-slate-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama hari libur, tanggal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="relative w-36">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2025">Tahun 2025</option>
              <option value="2026">Tahun 2026</option>
              <option value="2027">Tahun 2027</option>
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative w-44">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full h-9 pl-8 pr-7 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="HARI_LIBUR_NASIONAL">Libur Nasional</option>
              <option value="CUTI_BERSAMA">Cuti Bersama</option>
              <option value="LIBUR_KHUSUS_SITE">Libur Khusus Site</option>
            </select>
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          {(search || filterYear !== '2026' || filterType !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setFilterYear('2026');
                setFilterType('ALL');
              }}
              className="h-9 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200"
              title="Reset Filter"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

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

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Tanggal" field="holiday_date" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Hari Libur" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Kategori" field="type" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">Berulang</th>
                <th className="px-4 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">Tidak ada data tanggal merah ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: PublicHolidayItem, index: number) => {
                  const itemNumber = (currentPage - 1) * perPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-mono">
                        {itemNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-rose-500 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold">{formatDisplayDate(item.holiday_date)}</div>
                            <div className="text-xs text-slate-400 font-mono">{item.holiday_date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === 'HARI_LIBUR_NASIONAL' && (
                          <Badge variant="danger" className="text-xs font-semibold px-2 py-0.5">
                            Libur Nasional
                          </Badge>
                        )}
                        {item.type === 'CUTI_BERSAMA' && (
                          <Badge variant="warning" className="text-xs font-semibold px-2 py-0.5">
                            Cuti Bersama
                          </Badge>
                        )}
                        {item.type === 'LIBUR_KHUSUS_SITE' && (
                          <Badge variant="info" className="text-xs font-semibold px-2 py-0.5">
                            Libur Khusus Site
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.is_recurring ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Repeat className="h-3 w-3" />
                            Ya
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Tidak</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Badge
                          variant={item.status === 'ACTIVE' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-slate-200"
                            title="Edit Hari Libur"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200"
                            title="Hapus Hari Libur"
                          >
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

        {/* Pagination */}
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

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Hari Libur Baru' : 'Edit Data Hari Libur'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Hari Libur / Cuti Bersama *"
            placeholder="Contoh: Hari Raya Idul Fitri 1447 H"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Tanggal Libur *"
              type="date"
              value={formData.holiday_date}
              onChange={(e) => {
                const dateVal = e.target.value;
                const yearVal = dateVal ? parseInt(dateVal.split('-')[0]) || formData.year : formData.year;
                setFormData({
                  ...formData,
                  holiday_date: dateVal,
                  year: yearVal,
                });
              }}
              required
            />

            <Input
              label="Tahun Kalender *"
              type="number"
              min={2020}
              max={2035}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Kategori / Tipe Libur *"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'HARI_LIBUR_NASIONAL', label: 'Hari Libur Nasional' },
                { value: 'CUTI_BERSAMA', label: 'Cuti Bersama' },
                { value: 'LIBUR_KHUSUS_SITE', label: 'Libur Khusus Site / Tambang' },
              ]}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status *
              </label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                options={[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'INACTIVE', label: 'Nonaktif' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-xs text-slate-700 font-medium">
                Berulang Setiap Tahun (Recurring Annual)
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5 ml-6">
              Centang jika libur ini terjadi pada tanggal masehi yang sama setiap tahun (misal: Hari Kemerdekaan 17 Agustus).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Dasar Keputusan
            </label>
            <textarea
              rows={3}
              className="w-full text-xs rounded-lg border-slate-300 shadow-xs focus:border-blue-600 focus:ring-blue-600 placeholder-slate-400"
              placeholder="SKB 3 Menteri atau Surat Keputusan Site..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
              {modalMode === 'create' ? 'Simpan Hari Libur' : 'Perbarui Hari Libur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
