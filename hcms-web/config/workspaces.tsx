import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  Monitor,
  ShieldAlert,
  FileText,
  Settings,
  Database,
  Layers,
  UploadCloud,
  Trash2,
  Building2,
  CalendarDays,
  Clock,
  Briefcase,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  CalendarRange,
  Award,
  UserCheck2,
  User as UserIcon
} from 'lucide-react';
import { User } from '@/types';

export type WorkspaceId = 'ess' | 'admin';

export interface NavChildItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  permission?: string;
  badge?: string | number;
  managerOnly?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  badge?: string | number;
  managerOnly?: boolean;
  section?: string;
  children?: NavChildItem[];
}

export interface WorkspaceConfig {
  id: WorkspaceId;
  name: string;
  shortName: string;
  description: string;
  basePath: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  navigation: NavItem[];
}

export const WORKSPACES: Record<WorkspaceId, WorkspaceConfig> = {
  ess: {
    id: 'ess',
    name: 'Portal Karyawan & Tim',
    shortName: 'Self-Service',
    description: 'Layanan Mandiri Personel (ESS) & Manajemen Tim Atasan (MSS)',
    basePath: '/ess',
    color: '#059669', // Emerald
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
    badgeText: 'Karyawan',
    navigation: [
      {
        label: 'Dashboard Saya',
        href: '/ess',
        icon: <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />,
      },
      // --- KELOMPOK PRIBADI SAYA (ESS) ---
      {
        label: 'Profil Pribadi',
        href: '/ess/profile',
        icon: <UserIcon className="h-4.5 w-4.5 shrink-0" />,
        section: 'PRIBADI SAYA',
      },
      {
        label: 'Presensi & Kehadiran',
        href: '/ess/attendance',
        icon: <Clock className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Pengajuan Cuti & Izin',
        href: '/ess/leave',
        icon: <CalendarDays className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Surat Perintah Lembur',
        href: '/ess/overtime',
        icon: <Briefcase className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Klaim & Manfaat',
        href: '/ess/claims',
        icon: <CreditCard className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Slip Gaji Digital',
        href: '/ess/payslip',
        icon: <FileSpreadsheet className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Dokumen & Regulasi',
        href: '/ess/documents',
        icon: <FileText className="h-4.5 w-4.5 shrink-0" />,
      },
      // --- KELOMPOK MANAJEMEN TIM (MSS - HANYA UNTUK ATASAN YANG MEMILIKI BAWAHAN) ---
      {
        label: 'Pusat Persetujuan (Approval)',
        href: '/mss/approvals',
        icon: <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-amber-500" />,
        section: 'MANAJEMEN TIM (ATASAN)',
        managerOnly: true,
        badge: '3',
      },
      {
        label: 'Tim Bawahan (Team Hub)',
        href: '/mss/team',
        icon: <Users className="h-4.5 w-4.5 shrink-0" />,
        managerOnly: true,
      },
      {
        label: 'Presensi & Kehadiran Tim',
        href: '/mss/attendance',
        icon: <UserCheck2 className="h-4.5 w-4.5 shrink-0" />,
        managerOnly: true,
      },
      {
        label: 'Jadwal Roster & Shift',
        href: '/mss/roster',
        icon: <CalendarRange className="h-4.5 w-4.5 shrink-0" />,
        managerOnly: true,
      },
      {
        label: 'Evaluasi & Kinerja Tim',
        href: '/mss/performance',
        icon: <Award className="h-4.5 w-4.5 shrink-0" />,
        managerOnly: true,
      },
    ],
  },
  admin: {
    id: 'admin',
    name: 'Administrator Console',
    shortName: 'Admin',
    description: 'Master Data, Kebijakan, Pengaturan & Tata Kelola Sistem',
    basePath: '/admin',
    color: '#2563eb', // Blue
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50',
    badgeText: 'Administrator',
    navigation: [
      {
        label: 'Dashboard Admin',
        href: '/',
        icon: <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />,
      },
      {
        label: 'Struktur Organisasi',
        href: '/admin/organization',
        icon: <Building2 className="h-4.5 w-4.5 shrink-0" />,
        permission: 'organizations.view',
      },
      {
        label: 'Data Master HCMS',
        href: '/admin/master-data',
        icon: <Database className="h-4.5 w-4.5 shrink-0" />,
        permission: 'organizations.view',
        children: [
          { label: 'Referensi Organisasi', href: '/admin/organization/references', icon: <Layers className="h-4 w-4" />, permission: 'organizations.view' },
          { label: 'Referensi Standar', href: '/admin/master-data/references', icon: <Database className="h-4 w-4" />, permission: 'organizations.view' },
          { label: 'Dokumen Perusahaan', href: '/admin/company-documents', icon: <FileText className="h-4 w-4" />, permission: 'organizations.view' },
          { label: 'Impor & Ekspor Data', href: '/admin/master-data/import-export', icon: <UploadCloud className="h-4 w-4" />, permission: 'organizations.view' },
        ],
      },
      {
        label: 'Konfigurasi Sistem',
        href: '/admin',
        icon: <Shield className="h-4.5 w-4.5 shrink-0" />,
        permission: 'users.view',
        children: [
          { label: 'Pengguna & Personel', href: '/admin/users', icon: <Users className="h-4 w-4" />, permission: 'users.view' },
          { label: 'Peran & Akses', href: '/admin/roles', icon: <Shield className="h-4 w-4" />, permission: 'roles.view' },
          { label: 'Katalog Izin', href: '/admin/permissions', icon: <Key className="h-4 w-4" />, permission: 'permissions.view' },
          { label: 'Sesi Aktif', href: '/admin/sessions', icon: <Monitor className="h-4 w-4" />, permission: 'sessions.view' },
          { label: 'Event Keamanan', href: '/admin/security-events', icon: <ShieldAlert className="h-4 w-4" />, permission: 'security.view' },
          { label: 'Audit Trail', href: '/admin/audit-logs', icon: <FileText className="h-4 w-4" />, permission: 'audit.view' },
          { label: 'Pengaturan Sistem', href: '/admin/settings', icon: <Settings className="h-4 w-4" />, permission: 'settings.view' },
          { label: 'Tempat Sampah', href: '/admin/recycle-bin', icon: <Trash2 className="h-4 w-4 text-rose-500" />, permission: 'users.view' },
        ],
      },
    ],
  },
};

