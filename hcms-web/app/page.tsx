'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Shield, 
  Monitor, 
  ShieldAlert, 
  FileText, 
  Settings, 
  HardHat, 
  ArrowUpRight,
  MapPin,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { canAccessWorkspace } from '@/config/workspaces';
import { userService } from '@/services/userService';
import { roleService, securityService, sessionService } from '@/services/adminService';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { FadeIn, FadeInUp } from '@/components/motion/FadeIn';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && user && !canAccessWorkspace('admin', user)) {
      router.replace('/ess');
    }
  }, [user, isLoading, router]);

  const { data: usersData } = useQuery({
    queryKey: ['users-count'],
    queryFn: () => userService.getUsers({ per_page: 1 }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-count'],
    queryFn: () => roleService.getRoles(),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions-count'],
    queryFn: () => sessionService.getSessions({ active_only: true }),
  });

  const { data: securityStats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: () => securityService.getStats(),
  });

  const totalUsers = usersData?.meta?.total ?? '...';
  const totalRoles = rolesData?.data?.length ?? '...';
  const activeSessions = sessionsData?.data?.total ?? '...';

  const adminModules = [
    {
      title: 'Manajemen Pengguna',
      desc: 'Direktori personel tambang, siklus hidup akun, buka/kunci akun, dan penugasan peran',
      href: '/admin/users',
      icon: <Users className="h-5 w-5 text-blue-600" />,
      tag: 'Administrasi Utama',
    },
    {
      title: 'Peran & Akses Data',
      desc: 'Matriks otorisasi RBAC dinamis dan cakupan akses data bertingkat',
      href: '/admin/roles',
      icon: <Shield className="h-5 w-5 text-indigo-600" />,
      tag: 'Kontrol Akses',
    },
    {
      title: 'Sesi Pengguna Aktif',
      desc: 'Inspeksi perangkat yang terhubung langsung dan pencabutan sesi administratif',
      href: '/admin/sessions',
      icon: <Monitor className="h-5 w-5 text-emerald-600" />,
      tag: 'Pemantauan',
    },
    {
      title: 'Event Keamanan',
      desc: 'Linimasa real-time terkait percobaan login, penguncian akun, dan alarm keparahan',
      href: '/admin/security-events',
      icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
      tag: 'Deteksi Ancaman',
    },
    {
      title: 'Audit Trail & Kepatuhan',
      desc: 'Log audit mutasi data sebelum/sesudah yang tidak dapat diubah (immutable)',
      href: '/admin/audit-logs',
      icon: <FileText className="h-5 w-5 text-amber-600" />,
      tag: 'Kepatuhan & Tata Kelola',
    },
    {
      title: 'Pengaturan Sistem',
      desc: 'Aturan password terpusat, batas rate limit, batas waktu sesi, dan kebijakan runtime',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5 text-slate-600" />,
      tag: 'Konfigurasi',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${user?.name || 'Administrator'}`}
        subtitle="Fase 1: Ikhtisar Fondasi Platform Enterprise & Tata Kelola Operasional"
      />

      {/* Akses Cepat Ruang Kerja (Workspace Quick Links) */}
      <FadeIn>
        <Link href="/ess" className="block group">
          <div className="flex items-center justify-between rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-slate-50/40 to-white p-4.5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all dark:border-emerald-900/50 dark:bg-slate-900">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    Buka Portal Layanan Mandiri (Self-Service) &rarr;
                  </h4>
                  <Badge variant="success" className="text-[10px]">
                    Karyawan & Manajemen Tim
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Akses terpadu: permohonan cuti, presensi tap, klaim, slip gaji, serta persetujuan tim bawahan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
              Buka Portal <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </FadeIn>

      {/* Banner Multi-Site Tambang */}
      <FadeIn>
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-slate-50 to-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <HardHat className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">PT Coal Mining Nusantara (CMN)</h3>
                  <Badge variant="default" className="text-[10px]">Operasi Multi-Site</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Cakupan Akses: <span className="font-semibold text-blue-700">{user?.data_scope || 'GLOBAL'}</span> • Struktur Organisasi: 1 Perusahaan, 3 Site Tambang, 5 Departemen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-1 rounded bg-white px-2.5 py-1 border border-slate-200">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Site Sangatta • Bengalon • Melak</span>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Statistik KPI */}
      <FadeInUp delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pengguna"
            value={totalUsers}
            subtitle="Akun personel terdaftar"
            icon={<Users className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            title="Peran Terkonfigurasi"
            value={totalRoles}
            subtitle="Hierarki peran RBAC"
            icon={<Shield className="h-5 w-5 text-indigo-600" />}
          />
          <StatCard
            title="Sesi Aktif"
            value={activeSessions}
            subtitle="Perangkat terhubung"
            icon={<Monitor className="h-5 w-5 text-emerald-600" />}
          />
          <StatCard
            title="Event Keamanan"
            value={securityStats?.data ? Object.values(securityStats.data).reduce((a, b) => a + b, 0) : 0}
            subtitle="Insiden keamanan tercatat"
            icon={<ShieldAlert className="h-5 w-5 text-rose-600" />}
          />
        </div>
      </FadeInUp>

      {/* Grid Modul Administrasi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
            Administrasi Platform
          </h2>
          <span className="text-xs text-slate-400">Modul Fondasi Fase 1</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((item, idx) => (
            <FadeInUp key={item.href} delay={0.05 * (idx + 1)}>
              <Link href={item.href} className="group block h-full">
                <Card hoverable className="h-full flex flex-col justify-between p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/80 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                        {item.icon}
                      </div>
                      <Badge variant="neutral" className="text-[10px]">
                        {item.tag}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                        <span>{item.title}</span>
                        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-blue-600" />
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kelola</span>
                    <span className="font-semibold text-blue-600">Buka Modul &rarr;</span>
                  </div>
                </Card>
              </Link>
            </FadeInUp>
          ))}
        </div>
      </div>
    </div>
  );
}
