'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HardDriveDownload,
  Database,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Clock,
  ShieldCheck,
  Server,
  FileCode,
  Search,
  AlertTriangle,
  HelpCircle,
  FileArchive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { backupService, BackupItem } from '@/services/adminService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast, confirmDialog } from '@/stores/alertStore';

export default function DatabaseBackupPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [backupNote, setBackupNote] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Fetch Backups and Database Info
  const { data: backupResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['database-backups'],
    queryFn: () => backupService.getBackups(),
  });

  const dbInfo = backupResponse?.data?.database;
  const backups = backupResponse?.data?.backups || [];

  // Filtered backups
  const filteredBackups = backups.filter((b) =>
    b.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create Backup Mutation
  const createMutation = useMutation({
    mutationFn: (note: string) => backupService.createBackup(note),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['database-backups'] });
      setIsCreateModalOpen(false);
      setBackupNote('');
      toast.success(
        `Berkas ${res?.data?.filename || 'backup'} berhasil dibuat (${res?.data?.size_formatted || ''}).`,
        'Backup Berhasil'
      );
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Gagal membuat file backup database.',
        'Proses Gagal'
      );
    },
  });

  // Delete Backup Mutation
  const deleteMutation = useMutation({
    mutationFn: (filename: string) => backupService.deleteBackup(filename),
    onSuccess: (_, filename) => {
      queryClient.invalidateQueries({ queryKey: ['database-backups'] });
      toast.success(`Berkas ${filename} telah dihapus.`, 'Berhasil Dihapus');
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Gagal menghapus berkas backup.',
        'Gagal Menghapus'
      );
    },
  });

  const handleDownload = async (filename: string) => {
    try {
      setDownloadingFile(filename);
      toast.info(`Sedang menyiapkan unduhan ${filename}...`, 'Mengunduh Berkas');
      const blob = await backupService.downloadBackup(filename);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Berkas ${filename} berhasil diunduh.`, 'Unduhan Berhasil');
    } catch (err: any) {
      console.error('Download error:', err);
      toast.error('Gagal mengunduh berkas backup database.', 'Kesalahan Unduh');
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = async (filename: string) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Berkas Backup?',
      message: `Apakah Anda yakin ingin menghapus permanen berkas "${filename}"? Berkas cadangan yang telah dihapus tidak dapat dipulihkan kembali.`,
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(filename);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(backupNote);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Cadangan & Pemulihan Basis Data"
        subtitle="Kelola snapshot cadangan database MySQL, unduh arsip data aman, dan pantau status kapasitas basis data HCMS."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Konfigurasi Sistem', href: '/admin/settings' },
          { label: 'Backup Database' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Backup Sekarang
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Database Aktif</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {dbInfo?.database_name || 'hcms_v3_db'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {dbInfo ? `${dbInfo.total_tables} Tabel (~${dbInfo.database_size_mb} MB)` : 'Memuat data...'}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileArchive className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total File Cadangan</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {isLoading ? '...' : `${dbInfo?.total_backups || 0} Berkas`}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Total Ukuran: {dbInfo?.total_backup_size_formatted || '0 B'}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Backup Terakhir</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {isLoading ? '...' : (dbInfo?.last_backup ? dbInfo.last_backup : 'Belum pernah')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jadwal: Otomatis 01:00 WIB
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Server className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Host & Layanan</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {dbInfo ? `${dbInfo.database_host}:${dbInfo.database_port}` : '127.0.0.1:3306'}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Engine Siap & Aktif
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama berkas backup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
            <span>Ditemukan: <strong>{filteredBackups.length}</strong> berkas</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Nama Berkas Snapshot</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Waktu Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-64" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-7 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                        <HardDriveDownload className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        {searchTerm ? 'Tidak ada berkas yang cocok dengan pencarian' : 'Belum ada arsip backup database'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {searchTerm
                          ? 'Silakan coba kata kunci lain'
                          : 'Klik tombol "Buat Backup Sekarang" di atas untuk membuat cadangan database pertama Anda.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBackups.map((backup: BackupItem) => (
                  <tr
                    key={backup.filename}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <FileCode className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {backup.filename}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Penyimpanan Aman: storage/app/backups
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {backup.size_formatted}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="uppercase text-[10px] font-bold">
                        .{backup.extension}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {backup.created_at}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(backup.filename)}
                          disabled={downloadingFile === backup.filename}
                          className="h-8 px-2.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900/60 dark:text-blue-400 dark:hover:bg-blue-950/40 cursor-pointer"
                        >
                          <Download className={`h-3.5 w-3.5 mr-1.5 ${downloadingFile === backup.filename ? 'animate-bounce' : ''}`} />
                          {downloadingFile === backup.filename ? 'Mengunduh...' : 'Unduh'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(backup.filename)}
                          disabled={deleteMutation.isPending}
                          className="h-8 px-2.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Collapsible Disaster Recovery Guide */}
      <Card className="bg-slate-50/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 p-4">
        <button
          type="button"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Panduan Pemulihan Basis Data (Disaster Recovery)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instruksi cara memulihkan (restore) data dari berkas snapshot jika terjadi kendala sistem.
              </p>
            </div>
          </div>
          {isGuideOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {isGuideOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1">
                1. Pemulihan Melalui Baris Perintah (Terminal / Command Prompt):
              </p>
              <div className="p-3 bg-slate-900 text-slate-100 font-mono rounded-lg text-[11px] overflow-x-auto">
                <code>mysql -u root -p hcms_v3_db &lt; backup-hcms_v3_db-YYYY-MM-DD_His.sql</code>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1">
                2. Pemulihan Melalui Antarmuka Laragon (HeidiSQL / phpMyAdmin):
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Buka <strong>HeidiSQL</strong> atau <strong>phpMyAdmin</strong> dari tray Laragon.</li>
                <li>Pilih basis data target <code>hcms_v3_db</code>.</li>
                <li>Pilih menu <strong>File &gt; Load SQL file...</strong> (atau tab <strong>Import</strong> di phpMyAdmin).</li>
                <li>Pilih berkas snapshot <code>.sql</code> yang telah Anda unduh, lalu klik <strong>Execute / Kirim</strong>.</li>
              </ul>
            </div>

            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Perhatian Keamanan:</strong> Selalu simpan salinan berkas backup di tempat terpisah yang aman (seperti cloud storage atau drive eksternal) dan batasi akses unduhan hanya untuk personil Super Admin terotorisasi.
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Buat Backup Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !createMutation.isPending && setIsCreateModalOpen(false)}
        title="Buat Cadangan Database Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Snapshot Aman (Single Transaction)
            </p>
            <p>
              Snapshot akan mengunci status data secara konsisten pada basis data <strong>{dbInfo?.database_name || 'hcms_v3_db'}</strong> tanpa mengganggu operasional sistem yang sedang berjalan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Catatan / Keterangan Backup (Opsional)
            </label>
            <Input
              type="text"
              placeholder="Contoh: Backup sebelum rilis modul penggajian"
              value={backupNote}
              onChange={(e) => setBackupNote(e.target.value)}
              disabled={createMutation.isPending}
              className="text-xs"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Catatan ini akan dicatat ke dalam audit trail keamanan sistem.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createMutation.isPending}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Memproses Cadangan Data...
                </>
              ) : (
                <>
                  <HardDriveDownload className="h-4 w-4 mr-2" />
                  Mulai Proses Backup
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
