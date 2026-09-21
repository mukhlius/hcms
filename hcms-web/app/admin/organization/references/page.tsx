'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Layers,
  Briefcase,
  Network,
  Award,
  Compass,
  ShieldCheck,
  FileSignature,
  CalendarDays,
  Clock,
  CalendarCheck,
  Palmtree,
  AlertTriangle,
  UserX,
  LogOut,
  Plus,
  GitMerge
} from 'lucide-react';
import { MasterCompany, MasterSite, MasterDepartment, OrganizationUnitNode } from '@/types';
import {
  companyService,
  siteService,
  departmentService,
  organizationUnitService
} from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { CompanyTab } from '@/components/organization/tabs/CompanyTab';
import { SiteTab } from '@/components/organization/tabs/SiteTab';
import { DepartmentTab } from '@/components/organization/tabs/DepartmentTab';
import { SectionTab } from '@/components/organization/tabs/SectionTab';
import { PositionTab } from '@/components/organization/tabs/PositionTab';
import { LevelTab } from '@/components/organization/tabs/LevelTab';
import { GradeTab } from '@/components/organization/tabs/GradeTab';
import { JenjangTab } from '@/components/organization/tabs/JenjangTab';
import { MasterJenjangTab } from '@/components/organization/tabs/MasterJenjangTab';
import { PohTab } from '@/components/organization/tabs/PohTab';
import { WorkAreaTab } from '@/components/organization/tabs/WorkAreaTab';
import { HubunganKerjaTab } from '@/components/organization/tabs/HubunganKerjaTab';
import { RosterKerjaTab } from '@/components/organization/tabs/RosterKerjaTab';
import { WaktuKerjaTab } from '@/components/organization/tabs/WaktuKerjaTab';
import { KalenderLiburTab } from '@/components/organization/tabs/KalenderLiburTab';
import { DurasiPaidLeaveTab } from '@/components/organization/tabs/DurasiPaidLeaveTab';
import { DurasiSpTab } from '@/components/organization/tabs/DurasiSpTab';
import { JenisPhkTab } from '@/components/organization/tabs/JenisPhkTab';
import { JenisResignTab } from '@/components/organization/tabs/JenisResignTab';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';

type OrgTabType =
  | 'company'
  | 'site'
  | 'department'
  | 'section'
  | 'position'
  | 'level'
  | 'grade'
  | 'master_jenjang'
  | 'jenjang'
  | 'hubungan_kerja'
  | 'poh'
  | 'work_area'
  | 'roster_kerja'
  | 'waktu_kerja'
  | 'kalender_libur'
  | 'durasi_paid_leave'
  | 'durasi_sp'
  | 'jenis_phk'
  | 'jenis_resign';

const validTabs: OrgTabType[] = [
  'company',
  'site',
  'department',
  'section',
  'position',
  'level',
  'grade',
  'master_jenjang',
  'jenjang',
  'hubungan_kerja',
  'poh',
  'work_area',
  'roster_kerja',
  'waktu_kerja',
  'kalender_libur',
  'durasi_paid_leave',
  'durasi_sp',
  'jenis_phk',
  'jenis_resign',
];

function OrganizationReferencesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as OrgTabType | null;
  const [activeTab, setActiveTab] = useState<OrgTabType>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'company'
  );

  // Cascading Filter States
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('company_id') || '');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(searchParams.get('site_id') || '');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(searchParams.get('department_id') || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(searchParams.get('section_id') || '');

  // Metadata Lists & Counts
  const [companies, setCompanies] = useState<MasterCompany[]>([]);
  const [sites, setSites] = useState<MasterSite[]>([]);
  const [departmentsList, setDepartmentsList] = useState<MasterDepartment[]>([]);
  const [allUnits, setAllUnits] = useState<OrganizationUnitNode[]>([]);
  const [counts, setCounts] = useState<{
    companies: number;
    sites: number;
    departments: number;
    sections: number;
    positions: number;
    grades: number;
    salary_grades: number;
    jenjang: number;
    master_jenjang: number;
    employment_types: number;
    marital_statuses: number;
    plafond_pengobatan: number;
    plafond_kacamata: number;
    plafond_persalinan: number;
    poh: number;
    work_area: number;
    roster_kerja: number;
    waktu_kerja: number;
    kalender_libur: number;
    durasi_paid_leave: number;
    durasi_sp: number;
    jenis_phk: number;
    jenis_resign: number;
  }>({
    companies: 0,
    sites: 0,
    departments: 0,
    sections: 0,
    positions: 0,
    grades: 0,
    salary_grades: 0,
    jenjang: 0,
    master_jenjang: 0,
    employment_types: 0,
    marital_statuses: 0,
    plafond_pengobatan: 0,
    plafond_kacamata: 0,
    plafond_persalinan: 0,
    poh: 0,
    work_area: 0,
    roster_kerja: 0,
    waktu_kerja: 0,
    kalender_libur: 0,
    durasi_paid_leave: 0,
    durasi_sp: 0,
    jenis_phk: 0,
    jenis_resign: 0,
  });

  // Sync tab change to URL without full refresh
  const handleTabChange = (newTab: OrgTabType) => {
    setActiveTab(newTab);
    setCreateTriggers({});
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.replace(`/admin/organization/references?${params.toString()}`, { scroll: false });
  };

  // 1. Lightweight single-request badge counts
  const loadCounts = useCallback(async () => {
    try {
      const res = await companyService.getOverviewCounts({
        company_id: selectedCompanyId || undefined,
        site_id: selectedSiteId || undefined,
      });
      if (res.success && res.data) {
        setCounts({
          ...res.data,
          jenjang: res.data.jenjang ?? 0,
          master_jenjang: res.data.master_jenjang ?? 0,
          employment_types: res.data.employment_types ?? 0,
          marital_statuses: res.data.marital_statuses ?? 0,
          plafond_pengobatan: res.data.plafond_pengobatan ?? 0,
          plafond_kacamata: res.data.plafond_kacamata ?? 0,
          plafond_persalinan: res.data.plafond_persalinan ?? 0,
          roster_kerja: res.data.roster_kerja ?? 0,
          waktu_kerja: res.data.waktu_kerja ?? 0,
          kalender_libur: res.data.kalender_libur ?? 0,
          durasi_paid_leave: res.data.durasi_paid_leave ?? 0,
          durasi_sp: res.data.durasi_sp ?? 0,
          jenis_phk: res.data.jenis_phk ?? 0,
          jenis_resign: res.data.jenis_resign ?? 0,
        });
      }
    } catch (err) {
      console.warn('Non-blocking: failed to load overview counts:', err);
    }
  }, [selectedCompanyId, selectedSiteId]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // 2. Lazy load filter options only when navigating to tabs that require cascading filters
  const loadFilterOptions = useCallback(async () => {
    const needsOptions = ['site', 'department', 'section'].includes(activeTab);
    if (!needsOptions) return;

    try {
      const promises: Promise<any>[] = [];
      const fetchSites = sites.length === 0;
      const fetchCompanies = companies.length === 0;
      const fetchDepts = ['section'].includes(activeTab) && departmentsList.length === 0;
      const fetchUnits = ['position'].includes(activeTab) && allUnits.length === 0;

      if (fetchSites) promises.push(siteService.getSites({ per_page: 100 }));
      if (fetchCompanies) promises.push(companyService.getCompanies({ per_page: 50 }));
      if (fetchDepts) promises.push(departmentService.getDepartments({ per_page: 100 }));
      if (fetchUnits) promises.push(organizationUnitService.getUnits({ per_page: 100 }));

      if (promises.length === 0) return;

      const results = await Promise.allSettled(promises);
      let idx = 0;
      if (fetchSites) {
        const r = results[idx++];
        if (r && r.status === 'fulfilled' && r.value?.success && r.value.data) {
          setSites(r.value.data.data || []);
        }
      }
      if (fetchCompanies) {
        const r = results[idx++];
        if (r && r.status === 'fulfilled' && r.value?.success && r.value.data) {
          setCompanies(r.value.data.data || []);
        }
      }
      if (fetchDepts) {
        const r = results[idx++];
        if (r && r.status === 'fulfilled' && r.value?.success && r.value.data) {
          setDepartmentsList(r.value.data.data || []);
        }
      }
      if (fetchUnits) {
        const r = results[idx++];
        if (r && r.status === 'fulfilled' && r.value?.success && r.value.data) {
          setAllUnits(r.value.data.data || []);
        }
      }
    } catch (err) {
      console.warn('Non-blocking: failed to load filter options:', err);
    }
  }, [activeTab, sites.length, companies.length, departmentsList.length, allUnits.length]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Interconnected Drill-Down Handlers
  const handleDrillDownToSite = (companyId: number) => {
    setSelectedCompanyId(String(companyId));
    setSelectedSiteId('');
    setSelectedDepartmentId('');
    setSelectedSectionId('');
    handleTabChange('site');
  };

  const handleDrillDownToDepartment = (siteId: number) => {
    const targetSite = sites.find((s) => s.id === siteId);
    if (targetSite && targetSite.company_id) {
      setSelectedCompanyId(String(targetSite.company_id));
    }
    setSelectedSiteId(String(siteId));
    setSelectedDepartmentId('');
    setSelectedSectionId('');
    handleTabChange('department');
  };

  const handleDrillDownToSection = (departmentId: number) => {
    const targetDept = allUnits.find((u) => u.id === departmentId);
    if (targetDept) {
      if (targetDept.company_id) setSelectedCompanyId(String(targetDept.company_id));
      if (targetDept.site_id) setSelectedSiteId(String(targetDept.site_id));
    }
    setSelectedDepartmentId(String(departmentId));
    setSelectedSectionId('');
    handleTabChange('section');
  };

  const handleDrillDownToPosition = (unitId: number) => {
    const targetUnit = allUnits.find((u) => u.id === unitId);
    if (targetUnit) {
      if (targetUnit.company_id) setSelectedCompanyId(String(targetUnit.company_id));
      if (targetUnit.site_id) setSelectedSiteId(String(targetUnit.site_id));
      if (['SECTION', 'SUB_SECTION', 'OTHER'].includes(targetUnit.type)) {
        setSelectedSectionId(String(unitId));
        if (targetUnit.parent_id) setSelectedDepartmentId(String(targetUnit.parent_id));
      } else {
        setSelectedDepartmentId(String(unitId));
        setSelectedSectionId('');
      }
    }
    handleTabChange('position');
  };

  const handleResetFilters = () => {
    setSelectedCompanyId('');
    setSelectedSiteId('');
    setSelectedDepartmentId('');
    setSelectedSectionId('');
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    router.replace(`/admin/organization/references?${params.toString()}`, { scroll: false });
  };

  const tabsConfig = [
    {
      id: 'company' as OrgTabType,
      label: 'Perusahaan',
      icon: <Building2 className="h-4 w-4 shrink-0" />,
      count: counts.companies,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'site' as OrgTabType,
      label: 'Site',
      icon: <MapPin className="h-4 w-4 shrink-0" />,
      count: counts.sites,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'department' as OrgTabType,
      label: 'Departemen',
      icon: <Network className="h-4 w-4 shrink-0" />,
      count: counts.departments,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'section' as OrgTabType,
      label: 'Section',
      icon: <Layers className="h-4 w-4 shrink-0" />,
      count: counts.sections,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'position' as OrgTabType,
      label: 'Position',
      icon: <Briefcase className="h-4 w-4 shrink-0" />,
      count: counts.positions,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'level' as OrgTabType,
      label: 'Level',
      icon: <Award className="h-4 w-4 shrink-0" />,
      count: counts.grades,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'grade' as OrgTabType,
      label: 'Grade',
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
      count: counts.salary_grades,
      badgeColor: 'bg-cyan-100 text-cyan-800',
    },
    {
      id: 'master_jenjang' as OrgTabType,
      label: 'Master Jenjang',
      icon: <Award className="h-4 w-4 shrink-0" />,
      count: counts.master_jenjang,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'jenjang' as OrgTabType,
      label: 'Jenjang',
      icon: <GitMerge className="h-4 w-4 shrink-0" />,
      count: counts.jenjang,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'hubungan_kerja' as OrgTabType,
      label: 'Hubungan Kerja',
      icon: <FileSignature className="h-4 w-4 shrink-0" />,
      count: counts.employment_types,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'poh' as OrgTabType,
      label: 'POH',
      icon: <Compass className="h-4 w-4 shrink-0" />,
      count: counts.poh,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'work_area' as OrgTabType,
      label: 'Work Area',
      icon: <Layers className="h-4 w-4 shrink-0" />,
      count: counts.work_area,
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'roster_kerja' as OrgTabType,
      label: 'Roster Kerja',
      icon: <CalendarDays className="h-4 w-4 shrink-0" />,
      count: counts.roster_kerja,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'waktu_kerja' as OrgTabType,
      label: 'Waktu Kerja',
      icon: <Clock className="h-4 w-4 shrink-0" />,
      count: counts.waktu_kerja,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'kalender_libur' as OrgTabType,
      label: 'Kalender Libur',
      icon: <CalendarCheck className="h-4 w-4 shrink-0" />,
      count: counts.kalender_libur,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'durasi_paid_leave' as OrgTabType,
      label: 'Durasi Paid Leave',
      icon: <Palmtree className="h-4 w-4 shrink-0" />,
      count: counts.durasi_paid_leave,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'durasi_sp' as OrgTabType,
      label: 'Durasi SP',
      icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
      count: counts.durasi_sp,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'jenis_phk' as OrgTabType,
      label: 'Jenis PHK',
      icon: <UserX className="h-4 w-4 shrink-0" />,
      count: counts.jenis_phk,
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'jenis_resign' as OrgTabType,
      label: 'Jenis Resign',
      icon: <LogOut className="h-4 w-4 shrink-0" />,
      count: counts.jenis_resign,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
  ];

  const [createTriggers, setCreateTriggers] = useState<Record<string, number>>({});

  const handleTriggerAdd = () => {
    setCreateTriggers(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || 0) + 1,
    }));
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'company': return 'Tambah Perusahaan';
      case 'site': return 'Tambah Site';
      case 'department': return 'Tambah Departemen';
      case 'section': return 'Tambah Section';
      case 'position': return 'Tambah Position';
      case 'level': return 'Tambah Level';
      case 'grade': return 'Tambah Grade';
      case 'master_jenjang': return 'Tambah Master Jenjang';
      case 'jenjang': return 'Tambah Jenjang';
      case 'hubungan_kerja': return 'Tambah Hubungan Kerja';
      case 'poh': return 'Tambah POH';
      case 'work_area': return 'Tambah Work Area';
      case 'roster_kerja': return 'Tambah Roster Kerja';
      case 'waktu_kerja': return 'Tambah Waktu Kerja';
      case 'kalender_libur': return 'Tambah Hari Libur';
      case 'durasi_paid_leave': return 'Tambah Paid Leave';
      case 'durasi_sp': return 'Tambah Tingkat SP';
      case 'jenis_phk': return 'Tambah Jenis PHK';
      case 'jenis_resign': return 'Tambah Jenis Resign';
      default: return 'Tambah Data';
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Referensi Organisasi"
        subtitle="Kelola Master Referensi Perusahaan & Standar Operasional SDM"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Data Master HCMS', href: '/admin/master-data' },
          { label: 'Referensi Organisasi' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleTriggerAdd}
          >
            {getAddButtonLabel()}
          </Button>
        }
      />

      {/* 2. Tab Menu: Modern Navigation Tabs with Animated Sliding Underline */}
      <div className="border border-slate-200/90 bg-white rounded-xl p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={(t) => handleTabChange(t as OrgTabType)}
          layoutId="org-ref-page-tabs"
          className="border-b-0"
        />
      </div>

      {/* 3. Table Data: Tab Panels */}
      <div className="pt-0">
        {activeTab === 'company' && (
          <CompanyTab
            key="company-tab"
            onDrillDownToSite={handleDrillDownToSite}
            onRefreshAll={loadCounts}
            onCompaniesLoaded={(data) => setCompanies(data)}
            createTrigger={createTriggers['company'] || 0}
          />
        )}

        {activeTab === 'site' && (
          <SiteTab
            key="site-tab"
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onDrillDownToDepartment={handleDrillDownToDepartment}
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['site'] || 0}
          />
        )}

        {activeTab === 'department' && (
          <DepartmentTab
            key="department-tab"
            companies={companies}
            sites={sites}
            selectedCompanyId={selectedCompanyId}
            selectedSiteId={selectedSiteId}
            onDrillDownToSection={handleDrillDownToSection}
            onDrillDownToPosition={handleDrillDownToPosition}
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['department'] || 0}
          />
        )}

        {activeTab === 'section' && (
          <SectionTab
            key="section-tab"
            companies={companies}
            sites={sites}
            departments={departmentsList}
            selectedCompanyId={selectedCompanyId}
            selectedSiteId={selectedSiteId}
            selectedDepartmentId={selectedDepartmentId}
            onDrillDownToPosition={handleDrillDownToPosition}
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['section'] || 0}
          />
        )}

        {activeTab === 'position' && (
          <PositionTab
            key="position-tab"
            selectedCompanyId={selectedCompanyId}
            selectedSiteId={selectedSiteId}
            selectedDepartmentId={selectedDepartmentId}
            selectedSectionId={selectedSectionId}
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['position'] || 0}
          />
        )}

        {activeTab === 'level' && (
          <LevelTab key="level-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['level'] || 0} />
        )}

        {activeTab === 'grade' && (
          <GradeTab key="grade-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['grade'] || 0} />
        )}

        {activeTab === 'master_jenjang' && (
          <MasterJenjangTab key="master-jenjang-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['master_jenjang'] || 0} />
        )}

        {activeTab === 'jenjang' && (
          <JenjangTab key="jenjang-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['jenjang'] || 0} />
        )}

        {activeTab === 'hubungan_kerja' && (
          <HubunganKerjaTab key="hubungan-kerja-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['hubungan_kerja'] || 0} />
        )}

        {activeTab === 'poh' && (
          <PohTab key="poh-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['poh'] || 0} />
        )}

        {activeTab === 'work_area' && (
          <WorkAreaTab key="work-area-tab" onRefreshAll={loadCounts} createTrigger={createTriggers['work_area'] || 0} />
        )}

        {activeTab === 'roster_kerja' && (
          <RosterKerjaTab
            key="roster-kerja-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['roster_kerja'] || 0}
          />
        )}

        {activeTab === 'waktu_kerja' && (
          <WaktuKerjaTab
            key="waktu-kerja-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['waktu_kerja'] || 0}
          />
        )}

        {activeTab === 'kalender_libur' && (
          <KalenderLiburTab
            key="kalender-libur-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['kalender_libur'] || 0}
          />
        )}

        {activeTab === 'durasi_paid_leave' && (
          <DurasiPaidLeaveTab
            key="durasi-paid-leave-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['durasi_paid_leave'] || 0}
          />
        )}

        {activeTab === 'durasi_sp' && (
          <DurasiSpTab
            key="durasi-sp-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['durasi_sp'] || 0}
          />
        )}

        {activeTab === 'jenis_phk' && (
          <JenisPhkTab
            key="jenis-phk-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['jenis_phk'] || 0}
          />
        )}

        {activeTab === 'jenis_resign' && (
          <JenisResignTab
            key="jenis-resign-tab"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['jenis_resign'] || 0}
          />
        )}
      </div>
    </div>
  );
}

export default function OrganizationReferencesPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <OrganizationReferencesContent />
    </Suspense>
  );
}
