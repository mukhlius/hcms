'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  Briefcase, 
  ArrowRightLeft, 
  Edit3, 
  Plus, 
  Power, 
  History,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { OrganizationUnitNode, PositionItem } from '@/types';
import { organizationUnitService } from '@/services/masterDataService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/stores/alertStore';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { TablePagination } from '@/components/ui/TablePagination';
import { useClientTable } from '@/hooks/useClientTable';

interface OrganizationUnitDetailProps {
  unitId: number;
  onEditUnit: (unit: OrganizationUnitNode) => void;
  onAddChild: (unit: OrganizationUnitNode) => void;
  onMoveUnit: (unit: OrganizationUnitNode) => void;
  onUnitUpdated: () => void;
}

export const OrganizationUnitDetail: React.FC<OrganizationUnitDetailProps> = ({
  unitId,
  onEditUnit,
  onAddChild,
  onMoveUnit,
  onUnitUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [unit, setUnit] = useState<OrganizationUnitNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'audit'>('positions');

  const positions = unit?.positions || [];
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
  } = useClientTable(positions, { defaultSortField: 'code', defaultPerPage: 10 });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await organizationUnitService.getUnit(unitId);
      if (res.success && res.data) {
        setUnit(res.data.unit);
        setBreadcrumbs(res.data.breadcrumbs || []);
        setAuditTrail(res.data.audit_trail || []);
      }
    } catch (err) {
      console.error('Failed to load unit detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unitId) {
      fetchDetail();
    }
  }, [unitId]);

  const handleToggleStatus = async () => {
    if (!unit) return;
    try {
      setActionLoading(true);
      if (unit.status === 'ACTIVE') {
        await organizationUnitService.deactivateUnit(unit.id);
        toast.success(`Unit "${unit.name}" berhasil dinonaktifkan.`, 'Status Diperbarui');
      } else {
        await organizationUnitService.activateUnit(unit.id);
        toast.success(`Unit "${unit.name}" berhasil diaktifkan.`, 'Status Diperbarui');
      }
      await fetchDetail();
      onUnitUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status unit organisasi.', 'Gagal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </Card>
    );
  }

  if (!unit) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="p-5 border-slate-200">
        {/* Breadcrumb Hierarchy Path */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mb-3 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
              <span className={idx === breadcrumbs.length - 1 ? 'text-blue-700 font-bold' : 'hover:text-slate-700'}>
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{unit.name}</h2>
              <Badge variant={unit.status === 'ACTIVE' ? 'success' : 'danger'}>
                {unit.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">{unit.code}</span>
              <span>•</span>
              <span className="uppercase font-medium text-blue-600">{unit.type.replace('_', ' ')}</span>
              {unit.effective_from && (
                <>
                  <span>•</span>
                  <span>Efektif sejak: {unit.effective_from}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => onEditUnit(unit)}>
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onMoveUnit(unit)}>
              <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Pindah
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAddChild(unit)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Sub-Unit
            </Button>
            <Button 
              size="sm" 
              variant={unit.status === 'ACTIVE' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              isLoading={actionLoading}
            >
              <Power className="h-3.5 w-3.5 mr-1" />
              {unit.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <Building2 className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Perusahaan / Entitas</p>
              <p className="text-slate-800 font-bold text-sm">{unit.company?.name || '-'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <MapPin className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Site Penempatan</p>
              <p className="text-slate-800 font-bold text-sm">{unit.site?.name || 'Seluruh Site / Korporat'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <User className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Pimpinan Unit (Leader)</p>
              <p className="text-slate-800 font-bold text-sm">{unit.leader?.name || 'Belum Ditentukan'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs for Positions and Audit */}
      <Card className="p-5 border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
          <div className="flex gap-4">
            <button
              type="button"
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'positions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('positions')}
            >
              Posisi Jabatan ({unit.positions?.length || 0})
            </button>
            <button
              type="button"
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Trail ({auditTrail.length})
            </button>
          </div>
        </div>

        {activeTab === 'positions' && (
          <div className="space-y-2">
            {(!unit.positions || unit.positions.length === 0) ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                Belum ada posisi jabatan yang terhubung pada unit organisasi ini.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">
                          <SortableHeader field="code" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                            Kode
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5">
                          <SortableHeader field="title" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                            Nama Posisi / Jabatan
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5">
                          <SortableHeader field="grade.code" currentField={sortField} currentOrder={sortOrder} onSort={handleSort}>
                            Grade
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5 text-center">
                          <SortableHeader field="approved_headcount" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                            Approved HC
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5 text-center">
                          <SortableHeader field="current_headcount" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                            Occupied
                          </SortableHeader>
                        </th>
                        <th className="px-4 py-3.5 text-center">
                          <SortableHeader field="vacancy_headcount" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                            Vacancy
                          </SortableHeader>
                        </th>
                        <th className="px-5 py-3.5 text-center">
                          <SortableHeader field="status" currentField={sortField} currentOrder={sortOrder} onSort={handleSort} align="center">
                            Status
                          </SortableHeader>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedPositions.map((pos) => (
                        <tr key={pos.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-slate-800">{pos.code}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{pos.title}</td>
                          <td className="px-4 py-3.5">
                            <span className="bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded font-bold">
                              {pos.grade?.code || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-semibold text-slate-700">{pos.approved_headcount}</td>
                          <td className="px-4 py-3.5 text-center text-emerald-700 font-semibold">{pos.current_headcount}</td>
                          <td className="px-4 py-3.5 text-center">
                            {pos.vacancy_headcount > 0 ? (
                              <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                {pos.vacancy_headcount}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge variant={pos.status === 'ACTIVE' ? 'success' : 'danger'}>
                              {pos.is_frozen ? 'FROZEN' : pos.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  perPage={perPage}
                  totalItems={totalItems}
                  itemLabel="posisi"
                  onPageChange={setCurrentPage}
                  onPerPageChange={handlePerPageChange}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-2">
            {auditTrail.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-sm">
                Belum ada rekam jejak audit untuk unit ini.
              </div>
            ) : (
              <div className="space-y-2">
                {auditTrail.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                    <History className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-slate-400 text-[11px]">{log.created_at}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">
                        Oleh: <span className="font-semibold text-slate-700">{log.actor?.name || 'Sistem'}</span> ({log.ip_address})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
