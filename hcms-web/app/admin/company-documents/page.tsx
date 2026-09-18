'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  Users,
  Building2,
  Layers,
  Briefcase,
  AlertCircle,
  FileCheck,
  X,
  Upload,
  Calendar,
  RefreshCw,
  ExternalLink,
  BookOpen,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  RotateCcw,
  Power
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { TablePagination } from '@/components/ui/TablePagination';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { toast, confirmDialog } from '@/stores/alertStore';
import { companyDocumentService } from '@/services/companyDocumentService';
import { organizationUnitService, positionService } from '@/services/masterDataService';
import {
  CompanyDocumentItem,
  DocumentCategory,
  AudienceType,
  DocumentStatus,
  CompanyDocumentTarget,
  DocumentCategoryCount
} from '@/types/companyDocument';

const CATEGORY_LABELS: Record<DocumentCategory, { label: string; color: string }> = {
  REGULATION: { label: 'Peraturan Perusahaan', color: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
  POLICY_SOP: { label: 'Kebijakan & SOP', color: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' },
  INTERNAL_MEMO: { label: 'Internal Memo', color: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  FORM_TEMPLATE: { label: 'Formulir Standar', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
};

const AUDIENCE_LABELS: Record<AudienceType, { label: string; icon: React.ElementType; color: string }> = {
  ALL: { label: 'Semua Karyawan', icon: Users, color: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  DEPARTMENT: { label: 'Departemen Tertentu', icon: Building2, color: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' },
  SECTION: { label: 'Section Tertentu', icon: Layers, color: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
  POSITION: { label: 'Posisi Tertentu', icon: Briefcase, color: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800' },
};

export default function AdminCompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [counts, setCounts] = useState<DocumentCategoryCount>({
    ALL: 0,
    REGULATION: 0,
    POLICY_SOP: 0,
    INTERNAL_MEMO: 0,
    FORM_TEMPLATE: 0,
  });
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Metadata dropdown for audience picker
  const [departmentsList, setDepartmentsList] = useState<{ id: number; name: string; code: string }[]>([]);
  const [sectionsList, setSectionsList] = useState<{ id: number; name: string; code: string }[]>([]);
  const [positionsList, setPositionsList] = useState<{ id: number; title: string; code: string }[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form Fields
  const [formNumber, setFormNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('INTERNAL_MEMO');
  const [formDescription, setFormDescription] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formEffectiveDate, setFormEffectiveDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formAudienceType, setFormAudienceType] = useState<AudienceType>('ALL');
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState<string>('');

  // Preview Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await companyDocumentService.getAdminDocuments({
        search,
        category: selectedCategory || undefined,
        audience_type: selectedAudience || undefined,
        status: selectedStatus || undefined,
        page,
        per_page: perPage,
        sort_by: sortField,
        sort_dir: sortOrder,
      });

      if (res.success && res.data) {
        setDocuments(res.data.data || []);
        setTotalPages(res.data.last_page || 1);
        setTotalItems(res.data.total || 0);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      toast.error('Gagal memuat daftar dokumen perusahaan');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedAudience, selectedStatus, page, perPage, sortField, sortOrder]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedAudience('');
    setSelectedStatus('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || selectedCategory || selectedAudience || selectedStatus);

  // Load audience metadata once when modal opens
  const loadAudienceMetadata = async () => {
    try {
      const [unitsRes, posRes] = await Promise.allSettled([
        organizationUnitService.getUnits({ per_page: 150 }),
        positionService.getPositions({ per_page: 150 }),
      ]);

      if (unitsRes.status === 'fulfilled' && unitsRes.value?.success && unitsRes.value.data) {
        const units = unitsRes.value.data.data || [];
        setDepartmentsList(
          units.filter((u) => ['DEPARTMENT', 'DIVISION', 'BUSINESS_UNIT'].includes(u.type))
        );
        setSectionsList(
          units.filter((u) => ['SECTION', 'SUB_SECTION', 'OTHER'].includes(u.type))
        );
      }

      if (posRes.status === 'fulfilled' && posRes.value?.success && posRes.value.data) {
        const pos = posRes.value.data.data || [];
        setPositionsList(pos.map((p) => ({ id: p.id, title: p.title, code: p.code })));
      }
    } catch (err) {
      console.warn('Failed to load audience dropdown metadata:', err);
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormNumber('');
    setFormTitle('');
    setFormCategory('INTERNAL_MEMO');
    setFormDescription('');
    setFormVersion('1.0');
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormExpiryDate('');
    setFormAudienceType('ALL');
    setSelectedTargetIds([]);
    setSelectedFile(null);
    setExistingFileName('');
    setIsModalOpen(true);
    loadAudienceMetadata();
  };

  const handleOpenEdit = (doc: CompanyDocumentItem) => {
    setModalMode('edit');
    setEditingId(doc.id);
    setFormNumber(doc.document_number);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormDescription(doc.description || '');
    setFormVersion(doc.version || '1.0');
    setFormEffectiveDate(doc.effective_date ? doc.effective_date.split('T')[0] : '');
    setFormExpiryDate(doc.expiry_date ? doc.expiry_date.split('T')[0] : '');
    setFormAudienceType(doc.audience_type);
    setSelectedTargetIds(doc.targets ? doc.targets.map((t) => t.target_id) : []);
    setSelectedFile(null);
    setExistingFileName(doc.file_name);
    setIsModalOpen(true);
    loadAudienceMetadata();
  };

  const handleToggleTarget = (id: number) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNumber.trim()) {
      toast.error('Nomor dokumen wajib diisi');
      return;
    }
    if (!formTitle.trim()) {
      toast.error('Judul dokumen wajib diisi');
      return;
    }
    if (modalMode === 'create' && !selectedFile) {
      toast.error('File dokumen wajib diunggah');
      return;
    }
    if (formAudienceType !== 'ALL' && selectedTargetIds.length === 0) {
      toast.error(`Pilih minimal 1 ${AUDIENCE_LABELS[formAudienceType].label}`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('document_number', formNumber);
      formData.append('title', formTitle);
      formData.append('category', formCategory);
      formData.append('description', formDescription);
      formData.append('version', formVersion);
      formData.append('effective_date', formEffectiveDate);
      if (formExpiryDate) formData.append('expiry_date', formExpiryDate);
      formData.append('audience_type', formAudienceType);
      formData.append('status', 'PUBLISHED');

      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // Add targets
      if (formAudienceType !== 'ALL') {
        selectedTargetIds.forEach((targetId, idx) => {
          formData.append(`targets[${idx}][target_id]`, String(targetId));

          let targetName = '';
          if (formAudienceType === 'DEPARTMENT') {
            targetName = departmentsList.find((d) => d.id === targetId)?.name || '';
          } else if (formAudienceType === 'SECTION') {
            targetName = sectionsList.find((s) => s.id === targetId)?.name || '';
          } else if (formAudienceType === 'POSITION') {
            targetName = positionsList.find((p) => p.id === targetId)?.title || '';
          }
          formData.append(`targets[${idx}][target_name]`, targetName);
        });
      }

      if (modalMode === 'create') {
        await companyDocumentService.createAdminDocument(formData);
        toast.success('Dokumen perusahaan berhasil diunggah dan diterbitkan');
      } else if (editingId) {
        await companyDocumentService.updateAdminDocument(editingId, formData);
        toast.success('Dokumen perusahaan berhasil diperbarui');
      }

      setIsModalOpen(false);
      loadDocuments();
    } catch (err: any) {
      console.error('Failed to save document:', err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan dokumen');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doc: CompanyDocumentItem) => {
    const confirmed = await confirmDialog({
      title: 'Hapus Dokumen?',
      message: `Apakah Anda yakin ingin menghapus "${doc.title}" (${doc.document_number})? File fisik juga akan dihapus dari server.`,
      confirmText: 'Ya, Hapus Dokumen',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await companyDocumentService.deleteAdminDocument(doc.id);
        toast.success('Dokumen berhasil dihapus.');
        loadDocuments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menghapus dokumen.');
      }
    }
  };

  const handlePreview = async (doc: CompanyDocumentItem) => {
    try {
      setPreviewDocTitle(`${doc.document_number} - ${doc.title}`);
      const blobUrl = await companyDocumentService.getPreviewBlobUrl(doc.id, false);
      setPreviewBlobUrl(blobUrl);
      setPreviewModalOpen(true);
    } catch (err) {
      toast.error('Gagal membuka pratinjau dokumen.');
    }
  };

  const handleDownload = async (doc: CompanyDocumentItem) => {
    try {
      toast.info('Mengunduh dokumen...');
      await companyDocumentService.downloadDocument(doc.id, doc.file_name, false);
      toast.success('Dokumen berhasil diunduh.');
    } catch (err) {
      toast.error('Gagal mengunduh dokumen.');
    }
  };

  const handleToggleStatus = async (doc: CompanyDocumentItem) => {
    const isPublished = doc.status === 'PUBLISHED';
    const confirmed = await confirmDialog({
      title: isPublished ? 'Arsipkan Dokumen' : 'Terbitkan Dokumen',
      message: isPublished
        ? `Apakah Anda yakin ingin mengarsipkan "${doc.title}"? Dokumen tidak akan lagi tampil di portal ESS karyawan.`
        : `Apakah Anda yakin ingin menerbitkan kembali "${doc.title}" ke portal ESS karyawan?`,
      confirmText: isPublished ? 'Ya, Arsipkan' : 'Ya, Terbitkan',
      cancelText: 'Batal',
      variant: isPublished ? 'warning' : 'primary',
    });

    if (!confirmed) return;

    try {
      const res = await companyDocumentService.toggleAdminDocumentStatus(doc.id);
      if (res.success) {
        toast.success(res.message || 'Status dokumen berhasil diperbarui.');
        loadDocuments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status dokumen.');
    }
  };

  const handleExportCsv = () => {
    if (documents.length === 0) {
      toast.error('Tidak ada data dokumen untuk diekspor.');
      return;
    }

    const headers = [
      'Nomor Dokumen',
      'Judul',
      'Kategori',
      'Sasaran Audiens',
      'Versi',
      'Tanggal Berlaku',
      'Ukuran File',
      'Status',
      'Total Pembaca'
    ];

    const rows = documents.map((d) => [
      `"${(d.document_number || '').replace(/"/g, '""')}"`,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(CATEGORY_LABELS[d.category]?.label || d.category || '').replace(/"/g, '""')}"`,
      `"${(AUDIENCE_LABELS[d.audience_type]?.label || d.audience_type || '').replace(/"/g, '""')}"`,
      `"${d.version || '1.0'}"`,
      `"${d.effective_date ? d.effective_date.split('T')[0] : '-'}"`,
      `"${d.formatted_file_size || `${Math.round((d.file_size || 0) / 1024)} KB`}"`,
      `"${d.status || 'PUBLISHED'}"`,
      d.reads_count || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dokumen_perusahaan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Daftar dokumen berhasil diekspor ke CSV.');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dokumen & Kebijakan Perusahaan"
        subtitle="Kelola Peraturan Perusahaan, SOP, Internal Memo, dan Formulir resmi dengan distribusi audiens presisi."
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Data Master HCMS', href: '/admin/master-data' },
          { label: 'Dokumen Perusahaan' },
        ]}
        actions={
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            Upload Dokumen Baru
          </Button>
        }
      />

      {/* 1. Category Tabs with Live Counter Badges */}
      <div className="border border-slate-200/90 bg-white rounded-xl p-1.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          tabs={[
            { id: '', label: 'Semua Dokumen', icon: <BookOpen className="h-4 w-4 shrink-0" />, count: counts.ALL },
            { id: 'REGULATION', label: 'Peraturan Perusahaan', icon: <ShieldCheck className="h-4 w-4 shrink-0" />, count: counts.REGULATION },
            { id: 'POLICY_SOP', label: 'Kebijakan & SOP', icon: <FileText className="h-4 w-4 shrink-0" />, count: counts.POLICY_SOP },
            { id: 'INTERNAL_MEMO', label: 'Internal Memo', icon: <Sparkles className="h-4 w-4 shrink-0" />, count: counts.INTERNAL_MEMO },
            { id: 'FORM_TEMPLATE', label: 'Formulir Standar', icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />, count: counts.FORM_TEMPLATE },
          ]}
          activeTab={selectedCategory}
          onChange={(tabId) => {
            setSelectedCategory(tabId);
            setPage(1);
          }}
          layoutId="admin-doc-category-tabs"
          className="border-b-0"
        />
      </div>

      {/* 2. Structured Filter & Search Card */}
      <Card className="p-3.5 border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 w-full flex-wrap gap-2.5 items-center">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nomor dokumen, judul, atau deskripsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 text-sm bg-white dark:bg-slate-900"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Audience Filter */}
            <div className="w-full sm:w-[210px]">
              <Select
                value={selectedAudience}
                onChange={(e) => {
                  setSelectedAudience(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Semua Sasaran Audiens' },
                  { value: 'ALL', label: '👥 Semua Karyawan' },
                  { value: 'DEPARTMENT', label: '🏢 Khusus Departemen' },
                  { value: 'SECTION', label: '📑 Khusus Section' },
                  { value: 'POSITION', label: '💼 Khusus Posisi' },
                ]}
                className="text-xs"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-[180px]">
              <Select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Semua Status Publikasi' },
                  { value: 'PUBLISHED', label: '🟢 Terbit (Published)' },
                  { value: 'DRAFT', label: '⚪ Draf (Draft)' },
                  { value: 'ARCHIVED', label: '📦 Diarsipkan' },
                ]}
                className="text-xs"
              />
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
              >
                Reset Filter
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExportCsv}
              className="text-xs"
            >
              Ekspor CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={loadDocuments}
              isLoading={loading}
              className="text-xs"
            >
              Segarkan
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Filter Aktif:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
                Kategori: {CATEGORY_LABELS[selectedCategory as DocumentCategory]?.label || selectedCategory}
                <button type="button" onClick={() => setSelectedCategory('')} className="hover:text-indigo-900 cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                Pencarian: "{search}"
                <button type="button" onClick={() => setSearch('')} className="hover:text-blue-900 cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedAudience && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
                Audiens: {AUDIENCE_LABELS[selectedAudience as AudienceType]?.label || selectedAudience}
                <button type="button" onClick={() => setSelectedAudience('')} className="hover:text-purple-900 cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedStatus && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Status: {selectedStatus === 'PUBLISHED' ? 'Terbit' : selectedStatus === 'DRAFT' ? 'Draf' : 'Arsip'}
                <button type="button" onClick={() => setSelectedStatus('')} className="hover:text-emerald-900 cursor-pointer ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Table Data */}
      <Card className="p-0 overflow-hidden border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-medium text-slate-700 dark:text-slate-300">Tidak ada dokumen perusahaan ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasActiveFilters
                ? 'Tidak ada data dokumen yang cocok dengan filter yang ditentukan.'
                : 'Klik "Upload Dokumen Baru" untuk mempublikasikan memo atau kebijakan resmi.'}
            </p>
            {hasActiveFilters && (
              <Button size="sm" variant="outline" onClick={handleResetFilters} className="mt-3 text-xs">
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400 select-none">
                <tr>
                  <th className="px-5 py-3.5">
                    <SortableHeader
                      label="Dokumen & Nomor"
                      field="title"
                      currentField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader
                      label="Kategori"
                      field="category"
                      currentField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3.5">Target Audiens</th>
                  <th className="px-4 py-3.5">
                    <SortableHeader
                      label="Tanggal Berlaku"
                      field="effective_date"
                      currentField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3.5">
                    <SortableHeader
                      label="Ukuran File"
                      field="file_size"
                      currentField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <SortableHeader
                      label="Status"
                      field="status"
                      currentField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                      align="center"
                    />
                  </th>
                  <th className="px-4 py-3.5 text-center">Dibaca</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => {
                  const cat = CATEGORY_LABELS[doc.category] || { label: doc.category, color: 'bg-slate-100 text-slate-800' };
                  const aud = AUDIENCE_LABELS[doc.audience_type] || { label: doc.audience_type, icon: Users, color: 'bg-slate-100 text-slate-800' };
                  const AudIcon = aud.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span className="truncate">{doc.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-normal">
                                v{doc.version}
                              </span>
                            </div>
                            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {doc.document_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${aud.color}`}>
                            <AudIcon className="h-3 w-3" />
                            {aud.label}
                          </span>
                          {doc.audience_type !== 'ALL' && doc.targets && doc.targets.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-[260px]">
                              {doc.targets.slice(0, 2).map((t, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-[120px]">
                                  {t.target_name || `#${t.target_id}`}
                                </span>
                              ))}
                              {doc.targets.length > 2 && (
                                <span className="text-[10px] px-1 rounded bg-slate-200 text-slate-600 font-medium">
                                  +{doc.targets.length - 2} lagi
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{doc.effective_date ? new Date(doc.effective_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-mono text-slate-500">
                        {doc.formatted_file_size || `${Math.round((doc.file_size || 0) / 1024)} KB`}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {doc.status === 'PUBLISHED' ? (
                          <Badge variant="success" className="text-[10px]">Terbit</Badge>
                        ) : doc.status === 'DRAFT' ? (
                          <Badge variant="neutral" className="text-[10px]">Draf</Badge>
                        ) : (
                          <Badge variant="warning" className="text-[10px]">Arsip</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Users className="h-3.5 w-3.5 text-blue-500" />
                          {doc.reads_count || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(doc)}
                            title="Pratinjau PDF"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(doc)}
                            title="Unduh Dokumen"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(doc)}
                            title={doc.status === 'PUBLISHED' ? 'Arsipkan Dokumen' : 'Terbitkan Dokumen'}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Power className={`h-3.5 w-3.5 ${doc.status === 'PUBLISHED' ? 'text-amber-600' : 'text-emerald-600'}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(doc)}
                            title="Edit Dokumen"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(doc)}
                            title="Hapus Dokumen"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Seamless Table Pagination */}
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          itemLabel="dokumen"
          onPageChange={setPage}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          perPageOptions={[10, 15, 25, 50, 100]}
        />
      </Card>

      {/* Modal Upload & Edit Dokumen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Upload Dokumen & Kebijakan Baru' : 'Perbarui Dokumen Perusahaan'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nomor Dokumen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Dokumen / Memo <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: IM/HC-CORP/2026/024"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                required
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Dokumen <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                options={[
                  { value: 'INTERNAL_MEMO', label: 'Internal Memo / Edaran' },
                  { value: 'POLICY_SOP', label: 'Kebijakan & SOP Perusahaan' },
                  { value: 'REGULATION', label: 'Peraturan Perusahaan (PP/PKB)' },
                  { value: 'FORM_TEMPLATE', label: 'Formulir Standar & Templat' },
                ]}
              />
            </div>
          </div>

          {/* Judul Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Dokumen <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Penyesuaian Jadwal Roster & Prosedur K3LH Pit Tambang"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Versi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Versi Dokumen
              </label>
              <Input
                placeholder="1.0"
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
              />
            </div>

            {/* Tanggal Efektif */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Berlaku Efektif
              </label>
              <Input
                type="date"
                value={formEffectiveDate}
                onChange={(e) => setFormEffectiveDate(e.target.value)}
              />
            </div>

            {/* Tanggal Kedaluwarsa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Masa Berlaku Hingga
              </label>
              <Input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan / Catatan
            </label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ringkasan poin penting dari dokumen ini..."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* TARGET AUDIENCE SELECTOR */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              Sasaran Audiens Karyawan (Target Distribusi) <span className="text-rose-500">*</span>
            </label>

            {/* Radio Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(['ALL', 'DEPARTMENT', 'SECTION', 'POSITION'] as AudienceType[]).map((type) => {
                const isSelected = formAudienceType === type;
                const aud = AUDIENCE_LABELS[type];
                const Icon = aud.icon;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setFormAudienceType(type);
                      setSelectedTargetIds([]);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{aud.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Multi-Select based on Audience Type */}
            {formAudienceType === 'ALL' && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Dokumen ini akan dapat dilihat dan diunduh oleh seluruh karyawan perusahaan di portal ESS.
              </p>
            )}

            {formAudienceType === 'DEPARTMENT' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Pilih Departemen Sasaran:</span>
                  <span className="font-semibold text-blue-600">{selectedTargetIds.length} dipilih</span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {departmentsList.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTargetIds.includes(dept.id)}
                        onChange={() => handleToggleTarget(dept.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono text-slate-400 text-[10px]">{dept.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formAudienceType === 'SECTION' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Pilih Section Sasaran:</span>
                  <span className="font-semibold text-amber-600">{selectedTargetIds.length} dipilih</span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {sectionsList.map((sec) => (
                    <label key={sec.id} className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTargetIds.includes(sec.id)}
                        onChange={() => handleToggleTarget(sec.id)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-mono text-slate-400 text-[10px]">{sec.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{sec.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formAudienceType === 'POSITION' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Pilih Jabatan / Posisi Sasaran:</span>
                  <span className="font-semibold text-purple-600">{selectedTargetIds.length} dipilih</span>
                </div>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white dark:border-slate-800 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {positionsList.map((pos) => (
                    <label key={pos.id} className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTargetIds.includes(pos.id)}
                        onChange={() => handleToggleTarget(pos.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-mono text-slate-400 text-[10px]">{pos.code}</span>
                      <span className="text-slate-700 dark:text-slate-300">{pos.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              File Dokumen (PDF, DOCX, XLSX, Maks 20MB) {modalMode === 'create' && <span className="text-rose-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-1.5" />
              <input
                type="file"
                id="doc-file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="doc-file-upload" className="cursor-pointer font-medium text-xs text-blue-600 hover:text-blue-700">
                {selectedFile ? selectedFile.name : (existingFileName ? `Ganti file: ${existingFileName}` : 'Klik untuk memilih file dari komputer')}
              </label>
              <p className="text-[11px] text-slate-400 mt-1">Disarankan format PDF agar dapat dipratinjau langsung di portal ESS karyawan.</p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {modalMode === 'create' ? 'Terbitkan Dokumen' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-App PDF Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
          setPreviewBlobUrl('');
        }}
        title={`Pratinjau: ${previewDocTitle}`}
        maxWidth="2xl"
        className="max-w-5xl"
      >
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
      </Modal>
    </div>
  );
}
