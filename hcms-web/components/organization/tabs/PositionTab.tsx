'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  Download,
  Edit,
  Power,
  Trash2,
  Snowflake,
  Users,
  ShieldCheck,
  AlertCircle,
  Network,
  Building2
} from 'lucide-react';
import { PositionItem, HeadcountSummary, OrganizationUnitNode } from '@/types';
import { positionService, organizationUnitService, jobGradeService, importExportService } from '@/services/masterDataService';
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
  const [summary, setSummary] = useState<HeadcountSummary | null>(null);
  const [units, setUnits] = useState<OrganizationUnitNode[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Priority unit filter: section first, then department
  const activeUnitId = selectedSectionId || selectedDepartmentId || '';

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    title: '',
    short_title: '',
    organization_unit_id: activeUnitId,
    grade_id: '',
    reports_to_position_id: '',
    approved_headcount: 1,
    current_headcount: 0,
    is_frozen: false,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [posRes, sumRes, unitRes, gradeRes] = await Promise.all([
        positionService.getPositions({
          search: search || undefined,
          company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
          site_id: selectedSiteId ? parseInt(selectedSiteId) : undefined,
          organization_unit_id: activeUnitId ? parseInt(activeUnitId) : undefined,
          per_page: 100,
        }),
        positionService.getSummary({
          organization_unit_id: activeUnitId ? parseInt(activeUnitId) : undefined,
        }),
        organizationUnitService.getUnits({ per_page: 200 }),
        jobGradeService.getGrades(),
      ]);

      if (posRes.success && posRes.data) {
        setPositions(posRes.data.data || []);
      }
      if (sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
      }
      if (unitRes.success && unitRes.data) {
        setUnits(unitRes.data.data || []);
      }
      if (gradeRes.success && gradeRes.data) {
        setGrades(gradeRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load positions data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCompanyId, selectedSiteId, activeUnitId]);

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
    setFormData({
      id: 0,
      code: '',
      title: '',
      short_title: '',
      organization_unit_id: activeUnitId || (units[0]?.id ? String(units[0].id) : ''),
      grade_id: grades[0]?.id ? String(grades[0].id) : '',
      reports_to_position_id: '',
      approved_headcount: 1,
      current_headcount: 0,
      is_frozen: false,
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
      code: pos.code,
      title: pos.title,
      short_title: pos.short_title || '',
      organization_unit_id: String(pos.organization_unit_id),
      grade_id: pos.grade_id ? String(pos.grade_id) : '',
      reports_to_position_id: pos.reports_to_position_id ? String(pos.reports_to_position_id) : '',
      approved_headcount: pos.approved_headcount,
      current_headcount: pos.current_headcount,
      is_frozen: pos.is_frozen,
      status: pos.status,
    });
    setIsModalOpen(true);
  };

  const handleToggleFreeze = async (pos: PositionItem) => {
    try {
      await positionService.toggleFreeze(pos.id);
      toast.success(`Status pembekuan posisi "${pos.title}" berhasil diubah.`, 'Status Diperbarui');
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
        toast.success(`Posisi "${pos.title}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await positionService.activatePosition(pos.id);
        toast.success(`Posisi "${pos.title}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status aktif posisi.', 'Gagal');
    }
  };

  const handleDelete = async (pos: PositionItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Jabatan & Posisi',
      message: `Apakah Anda yakin ingin menghapus posisi "${pos.title}" (${pos.code})? Data akan dipindahkan ke Tempat Sampah dan dapat dipulihkan sewaktu-waktu.`,
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
        code: formData.code,
        title: formData.title,
        short_title: formData.short_title || null,
        organization_unit_id: parseInt(formData.organization_unit_id),
        grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
        reports_to_position_id: formData.reports_to_position_id ? parseInt(formData.reports_to_position_id) : null,
        approved_headcount: Number(formData.approved_headcount),
        current_headcount: Number(formData.current_headcount),
        is_frozen: formData.is_frozen,
        status: formData.status,
      };

      if (modalMode === 'create') {
        await positionService.createPosition(payload);
        toast.success(`Posisi "${formData.title}" berhasil dibuat.`, 'Berhasil Disimpan');
      } else {
        await positionService.updatePosition(formData.id, payload);
        toast.success(`Posisi "${formData.title}" berhasil diperbarui.`, 'Berhasil Diperbarui');
      }
      setIsModalOpen(false);
      await loadData();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan posisi.', 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Headcount KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">MPP</div>
              <div className="text-xl font-bold text-slate-900">{summary.approved_headcount}</div>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Personel Terisi (Filled)</div>
              <div className="text-xl font-bold text-emerald-600">{summary.current_headcount}</div>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Formasi Lowong (Vacant)</div>
              <div className="text-xl font-bold text-amber-600">{summary.vacant_headcount}</div>
            </div>
          </Card>

          <Card className="p-3.5 flex items-center gap-3 shadow-xs">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Snowflake className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Posisi Dibekukan (Frozen)</div>
              <div className="text-xl font-bold text-indigo-600">{summary.frozen_positions}</div>
            </div>
          </Card>
        </div>
      )}

      {/* Action Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode atau judul jabatan..."
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

      {/* Positions List */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Tidak ada posisi jabatan ditemukan untuk filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader label="Kode Posisi" field="code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Judul Jabatan" field="title" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Unit Organisasi" field="organization_unit.name" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Grade / Jenjang" field="grade.code" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader label="Melapor Ke" field="reports_to.title" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader label="Headcount (MPP)" field="approved_headcount" align="center" currentField={sortField} sortOrder={sortOrder} onSort={handleSort} />
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
                        {pos.short_title && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            ({pos.short_title})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Network className="h-3 w-3 text-slate-400" />
                          <span className="font-medium">{pos.organization_unit?.name || `Unit #${pos.organization_unit_id}`}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        {pos.grade ? (
                          <Badge variant="neutral">{pos.grade.code}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {pos.reports_to ? pos.reports_to.title : <span className="text-slate-400">Pucuk Tertinggi</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 font-medium ${isVacant ? 'text-amber-600' : 'text-emerald-600'}`}>
                          <span>{pos.current_headcount}</span>
                          <span className="text-slate-400">/</span>
                          <span>{pos.approved_headcount}</span>
                          {isVacant && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-semibold">LOWONG</span>}
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
                            title={pos.is_frozen ? 'Cairkan Posisi' : 'Bekukan Posisi (Freeze)'}
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

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tambah Posisi Jabatan Baru' : 'Ubah Data Posisi Jabatan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Unit Organisasi (Dept/Seksi) *"
              value={formData.organization_unit_id}
              onChange={(e) => setFormData({ ...formData, organization_unit_id: e.target.value })}
              options={units.map((u) => ({ value: String(u.id), label: `${u.code} - ${u.name} (${u.type})` }))}
              required
            />
            <Select
              label="Grade / Tingkatan"
              value={formData.grade_id}
              onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
              options={[
                { value: '', label: '-- Tanpa Grade --' },
                ...grades.map((g) => ({ value: String(g.id), label: `${g.code} - ${g.name}` })),
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kode Posisi *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CONTOH: POS-SRV-01"
              required
              disabled={modalMode === 'edit'}
            />
            <Input
              label="Judul Singkat (Akronim)"
              value={formData.short_title}
              onChange={(e) => setFormData({ ...formData, short_title: e.target.value })}
              placeholder="Sr Surveyor"
            />
          </div>

          <Input
            label="Judul Posisi Jabatan *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Senior Mine Surveyor"
            required
          />

          <Select
            label="Melapor Ke Posisi Atasan (Reports To)"
            value={formData.reports_to_position_id}
            onChange={(e) => setFormData({ ...formData, reports_to_position_id: e.target.value })}
            options={[
              { value: '', label: '-- Pucuk Pimpinan / Tidak Ada Atasan --' },
              ...positions
                .filter((p) => p.id !== formData.id)
                .map((p) => ({ value: String(p.id), label: `${p.code} - ${p.title}` })),
            ]}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="MPP"
              type="number"
              min="1"
              value={String(formData.approved_headcount)}
              onChange={(e) => setFormData({ ...formData, approved_headcount: parseInt(e.target.value) || 1 })}
              required
            />
            <Input
              label="Jumlah Terisi Saat Ini"
              type="number"
              min="0"
              value={String(formData.current_headcount)}
              onChange={(e) => setFormData({ ...formData, current_headcount: parseInt(e.target.value) || 0 })}
            />
            <Select
              label="Status Operasional"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Non-Aktif' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={submitting}>
              {modalMode === 'create' ? 'Simpan Posisi' : 'Perbarui Posisi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
