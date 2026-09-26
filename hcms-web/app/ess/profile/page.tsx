'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, User, ArrowLeft, RefreshCw } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import EmployeeDetailView from '@/components/employees/EmployeeDetailView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Employee } from '@/types';

export default function EssProfilePage() {
  const {
    data: res,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['ess-my-profile'],
    queryFn: () => employeeService.getMyProfile(),
    staleTime: 60000,
  });

  const employee: Employee | undefined = res?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="py-20 text-center space-y-4 max-w-lg mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Data Personel Karyawan Belum Ditautkan
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Akun login Anda saat ini belum terhubung dengan nomor induk/catatan karyawan aktif di sistem database HCMS. Silakan hubungi bagian Administrator HC / HR Operation untuk menautkan akun Anda dengan data profil karyawan.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/ess">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Kembali ke Dashboard ESS
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
          >
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <EmployeeDetailView employee={employee} mode="ess" onRefresh={refetch} />
    </div>
  );
}
