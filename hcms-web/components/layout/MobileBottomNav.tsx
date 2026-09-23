'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Clock,
  Plus,
  X,
  Users,
  User as UserIcon,
  Building2,
  Database,
  Settings,
  CalendarDays,
  Briefcase,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  UploadCloud,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { getActiveWorkspaceId, hasSubordinates } from '@/config/workspaces';
import { cn } from '@/lib/utils';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { setMobileSidebarOpen } = useUIStore();
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Jangan tampilkan di halaman auth publik
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return null;
  }

  const isManager = hasSubordinates(user);
  const activeWorkspaceId = getActiveWorkspaceId(pathname);
  const isEss = activeWorkspaceId === 'ess';

  const essNavItems = [
    {
      id: 'ess-home',
      label: 'Beranda',
      href: '/ess',
      icon: LayoutDashboard,
      isActive: pathname === '/ess',
    },
    {
      id: 'ess-attendance',
      label: 'Presensi',
      href: '/ess/attendance',
      icon: Clock,
      isActive: pathname.startsWith('/ess/attendance'),
    },
    // Center Button (Quick Action) akan diselipkan di tengah
    {
      id: 'ess-team',
      label: isManager ? 'Approval' : 'Dokumen',
      href: isManager ? '/mss/approvals' : '/ess/documents',
      icon: isManager ? CheckCircle2 : FileText,
      badge: isManager ? '3' : undefined,
      badgeColor: 'bg-amber-500 text-white',
      isActive: isManager
        ? pathname.startsWith('/mss')
        : pathname.startsWith('/ess/documents'),
    },
    {
      id: 'ess-profile',
      label: 'Profil',
      href: '/ess/profile',
      icon: UserIcon,
      isActive: pathname.startsWith('/ess/profile'),
    },
  ];

  const adminNavItems = [
    {
      id: 'admin-dashboard',
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      isActive: pathname === '/',
    },
    {
      id: 'admin-org',
      label: 'Organisasi',
      href: '/admin/organization',
      icon: Building2,
      isActive: pathname === '/admin/organization',
    },
    // Center Button (Quick Action) diselipkan di tengah
    {
      id: 'admin-master',
      label: 'Referensi',
      href: '/admin/organization/references',
      icon: Layers,
      isActive: pathname.startsWith('/admin/organization/references') || pathname.startsWith('/admin/master-data/references'),
    },
    {
      id: 'admin-settings',
      label: 'Pengaturan',
      href: '/admin/settings',
      icon: Settings,
      isActive: pathname.startsWith('/admin/settings'),
    },
  ];

  const currentNavItems = isEss ? essNavItems : adminNavItems;

  const handleQuickActionClick = (targetHref: string) => {
    setQuickActionOpen(false);
    router.push(targetHref);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Fixed di bagian bawah) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pt-1.5 transition-all"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)' }}
      >
        <div className="mx-auto flex max-w-lg items-center justify-around px-2">
          {/* Item 1 */}
          <NavItemButton item={currentNavItems[0]} />

          {/* Item 2 */}
          <NavItemButton item={currentNavItems[1]} />

          {/* Tombol Tengah Aksi Cepat (+) */}
          <div className="relative -top-4 flex flex-col items-center">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => setQuickActionOpen(!quickActionOpen)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg cursor-pointer transition-all focus:outline-none ring-4 ring-white dark:ring-slate-900",
                isEss
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/30"
                  : "bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-blue-500/30",
                quickActionOpen && "rotate-45"
              )}
              aria-label="Menu Aksi Cepat"
            >
              <Plus className="h-6 w-6 transition-transform duration-200" />
            </motion.button>
            <span className="text-[10px] font-semibold tracking-tight text-slate-600 dark:text-slate-300 mt-1">
              Aksi
            </span>
          </div>

          {/* Item 3 */}
          <NavItemButton item={currentNavItems[2]} />

          {/* Item 4 */}
          <NavItemButton item={currentNavItems[3]} />
        </div>
      </nav>

      {/* Modal Bottom Sheet Aksi Cepat */}
      <AnimatePresence>
        {quickActionOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickActionOpen(false)}
              className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm lg:hidden"
            />

            {/* Sheet Content */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden rounded-t-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800"
              style={{ paddingBottom: 'max(calc(env(safe-area-inset-bottom, 0px) + 1.25rem), 1.75rem)' }}
            >
              {/* Drag Pill */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-white",
                    isEss ? "bg-emerald-600" : "bg-blue-600"
                  )}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isEss ? 'Aksi Cepat Karyawan' : 'Aksi Cepat Administrator'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pintasan instan operasi lapangan pertambangan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickActionOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid Aksi Cepat */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {isEss ? (
                  <>
                    <QuickActionButton
                      title="Clock-In / Out"
                      subtitle="Presensi GPS Site"
                      icon={Clock}
                      color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      onClick={() => handleQuickActionClick('/ess/attendance')}
                    />
                    <QuickActionButton
                      title="Ajukan Cuti"
                      subtitle="Form Cuti & Izin"
                      icon={CalendarDays}
                      color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      onClick={() => handleQuickActionClick('/ess/leave')}
                    />
                    <QuickActionButton
                      title="Surat Lembur (SPL)"
                      subtitle="Perintah Lembur Shift"
                      icon={Briefcase}
                      color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      onClick={() => handleQuickActionClick('/ess/overtime')}
                    />
                    <QuickActionButton
                      title="Klaim Manfaat"
                      subtitle="Klaim Medis / Bon"
                      icon={CreditCard}
                      color="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                      onClick={() => handleQuickActionClick('/ess/claims')}
                    />
                    <QuickActionButton
                      title="Slip Gaji Digital"
                      subtitle="Riwayat Pembayaran"
                      icon={FileSpreadsheet}
                      color="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800"
                      onClick={() => handleQuickActionClick('/ess/payslip')}
                    />
                    {isManager && (
                      <QuickActionButton
                        title="Pusat Approval"
                        subtitle="Persetujuan Tim"
                        icon={CheckCircle2}
                        color="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                        onClick={() => handleQuickActionClick('/mss/approvals')}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <QuickActionButton
                      title="Struktur Unit"
                      subtitle="Diagram Hierarki"
                      icon={Building2}
                      color="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      onClick={() => handleQuickActionClick('/admin/organization')}
                    />
                    <QuickActionButton
                      title="Pola Shift & Roster"
                      subtitle="Referensi Operasi"
                      icon={Layers}
                      color="bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-800"
                      onClick={() => handleQuickActionClick('/admin/organization/references?tab=pola_shift')}
                    />
                    <QuickActionButton
                      title="Pengguna & Akses"
                      subtitle="Kelola Akun Personel"
                      icon={Users}
                      color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                      onClick={() => handleQuickActionClick('/admin/users')}
                    />
                    <QuickActionButton
                      title="Impor & Ekspor"
                      subtitle="Pipeline Data CSV"
                      icon={UploadCloud}
                      color="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      onClick={() => handleQuickActionClick('/admin/master-data/import-export')}
                    />
                    <QuickActionButton
                      title="Audit Trail"
                      subtitle="Jejak Aktivitas Sistem"
                      icon={FileText}
                      color="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      onClick={() => handleQuickActionClick('/admin/audit-logs')}
                    />
                    <QuickActionButton
                      title="Buka Menu Lengkap"
                      subtitle="Drawer Sidebar Penuh"
                      icon={Shield}
                      color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      onClick={() => {
                        setQuickActionOpen(false);
                        setMobileSidebarOpen(true);
                      }}
                    />
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

interface NavItemButtonProps {
  item: {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    badge?: string;
    badgeColor?: string;
  };
}

const NavItemButton: React.FC<NavItemButtonProps> = ({ item }) => {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors group cursor-pointer",
        item.isActive
          ? "text-blue-600 dark:text-blue-400 font-semibold"
          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
      )}
    >
      <div className="relative">
        <Icon className={cn("h-5 w-5 transition-transform group-active:scale-90", item.isActive && "scale-105")} />
        {item.badge && (
          <span
            className={cn(
              "absolute -top-1.5 -right-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold shadow-xs",
              item.badgeColor || "bg-rose-500 text-white"
            )}
          >
            {item.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
        {item.label}
      </span>
      {item.isActive && (
        <motion.div
          layoutId="mobileNavActiveDot"
          className="absolute -bottom-1 h-1 w-5 rounded-full bg-blue-600 dark:bg-blue-400"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
    </Link>
  );
};

interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  subtitle,
  icon: Icon,
  color,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-left transition-all active:scale-[0.98] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
    >
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="overflow-hidden">
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{title}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</div>
      </div>
    </button>
  );
};
