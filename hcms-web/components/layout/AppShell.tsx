'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { settingService } from '@/services/adminService';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from '@/components/motion/PageTransition';
import { getActiveWorkspaceId } from '@/config/workspaces';
import { cn } from '@/lib/utils';

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
  const { initFromStorage, isAuthenticated, isLoading } = useAuthStore();
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
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
          {isEss && <MobileBottomNav />}
        </div>
      </div>
    </QueryClientProvider>
  );
};