/**
 * Mendeteksi apakah user memiliki bawahan langsung (Manager, Supervisor, Foreman, Lead, Dept Head)
 */
export const hasSubordinates = (user: User | null): boolean => {
  if (!user) return false;
  // Super admin dan Global Scope dianggap memiliki wewenang atasan
  if (user.roles?.some((r) => r.name === 'SUPER_ADMIN') || user.data_scope === 'GLOBAL') return true;
  // Jika data_scope bukan SELF, berarti membawahi subordinate/department/site/company
  if (user.data_scope && user.data_scope !== 'SELF') return true;

  const isManagerRole = user.roles?.some((r) => 
    ['MANAGER', 'SUPERVISOR', 'LEAD', 'FOREMAN', 'SUPERINTENDENT', 'DIRECTOR', 'DEPT_HEAD'].includes(r.name.toUpperCase())
  );
  if (isManagerRole) return true;

  if (user.permissions?.some((p) => p.startsWith('approvals.') || p.startsWith('team.') || p.startsWith('mss.'))) return true;

  return false;
};

/**
 * Mendeteksi workspace aktif berdasarkan URL path
 */
export const getActiveWorkspaceId = (pathname: string): WorkspaceId => {
  if (pathname.startsWith('/ess') || pathname.startsWith('/mss')) return 'ess';
  return 'admin';
};

/**
 * Memvalidasi apakah user memiliki izin untuk membuka workspace tertentu
 */
export const canAccessWorkspace = (workspaceId: WorkspaceId, user: User | null): boolean => {
  if (!user) return false;

  // 1. Seluruh karyawan terautentikasi selalu memiliki akses ke Portal Karyawan & Tim (ESS/MSS)
  if (workspaceId === 'ess') return true;

  // 2. Super admin memiliki akses ke Admin Console
  const isSuperAdmin = user.roles?.some((r) => r.name === 'SUPER_ADMIN') || user.data_scope === 'GLOBAL';
  if (isSuperAdmin) return true;

  // 3. Admin: Dapat diakses jika user memiliki peran admin atau izin administratif
  if (workspaceId === 'admin') {
    const isAdminRole = user.roles?.some((r) =>
      ['ADMIN', 'HR_ADMIN', 'SYSTEM_ADMIN'].includes(r.name.toUpperCase())
    );
    if (isAdminRole) return true;
    if (user.permissions?.some((p) => p.includes('.view') || p.includes('.manage'))) return true;
    return false;
  }

  return false;
};
