'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Calendar,
  Building2,
  Layers,
  Briefcase,
  Users,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { TablePagination } from '@/components/ui/TablePagination';
import { toast } from '@/stores/alertStore';
import { companyDocumentService } from '@/services/companyDocumentService';
import {
  CompanyDocumentItem,
  DocumentCategory,
  AudienceType,
  DocumentCategoryCount
} from '@/types/companyDocument';

const CATEGORY_TABS: { id: string; label: string; icon: any }[] = [
  { id: '', label: 'Semua Dokumen', icon: BookOpen },
  { id: 'REGULATION', label: 'Peraturan Perusahaan', icon: ShieldCheck },
  { id: 'POLICY_SOP', label: 'Kebijakan & SOP', icon: FileText },
  { id: 'INTERNAL_MEMO', label: 'Internal Memo', icon: Sparkles },
  { id: 'FORM_TEMPLATE', label: 'Formulir Standar', icon: FileSpreadsheet },
];

const AUDIENCE_BADGES: Record<AudienceType, { label: string; icon: any; color: string }> = {
  ALL: { label: 'Semua Karyawan', icon: Users, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  DEPARTMENT: { label: 'Khusus Departemen Anda', icon: Building2, color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  SECTION: { label: 'Khusus Section Anda', icon: Layers, color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  POSITION: { label: 'Khusus Posisi Anda', icon: Briefcase, color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
};

export default function EssDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocumentItem[]>([]);
  const [counts, setCounts] = useState<DocumentCategoryCount>({
    ALL: 0,
    REGULATION: 0,
    POLICY_SOP: 0,
    INTERNAL_MEMO: 0,
    FORM_TEMPLATE: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // In-App PDF Preview
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [previewDoc, setPreviewDoc] = useState<CompanyDocumentItem | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await companyDocumentService.getEssDocuments({
        search,
        category: activeCategory || undefined,
        page,
        per_page: 12,
      });

      if (res.success && res.data) {
        setDocuments(res.data.documents.data || []);
        setTotalPages(res.data.documents.last_page || 1);
        setTotalItems(res.data.documents.total || 0);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load ESS documents:', err);
      toast.error('Gagal memuat dokumen perusahaan.');
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handlePreview = async (doc: CompanyDocumentItem) => {
    try {
      setPreviewDoc(doc);
      // Mark as read locally and in backend
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_read: true } : d))
      );
      companyDocumentService.markAsRead(doc.id).catch(() => {});

      const blobUrl = await companyDocumentService.getPreviewBlobUrl(doc.id, true);
      setPreviewBlobUrl(blobUrl);
      setPreviewModalOpen(true);
    } catch (err) {
      toast.error('Gagal membuka pratinjau dokumen.');
    }
  };

  const handleDownload = async (doc: CompanyDocumentItem) => {
    try {
      toast.info('Mengunduh dokumen...');
      await companyDocumentService.downloadDocument(doc.id, doc.file_name, true);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, is_read: true } : d))
      );
      companyDocumentService.markAsRead(doc.id).catch(() => {});
      toast.success('Dokumen berhasil diunduh.');
    } catch (err) {
      toast.error('Gagal mengunduh dokumen.');
    }
  };

  const tabsConfig = CATEGORY_TABS.map((tab) => {
    const Icon = tab.icon;
    let countNum: number | undefined = undefined;
    if (tab.id === '') countNum = counts.ALL;
    else if (tab.id === 'REGULATION') countNum = counts.REGULATION;
    else if (tab.id === 'POLICY_SOP') countNum = counts.POLICY_SOP;
    else if (tab.id === 'INTERNAL_MEMO') countNum = counts.INTERNAL_MEMO;
    else if (tab.id === 'FORM_TEMPLATE') countNum = counts.FORM_TEMPLATE;

    return {
      id: tab.id,
      label: tab.label,
      icon: <Icon className="h-4 w-4 shrink-0" />,
      count: countNum,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen & Regulasi Perusahaan"
        subtitle="Pusat informasi resmi, Peraturan Perusahaan (PP/PKB), Kebijakan & SOP K3LH, serta Internal Memo."
        breadcrumbs={[
          { label: 'Portal Karyawan (ESS)', href: '/ess' },
          { label: 'Dokumen & Regulasi' },
        ]}
      />

      {/* Modern Navigation Tabs */}
      <div className="border border-slate-200/90 bg-white rounded-xl px-2 pt-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={tabsConfig}
          activeTab={activeCategory}
          onChange={(tabId) => {
            setActiveCategory(tabId);
            setPage(1);
          }}
          layoutId="ess-doc-tabs"
          className="border-b-0"
        />
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul, nomor memo, atau kata kunci..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 text-sm bg-white dark:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span>Menampilkan <strong className="text-slate-800 dark:text-slate-200">{documents.length}</strong> dokumen</span>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={loadDocuments}
            className="text-xs"
          >
            Segarkan
          </Button>
        </div>
      </div>

      {/* Card Grid of Documents */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada dokumen yang ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Coba ganti kata kunci pencarian Anda.' : 'Belum ada dokumen yang dipublikasikan untuk kategori ini.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const aud = AUDIENCE_BADGES[doc.audience_type] || AUDIENCE_BADGES.ALL;
            const AudIcon = aud.icon;

            return (
              <Card
                key={doc.id}
                className={`relative flex flex-col justify-between overflow-hidden border transition-all hover:shadow-md ${
                  doc.is_read
                    ? 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
                    : 'border-blue-200 bg-linear-to-b from-blue-50/20 to-white dark:border-blue-900/40 dark:from-blue-950/20 dark:to-slate-900 shadow-xs'
                }`}
              >
                {/* Unread Indicator Ribbon */}
                {!doc.is_read && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    Baru
                  </div>
                )}

                <div className="p-5 space-y-3">
                  {/* Audience & Category Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pr-12">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${aud.color}`}>
                      <AudIcon className="h-3 w-3 shrink-0" />
                      <span>{aud.label}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      v{doc.version}
                    </span>
                  </div>

                  {/* Document Title & Number */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-2 leading-snug">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {doc.document_number}
                    </p>
                  </div>

                  {/* Description */}
                  {doc.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{doc.effective_date ? new Date(doc.effective_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                    </div>
                    <span className="font-mono text-[10px]">
                      {doc.formatted_file_size || `${Math.round((doc.file_size || 0) / 1024)} KB`}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="border-t border-slate-100 bg-slate-50/70 p-3 px-5 flex items-center justify-between gap-2 dark:border-slate-800 dark:bg-slate-800/40">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => handlePreview(doc)}
                    className="flex-1 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  >
                    Baca Dokumen
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Download className="h-3.5 w-3.5" />}
                    onClick={() => handleDownload(doc)}
                    className="text-xs text-slate-600 hover:text-emerald-700"
                    title="Unduh file"
                  >
                    Unduh
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={12}
            onPageChange={setPage}
            onPerPageChange={() => {}}
          />
        </div>
      )}

      {/* In-App PDF Viewer Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
          setPreviewBlobUrl('');
          setPreviewDoc(null);
        }}
        title={previewDoc ? `${previewDoc.document_number} - ${previewDoc.title}` : 'Pratinjau Dokumen'}
        maxWidth="2xl"
        className="max-w-5xl"
      >
        <div className="space-y-3">
          {previewDoc && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDoc.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  v{previewDoc.version}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Download className="h-3.5 w-3.5" />}
                onClick={() => previewDoc && handleDownload(previewDoc)}
                className="text-xs"
              >
                Unduh File Ini
              </Button>
            </div>
          )}

          <div className="h-[75vh] w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            {previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-40 w-80" />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
