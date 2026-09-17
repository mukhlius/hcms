'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Network, 
  Building2, 
  FolderTree, 
  RefreshCw,
  Plus,
  ArrowRight
} from 'lucide-react';
import { MasterCompany, OrganizationUnitNode } from '@/types';
import { companyService, organizationUnitService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { OrgTreeTab } from '@/components/organization/tabs/OrgTreeTab';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

function OrganizationStructureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // If someone lands here with legacy tabs (company, site, department, section, position), redirect them to Referensi Organisasi
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['company', 'site', 'department', 'section', 'position'].includes(tabParam)) {
      router.replace(`/admin/organization/references?${searchParams.toString()}`);
    }
  }, [searchParams, router]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('company_id') || '');
  const [companies, setCompanies] = useState<MasterCompany[]>([]);
  const [allUnits, setAllUnits] = useState<OrganizationUnitNode[]>([]);
  const [treeData, setTreeData] = useState<OrganizationUnitNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, unitRes, treeRes] = await Promise.all([
        companyService.getCompanies({ per_page: 100 }),
        organizationUnitService.getUnits({ per_page: 500 }),
        organizationUnitService.getTree({
          company_id: selectedCompanyId ? parseInt(selectedCompanyId) : undefined,
        }),
      ]);

      if (compRes.success && compRes.data) {
        setCompanies(compRes.data.data || []);
      }
      if (unitRes.success && unitRes.data) {
        setAllUnits(unitRes.data.data || []);
      }
      if (treeRes.success && treeRes.data) {
        setTreeData(treeRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load organization structure data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    const params = new URLSearchParams(window.location.search);
    if (companyId) {
      params.set('company_id', companyId);
    } else {
      params.delete('company_id');
    }
    router.replace(`/admin/organization?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Struktur Organisasi"
          subtitle="Bagan Visual Pohon Hierarki & Struktur Relasi Organisasi Perusahaan (Holding > Site Tambang > Departemen > Seksi Kerja)."
          breadcrumbs={[
            { label: 'Beranda', href: '/' },
            { label: 'Struktur Organisasi' },
          ]}
        />
        <div className="shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/organization/references')}
            leftIcon={<Building2 className="h-4 w-4 text-blue-600" />}
            rightIcon={<ArrowRight className="h-3.5 w-3.5 text-slate-400" />}
          >
            Kelola Referensi Organisasi
          </Button>
        </div>
      </div>

      {/* Filter / Scope Toolbar */}
      <Card className="p-3.5 bg-white border-slate-200/90 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>Filter Entitas Perusahaan:</span>
            </div>
            <div className="w-64">
              <Select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="text-xs"
              >
                <option value="">-- Semua Perusahaan (Global) --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </Select>
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
              Segarkan Bagan
            </Button>
          </div>
        </div>
      </Card>

      {/* Visual Hierarchy Tree */}
      <div className="pt-1">
        <OrgTreeTab
          treeData={treeData}
          flatUnits={allUnits}
          companies={companies}
          selectedCompanyId={selectedCompanyId}
          loading={loading}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}

export default function OrganizationPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <OrganizationStructureContent />
    </Suspense>
  );
}
