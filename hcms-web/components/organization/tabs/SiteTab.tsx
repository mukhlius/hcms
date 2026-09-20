'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  RefreshCw, 
  Download, 
  Edit, 
  Power, 
  Trash2, 
  Network,
  Building2
} from 'lucide-react';
import { MasterSite, MasterCompany } from '@/types';
import { siteService, importExportService } from '@/services/masterDataService';
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

interface SiteTabProps {
  companies: MasterCompany[];
  selectedCompanyId: string;
  onDrillDownToDepartment?: (siteId: number) => void;
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const SiteTab: React.FC<SiteTabProps> = ({
  companies,
  selectedCompanyId,
  onDrillDownToDepartment,
  onRefreshAll,
  createTrigger,
}) => {
  const [sites, setSites] = useState<MasterSite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    company_id: selectedCompanyId || (companies[0]?.id ? String(companies[0].id) : ''),
    code: '',
    name: '',
    short_name: '',
    site_type: 'MINING_SITE' as any,
    description: '',
    location: '',
    address: '',
    city: '',
    province: 'Kalimantan Timur',
    country: 'ID',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await siteService.getSites({
        company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        search,
      });
      if (res.success && res.data) {
        setSites(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, search]);

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
    paginatedData: paginatedSites,
  } = useClientTable(sites, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      company_id: selectedCompanyId || (companies[0]?.id ? String(companies[0].id) : ''),
      code: '',
      name: '',
      short_name: '',
      site_type: 'MINING_SITE',
      description: '',
      location: '',
      address: '',
      city: '',
      province: 'Kalimantan Timur',
      country: 'ID',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (site: MasterSite) => {
    setModalMode('edit');
    setFormData({
      id: site.id,
      company_id: String(site.company_id),
      code: site.code,
      name: site.name,
      short_name: site.short_name || '',
      site_type: site.site_type,
      description: site.description || '',
      location: site.location || '',
      address: site.address || '',
      city: site.city || '',
      province: site.province || '',
      country: site.country || 'ID',
      status: site.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (site: MasterSite) => {
    try {
      if (site.status === 'ACTIVE') {
        await siteService.deactivateSite(site.id);
        toast.success(`Site "${site.name}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await siteService.activateSite(site.id);
        toast.success(`Site "${site.name}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status site.', 'Gagal');
    }
  };

  const handleDelete = async (site: MasterSite) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Site Tambang',
      message: `Apakah Anda yakin ingin menghapus site "${site.name}" (${site.code})? Data akan dipindahkan ke Tempat Sampah dan dapat dipulihkan sewaktu-waktu.`,
      confirmText: 'Ya, Hapus Site',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await siteService.deleteSite(site.id);
      toast.success(`Site "${site.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus site.', 'Gagal Menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        ...formData,
        company_id: parseInt(formData.company_id),
      };
      if (modalMode === 'create') {
        await siteService.createSite(payload);
        toast.success(`Site "${formData.name}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await siteService.updateSite(formData.id, payload);
        toast.success(`Site "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data site.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const getSiteTypeBadge = (type: string) => {
    switch (type) {
      case 'MINING_SITE':
        return <Badge variant="primary">PIT / TAMBANG</Badge>;
      case 'HEAD_OFFICE':
        return <Badge variant="info">KANTOR PUSAT</Badge>;
      case 'BRANCH_OFFICE':
        return <Badge variant="neutral">KANTOR CABANG</Badge>;
      case 'WAREHOUSE':
        return <Badge variant="warning">LOGISTIK / GUDANG</Badge>;
      case 'REMOTE_CAMP':
        return <Badge variant="neutral">MESS / KAMP</Badge>;
      case 'PROJECT_SITE':
        return <Badge variant="info">PROYEK / EKSPLORASI</Badge>;
      default:
        return <Badge>{type}</Badge>;
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
              placeholder="Cari kode site, nama singkat, nama lengkap, atau alamat..."
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
            onClick={() => window.open(importExportService.getExportUrl('sites'), '_blank')}
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

      {/* Sites List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sites.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada data site ditemukan untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode Site" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Singkat Site" field="short_name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Lengkap Site" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Alamat" field="address" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Status" field="status" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Total Departemen" field="departments_count" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSites.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <span>{s.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {s.short_name || '-'}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={s.address || '-'}>
                      {s.address || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {s.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (s.departments_count ?? 0) > 0
                          ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Network className="h-3 w-3 text-purple-500" />
                        <span className="font-semibold">{s.departments_count ?? 0}</span>
                        <span>Departemen</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Site"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(s)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          title={s.status === 'ACTIVE' ? 'Nonaktifkan Site' : 'Aktifkan Site'}
                        >
                          <Power className={`h-3.5 w-3.5 ${s.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Site"
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
          itemLabel="site"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Site Operasional Baru' : 'Ubah Data Site Operasional'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {companies.length > 1 && (
            <Select
              label="Perusahaan Induk *"
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              options={companies.map((c) => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))}
              required
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="1. Kode Site *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: BMO, LATI, SMR"
              required
              disabled={modalMode === 'edit'}
            />
            <Input
              label="2. Nama Singkat Site"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="Binungan"
            />
          </div>

          <Input
            label="3. Nama Lengkap Site *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mining Site Binungan Blok 7"
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              4. Alamat
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Masukkan alamat lengkap site / area operasional..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Select
            label="5. Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'INACTIVE', label: 'Non-Aktif' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Site' : 'Perbarui Site'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
