'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Network, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Power, 
  Trash2, 
  ArrowRight,
  Layers,
  Briefcase,
  Building2,
  MapPin,
  UserCheck,
  Download
} from 'lucide-react';
import { MasterDepartment, MasterCompany, MasterSite } from '@/types';
import { departmentService, importExportService } from '@/services/masterDataService';
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

interface DepartmentTabProps {
  companies: MasterCompany[];
  sites: MasterSite[];
  selectedCompanyId: string;
  selectedSiteId: string;
  onDrillDownToSection: (departmentId: number) => void;
  onDrillDownToPosition: (departmentId: number) => void;
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const DepartmentTab: React.FC<DepartmentTabProps> = ({
  companies,
  sites,
  selectedCompanyId,
  selectedSiteId,
  onDrillDownToSection,
  onDrillDownToPosition,
  onRefreshAll,
  createTrigger,
}) => {
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Determine default company & site (auto-assigned)
  const defaultCompany = companies[0] || null;
  const defaultSite = sites[0] || null;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    company_id: selectedCompanyId || (defaultCompany?.id ? String(defaultCompany.id) : ''),
    site_id: selectedSiteId || (defaultSite?.id ? String(defaultSite.id) : ''),
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await departmentService.getDepartments({
        company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        site_id: selectedSiteId ? parseInt(selectedSiteId) : undefined,
        search,
        per_page: 100,
      });

      if (res.success && res.data) {
        setDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, selectedSiteId, search]);

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
    paginatedData: paginatedDepartments,
  } = useClientTable(departments, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      id: 0,
      company_id: selectedCompanyId || (defaultCompany?.id ? String(defaultCompany.id) : ''),
      site_id: selectedSiteId || (defaultSite?.id ? String(defaultSite.id) : ''),
      code: '',
      name: '',
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

  const handleOpenEdit = (dept: MasterDepartment) => {
    setModalMode('edit');
    setFormData({
      id: dept.id,
      company_id: String(dept.company_id || defaultCompany?.id || ''),
      site_id: String(dept.site_id || defaultSite?.id || ''),
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      status: dept.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (dept: MasterDepartment) => {
    try {
      if (dept.status === 'ACTIVE') {
        await departmentService.deactivateDepartment(dept.id);
        toast.success(`Departemen "${dept.name}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await departmentService.activateDepartment(dept.id);
        toast.success(`Departemen "${dept.name}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status departemen.', 'Gagal');
    }
  };

  const handleDelete = async (dept: MasterDepartment) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Departemen',
      message: `Apakah Anda yakin ingin menghapus departemen "${dept.name}" (${dept.code})? Data yang memiliki seksi (section) tidak dapat dihapus.`,
      confirmText: 'Ya, Hapus Departemen',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await departmentService.deleteDepartment(dept.id);
      toast.success(`Departemen "${dept.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus departemen.', 'Gagal Menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        company_id: parseInt(formData.company_id),
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
      };

      if (modalMode === 'create') {
        await departmentService.createDepartment(payload);
        toast.success(`Departemen "${formData.name}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await departmentService.updateDepartment(formData.id, payload);
        toast.success(`Departemen "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan departemen.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const availableSites = formData.company_id
    ? sites.filter((s) => String(s.company_id) === formData.company_id)
    : sites;

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode, nama departemen, atau deskripsi..."
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
            onClick={() => window.open(importExportService.getExportUrl('departments'), '_blank')}
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

      {/* Departments List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada data departemen ditemukan.
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
                    <SortableHeader label="Perusahaan Induk" field="company.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Site" field="site.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Departemen" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Deskripsi" field="description" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Status" field="status" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">Navigasi Lanjut</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDepartments.map((dept) => {
                  const companyName = dept.company?.name || (defaultCompany?.name ?? `ID #${dept.company_id}`);
                  const siteName = dept.site?.name || (defaultSite?.name ?? '-');

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Network className="h-3.5 w-3.5" />
                          </div>
                          <span>{dept.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">{companyName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{siteName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={dept.description || '-'}>
                        {dept.description || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={dept.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {dept.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onDrillDownToSection(dept.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors cursor-pointer"
                            title={`Buka Seksi untuk ${dept.name}`}
                          >
                            <Layers className="h-3 w-3" />
                            <span>Lihat Seksi</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDrillDownToPosition(dept.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                            title={`Buka Jabatan untuk ${dept.name}`}
                          >
                            <Briefcase className="h-3 w-3" />
                            <span>Jabatan</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenEdit(dept)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Departemen"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(dept)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            title={dept.status === 'ACTIVE' ? 'Nonaktifkan Departemen' : 'Aktifkan Departemen'}
                          >
                            <Power className={`h-3.5 w-3.5 ${dept.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dept)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Departemen"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="departemen"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Departemen Baru' : 'Ubah Data Departemen'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Otomatis: Perusahaan Induk & Pilihan Site Operasional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 flex flex-col justify-center">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Perusahaan Induk (Otomatis)
              </label>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{defaultCompany?.name || 'Perusahaan Utama'}</span>
              </div>
            </div>

            <Select
              label="Site Operasional"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              options={[
                { value: '', label: '-- Pilih Site Operasional (Opsional) --' },
                ...availableSites.map((s) => ({ value: String(s.id), label: `${s.code} - ${s.name}` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="1. Kode Departemen *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: ENG, PROD, SHE"
              required
              disabled={modalMode === 'edit'}
            />
            <Select
              label="4. Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Non-Aktif' },
              ]}
            />
          </div>

          <Input
            label="2. Nama Departemen *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Mining Engineering & Technical Support"
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              3. Deskripsi
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Fungsi dan ruang lingkup kerja departemen..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Departemen' : 'Perbarui Departemen'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
