'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  User as UserIcon 
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { 
  getActiveWorkspaceId, 
  canAccessWorkspace,
  hasSubordinates 
} from '@/config/workspaces';

export const WorkspaceSwitcher: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isManager = hasSubordinates(user);
  const activeId = getActiveWorkspaceId(pathname);
  const canAdmin = canAccessWorkspace('admin', user);

  // Jika user tidak memiliki akses ke admin console, sembunyikan tombol switch
  if (!canAdmin) {
    return null;
  }

  const handleToggle = () => {
    if (activeId === 'ess') {
      router.push('/');
    } else {
      router.push('/ess');
    }
  };

  const isEss = activeId === 'ess';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
      title={isEss ? 'Beralih ke Administrator Console' : 'Beralih ke Portal Layanan Mandiri (Self-Service)'}
      aria-label={isEss ? 'Beralih ke Administrator Console' : 'Beralih ke Portal Layanan Mandiri'}
    >
      <motion.div
        key={activeId}
        initial={{ scale: 0.7, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.18 }}
      >
        {isEss ? (
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors" />
        ) : isManager ? (
          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors" />
        ) : (
          <UserIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors" />
        )}
      </motion.div>
    </button>
  );
};
