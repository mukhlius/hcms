'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  Monitor,
  ShieldAlert,
  FileText,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HardHat,
  X,
  Network,
  Building2,
  MapPin,
  Briefcase,
  Database,
  Layers,
  UploadCloud,
  Trash2
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { WORKSPACES, getActiveWorkspaceId, hasSubordinates, NavItem } from '@/config/workspaces';
import { cn } from '@/lib/utils';
import { AnimatedCollapse } from '@/components/motion/AnimatedCollapse';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();
  const { hasPermission, user } = useAuthStore();
  const appIcon = useThemeStore((state) => state.appIcon);
  const appName = useThemeStore((state) => state.appName) || 'HCMS ENTERPRISE';
  const companyName = useThemeStore((state) => state.companyName) || 'PT Coal Mining Nusantara';
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Konfigurasi Sistem': true,
    'Data Master HCMS': true,
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isManager = hasSubordinates(user);
  const activeWorkspaceId = getActiveWorkspaceId(pathname);
  const activeWorkspace = WORKSPACES[activeWorkspaceId];
  const navigation: NavItem[] = activeWorkspace.navigation;

  const renderNavContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Link href={activeWorkspace.basePath} className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              {appIcon ? (
                <img src={appIcon} alt="App Logo" className="h-full w-full object-contain" />
              ) : (
                <HardHat className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">{appName}</span>
                <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{companyName}</span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            aria-label="Toggle ciutkan sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Badge Ruang Kerja Aktif */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className={cn(
              "flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
              activeWorkspace.badgeBg
            )}>
              <span className="truncate">
                {activeWorkspaceId === 'ess'
                  ? (isManager ? 'Portal Karyawan & Tim' : 'Portal Karyawan (ESS)')
                  : activeWorkspace.name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {activeWorkspaceId === 'ess'
                  ? (isManager ? 'ESS & MSS' : 'ESS')
                  : activeWorkspace.shortName}
              </span>
            </div>
          </div>
        )}

        {/* Daftar Navigasi */}
        <nav className="space-y-1.5 p-3" aria-label="Navigasi sidebar">
          {navigation.map((item) => {
            // Sembunyikan item khusus atasan jika user tidak memiliki bawahan
            if (item.managerOnly && !isManager) {
              return null;
            }

            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            const sectionHeader = !sidebarCollapsed && item.section ? (
              <div key={`section-${item.section}`} className="pt-3.5 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80 mt-2 first:mt-0 first:border-0">
                {item.section}
              </div>
            ) : null;

            if (item.children) {
              const visibleChildren = item.children.filter(
                (child) => (!child.permission || hasPermission(child.permission)) && (!child.managerOnly || isManager)
              );
              if (visibleChildren.length === 0) return null;

              const isChildActive = visibleChildren.some((child) => pathname === child.href);

              return (
                <React.Fragment key={item.label}>
                  {sectionHeader}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors cursor-pointer',
                        isChildActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {item.icon}
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            openMenus[item.label] ? 'rotate-180' : ''
                          )}
                        />
                      )}
                    </button>

                    <AnimatedCollapse isOpen={Boolean(openMenus[item.label]) || sidebarCollapsed}>
                      <div className={cn('space-y-0.5', sidebarCollapsed ? '' : 'pl-6')}>
                        {visibleChildren.map((child) => {
                          const active = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              title={sidebarCollapsed ? child.label : undefined}
                              className={cn(
                                'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors relative',
                                active
                                  ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-400'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                              )}
                            >
                              {active && (
                                <motion.div
                                  layoutId="sidebar-active-indicator"
                                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-600"
                                />
                              )}
                              <div className="flex items-center gap-2.5 min-w-0">
                                {child.icon}
                                {!sidebarCollapsed && <span className="truncate">{child.label}</span>}
                              </div>
                              {!sidebarCollapsed && child.badge && (
                                <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-bold">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </AnimatedCollapse>
                  </div>
                </React.Fragment>
              );
            }

            const active = pathname === item.href;
            return (
              <React.Fragment key={item.href}>
                {sectionHeader}
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-blue-600"
                    />
                  )}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.icon}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Info Cakupan Akses Pengguna */}
      {!sidebarCollapsed && user && (
        <div className="p-3 m-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Cakupan Akses</span>
            <span className="rounded px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 font-bold uppercase text-[10px]">
              {user.data_scope || 'SELF'}
            </span>
          </div>
          <p className="truncate text-slate-400 dark:text-slate-500">{user.site?.name || 'Multi-Site Tambang Batubara'}</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ease-in-out shrink-0 sticky top-0 h-screen z-30 dark:border-slate-800 dark:bg-slate-900',
          sidebarCollapsed ? 'w-18' : 'w-64'
        )}
      >
        {renderNavContent()}
      </aside>

      {/* Drawer Menu Mobile */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl z-10 dark:bg-slate-900">
            <div className="absolute right-2 top-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
