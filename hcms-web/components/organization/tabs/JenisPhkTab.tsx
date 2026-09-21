'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  UserX,
  Scale,
  Download
} from 'lucide-react';
import { TerminationTypeItem } from '@/types';
import { terminationTypeService } from '@/services/masterDataService';
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

interface JenisPhkTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const JenisPhkTab: React.FC<JenisPhkTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<TerminationTypeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterPesangon, setFilterPesangon] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    legal_basis: '',
    pesangon_multiplier: 1.0,
    pmtk_multiplier: 1.0,
    entitled_to_uph: true,
    entitled_to_uang_pisah: false,
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await terminationTypeService.getTerminationTypes({ per_page: 500 });
      if (res.success && res.data) {
        setItems(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load termination types:', err);
      toast.error('Gagal memuat data jenis PHK.', 'Kesalahan Data');
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
      code: '',
      name: '',
      legal_basis: 'PP 35/2021',
      pesangon_multiplier: 1.0,
      pmtk_multiplier: 1.0,
      entitled_to_uph: true,
      entitled_to_uang_pisah: false,
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

  const handleOpenEdit = (item: TerminationTypeItem) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      legal_basis: item.legal_basis || '',
      pesangon_multiplier: Number(item.pesangon_multiplier),
      pmtk_multiplier: Number(item.pmtk_multiplier),
      entitled_to_uph: Boolean(item.entitled_to_uph),
      entitled_to_uang_pisah: Boolean(item.entitled_to_uang_pisah),
      description: item.description || '',
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.warning('Kode dan nama jenis PHK harus diisi.', 'Form Tidak Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const res = await terminationTypeService.createTerminationType(formData);
        if (res.success) {
          toast.success('Jenis PHK berhasil ditambahkan.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      } else {
        const res = await terminationTypeService.updateTerminationType(formData.id, formData);
        if (res.success) {
          toast.success('Jenis PHK berhasil diperbarui.');
          setIsModalOpen(false);
          loadData();
          onRefreshAll?.();
        }
      }
    } catch (err: any) {
      console.error('Error saving termination type:', err);
      const msg = err?.response?.data?.message || err?.message || 'Gagal menyimpan jenis PHK.';
      toast.error(msg, 'Terjadi Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: TerminationTypeItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Jenis PHK',
      message: `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})?`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await terminationTypeService.deleteTerminationType(item.id);
      if (res.success) {
        toast.success('Jenis PHK berhasil dihapus.');
        loadData();
        onRefreshAll?.();
      }
    } catch (err: any) {
      console.error('Error deleting termination type:', err);
      const msg = err?.response?.data?.message || 'Gagal menghapus jenis PHK.';
      toast.error(msg, 'Gagal');
    }
  };

  // Filter items
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.legal_basis && item.legal_basis.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      let matchPesangon = true;
      if (filterPesangon === 'WITH_PESANGON') {
        matchPesangon = Number(item.pesangon_multiplier) > 0;
      } else if (filterPesangon === 'NO_PESANGON') {
        matchPesangon = Number(item.pesangon_multiplier) === 0;
      }

      return matchSearch && matchPesangon;
    });
  }, [items, search, filterPesangon]);

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
  } = useClientTable(filteredData, { defaultSortField: 'code', defaultSortOrder: 'asc' });

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      toast.info('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['Kode', 'Nama Jenis PHK', 'Dasar Hukum (PP/UU)', 'Faktor Pesangon (x)', 'Faktor PMTK (x)', 'Hak UPH', 'Hak Uang Pisah', 'Status', 'Keterangan'];
    const rows = filteredData.map((item) => [
      `"${item.code}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.legal_basis || '').replace(/"/g, '""')}"`,
      item.pesangon_multiplier,
      item.pmtk_multiplier,
      item.entitled_to_uph ? 'Ya' : 'Tidak',
      item.entitled_to_uang_pisah ? 'Ya' : 'Tidak',
      item.status,
      `"${(item.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `jenis_phk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV berhasil diunduh.');
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
              placeholder="Cari kode, jenis PHK, dasar pasal PP 35/2021..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 text-sm w-full"
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={filterPesangon}
              onChange={(e) => setFilterPesangon(e.target.value)}
              options={[
                { value: 'ALL', label: 'Semua Ketentuan Hak' },
                { value: 'WITH_PESANGON', label: 'Berhak Uang Pesangon' },
                { value: 'NO_PESANGON', label: 'Tanpa Uang Pesangon' },
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
                    field="code"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Kode
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">
                  <SortableHeader
                    field="name"
                    currentField={sortField}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  >
                    Alasan & Jenis PHK
                  </SortableHeader>
                </th>
                <th className="py-3.5 px-4">Dasar Hukum</th>
                <th className="py-3.5 px-4 text-center">Pesangon (UP)</th>
                <th className="py-3.5 px-4 text-center">Penghargaan (PMTK)</th>
                <th className="py-3.5 px-4 text-center">Hak Lainnya</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-44" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-20 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <UserX className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium text-gray-600">Tidak ada data jenis PHK ditemukan</p>
                    <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: TerminationTypeItem, index: number) => {
                  const itemNumber = (currentPage - 1) * perPage + index + 1;
                  const pesangonMult = Number(item.pesangon_multiplier);
                  const pmtkMult = Number(item.pmtk_multiplier);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                        {itemNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-gray-800 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.legal_basis ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Scale className="h-3 w-3 text-slate-500" />
                            {item.legal_basis}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${pesangonMult > 0
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          {pesangonMult > 0 ? `${pesangonMult}x Upah` : '0x (Nihil)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${pmtkMult > 0
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                          {pmtkMult > 0 ? `${pmtkMult}x PMTK` : '0x (Nihil)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.entitled_to_uph && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded" title="Berhak Uang Penggantian Hak (UPH)">
                              UPH
                            </span>
                          )}
                          {item.entitled_to_uang_pisah && (
                            <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded" title="Berhak Uang Pisah Sesuai PP/PKB">
                              Uang Pisah
                            </span>
                          )}
                          {!item.entitled_to_uph && !item.entitled_to_uang_pisah && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
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
                            title="Edit Jenis PHK"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                            title="Hapus Jenis PHK"
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
        title={modalMode === 'create' ? 'Tambah Jenis PHK' : 'Edit Jenis PHK'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kode Jenis PHK <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Contoh: PHK_EFISIENSI"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Dasar Regulasi (Pasal)
              </label>
              <Input
                placeholder="Contoh: PP 35/2021 Pasal 43 (1)"
                value={formData.legal_basis}
                onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama / Alasan PHK <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Efisiensi Karena Perusahaan Merugi"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Faktor Pengali Pesangon (x UP) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.25"
                min="0"
                required
                value={formData.pesangon_multiplier}
                onChange={(e) => setFormData({ ...formData, pesangon_multiplier: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-[11px] text-gray-400 mt-1">Misal: 1 untuk 1x ketentuan UP, 0.5 untuk 0.5x UP</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Faktor Pengali PMTK (Masa Kerja) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                step="0.25"
                min="0"
                required
                value={formData.pmtk_multiplier}
                onChange={(e) => setFormData({ ...formData, pmtk_multiplier: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-[11px] text-gray-400 mt-1">Standar: 1x penghargaan masa kerja</p>
            </div>
          </div>

          {/* Entitlement Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entitled_to_uph}
                onChange={(e) => setFormData({ ...formData, entitled_to_uph: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Berhak UPH (Cuti & Pulang)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.entitled_to_uang_pisah}
                onChange={(e) => setFormData({ ...formData, entitled_to_uang_pisah: e.target.checked })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
              />
              <span className="text-xs text-gray-800 font-semibold">
                Berhak Uang Pisah (PKB)
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Keterangan Tambahan
              </label>
              <Input
                placeholder="Penjelasan ketentuan..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Jenis PHK' : 'Perbarui Jenis PHK'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
