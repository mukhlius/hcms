'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  RefreshCw, 
  Edit, 
  Power, 
  Trash2, 
  ArrowRight,
  Briefcase,
  Building2,
  Network,
  MapPin,
  Download
} from 'lucide-react';
import { MasterSection, MasterDepartment, MasterCompany, MasterSite } from '@/types';
import { 
  sectionService, 
  companyService, 
  siteService, 
  departmentService, 
  importExportService 
} from '@/services/masterDataService';
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

interface SectionTabProps {
  companies: MasterCompany[];
  sites: MasterSite[];
  departments: MasterDepartment[];
  selectedCompanyId: string;
  selectedSiteId: string;
  selectedDepartmentId: string;
  onDrillDownToPosition: (sectionId: number) => void;
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const SectionTab: React.FC<SectionTabProps> = ({
  companies,
  sites,
  departments,
  selectedCompanyId,
  selectedSiteId,
  selectedDepartmentId,
  onDrillDownToPosition,
  onRefreshAll,
  createTrigger,
}) => {
  const [sections, setSections] = useState<MasterSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Fallback internal states to guarantee options are never empty
  const [internalCompanies, setInternalCompanies] = useState<MasterCompany[]>(companies || []);
  const [internalSites, setInternalSites] = useState<MasterSite[]>(sites || []);
  const [internalDepartments, setInternalDepartments] = useState<MasterDepartment[]>(departments || []);

  useEffect(() => {
    if (companies && companies.length > 0) {
      setInternalCompanies(companies);
    } else {
      companyService.getCompanies({ per_page: 50 }).then((res) => {
        if (res.success && res.data) setInternalCompanies(res.data.data || []);
      }).catch(console.error);
    }
  }, [companies]);

  useEffect(() => {
    if (sites && sites.length > 0) {
      setInternalSites(sites);
    } else {
      siteService.getSites({ per_page: 100 }).then((res) => {
        if (res.success && res.data) setInternalSites(res.data.data || []);
      }).catch(console.error);
    }
  }, [sites]);

  useEffect(() => {
    if (departments && departments.length > 0) {
      setInternalDepartments(departments);
    } else {
      departmentService.getDepartments({ per_page: 100 }).then((res) => {
        if (res.success && res.data) setInternalDepartments(res.data.data || []);
      }).catch(console.error);
    }
  }, [departments]);

  const activeCompanies = internalCompanies.length > 0 ? internalCompanies : companies;
  const activeSites = internalSites.length > 0 ? internalSites : sites;
  const activeDepts = internalDepartments.length > 0 ? internalDepartments : departments;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    company_id: selectedCompanyId || (companies[0]?.id ? String(companies[0].id) : ''),
    site_id: selectedSiteId || '',
    department_id: selectedDepartmentId || '',
    code: '',
    name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sectionService.getSections({
        company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        site_id: selectedSiteId ? parseInt(selectedSiteId) : undefined,
        department_id: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
        search,
        per_page: 100,
      });

      if (res.success && res.data) {
        setSections(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, selectedSiteId, selectedDepartmentId, search]);

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
    paginatedData: paginatedSections,
  } = useClientTable(sections, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const initialCompanyId = selectedCompanyId || (activeCompanies[0]?.id ? String(activeCompanies[0].id) : '');
    const filteredSites = initialCompanyId
      ? activeSites.filter((s) => !s.company_id || String(s.company_id) === initialCompanyId)
      : activeSites;
    const initialSiteId = selectedSiteId || (filteredSites[0]?.id ? String(filteredSites[0].id) : (activeSites[0]?.id ? String(activeSites[0].id) : ''));
    const filteredDepts = initialCompanyId
      ? activeDepts.filter((d) => !d.company_id || String(d.company_id) === initialCompanyId)
      : activeDepts;
    const initialDeptId = selectedDepartmentId || (filteredDepts[0]?.id ? String(filteredDepts[0].id) : (activeDepts[0]?.id ? String(activeDepts[0].id) : ''));

    setFormData({
      id: 0,
      company_id: initialCompanyId,
      site_id: initialSiteId,
      department_id: initialDeptId,
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

  const handleOpenEdit = (sec: MasterSection) => {
    setModalMode('edit');
    const resolvedSiteId = sec.site_id
      ? String(sec.site_id)
      : (sec.department?.site_id ? String(sec.department.site_id) : (activeSites[0]?.id ? String(activeSites[0].id) : ''));

    setFormData({
      id: sec.id,
      company_id: String(sec.company_id || activeCompanies[0]?.id || ''),
      site_id: resolvedSiteId,
      department_id: String(sec.department_id || ''),
      code: sec.code,
      name: sec.name,
      description: sec.description || '',
      status: sec.status,
    });
    setIsModalOpen(true);
  };

  const handleDepartmentChange = (newDeptId: string) => {
    const targetDept = activeDepts.find((d) => String(d.id) === newDeptId);
    let newSiteId = formData.site_id;
    if (targetDept?.site_id && (!newSiteId || newSiteId === '')) {
      newSiteId = String(targetDept.site_id);
    }
    setFormData((prev) => ({
      ...prev,
      department_id: newDeptId,
      site_id: newSiteId,
    }));
  };

  const handleToggleStatus = async (sec: MasterSection) => {
    try {
      if (sec.status === 'ACTIVE') {
        await sectionService.deactivateSection(sec.id);
        toast.success(`Seksi "${sec.name}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await sectionService.activateSection(sec.id);
        toast.success(`Seksi "${sec.name}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status seksi.', 'Gagal');
    }
  };

  const handleDelete = async (sec: MasterSection) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Seksi Kerja',
      message: `Apakah Anda yakin ingin menghapus seksi "${sec.name}" (${sec.code})? Data yang dihapus dapat dipulihkan sewaktu-waktu.`,
      confirmText: 'Ya, Hapus Seksi',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await sectionService.deleteSection(sec.id);
      toast.success(`Seksi "${sec.name}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus seksi.', 'Gagal Menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        company_id: parseInt(formData.company_id),
        department_id: parseInt(formData.department_id),
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
      };

      if (modalMode === 'create') {
        await sectionService.createSection(payload);
        toast.success(`Seksi "${formData.name}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await sectionService.updateSection(formData.id, payload);
        toast.success(`Seksi "${formData.name}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan seksi kerja.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const availableDepts = formData.company_id
    ? activeDepts.filter((d) => !d.company_id || String(d.company_id) === formData.company_id)
    : activeDepts;

  const availableSites = formData.company_id
    ? activeSites.filter((s) => !s.company_id || String(s.company_id) === formData.company_id)
    : activeSites;

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode, nama seksi, atau deskripsi..."
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
            onClick={() => window.open(importExportService.getExportUrl('sections'), '_blank')}
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

      {/* Sections List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : sections.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada data seksi kerja ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode Seksi" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Departemen Induk" field="department.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Perusahaan" field="company.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Site Tambang" field="site.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Nama Seksi" field="name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
                {paginatedSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Layers className="h-3.5 w-3.5" />
                        </div>
                        <span>{sec.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Network className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span>{sec.department?.name || `Dept #${sec.department_id}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{sec.company?.name || `Perusahaan #${sec.company_id}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{sec.site?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      {sec.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate" title={sec.description || '-'}>
                      {sec.description || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={sec.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {sec.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onDrillDownToPosition(sec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors cursor-pointer"
                        title={`Buka Posisi Jabatan untuk Seksi ${sec.name}`}
                      >
                        <Briefcase className="h-3 w-3" />
                        <span>Lihat Jabatan</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(sec)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          title="Edit Seksi"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(sec)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          title={sec.status === 'ACTIVE' ? 'Nonaktifkan Seksi' : 'Aktifkan Seksi'}
                        >
                          <Power className={`h-3.5 w-3.5 ${sec.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(sec)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          title="Hapus Seksi"
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
          itemLabel="seksi"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Seksi Kerja Baru' : 'Ubah Data Seksi Kerja'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Perusahaan Induk & Site Tambang */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Perusahaan Induk *"
              value={formData.company_id}
              onChange={(e) => {
                const newCompId = e.target.value;
                const compSites = activeSites.filter((s) => !s.company_id || String(s.company_id) === newCompId);
                const compDepts = activeDepts.filter((d) => !d.company_id || String(d.company_id) === newCompId);
                setFormData({
                  ...formData,
                  company_id: newCompId,
                  site_id: compSites[0]?.id ? String(compSites[0].id) : '',
                  department_id: compDepts[0]?.id ? String(compDepts[0].id) : '',
                });
              }}
              options={activeCompanies.map((c) => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))}
              required
            />
            <Select
              label="Site Tambang / Fasilitas *"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              options={[
                { value: '', label: '-- Pilih Site Tambang --' },
                ...availableSites.map((s) => ({ value: String(s.id), label: `${s.code} - ${s.name}` })),
              ]}
              required
            />
          </div>

          {/* Row 2: Departemen Induk & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Departemen Induk *"
              value={formData.department_id}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Departemen --' },
                ...availableDepts.map((d) => ({ value: String(d.id), label: `${d.code} - ${d.name}` })),
              ]}
              required
            />
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Non-Aktif' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Seksi *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: SEC-SRV, SEC-GEO"
              required
              disabled={modalMode === 'edit'}
            />
            <Input
              label="Nama Seksi Kerja *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Mine Survey & Drone Mapping Section"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Deskripsi / Catatan
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pengukuran pit, kalkulasi volume batubara, dan pemetaan ortofoto"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Seksi' : 'Perbarui Seksi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
