'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  HardHat, 
  ShieldCheck, 
  Layers, 
  Lock, 
  User, 
  ArrowRight,
  AlertCircle,
  Shield,
  Users,
  CheckCircle2,
  Key
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { authService } from '@/services/authService';
import { settingService } from '@/services/adminService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { appIcon, setAppIcon, applyTheme } = useThemeStore();

  const [appName, setAppName] = useState('HCMS ENTERPRISE');
  const [companyName, setCompanyName] = useState('PT Coal Mining Nusantara');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Password@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    applyTheme();
    const loadPublicSettings = async () => {
      try {
        const res = await settingService.getPublicSettings();
        if (res.success && res.data) {
          if (res.data.app_icon !== undefined) {
            setAppIcon(res.data.app_icon || null);
          }
          if (res.data.app_name) {
            setAppName(res.data.app_name);
          }
          if (res.data.company_name) {
            setCompanyName(res.data.company_name);
          }
        }
      } catch (err) {
        // Fallback ke store bawaan
      }
    };
    loadPublicSettings();
  }, [applyTheme, setAppIcon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await authService.login({
        username,
        password,
        remember_me: rememberMe,
      });

      if (res.success && res.data) {
        setIsSuccess(true);
        setAuth(res.data.token, res.data.user);
        setTimeout(() => {
          router.push('/');
        }, 400);
      } else {
        setErrorMessage(res.message || 'Proses login gagal.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      const backendMsg = err.response?.data?.message || 'Username atau password tidak valid.';
      setErrorMessage(backendMsg);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50">
      {/* 65% Area Pengenalan Desktop */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative hidden lg:flex lg:w-[65%] flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 text-white"
      >
        {/* Bentuk geometris dekoratif lembut */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Header Identitas Perusahaan */}
        <div className="relative z-10 flex items-center gap-3">
          <div 
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md overflow-hidden p-1.5"
            style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
          >
            {appIcon ? (
              <img src={appIcon} alt="App Logo" className="h-full w-full object-contain" />
            ) : (
              <HardHat className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">{appName}</h1>
            <p className="text-xs text-blue-200/80 font-medium">{companyName}</p>
          </div>
        </div>

        {/* Pesan Utama */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 backdrop-blur-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Platform Enterprise Standar Kepatuhan Tinggi</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Sistem Manajemen Human Capital
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Tata kelola tenaga kerja operasional terintegrasi untuk operasi penambangan batubara skala enterprise. Dilengkapi penegakan cakupan akses data bertingkat, otorisasi RBAC granular, dan audit trail otomatis.
            </p>
          </div>

          {/* Fitur Utama */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Tata Kelola Multi-Site</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pengelolaan terpadu mulai dari Site Sangatta, Bengalon, hingga Melak Pit.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>Keamanan Berlapis</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Otorisasi di tingkat backend, Correlation ID unik, dan jejak audit anti-tampering.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-6">
          <span>Versi 3.0.0 (Fondasi Platform Enterprise)</span>
          <span>Kerahasiaan Terjaga • Khusus Personel Pertambangan Berwenang</span>
        </div>
      </motion.div>

      {/* 35% Area Formulir Login */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-[35%] lg:px-10 bg-white"
      >
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Header Mobile */}
          <div className="flex items-center gap-2.5 lg:hidden mb-4">
            <div 
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-xs overflow-hidden p-1"
              style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
            >
              {appIcon ? (
                <img src={appIcon} alt="App Logo" className="h-full w-full object-contain" />
              ) : (
                <HardHat className="h-5 w-5" />
              )}
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-900">{appName}</span>
              <span className="block text-[10px] text-slate-500">Operasi Pertambangan Batubara</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Masuk ke akun Anda</h2>
            <p className="text-xs text-slate-500">Masukkan kredensial Anda untuk mengakses portal HCMS</p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Autentikasi Gagal</p>
                <p className="mt-0.5 text-rose-600">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username atau Email"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin atau employee@cmn.mining.local"
              leftIcon={<User className="h-4 w-4" />}
              required
              autoFocus
            />

            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Ingat perangkat ini</span>
              </label>
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              isSuccess={isSuccess}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Masuk
            </Button>
          </form>

          {/* Akun Uji Coba Cepat (Multi-Role Demo Hub) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                <Key className="h-3.5 w-3.5 text-blue-600" />
                <span>Pilih Akun Demo (1-Klik Isi):</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded bg-slate-200/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                Password@123
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  username: 'admin',
                  label: 'Super Admin',
                  scope: 'Global System',
                  badge: 'Admin Console',
                  badgeStyle: 'bg-purple-100 text-purple-800 border-purple-200',
                  icon: <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />,
                },
                {
                  username: 'hc_admin',
                  label: 'HC Admin Corp',
                  scope: 'Company Scope',
                  badge: 'Admin Console',
                  badgeStyle: 'bg-blue-100 text-blue-800 border-blue-200',
                  icon: <Shield className="h-3.5 w-3.5 text-blue-600" />,
                },
                {
                  username: 'hc_sgt',
                  label: 'HC Site Sangatta',
                  scope: 'Site Management',
                  badge: 'Admin & ESS',
                  badgeStyle: 'bg-cyan-100 text-cyan-800 border-cyan-200',
                  icon: <HardHat className="h-3.5 w-3.5 text-cyan-600" />,
                },
                {
                  username: 'mgr_ops',
                  label: 'Operations Mgr',
                  scope: 'Dept & Approvals',
                  badge: 'MSS & ESS',
                  badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  icon: <Users className="h-3.5 w-3.5 text-emerald-600" />,
                },
                {
                  username: 'spv_ops',
                  label: 'Pit Supervisor',
                  scope: 'Shift Crew & Roster',
                  badge: 'MSS & ESS',
                  badgeStyle: 'bg-amber-100 text-amber-800 border-amber-200',
                  icon: <User className="h-3.5 w-3.5 text-amber-600" />,
                },
                {
                  username: 'employee_demo',
                  label: 'Mining Employee',
                  scope: 'Mandiri Operasional',
                  badge: 'ESS Only',
                  badgeStyle: 'bg-slate-200 text-slate-800 border-slate-300',
                  icon: <User className="h-3.5 w-3.5 text-slate-600" />,
                },
              ].map((acc) => {
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => {
                      setUsername(acc.username);
                      setPassword('Password@123');
                      setErrorMessage(null);
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px] truncate">
                        {acc.icon}
                        <span className="truncate">{acc.label}</span>
                      </div>
                      <span className={`px-1 py-0.2 rounded border text-[8px] font-semibold shrink-0 uppercase tracking-tight ${acc.badgeStyle}`}>
                        {acc.badge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span className="font-mono text-slate-600">@{acc.username}</span>
                      <span className="text-[9px] text-slate-400 truncate max-w-[70px]">{acc.scope}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
