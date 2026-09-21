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
  Repeat
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
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama hari libur, tanggal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 text-sm w-full"
            />
          </div>

          <div className="w-full sm:w-36">
            <Select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Tahun' },
                { value: '2025', label: 'Tahun 2025' },
                { value: '2026', label: 'Tahun 2026' },
                { value: '2027', label: 'Tahun 2027' },
              ]}
              className="text-sm"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Kategori' },
                { value: 'HARI_LIBUR_NASIONAL', label: 'Libur Nasional' },
                { value: 'CUTI_BERSAMA', label: 'Cuti Bersama' },
                { value: 'LIBUR_KHUSUS_SITE', label: 'Libur Khusus Site' },
              ]}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 border-gray-200"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 border-gray-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="holiday_date"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Tanggal
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Nama Hari Libur
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="type"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Kategori
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4 text-center">Berulang</th>
                <th className="py-3.5 px-4">Keterangan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
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
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <CalendarCheck className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">Tidak ada data tanggal merah ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: PublicHolidayItem, index: number) => {
                  const itemNumber = (currentPage - 1) * perPage + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                        {itemNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-rose-500 shrink-0" />
                          <div>
                            <div className="text-sm font-semibold">{formatDisplayDate(item.holiday_date)}</div>
                            <div className="text-xs text-gray-400 font-mono">{item.holiday_date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-800">{item.name}</span>
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
                          <span className="text-xs text-gray-400">Tidak</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 max-w-xs truncate">
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
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                            title="Edit Hari Libur"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
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

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Hari Libur / Tanggal Merah' : 'Edit Hari Libur / Tanggal Merah'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tanggal Libur <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.holiday_date}
                onChange={(e) => {
                  const val = e.target.value;
                  const yr = val ? new Date(val).getFullYear() : formData.year;
                  setFormData({ ...formData, holiday_date: val, year: yr });
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Tahun <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Hari Libur <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Tahun Baru Imlek 2577 Kongzili"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kategori Libur <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                options={[
                  { value: 'HARI_LIBUR_NASIONAL', label: 'Libur Nasional' },
                  { value: 'CUTI_BERSAMA', label: 'Cuti BersAMA' },
                  { value: 'LIBUR_KHUSUS_SITE', label: 'Libur Khusus Site' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
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
                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
              />
              <span className="text-xs text-gray-700 font-medium">
                Berulang Setiap Tahun (Recurring Annual)
              </span>
            </label>
            <p className="text-[11px] text-gray-400 mt-0.5 ml-6">
              Centang jika libur ini terjadi pada tanggal masehi yang sama setiap tahun (misal: Hari Kemerdekaan 17 Agustus).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Keterangan / Dasar Keputusan
            </label>
            <textarea
              rows={3}
              className="w-full text-xs rounded-lg border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 placeholder-gray-400"
              placeholder="SKB 3 Menteri atau Surat Keputusan Site..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Hari Libur' : 'Perbarui Hari Libur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
