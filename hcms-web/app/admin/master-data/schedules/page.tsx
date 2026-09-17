'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SchedulesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/master-data/references?tab=SHIFTS');
  }, [router]);

  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
