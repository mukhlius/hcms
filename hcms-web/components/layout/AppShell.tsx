'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { settingService } from '@/services/adminService';
import { authService } from '@/services/authService';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from '@/components/motion/PageTransition';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getActiveWorkspaceId, canAccessWorkspace, hasSubordinates } from '@/config/workspaces';
import { cn } from '@/lib/utils';

const ROUTE_PERMISSIONS: { path: string; permission?: string; managerOnly?: boolean }[] = [
  // Admin module routes
  { path: '/admin/roles', permission: 'roles.view' },
  { path: '/admin/permissions', permission: 'permissions.view' },
  { path: '/admin/settings', permission: 'settings.view' },
  { path: '/admin/database-backup', permission: 'settings.view' },
  { path: '/admin/recycle-bin', permission: 'recycle-bin.view' },
  { path: '/admin/users', permission: 'users.view' },
  { path: '/admin/employees', permission: 'employees.view' },
  { path: '/admin/sessions', permission: 'sessions.view' },
  { path: '/admin/security-events', permission: 'security.view' },
  { path: '/admin/audit-logs', permission: 'audit.view' },
  { path: '/admin/organization', permission: 'organization.view|organizations.view' },
  { path: '/admin/master-data', permission: 'master-data.view|organization.view' },
  { path: '/admin/company-documents', permission: 'company-documents.view' },

  // MSS routes (require manager capability and specific permission)
  { path: '/mss/approvals', permission: 'approvals.view', managerOnly: true },
  { path: '/mss/team', permission: 'mss.team', managerOnly: true },
  { path: '/mss/attendance', permission: 'mss.attendance', managerOnly: true },
  { path: '/mss/roster', permission: 'mss.roster', managerOnly: true },
  { path: '/mss/performance', permission: 'mss.performance', managerOnly: true },
  { path: '/mss', permission: 'mss.view', managerOnly: true },

  // ESS routes
  { path: '/ess/attendance', permission: 'ess.attendance' },
  { path: '/ess/leave', permission: 'ess.leave' },
  { path: '/ess/overtime', permission: 'ess.overtime' },
  { path: '/ess/claims', permission: 'ess.claims' },
  { path: '/ess/payslip', permission: 'ess.payslip' },
  { path: '/ess/documents', permission: 'ess.documents' },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { initFromStorage, isAuthenticated, isLoading, hasPermission, user } = useAuthStore();
  const applyTheme = useThemeStore((state) => state.applyTheme);
  const appName = useThemeStore((state) => state.appName);
  const appIcon = useThemeStore((state) => state.appIcon);
  const colorTheme = useThemeStore((state) => state.colorTheme);

  const isPublicRoute = pathname.startsWith('/login') || 
                        pathname.startsWith('/forgot-password') || 
                        pathname.startsWith('/reset-password');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const cleanAppName = (appName || 'HCMS ENTERPRISE').trim();
    if (document.title !== cleanAppName) {
      document.title = cleanAppName;
    }
    applyTheme();
  }, [appName, appIcon, colorTheme, pathname, applyTheme]);

  useEffect(() => {
    initFromStorage();
    applyTheme();

    // Muat data pengaturan publik terbaru dari API
    settingService.getPublicSettings().then((res) => {
      if (res.success && res.data) {
        if (res.data.app_icon !== undefined) {
          useThemeStore.getState().setAppIcon(res.data.app_icon || null);
        }
        if (res.data.app_name) {
          useThemeStore.getState().setAppName(res.data.app_name);
          if (typeof document !== 'undefined') {
            document.title = res.data.app_name.trim();
          }
        }
        if (res.data.company_name) {
          useThemeStore.getState().setCompanyName(res.data.company_name);
        }
        applyTheme();
      }
    }).catch(() => {});
  }, [initFromStorage, applyTheme]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push('/login');
    }
    // Sinkronkan data profil & wewenang terbaru dari backend
    if (isAuthenticated) {
      authService.me().then((res) => {
        if (res.success && res.data) {
          useAuthStore.getState().setUser(res.data);
        }
      }).catch(() => {});
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  if (isPublicRoute) {
    return (
      <QueryClientProvider client={queryClient}>
        <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">{children}</main>
      </QueryClientProvider>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Memulai Platform HCMS...</p>
        </div>
      </div>
    );
  }

  const isEss = getActiveWorkspaceId(pathname) === 'ess';

  // Evaluasi Hak Akses Halaman / Modul Berdasarkan Peran & Izin
  const isWorkspaceForbidden = !isEss && !canAccessWorkspace('admin', user);
  const matchedRoute = ROUTE_PERMISSIONS.find(r => pathname === r.path || pathname.startsWith(r.path + '/'));

  let isRouteForbidden = false;
  let forbiddenReason = '';

  if (isWorkspaceForbidden) {
    isRouteForbidden = true;
    forbiddenReason = 'Hak Akses Administrator Console (admin.access)';
  } else if (matchedRoute) {
    if (matchedRoute.managerOnly && !hasSubordinates(user)) {
      isRouteForbidden = true;
      forbiddenReason = 'Wewenang Manajerial (Wajib Memiliki Anggota Tim / Bawahan)';
    } else if (matchedRoute.permission && !hasPermission(matchedRoute.permission)) {
      isRouteForbidden = true;
      forbiddenReason = matchedRoute.permission;
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-slate-50/70 text-slate-900 antialiased font-sans dark:bg-slate-950 dark:text-slate-100">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className={cn(
            "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8",
            isEss ? "pb-24 lg:pb-8" : "pb-8"
          )}>
            <div className="mx-auto w-full max-w-[1720px] 2xl:max-w-[1920px]">
              {isRouteForbidden ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 mb-4 border border-rose-200 dark:border-rose-900 shadow-sm">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    Akses Modul Dibatasi
                  </h2>
                  <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Peran akun Anda saat ini tidak memiliki izin wewenang yang diperlukan untuk membuka atau menjalankan modul ini.
                  </p>
                  {forbiddenReason && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700">
                      <span>Izin yang dibutuhkan:</span>
                      <strong>{forbiddenReason}</strong>
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4 mr-1.5" />
                      Kembali
                    </Button>
                    <Button onClick={() => router.push(isEss ? '/ess' : '/')}>
                      <Home className="h-4 w-4 mr-1.5" />
                      Ke Beranda
                    </Button>
                  </div>
                </div>
              ) : (
                <PageTransition>{children}</PageTransition>
              )}
            </div>
          </main>
          {isEss && <MobileBottomNav />}
        </div>
      </div>
    </QueryClientProvider>
  );
};
