'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Compass,
  Plane,
  Clock,
  MapPin,
  Download
} from 'lucide-react';
import { ReferenceItem } from '@/types';
import { referenceDataService, importExportService } from '@/services/masterDataService';
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

interface PohTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const PohTab: React.FC<PohTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // 4 Specific Fields as requested:
  // 1. Kode, 2. Nama POH, 3. Nama Bandara Tujuan, 4. Tambahan Hari Perjalanan Cuti
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    destination_airport: '',
    additional_travel_days: '2',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await referenceDataService.getStandard('POH');
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load POH references:', err);
      toast.error('Gagal memuat data Point of Hire (POH).', 'Kesalahan Data');
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
      code: 'POH-',
      name: '',
      destination_airport: '',
      additional_travel_days: '2',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (item: ReferenceItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      destination_airport: item.metadata?.destination_airport || '',
      additional_travel_days: item.metadata?.additional_travel_days !== undefined ? String(item.metadata.additional_travel_days) : '2',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama POH wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: 'POH',
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        metadata: {
          destination_airport: formData.destination_airport.trim(),
          additional_travel_days: parseInt(formData.additional_travel_days) || 0,
        },
        status: 'ACTIVE',
      };

      if (modalMode === 'create') {
        const res = await referenceDataService.createStandard(payload);
        if (res.success) {
          toast.success(`Point of Hire "${formData.name}" berhasil dibuat.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      } else {
        const res = await referenceDataService.updateStandard(formData.id, payload);
        if (res.success) {
          toast.success(`Point of Hire "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Gagal menyimpan POH.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ReferenceItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Point of Hire (POH)',
      message: `Apakah Anda yakin ingin menghapus POH "${item.name}" (${item.code})? Personel atau tiket cuti yang menggunakan POH ini dapat terpengaruh.`,
      confirmText: 'Ya, Hapus POH',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await referenceDataService.deleteStandard(item.id);
      if (res.success) {
        toast.success(`POH "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus POH.', 'Gagal Dihapus');
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const airport = (item.metadata?.destination_airport || '').toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      airport.includes(q)
    );
  });

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
    paginatedData: paginatedPohItems,
  } = useClientTable(filteredItems, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama POH, atau nama bandara tujuan..."
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5" />}
            onClick={() => window.open(importExportService.getExportUrl('poh'), '_blank')}
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

      {/* Table Card - strictly showing the 4 requested fields */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama POH" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Bandara Tujuan" field="metadata.destination_airport" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Tambahan Hari Cuti" field="metadata.additional_travel_days" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-64" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-24 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    <Compass className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data Point of Hire ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan data POH atau bersihkan filter pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedPohItems.map((item) => {
                  const airport = item.metadata?.destination_airport || '-';
                  const travelDays = item.metadata?.additional_travel_days !== undefined ? item.metadata.additional_travel_days : 0;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Kode */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        <Badge variant="outline" className="font-mono bg-slate-50 text-slate-800 border-slate-300">
                          {item.code}
                        </Badge>
                      </td>

                      {/* 2. Nama POH */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* 3. Nama Bandara Tujuan */}
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        <div className="flex items-center gap-2">
                          <Plane className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                          <span>{airport}</span>
                        </div>
                      </td>

                      {/* 4. Tambahan Hari Perjalanan Cuti */}
                      <td className="px-4 py-3.5 text-center font-mono">
                        <Badge 
                          variant="outline" 
                          className={
                            travelDays > 0 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-mono inline-flex items-center gap-1 font-semibold' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 font-mono inline-flex items-center gap-1'
                          }
                        >
                          <Clock className="h-3 w-3" />
                          {travelDays > 0 ? `+${travelDays} Hari Perjalanan` : '0 Hari (Lokal)'}
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
                            title="Edit POH"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus POH"
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
          itemLabel="POH"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal strictly with the 4 requested fields */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Point of Hire (POH)' : 'Edit Point of Hire (POH)'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Kode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              1. Kode POH <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Contoh: POH-JKT, POH-BPN, POH-LOCAL"
              required
              className="font-mono uppercase text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan awalan POH diikuti singkatan kota atau LOCAL untuk ring 1 tambang.
            </p>
          </div>

          {/* 2. Nama POH */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Nama POH (Titik Penerimaan) <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Jakarta, Balikpapan, Surabaya, Site Tambang"
              required
              className="text-xs"
            />
          </div>

          {/* 3. Nama Bandara Tujuan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Nama Bandara Tujuan
            </label>
            <div className="relative">
              <Plane className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={formData.destination_airport}
                onChange={(e) => setFormData({ ...formData, destination_airport: e.target.value })}
                placeholder="Contoh: Bandar Udara Internasional Soekarno-Hatta (CGK)"
                className="pl-9 text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nama bandara kedatangan utama saat karyawan pulang cuti dari site tambang.
            </p>
          </div>

          {/* 4. Tambahan Hari Perjalanan Cuti */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Tambahan Hari Perjalanan Cuti (Hari)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="number"
                min="0"
                max="7"
                value={formData.additional_travel_days}
                onChange={(e) => setFormData({ ...formData, additional_travel_days: e.target.value })}
                placeholder="Contoh: 2"
                className="pl-9 font-mono text-xs pr-12"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400">Hari</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hak kompensasi hari perjalanan agar waktu tempuh PP (pergi-pulang) tidak memotong hak hari cuti lapangan.
            </p>
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
              {modalMode === 'create' ? 'Simpan POH' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
