'use client';

import React from 'react';
import { 
  Building2, 
  MapPin, 
  Network, 
  Layers, 
  RotateCcw
} from 'lucide-react';
import { MasterCompany, MasterSite, OrganizationUnitNode } from '@/types';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface HierarchyFilterBarProps {
  companies: MasterCompany[];
  sites: MasterSite[];
  departments: OrganizationUnitNode[];
  sections: OrganizationUnitNode[];
  selectedCompanyId: string;
  selectedSiteId: string;
  selectedDepartmentId: string;
  selectedSectionId: string;
  onSelectCompany: (id: string) => void;
  onSelectSite: (id: string) => void;
  onSelectDepartment: (id: string) => void;
  onSelectSection: (id: string) => void;
  onResetFilters: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const HierarchyFilterBar: React.FC<HierarchyFilterBarProps> = ({
  companies,
  sites,
  departments,
  sections,
  selectedCompanyId,
  selectedSiteId,
  selectedDepartmentId,
  selectedSectionId,
  onSelectCompany,
  onSelectSite,
  onSelectDepartment,
  onSelectSection,
  onResetFilters,
}) => {
  // Filtered dropdown lists based on cascading hierarchy
  const availableSites = selectedCompanyId
    ? sites.filter((s) => String(s.company_id) === selectedCompanyId)
    : sites;

  const availableDepartments = departments.filter((d) => {
    if (selectedCompanyId && String(d.company_id) !== selectedCompanyId) return false;
    if (selectedSiteId && d.site_id && String(d.site_id) !== selectedSiteId) return false;
    return true;
  });

  const availableSections = sections.filter((s) => {
    if (selectedDepartmentId) return String(s.parent_id) === selectedDepartmentId;
    if (selectedCompanyId && String(s.company_id) !== selectedCompanyId) return false;
    if (selectedSiteId && s.site_id && String(s.site_id) !== selectedSiteId) return false;
    return true;
  });

  const hasActiveFilter = Boolean(
    selectedCompanyId || selectedSiteId || selectedDepartmentId || selectedSectionId
  );

  return (
    <Card className="p-4 space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Filter 1: Site Tambang */}
        <Select
          value={selectedSiteId}
          onChange={(e) => {
            onSelectSite(e.target.value);
            onSelectDepartment('');
            onSelectSection('');
          }}
          leftIcon={<MapPin className="h-4 w-4" />}
          aria-label="Filter Site Tambang"
        >
          <option value="">Semua Site Tambang</option>
          {availableSites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </option>
          ))}
        </Select>

        {/* Filter 3: Departemen */}
        <Select
          value={selectedDepartmentId}
          onChange={(e) => {
            onSelectDepartment(e.target.value);
            onSelectSection('');
          }}
          leftIcon={<Network className="h-4 w-4" />}
          aria-label="Filter Departemen"
        >
          <option value="">Semua Departemen</option>
          {availableDepartments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.code} - {d.name}
            </option>
          ))}
        </Select>

        {/* Filter 4: Seksi Kerja */}
        <Select
          value={selectedSectionId}
          onChange={(e) => onSelectSection(e.target.value)}
          leftIcon={<Layers className="h-4 w-4" />}
          aria-label="Filter Seksi Kerja"
        >
          <option value="">Semua Seksi Kerja</option>
          {availableSections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </option>
          ))}
        </Select>
      </div>

      {hasActiveFilter && (
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <span className="text-[11px] text-slate-400">
            Filter aktif diterapkan pada tampilan data organisasi.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="h-3.5 w-3.5 text-slate-400" />}
            className="text-xs text-slate-600 hover:text-rose-600 h-7 px-2"
          >
            Reset Filter
          </Button>
        </div>
      )}
    </Card>
  );
};
