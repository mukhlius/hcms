'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MasterImportRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/master-data/import-export');
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 text-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        <span>Mengarahkan ke Import &amp; Export Center...</span>
      </div>
    </div>
  );
}
