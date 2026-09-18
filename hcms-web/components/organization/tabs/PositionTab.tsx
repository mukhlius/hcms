'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  Edit,
  Power,
  Trash2,
  Snowflake,
  Users,
  ShieldCheck,
  AlertCircle,
  Network,
  Building2,
  MapPin,
  Layers,
  Download
} from 'lucide-react';
import { PositionItem, HeadcountSummary, MasterSite, MasterDepartment, MasterSection } from '@/types';
import { positionService, siteService, departmentService, sectionService, jobGradeService, importExportService } from '@/services/masterDataService';
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

interface PositionTabProps {
  selectedCompanyId?: string;
  selectedSiteId?: string;
  selectedDepartmentId?: string;
  selectedSectionId?: string;
  onRefreshAll?: () => void;
  createTrigger?: number;
}

export const PositionTab: React.FC<PositionTabProps> = ({
  selectedCompanyId,
  selectedSiteId,
  selectedDepartmentId,
  selectedSectionId,
  onRefreshAll,
  createTrigger,
}) => {
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [allPositionsForReportsTo, setAllPositionsForReportsTo] = useState<PositionItem[]>([]);
  const [summary, setSummary] = useState<HeadcountSummary | null>(null);
  const [sites, setSites] = useState<MasterSite[]>([]);
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [sections, setSections] = useState<MasterSection[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    site_id: selectedSiteId || '',
    department_id: selectedDepartmentId || '',
    section_id: selectedSectionId || '',
    grade_id: '',
    code: '',
    title: '',
    reports_to_position_id: '',
    approved_headcount: 1,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [posRes, sumRes, siteRes, deptRes, secRes, gradeRes] = await Promise.all([
        positionService.getPositions({
          search: search || undefined,
          company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
          site_id: selectedSiteId ? parseInt(selectedSiteId) : undefined,
          department_id: selectedDepartmentId ? parseInt(selectedDepartmentId) : undefined,
          section_id: selectedSectionId ? parseInt(selectedSectionId) : undefined,
          per_page: 100,
        }),
        positionService.getSummary(),
        siteService.getSites(),
        departmentService.getDepartments({ per_page: 200 }),
        sectionService.getSections({ per_page: 200 }),
        jobGradeService.getGrades(),
      ]);

      if (posRes.success && posRes.data) {
        setPositions(posRes.data.data || []);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (siteRes.success && siteRes.data) {
        setSites(siteRes.data.data || []);
      }
      if (deptRes.success && deptRes.data) {
        setDepartments(deptRes.data.data || []);
      }
      if (secRes.success && secRes.data) {
        setSections(secRes.data.data || []);
      }
      if (gradeRes.success && gradeRes.data) {
        setGrades(gradeRes.data || []);
      }

      // Also fetch un-filtered positions for "Reports To" dropdown list
      const allPos = await positionService.getPositions({ per_page: 500 });
      if (allPos.success && allPos.data) {
        setAllPositionsForReportsTo(allPos.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load positions data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCompanyId, selectedSiteId, selectedDepartmentId, selectedSectionId]);

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
    paginatedData: paginatedPositions,
  } = useClientTable(positions, {
    defaultSortField: 'code',
    defaultPerPage: 10,
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const initialSiteId = selectedSiteId || (sites[0]?.id ? String(sites[0].id) : '');
    const matchingDepts = initialSiteId
      ? departments.filter((d) => !d.site_id || String(d.site_id) === initialSiteId)
      : departments;
    const initialDeptId =
      selectedDepartmentId && matchingDepts.some((d) => String(d.id) === selectedDepartmentId)
        ? selectedDepartmentId
        : '';
    const matchingSections = initialDeptId
      ? sections.filter((s) => String(s.department_id) === initialDeptId)
      : [];
    const initialSectionId =
      selectedSectionId && matchingSections.some((s) => String(s.id) === selectedSectionId)
        ? selectedSectionId
        : '';

    setFormData({
      id: 0,
      site_id: initialSiteId,
      department_id: initialDeptId,
      section_id: initialSectionId,
      grade_id: '',
      code: '',
      title: '',
      reports_to_position_id: '',
      approved_headcount: 1,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleOpenCreate();
    }
  }, [createTrigger]);

  const handleOpenEdit = (pos: PositionItem) => {
    setModalMode('edit');
    setFormData({
      id: pos.id,
      site_id: pos.site_id ? String(pos.site_id) : '',
      department_id: pos.department_id ? String(pos.department_id) : '',
      section_id: pos.section_id ? String(pos.section_id) : '',
      grade_id: pos.grade_id ? String(pos.grade_id) : '',
      code: pos.code,
      title: pos.title,
      reports_to_position_id: pos.reports_to_position_id ? String(pos.reports_to_position_id) : '',
      approved_headcount: pos.approved_headcount,
      status: pos.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleFreeze = async (pos: PositionItem) => {
    try {
      await positionService.toggleFreeze(pos.id);
      toast.success(
        `Posisi "${pos.title}" berhasil ${pos.is_frozen ? 'dicairkan' : 'dibekukan'}.`,
        'Status Formasi Diperbarui'
      );
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status pembekuan posisi.', 'Gagal');
    }
  };

  const handleToggleStatus = async (pos: PositionItem) => {
    try {
      if (pos.status === 'ACTIVE') {
        await positionService.deactivatePosition(pos.id);
        toast.success(`Posisi "${pos.title}" dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await positionService.activatePosition(pos.id);
        toast.success(`Posisi "${pos.title}" diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status posisi.', 'Gagal');
    }
  };

  const handleDelete = async (pos: PositionItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Posisi Jabatan',
      message: `Apakah Anda yakin ingin menghapus posisi "${pos.title}" (${pos.code})? Formasi yang masih memiliki pegawai aktif tidak dapat dihapus.`,
      confirmText: 'Ya, Hapus Posisi',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await positionService.deletePosition(pos.id);
      toast.success(`Posisi "${pos.title}" berhasil dihapus.`, 'Berhasil Dihapus');
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus posisi jabatan.', 'Gagal Menghapus');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload: any = {
        site_id: formData.site_id ? parseInt(formData.site_id) : null,
        department_id: parseInt(formData.department_id),
        section_id: formData.section_id ? parseInt(formData.section_id) : null,
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
        code: formData.code,
        title: formData.title,
        reports_to_position_id: formData.reports_to_position_id ? parseInt(formData.reports_to_position_id) : null,
        approved_headcount: formData.approved_headcount,
        status: formData.status,
      };

      if (modalMode === 'create') {
        await positionService.createPosition(payload);
        toast.success(`Posisi jabatan "${formData.title}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await positionService.updatePosition(formData.id, payload);
        toast.success(`Posisi jabatan "${formData.title}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan posisi jabatan.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Cascading Department options based on selected Site
  const filteredDepartments = formData.site_id
    ? departments.filter((d) => !d.site_id || String(d.site_id) === formData.site_id)
    : [];

  // 2. Cascading Section options based on selected Department
  const filteredSections = formData.department_id
    ? sections.filter((s) => String(s.department_id) === formData.department_id)
    : [];

  // 3. Filtered Reports To (Atasan Langsung) options based on Grade/Level, Section, Department
  const currentGrade = grades.find((g) => String(g.id) === formData.grade_id);
  const currentLevel = currentGrade?.level;

  const filteredReportsToPositions = React.useMemo(() => {
    if (!formData.grade_id || !currentLevel) {
      return [];
    }

    // Level 1 is top management (e.g. Project Manager) -> no supervisor above
    if (currentLevel <= 1) {
      return [];
    }

    return allPositionsForReportsTo.filter((p) => {
      // Exclude self
      if (formData.id && p.id === formData.id) return false;

      // Must have a grade with a level strictly higher in hierarchy (numeric level is smaller)
      const targetLevel = p.grade?.level;
      if (!targetLevel || targetLevel >= currentLevel) return false;

      // Department condition:
      // Must be same department OR top management / project leadership (targetLevel <= 2, e.g. PM / DPM)
      const isSameDept = formData.department_id
        ? p.department_id === parseInt(formData.department_id)
        : true;
      const isTopLeadership = targetLevel <= 2;

      if (!isSameDept && !isTopLeadership) return false;

      // Section condition:
      if (formData.section_id) {
        // Position in the same section
        const isSameSec = p.section_id === parseInt(formData.section_id);
        // OR Department Head / leadership level in the same department (targetLevel < 4 or no section)
        const isDeptLeader = isSameDept && (targetLevel < 4 || !p.section_id);

        return isSameSec || isDeptLeader || isTopLeadership;
      }

      // If no section selected (directly under department):
      return isSameDept || isTopLeadership;
    });
  }, [allPositionsForReportsTo, formData.id, formData.grade_id, currentLevel, formData.department_id, formData.section_id]);

  // If editing and has existing reports_to not in filtered list, preserve it
  const currentReportsToObj = formData.reports_to_position_id
    ? allPositionsForReportsTo.find((p) => String(p.id) === formData.reports_to_position_id)
    : null;

  const reportsToOptions = [
    { value: '', label: '-- Pucuk Pimpinan / Tidak Ada Atasan Langsung --' },
    ...(currentReportsToObj && !filteredReportsToPositions.some((p) => p.id === currentReportsToObj.id)
      ? [{
          value: String(currentReportsToObj.id),
          label: `${currentReportsToObj.code} - ${currentReportsToObj.title} (Atasan Saat Ini)`,
        }]
      : []),
    ...filteredReportsToPositions.map((p) => ({
      value: String(p.id),
      label: `${p.code} - ${p.title} (Level ${p.grade?.level || '-'} - ${p.grade?.code || ''}${p.section?.name ? ` | Seksi: ${p.section.name}` : ''})`,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Headcount KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-slate-500 font-medium">Total Formasi</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{summary.total_positions}</div>
          </Card>
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-indigo-600 font-medium">MPP (Approved)</span>
            <div className="text-xl font-bold text-indigo-700 mt-1">{summary.approved_headcount}</div>
          </Card>
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-emerald-600 font-medium">Terisi (Filled)</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{summary.current_headcount}</div>
          </Card>
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-amber-600 font-medium">Lowong (Vacant)</span>
            <div className="text-xl font-bold text-amber-700 mt-1">{summary.vacant_headcount}</div>
          </Card>
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-rose-600 font-medium">Dibekukan</span>
            <div className="text-xl font-bold text-rose-700 mt-1">{summary.frozen_positions}</div>
          </Card>
          <Card className="p-3 bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[11px] text-blue-600 font-medium">Okupansi Formasi</span>
            <div className="text-xl font-bold text-blue-700 mt-1">{summary.occupancy_rate}%</div>
          </Card>
        </div>
      )}

      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode atau nama posisi jabatan..."
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
            onClick={() => window.open(importExportService.getExportUrl('positions'), '_blank')}
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

      {/* Positions Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada posisi jabatan ditemukan.
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
                    <SortableHeader label="Nama Position" field="title" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Site" field="site.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Departemen" field="department.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Section" field="section.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Level" field="grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Atasan Langsung" field="reports_to.title" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="MPP" field="approved_headcount" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Status" field="status" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPositions.map((pos) => {
                  const isVacant = pos.approved_headcount > pos.current_headcount;
                  const siteName = pos.site?.name || '-';
                  const deptName = pos.department?.name || (pos.organization_unit?.name ?? '-');
                  const sectionName = pos.section?.name || '-';
                  const reportsToTitle = pos.reportsTo?.title || pos.reports_to?.title || <span className="text-slate-400">Pucuk Pimpinan</span>;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <span>{pos.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div>{pos.title}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{siteName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Network className="h-3 w-3 text-purple-500 shrink-0" />
                          <span className="font-medium text-slate-800">{deptName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>{sectionName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        {pos.grade ? (
                          <Badge variant="neutral">{pos.grade.code} {pos.grade.name ? `(${pos.grade.name})` : ''}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {reportsToTitle}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 font-semibold ${isVacant ? 'text-amber-600' : 'text-emerald-600'}`}>
                          <span>{pos.current_headcount}</span>
                          <span className="text-slate-400 font-normal">/</span>
                          <span>{pos.approved_headcount}</span>
                          {isVacant && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold ml-1">LOWONG</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          {pos.is_frozen && (
                            <Badge variant="warning">BEKU</Badge>
                          )}
                          <Badge variant={pos.status === 'ACTIVE' ? 'success' : 'neutral'}>
                            {pos.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFreeze(pos)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            title={pos.is_frozen ? 'Cairkan Posisi' : 'Bekukan Posisi'}
                          >
                            <Snowflake className={`h-3.5 w-3.5 ${pos.is_frozen ? 'text-indigo-600' : 'text-slate-400'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(pos)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Posisi"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(pos)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            title={pos.status === 'ACTIVE' ? 'Nonaktifkan Posisi' : 'Aktifkan Posisi'}
                          >
                            <Power className={`h-3.5 w-3.5 ${pos.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pos)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus Posisi"
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
          itemLabel="posisi jabatan"
          onPageChange={setCurrentPage}
          onPerPageChange={handlePerPageChange}
        />
      </Card>

      {/* Form Modal: Site, Departemen, Section, Level, Kode, Nama Position, Atasan Langsung, MPP, Status */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Data Position' : 'Ubah Data Position'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Site & 2. Departemen (Bertahap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="1. Site Tambang *"
              value={formData.site_id}
              onChange={(e) => {
                const newSiteId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  site_id: newSiteId,
                  department_id: '',
                  section_id: '',
                  reports_to_position_id: '',
                }));
              }}
              options={[
                { value: '', label: '-- Pilih Site Tambang --' },
                ...sites.map((s) => ({ value: String(s.id), label: `${s.code} - ${s.name}` })),
              ]}
              required
            />
            <Select
              label="2. Departemen *"
              value={formData.department_id}
              disabled={!formData.site_id}
              onChange={(e) => {
                const newDeptId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  department_id: newDeptId,
                  section_id: '',
                  reports_to_position_id: '',
                }));
              }}
              options={[
                {
                  value: '',
                  label: !formData.site_id
                    ? '-- Pilih Site Terlebih Dahulu --'
                    : '-- Pilih Departemen --',
                },
                ...filteredDepartments.map((d) => ({
                  value: String(d.id),
                  label: `${d.code} - ${d.name}`,
                })),
              ]}
              required
            />
          </div>

          {/* 3. Section & 4. Level (Bertahap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="3. Section (Seksi)"
              value={formData.section_id}
              disabled={!formData.department_id}
              onChange={(e) => {
                const newSecId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  section_id: newSecId,
                  reports_to_position_id: '',
                }));
              }}
              options={[
                {
                  value: '',
                  label: !formData.department_id
                    ? '-- Pilih Departemen Terlebih Dahulu --'
                    : '-- Tanpa Seksi (Langsung di bawah Dept) --',
                },
                ...filteredSections.map((s) => ({
                  value: String(s.id),
                  label: `${s.code} - ${s.name}`,
                })),
              ]}
            />
            <Select
              label="4. Level / Grade *"
              value={formData.grade_id}
              onChange={(e) => {
                const newGradeId = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  grade_id: newGradeId,
                  reports_to_position_id: '',
                }));
              }}
              options={[
                { value: '', label: '-- Pilih Level / Grade --' },
                ...grades.map((g) => ({
                  value: String(g.id),
                  label: `${g.code} (Level ${g.level}) - ${g.name}`,
                })),
              ]}
              required
            />
          </div>

          {/* 5. Kode & 6. Nama Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="5. Kode Position *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: POS-MIN-ENG-01"
              required
              disabled={modalMode === 'edit'}
            />
            <Input
              label="6. Nama Position *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Senior Mining Engineer"
              required
            />
          </div>

          {/* 7. Atasan Langsung (Difilter sesuai Level & Struktur) */}
          <Select
            label="7. Atasan Langsung (Reports To)"
            value={formData.reports_to_position_id}
            disabled={!formData.grade_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, reports_to_position_id: e.target.value }))}
            options={
              !formData.grade_id
                ? [{ value: '', label: '-- Pilih Level / Grade Terlebih Dahulu --' }]
                : reportsToOptions
            }
          />

          {/* 8. MPP & 9. Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="8. MPP (Manpower Planning / Kuota) *"
              type="number"
              min="1"
              value={String(formData.approved_headcount)}
              onChange={(e) => setFormData({ ...formData, approved_headcount: parseInt(e.target.value) || 1 })}
              required
            />
            <Select
              label="9. Status *"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Non-Aktif' },
              ]}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Position' : 'Perbarui Position'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
