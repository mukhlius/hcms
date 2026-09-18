'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Stethoscope,
  Glasses,
  Baby,
  HardHat,
  PlaneTakeoff,
  Coins,
  Smartphone,
  Home,
  Plus
} from 'lucide-react';
import { companyService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { BenefitPlafondTab } from '@/components/organization/tabs/BenefitPlafondTab';

type BenefitTabType =
  | 'plafon_pengobatan'
  | 'plafon_kacamata'
  | 'plafon_persalinan'
  | 'tunjangan_lapangan'
  | 'uang_perdin'
  | 'bantuan_lumpsum'
  | 'bantuan_komunikasi'
  | 'bantuan_perumahan';

const VALID_TABS: BenefitTabType[] = [
  'plafon_pengobatan',
  'plafon_kacamata',
  'plafon_persalinan',
  'tunjangan_lapangan',
  'uang_perdin',
  'bantuan_lumpsum',
  'bantuan_komunikasi',
  'bantuan_perumahan',
];

function ReferensiBenefitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as BenefitTabType | null;
  const initialTab: BenefitTabType =
    tabParam && VALID_TABS.includes(tabParam)
      ? tabParam
      : 'plafon_pengobatan';

  const [activeTab, setActiveTab] = useState<BenefitTabType>(initialTab);
  const [createTriggers, setCreateTriggers] = useState<Record<string, number>>({});

  const [counts, setCounts] = useState<{
    plafond_pengobatan: number;
    plafond_kacamata: number;
    plafond_persalinan: number;
    tunjangan_lapangan: number;
    uang_perdin: number;
    bantuan_lumpsum: number;
    bantuan_komunikasi: number;
    bantuan_perumahan: number;
  }>({
    plafond_pengobatan: 0,
    plafond_kacamata: 0,
    plafond_persalinan: 0,
    tunjangan_lapangan: 0,
    uang_perdin: 0,
    bantuan_lumpsum: 0,
    bantuan_komunikasi: 0,
    bantuan_perumahan: 0,
  });

  const loadCounts = useCallback(async () => {
    try {
      const res = await companyService.getOverviewCounts({});
      if (res.success && res.data) {
        setCounts({
          plafond_pengobatan: res.data.plafond_pengobatan ?? 0,
          plafond_kacamata: res.data.plafond_kacamata ?? 0,
          plafond_persalinan: res.data.plafond_persalinan ?? 0,
          tunjangan_lapangan: res.data.tunjangan_lapangan ?? 0,
          uang_perdin: res.data.uang_perdin ?? 0,
          bantuan_lumpsum: res.data.bantuan_lumpsum ?? 0,
          bantuan_komunikasi: res.data.bantuan_komunikasi ?? 0,
          bantuan_perumahan: res.data.bantuan_perumahan ?? 0,
        });
      }
    } catch (err) {
      console.warn('Non-blocking: failed to load benefit counts:', err);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const handleTabChange = (newTab: BenefitTabType) => {
    setActiveTab(newTab);
    setCreateTriggers({});
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    router.replace(`/admin/master-data/benefits?${params.toString()}`, { scroll: false });
  };

  const handleTriggerAdd = () => {
    setCreateTriggers(prev => ({
      ...prev,
      [activeTab]: (prev[activeTab] || 0) + 1,
    }));
  };

  const getAddButtonLabel = () => {
    switch (activeTab) {
      case 'plafon_pengobatan':
        return 'Tambah Plafon Pengobatan';
      case 'plafon_kacamata':
        return 'Tambah Plafon Kacamata';
      case 'plafon_persalinan':
        return 'Tambah Plafon Persalinan';
      case 'tunjangan_lapangan':
        return 'Tambah Tunjangan Lapangan';
      case 'uang_perdin':
        return 'Tambah Tarif Uang Perdin';
      case 'bantuan_lumpsum':
        return 'Tambah Bantuan Lumpsum';
      case 'bantuan_komunikasi':
        return 'Tambah Bantuan Komunikasi';
      case 'bantuan_perumahan':
        return 'Tambah Bantuan Perumahan';
      default:
        return 'Tambah Data';
    }
  };

  const tabsConfig = [
    {
      id: 'plafon_pengobatan' as BenefitTabType,
      label: 'Flapon Pengobatan',
      icon: <Stethoscope className="h-4 w-4 shrink-0" />,
      count: counts.plafond_pengobatan,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'plafon_kacamata' as BenefitTabType,
      label: 'Flapon Kacamata',
      icon: <Glasses className="h-4 w-4 shrink-0" />,
      count: counts.plafond_kacamata,
      badgeColor: 'bg-violet-100 text-violet-800',
    },
    {
      id: 'plafon_persalinan' as BenefitTabType,
      label: 'Flapon Persalinan',
      icon: <Baby className="h-4 w-4 shrink-0" />,
      count: counts.plafond_persalinan,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'tunjangan_lapangan' as BenefitTabType,
      label: 'Tunjangan Lapangan',
      icon: <HardHat className="h-4 w-4 shrink-0" />,
      count: counts.tunjangan_lapangan,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'uang_perdin' as BenefitTabType,
      label: 'Uang Perdin',
      icon: <PlaneTakeoff className="h-4 w-4 shrink-0" />,
      count: counts.uang_perdin,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'bantuan_lumpsum' as BenefitTabType,
      label: 'Bantuan Lumpsum',
      icon: <Coins className="h-4 w-4 shrink-0" />,
      count: counts.bantuan_lumpsum,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'bantuan_komunikasi' as BenefitTabType,
      label: 'Bantuan Komunikasi',
      icon: <Smartphone className="h-4 w-4 shrink-0" />,
      count: counts.bantuan_komunikasi,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'bantuan_perumahan' as BenefitTabType,
      label: 'Bantuan Perumahan',
      icon: <Home className="h-4 w-4 shrink-0" />,
      count: counts.bantuan_perumahan,
      badgeColor: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <PageHeader
        title="Referensi Benefit"
        subtitle="Kelola Master Standar Flapon & Tunjangan Manfaat Karyawan"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Data Master HCMS', href: '/admin/master-data' },
          { label: 'Referensi Benefit' },
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
      <div className="border border-slate-200/90 bg-white rounded-xl p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={(t) => handleTabChange(t as BenefitTabType)}
          layoutId="benefits-page-tabs"
          className="border-b-0"
        />
      </div>

      {/* 3. Tab Content Panels */}
      <div className="transition-all duration-200">
        {activeTab === 'plafon_pengobatan' && (
          <BenefitPlafondTab
            key="benefit-pengobatan-tab"
            benefitType="PENGOBATAN"
            title="Plafon Pengobatan"
            icon={<Stethoscope className="h-6 w-6" />}
            defaultPeriod="TAHUNAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['plafon_pengobatan'] || 0}
          />
        )}

        {activeTab === 'plafon_kacamata' && (
          <BenefitPlafondTab
            key="benefit-kacamata-tab"
            benefitType="KACAMATA"
            title="Plafon Kacamata"
            icon={<Glasses className="h-6 w-6" />}
            defaultPeriod="2_TAHUNAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['plafon_kacamata'] || 0}
          />
        )}

        {activeTab === 'plafon_persalinan' && (
          <BenefitPlafondTab
            key="benefit-persalinan-tab"
            benefitType="PERSALINAN"
            title="Plafon Persalinan"
            icon={<Baby className="h-6 w-6" />}
            defaultPeriod="PER_KASUS"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['plafon_persalinan'] || 0}
          />
        )}

        {activeTab === 'tunjangan_lapangan' && (
          <BenefitPlafondTab
            key="benefit-tunjangan-lapangan-tab"
            benefitType="TUNJANGAN_LAPANGAN"
            title="Tunjangan Lapangan"
            icon={<HardHat className="h-6 w-6" />}
            defaultPeriod="BULANAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['tunjangan_lapangan'] || 0}
          />
        )}

        {activeTab === 'uang_perdin' && (
          <BenefitPlafondTab
            key="benefit-uang-perdin-tab"
            benefitType="UANG_PERDIN"
            title="Uang Perdin"
            icon={<PlaneTakeoff className="h-6 w-6" />}
            defaultPeriod="HARIAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['uang_perdin'] || 0}
          />
        )}

        {activeTab === 'bantuan_lumpsum' && (
          <BenefitPlafondTab
            key="benefit-bantuan-lumpsum-tab"
            benefitType="BANTUAN_LUMPSUM"
            title="Bantuan Lumpsum"
            icon={<Coins className="h-6 w-6" />}
            defaultPeriod="PER_KASUS"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['bantuan_lumpsum'] || 0}
          />
        )}

        {activeTab === 'bantuan_komunikasi' && (
          <BenefitPlafondTab
            key="benefit-bantuan-komunikasi-tab"
            benefitType="BANTUAN_KOMUNIKASI"
            title="Bantuan Komunikasi"
            icon={<Smartphone className="h-6 w-6" />}
            defaultPeriod="BULANAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['bantuan_komunikasi'] || 0}
          />
        )}

        {activeTab === 'bantuan_perumahan' && (
          <BenefitPlafondTab
            key="benefit-bantuan-perumahan-tab"
            benefitType="BANTUAN_PERUMAHAN"
            title="Bantuan Perumahan"
            icon={<Home className="h-6 w-6" />}
            defaultPeriod="BULANAN"
            onRefreshAll={loadCounts}
            createTrigger={createTriggers['bantuan_perumahan'] || 0}
          />
        )}
      </div>
    </div>
  );
}

export default function ReferensiBenefitPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <ReferensiBenefitContent />
    </Suspense>
  );
}
