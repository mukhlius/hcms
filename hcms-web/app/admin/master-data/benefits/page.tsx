'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  HeartHandshake,
  Stethoscope,
  Glasses,
  Baby,
  Plus,
  TrendingUp,
  ShieldCheck,
  CalendarCheck
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
      console.warn('Failed to load benefit counts:', err);
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
        return 'Tambah Data Plafon';
    }
  };

  const tabsConfig = [
    {
      id: 'plafon_pengobatan' as BenefitTabType,
      label: 'Flapon Pengobatan',
      icon: <Stethoscope className="h-4 w-4 shrink-0" />,
      count: counts.plafond_pengobatan,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    {
      id: 'plafon_kacamata' as BenefitTabType,
      label: 'Flapon Kacamata',
      icon: <Glasses className="h-4 w-4 shrink-0" />,
      count: counts.plafond_kacamata,
      badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300',
    },
    {
      id: 'plafon_persalinan' as BenefitTabType,
      label: 'Flapon Persalinan',
      icon: <Baby className="h-4 w-4 shrink-0" />,
      count: counts.plafond_persalinan,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <PageHeader
        title="Referensi Benefit"
        subtitle="Kelola Standar Flapon Manfaat Karyawan Berdasarkan Golongan & Kategori Pernikahan"
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

      {/* 2. Highlights Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-100 bg-linear-to-br from-emerald-50/70 to-white p-4 shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Flapon Pengobatan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {counts.plafond_pengobatan}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Aturan Plafon</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Rawat jalan & inap tahunan per Golongan
          </p>
        </div>

        <div className="rounded-xl border border-violet-100 bg-linear-to-br from-violet-50/70 to-white p-4 shadow-xs dark:border-violet-900/40 dark:from-violet-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
              Flapon Kacamata
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              <Glasses className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {counts.plafond_kacamata}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Aturan Plafon</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Lensa & bingkai kacamata per 2 tahun
          </p>
        </div>

        <div className="rounded-xl border border-rose-100 bg-linear-to-br from-rose-50/70 to-white p-4 shadow-xs dark:border-rose-900/40 dark:from-rose-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Flapon Persalinan
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
              <Baby className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {counts.plafond_persalinan}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Aturan Plafon</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Kelahiran normal & caesar per kasus
          </p>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="border border-slate-200/90 bg-white rounded-xl px-2 pt-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeTab}
          onChange={(t) => handleTabChange(t as BenefitTabType)}
        />
      </div>

      {/* 4. Active Tab Content */}
      <div className="transition-all duration-200">
        {activeTab === 'plafon_pengobatan' && (
          <BenefitPlafondTab
            key="benefit-pengobatan-tab"
            benefitType="PENGOBATAN"
            title="Flapon Pengobatan"
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
            title="Flapon Kacamata"
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
            title="Flapon Persalinan"
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
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <ReferensiBenefitContent />
    </Suspense>
  );
}
