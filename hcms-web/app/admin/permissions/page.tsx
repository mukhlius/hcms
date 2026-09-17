'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Key, ShieldCheck, Layers } from 'lucide-react';
import { permissionService } from '@/services/adminService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PermissionsPage() {
  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => permissionService.getPermissions(),
  });

  const permissionGroups = permissionsData?.data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katalog Hak Akses & Izin Sistem"
        subtitle="Daftar lengkap izin operasional granular platform untuk penegakan kebijakan wewenang otorisasi backend"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Katalog Hak Izin' },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(permissionGroups).map(([group, perms]) => (
            <Card key={group} className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">Modul {group}</h2>
                    <p className="text-[11px] text-slate-400">Kapabilitas wewenang akses granular</p>
                  </div>
                </div>
                <Badge variant="neutral">{perms.length} Hak Izin</Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {perms.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{p.display_name}</p>
                      <p className="font-mono text-[11px] text-blue-600 mt-0.5">{p.name}</p>
                    </div>
                    {p.description && (
                      <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5">
                        {p.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
