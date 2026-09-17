'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, CheckCircle2, Shield, Lock, Key, Clock, Globe, Palette } from 'lucide-react';
import { settingService } from '@/services/adminService';
import { SystemSetting } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemePersonalizationTab } from '@/components/settings/ThemePersonalizationTab';
import { AppIconUploadCard } from '@/components/settings/AppIconUploadCard';
import { toast } from '@/stores/alertStore';
import { useThemeStore } from '@/stores/themeStore';

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('THEME_CUSTOMIZATION');
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => settingService.getSettings(),
  });

  useEffect(() => {
    if (settingsData?.data) {
      const map: Record<string, any> = {};
      settingsData.data.forEach((s) => {
        map[s.key] = s.value;
      });
      setSettingsMap(map);
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (batch: Array<{ key: string; value: any }>) => settingService.updateBatch(batch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      if (settingsMap.app_name) {
        useThemeStore.getState().setAppName(settingsMap.app_name);
      }
      if (settingsMap.company_name) {
        useThemeStore.getState().setCompanyName(settingsMap.company_name);
      }
      setSaveSuccess(true);
      toast.success('Pengaturan sistem berhasil disimpan.', 'Berhasil Menyimpan');
      setTimeout(() => setSaveSuccess(false), 2000);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui pengaturan sistem.', 'Gagal Menyimpan');
    },
  });

  const categories = [
    { id: 'THEME_CUSTOMIZATION', label: 'Personalisasi & Tema Tampilan', icon: <Palette className="h-4 w-4" /> },
    { id: 'PASSWORD_POLICY', label: 'Kebijakan Kata Sandi', icon: <Lock className="h-4 w-4" /> },
    { id: 'SECURITY', label: 'Keamanan Akun', icon: <Shield className="h-4 w-4" /> },
    { id: 'AUTHENTICATION', label: 'Autentikasi & Batas Laju', icon: <Key className="h-4 w-4" /> },
    { id: 'SESSION', label: 'Manajemen Sesi', icon: <Clock className="h-4 w-4" /> },
    { id: 'GENERAL', label: 'Umum & Lokalisasi', icon: <Globe className="h-4 w-4" /> },
  ];

  const currentSettings = settingsData?.data?.filter((s) => s.category === activeCategory && s.key !== 'app_icon') || [];

  const handleSave = () => {
    const batch = currentSettings.map((s) => ({
      key: s.key,
      value: settingsMap[s.key] ?? s.value,
    }));
    updateMutation.mutate(batch);
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Pengaturan Sistem & Personalisasi"
        subtitle="Konfigurasi personalisasi tema tampilan pengguna, kebijakan keamanan runtime, aturan kata sandi, dan batas laju permintaan"
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Konfigurasi' },
          { label: 'Pengaturan Sistem' },
        ]}
        actions={
          activeCategory !== 'THEME_CUSTOMIZATION' ? (
            <Button
              size="sm"
              leftIcon={<Save className="h-3.5 w-3.5" />}
              isLoading={updateMutation.isPending}
              isSuccess={saveSuccess}
              onClick={handleSave}
            >
              Simpan Perubahan
            </Button>
          ) : undefined
        }
      />

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <Tabs tabs={categories} activeTab={activeCategory} onChange={setActiveCategory} />
        </div>

        <div className="p-6">
          {activeCategory === 'THEME_CUSTOMIZATION' ? (
            <ThemePersonalizationTab />
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {activeCategory === 'GENERAL' && (
                <div className="pb-6 border-b border-slate-100">
                  <AppIconUploadCard />
                </div>
              )}

              {currentSettings.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Tidak ada pengaturan dalam kategori ini.</p>
              ) : (
                <div className="space-y-5">
                  {currentSettings.map((s) => (
                    <div
                      key={s.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5 max-w-md">
                        <label className="text-xs font-semibold text-slate-900">{s.label}</label>
                        <p className="text-[11px] text-slate-500">{s.description}</p>
                        <span className="font-mono text-[10px] text-slate-400 font-medium">{s.key}</span>
                      </div>

                      <div className="w-full sm:w-48">
                        {s.type === 'boolean' ? (
                          <Select
                            value={settingsMap[s.key] ?? s.value}
                            onChange={(e) => setSettingsMap({ ...settingsMap, [s.key]: e.target.value })}
                          >
                            <option value="1">Aktif (Benar / 1)</option>
                            <option value="0">Nonaktif (Salah / 0)</option>
                          </Select>
                        ) : (
                          <Input
                            type={s.type === 'integer' ? 'number' : 'text'}
                            value={settingsMap[s.key] ?? s.value}
                            onChange={(e) => setSettingsMap({ ...settingsMap, [s.key]: e.target.value })}
                            className="h-9 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
