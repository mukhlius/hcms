'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  Download, 
  Edit, 
  Power, 
  Trash2, 
  ArrowRight,
  MapPin
} from 'lucide-react';
import { MasterCompany } from '@/types';
import { companyService, importExportService } from '@/services/masterDataService';
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

interface CompanyTabProps {
  onDrillDownToSite: (companyId: number) => void;
  onRefreshAll?: () => void;
  onCompaniesLoaded?: (companies: MasterCompany[]) => void;
  createTrigger?: number;
}

export const CompanyTab: React.FC<CompanyTabProps> = ({ onDrillDownToSite, onRefreshAll, onCompaniesLoaded, createTrigger }) => {
  const [companies, setCompanies] = useState<MasterCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    short_name: '',
    name: '',
    tax_identifier: '',
    address: '',
    legal_name: '',
    description: '',
    country: 'ID',
    currency: 'IDR',
    timezone: 'Asia/Makassar',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await companyService.getCompanies({ search, per_page: 50 });
      if (res.success && res.data) {
        const loaded = res.data.data || [];
        setCompanies(loaded);
        onCompaniesLoaded?.(loaded);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

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
    paginatedData: paginatedCompanies,
  } = useClientTable(companies, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      code: '',
      short_name: '',
      name: '',
      tax_identifier: '',
      address: '',
      legal_name: '',
      description: '',
      country: 'ID',
      currency: 'IDR',
      timezone: 'Asia/Makassar',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (comp: MasterCompany) => {
    setModalMode('edit');
    setFormData({
      id: comp.id,
      code: comp.code,
      short_name: comp.short_name || '',
      name: comp.name,
      tax_identifier: comp.tax_identifier || '',
      address: comp.address || '',
      legal_name: comp.legal_name || '',
      description: comp.description || '',
      country: comp.country || 'ID',
      currency: comp.currency || 'IDR',
      timezone: comp.timezone || 'Asia/Makassar',
      status: comp.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (comp: MasterCompany) => {
    try {
      if (comp.status === 'ACTIVE') {
        await companyService.deactivateCompany(comp.id);
        toast.success(`Perusahaan "${comp.name}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await companyService.activateCompany(comp.id);
        toast.success(`Perusahaan "${comp.name}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status perusahaan.', 'Gagal');
    }
  };

  const handleDelete = async (comp: MasterCompany) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Data Perusahaan',
      message: `Apakah Anda yakin ingin menghapus perusahaan "${comp.name}" (${comp.code})? Data akan dipindahkan ke Tempat Sampah dan dapat dipulihkan sewaktu-waktu.`,
      confirmText: 'Ya, Hapus Perusahaan',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await companyService.deleteCompany(comp.id);
      toast.success(`Perusahaan "${comp.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus perusahaan.', 'Gagal Menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await companyService.createCompany(formData);
        toast.success(`Perusahaan "${formData.name}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await companyService.updateCompany(formData.id, formData);
        toast.success(`Perusahaan "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perusahaan.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode, nama singkat, nama perusahaan, NPWP, alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<Download className="h-3.5 w-3.5" />} 
            onClick={() => window.open(importExportService.getExportUrl('companies'), '_blank')}
          >
            Ekspor CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />} 
            onClick={loadData} 
            isLoading={loading}
          >
            Segarkan
          </Button>
        </div>
      </Card>

      {/* Companies List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada data perusahaan ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Singkat" field="short_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Perusahaan" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="NPWP" field="tax_identifier" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Alamat" field="address" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Status" field="status" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">Navigasi Site</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                        <span>{c.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {c.short_name || '-'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{c.tax_identifier || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={c.address || '-'}>
                      {c.address || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {c.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onDrillDownToSite(c.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer"
                        title={`Buka daftar Site untuk ${c.name}`}
                      >
                        <MapPin className="h-3 w-3" />
                        <span>Lihat Site</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(c)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Perusahaan"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          title={c.status === 'ACTIVE' ? 'Nonaktifkan Perusahaan' : 'Aktifkan Perusahaan'}
                        >
                          <Power className={`h-3.5 w-3.5 ${c.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Perusahaan"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="perusahaan"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Badan Hukum Perusahaan' : 'Ubah Data Perusahaan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="1. Kode Perusahaan *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: BC, KPC"
              required
              disabled={modalMode === 'edit'}
            />
            <Input
              label="2. Nama Singkat"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="Berau Coal"
            />
          </div>

          <Input
            label="3. Nama Perusahaan *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PT Berau Coal Energy Tbk"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="4. NPWP"
              value={formData.tax_identifier}
              onChange={(e) => setFormData({ ...formData, tax_identifier: e.target.value })}
              placeholder="01.234.567.8-901.000"
            />
            <Select
              label="6. Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Non-Aktif' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              5. Alamat
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Masukkan alamat lengkap kantor / kantor pusat perusahaan..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Perusahaan' : 'Perbarui Perusahaan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
