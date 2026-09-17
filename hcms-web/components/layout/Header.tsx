'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  LogOut, 
  Key, 
  CheckCheck,
  ChevronDown,
  Palette,
  Monitor,
  Shield, 
  User as UserIcon, 
  HardHat, 
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { notificationService } from '@/services/adminService';
import { Badge } from '@/components/ui/Badge';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

export const Header: React.FC = () => {
  const router = useRouter();
  const { setMobileSidebarOpen } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const { themeMode, toggleThemeMode, appName, appIcon } = useThemeStore();

  const [mounted, setMounted] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup dropdown otomatis saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    notificationService.getUnreadCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => {});
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      {/* Area Kiri: Menu Mobile & Branding Aplikasi */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Buka navigasi mobile"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="lg:hidden flex items-center gap-2 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center">
            {appIcon ? (
              <img src={appIcon} alt="App Logo" className="h-full w-full object-contain" />
            ) : (
              <HardHat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px]">
            {appName || 'HCMS ENTERPRISE'}
          </span>
        </div>
      </div>

      {/* Area Kanan: Toggle Mode Tampilan, Notifikasi & Profil Pengguna */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tombol Cepat Mode Terang / Gelap */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
          title={themeMode === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Ubah Mode Tampilan"
        >
          {mounted ? (
            <motion.div
              key={themeMode}
              initial={{ scale: 0.7, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              {typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? (
                <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 transition-colors" />
              ) : (
                <Moon className="h-5 w-5 text-slate-500 hover:text-slate-700 transition-colors" />
              )}
            </motion.div>
          ) : (
            <div className="h-5 w-5" />
          )}
        </button>

        {/* Pusat Notifikasi */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setProfileOpen(false);
            }}
            className={`relative rounded-lg p-2 transition-all cursor-pointer ${
              notificationOpen 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Pusat Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Panel Dropdown Notifikasi */}
          <AnimatePresence>
            {notificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">Notifikasi Sistem</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      notificationService.markAllAsRead().then(() => setUnreadCount(0));
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    <CheckCheck className="h-3 w-3" /> Tandai terbaca
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {unreadCount === 0 ? (
                    <div className="py-10 text-center px-4">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                        <Bell className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-medium text-slate-700">Semua notifikasi telah dibaca</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada peringatan keamanan atau audit tertunda</p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-slate-50 transition-colors">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-slate-800">Sesi Login Terverifikasi</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Akun Anda berhasil masuk dari IP terotorisasi.</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">Baru saja</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Tutup Notifikasi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tombol Switcher Ruang Kerja (Single Icon Button) */}
        <WorkspaceSwitcher />

        {/* Menu Profil Pengguna */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationOpen(false);
            }}
            className={`flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition-all cursor-pointer border ${
              profileOpen 
                ? 'border-blue-200 bg-blue-50/60 shadow-2xs' 
                : 'border-transparent hover:border-slate-200 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HC'}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {user?.roles?.[0]?.display_name || user?.roles?.[0]?.name || 'Personel HC'}
              </p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {/* Panel Dropdown Profil */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl shadow-slate-900/10 z-50 overflow-hidden"
              >
                {/* Kartu Identitas Pengguna */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm shadow-sm">
                      {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HC'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">@{user?.username || 'user'}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge variant="default" className="text-[10px] font-bold">
                      CAKUPAN {user?.data_scope || 'SELF'}
                    </Badge>
                    <Badge variant="success" className="text-[10px]">
                      {user?.status || 'AKTIF'}
                    </Badge>
                  </div>
                </div>

                {/* Daftar Menu Aksi */}
                <div className="p-1.5 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/admin/users');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Direktori & Profil Saya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/admin/settings');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <Palette className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Personalisasi & Tema Tampilan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/admin/sessions');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <Monitor className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Sesi Perangkat Aktif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push('/change-password');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <Key className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Ubah Kata Sandi Akun</span>
                  </button>
                </div>

                {/* Tombol Logout */}
                <div className="border-t border-slate-100 p-1.5 bg-slate-50/40">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer group"
                  >
                    <LogOut className="h-4 w-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                    <span>Keluar dari Sistem HCMS</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
