'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  HardHat,
  Building,
  Wrench,
  ShieldAlert,
  MapPin
} from 'lucide-react';
import { ReferenceItem } from '@/types';
import { referenceDataService } from '@/services/masterDataService';
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

interface WorkAreaTabProps {
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const WorkAreaTab: React.FC<WorkAreaTabProps> = ({ onRefreshAll, createTrigger }) => {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    name: '',
    description: '',
    risk_level: 'SEDANG' as 'RENDAH' | 'SEDANG' | 'TINGGI',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await referenceDataService.getStandard('WORK_AREA');
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to load Work Area references:', err);
      toast.error('Gagal memuat data Area Kerja.', 'Kesalahan Data');
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
      description: '',
      risk_level: 'SEDANG',
      status: 'ACTIVE',
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
      description: item.metadata?.description || '',
      risk_level: item.metadata?.risk_level || 'SEDANG',
      status: (item.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      toast.error('Kode dan nama Area Kerja wajib diisi.', 'Form Belum Lengkap');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        category: 'WORK_AREA',
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        metadata: {
          description: formData.description.trim(),
          risk_level: formData.risk_level,
        },
        status: formData.status,
      };

      if (modalMode === 'create') {
        const res = await referenceDataService.createStandard(payload);
        if (res.success) {
          toast.success(`Area Kerja "${formData.name}" berhasil dibuat.`, 'Berhasil Ditambahkan');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      } else {
        const res = await referenceDataService.updateStandard(formData.id, payload);
        if (res.success) {
          toast.success(`Area Kerja "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
          setIsModalOpen(false);
          loadData();
          if (onRefreshAll) onRefreshAll();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || 'Gagal menyimpan Area Kerja.';
      toast.error(msg, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: ReferenceItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Area Kerja',
      message: `Apakah Anda yakin ingin menghapus Area Kerja "${item.name}" (${item.code})?`,
      confirmText: 'Ya, Hapus Area',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await referenceDataService.deleteStandard(item.id);
      if (res.success) {
        toast.success(`Area Kerja "${item.name}" berhasil dihapus.`, 'Berhasil Dihapus');
        loadData();
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus Area Kerja.', 'Gagal Dihapus');
    }
  };

  const getAreaIcon = (name: string, code: string) => {
    const text = (name + ' ' + code).toLowerCase();
    if (text.includes('lapangan') || text.includes('pit') || text.includes('tambang')) {
      return <HardHat className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
    }
    if (text.includes('workshop') || text.includes('bengkel') || text.includes('maint')) {
      return <Wrench className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
    }
    if (text.includes('office') || text.includes('kantor')) {
      return <Building className="h-3.5 w-3.5 text-indigo-600 shrink-0" />;
    }
    return <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk?.toUpperCase()) {
      case 'TINGGI':
        return <Badge variant="danger" className="text-[10px]">RISIKO TINGGI</Badge>;
      case 'SEDANG':
        return <Badge variant="warning" className="text-[10px]">RISIKO SEDANG</Badge>;
      case 'RENDAH':
        return <Badge variant="success" className="text-[10px]">RISIKO RENDAH</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px]">STANDAR</Badge>;
    }
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const desc = (item.metadata?.description || '').toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      desc.includes(q)
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
    paginatedData: paginatedWorkAreas,
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
              placeholder="Cari kode, nama area kerja, atau deskripsi..."
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

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">
                  <SortableHeader label="Kode Area" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Nama Area Kerja" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5">
                  <SortableHeader label="Keterangan / Fungsi" field="metadata.description" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Tingkat Risiko K3" field="metadata.risk_level" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-4 py-3.5 text-center">
                  <SortableHeader label="Status" field="status" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-64" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-24 mx-auto rounded-full" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-full" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-6 w-14 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <HardHat className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data Area Kerja ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Silakan tambahkan data area kerja (misal: Lapangan, Office, Workshop).</p>
                  </td>
                </tr>
              ) : (
                paginatedWorkAreas.map((item) => {
                  const desc = item.metadata?.description || '-';
                  const riskLevel = item.metadata?.risk_level || 'SEDANG';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kode */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        <Badge variant="outline" className="font-mono bg-slate-50 text-slate-800 border-slate-300">
                          {item.code}
                        </Badge>
                      </td>

                      {/* Nama Area Kerja */}
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {getAreaIcon(item.name, item.code)}
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <span>{desc}</span>
                      </td>

                      {/* Tingkat Risiko K3 */}
                      <td className="px-4 py-3.5 text-center">
                        {getRiskBadge(riskLevel)}
                      </td>

                      {/* Status */}
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
                            title="Edit Area Kerja"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Area Kerja"
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
          itemLabel="area kerja"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Area Kerja Baru' : 'Edit Data Area Kerja'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kode Area Kerja <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Contoh: LAPANGAN, OFFICE, WORKSHOP, PORT"
              required
              className="font-mono uppercase text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kode unik pengelompokan lingkungan operasional personel.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Area Kerja <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Lapangan, Office, Workshop"
              required
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Fungsi Area
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Area operasional penambangan dan pit aktif"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Risiko K3
              </label>
              <select
                value={formData.risk_level}
                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as any })}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
              >
                <option value="RENDAH">Rendah (Office / Admin)</option>
                <option value="SEDANG">Sedang (Workshop / Facility)</option>
                <option value="TINGGI">Tinggi (Pit / Lapangan Tambang)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Operasional
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 font-medium"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif</option>
              </select>
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
              {modalMode === 'create' ? 'Simpan Area' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
