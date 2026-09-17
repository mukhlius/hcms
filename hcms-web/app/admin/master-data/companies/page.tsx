'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CompaniesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/organization/references?tab=company');
  }, [router]);

  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
