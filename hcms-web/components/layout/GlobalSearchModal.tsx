'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Users, Shield, Key, Settings, Monitor, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/stores/uiStore';

export const GlobalSearchModal: React.FC = () => {
  const router = useRouter();
  const { globalSearchOpen, setGlobalSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  const navigationShortcuts = [
    { label: 'Direktori Pengguna', href: '/admin/users', category: 'Administrasi', icon: <Users className="h-4 w-4 text-blue-500" /> },
    { label: 'Matriks Peran & Cakupan Data', href: '/admin/roles', category: 'Keamanan & Akses', icon: <Shield className="h-4 w-4 text-indigo-500" /> },
    { label: 'Katalog Izin Wewenang', href: '/admin/permissions', category: 'Keamanan & Akses', icon: <Key className="h-4 w-4 text-amber-500" /> },
    { label: 'Pemantauan Sesi Aktif', href: '/admin/sessions', category: 'Monitoring', icon: <Monitor className="h-4 w-4 text-emerald-500" /> },
    { label: 'Audit Trail & Log Kepatuhan', href: '/admin/audit-logs', category: 'Kepatuhan', icon: <FileText className="h-4 w-4 text-cyan-500" /> },
    { label: 'Pengaturan Sistem & Kebijakan', href: '/admin/settings', category: 'Konfigurasi', icon: <Settings className="h-4 w-4 text-slate-500" /> },
  ];

  const filtered = navigationShortcuts.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setGlobalSearchOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <Modal
      isOpen={globalSearchOpen}
      onClose={() => setGlobalSearchOpen(false)}
      maxWidth="lg"
      className="p-3"
    >
      <div className="relative flex items-center border-b border-slate-100 pb-3">
        <Search className="h-4 w-4 text-slate-400 absolute left-3" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari modul, fitur, navigasi cepat..."
          className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigasi Pintas</p>
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-slate-400 text-center">Fitur atau modul tidak ditemukan.</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => handleSelect(item.href)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-xs font-medium text-slate-800">{item.label}</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">{item.category}</span>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
};
