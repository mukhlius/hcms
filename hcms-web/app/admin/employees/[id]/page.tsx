'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import EmployeeDetailView from '@/components/employees/EmployeeDetailView';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Employee } from '@/types';

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = Number(params.id);

  // Load Employee Details
  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['employee-detail', employeeId],
    queryFn: () => employeeService.getEmployee(employeeId),
    enabled: !isNaN(employeeId),
  });

  const employee: Employee | undefined = res?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Karyawan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">ID karyawan tidak valid atau sudah dihapus dari sistem.</p>
        <Link href="/admin/employees">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Karyawan
          </Button>
        </Link>
      </div>
    );
  }

  return <EmployeeDetailView employee={employee} mode="admin" onRefresh={refetch} />;
}
