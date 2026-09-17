'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  HardHat, 
  Eye, 
  Sparkles,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { settingService } from '@/services/adminService';
import { useThemeStore } from '@/stores/themeStore';
import { toast } from '@/stores/alertStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const AppIconUploadCard: React.FC = () => {
  const { appIcon, setAppIcon } = useThemeStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with current public settings on mount
  useEffect(() => {
    const fetchLatestSettings = async () => {
      try {
        const res = await settingService.getPublicSettings();
        if (res.success && res.data) {
          setAppIcon(res.data.app_icon || null);
        }
      } catch (err) {
        console.error('Gagal mengambil pengaturan publik:', err);
      }
    };
    fetchLatestSettings();
  }, [setAppIcon]);

  const handleFileChange = (file: File) => {
    if (!file) return;

    // Validation: Type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|svg|webp|ico)$/i)) {
      toast.error('Format berkas tidak valid. Harap pilih gambar berekstensi PNG, JPG, JPEG, SVG, WebP, atau ICO.', 'Format Tidak Didukung');
      return;
    }

    // Validation: Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran berkas melebihi batas maksimal 2 MB.', 'Berkas Terlalu Besar');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const res = await settingService.uploadAppIcon(selectedFile);
      if (res.success && res.data) {
        setAppIcon(res.data.url);
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.success('Ikon aplikasi berhasil diperbarui dan diterapkan ke seluruh portal!', 'Unggah Berhasil');
      } else {
        toast.error(res.message || 'Gagal mengunggah ikon aplikasi.', 'Gagal Mengunggah');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan saat mengunggah ikon aplikasi.', 'Gagal Mengunggah');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      const res = await settingService.removeAppIcon();
      if (res.success) {
        setAppIcon(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.success('Ikon aplikasi telah dikembalikan ke ikon bawaan sistem (HardHat).', 'Ikon Direset');
      } else {
        toast.error(res.message || 'Gagal menghapus ikon aplikasi.', 'Gagal Menghapus');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan saat menghapus ikon aplikasi.', 'Gagal Menghapus');
    } finally {
      setIsRemoving(false);
    }
  };

  const activeDisplayUrl = previewUrl || appIcon;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-xl border border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div 
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
            style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
          >
            {activeDisplayUrl ? (
              <img src={activeDisplayUrl} alt="Logo Aplikasi" className="h-7 w-7 object-contain rounded" />
            ) : (
              <HardHat className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Identitas Visual & Ikon Aplikasi</h3>
              <Badge variant={appIcon ? 'success' : 'neutral'}>
                {appIcon ? 'IKON KUSTOM AKTIF' : 'IKON BAWAAN SISTEM'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ikon resmi yang diunggah akan otomatis ditampilkan pada <strong>Halaman Login</strong> (Desktop & Mobile) serta <strong>Sidebar HCMS</strong>.
            </p>
          </div>
        </div>

        {appIcon && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            isLoading={isRemoving}
            leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/80"
          >
            Reset ke Default
          </Button>
        )}
      </div>

      {/* Upload Zone & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upload Dropzone (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,.ico"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 mb-3 text-slate-600">
              <UploadCloud className="h-6 w-6 text-blue-600" />
            </div>

            <p className="text-xs font-semibold text-slate-800 text-center">
              {selectedFile ? selectedFile.name : 'Klik untuk memilih atau seret & lepas berkas ikon ke sini'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 text-center">
              Mendukung PNG, JPG, JPEG, SVG, WebP, atau ICO (Maksimal 2 MB).
            </p>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Berkas siap disimpan ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100/80 border border-slate-200/80">
              <div className="text-xs text-slate-600 truncate pr-2">
                Dipilih: <span className="font-semibold text-slate-800">{selectedFile.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  isLoading={isUploading}
                  leftIcon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  Terapkan Ikon Baru
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Live Application Mockup Previews (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>Pratinjau Penerapan Nyata</span>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            {/* 1. Preview Login Desktop */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">1. Halaman Login (Desktop Header)</span>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-900 text-white shadow-inner">
                <div 
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-xs overflow-hidden p-1"
                  style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                >
                  {activeDisplayUrl ? (
                    <img src={activeDisplayUrl} alt="Login Icon" className="h-full w-full object-contain" />
                  ) : (
                    <HardHat className="h-4.5 w-4.5 text-white" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white tracking-tight leading-none">HCMS ENTERPRISE</div>
                  <div className="text-[9.5px] text-blue-200/80 font-medium leading-tight mt-0.5">PT Coal Mining Nusantara</div>
                </div>
              </div>
            </div>

            {/* 2. Preview Login Mobile */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">2. Halaman Login (Mobile Header)</span>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                <div 
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-xs overflow-hidden p-0.5"
                  style={{ backgroundColor: 'var(--primary-color, #2563eb)' }}
                >
                  {activeDisplayUrl ? (
                    <img src={activeDisplayUrl} alt="Mobile Icon" className="h-full w-full object-contain" />
                  ) : (
                    <HardHat className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 leading-none">HCMS ENTERPRISE</div>
                  <div className="text-[9px] text-slate-500 leading-tight mt-0.5">Operasi Pertambangan Batubara</div>
                </div>
              </div>
            </div>

            {/* 3. Preview Sidebar */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">3. Header Sidebar Portal</span>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {activeDisplayUrl ? (
                    <img src={activeDisplayUrl} alt="Sidebar Icon" className="h-full w-full object-contain" />
                  ) : (
                    <HardHat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 leading-none">HCMS ENTERPRISE</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider leading-tight mt-0.5">Operasi Tambang Batubara</div>
                </div>
              </div>
            </div>

            {/* 4. Preview Tab Browser (Favicon) */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">4. Tab Browser Pengguna (Favicon)</span>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-slate-200/80 border-t border-x border-slate-300 w-fit max-w-full">
                <div className="h-4 w-4 shrink-0 flex items-center justify-center overflow-hidden">
                  {activeDisplayUrl ? (
                    <img src={activeDisplayUrl} alt="Favicon" className="h-3.5 w-3.5 object-contain" />
                  ) : (
                    <HardHat className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </div>
                <span className="text-[11px] font-medium text-slate-700 truncate max-w-[150px]">
                  HCMS Enterprise | Human...
                </span>
                <span className="text-[10px] text-slate-400 font-bold ml-1 cursor-default">×</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
