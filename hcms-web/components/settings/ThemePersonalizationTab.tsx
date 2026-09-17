'use client';

import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Square, 
  Sliders, 
  Check, 
  RotateCcw, 
  Sparkles,
  Search,
  Plus,
  ShieldCheck,
  HardHat,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { 
  useThemeStore, 
  ThemeMode,
  ColorTheme, 
  FontFamily, 
  ButtonShape, 
  ContentDensity 
} from '@/stores/themeStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { AppIconUploadCard } from './AppIconUploadCard';

export const ThemePersonalizationTab: React.FC = () => {
  const {
    themeMode,
    colorTheme,
    fontFamily,
    buttonShape,
    contentDensity,
    setThemeMode,
    setColorTheme,
    setFontFamily,
    setButtonShape,
    setContentDensity,
    resetTheme,
  } = useThemeStore();

  const [savedNotice, setSavedNotice] = useState(false);

  const colorThemes: Array<{
    id: ColorTheme;
    name: string;
    desc: string;
    primaryHex: string;
    accentHex: string;
    badge: string;
  }> = [
    {
      id: 'sapphire',
      name: 'Biru Korporat (Corporate Sapphire)',
      desc: 'Warna standar enterprise terpercaya, jernih dan profesional',
      primaryHex: '#2563eb',
      accentHex: '#eff6ff',
      badge: 'STANDAR CMN',
    },
    {
      id: 'amber',
      name: 'Batu Bara & Emas (Coal & Mining Gold)',
      desc: 'Warna identitas tambang mineral, batubara, dan aksen emas',
      primaryHex: '#d97706',
      accentHex: '#fffbeb',
      badge: 'TEMA TAMBANG',
    },
    {
      id: 'emerald',
      name: 'Zamrud Hutan Tambang (Emerald Forest)',
      desc: 'Warna pelestarian lingkungan, reklamasi area, dan K3 hijau',
      primaryHex: '#059669',
      accentHex: '#ecfdf5',
      badge: 'RAMAH LINGKUNGAN',
    },
    {
      id: 'amethyst',
      name: 'Amethyst Eksekutif (Executive Purple)',
      desc: 'Warna mewah, modern, dan eksklusif untuk jajaran manajemen',
      primaryHex: '#7c3aed',
      accentHex: '#f5f3ff',
      badge: 'EKSEKUTIF',
    },
    {
      id: 'crimson',
      name: 'Merah Obsidian (Obsidian Ruby)',
      desc: 'Warna kontras tinggi dengan energi dinamis dan kewaspadaan',
      primaryHex: '#e11d48',
      accentHex: '#fff1f2',
      badge: 'DINAMIS',
    },
    {
      id: 'slate',
      name: 'Slate Grafit (Graphite Minimalist)',
      desc: 'Warna abu-abu grafit netral, elegan, dan fokus pada data',
      primaryHex: '#334155',
      accentHex: '#f8fafc',
      badge: 'MINIMALIS',
    },
  ];

  const fontFamilies: Array<{
    id: FontFamily;
    name: string;
    familySample: string;
    desc: string;
  }> = [
    {
      id: 'inter',
      name: 'Inter',
      familySample: 'Inter, sans-serif',
      desc: 'Tipografi modern standar enterprise dengan keterbacaan data numerik tinggi',
    },
    {
      id: 'jakarta',
      name: 'Plus Jakarta Sans',
      familySample: "'Plus Jakarta Sans', sans-serif",
      desc: 'Desain geometris elegan, ramah, dan sangat populer pada antarmuka modern',
    },
    {
      id: 'outfit',
      name: 'Outfit',
      familySample: 'Outfit, sans-serif',
      desc: 'Tipografi bernuansa premium tech kontemporer dengan karakter visual tegas',
    },
    {
      id: 'roboto',
      name: 'Roboto',
      familySample: 'Roboto, sans-serif',
      desc: 'Font klasik yang kokoh, seimbang, dan konsisten di seluruh peramban',
    },
    {
      id: 'system',
      name: 'Font Default Sistem Operasi',
      familySample: 'system-ui, sans-serif',
      desc: 'Mengikuti font bawaan sistem pengguna (Windows Segoe UI / Apple San Francisco)',
    },
  ];

  const buttonShapes: Array<{
    id: ButtonShape;
    name: string;
    radiusPreview: string;
    desc: string;
  }> = [
    {
      id: 'sharp',
      name: 'Pojok Tajam (Sharp / 2px)',
      radiusPreview: 'rounded-[2px]',
      desc: 'Gaya industrial tegas, presisi teknis, dan formal',
    },
    {
      id: 'default',
      name: 'Standar Elegan (Default / 8px)',
      radiusPreview: 'rounded-lg',
      desc: 'Keseimbangan modern antara estetika profesional dan kerapian',
    },
    {
      id: 'smooth',
      name: 'Melengkung Halus (Smooth / 14px)',
      radiusPreview: 'rounded-2xl',
      desc: 'Tampilan lembut, ramah sentuhan, dan kontemporer',
    },
    {
      id: 'pill',
      name: 'Kapsul Penuh (Pill / 9999px)',
      radiusPreview: 'rounded-full',
      desc: 'Gaya dinamis, ergonomis, dan modern look',
    },
  ];

  const densityOptions: Array<{
    id: ContentDensity;
    name: string;
    desc: string;
  }> = [
    {
      id: 'compact',
      name: 'Ringkas (Compact Mode)',
      desc: 'Jarak baris rapat, ideal untuk auditor data dan dispatcher monitor tambang',
    },
    {
      id: 'standard',
      name: 'Standar (Comfortable Mode)',
      desc: 'Spasi seimbang untuk kenyamanan navigasi harian seluruh personel',
    },
    {
      id: 'spacious',
      name: 'Lapang (Spacious Mode)',
      desc: 'Jarak ekstra lega untuk kenyamanan membaca pada layar sentuh/tablet lapangan',
    },
  ];

  const handleApply = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Personalisasi Antarmuka Pengguna (UI Themes)</h3>
            <p className="text-xs text-slate-500">
              Konfigurasi tema diterapkan secara instan ke seluruh komponen dan tersimpan pada preferensi akun Anda.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={resetTheme}
          >
            Reset Default
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={handleApply}
            isSuccess={savedNotice}
          >
            {savedNotice ? 'Tersimpan Otomatis' : 'Terapkan Tema'}
          </Button>
        </div>
      </div>

      {/* Identitas Visual & Unggah Ikon Aplikasi */}
      <AppIconUploadCard />

      {/* Mode Tampilan (Theme Mode: Terang, Gelap, Sistem) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mode Tampilan (Theme Mode)
            </h4>
            <p className="text-[11px] text-slate-500">
              Pilih pencahayaan antarmuka untuk kenyamanan mata saat bekerja di lapangan maupun di kantor
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600">
            Aktif: <span className="uppercase text-blue-600">{themeMode}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Mode Terang */}
          <div
            onClick={() => setThemeMode('light')}
            className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              themeMode === 'light'
                ? 'border-amber-400 bg-amber-50/40 shadow-sm ring-2 ring-amber-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mode Terang</div>
                  <div className="text-[10px] text-slate-500 font-mono">Light Mode</div>
                </div>
              </div>
              {themeMode === 'light' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Latar belakang cerah dan bersih, ideal untuk bekerja di ruangan terang atau siang hari di kantor.
            </p>
          </div>

          {/* Mode Gelap */}
          <div
            onClick={() => setThemeMode('dark')}
            className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              themeMode === 'dark'
                ? 'border-indigo-400 bg-indigo-950/40 shadow-sm ring-2 ring-indigo-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mode Gelap</div>
                  <div className="text-[10px] text-slate-500 font-mono">Dark Mode</div>
                </div>
              </div>
              {themeMode === 'dark' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-xs">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Latar belakang obsidian yang elegan, hemat daya layar, dan nyaman di mata saat minim pencahayaan.
            </p>
          </div>

          {/* Mengikuti Sistem */}
          <div
            onClick={() => setThemeMode('system')}
            className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
              themeMode === 'system'
                ? 'border-blue-400 bg-blue-50/40 shadow-sm ring-2 ring-blue-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Mengikuti Sistem</div>
                  <div className="text-[10px] text-slate-500 font-mono">Auto / OS Sync</div>
                </div>
              </div>
              {themeMode === 'system' && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Menyesuaikan mode secara otomatis mengikuti tema aktif pada sistem operasi komputer atau ponsel Anda.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Paket Tema Warna */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Paket Tema Warna (Color Palette)</h4>
            <p className="text-[11px] text-slate-500">Pilih palet warna aksen utama yang mencerminkan nuansa kerja Anda</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600">
            Aktif: <span className="uppercase text-blue-600">{colorTheme}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {colorThemes.map((theme) => {
            const isSelected = colorTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => setColorTheme(theme.id)}
                className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-7 w-7 rounded-full shadow-inner flex items-center justify-center text-white"
                      style={{ backgroundColor: theme.primaryHex }}
                    >
                      {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                    <div className="flex gap-1">
                      <div className="h-7 w-3 rounded-full" style={{ backgroundColor: theme.primaryHex }} />
                      <div className="h-7 w-3 rounded-full border border-slate-200" style={{ backgroundColor: theme.accentHex }} />
                    </div>
                  </div>
                  <Badge variant={isSelected ? 'default' : 'neutral'}>{theme.badge}</Badge>
                </div>

                <h5 className="text-xs font-bold text-slate-900">{theme.name}</h5>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{theme.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Pilihan Tipografi / Font */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Pilihan Tipografi & Font</h4>
            <p className="text-[11px] text-slate-500">Pilih jenis huruf yang memberikan kenyamanan membaca terbaik</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600">
            Aktif: <span className="uppercase text-blue-600">{fontFamily}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fontFamilies.map((font) => {
            const isSelected = fontFamily === font.id;
            return (
              <div
                key={font.id}
                onClick={() => setFontFamily(font.id)}
                className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{font.name}</span>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div 
                  className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/80 my-2 text-slate-800"
                  style={{ fontFamily: font.familySample }}
                >
                  <p className="text-sm font-semibold truncate">PT Coal Mining Nusantara</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Sistem Manajemen SDM Operasional & Tambang</p>
                </div>

                <p className="text-[10.5px] text-slate-500">{font.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bentuk Tombol & Sudut Elemen */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Bentuk Sudut Tombol (Button Shapes)</h4>
            <p className="text-[11px] text-slate-500">Atur tingkat kelengkungan sudut tombol dan elemen aksi interaktif</p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600">
            Aktif: <span className="uppercase text-blue-600">{buttonShape}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {buttonShapes.map((shape) => {
            const isSelected = buttonShape === shape.id;
            return (
              <div
                key={shape.id}
                onClick={() => setButtonShape(shape.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-900">{shape.name}</span>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Visual Button Preview */}
                <div className="py-2">
                  <div
                    className={`w-full py-2 px-3 text-center text-xs font-bold text-white shadow-xs transition-all ${shape.radiusPreview}`}
                    style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                  >
                    Contoh Tombol
                  </div>
                </div>

                <p className="mt-2 text-[10.5px] text-slate-500">{shape.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Kepadatan Antarmuka */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">4. Kepadatan Tata Letak (Density Mode)</h4>
          <p className="text-[11px] text-slate-500">Sesuaikan kepadatan baris tabel data dan jarak spasi elemen</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {densityOptions.map((opt) => {
            const isSelected = contentDensity === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setContentDensity(opt.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">{opt.name}</span>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{opt.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Interactive Preview Widget */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          5. Pratinjau Langsung Komponen (Live Component Sandbox)
        </h4>
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Tombol Primer
            </Button>
            <Button variant="secondary" leftIcon={<HardHat className="h-4 w-4" />}>
              Tombol Sekunder
            </Button>
            <Button variant="outline" leftIcon={<Search className="h-4 w-4" />}>
              Tombol Garis Luar
            </Button>
            <Button variant="danger">
              Tombol Peringatan
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <Input label="Contoh Input Teks" placeholder="Ketik sesuatu di sini..." />
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status Lencana</label>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="success">AKTIF OPERASIONAL</Badge>
                <Badge variant="warning">TERBATAS</Badge>
                <Badge variant="default">CAKUPAN SITE</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
