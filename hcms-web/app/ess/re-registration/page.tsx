'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Building2,
  User,
  HardHat,
  Heart,
  CreditCard,
  GraduationCap,
  PhoneCall,
  FileText,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Save,
  Send,
  Clock,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Check,
  Info,
  Calendar,
  ChevronRight,
  RefreshCw,
  Eye,
  Download,
  FileCheck,
  File,
  X,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';
import { reRegistrationService } from '@/services/reRegistrationService';
import { referenceDataService } from '@/services/masterDataService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/stores/alertStore';
import { formatDate } from '@/lib/utils';
import {
  INDONESIA_PROVINCES,
  getCitiesByProvince,
  getDistrictsByCity,
  getVillagesByDistrict,
} from '@/lib/indonesiaRegions';
import {
  EmployeeFamily,
  EmployeeEmergencyContact,
  EmployeeEducation,
  EmployeeBankAccount,
  EmployeeHealthSafety,
} from '@/types/employee';
import { ProposedData, EmployeeReregistration } from '@/types/reregistration';
import { DocumentType } from '@/types';

export default function EssReRegistrationPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');
  const [activeSection, setActiveSection] = useState('section-penempatan');

  // Modal Detail & Batal Pengajuan
  const [selectedTicket, setSelectedTicket] = useState<EmployeeReregistration | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<EmployeeReregistration | null>(null);

  // Toggle Desa Manual (KTP & Domisili)
  const [customKtpVillage, setCustomKtpVillage] = useState(false);
  const [customResidentialVillage, setCustomResidentialVillage] = useState(false);

  // Catatan Pengajuan
  const [submissionNotes, setSubmissionNotes] = useState('');

  // ── Form State (Proposed Data) ─────────────────────────────────────────────
  const [formData, setFormData] = useState<ProposedData>({
    nickname: '',
    gender: 'MALE',
    birth_place: '',
    birth_date: '',
    religion: 'ISLAM',
    marital_status: '',
    marriage_date: '',
    id_card_number: '',
    tax_number: '',
    tax_status: '',
    bpjs_ketenagakerjaan: '',
    bpjs_kesehatan: '',
    insurance_admedika: '',
    email_personal: '',
    phone_mobile: '',
    phone_home: '',
    ktp_address: '',
    ktp_province: '',
    ktp_city: '',
    ktp_district: '',
    ktp_village: '',
    ktp_postal_code: '',
    residential_address: '',
    residential_province: '',
    residential_city: '',
    residential_district: '',
    residential_village: '',
    residential_postal_code: '',
    health_safety: {
      blood_type: '',
      rhesus: '',
      height_cm: undefined,
      weight_kg: undefined,
      shirt_size: '',
      pants_size: '',
      safety_shoe_size: '',
      coverall_size: '',
      medical_notes: '',
    },
    families: [],
    educations: [],
    emergency_contacts: [],
    bank_accounts: [],
  });

  // ── Fetch Master References ────────────────────────────────────────────────
  const { data: relData } = useQuery({ queryKey: ['ref-religion'], queryFn: () => referenceDataService.getStandard('RELIGION') });
  const { data: marData } = useQuery({ queryKey: ['ref-marital'], queryFn: () => referenceDataService.getStandard('MARITAL_STATUS') });
  const { data: bldData } = useQuery({ queryKey: ['ref-blood'], queryFn: () => referenceDataService.getStandard('BLOOD_TYPE') });
  const { data: bnkData } = useQuery({ queryKey: ['ref-bank'], queryFn: () => referenceDataService.getStandard('BANK') });
  const { data: eduData } = useQuery({ queryKey: ['ref-education'], queryFn: () => referenceDataService.getStandard('EDUCATION') });
  const { data: uniData } = useQuery({ queryKey: ['ref-uniform'], queryFn: () => referenceDataService.getStandard('UNIFORM_SIZE') });
  const { data: pntData } = useQuery({ queryKey: ['ref-pants'], queryFn: () => referenceDataService.getStandard('PANTS_SIZE') });
  const { data: shoData } = useQuery({ queryKey: ['ref-shoe'], queryFn: () => referenceDataService.getStandard('SHOE_SIZE') });

  const { data: docTypesData } = useQuery({
    queryKey: ['document-types'],
    queryFn: () => referenceDataService.getDocumentTypes(),
  });

  const documentTypes: DocumentType[] = useMemo(() => {
    return (docTypesData?.data || []).filter((d: any) => d.status === 'ACTIVE');
  }, [docTypesData]);

  // Standard References
  const religions = relData?.data || [];
  const rawMaritalStatuses = marData?.data || [];
  const bloodTypes = bldData?.data || [];
  const banks = bnkData?.data || [];
  const educationsList = eduData?.data || [];
  const uniformSizes = uniData?.data || [];
  const pantsSizes = pntData?.data || [];
  const shoeSizes = shoData?.data || [];

  // Marital Status Fallback
  const maritalStatuses = useMemo(() => {
    const list: any[] = [...rawMaritalStatuses];
    const standardCodes = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
    standardCodes.forEach((code) => {
      if (!list.some((item: any) => item.code === code)) {
        list.push({
          id: 0,
          code,
          name:
            code === 'SINGLE'
              ? 'Lajang / Belum Menikah'
              : code === 'MARRIED'
              ? 'Menikah'
              : code === 'DIVORCED'
              ? 'Cerai Hidup'
              : 'Cerai Mati',
        });
      }
    });
    if (formData.marital_status && !list.some((item: any) => item.code === formData.marital_status)) {
      list.unshift({ id: 0, code: formData.marital_status, name: formData.marital_status });
    }
    return list;
  }, [rawMaritalStatuses, formData.marital_status]);

  // ── Fetch Current Employee Data ────────────────────────────────────────────
  const {
    data: essCurrentData,
    isLoading: isLoadingCurrent,
    refetch: refetchCurrent,
  } = useQuery({
    queryKey: ['ess-current-data'],
    queryFn: () => reRegistrationService.getEssCurrent(),
  });

  const currentEmployee = essCurrentData?.data?.employee;
  const pendingTicket = essCurrentData?.data?.pending_ticket;

  // ── Fetch History ──────────────────────────────────────────────────────────
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['ess-history-data'],
    queryFn: () => reRegistrationService.getEssHistory(1, 20),
    enabled: activeTab === 'history',
  });

  // ── Inisialisasi Data Form dari Employee Terdaftar ─────────────────────────
  useEffect(() => {
    if (currentEmployee) {
      setFormData({
        nickname: currentEmployee.nickname || '',
        gender: currentEmployee.gender || 'MALE',
        birth_place: currentEmployee.birth_place || '',
        birth_date: currentEmployee.birth_date ? currentEmployee.birth_date.split('T')[0] : '',
        religion: currentEmployee.religion || 'ISLAM',
        marital_status: currentEmployee.marital_status || '',
        marriage_date: currentEmployee.marriage_date ? currentEmployee.marriage_date.split('T')[0] : '',
        id_card_number: currentEmployee.id_card_number || '',
        tax_number: currentEmployee.tax_number || '',
        tax_status: currentEmployee.tax_status || '',
        bpjs_ketenagakerjaan: currentEmployee.bpjs_ketenagakerjaan || '',
        bpjs_kesehatan: currentEmployee.bpjs_kesehatan || '',
        insurance_admedika: currentEmployee.insurance_admedika || '',
        email_personal: currentEmployee.email_personal || '',
        phone_mobile: currentEmployee.phone_mobile || '',
        phone_home: currentEmployee.phone_home || '',
        ktp_address: currentEmployee.ktp_address || '',
        ktp_province: currentEmployee.ktp_province || '',
        ktp_city: currentEmployee.ktp_city || '',
        ktp_district: currentEmployee.ktp_district || '',
        ktp_village: currentEmployee.ktp_village || '',
        ktp_postal_code: currentEmployee.ktp_postal_code || '',
        residential_address: currentEmployee.residential_address || '',
        residential_province: currentEmployee.residential_province || '',
        residential_city: currentEmployee.residential_city || '',
        residential_district: currentEmployee.residential_district || '',
        residential_village: currentEmployee.residential_village || '',
        residential_postal_code: currentEmployee.residential_postal_code || '',
        health_safety: {
          blood_type: currentEmployee.health_safety?.blood_type || '',
          rhesus: currentEmployee.health_safety?.rhesus || '',
          height_cm: currentEmployee.health_safety?.height_cm != null ? Number(currentEmployee.health_safety.height_cm) : undefined,
          weight_kg: currentEmployee.health_safety?.weight_kg != null ? Number(currentEmployee.health_safety.weight_kg) : undefined,
          shirt_size: currentEmployee.health_safety?.shirt_size || '',
          pants_size: currentEmployee.health_safety?.pants_size || '',
          safety_shoe_size: currentEmployee.health_safety?.safety_shoe_size || '',
          coverall_size: currentEmployee.health_safety?.coverall_size || '',
          medical_notes: currentEmployee.health_safety?.medical_notes || '',
        },
        families: (currentEmployee.families || []).map((f: any) => ({
          ...f,
          relation_type: f.relation_type || f.relationship || 'OTHER',
          child_order: f.child_order != null ? Number(f.child_order) : null,
          name: f.name || '',
          gender: f.gender || 'FEMALE',
          birth_place: f.birth_place || '',
          birth_date: f.birth_date ? f.birth_date.split('T')[0] : '',
          id_card_number: f.id_card_number || '',
          insurance_no: f.insurance_no || '',
          bpjs_kesehatan_no: f.bpjs_kesehatan_no || f.health_provider_no || '',
          is_covered_insurance: f.is_covered_insurance ?? (f.relation_type === 'SPOUSE' || f.relation_type === 'CHILD'),
          is_alive: f.is_alive !== false,
        })),
        educations: (currentEmployee.educations || []).map((ed: any) => ({
          ...ed,
          year_end: ed.year_end != null ? Number(ed.year_end) : undefined,
          is_highest: Boolean(ed.is_highest),
        })),
        emergency_contacts: (currentEmployee.emergency_contacts || []).map((ec: any) => ({
          ...ec,
          is_primary: Boolean(ec.is_primary),
        })),
        bank_accounts: (currentEmployee.bank_accounts || []).map((b: any) => ({
          ...b,
          is_primary: Boolean(b.is_primary),
        })),
      });
    }
  }, [currentEmployee]);

  // ── Wilayah Indonesia Bertingkat (Cascading) ───────────────────────────────
  const ktpCities = useMemo(() => getCitiesByProvince(formData.ktp_province || ''), [formData.ktp_province]);
  const ktpDistricts = useMemo(() => getDistrictsByCity(formData.ktp_city || ''), [formData.ktp_city]);
  const ktpVillages = useMemo(() => getVillagesByDistrict(formData.ktp_district || ''), [formData.ktp_district]);

  const resCities = useMemo(() => getCitiesByProvince(formData.residential_province || ''), [formData.residential_province]);
  const resDistricts = useMemo(() => getDistrictsByCity(formData.residential_city || ''), [formData.residential_city]);
  const resVillages = useMemo(() => getVillagesByDistrict(formData.residential_district || ''), [formData.residential_district]);

  const handleCopyKtpToResidential = () => {
    setFormData({
      ...formData,
      residential_address: formData.ktp_address,
      residential_province: formData.ktp_province,
      residential_city: formData.ktp_city,
      residential_district: formData.ktp_district,
      residential_village: formData.ktp_village,
      residential_postal_code: formData.ktp_postal_code,
    });
    toast.success('Alamat domisili berhasil disalin sama dengan alamat KTP.');
  };

  // ── Hitung Usia Otomatis ──────────────────────────────────────────────────
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const today = new Date();
    const birth = new Date(formData.birth_date);
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [formData.birth_date]);

  const isEmployeeMarried = useMemo(() => {
    const s = (formData.marital_status || '').toUpperCase();
    return s.includes('MARRIED') || s.startsWith('K/') || s === 'MENIKAH';
  }, [formData.marital_status]);

  const isStaff = useMemo(() => {
    return (currentEmployee?.pangkat || (currentEmployee?.grade as any)?.pangkat || 'Staff') === 'Staff';
  }, [currentEmployee]);

  // Hitung jumlah tanggungan anak dari tax_status (contoh: TK/1 -> 1, K/2 -> 2, K/3 -> 3, TK/0 -> 0)
  const requiredChildCount = useMemo(() => {
    if (!formData.tax_status) return 0;
    const match = formData.tax_status.match(/\/(\d+)/) || formData.tax_status.match(/(\d+)$/);
    return match ? parseInt(match[1], 10) || 0 : 0;
  }, [formData.tax_status]);

  // Evaluasi kepatuhan ketentuan wajib Data Keluarga
  const familyCompliance = useMemo(() => {
    const families = formData.families || [];

    const father = families.find((f: any) => f.relation_type === 'FATHER' && f.name?.trim());
    const mother = families.find((f: any) => f.relation_type === 'MOTHER' && f.name?.trim());
    const spouse = families.find((f: any) => f.relation_type === 'SPOUSE' && f.name?.trim());
    const fatherInLaw = families.find((f: any) => f.relation_type === 'FATHER_IN_LAW' && f.name?.trim());
    const motherInLaw = families.find((f: any) => f.relation_type === 'MOTHER_IN_LAW' && f.name?.trim());
    const validChildren = families.filter((f: any) => f.relation_type === 'CHILD' && f.name?.trim());

    const hasFather = !!father;
    const hasMother = !!mother;
    const hasSpouse = !isEmployeeMarried || !!spouse;
    const hasFatherInLaw = !isEmployeeMarried || !!fatherInLaw;
    const hasMotherInLaw = !isEmployeeMarried || !!motherInLaw;
    const hasRequiredChildren = validChildren.length >= requiredChildCount;

    const isComplete =
      hasFather &&
      hasMother &&
      hasSpouse &&
      hasFatherInLaw &&
      hasMotherInLaw &&
      hasRequiredChildren;

    return {
      hasFather,
      hasMother,
      hasSpouse,
      hasFatherInLaw,
      hasMotherInLaw,
      hasRequiredChildren,
      childrenCount: validChildren.length,
      requiredChildCount,
      isComplete,
    };
  }, [formData.families, isEmployeeMarried, requiredChildCount]);

  // Quick setup: siapkan baris keluarga wajib secara instan
  const applyFamilyRequirementsTemplate = () => {
    const currentFamilies = [...(formData.families || [])];

    const ensureRelation = (relationType: string, defaultGender = 'MALE', childOrder: number | null = null) => {
      const exists = currentFamilies.some(
        (f: any) => f.relation_type === relationType && (childOrder === null || f.child_order === childOrder)
      );
      if (!exists) {
        currentFamilies.push({
          relation_type: relationType,
          child_order: childOrder,
          name: '',
          gender: defaultGender,
          birth_place: '',
          birth_date: '',
          id_card_number: '',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          is_covered_insurance: relationType === 'SPOUSE' || relationType === 'CHILD',
          is_alive: true,
        } as any);
      }
    };

    // 1. Ayah Kandung & Ibu Kandung (Wajib Umum)
    ensureRelation('FATHER', 'MALE');
    ensureRelation('MOTHER', 'FEMALE');

    // 2. Jika Menikah: Istri/Suami, Ayah Mertua, Ibu Mertua
    if (isEmployeeMarried) {
      const spouseGender = formData.gender === 'FEMALE' ? 'MALE' : 'FEMALE';
      ensureRelation('SPOUSE', spouseGender);
      ensureRelation('FATHER_IN_LAW', 'MALE');
      ensureRelation('MOTHER_IN_LAW', 'FEMALE');
    }

    // 3. Anak sesuai jumlah tanggungan pajak
    for (let i = 1; i <= requiredChildCount; i++) {
      ensureRelation('CHILD', 'FEMALE', i);
    }

    setFormData({ ...formData, families: currentFamilies });
    toast.success('Template baris keluarga wajib berhasil disiapkan');
  };

  // ── Kalkulasi Kelengkapan Seksi (Progress Stats) ───────────────────────────
  const progressStats = useMemo(() => {
    const sectionStatus = {
      penempatan: true, // Read-only
      biodata: Boolean(
        formData.birth_place &&
        formData.birth_date &&
        formData.id_card_number &&
        formData.phone_mobile &&
        formData.ktp_address &&
        formData.ktp_city
      ),
      fisik: Boolean(
        formData.health_safety?.blood_type &&
        formData.health_safety?.shirt_size &&
        formData.health_safety?.pants_size &&
        formData.health_safety?.safety_shoe_size
      ),
      keluarga: (formData.families || []).length > 0,
      payroll: (formData.bank_accounts || []).length > 0,
      pendidikan: (formData.educations || []).length > 0 && (formData.emergency_contacts || []).length > 0,
      dokumen: (currentEmployee?.documents || []).length > 0,
    };

    let filledCount = 0;
    const totalCount = 7;
    Object.values(sectionStatus).forEach((st) => {
      if (st) filledCount++;
    });

    const percentage = Math.round((filledCount / totalCount) * 100);

    return { sectionStatus, filledCount, totalCount, percentage };
  }, [formData, currentEmployee]);

  // ── Navigasi Seksi Cepat ──────────────────────────────────────────────────
  const navSections = [
    { id: 'section-penempatan', label: '1. Penempatan & Organisasi', status: progressStats.sectionStatus.penempatan, icon: Building2 },
    { id: 'section-biodata', label: '2. Biodata & Alamat Legal', status: progressStats.sectionStatus.biodata, icon: User },
    { id: 'section-fisik', label: '3. Data Fisik & APD', status: progressStats.sectionStatus.fisik, icon: HardHat },
    { id: 'section-keluarga', label: '4. Keluarga & Tanggungan', status: progressStats.sectionStatus.keluarga, icon: Heart },
    { id: 'section-payroll', label: '5. Rekening & Payroll', status: progressStats.sectionStatus.payroll, icon: CreditCard },
    { id: 'section-pendidikan', label: '6. Pendidikan & Kontak', status: progressStats.sectionStatus.pendidikan, icon: GraduationCap },
    { id: 'section-dokumen', label: '7. Upload Dokumen Standar', status: progressStats.sectionStatus.dokumen, icon: FileText },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -140;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // ── Dynamic Array Handlers ────────────────────────────────────────────────
  // Keluarga
  const addFamilyMember = () => {
    setFormData((prev) => ({
      ...prev,
      families: [
        ...(prev.families || []),
        {
          relation_type: (prev.families || []).length === 0 ? 'SPOUSE' : 'CHILD',
          child_order: (prev.families || []).length === 0 ? null : (prev.families || []).filter((f: any) => f.relation_type === 'CHILD').length + 1,
          name: '',
          gender: 'FEMALE',
          birth_place: '',
          birth_date: '',
          id_card_number: '',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          is_covered_insurance: true,
          is_alive: true,
        } as any,
      ],
    }));
  };

  const updateFamilyMember = (index: number, field: string, val: any) => {
    setFormData((prev) => {
      const updated = [...(prev.families || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, families: updated };
    });
  };

  const removeFamilyMember = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      families: (prev.families || []).filter((_, idx) => idx !== index),
    }));
  };

  // Pendidikan
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      educations: [
        ...(prev.educations || []),
        {
          education_level: 'SMA/SMK',
          institution_name: '',
          major: '',
          year_end: new Date().getFullYear(),
          gpa: '',
          is_highest: (prev.educations || []).length === 0,
        } as any,
      ],
    }));
  };

  const updateEducation = (index: number, field: string, val: any) => {
    setFormData((prev) => {
      const updated = [...(prev.educations || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, educations: updated };
    });
  };

  const removeEducation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      educations: (prev.educations || []).filter((_, idx) => idx !== index),
    }));
  };

  // Kontak Darurat
  const addEmergencyContact = () => {
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: [
        ...(prev.emergency_contacts || []),
        {
          name: '',
          relationship: 'Istri',
          phone_number: '',
          is_primary: (prev.emergency_contacts || []).length === 0,
        } as any,
      ],
    }));
  };

  const updateEmergencyContact = (index: number, field: string, val: any) => {
    setFormData((prev) => {
      const updated = [...(prev.emergency_contacts || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, emergency_contacts: updated };
    });
  };

  const removeEmergencyContact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: (prev.emergency_contacts || []).filter((_, idx) => idx !== index),
    }));
  };

  // Rekening Bank
  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: [
        ...(prev.bank_accounts || []),
        {
          bank_name: 'BCA',
          account_number: '',
          account_holder_name: currentEmployee?.name || '',
          branch: '',
          is_primary: (prev.bank_accounts || []).length === 0,
        } as any,
      ],
    }));
  };

  const updateBankAccount = (index: number, field: string, val: any) => {
    setFormData((prev) => {
      const updated = [...(prev.bank_accounts || [])];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, bank_accounts: updated };
    });
  };

  const removeBankAccount = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bank_accounts: (prev.bank_accounts || []).filter((_, idx) => idx !== index),
    }));
  };

  // ── Mutation: Submit Pengajuan ─────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () =>
      reRegistrationService.submitEssReRegistration({
        submission_notes: submissionNotes,
        proposed_data: formData,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'Pengajuan registrasi ulang berhasil dikirim untuk verifikasi HC.');
      queryClient.invalidateQueries({ queryKey: ['ess-current-data'] });
      queryClient.invalidateQueries({ queryKey: ['ess-history-data'] });
      setActiveTab('history');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Gagal mengirim pengajuan registrasi ulang.';
      toast.error(msg);
    },
  });

  // ── Mutation: Batal Pengajuan ──────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (id: number) => reRegistrationService.cancelEssReRegistration(id),
    onSuccess: () => {
      toast.success('Pengajuan registrasi ulang berhasil dibatalkan.');
      setIsCancelModalOpen(false);
      setTicketToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['ess-current-data'] });
      queryClient.invalidateQueries({ queryKey: ['ess-history-data'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Gagal membatalkan pengajuan.';
      toast.error(msg);
    },
  });

  // ── Render Loading ────────────────────────────────────────────────────────
  if (isLoadingCurrent) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-6 px-4">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ClipboardCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Registrasi Ulang Data Karyawan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulir pembaruan data mandiri karyawan terpadu: Penempatan, Biodata, Data Fisik APD, Keluarga, Payroll, dan Dokumen Standar.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'form'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Formulir Registrasi Ulang</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Riwayat Pengajuan Tiket</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: FORMULIR REGISTRASI ULANG
      ========================================================================= */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Status Tiket Pending Alert */}
          {pendingTicket && (
            <Alert variant="warning" className="border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      Anda Memiliki Tiket Pengajuan yang Sedang Diproses
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      Nomor Tiket: <span className="font-mono font-bold">{pendingTicket.ticket_number}</span> diajukan pada{' '}
                      {formatDate(pendingTicket.created_at)}. Pengajuan baru dapat dikirim setelah tiket ini disetujui/ditolak, atau Anda dapat membatalkannya.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedTicket(pendingTicket);
                      setIsDetailModalOpen(true);
                    }}
                    className="text-xs font-semibold"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Lihat Usulan
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setTicketToCancel(pendingTicket);
                      setIsCancelModalOpen(true);
                    }}
                    className="text-xs font-semibold"
                  >
                    Batalkan Tiket
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {/* ================= STICKY PROGRES PERSENTASE PENGISIAN & ANCHOR NAVIGATION ================= */}
          <div className="sticky top-16 z-30 mb-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md p-4 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center h-12 w-12 rounded-xl font-bold text-sm shadow-inner transition-colors ${
                    progressStats.percentage >= 85
                      ? 'bg-emerald-500 text-white'
                      : progressStats.percentage >= 50
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {progressStats.percentage}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Progres Kelengkapan Data Formulir
                    </span>
                    <Badge
                      variant={
                        progressStats.percentage >= 85
                          ? 'success'
                          : progressStats.percentage >= 50
                          ? 'primary'
                          : 'warning'
                      }
                      className="text-xs px-2.5 py-0.5"
                    >
                      {progressStats.percentage >= 85
                        ? 'Sangat Lengkap'
                        : progressStats.percentage >= 50
                        ? 'Hampir Lengkap'
                        : 'Data Awal'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {progressStats.filledCount} dari {progressStats.totalCount} parameter seksi formulir telah terisi
                  </p>
                </div>
              </div>

              {/* Quick Submit Button on Sticky Bar */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={submitMutation.isPending || !!pendingTicket}
                  onClick={() => submitMutation.mutate()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  {submitMutation.isPending ? (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {submitMutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
                </Button>
              </div>
            </div>

            {/* Progress Bar with smooth gradient */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 shadow-inner">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressStats.percentage >= 85
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : progressStats.percentage >= 50
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
                style={{ width: `${Math.max(5, progressStats.percentage)}%` }}
              />
            </div>

            {/* Horizontal Navigation Anchor Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-3 mt-1">
              {navSections.map((sec) => {
                const Icon = sec.icon;
                const isCurrent = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollTo(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                    <span>{sec.label}</span>
                    {sec.status && (
                      <CheckCircle2 className={`h-3 w-3 ${isCurrent ? 'text-emerald-200' : 'text-emerald-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Content Stacked Vertically */}
          <div className="space-y-8">
            {/* =========================================================================
                SECTION 1: PENEMPATAN & ORGANISASI (READ-ONLY)
            ========================================================================= */}
            <Card id="section-penempatan" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Penempatan & Struktur Organisasi
                      <Badge variant="success" className="text-xs px-2 py-0.5">
                        Resmi Terdaftar (Read-Only)
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Informasi penempatan, departemen, jabatan, dan status kerja resmi Anda di Human Capital.
                    </p>
                  </div>
                </div>
                <Building2 className="h-6 w-6 text-slate-400 hidden sm:block" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">NRP / NIK Karyawan</span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">{currentEmployee?.nrp || '-'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Perusahaan</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                    {currentEmployee?.company?.name || (currentEmployee?.site as any)?.company?.name || '-'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Site Operasional</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentEmployee?.site?.name || '-'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Departemen</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentEmployee?.department?.name || '-'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Jabatan / Posisi</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{currentEmployee?.position?.title || '-'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Pangkat & Level Jabatan</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {currentEmployee?.pangkat || (currentEmployee?.grade as any)?.pangkat || 'Staff'} (
                    {currentEmployee?.grade?.code || (currentEmployee?.position as any)?.grade?.code || '-'})
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Hubungan Kerja</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentEmployee?.employment_type?.name || '-'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="block text-[11px] font-semibold text-slate-400 uppercase">Tanggal Masuk (Hire Date)</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {currentEmployee?.hire_date ? formatDate(currentEmployee.hire_date) : '-'}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Parameter organisasi di atas bersifat resmi dan dikelola terpusat oleh tim Human Capital. Apabila terdapat ketidaksesuaian jabatan atau penempatan mutasi, silakan berkoordinasi langsung dengan bagian HC.
                </p>
              </div>
            </Card>

            {/* =========================================================================
                SECTION 2: BIODATA DIRI & ALAMAT LEGAL / DOMISILI
            ========================================================================= */}
            <Card id="section-biodata" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Biodata Diri & Alamat Legal / Domisili
                      {progressStats.sectionStatus.biodata && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Data pribadi, nomor identitas kependudukan, perpajakan, BPJS, kontak, dan alamat tempat tinggal.
                    </p>
                  </div>
                </div>
                <User className="h-6 w-6 text-slate-400 hidden sm:block" />
              </div>

              <div className="space-y-6">
                {/* Profil Pokok */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Profil Pokok Pribadi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nama Lengkap (Sesuai KTP)
                      </label>
                      <Input
                        value={currentEmployee?.name || ''}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900 font-medium"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Nama resmi terdaftar di SK Kepegawaian</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nama Panggilan (Nickname)
                      </label>
                      <Input
                        value={formData.nickname || ''}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        placeholder="Nama Panggilan"
                        inputCase="proper"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}
                      >
                        <option value="MALE">Laki-laki (MALE)</option>
                        <option value="FEMALE">Perempuan (FEMALE)</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tempat Lahir <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.birth_place || ''}
                        onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                        placeholder="Kota / Kabupaten Kelahiran"
                        inputCase="proper"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </label>
                      <DatePicker
                        value={formData.birth_date || ''}
                        onChange={(val) => setFormData({ ...formData, birth_date: val })}
                        placeholder="Pilih Tanggal Lahir"
                      />
                      {calculatedAge !== null && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                          Usia: {calculatedAge} Tahun
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Agama <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={formData.religion || 'ISLAM'}
                        onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                      >
                        {religions.map((r: any) => (
                          <option key={r.code} value={r.code}>
                            {r.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Status Pernikahan <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={formData.marital_status || ''}
                        onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                      >
                        <option value="">-- Pilih Status Pernikahan --</option>
                        {maritalStatuses.map((m: any) => (
                          <option key={m.code} value={m.code}>
                            {m.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    {isEmployeeMarried && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Tanggal Pernikahan
                        </label>
                        <DatePicker
                          value={formData.marriage_date || ''}
                          onChange={(val) => setFormData({ ...formData, marriage_date: val })}
                          placeholder="Pilih Tanggal Pernikahan"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Identitas Legal & BPJS */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Nomor Identitas Legal, Perpajakan & Asuransi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        NIK KTP (16 Digit) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.id_card_number || ''}
                        onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                        placeholder="16 digit NIK sesuai e-KTP"
                        maxLength={16}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nomor NPWP
                      </label>
                      <Input
                        value={formData.tax_number || ''}
                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                        placeholder="Nomor Pokok Wajib Pajak"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Status Pajak (PTKP)
                      </label>
                      <Select
                        value={formData.tax_status || ''}
                        onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
                      >
                        <option value="">-- Pilih Status Pajak / PTKP --</option>
                        {maritalStatuses.map((m: any) => (
                          <option key={m.code} value={m.code}>
                            {m.code} - {m.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        No. BPJS Ketenagakerjaan
                      </label>
                      <Input
                        value={formData.bpjs_ketenagakerjaan || ''}
                        onChange={(e) => setFormData({ ...formData, bpjs_ketenagakerjaan: e.target.value })}
                        placeholder="Nomor kartu BPJS TK / Jamsostek"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        No. BPJS Kesehatan
                      </label>
                      <Input
                        value={formData.bpjs_kesehatan || ''}
                        onChange={(e) => setFormData({ ...formData, bpjs_kesehatan: e.target.value })}
                        placeholder="Nomor kartu BPJS Kesehatan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        No. Asuransi Swasta / AdMedika
                      </label>
                      <Input
                        value={formData.insurance_admedika || ''}
                        onChange={(e) => setFormData({ ...formData, insurance_admedika: e.target.value })}
                        placeholder="Nomor kartu asuransi swasta"
                      />
                    </div>
                  </div>
                </div>

                {/* Kontak */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Informasi Kontak & Komunikasi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        No. Handphone / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        value={formData.phone_mobile || ''}
                        onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Telepon Rumah / Darurat
                      </label>
                      <Input
                        value={formData.phone_home || ''}
                        onChange={(e) => setFormData({ ...formData, phone_home: e.target.value })}
                        placeholder="Contoh: 0542-xxxxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Perusahaan
                      </label>
                      <Input
                        value={currentEmployee?.email_company || ''}
                        disabled
                        className="bg-slate-50 dark:bg-slate-900"
                        placeholder="nama@perusahaan.co.id"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Email Pribadi
                      </label>
                      <Input
                        type="email"
                        value={formData.email_personal || ''}
                        onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                        placeholder="email@pribadi.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Alamat Sesuai KTP */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Alamat Sesuai KTP (Legalitas)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Provinsi KTP
                      </label>
                      <Select
                        value={formData.ktp_province || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ktp_province: e.target.value,
                            ktp_city: '',
                            ktp_district: '',
                            ktp_village: '',
                          })
                        }
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {INDONESIA_PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kota / Kabupaten KTP
                      </label>
                      <Select
                        value={formData.ktp_city || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ktp_city: e.target.value,
                            ktp_district: '',
                            ktp_village: '',
                          })
                        }
                        disabled={!formData.ktp_province}
                      >
                        <option value="">-- Pilih Kota / Kab --</option>
                        {ktpCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kecamatan KTP
                      </label>
                      <Select
                        value={formData.ktp_district || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ktp_district: e.target.value,
                            ktp_village: '',
                          })
                        }
                        disabled={!formData.ktp_city}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {ktpDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Kelurahan / Desa
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomKtpVillage(!customKtpVillage)}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          {customKtpVillage ? 'Pilih Daftar' : 'Input Manual'}
                        </button>
                      </div>
                      {customKtpVillage ? (
                        <Input
                          value={formData.ktp_village || ''}
                          onChange={(e) => setFormData({ ...formData, ktp_village: e.target.value })}
                          placeholder="Ketik nama Desa / Kelurahan"
                          inputCase="proper"
                        />
                      ) : (
                        <Select
                          value={formData.ktp_village || ''}
                          onChange={(e) => setFormData({ ...formData, ktp_village: e.target.value })}
                          disabled={!formData.ktp_district}
                        >
                          <option value="">-- Pilih Kelurahan / Desa --</option>
                          {ktpVillages.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kode Pos KTP
                      </label>
                      <Input
                        value={formData.ktp_postal_code || ''}
                        onChange={(e) => setFormData({ ...formData, ktp_postal_code: e.target.value })}
                        placeholder="5 digit kode pos"
                        maxLength={5}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Alamat Lengkap Sesuai KTP (Jalan, RT/RW, No. Rumah) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.ktp_address || ''}
                      onChange={(e) => setFormData({ ...formData, ktp_address: e.target.value })}
                      placeholder="Nama jalan, RT/RW, nomor rumah / blok..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Alamat Domisili */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Alamat Domisili (Tempat Tinggal Saat Ini)
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyKtpToResidential}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Salin dari Alamat KTP
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Provinsi Domisili
                      </label>
                      <Select
                        value={formData.residential_province || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            residential_province: e.target.value,
                            residential_city: '',
                            residential_district: '',
                            residential_village: '',
                          })
                        }
                      >
                        <option value="">-- Pilih Provinsi --</option>
                        {INDONESIA_PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kota / Kabupaten Domisili
                      </label>
                      <Select
                        value={formData.residential_city || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            residential_city: e.target.value,
                            residential_district: '',
                            residential_village: '',
                          })
                        }
                        disabled={!formData.residential_province}
                      >
                        <option value="">-- Pilih Kota / Kab --</option>
                        {resCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kecamatan Domisili
                      </label>
                      <Select
                        value={formData.residential_district || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            residential_district: e.target.value,
                            residential_village: '',
                          })
                        }
                        disabled={!formData.residential_city}
                      >
                        <option value="">-- Pilih Kecamatan --</option>
                        {resDistricts.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Kelurahan / Desa
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomResidentialVillage(!customResidentialVillage)}
                          className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                        >
                          {customResidentialVillage ? 'Pilih Daftar' : 'Input Manual'}
                        </button>
                      </div>
                      {customResidentialVillage ? (
                        <Input
                          value={formData.residential_village || ''}
                          onChange={(e) => setFormData({ ...formData, residential_village: e.target.value })}
                          placeholder="Ketik nama Desa / Kelurahan"
                          inputCase="proper"
                        />
                      ) : (
                        <Select
                          value={formData.residential_village || ''}
                          onChange={(e) => setFormData({ ...formData, residential_village: e.target.value })}
                          disabled={!formData.residential_district}
                        >
                          <option value="">-- Pilih Kelurahan / Desa --</option>
                          {resVillages.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Kode Pos Domisili
                      </label>
                      <Input
                        value={formData.residential_postal_code || ''}
                        onChange={(e) => setFormData({ ...formData, residential_postal_code: e.target.value })}
                        placeholder="5 digit kode pos"
                        maxLength={5}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Alamat Lengkap Domisili (Tempat Tinggal Saat Ini)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.residential_address || ''}
                      onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                      placeholder="Nama jalan, perumahan, kost/mess, RT/RW, nomor kamar/rumah..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* =========================================================================
                SECTION 3: DATA FISIK & APD
            ========================================================================= */}
            <Card id="section-fisik" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                    3
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Data Fisik & Ukuran APD
                      {progressStats.sectionStatus.fisik && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Spesifikasi ukuran seragam, celana kerja, sepatu safety, dan catatan keselamatan kerja / kesehatan.
                    </p>
                  </div>
                </div>
                <HardHat className="h-6 w-6 text-slate-400 hidden sm:block" />
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Golongan Darah <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.health_safety?.blood_type || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, blood_type: e.target.value },
                        })
                      }
                    >
                      <option value="">-- Pilih Golongan Darah --</option>
                      {bloodTypes.map((b: any) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Rhesus
                    </label>
                    <Select
                      value={formData.health_safety?.rhesus || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, rhesus: e.target.value },
                        })
                      }
                    >
                      <option value="">-- Pilih Rhesus --</option>
                      <option value="+">Positif (+)</option>
                      <option value="-">Negatif (-)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tinggi Badan (cm)
                    </label>
                    <Input
                      type="number"
                      value={formData.health_safety?.height_cm ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: {
                            ...formData.health_safety,
                            height_cm: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="Contoh: 170"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Berat Badan (kg)
                    </label>
                    <Input
                      type="number"
                      value={formData.health_safety?.weight_kg ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: {
                            ...formData.health_safety,
                            weight_kg: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                      placeholder="Contoh: 65"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ukuran Baju / Seragam <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.health_safety?.shirt_size || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, shirt_size: e.target.value },
                        })
                      }
                    >
                      <option value="">-- Pilih Ukuran Baju --</option>
                      {uniformSizes.map((u: any) => (
                        <option key={u.code} value={u.code}>
                          {u.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ukuran Celana Kerja <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.health_safety?.pants_size || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, pants_size: e.target.value },
                        })
                      }
                    >
                      <option value="">-- Pilih Ukuran Celana --</option>
                      {pantsSizes.map((p: any) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ukuran Sepatu Safety <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.health_safety?.safety_shoe_size || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, safety_shoe_size: e.target.value },
                        })
                      }
                    >
                      <option value="">-- Pilih Ukuran Sepatu --</option>
                      {shoeSizes.map((s: any) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ukuran Wearpack / Coverall
                    </label>
                    <Input
                      value={formData.health_safety?.coverall_size || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, coverall_size: e.target.value },
                        })
                      }
                      placeholder="S, M, L, XL, XXL..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Catatan Medis Khusus / Alergi / Kondisi Tertentu
                  </label>
                  <textarea
                    rows={2}
                    value={formData.health_safety?.medical_notes || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health_safety: { ...formData.health_safety, medical_notes: e.target.value },
                      })
                    }
                    placeholder="Riwayat alergi obat/makanan, asma, riwayat operasi, dll. (Kosongkan jika tidak ada)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </Card>

            {/* =========================================================================
                SECTION 4: KELUARGA & TANGGUNGAN ASURANSI
            ========================================================================= */}
            <Card id="section-keluarga" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">
                    4
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Data Keluarga & Tanggungan Asuransi
                      <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                        {(formData.families || []).length} Anggota
                      </Badge>
                      {familyCompliance.isComplete && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Wajib mengisi Ayah & Ibu Kandung. Jika berstatus Menikah, wajib tambahan Pasangan (Istri/Suami), Ayah & Ibu Mertua. Pengisian anak disesuaikan tanggungan pajak ({formData.tax_status || 'PTKP'}).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyFamilyRequirementsTemplate}
                    className="text-xs font-semibold border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                    Siapkan Baris Keluarga Wajib
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFamilyMember}
                    className="text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Anggota
                  </Button>
                </div>
              </div>

              {/* Checklist Status Kepatuhan Ketentuan Wajib Keluarga */}
              <div
                className={`p-4 rounded-xl border transition-all mb-6 ${
                  familyCompliance.isComplete
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    {familyCompliance.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        Ketentuan Wajib Data Keluarga
                        <Badge
                          variant={familyCompliance.isComplete ? 'success' : 'warning'}
                          className="text-[10px] py-0 px-2 font-semibold"
                        >
                          {familyCompliance.isComplete ? 'Lengkap & Sesuai Ketentuan' : 'Belum Lengkap'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ayah & Ibu kandung wajib diisi.{' '}
                        {isEmployeeMarried
                          ? 'Kategori Menikah wajib mencakup Pasangan & Kedua Mertua. '
                          : ''}
                        {requiredChildCount > 0
                          ? `Status Pajak ${formData.tax_status} mewajibkan minimal ${requiredChildCount} anak.`
                          : 'Tanggungan anak sesuai status pajak.'}
                      </p>
                    </div>
                  </div>

                  {!familyCompliance.isComplete && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyFamilyRequirementsTemplate}
                      className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Isi Otomatis Baris Wajib
                    </Button>
                  )}
                </div>

                {/* Badges Checklist Kepatuhan */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 text-xs">
                  {/* 1. Ayah Kandung */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                      familyCompliance.hasFather
                        ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                        : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-medium">Ayah Kandung</span>
                    {familyCompliance.hasFather ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    ) : (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        Wajib
                      </span>
                    )}
                  </div>

                  {/* 2. Ibu Kandung */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                      familyCompliance.hasMother
                        ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                        : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-medium">Ibu Kandung</span>
                    {familyCompliance.hasMother ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    ) : (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        Wajib
                      </span>
                    )}
                  </div>

                  {/* 3. Pasangan (jika menikah) */}
                  {isEmployeeMarried && (
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                        familyCompliance.hasSpouse
                          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                          : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-medium">Istri / Suami</span>
                      {familyCompliance.hasSpouse ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          Wajib
                        </span>
                      )}
                    </div>
                  )}

                  {/* 4. Ayah Mertua (jika menikah) */}
                  {isEmployeeMarried && (
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                        familyCompliance.hasFatherInLaw
                          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                          : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-medium">Ayah Mertua</span>
                      {familyCompliance.hasFatherInLaw ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          Wajib
                        </span>
                      )}
                    </div>
                  )}

                  {/* 5. Ibu Mertua (jika menikah) */}
                  {isEmployeeMarried && (
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                        familyCompliance.hasMotherInLaw
                          ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                          : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-medium">Ibu Mertua</span>
                      {familyCompliance.hasMotherInLaw ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          Wajib
                        </span>
                      )}
                    </div>
                  )}

                  {/* 6. Anak Sesuai Tanggungan Pajak */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                      familyCompliance.hasRequiredChildren
                        ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                        : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-medium truncate mr-1">
                      Anak ({familyCompliance.childrenCount}/{requiredChildCount})
                    </span>
                    {familyCompliance.hasRequiredChildren ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                    ) : (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                        Kurang {requiredChildCount - familyCompliance.childrenCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(formData.families || []).length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                  <Heart className="h-10 w-10 text-rose-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Data Keluarga Masih Kosong
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    Sesuai ketentuan, karyawan wajib mengisi data Ayah & Ibu Kandung
                    {isEmployeeMarried ? ', serta Pasangan dan Kedua Mertua untuk status Menikah' : ''}
                    {requiredChildCount > 0
                      ? `, dan ${requiredChildCount} data anak sesuai status pajak (${formData.tax_status})`
                      : ''}
                    .
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyFamilyRequirementsTemplate}
                      className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Siapkan Baris Keluarga Wajib Otomatis
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFamilyMember}
                      className="text-xs font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Tambah Manual
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(formData.families || []).map((fam: any, idx: number) => {
                    const isDependent = fam.relation_type === 'SPOUSE' || fam.relation_type === 'CHILD';

                    const relationBadge =
                      fam.relation_type === 'FATHER'
                        ? {
                            label: 'Wajib Umum (Ayah)',
                            className: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300',
                          }
                        : fam.relation_type === 'MOTHER'
                        ? {
                            label: 'Wajib Umum (Ibu)',
                            className: 'border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300',
                          }
                        : fam.relation_type === 'SPOUSE'
                        ? {
                            label: 'Wajib (Menikah)',
                            className: 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300',
                          }
                        : fam.relation_type === 'FATHER_IN_LAW'
                        ? {
                            label: 'Wajib (Ayah Mertua)',
                            className: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                          }
                        : fam.relation_type === 'MOTHER_IN_LAW'
                        ? {
                            label: 'Wajib (Ibu Mertua)',
                            className: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300',
                          }
                        : fam.relation_type === 'CHILD'
                        ? {
                            label: `Tanggungan (${formData.tax_status || 'Pajak'})`,
                            className: 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
                          }
                        : null;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 relative space-y-4"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="h-6 w-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {fam.relation_type === 'FATHER'
                                ? 'Ayah Kandung'
                                : fam.relation_type === 'MOTHER'
                                ? 'Ibu Kandung'
                                : fam.relation_type === 'SPOUSE'
                                ? 'Pasangan (Istri / Suami)'
                                : fam.relation_type === 'FATHER_IN_LAW'
                                ? 'Ayah Mertua'
                                : fam.relation_type === 'MOTHER_IN_LAW'
                                ? 'Ibu Mertua'
                                : fam.relation_type === 'CHILD'
                                ? `Anak ke-${fam.child_order || idx}`
                                : fam.relation_type || 'Anggota Keluarga'}
                            </span>
                            {relationBadge && (
                              <Badge variant="outline" className={`text-[10px] py-0.5 px-2 ${relationBadge.className}`}>
                                {relationBadge.label}
                              </Badge>
                            )}
                            {isDependent && (
                              <Badge variant="primary" className="text-xs py-0.5 px-2">
                                Tanggungan BPJS Kes
                              </Badge>
                            )}
                            {isStaff && isDependent && (
                              <Badge variant="warning" className="text-xs py-0.5 px-2">
                                Asuransi Staff
                              </Badge>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = (formData.families || []).filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, families: updated });
                            }}
                            className="text-rose-500 hover:text-rose-700 h-7 w-7 p-0 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Hubungan Keluarga <span className="text-rose-500">*</span>
                            </label>
                            <Select
                              value={fam.relation_type || 'FATHER'}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...(formData.families || [])];
                                updated[idx].relation_type = val as any;
                                if (val === 'FATHER' || val === 'FATHER_IN_LAW') {
                                  updated[idx].gender = 'MALE';
                                } else if (val === 'MOTHER' || val === 'MOTHER_IN_LAW') {
                                  updated[idx].gender = 'FEMALE';
                                } else if (val === 'SPOUSE') {
                                  updated[idx].gender = formData.gender === 'FEMALE' ? 'MALE' : 'FEMALE';
                                } else if (val === 'CHILD' && !updated[idx].child_order) {
                                  const childCount = updated.filter((f: any) => f.relation_type === 'CHILD').length;
                                  updated[idx].child_order = childCount;
                                }
                                setFormData({ ...formData, families: updated });
                              }}
                            >
                              <option value="FATHER">Ayah Kandung (Wajib)</option>
                              <option value="MOTHER">Ibu Kandung (Wajib)</option>
                              <option value="SPOUSE">Istri / Suami (Wajib jika Menikah)</option>
                              <option value="FATHER_IN_LAW">Ayah Mertua (Wajib jika Menikah)</option>
                              <option value="MOTHER_IN_LAW">Ibu Mertua (Wajib jika Menikah)</option>
                              <option value="CHILD">Anak (Sesuai Tanggungan Pajak)</option>
                              <option value="OTHER">Lainnya</option>
                            </Select>
                          </div>

                          {fam.relation_type === 'CHILD' && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Urutan Anak Ke-
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={fam.child_order || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.families || [])];
                                  updated[idx].child_order = e.target.value ? parseInt(e.target.value, 10) : null;
                                  setFormData({ ...formData, families: updated });
                                }}
                                placeholder="Contoh: 1"
                              />
                            </div>
                          )}

                          <div className={fam.relation_type === 'CHILD' ? 'md:col-span-2' : 'md:col-span-3'}>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Nama Lengkap Anggota Keluarga <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={fam.name || ''}
                              onChange={(e) => {
                                const updated = [...(formData.families || [])];
                                updated[idx].name = e.target.value;
                                setFormData({ ...formData, families: updated });
                              }}
                              placeholder="Nama lengkap sesuai KTP / Akta"
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Jenis Kelamin
                            </label>
                            <Select
                              value={fam.gender || 'FEMALE'}
                              onChange={(e) => {
                                const updated = [...(formData.families || [])];
                                updated[idx].gender = e.target.value as any;
                                setFormData({ ...formData, families: updated });
                              }}
                            >
                              <option value="MALE">Laki-laki</option>
                              <option value="FEMALE">Perempuan</option>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tempat Lahir <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={fam.birth_place || ''}
                              onChange={(e) => {
                                const updated = [...(formData.families || [])];
                                updated[idx].birth_place = e.target.value;
                                setFormData({ ...formData, families: updated });
                              }}
                              placeholder="Kota kelahiran"
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tanggal Lahir <span className="text-rose-500">*</span>
                            </label>
                            <DatePicker
                              value={fam.birth_date ? fam.birth_date.split('T')[0] : ''}
                              onChange={(val) => {
                                const updated = [...(formData.families || [])];
                                updated[idx].birth_date = val;
                                setFormData({ ...formData, families: updated });
                              }}
                              placeholder="Pilih Tanggal Lahir"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              NIK KTP / No. KIA <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={fam.id_card_number || ''}
                              onChange={(e) => {
                                const updated = [...(formData.families || [])];
                                updated[idx].id_card_number = e.target.value;
                                setFormData({ ...formData, families: updated });
                              }}
                              placeholder="16 Digit NIK"
                              inputCase="upper"
                            />
                          </div>
                        </div>

                        {/* Jaminan Kesehatan Keluarga (BPJS Kesehatan & Asuransi Swasta jika Staff) */}
                        {isDependent && (
                          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-950/40 p-3 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                  <span>No. BPJS Kesehatan</span>
                                  <Badge variant="outline" className="text-xs py-0.5 px-2 text-emerald-600 dark:text-emerald-400">
                                    Wajib Diisi
                                  </Badge>
                                </label>
                                <Input
                                  value={fam.bpjs_kesehatan_no || ''}
                                  onChange={(e) => {
                                    const updated = [...(formData.families || [])];
                                    updated[idx].bpjs_kesehatan_no = e.target.value;
                                    updated[idx].health_provider_no = e.target.value;
                                    setFormData({ ...formData, families: updated });
                                  }}
                                  placeholder="Nomor kartu BPJS Kesehatan keluarga"
                                  inputCase="upper"
                                />
                              </div>

                              {isStaff ? (
                                <div>
                                  <label className="block text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                                    <span>No. Asuransi Swasta (Staff Entitled)</span>
                                    <Badge variant="primary" className="text-xs py-0.5 px-2">
                                      Pangkat Staff
                                    </Badge>
                                  </label>
                                  <Input
                                    value={fam.insurance_no || ''}
                                    onChange={(e) => {
                                      const updated = [...(formData.families || [])];
                                      updated[idx].insurance_no = e.target.value;
                                      setFormData({ ...formData, families: updated });
                                    }}
                                    placeholder="Nomor polis / kartu asuransi swasta"
                                    inputCase="upper"
                                    className="border-indigo-300 dark:border-indigo-700 focus:ring-indigo-500"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-slate-400 italic pt-6">
                                  ℹ️ Kolom No. Asuransi Swasta hanya berlaku untuk pangkat karyawan Staff.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* =========================================================================
                SECTION 5: REKENING & PAYROLL
            ========================================================================= */}
            <Card id="section-payroll" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                    5
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Rekening Bank & Payroll
                      {progressStats.sectionStatus.payroll && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Informasi rekening bank penerima transfer penggajian (payroll) dan reimbursement operasional.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBankAccount}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                  Tambah Rekening
                </Button>
              </div>

              {(formData.bank_accounts || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-2xl">
                  Belum ada nomor rekening bank yang terdaftar. Klik tombol di atas untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-4">
                  {(formData.bank_accounts || []).map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {b.bank_name || 'Bank'} - {b.account_number || 'Nomor Rekening'}
                          </span>
                          {b.is_primary && (
                            <Badge variant="success" className="text-[10px] px-2 py-0.2">
                              Rekening Utama Payroll
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(idx)}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Bank <span className="text-rose-500">*</span>
                          </label>
                          <Select
                            value={b.bank_name || ''}
                            onChange={(e) => updateBankAccount(idx, 'bank_name', e.target.value)}
                          >
                            <option value="">-- Pilih Bank --</option>
                            {banks.map((bnk: any) => (
                              <option key={bnk.code} value={bnk.code}>
                                {bnk.name} ({bnk.code})
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nomor Rekening <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            value={b.account_number || ''}
                            onChange={(e) => updateBankAccount(idx, 'account_number', e.target.value)}
                            placeholder="Nomor rekening tanpa spasi"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Pemilik Rekening <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            value={b.account_holder_name || ''}
                            onChange={(e) => updateBankAccount(idx, 'account_holder_name', e.target.value)}
                            placeholder="Nama sesuai buku tabungan"
                            inputCase="proper"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Kantor Cabang Bank
                          </label>
                          <Input
                            value={b.branch || ''}
                            onChange={(e) => updateBankAccount(idx, 'branch', e.target.value)}
                            placeholder="Contoh: KCU Balikpapan"
                            inputCase="proper"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(b.is_primary)}
                            onChange={(e) => {
                              const updated = (formData.bank_accounts || []).map((item: any, i: number) => ({
                                ...item,
                                is_primary: i === idx ? e.target.checked : false,
                              }));
                              setFormData({ ...formData, bank_accounts: updated });
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span>Jadikan Rekening Utama untuk Payroll Penggajian</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* =========================================================================
                SECTION 6: PENDIDIKAN & KONTAK DARURAT
            ========================================================================= */}
            <Card id="section-pendidikan" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    6
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Riwayat Pendidikan Formal & Kontak Darurat
                      {progressStats.sectionStatus.pendidikan && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Riwayat jenjang pendidikan formal yang pernah ditempuh dan narahubung darurat yang dapat dihubungi saat kondisi krisis.
                    </p>
                  </div>
                </div>
                <GraduationCap className="h-6 w-6 text-slate-400 hidden sm:block" />
              </div>

              {/* Sub-seksi 6A: Riwayat Pendidikan Formal */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    Riwayat Pendidikan Formal
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEducation}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                    Tambah Pendidikan
                  </Button>
                </div>

                {(formData.educations || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                    Belum ada riwayat pendidikan formal yang ditambahkan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.educations || []).map((edu: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {edu.institution_name || 'Institusi Pendidikan'} ({edu.education_level || '-'})
                            </span>
                            {edu.is_highest && (
                              <Badge variant="primary" className="text-[10px] px-2 py-0.2">
                                Pendidikan Terakhir
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEducation(idx)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Jenjang <span className="text-rose-500">*</span>
                            </label>
                            <Select
                              value={edu.education_level || ''}
                              onChange={(e) => updateEducation(idx, 'education_level', e.target.value)}
                            >
                              <option value="">-- Pilih Jenjang --</option>
                              {educationsList.map((ed: any) => (
                                <option key={ed.code} value={ed.code}>
                                  {ed.name}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Nama Sekolah / Universitas <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={edu.institution_name || ''}
                              onChange={(e) => updateEducation(idx, 'institution_name', e.target.value)}
                              placeholder="Nama sekolah / perguruan tinggi"
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Jurusan / Program Studi
                            </label>
                            <Input
                              value={edu.major || ''}
                              onChange={(e) => updateEducation(idx, 'major', e.target.value)}
                              placeholder="Teknik Mesin, IPA, dll."
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tahun Lulus
                            </label>
                            <Input
                              type="number"
                              value={edu.year_end || ''}
                              onChange={(e) => updateEducation(idx, 'year_end', Number(e.target.value))}
                              placeholder="Contoh: 2020"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(edu.is_highest)}
                              onChange={(e) => {
                                const updated = (formData.educations || []).map((item: any, i: number) => ({
                                  ...item,
                                  is_highest: i === idx ? e.target.checked : false,
                                }));
                                setFormData({ ...formData, educations: updated });
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span>Pendidikan Tertinggi / Terakhir yang Diakui</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-seksi 6B: Kontak Darurat */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4 text-indigo-500" />
                    Kontak Darurat (Emergency Contact)
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmergencyContact}
                    className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800 text-xs font-semibold cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                    Tambah Kontak Darurat
                  </Button>
                </div>

                {(formData.emergency_contacts || []).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                    Belum ada narahubung darurat yang ditambahkan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(formData.emergency_contacts || []).map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4 relative"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {c.name || 'Kontak Darurat'} ({c.relationship || '-'})
                            </span>
                            {c.is_primary && (
                              <Badge variant="primary" className="text-[10px] px-2 py-0.2">
                                Kontak Utama
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmergencyContact(idx)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Hapus
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Nama Lengkap Kontak <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={c.name || ''}
                              onChange={(e) => updateEmergencyContact(idx, 'name', e.target.value)}
                              placeholder="Nama keluarga / kerabat"
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Hubungan <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={c.relationship || ''}
                              onChange={(e) => updateEmergencyContact(idx, 'relationship', e.target.value)}
                              placeholder="Istri, Suami, Ayah, Saudara..."
                              inputCase="proper"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
                            </label>
                            <Input
                              value={c.phone_number || ''}
                              onChange={(e) => updateEmergencyContact(idx, 'phone_number', e.target.value)}
                              placeholder="08xxxxxxxxxx"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={Boolean(c.is_primary)}
                              onChange={(e) => {
                                const updated = (formData.emergency_contacts || []).map((item: any, i: number) => ({
                                  ...item,
                                  is_primary: i === idx ? e.target.checked : false,
                                }));
                                setFormData({ ...formData, emergency_contacts: updated });
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <span>Jadikan Kontak Darurat Utama (Pertama Kali Dihubungi)</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* =========================================================================
                SECTION 7: UPLOAD DOKUMEN STANDAR
            ========================================================================= */}
            <Card id="section-dokumen" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold">
                    7
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Upload Dokumen Standar Terdaftar
                      {progressStats.sectionStatus.dokumen && (
                        <Badge variant="success" className="text-xs px-2 py-0.5">
                          Lengkap
                        </Badge>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Daftar arsip dokumen legalitas, identitas e-KTP, Kartu Keluarga, NPWP, Buku Tabungan, dan Ijazah Anda.
                    </p>
                  </div>
                </div>
                <FileText className="h-6 w-6 text-slate-400 hidden sm:block" />
              </div>

              {documentTypes.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-xl">
                  Memuat master standar referensi dokumen...
                </div>
              ) : (
                <div className="space-y-4">
                  {documentTypes.map((docType) => {
                    const existingDoc = (currentEmployee?.documents || []).find(
                      (d: any) => d.document_type_id === docType.id
                    );
                    const isUploaded = !!existingDoc;

                    return (
                      <div
                        key={docType.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isUploaded
                            ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                            : docType.required
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                            : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2.5 rounded-xl flex items-center justify-center ${
                                isUploaded
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {isUploaded ? <FileCheck className="h-5 w-5" /> : <File className="h-5 w-5" />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {docType.name}
                                </span>
                                <span className="text-xs font-mono text-slate-400">({docType.code})</span>
                                {docType.required ? (
                                  <Badge variant="danger" className="text-[10px] px-2 py-0.2">
                                    Wajib
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.2 text-slate-400">
                                    Opsional
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {isUploaded
                                  ? `Terunggah: ${existingDoc.document_number || 'Berkas Terlampir'} (${formatDate(
                                      existingDoc.created_at || existingDoc.updated_at
                                    )})`
                                  : 'Belum ada berkas terunggah pada sistem.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {isUploaded && existingDoc.file_path && (
                              <a
                                href={existingDoc.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Lihat Berkas
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* =========================================================================
                BOTTOM SUBMISSION BOX
            ========================================================================= */}
            <Card className="p-6 rounded-2xl border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Konfirmasi Pengajuan Registrasi Ulang Mandiri
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Data yang Anda ubah akan dicatat sebagai usulan registrasi ulang dan diteruskan ke tim Human Capital untuk diverifikasi dan disetujui sebelum diperbarui pada data master kepegawaian.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Pengajuan Tambahan untuk Verifikator HC (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Tuliskan keterangan jika ada perubahan penting, misalnya: 'Pembaruan nomor rekening bank baru karena kartu hilang', 'Penambahan anggota keluarga anak kedua', dll."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-blue-100 dark:border-blue-900/50">
                <span className="text-xs text-slate-500">
                  Pastikan seluruh data yang Anda masukkan adalah data faktual dan valid.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Kembalikan isian ke data asli terdaftar saat ini?')) {
                        refetchCurrent();
                      }
                    }}
                    className="w-full sm:w-auto text-xs font-semibold"
                  >
                    Reset Perubahan
                  </Button>

                  <Button
                    type="button"
                    disabled={submitMutation.isPending || !!pendingTicket}
                    onClick={() => submitMutation.mutate()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                  >
                    {submitMutation.isPending ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {submitMutation.isPending ? 'Mengirim...' : 'Kirim Pengajuan Registrasi Ulang'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RIWAYAT PENGAJUAN TIKET REGISTRASI ULANG
      ========================================================================= */}
      {activeTab === 'history' && (
        <Card className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Riwayat Pengajuan Tiket Registrasi Ulang
              </h2>
              <p className="text-xs text-slate-500">
                Pantau status verifikasi dan persetujuan pengajuan registrasi ulang data yang telah Anda kirimkan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchHistory()}
              className="text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>

          {isLoadingHistory ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (historyData?.data?.data || []).length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Clock className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold">Belum Ada Riwayat Pengajuan</p>
              <p className="text-xs mt-1">Anda belum pernah mengajukan tiket registrasi ulang data mandiri.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 text-left">No. Tiket</th>
                    <th className="py-3 px-4 text-left">Tanggal Pengajuan</th>
                    <th className="py-3 px-4 text-left">Catatan Karyawan</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Verifikator HC</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(historyData?.data?.data || []).map((ticket: EmployeeReregistration) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {ticket.ticket_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {ticket.submission_notes || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {ticket.status === 'PENDING' && (
                          <Badge variant="warning" className="text-xs px-2.5 py-0.5">
                            Menunggu Verifikasi
                          </Badge>
                        )}
                        {ticket.status === 'APPROVED' && (
                          <Badge variant="success" className="text-xs px-2.5 py-0.5">
                            Disetujui
                          </Badge>
                        )}
                        {ticket.status === 'REJECTED' && (
                          <Badge variant="danger" className="text-xs px-2.5 py-0.5">
                            Ditolak
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {ticket.reviewer?.name || '-'}
                        {ticket.reviewed_at && (
                          <span className="block text-[10px] text-slate-400">
                            {formatDate(ticket.reviewed_at)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setIsDetailModalOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Detail
                          </Button>
                          {ticket.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setTicketToCancel(ticket);
                                setIsCancelModalOpen(true);
                              }}
                              className="h-8 px-2.5 text-xs font-semibold"
                            >
                              Batal
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* =========================================================================
          MODAL: DETAIL USULAN TIKET
      ========================================================================= */}
      {selectedTicket && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detail Usulan Tiket: ${selectedTicket.ticket_number}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Status Tiket:</span>
                <div className="mt-0.5">
                  {selectedTicket.status === 'PENDING' && (
                    <Badge variant="warning">Menunggu Verifikasi</Badge>
                  )}
                  {selectedTicket.status === 'APPROVED' && (
                    <Badge variant="success">Disetujui HC</Badge>
                  )}
                  {selectedTicket.status === 'REJECTED' && (
                    <Badge variant="danger">Ditolak HC</Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Diajukan Pada:</span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {formatDate(selectedTicket.created_at)}
                </p>
              </div>
            </div>

            {selectedTicket.submission_notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Catatan Karyawan</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {selectedTicket.submission_notes}
                </p>
              </div>
            )}

            {selectedTicket.review_notes && (
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                  Catatan dari Verifikator HC
                </span>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1">
                  {selectedTicket.review_notes}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Data Perubahan yang Diusulkan
              </h4>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(selectedTicket.proposed_data, null, 2)}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: KONFIRMASI BATAL PENGAJUAN
      ========================================================================= */}
      {ticketToCancel && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Batalkan Pengajuan Registrasi Ulang"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Apakah Anda yakin ingin membatalkan tiket pengajuan registrasi ulang{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {ticketToCancel.ticket_number}
              </span>
              ? Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
              >
                Kembali
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(ticketToCancel.id)}
              >
                {cancelMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan Tiket'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
