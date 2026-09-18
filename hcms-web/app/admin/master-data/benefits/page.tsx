'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Stethoscope,
  Glasses,
  Baby,
  Plus
} from 'lucide-react';
import { companyService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { BenefitPlafondTab } from '@/components/organization/tabs/BenefitPlafondTab';

type BenefitTabType = 'plafon_pengobatan' | 'plafon_kacamata' | 'plafon_persalinan';

function ReferensiBenefitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as BenefitTabType | null;
  const initialTab: BenefitTabType =
    tabParam && ['plafon_pengobatan', 'plafon_kacamata', 'plafon_persalinan'].includes(tabParam)
      ? tabParam
      : 'plafon_pengobatan';

  const [activeTab, setActiveTab] = useState<BenefitTabType>(initialTab);
  const [createTriggers, setCreateTriggers] = useState<Record<string, number>>({});

  const [counts, setCounts] = useState<{
    plafond_pengobatan: number;
    plafond_kacamata: number;
    plafond_persalinan: number;
  }>({
    plafond_pengobatan: 0,
    plafond_kacamata: 0,
    plafond_persalinan: 0,
  });

  const loadCounts = useCallback(async () => {
    try {
      const res = await companyService.getOverviewCounts({});
      if (res.success && res.data) {
        setCounts({
          plafond_pengobatan: res.data.plafond_pengobatan ?? 0,
          plafond_kacamata: res.data.plafond_kacamata ?? 0,
          plafond_persalinan: res.data.plafond_persalinan ?? 0,
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
  ];

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <PageHeader
        title="Referensi Benefit"
        subtitle="Kelola Master Standar Flapon Manfaat Karyawan"
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
      <div className="border border-slate-200/90 bg-white rounded-xl px-2 pt-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={(t) => handleTabChange(t as BenefitTabType)}
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
