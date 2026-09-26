'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  GraduationCap,
  PhoneCall,
  HardHat,
  User,
  Copy,
  Save,
  FileText,
  AlertCircle,
  Calendar,
  Heart,
  UploadCloud,
  FileCheck,
  Eye,
  Download,
  File,
  Check,
  Activity,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import {
  companyService,
  siteService,
  departmentService,
  sectionService,
  positionService,
  jobGradeService,
  salaryGradeService,
  jenjangService,
  employmentTypeService,
  referenceDataService,
} from '@/services/masterDataService';
import {
  Employee,
  MasterCompany,
  MasterSite,
  MasterDepartment,
  MasterSection,
  PositionItem,
  GradeItem,
  SalaryGradeItem,
  SalaryGradeJenjangItem,
  EmploymentTypeItem,
  DocumentType,
  EmployeeDocument
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/stores/alertStore';
import { INDONESIA_PROVINCES, getCitiesByProvince, getDistrictsByCity, getVillagesByDistrict } from '@/lib/indonesiaRegions';

interface EmployeeFormProps {
  mode: 'create' | 'edit';
  employeeId?: number;
}

interface StagedDoc {
  file: File | null;
  document_number: string;
  expiry_date: string;
  notes: string;
}

export default function EmployeeForm({ mode, employeeId }: EmployeeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Active section for smooth scroll highlighting
  const [activeSection, setActiveSection] = useState('section-penempatan');

  // Preview file state
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    nrp: '',
    name: '',
    nickname: '',
    gender: '',
    birth_place: '',
    birth_date: '',
    religion: '',
    marital_status: '',
    marriage_date: '',
    id_card_number: '',
    tax_number: '',
    tax_status: '',
    bpjs_ketenagakerjaan: '',
    bpjs_kesehatan: '',
    insurance_admedika: '',
    email_company: '',
    email_personal: '',
    phone_mobile: '',
    phone_home: '',
    ktp_address: '',
    ktp_city: '',
    ktp_district: '',
    ktp_village: '',
    ktp_province: '',
    ktp_postal_code: '',
    residential_address: '',
    residential_city: '',
    residential_district: '',
    residential_village: '',
    residential_province: '',
    residential_postal_code: '',
    company_id: '',
    site_id: '',
    department_id: '',
    section_id: '',
    position_id: '',
    pangkat: '',
    grade_id: '',
    salary_grade_id: '',
    salary_grade_jenjang_id: '',
    employment_type_id: '',
    poh: '',
    work_area: '',
    hire_date: '',
    probation_end_date: '',
    contract_end_date: '',
    employment_status: '',
    health_safety: {
      blood_type: '',
      rhesus: '',
      height_cm: '',
      weight_kg: '',
      shirt_size: '',
      pants_size: '',
      safety_shoe_size: '',
      coverall_size: '',
      medical_notes: '',
    },
    families: [] as any[],
    educations: [] as any[],
    emergency_contacts: [] as any[],
    bank_accounts: [] as any[],
  });

  // Staged documents map: document_type_id -> StagedDoc
  const [stagedDocs, setStagedDocs] = useState<Record<number, StagedDoc>>({});

  // Direct upload in-progress tracking
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null);

  // Toggle mode input desa manual jika tidak ada di daftar inline
  const [customKtpVillage, setCustomKtpVillage] = useState(false);
  const [customResidentialVillage, setCustomResidentialVillage] = useState(false);

  // Load Existing Employee if Edit Mode
  const { data: existingData, isLoading: isLoadingEmployee, refetch: refetchEmployee } = useQuery({
    queryKey: ['employee-detail', employeeId],
    queryFn: () => employeeService.getEmployee(employeeId!),
    enabled: mode === 'edit' && !!employeeId,
  });

  // Populate data when editing
  useEffect(() => {
    if (mode === 'edit' && existingData?.data) {
      const emp: Employee = existingData.data;
      setFormData({
        nrp: emp.nrp || '',
        name: emp.name || '',
        nickname: emp.nickname || '',
        gender: emp.gender || '',
        birth_place: emp.birth_place || '',
        birth_date: emp.birth_date ? emp.birth_date.split('T')[0] : '',
        religion: emp.religion || '',
        marital_status: emp.marital_status || '',
        marriage_date: emp.marriage_date ? emp.marriage_date.split('T')[0] : '',
        id_card_number: emp.id_card_number || '',
        tax_number: emp.tax_number || '',
        tax_status: emp.tax_status || '',
        bpjs_ketenagakerjaan: emp.bpjs_ketenagakerjaan || '',
        bpjs_kesehatan: emp.bpjs_kesehatan || '',
        insurance_admedika: emp.insurance_admedika || '',
        email_company: emp.email_company || '',
        email_personal: emp.email_personal || '',
        phone_mobile: emp.phone_mobile || '',
        phone_home: emp.phone_home || '',
        ktp_address: emp.ktp_address || '',
        ktp_city: emp.ktp_city || '',
        ktp_district: emp.ktp_district || '',
        ktp_village: emp.ktp_village || '',
        ktp_province: emp.ktp_province || '',
        ktp_postal_code: emp.ktp_postal_code || '',
        residential_address: emp.residential_address || '',
        residential_city: emp.residential_city || '',
        residential_district: emp.residential_district || '',
        residential_village: emp.residential_village || '',
        residential_province: emp.residential_province || '',
        residential_postal_code: emp.residential_postal_code || '',
        company_id: emp.company_id ? String(emp.company_id) : (emp.site?.company_id ? String(emp.site.company_id) : ''),
        site_id: emp.site_id ? String(emp.site_id) : '',
        department_id: emp.department_id ? String(emp.department_id) : '',
        section_id: emp.section_id ? String(emp.section_id) : '',
        position_id: emp.position_id ? String(emp.position_id) : '',
        pangkat: emp.pangkat || emp.grade?.pangkat || '',
        grade_id: emp.grade_id ? String(emp.grade_id) : '',
        salary_grade_id: emp.salary_grade_id ? String(emp.salary_grade_id) : '',
        salary_grade_jenjang_id: emp.salary_grade_jenjang_id ? String(emp.salary_grade_jenjang_id) : '',
        employment_type_id: emp.employment_type_id ? String(emp.employment_type_id) : '',
        poh: emp.poh || '',
        work_area: emp.work_area || '',
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        probation_end_date: emp.probation_end_date ? emp.probation_end_date.split('T')[0] : '',
        contract_end_date: emp.contract_end_date ? emp.contract_end_date.split('T')[0] : '',
        employment_status: emp.employment_status || '',
        health_safety: {
          blood_type: emp.health_safety?.blood_type || '',
          rhesus: emp.health_safety?.rhesus || '',
          height_cm: emp.health_safety?.height_cm != null ? String(emp.health_safety.height_cm) : '',
          weight_kg: emp.health_safety?.weight_kg != null ? String(emp.health_safety.weight_kg) : '',
          shirt_size: emp.health_safety?.shirt_size || '',
          pants_size: emp.health_safety?.pants_size || '',
          safety_shoe_size: emp.health_safety?.safety_shoe_size || '',
          coverall_size: emp.health_safety?.coverall_size || '',
          medical_notes: emp.health_safety?.medical_notes || '',
        },
        families: (emp.families || []).map((fam: any) => ({
          ...fam,
          bpjs_kesehatan_no: fam.bpjs_kesehatan_no || fam.health_provider_no || '',
          insurance_no: fam.insurance_no || '',
        })),
        educations: emp.educations || [],
        emergency_contacts: emp.emergency_contacts || [],
        bank_accounts: emp.bank_accounts || [],
      });
    }
  }, [mode, existingData]);

  // Load Referensi Organisasi
  const { data: companiesData } = useQuery({
    queryKey: ['master-companies'],
    queryFn: () => companyService.getCompanies({ all: true, per_page: 500 }),
  });

  const { data: sitesData } = useQuery({
    queryKey: ['master-sites'],
    queryFn: () => siteService.getSites({ all: true, per_page: 500 }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['master-departments'],
    queryFn: () => departmentService.getDepartments({ all: true, per_page: 500 }),
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['master-sections'],
    queryFn: () => sectionService.getSections({ all: true, per_page: 500 }),
  });

  const { data: positionsData } = useQuery({
    queryKey: ['master-positions'],
    queryFn: () => positionService.getPositions({ all: true, per_page: 500 }),
  });

  const { data: gradesData } = useQuery({
    queryKey: ['master-grades'],
    queryFn: () => jobGradeService.getGrades(),
  });

  const { data: salaryGradesData } = useQuery({
    queryKey: ['master-salary-grades'],
    queryFn: () => salaryGradeService.getSalaryGrades(),
  });

  const { data: jenjangData } = useQuery({
    queryKey: ['master-jenjangs'],
    queryFn: () => jenjangService.getJenjangs(),
  });

  const { data: employmentTypesData } = useQuery({
    queryKey: ['master-employment-types'],
    queryFn: () => employmentTypeService.getEmploymentTypes(),
  });

  // Load Referensi Standar
  const { data: religionsData } = useQuery({
    queryKey: ['ref-standard-religion'],
    queryFn: () => referenceDataService.getStandard('RELIGION'),
  });

  const { data: maritalData } = useQuery({
    queryKey: ['ref-standard-marital'],
    queryFn: () => referenceDataService.getStandard('MARITAL_STATUS'),
  });

  const { data: bloodTypesData } = useQuery({
    queryKey: ['ref-standard-blood'],
    queryFn: () => referenceDataService.getStandard('BLOOD_TYPE'),
  });

  const { data: uniformSizesData } = useQuery({
    queryKey: ['ref-standard-uniform'],
    queryFn: () => referenceDataService.getStandard('UNIFORM_SIZE'),
  });

  const { data: pantsSizesData } = useQuery({
    queryKey: ['ref-standard-pants'],
    queryFn: () => referenceDataService.getStandard('PANTS_SIZE'),
  });

  const { data: shoeSizesData } = useQuery({
    queryKey: ['ref-standard-shoe'],
    queryFn: () => referenceDataService.getStandard('SHOE_SIZE'),
  });

  const { data: banksData } = useQuery({
    queryKey: ['ref-standard-bank'],
    queryFn: () => referenceDataService.getStandard('BANK'),
  });

  const { data: educationsData } = useQuery({
    queryKey: ['ref-standard-education'],
    queryFn: () => referenceDataService.getStandard('EDUCATION'),
  });

  const { data: pohData } = useQuery({
    queryKey: ['ref-standard-poh'],
    queryFn: () => referenceDataService.getStandard('POH'),
  });

  const { data: workAreaData } = useQuery({
    queryKey: ['ref-standard-work-area'],
    queryFn: () => referenceDataService.getStandard('WORK_AREA'),
  });

  // Load Referensi Standar Jenis Dokumen (Document Types)
  const { data: docTypesData, isLoading: isLoadingDocTypes } = useQuery({
    queryKey: ['ref-document-types'],
    queryFn: () => referenceDataService.getDocumentTypes(),
  });

  const getRefList = (res: any, defaults: { code: string; name: string }[] = []): { code: string; name: string }[] => {
    if (!res) return defaults;
    const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    const activeItems = items.filter((i: any) => i.status === 'ACTIVE' || !i.status);
    return (activeItems.length > 0 ? activeItems : (items.length > 0 ? items : defaults)) as { code: string; name: string }[];
  };

  const companies: MasterCompany[] = Array.isArray(companiesData?.data)
    ? companiesData.data
    : (Array.isArray((companiesData as any)?.data?.data) ? (companiesData as any).data.data : []);

  const sites: MasterSite[] = Array.isArray(sitesData?.data)
    ? sitesData.data
    : (Array.isArray((sitesData as any)?.data?.data) ? (sitesData as any).data.data : []);

  const departments: MasterDepartment[] = Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : (Array.isArray((departmentsData as any)?.data?.data) ? (departmentsData as any).data.data : []);

  const sections: MasterSection[] = Array.isArray(sectionsData?.data)
    ? sectionsData.data
    : (Array.isArray((sectionsData as any)?.data?.data) ? (sectionsData as any).data.data : []);

  const positions: PositionItem[] = Array.isArray(positionsData?.data)
    ? positionsData.data
    : (Array.isArray((positionsData as any)?.data?.data) ? (positionsData as any).data.data : []);

  const grades: GradeItem[] = Array.isArray((gradesData as any)?.data)
    ? (gradesData as any).data
    : (Array.isArray(gradesData) ? gradesData : []);

  const salaryGrades: SalaryGradeItem[] = Array.isArray((salaryGradesData as any)?.data)
    ? (salaryGradesData as any).data
    : (Array.isArray(salaryGradesData) ? salaryGradesData : []);

  const jenjangList: SalaryGradeJenjangItem[] = Array.isArray((jenjangData as any)?.data)
    ? (jenjangData as any).data
    : (Array.isArray(jenjangData) ? jenjangData : []);

  const employmentTypes: EmploymentTypeItem[] = Array.isArray((employmentTypesData as any)?.data)
    ? (employmentTypesData as any).data
    : (Array.isArray(employmentTypesData) ? employmentTypesData : []);

  const documentTypes: DocumentType[] = useMemo(() => {
    if (!docTypesData) return [];
    const list = Array.isArray(docTypesData.data)
      ? docTypesData.data
      : (Array.isArray(docTypesData) ? docTypesData : []);
    return list.filter((d: any) => d.status === 'ACTIVE' || !d.status);
  }, [docTypesData]);

  // Existing documents for edit mode
  const existingDocuments: EmployeeDocument[] = useMemo(() => {
    return existingData?.data?.documents || [];
  }, [existingData]);

  const religions = getRefList(religionsData, [
    { code: 'ISLAM', name: 'Islam' },
    { code: 'KRISTEN', name: 'Kristen Protestan' },
    { code: 'KATOLIK', name: 'Katolik' },
    { code: 'HINDU', name: 'Hindu' },
    { code: 'BUDDHA', name: 'Buddha' },
    { code: 'KONGHUCU', name: 'Konghucu' },
  ]);

  const maritalStatuses: { code: string; name: string; metadata?: any }[] = useMemo(() => {
    const rawList = Array.isArray(maritalData?.data)
      ? maritalData.data
      : (Array.isArray((maritalData as any)?.data?.data) ? (maritalData as any).data.data : []);

    const activeList = rawList.filter((r: any) => r.status === 'ACTIVE' || !r.status);

    const defaults = [
      { code: 'SINGLE', name: 'Belum Menikah (Single)', metadata: { category: 'Tidak Menikah' } },
      { code: 'MARRIED', name: 'Menikah (Married)', metadata: { category: 'Menikah' } },
      { code: 'DIVORCED', name: 'Cerai Hidup (Divorced)', metadata: { category: 'Tidak Menikah' } },
      { code: 'WIDOWED', name: 'Cerai Mati (Widowed)', metadata: { category: 'Tidak Menikah' } },
    ];

    // Jika di Modul Status Menikah sudah ada data aktif, gunakan data tersebut secara langsung
    const baseList = activeList.length > 0 ? activeList : defaults;

    // Jika sedang edit data dan status karyawan saat ini belum ada di baseList, sertakan agar tidak hilang
    if (
      formData.marital_status &&
      !baseList.some((r: any) => String(r.code).toUpperCase() === String(formData.marital_status).toUpperCase())
    ) {
      const existingInRaw = rawList.find((r: any) => String(r.code).toUpperCase() === String(formData.marital_status).toUpperCase());
      const fallbackDef = defaults.find((d) => d.code === formData.marital_status);
      if (existingInRaw) {
        return [existingInRaw, ...baseList];
      } else if (fallbackDef) {
        return [fallbackDef, ...baseList];
      } else {
        return [{ code: formData.marital_status, name: formData.marital_status }, ...baseList];
      }
    }

    return baseList;
  }, [maritalData, formData.marital_status]);

  const taxStatuses = useMemo(() => {
    const defaults = [
      { code: 'TK/0', name: 'TK/0 (Tidak Kawin, 0 Tanggungan)' },
      { code: 'TK/1', name: 'TK/1 (Tidak Kawin, 1 Tanggungan)' },
      { code: 'TK/2', name: 'TK/2 (Tidak Kawin, 2 Tanggungan)' },
      { code: 'TK/3', name: 'TK/3 (Tidak Kawin, 3 Tanggungan)' },
      { code: 'K/0', name: 'K/0 (Kawin, 0 Tanggungan)' },
      { code: 'K/1', name: 'K/1 (Kawin, 1 Tanggungan)' },
      { code: 'K/2', name: 'K/2 (Kawin, 2 Tanggungan)' },
      { code: 'K/3', name: 'K/3 (Kawin, 3 Tanggungan)' },
    ];
    return defaults;
  }, []);

  const isEmployeeMarried = useMemo(() => {
    const currentCode = formData.marital_status;
    if (!currentCode) return false;

    // 1. Cek Kategori langsung dari Referensi Standar Modul Status Menikah ('Menikah' vs 'Tidak Menikah')
    const matched = maritalStatuses.find(
      (m: any) => String(m.code).toUpperCase() === String(currentCode).toUpperCase()
    );
    if (matched) {
      const cat = matched.metadata?.category || (matched as any).category;
      if (cat === 'Menikah') return true;
      if (cat === 'Tidak Menikah') return false;
    }

    // 2. Heuristik fallback jika master data belum memiliki metadata kategori
    const s = String(currentCode).toUpperCase();
    return (
      s === 'MARRIED' ||
      s.startsWith('K/') ||
      s.startsWith('K0') ||
      s.startsWith('K1') ||
      s.startsWith('K2') ||
      s.startsWith('K3') ||
      s.includes('MENIKAH') ||
      s.includes('KAWIN')
    );
  }, [formData.marital_status, maritalStatuses]);

  const bloodTypes = getRefList(bloodTypesData, [
    { code: 'A', name: 'A' },
    { code: 'B', name: 'B' },
    { code: 'AB', name: 'AB' },
    { code: 'O', name: 'O' },
  ]);

  const uniformSizes = getRefList(uniformSizesData, [
    { code: 'S', name: 'S' },
    { code: 'M', name: 'M' },
    { code: 'L', name: 'L' },
    { code: 'XL', name: 'XL' },
    { code: 'XXL', name: 'XXL' },
    { code: '3XL', name: '3XL' },
    { code: '4XL', name: '4XL' },
  ]);

  const pantsSizes = getRefList(pantsSizesData, [
    { code: '28', name: '28' },
    { code: '30', name: '30' },
    { code: '32', name: '32' },
    { code: '34', name: '34' },
    { code: '36', name: '36' },
    { code: '38', name: '38' },
    { code: '40', name: '40' },
    { code: '42', name: '42' },
  ]);

  const shoeSizes = getRefList(shoeSizesData, [
    { code: '38', name: '38' },
    { code: '39', name: '39' },
    { code: '40', name: '40' },
    { code: '41', name: '41' },
    { code: '42', name: '42' },
    { code: '43', name: '43' },
    { code: '44', name: '44' },
    { code: '45', name: '45' },
  ]);

  const bankOptions = getRefList(banksData, [
    { code: 'MANDIRI', name: 'Bank Mandiri' },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
    { code: 'BCA', name: 'Bank Central Asia (BCA)' },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)' },
    { code: 'CIMB', name: 'CIMB Niaga' },
  ]);

  const educationLevels = getRefList(educationsData, [
    { code: 'SD', name: 'SD / Sederajat' },
    { code: 'SMP', name: 'SMP / Sederajat' },
    { code: 'SMA', name: 'SMA / MA' },
    { code: 'SMK', name: 'SMK' },
    { code: 'D1', name: 'Diploma 1 (D1)' },
    { code: 'D2', name: 'Diploma 2 (D2)' },
    { code: 'D3', name: 'Diploma 3 (D3)' },
    { code: 'D4', name: 'Diploma 4 (D4)' },
    { code: 'S1', name: 'Sarjana (S1)' },
    { code: 'S2', name: 'Magister (S2)' },
    { code: 'S3', name: 'Doktor (S3)' },
  ]);

  const pohList = getRefList(pohData, [
    { code: 'Balikpapan', name: 'Balikpapan' },
    { code: 'Samarinda', name: 'Samarinda' },
    { code: 'Banjarmasin', name: 'Banjarmasin' },
    { code: 'Jakarta', name: 'Jakarta' },
    { code: 'Surabaya', name: 'Surabaya' },
    { code: 'Lokal Site', name: 'Lokal Site' },
  ]);

  const workAreaList = getRefList(workAreaData, [
    { code: 'HO', name: 'Head Office (HO)' },
    { code: 'SITE_MINING', name: 'Area Tambang / Pit Site' },
    { code: 'SITE_PORT', name: 'Area Port / Jetty' },
    { code: 'SITE_WORKSHOP', name: 'Area Workshop / Maintenance' },
    { code: 'SITE_CAMP', name: 'Area Camp / Office Site' },
  ]);

  // Cascading options
  const formSites = formData.company_id
    ? sites.filter((s) => !s.company_id || String(s.company_id) === String(formData.company_id))
    : sites;

  const formDepartments = formData.site_id
    ? departments.filter((d) => !d.site_id || String(d.site_id) === String(formData.site_id))
    : (formData.company_id
      ? departments.filter((d) => !d.company_id || String(d.company_id) === String(formData.company_id))
      : departments);

  const formSections = formData.department_id
    ? sections.filter((s) => String(s.department_id) === String(formData.department_id))
    : [];

  const formPositions = formData.department_id
    ? positions.filter((p) => {
      const matchDept = String(p.department_id) === String(formData.department_id) ||
        String(p.organization_unit_id) === String(formData.department_id);
      if (!matchDept) return false;
      if (formData.section_id) {
        return String(p.section_id) === String(formData.section_id);
      }
      return true;
    })
    : [];

  const resolveAutoJenjangId = (gradeId?: string | number, salaryGradeId?: string | number, currentJenjangId?: string | number): string => {
    const gId = gradeId ? String(gradeId) : '';
    const sgId = salaryGradeId ? String(salaryGradeId) : '';

    if (gId && sgId) {
      const exactMatch = jenjangList.find(
        (j) => String(j.grade_id) === gId && String(j.salary_grade_id) === sgId
      );
      if (exactMatch) return String(exactMatch.id);
    }

    if (currentJenjangId) {
      const current = jenjangList.find((j) => String(j.id) === String(currentJenjangId));
      if (current) {
        const matchGrade = !gId || !current.grade_id || String(current.grade_id) === gId;
        const matchSalaryGrade = !sgId || !current.salary_grade_id || String(current.salary_grade_id) === sgId;
        if (matchGrade && matchSalaryGrade) {
          return String(currentJenjangId);
        }
      }
    }

    if (gId && !sgId) {
      const matches = jenjangList.filter((j) => String(j.grade_id) === gId);
      if (matches.length === 1) return String(matches[0].id);
    } else if (!gId && sgId) {
      const matches = jenjangList.filter((j) => String(j.salary_grade_id) === sgId);
      if (matches.length === 1) return String(matches[0].id);
    }

    return '';
  };

  const formJenjang = jenjangList.filter((j) => {
    if (formData.salary_grade_jenjang_id && String(j.id) === String(formData.salary_grade_jenjang_id)) {
      return true;
    }
    if (formData.salary_grade_id && j.salary_grade_id && String(j.salary_grade_id) !== String(formData.salary_grade_id)) {
      return false;
    }
    if (formData.grade_id && j.grade_id && String(j.grade_id) !== String(formData.grade_id)) {
      return false;
    }
    return true;
  });

  const ktpCities = formData.ktp_province ? getCitiesByProvince(formData.ktp_province) : [];
  const ktpDistricts = formData.ktp_city ? getDistrictsByCity(formData.ktp_city) : [];
  const ktpVillages = formData.ktp_district ? getVillagesByDistrict(formData.ktp_district) : [];

  const residentialCities = formData.residential_province ? getCitiesByProvince(formData.residential_province) : [];
  const residentialDistricts = formData.residential_city ? getDistrictsByCity(formData.residential_city) : [];
  const residentialVillages = formData.residential_district ? getVillagesByDistrict(formData.residential_district) : [];

  const isKtpVillageCustom = customKtpVillage || (!!formData.ktp_village && ktpVillages.length > 0 && !ktpVillages.includes(formData.ktp_village));
  const isResidentialVillageCustom = customResidentialVillage || (!!formData.residential_village && residentialVillages.length > 0 && !residentialVillages.includes(formData.residential_village));

  // Hitung Usia Otomatis
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null;
    const birth = new Date(formData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [formData.birth_date]);

  // Hitung BMI Otomatis
  const calculatedBmi = useMemo(() => {
    const h = parseFloat(formData.health_safety.height_cm);
    const w = parseFloat(formData.health_safety.weight_kg);
    if (!h || !w || h <= 0 || w <= 0) return null;
    const hm = h / 100;
    const bmi = w / (hm * hm);
    let category = 'Normal';
    let color = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      color = 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800';
    } else if (bmi >= 30) {
      category = 'Obesitas';
      color = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
    }
    return { value: bmi.toFixed(1), category, color };
  }, [formData.health_safety.height_cm, formData.health_safety.weight_kg]);

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
    const currentFamilies = [...formData.families];

    const ensureRelation = (relationType: string, defaultGender = 'MALE', childOrder: number | null = null) => {
      const exists = currentFamilies.some(
        (f) => f.relation_type === relationType && (childOrder === null || f.child_order === childOrder)
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
        });
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

    // 3. Anak sesuai jumlah tanggungan
    for (let i = 1; i <= requiredChildCount; i++) {
      ensureRelation('CHILD', 'FEMALE', i);
    }

    setFormData({ ...formData, families: currentFamilies });
    toast.success('Template baris keluarga wajib berhasil disiapkan');
  };

  // ================= PROGRES PERSENTASE PENGISIAN DATA =================
  const progressStats = useMemo(() => {
    const checkList: { label: string; filled: boolean; section: string; weight: number }[] = [
      // 1. Penempatan
      { label: 'NRP Karyawan', filled: !!formData.nrp?.trim(), section: 'Penempatan', weight: 4 },
      { label: 'Perusahaan', filled: !!formData.company_id, section: 'Penempatan', weight: 4 },
      { label: 'Site / Lokasi Kerja', filled: !!formData.site_id, section: 'Penempatan', weight: 4 },
      { label: 'Departemen', filled: !!formData.department_id, section: 'Penempatan', weight: 4 },
      { label: 'Jabatan / Posisi', filled: !!formData.position_id, section: 'Penempatan', weight: 4 },
      { label: 'Pangkat & Golongan', filled: !!formData.pangkat && !!formData.grade_id, section: 'Penempatan', weight: 4 },
      { label: 'Status Hubungan Kerja', filled: !!formData.employment_type_id, section: 'Penempatan', weight: 3 },
      { label: 'Point of Hire (POH)', filled: !!formData.poh?.trim(), section: 'Penempatan', weight: 3 },
      { label: 'Tanggal Bergabung', filled: !!formData.hire_date, section: 'Penempatan', weight: 4 },

      // 2. Biodata & Alamat
      { label: 'Nama Lengkap', filled: !!formData.name?.trim(), section: 'Biodata', weight: 5 },
      { label: 'Jenis Kelamin', filled: !!formData.gender, section: 'Biodata', weight: 3 },
      { label: 'Tanggal Lahir', filled: !!formData.birth_date, section: 'Biodata', weight: 4 },
      { label: 'Agama', filled: !!formData.religion, section: 'Biodata', weight: 2 },
      { label: 'Status Pernikahan', filled: !!formData.marital_status, section: 'Biodata', weight: 2 },
      { label: 'NIK KTP', filled: !!formData.id_card_number?.trim(), section: 'Biodata', weight: 5 },
      { label: 'NPWP', filled: !!formData.tax_number?.trim(), section: 'Biodata', weight: 3 },
      { label: 'BPJS Ketenagakerjaan', filled: !!formData.bpjs_ketenagakerjaan?.trim(), section: 'Biodata', weight: 3 },
      { label: 'BPJS Kesehatan', filled: !!formData.bpjs_kesehatan?.trim(), section: 'Biodata', weight: 3 },
      { label: 'Nomor Handphone', filled: !!formData.phone_mobile?.trim(), section: 'Biodata', weight: 4 },
      { label: 'Alamat KTP', filled: !!formData.ktp_address?.trim() && !!formData.ktp_city?.trim(), section: 'Biodata', weight: 4 },
      { label: 'Alamat Domisili', filled: !!formData.residential_address?.trim(), section: 'Biodata', weight: 3 },

      // 3. Fisik & APD Tambang
      { label: 'Golongan Darah', filled: !!formData.health_safety.blood_type, section: 'Fisik & APD', weight: 2 },
      { label: 'Tinggi & Berat Badan', filled: !!formData.health_safety.height_cm && !!formData.health_safety.weight_kg, section: 'Fisik & APD', weight: 3 },
      { label: 'Ukuran APD Tambang', filled: !!formData.health_safety.safety_shoe_size && !!formData.health_safety.shirt_size, section: 'Fisik & APD', weight: 3 },

      // 4. Data Keluarga (Ketentuan Wajib)
      { label: 'Keluarga: Ayah Kandung', filled: familyCompliance.hasFather, section: 'Keluarga', weight: 3 },
      { label: 'Keluarga: Ibu Kandung', filled: familyCompliance.hasMother, section: 'Keluarga', weight: 3 },
      ...(isEmployeeMarried
        ? [
            { label: 'Keluarga: Pasangan (Istri/Suami)', filled: familyCompliance.hasSpouse, section: 'Keluarga', weight: 3 },
            { label: 'Keluarga: Ayah Mertua', filled: familyCompliance.hasFatherInLaw, section: 'Keluarga', weight: 2 },
            { label: 'Keluarga: Ibu Mertua', filled: familyCompliance.hasMotherInLaw, section: 'Keluarga', weight: 2 },
          ]
        : []),
      ...(requiredChildCount > 0
        ? [
            {
              label: `Keluarga: ${requiredChildCount} Anak Tanggungan (${formData.tax_status})`,
              filled: familyCompliance.hasRequiredChildren,
              section: 'Keluarga',
              weight: 3,
            },
          ]
        : []),

      // 5. Rekening Bank
      { label: 'Rekening Payroll Bank', filled: formData.bank_accounts.length > 0 && !!formData.bank_accounts[0]?.account_number, section: 'Payroll', weight: 4 },

      // 6. Kontak Darurat
      { label: 'Kontak Darurat Utama', filled: formData.emergency_contacts.length > 0 && !!formData.emergency_contacts[0]?.name && !!formData.emergency_contacts[0]?.phone_number, section: 'Pendidikan & Kontak', weight: 4 },

      // 7. Pendidikan
      { label: 'Riwayat Pendidikan', filled: formData.educations.length > 0 && !!formData.educations[0]?.institution_name, section: 'Pendidikan & Kontak', weight: 4 },
    ];

    // 8. Dokumen Wajib Sesuai Standar Referensi
    documentTypes.forEach((docType) => {
      if (docType.required) {
        const isUploaded = existingDocuments.some((d) => d.document_type_id === docType.id) ||
          !!stagedDocs[docType.id]?.file;
        checkList.push({
          label: `Dokumen: ${docType.name}`,
          filled: isUploaded,
          section: 'Dokumen',
          weight: 4,
        });
      }
    });

    const totalWeight = checkList.reduce((acc, item) => acc + item.weight, 0);
    const filledWeight = checkList.filter((item) => item.filled).reduce((acc, item) => acc + item.weight, 0);
    const percentage = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
    const filledCount = checkList.filter((item) => item.filled).length;
    const totalCount = checkList.length;

    // Section status
    const sectionStatus: Record<string, boolean> = {
      penempatan: checkList.filter((c) => c.section === 'Penempatan').every((c) => c.filled),
      biodata: checkList.filter((c) => c.section === 'Biodata').every((c) => c.filled),
      fisik: checkList.filter((c) => c.section === 'Fisik & APD').every((c) => c.filled),
      keluarga: familyCompliance.isComplete,
      payroll: checkList.filter((c) => c.section === 'Payroll').every((c) => c.filled),
      pendidikan: checkList.filter((c) => c.section === 'Pendidikan & Kontak').every((c) => c.filled),
      dokumen: checkList.filter((c) => c.section === 'Dokumen').length === 0 || checkList.filter((c) => c.section === 'Dokumen').every((c) => c.filled),
    };

    return { percentage, filledCount, totalCount, checkList, sectionStatus };
  }, [formData, documentTypes, existingDocuments, stagedDocs, familyCompliance, isEmployeeMarried, requiredChildCount]);

  // Dummy testing data filler
  const fillDummyData = () => {
    const comp = companies[0];
    const compId = comp ? String(comp.id) : '';

    const availableSites = compId ? sites.filter((s) => !s.company_id || String(s.company_id) === compId) : sites;
    const site = availableSites[0] || sites[0];
    const siteId = site ? String(site.id) : '';

    const availableDepts = siteId ? departments.filter((d) => !d.site_id || String(d.site_id) === siteId) : departments;
    const dept = availableDepts[0] || departments[0];
    const deptId = dept ? String(dept.id) : '';

    const availableSecs = deptId ? sections.filter((s) => String(s.department_id) === deptId) : [];
    const sec = availableSecs[0] || null;
    const secId = sec ? String(sec.id) : '';

    const availablePos = deptId
      ? positions.filter((p) => String(p.department_id) === deptId || String(p.organization_unit_id) === deptId)
      : positions;
    const pos = availablePos[0] || positions[0];
    const posId = pos ? String(pos.id) : '';

    const grd = grades[0];
    const grdId = grd ? String(grd.id) : '';
    const salGrd = salaryGrades[0];
    const salGrdId = salGrd ? String(salGrd.id) : '';
    const jnjId = resolveAutoJenjangId(grdId, salGrdId);
    const empType = employmentTypes[0];
    const empTypeId = empType ? String(empType.id) : '';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dummyNrp = `HCMS-M-${randomSuffix}`;
    const dummyNik = `647101${randomSuffix}900001`;
    const randomName = `Budi Pratama ${randomSuffix}`;

    setFormData({
      nrp: dummyNrp,
      name: randomName,
      nickname: 'Budi',
      gender: 'MALE',
      birth_place: 'Balikpapan',
      birth_date: '1992-05-14',
      religion: 'ISLAM',
      marital_status: 'MARRIED',
      marriage_date: '2019-08-10',
      id_card_number: dummyNik,
      tax_number: `72.849.${randomSuffix}.2-721.000`,
      tax_status: 'K/1',
      bpjs_ketenagakerjaan: `2100${randomSuffix}982`,
      bpjs_kesehatan: `0001${randomSuffix}123`,
      insurance_admedika: `ADM-${randomSuffix}-POL`,
      email_company: `budi.${randomSuffix}@mining-corp.co.id`,
      email_personal: `budipratama.${randomSuffix}@gmail.com`,
      phone_mobile: `0812${randomSuffix}789`,
      phone_home: '0542-871234',
      ktp_address: 'Jl. Jenderal Sudirman No. 88, RT 012 / RW 004',
      ktp_province: 'KALIMANTAN TIMUR',
      ktp_city: 'KOTA BALIKPAPAN',
      ktp_district: 'BALIKPAPAN KOTA',
      ktp_village: 'Klandasan Ilir',
      ktp_postal_code: '76111',
      residential_address: 'Mess Karyawan HO Blok B-14, Jl. Pupuk Raya',
      residential_province: 'KALIMANTAN TIMUR',
      residential_city: 'KOTA BALIKPAPAN',
      residential_district: 'BALIKPAPAN SELATAN',
      residential_village: 'Gunung Bahagia',
      residential_postal_code: '76115',
      company_id: compId,
      site_id: siteId,
      department_id: deptId,
      section_id: secId,
      position_id: posId,
      pangkat: 'Staff',
      grade_id: grdId,
      salary_grade_id: salGrdId,
      salary_grade_jenjang_id: jnjId,
      employment_type_id: empTypeId,
      poh: 'Balikpapan',
      work_area: 'HO',
      hire_date: new Date().toISOString().split('T')[0],
      probation_end_date: '',
      contract_end_date: '',
      employment_status: 'ACTIVE',
      health_safety: {
        blood_type: 'O',
        rhesus: '+',
        height_cm: '172',
        weight_kg: '68',
        shirt_size: 'L',
        pants_size: '32',
        safety_shoe_size: '42',
        coverall_size: 'L',
        medical_notes: 'Tidak ada riwayat alergi obat. Kondisi fisik prima K3 Tambang.',
      },
      families: [
        {
          relation_type: 'FATHER',
          name: 'Bambang Santoso',
          gender: 'MALE',
          birth_place: 'Surabaya',
          birth_date: '1962-04-12',
          id_card_number: '3578011204620001',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          health_provider_no: '',
          is_covered_insurance: false,
          is_alive: true,
        },
        {
          relation_type: 'MOTHER',
          name: 'Siti Aminah',
          gender: 'FEMALE',
          birth_place: 'Surabaya',
          birth_date: '1965-08-20',
          id_card_number: '3578012008650002',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          health_provider_no: '',
          is_covered_insurance: false,
          is_alive: true,
        },
        {
          relation_type: 'SPOUSE',
          name: 'Dewi Lestari',
          gender: 'FEMALE',
          birth_place: 'Balikpapan',
          birth_date: '1995-07-21',
          id_card_number: '6471026107950002',
          bpjs_kesehatan_no: '0001849204919',
          insurance_no: 'ADM-9920194',
          health_provider_no: '0001849204919',
          is_covered_insurance: true,
          is_alive: true,
        },
        {
          relation_type: 'FATHER_IN_LAW',
          name: 'Hendra Gunawan',
          gender: 'MALE',
          birth_place: 'Samarinda',
          birth_date: '1964-02-18',
          id_card_number: '6472011802640003',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          health_provider_no: '',
          is_covered_insurance: false,
          is_alive: true,
        },
        {
          relation_type: 'MOTHER_IN_LAW',
          name: 'Ratna Susanti',
          gender: 'FEMALE',
          birth_place: 'Samarinda',
          birth_date: '1968-11-25',
          id_card_number: '6472012511680004',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          health_provider_no: '',
          is_covered_insurance: false,
          is_alive: true,
        },
        {
          relation_type: 'CHILD',
          child_order: 1,
          name: 'Muhammad Kenzo Santoso',
          gender: 'MALE',
          birth_place: 'Samarinda',
          birth_date: '2021-11-04',
          id_card_number: '6472010411210001',
          bpjs_kesehatan_no: '0001849204920',
          insurance_no: 'ADM-9920195',
          health_provider_no: '0001849204920',
          is_covered_insurance: true,
          is_alive: true,
        },
      ],
      educations: [
        {
          level: 'S1',
          institution_name: 'Universitas Mulawarman',
          major: 'Teknik Pertambangan',
          graduation_year: 2014,
          gpa: '3.62',
          is_highest: true,
        },
      ],
      emergency_contacts: [
        {
          name: 'Dewi Lestari',
          relationship: 'Istri',
          phone_number: '081347890123',
          address: 'Jl. Mulawarman No. 45, Samarinda Kota',
          is_primary: true,
        },
      ],
      bank_accounts: [
        {
          bank_name: 'Bank Mandiri',
          account_number: '1480019283746',
          account_holder: randomName,
          is_payroll_primary: true,
        },
      ],
    });

    toast.success(`🧪 [Dummy Data Test] Berhasil mengisi formulir lengkap untuk "${randomName}"!`);
  };

  // Upload helper for staged documents after creation or in edit mode
  const uploadStagedDocuments = async (targetEmployeeId: number) => {
    const stagedEntries = Object.entries(stagedDocs).filter(([_, doc]) => doc.file != null);
    if (stagedEntries.length === 0) return;

    let successCount = 0;
    for (const [docTypeIdStr, doc] of stagedEntries) {
      if (!doc.file) continue;
      const docTypeId = parseInt(docTypeIdStr, 10);
      const fd = new FormData();
      fd.append('document_type_id', String(docTypeId));
      fd.append('file', doc.file);
      if (doc.document_number) fd.append('document_number', doc.document_number);
      if (doc.expiry_date) fd.append('expiry_date', doc.expiry_date);
      if (doc.notes) fd.append('notes', doc.notes);

      try {
        await employeeService.uploadDocument(targetEmployeeId, fd);
        successCount++;
      } catch (err: any) {
        console.error(`Gagal mengunggah dokumen type ${docTypeId}:`, err);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} berkas dokumen berhasil diunggah`);
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => employeeService.createEmployee(payload),
    onSuccess: async (res) => {
      const newId = res.data?.id;
      if (newId) {
        await uploadStagedDocuments(newId);
        toast.success(res.message || 'Karyawan baru berhasil didaftarkan');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        router.push(`/admin/employees/${newId}`);
      } else {
        toast.success(res.message || 'Karyawan baru berhasil didaftarkan');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        router.push('/admin/employees');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan karyawan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => employeeService.updateEmployee(id, payload),
    onSuccess: async () => {
      if (employeeId) {
        await uploadStagedDocuments(employeeId);
      }
      toast.success('Data karyawan berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
      router.push(`/admin/employees/${employeeId}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui karyawan');
    },
  });

  // Direct single file upload handler (for Edit mode or direct upload action)
  const handleDirectUploadDoc = async (docType: DocumentType) => {
    if (!employeeId) return;
    const staged = stagedDocs[docType.id];
    if (!staged?.file) {
      toast.error('Pilih file terlebih dahulu sebelum mengunggah');
      return;
    }

    setUploadingDocId(docType.id);
    const fd = new FormData();
    fd.append('document_type_id', String(docType.id));
    fd.append('file', staged.file);
    if (staged.document_number) fd.append('document_number', staged.document_number);
    if (staged.expiry_date) fd.append('expiry_date', staged.expiry_date);
    if (staged.notes) fd.append('notes', staged.notes);

    try {
      await employeeService.uploadDocument(employeeId, fd);
      toast.success(`Dokumen "${docType.name}" berhasil diunggah`);
      // Clear staged file for this type
      setStagedDocs((prev) => {
        const next = { ...prev };
        delete next[docType.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
      refetchEmployee();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Gagal mengunggah dokumen "${docType.name}"`);
    } finally {
      setUploadingDocId(null);
    }
  };

  // Direct delete uploaded document handler
  const handleDeleteDoc = async (docId: number, docName: string) => {
    if (!employeeId) return;
    if (!confirm(`Hapus berkas dokumen "${docName}"?`)) return;

    try {
      await employeeService.deleteDocument(employeeId, docId);
      toast.success(`Dokumen "${docName}" berhasil dihapus`);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', employeeId] });
      refetchEmployee();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus dokumen');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nrp?.trim()) {
      toast.error('NRP karyawan wajib diisi');
      document.getElementById('section-penempatan')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.name?.trim()) {
      toast.error('Nama lengkap karyawan wajib diisi');
      document.getElementById('section-biodata')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!formData.birth_date) {
      toast.error('Tanggal lahir karyawan wajib diisi');
      document.getElementById('section-biodata')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Validasi Ketentuan Wajib Data Keluarga
    if (!familyCompliance.hasFather) {
      toast.error('Data Ayah Kandung wajib diisi pada Data Keluarga');
      document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!familyCompliance.hasMother) {
      toast.error('Data Ibu Kandung wajib diisi pada Data Keluarga');
      document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (isEmployeeMarried) {
      if (!familyCompliance.hasSpouse) {
        toast.error('Kategori Menikah mewajibkan pengisian data Pasangan (Istri / Suami)');
        document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (!familyCompliance.hasFatherInLaw) {
        toast.error('Kategori Menikah mewajibkan pengisian data Ayah Mertua');
        document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      if (!familyCompliance.hasMotherInLaw) {
        toast.error('Kategori Menikah mewajibkan pengisian data Ibu Mertua');
        document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    if (requiredChildCount > 0 && !familyCompliance.hasRequiredChildren) {
      toast.error(
        `Status pajak (${formData.tax_status || 'tanggungan'}) mewajibkan pengisian minimal ${requiredChildCount} data anak (saat ini: ${familyCompliance.childrenCount})`
      );
      document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (formData.families && formData.families.length > 0) {
      for (let i = 0; i < formData.families.length; i++) {
        const fam = formData.families[i];
        const relationLabel =
          fam.relation_type === 'FATHER' ? 'Ayah Kandung' :
          fam.relation_type === 'MOTHER' ? 'Ibu Kandung' :
          fam.relation_type === 'SPOUSE' ? 'Pasangan' :
          fam.relation_type === 'FATHER_IN_LAW' ? 'Ayah Mertua' :
          fam.relation_type === 'MOTHER_IN_LAW' ? 'Ibu Mertua' :
          fam.relation_type === 'CHILD' ? `Anak ${fam.child_order ? `ke-${fam.child_order}` : ''}` :
          'Anggota Keluarga';

        if (!fam.name || !fam.name.trim()) {
          toast.error(`Nama ${relationLabel} (#${i + 1}) wajib diisi`);
          document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (!fam.id_card_number || !fam.id_card_number.trim()) {
          toast.error(`NIK / No. KTP untuk "${fam.name || relationLabel}" wajib diisi`);
          document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (!fam.birth_place || !fam.birth_place.trim()) {
          toast.error(`Tempat lahir untuk "${fam.name}" wajib diisi`);
          document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (!fam.birth_date) {
          toast.error(`Tanggal lahir untuk "${fam.name}" wajib diisi`);
          document.getElementById('section-keluarga')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
    }

    const payload = {
      ...formData,
      company_id: formData.company_id ? parseInt(formData.company_id, 10) : null,
      site_id: formData.site_id ? parseInt(formData.site_id, 10) : null,
      department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
      section_id: formData.section_id ? parseInt(formData.section_id, 10) : null,
      position_id: formData.position_id ? parseInt(formData.position_id, 10) : null,
      grade_id: formData.grade_id ? parseInt(formData.grade_id, 10) : null,
      salary_grade_id: formData.salary_grade_id ? parseInt(formData.salary_grade_id, 10) : null,
      salary_grade_jenjang_id: formData.salary_grade_jenjang_id ? parseInt(formData.salary_grade_jenjang_id, 10) : null,
      employment_type_id: formData.employment_type_id ? parseInt(formData.employment_type_id, 10) : null,
      health_safety: {
        ...formData.health_safety,
        height_cm: formData.health_safety.height_cm ? parseFloat(formData.health_safety.height_cm) : null,
        weight_kg: formData.health_safety.weight_kg ? parseFloat(formData.health_safety.weight_kg) : null,
      },
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: employeeId!, payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (mode === 'edit' && isLoadingEmployee) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // Quick anchor navigation items
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
      const yOffset = -140; // account for sticky headers
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href={mode === 'edit' && employeeId ? `/admin/employees/${employeeId}` : '/admin/employees'}>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'create' ? 'Tambah Data Karyawan' : `Edit Karyawan: ${formData.name || 'Memuat...'}`}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Formulir satu halaman terintegrasi: Penempatan, Biodata, APD, Keluarga, Payroll, dan Dokumen Standar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'create' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillDummyData}
              className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800 text-xs font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-purple-600 dark:text-purple-400" />
              Isi Dummy Otomatis
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isSaving ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      </div>

      {/* ================= STICKY PROGRES PERSENTASE PENGISIAN & ANCHOR NAVIGATION ================= */}
      <div className="sticky top-16 z-30 mb-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-md p-4 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center h-12 w-12 rounded-xl font-bold text-sm shadow-inner transition-colors ${progressStats.percentage >= 85
              ? 'bg-emerald-500 text-white'
              : progressStats.percentage >= 50
                ? 'bg-blue-600 text-white'
                : 'bg-amber-500 text-white'
              }`}>
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
                {progressStats.filledCount} dari {progressStats.totalCount} parameter data & berkas wajib telah terisi
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar with smooth gradient */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 shadow-inner">
          <div
            className={`h-full transition-all duration-500 rounded-full ${progressStats.percentage >= 85
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${isCurrent
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

      <form onSubmit={handleSave} className="space-y-8">
        {/* =========================================================================
            SECTION 1: PENEMPATAN & ORGANISASI
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
                  {progressStats.sectionStatus.penempatan && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Data posisi, penempatan entitas tambang, grade, golongan dan status hubungan kerja.
                </p>
              </div>
            </div>
            <Building2 className="h-6 w-6 text-slate-400 hidden sm:block" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                NRP Karyawan <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.nrp}
                onChange={(e) => setFormData({ ...formData, nrp: e.target.value })}
                placeholder="Contoh: HCMS-2026-001"
                inputCase="upper"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">NRP bersifat unik dan akan digunakan sebagai username login.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Perusahaan (Company) <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.company_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    company_id: val,
                    site_id: '',
                    department_id: '',
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">-- Pilih Perusahaan --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Site / Lokasi Tambang <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.site_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedSite = sites.find((s) => String(s.id) === val);
                  setFormData({
                    ...formData,
                    site_id: val,
                    company_id: selectedSite?.company_id ? String(selectedSite.company_id) : formData.company_id,
                    department_id: '',
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">-- Pilih Site --</option>
                {formSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Departemen <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.department_id}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    department_id: val,
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">-- Pilih Departemen --</option>
                {formDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Section / Divisi
              </label>
              <Select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                disabled={!formData.department_id}
              >
                <option value="">-- Pilih Section / Divisi --</option>
                {formSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jabatan / Posisi <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.position_id}
                onChange={(e) => {
                  const newPosId = e.target.value;
                  const selectedPos = positions.find((p) => String(p.id) === newPosId);

                  // Otomatis isi Level Jabatan (Grade) & Pangkat dari Jabatan yang dipilih
                  const posGradeId = selectedPos?.grade_id
                    ? String(selectedPos.grade_id)
                    : (selectedPos?.grade?.id ? String(selectedPos.grade.id) : '');
                  const posGrade = grades.find((g) => String(g.id) === posGradeId) || selectedPos?.grade;
                  const posPangkat = posGrade?.pangkat || selectedPos?.grade?.pangkat || '';
                  const targetGradeId = posGradeId || formData.grade_id;
                  const autoJenjangId = resolveAutoJenjangId(targetGradeId, formData.salary_grade_id, formData.salary_grade_jenjang_id);

                  // Jika posisi terhubung ke section dan section belum dipilih, isi otomatis section_id
                  const targetSectionId = formData.section_id || (selectedPos?.section_id ? String(selectedPos.section_id) : '');

                  setFormData({
                    ...formData,
                    position_id: newPosId,
                    section_id: targetSectionId,
                    grade_id: targetGradeId,
                    pangkat: posPangkat || formData.pangkat,
                    salary_grade_jenjang_id: autoJenjangId,
                  });
                }}
                disabled={!formData.department_id}
              >
                <option value="">-- Pilih Jabatan --</option>
                {formPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Pangkat <span className="text-rose-500">*</span>
                </label>
                {formData.position_id && formData.pangkat && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    Otomatis dari Jabatan
                  </span>
                )}
              </div>
              <Select
                value={formData.pangkat}
                onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
              >
                <option value="">-- Pilih Pangkat --</option>
                <option value="Staff">Staff</option>
                <option value="Non Staff">Non Staff</option>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Level Jabatan
                </label>
                {formData.position_id && formData.grade_id && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    Otomatis dari Jabatan
                  </span>
                )}
              </div>
              <Select
                value={formData.grade_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoJnj = resolveAutoJenjangId(val, formData.salary_grade_id, formData.salary_grade_jenjang_id);
                  const selGrade = grades.find((g) => String(g.id) === val);
                  setFormData({
                    ...formData,
                    grade_id: val,
                    salary_grade_jenjang_id: autoJnj,
                    pangkat: selGrade?.pangkat || formData.pangkat,
                  });
                }}
              >
                <option value="">-- Pilih Level Jabatan --</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.code} - {g.name} ({g.pangkat || 'Staff'})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Golongan
              </label>
              <Select
                value={formData.salary_grade_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoJnj = resolveAutoJenjangId(formData.grade_id, val, formData.salary_grade_jenjang_id);
                  setFormData({
                    ...formData,
                    salary_grade_id: val,
                    salary_grade_jenjang_id: autoJnj,
                  });
                }}
              >
                <option value="">-- Pilih Golongan --</option>
                {salaryGrades.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.code}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenjang
              </label>
              <Select
                value={formData.salary_grade_jenjang_id}
                onChange={(e) => setFormData({ ...formData, salary_grade_jenjang_id: e.target.value })}
              >
                <option value="">-- Pilih Jenjang --</option>
                {formJenjang.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hubungan Kerja <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formData.employment_type_id}
                onChange={(e) => setFormData({ ...formData, employment_type_id: e.target.value })}
              >
                <option value="">-- Pilih Hubungan Kerja --</option>
                {employmentTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name} ({et.code})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Point of Hire
              </label>
              <Select
                value={formData.poh}
                onChange={(e) => setFormData({ ...formData, poh: e.target.value })}
              >
                <option value="">-- Pilih Point of Hire --</option>
                {pohList.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Wilayah Kerja
              </label>
              <Select
                value={formData.work_area}
                onChange={(e) => setFormData({ ...formData, work_area: e.target.value })}
              >
                <option value="">-- Pilih Wilayah Kerja --</option>
                {workAreaList.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Masuk (Hire Date) <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={formData.hire_date}
                onChange={(val) => setFormData({ ...formData, hire_date: val })}
                placeholder="Pilih Tanggal Masuk"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status Kepegawaian
              </label>
              <Select
                value={formData.employment_status}
                onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
              >
                <option value="">-- Pilih Status Kepegawaian --</option>
                <option value="ACTIVE">Aktif (ACTIVE)</option>
                <option value="PROBATION">Masa Percobaan (PROBATION)</option>
                <option value="SUSPENDED">Ditangguhkan (SUSPENDED)</option>
                <option value="RESIGNED">Mengundurkan Diri (RESIGNED)</option>
                <option value="TERMINATED">Diberhentikan (TERMINATED)</option>
              </Select>
            </div>
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
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Data pribadi, nomor identitas kependudukan, perpajakan, BPJS, kontak, dan alamat.
                </p>
              </div>
            </div>
            <User className="h-6 w-6 text-slate-400 hidden sm:block" />
          </div>

          <div className="space-y-6">
            {/* Profil Pokok */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Lengkap (Sesuai KTP) <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama Lengkap"
                  inputCase="proper"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Panggilan (Nickname)
                </label>
                <Input
                  value={formData.nickname}
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
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="MALE">Laki-laki (MALE)</option>
                  <option value="FEMALE">Perempuan (FEMALE)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tempat Lahir
                </label>
                <Input
                  value={formData.birth_place}
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
                  value={formData.birth_date}
                  onChange={(val) => setFormData({ ...formData, birth_date: val })}
                  placeholder="Pilih Tanggal Lahir"
                  required
                />
                {calculatedAge !== null && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    Usia: {calculatedAge} Tahun
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Agama
                </label>
                <Select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                >
                  <option value="">-- Pilih Agama --</option>
                  {religions.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Pernikahan
                </label>
                <Select
                  value={formData.marital_status}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                >
                  <option value="">-- Pilih Status Pernikahan --</option>
                  {maritalStatuses.map((m) => (
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
                    value={formData.marriage_date}
                    onChange={(val) => setFormData({ ...formData, marriage_date: val })}
                    placeholder="Pilih Tanggal Pernikahan"
                  />
                </div>
              )}
            </div>

            {/* Nomor Identitas & Legalitas */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Identitas Kependudukan, Pajak & Jaminan Sosial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor Induk Kependudukan (NIK KTP) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={formData.id_card_number}
                    onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                    placeholder="16 Digit NIK KTP"
                    inputCase="upper"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor Pokok Wajib Pajak (NPWP)
                  </label>
                  <Input
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Contoh: 01.234.567.8-012.000"
                    inputCase="upper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status Pajak (PTKP)
                  </label>
                  <Select
                    value={formData.tax_status}
                    onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
                  >
                    <option value="">-- Pilih Status Pajak (PTKP) --</option>
                    {taxStatuses.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. BPJS Ketenagakerjaan
                  </label>
                  <Input
                    value={formData.bpjs_ketenagakerjaan}
                    onChange={(e) => setFormData({ ...formData, bpjs_ketenagakerjaan: e.target.value })}
                    placeholder="Nomor BPJS TK"
                    inputCase="upper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. BPJS Kesehatan
                  </label>
                  <Input
                    value={formData.bpjs_kesehatan}
                    onChange={(e) => setFormData({ ...formData, bpjs_kesehatan: e.target.value })}
                    placeholder="Nomor BPJS Kesehatan"
                    inputCase="upper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    No. Asuransi Swasta (AdMedika / Lainnya)
                  </label>
                  <Input
                    value={formData.insurance_admedika}
                    onChange={(e) => setFormData({ ...formData, insurance_admedika: e.target.value })}
                    placeholder="Nomor Polis / Kartu Asuransi"
                    inputCase="upper"
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
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Telepon Rumah / Darurat
                  </label>
                  <Input
                    value={formData.phone_home}
                    onChange={(e) => setFormData({ ...formData, phone_home: e.target.value })}
                    placeholder="Contoh: 0542-xxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Perusahaan
                  </label>
                  <Input
                    type="email"
                    value={formData.email_company}
                    onChange={(e) => setFormData({ ...formData, email_company: e.target.value })}
                    placeholder="nama@perusahaan.co.id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Pribadi
                  </label>
                  <Input
                    type="email"
                    value={formData.email_personal}
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
                    value={formData.ktp_province}
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
                    value={formData.ktp_city}
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
                    value={formData.ktp_district}
                    onChange={(e) => {
                      setFormData({ ...formData, ktp_district: e.target.value, ktp_village: '' });
                      setCustomKtpVillage(false);
                    }}
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
                      Desa / Kelurahan KTP
                    </label>
                    {ktpVillages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomKtpVillage(!isKtpVillageCustom);
                          if (isKtpVillageCustom) {
                            setFormData({ ...formData, ktp_village: '' });
                          }
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {isKtpVillageCustom ? 'Pilih dari Daftar' : '+ Ketik Bebas'}
                      </button>
                    )}
                  </div>

                  {!isKtpVillageCustom && ktpVillages.length > 0 ? (
                    <Select
                      value={formData.ktp_village}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setCustomKtpVillage(true);
                          setFormData({ ...formData, ktp_village: '' });
                        } else {
                          setFormData({ ...formData, ktp_village: e.target.value });
                        }
                      }}
                      disabled={!formData.ktp_district}
                    >
                      <option value="">-- Pilih Desa / Kelurahan --</option>
                      {ktpVillages.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                      <option value="__CUSTOM__">✏️ Ketik Manual / Lainnya...</option>
                    </Select>
                  ) : (
                    <Input
                      value={formData.ktp_village}
                      onChange={(e) => setFormData({ ...formData, ktp_village: e.target.value })}
                      placeholder={formData.ktp_district ? "Nama Desa / Kelurahan" : "-- Pilih Kecamatan Dulu --"}
                      disabled={!formData.ktp_district}
                      inputCase="proper"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kode Pos KTP
                  </label>
                  <Input
                    value={formData.ktp_postal_code}
                    onChange={(e) => setFormData({ ...formData, ktp_postal_code: e.target.value })}
                    placeholder="Kode Pos"
                    inputCase="upper"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Jalan, RT/RW (Sesuai KTP)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={formData.ktp_address}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                    setFormData({ ...formData, ktp_address: val });
                  }}
                  placeholder="Nama jalan, nomor rumah, RT/RW"
                />
              </div>
            </div>

            {/* Alamat Domisili */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Alamat Tempat Tinggal Saat Ini (Domisili)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      residential_province: formData.ktp_province,
                      residential_city: formData.ktp_city,
                      residential_district: formData.ktp_district,
                      residential_village: formData.ktp_village,
                      residential_postal_code: formData.ktp_postal_code,
                      residential_address: formData.ktp_address,
                    });
                    toast.success('Alamat KTP disalin ke Alamat Domisili');
                  }}
                  className="text-xs h-7 px-2.5 font-medium flex items-center gap-1 text-blue-600 dark:text-blue-400"
                >
                  <Copy className="h-3 w-3" />
                  Salin dari Alamat KTP
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Provinsi Domisili
                  </label>
                  <Select
                    value={formData.residential_province}
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
                    value={formData.residential_city}
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
                    {residentialCities.map((c) => (
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
                    value={formData.residential_district}
                    onChange={(e) => {
                      setFormData({ ...formData, residential_district: e.target.value, residential_village: '' });
                      setCustomResidentialVillage(false);
                    }}
                    disabled={!formData.residential_city}
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {residentialDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Desa / Kelurahan Domisili
                    </label>
                    {residentialVillages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomResidentialVillage(!isResidentialVillageCustom);
                          if (isResidentialVillageCustom) {
                            setFormData({ ...formData, residential_village: '' });
                          }
                        }}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {isResidentialVillageCustom ? 'Pilih dari Daftar' : '+ Ketik Bebas'}
                      </button>
                    )}
                  </div>

                  {!isResidentialVillageCustom && residentialVillages.length > 0 ? (
                    <Select
                      value={formData.residential_village}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setCustomResidentialVillage(true);
                          setFormData({ ...formData, residential_village: '' });
                        } else {
                          setFormData({ ...formData, residential_village: e.target.value });
                        }
                      }}
                      disabled={!formData.residential_district}
                    >
                      <option value="">-- Pilih Desa / Kelurahan --</option>
                      {residentialVillages.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                      <option value="__CUSTOM__">✏️ Ketik Manual / Lainnya...</option>
                    </Select>
                  ) : (
                    <Input
                      value={formData.residential_village}
                      onChange={(e) => setFormData({ ...formData, residential_village: e.target.value })}
                      placeholder={formData.residential_district ? "Nama Desa / Kelurahan" : "-- Pilih Kecamatan Dulu --"}
                      disabled={!formData.residential_district}
                      inputCase="proper"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kode Pos Domisili
                  </label>
                  <Input
                    value={formData.residential_postal_code}
                    onChange={(e) => setFormData({ ...formData, residential_postal_code: e.target.value })}
                    placeholder="Kode Pos"
                    inputCase="upper"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alamat Jalan, Mess / Perumahan (Domisili Saat Ini)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={formData.residential_address}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
                    setFormData({ ...formData, residential_address: val });
                  }}
                  placeholder="Alamat domisili saat ini / mess karyawan"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* =========================================================================
            SECTION 3: DATA FISIK & APD TAMBANG
        ========================================================================= */}
        <Card id="section-fisik" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Data Fisik & APD Tambang (K3 HSE)
                  {progressStats.sectionStatus.fisik && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Data antropometri, ukuran seragam, safety shoes, dan catatan kesehatan kerja tambang.
                </p>
              </div>
            </div>
            <HardHat className="h-6 w-6 text-slate-400 hidden sm:block" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Golongan Darah
                </label>
                <Select
                  value={formData.health_safety.blood_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_safety: { ...formData.health_safety, blood_type: e.target.value },
                    })
                  }
                >
                  <option value="">-- Pilih Golongan Darah --</option>
                  {bloodTypes.map((b) => (
                    <option key={b.code} value={b.code}>
                      Golongan {b.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rhesus
                </label>
                <Select
                  value={formData.health_safety.rhesus}
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
                  value={formData.health_safety.height_cm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_safety: { ...formData.health_safety, height_cm: e.target.value },
                    })
                  }
                  placeholder="Contoh: 172"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Berat Badan (kg)
                </label>
                <Input
                  type="number"
                  value={formData.health_safety.weight_kg}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_safety: { ...formData.health_safety, weight_kg: e.target.value },
                    })
                  }
                  placeholder="Contoh: 68"
                />
                {calculatedBmi && (
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${calculatedBmi.color}`}>
                    <Activity className="h-3 w-3" />
                    <span>BMI: {calculatedBmi.value} ({calculatedBmi.category})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Ukuran Alat Pelindung Diri (APD) & Seragam Tambang
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sepatu Safety (Safety Shoe Size)
                  </label>
                  <Select
                    value={formData.health_safety.safety_shoe_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health_safety: { ...formData.health_safety, safety_shoe_size: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Pilih Ukuran Sepatu --</option>
                    {shoeSizes.map((s) => (
                      <option key={s.code} value={s.code}>
                        Ukuran {s.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Baju / Kemeja Tambang
                  </label>
                  <Select
                    value={formData.health_safety.shirt_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health_safety: { ...formData.health_safety, shirt_size: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Pilih Ukuran Baju --</option>
                    {uniformSizes.map((u) => (
                      <option key={u.code} value={u.code}>
                        Size {u.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Celana Tambang
                  </label>
                  <Select
                    value={formData.health_safety.pants_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health_safety: { ...formData.health_safety, pants_size: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Pilih Ukuran Celana --</option>
                    {pantsSizes.map((p) => (
                      <option key={p.code} value={p.code}>
                        Nomor {p.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Coverall Tambang
                  </label>
                  <Select
                    value={formData.health_safety.coverall_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        health_safety: { ...formData.health_safety, coverall_size: e.target.value },
                      })
                    }
                  >
                    <option value="">-- Pilih Ukuran Coverall --</option>
                    {uniformSizes.map((u) => (
                      <option key={u.code} value={u.code}>
                        Size {u.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan Medis & Riwayat Alergi (Fit to Work)
              </label>
              <textarea
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.health_safety.medical_notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    health_safety: { ...formData.health_safety, medical_notes: e.target.value },
                  })
                }
                placeholder="Riwayat penyakit bawaan, alergi obat/makanan, atau catatan MCU khusus K3."
              />
            </div>
          </div>
        </Card>

        {/* =========================================================================
            SECTION 4: DATA KELUARGA & TANGGUNGAN (BPJS KES & NO ASURANSI STAFF)
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
                    {formData.families.length} Anggota
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500">
                  Wajib mengisi Ayah & Ibu Kandung. Jika berstatus Menikah, wajib tambahan Pasangan (Istri/Suami), Ayah & Ibu Mertua. Pengisian anak disesuaikan tanggungan pajak.
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
                onClick={() => {
                  setFormData({
                    ...formData,
                    families: [
                      ...formData.families,
                      {
                        relation_type: formData.families.length === 0 ? 'SPOUSE' : 'CHILD',
                        child_order: formData.families.length === 0 ? null : formData.families.filter((f) => f.relation_type === 'CHILD').length + 1,
                        name: '',
                        gender: 'FEMALE',
                        birth_place: '',
                        birth_date: '',
                        id_card_number: '',
                        bpjs_kesehatan_no: '',
                        insurance_no: '',
                        is_covered_insurance: true,
                        is_alive: true,
                      },
                    ],
                  });
                }}
                className="text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Anggota
              </Button>
            </div>
          </div>

          {/* Checklist Status Kepatuhan Ketentuan Wajib Keluarga */}
          <div className={`p-4 rounded-xl border transition-all mb-6 ${
            familyCompliance.isComplete
              ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
          }`}>
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
                    <Badge variant={familyCompliance.isComplete ? 'success' : 'warning'} className="text-[10px] py-0 px-2 font-semibold">
                      {familyCompliance.isComplete ? 'Lengkap & Sesuai Ketentuan' : 'Belum Lengkap'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ayah & Ibu kandung wajib diisi. {isEmployeeMarried ? 'Kategori Menikah wajib mencakup Pasangan & Kedua Mertua. ' : ''}
                    {requiredChildCount > 0 ? `Status Pajak ${formData.tax_status} mewajibkan minimal ${requiredChildCount} anak.` : 'Tanggungan anak sesuai status pajak.'}
                  </p>
                </div>
              </div>

              {!familyCompliance.isComplete && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={applyFamilyRequirementsTemplate}
                  className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Isi Otomatis Baris Wajib
                </Button>
              )}
            </div>

            {/* Badges Checklist Kepatuhan */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 text-xs">
              {/* 1. Ayah Kandung */}
              <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                familyCompliance.hasFather
                  ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                  : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
              }`}>
                <span className="font-medium">Ayah Kandung</span>
                {familyCompliance.hasFather ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                ) : (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                )}
              </div>

              {/* 2. Ibu Kandung */}
              <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                familyCompliance.hasMother
                  ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                  : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
              }`}>
                <span className="font-medium">Ibu Kandung</span>
                {familyCompliance.hasMother ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                ) : (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                )}
              </div>

              {/* 3. Pasangan (jika menikah) */}
              {isEmployeeMarried && (
                <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                  familyCompliance.hasSpouse
                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                    : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className="font-medium">Istri / Suami</span>
                  {familyCompliance.hasSpouse ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                  ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                  )}
                </div>
              )}

              {/* 4. Ayah Mertua (jika menikah) */}
              {isEmployeeMarried && (
                <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                  familyCompliance.hasFatherInLaw
                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                    : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className="font-medium">Ayah Mertua</span>
                  {familyCompliance.hasFatherInLaw ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                  ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                  )}
                </div>
              )}

              {/* 5. Ibu Mertua (jika menikah) */}
              {isEmployeeMarried && (
                <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                  familyCompliance.hasMotherInLaw
                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                    : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className="font-medium">Ibu Mertua</span>
                  {familyCompliance.hasMotherInLaw ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                  ) : (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Wajib</span>
                  )}
                </div>
              )}

              {/* 6. Anak Sesuai Tanggungan Pajak */}
              <div className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                familyCompliance.hasRequiredChildren
                  ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 text-slate-700 dark:text-slate-200'
                  : 'bg-white/80 dark:bg-slate-900/80 border-amber-300 dark:border-amber-800 text-slate-600 dark:text-slate-300'
              }`}>
                <span className="font-medium truncate mr-1">Anak ({familyCompliance.childrenCount}/{requiredChildCount})</span>
                {familyCompliance.hasRequiredChildren ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
                ) : (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">Kurang {requiredChildCount - familyCompliance.childrenCount}</span>
                )}
              </div>
            </div>
          </div>

          {formData.families.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
              <Heart className="h-10 w-10 text-rose-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Data Keluarga Masih Kosong
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Sesuai ketentuan, karyawan wajib mengisi data Ayah & Ibu Kandung
                {isEmployeeMarried ? ', serta Pasangan dan Kedua Mertua untuk status Menikah' : ''}
                {requiredChildCount > 0 ? `, dan ${requiredChildCount} data anak sesuai status pajak (${formData.tax_status})` : ''}.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={applyFamilyRequirementsTemplate}
                  className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Siapkan Baris Keluarga Wajib Otomatis
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      families: [
                        {
                          relation_type: 'FATHER',
                          name: '',
                          gender: 'MALE',
                          birth_place: '',
                          birth_date: '',
                          id_card_number: '',
                          bpjs_kesehatan_no: '',
                          insurance_no: '',
                          is_covered_insurance: false,
                          is_alive: true,
                        },
                      ],
                    });
                  }}
                  className="text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Manual
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.families.map((fam, idx) => {
                const isDependent = fam.relation_type === 'SPOUSE' || fam.relation_type === 'CHILD';
                const isStaff = formData.pangkat === 'Staff';

                const relationBadge =
                  fam.relation_type === 'FATHER' ? { label: 'Wajib Umum (Ayah)', variant: 'outline' as const, className: 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300' } :
                  fam.relation_type === 'MOTHER' ? { label: 'Wajib Umum (Ibu)', variant: 'outline' as const, className: 'border-pink-300 dark:border-pink-800 text-pink-700 dark:text-pink-300' } :
                  fam.relation_type === 'SPOUSE' ? { label: 'Wajib (Menikah)', variant: 'outline' as const, className: 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300' } :
                  fam.relation_type === 'FATHER_IN_LAW' ? { label: 'Wajib (Ayah Mertua)', variant: 'outline' as const, className: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' } :
                  fam.relation_type === 'MOTHER_IN_LAW' ? { label: 'Wajib (Ibu Mertua)', variant: 'outline' as const, className: 'border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300' } :
                  fam.relation_type === 'CHILD' ? { label: `Tanggungan (${formData.tax_status || 'Pajak'})`, variant: 'outline' as const, className: 'border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' } :
                  null;

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
                                      : fam.relation_type}
                        </span>
                        {relationBadge && (
                          <Badge variant={relationBadge.variant} className={`text-[10px] py-0.5 px-2 ${relationBadge.className}`}>
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
                          const updated = formData.families.filter((_, i) => i !== idx);
                          setFormData({ ...formData, families: updated });
                        }}
                        className="text-rose-500 hover:text-rose-700 h-7 w-7 p-0 rounded-lg"
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
                          value={fam.relation_type}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...formData.families];
                            updated[idx].relation_type = val;
                            if (val === 'FATHER' || val === 'FATHER_IN_LAW') {
                              updated[idx].gender = 'MALE';
                            } else if (val === 'MOTHER' || val === 'MOTHER_IN_LAW') {
                              updated[idx].gender = 'FEMALE';
                            } else if (val === 'SPOUSE') {
                              updated[idx].gender = formData.gender === 'FEMALE' ? 'MALE' : 'FEMALE';
                            } else if (val === 'CHILD' && !updated[idx].child_order) {
                              const childCount = updated.filter((f) => f.relation_type === 'CHILD').length;
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
                              const updated = [...formData.families];
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
                            const updated = [...formData.families];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, families: updated });
                          }}
                          placeholder="Nama lengkap sesuai KTP / Akta"
                          inputCase="proper"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Jenis Kelamin
                        </label>
                        <Select
                          value={fam.gender || 'FEMALE'}
                          onChange={(e) => {
                            const updated = [...formData.families];
                            updated[idx].gender = e.target.value;
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
                            const updated = [...formData.families];
                            updated[idx].birth_place = e.target.value;
                            setFormData({ ...formData, families: updated });
                          }}
                          placeholder="Kota kelahiran"
                          inputCase="proper"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tanggal Lahir <span className="text-rose-500">*</span>
                        </label>
                        <DatePicker
                          value={fam.birth_date ? fam.birth_date.split('T')[0] : ''}
                          onChange={(val) => {
                            const updated = [...formData.families];
                            updated[idx].birth_date = val;
                            setFormData({ ...formData, families: updated });
                          }}
                          placeholder="Pilih Tanggal Lahir"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          NIK KTP / No. KIA <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          value={fam.id_card_number || ''}
                          onChange={(e) => {
                            const updated = [...formData.families];
                            updated[idx].id_card_number = e.target.value;
                            setFormData({ ...formData, families: updated });
                          }}
                          placeholder="16 Digit NIK"
                          inputCase="upper"
                          required
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
                                const updated = [...formData.families];
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
                                  const updated = [...formData.families];
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
            SECTION 5: DATA REKENING BANK & PAYROLL
        ========================================================================= */}
        <Card id="section-payroll" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                5
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Data Rekening & Payroll Bank
                  {progressStats.sectionStatus.payroll && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Rekening bank utama untuk pembayaran gaji bulanan dan tunjangan operasional tambang.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData({
                  ...formData,
                  bank_accounts: [
                    ...formData.bank_accounts,
                    {
                      bank_name: 'Bank Mandiri',
                      account_number: '',
                      account_holder: formData.name || '',
                      is_payroll_primary: formData.bank_accounts.length === 0,
                    },
                  ],
                });
              }}
              className="text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Tambah Rekening
            </Button>
          </div>

          {formData.bank_accounts.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Belum ada rekening payroll yang ditambahkan.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    ...formData,
                    bank_accounts: [
                      {
                        bank_name: 'Bank Mandiri',
                        account_number: '',
                        account_holder: formData.name || '',
                        is_payroll_primary: true,
                      },
                    ],
                  });
                }}
                className="mt-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Tambah Rekening Utama Payroll
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.bank_accounts.map((b, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Bank
                    </label>
                    <Select
                      value={b.bank_name}
                      onChange={(e) => {
                        const updated = [...formData.bank_accounts];
                        updated[idx].bank_name = e.target.value;
                        setFormData({ ...formData, bank_accounts: updated });
                      }}
                    >
                      {bankOptions.map((opt) => (
                        <option key={opt.code} value={opt.name}>
                          {opt.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Rekening
                    </label>
                    <Input
                      value={b.account_number || ''}
                      onChange={(e) => {
                        const updated = [...formData.bank_accounts];
                        updated[idx].account_number = e.target.value;
                        setFormData({ ...formData, bank_accounts: updated });
                      }}
                      placeholder="Nomor rekening bank"
                      inputCase="upper"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Atas Nama Rekening
                    </label>
                    <Input
                      value={b.account_holder || ''}
                      onChange={(e) => {
                        const updated = [...formData.bank_accounts];
                        updated[idx].account_holder = e.target.value;
                        setFormData({ ...formData, bank_accounts: updated });
                      }}
                      placeholder="Nama pemilik rekening"
                      inputCase="proper"
                    />
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={b.is_payroll_primary}
                        onChange={(e) => {
                          const updated = formData.bank_accounts.map((acc, i) => ({
                            ...acc,
                            is_payroll_primary: i === idx ? e.target.checked : false,
                          }));
                          setFormData({ ...formData, bank_accounts: updated });
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>Rekening Payroll Utama</span>
                    </label>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = formData.bank_accounts.filter((_, i) => i !== idx);
                        setFormData({ ...formData, bank_accounts: updated });
                      }}
                      className="text-rose-500 hover:text-rose-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                6
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Riwayat Pendidikan & Kontak Darurat
                  {progressStats.sectionStatus.pendidikan && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Latar belakang pendidikan formal dan kontak darurat yang dapat dihubungi saat insiden tambang.
                </p>
              </div>
            </div>
            <GraduationCap className="h-6 w-6 text-slate-400 hidden sm:block" />
          </div>

          <div className="space-y-6">
            {/* Pendidikan */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Riwayat Pendidikan Formal
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      educations: [
                        ...formData.educations,
                        {
                          level: 'S1',
                          institution_name: '',
                          major: '',
                          graduation_year: new Date().getFullYear(),
                          gpa: '',
                          is_highest: formData.educations.length === 0,
                        },
                      ],
                    });
                  }}
                  className="text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Pendidikan
                </Button>
              </div>

              {formData.educations.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  Belum ada riwayat pendidikan.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.educations.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Jenjang
                        </label>
                        <Select
                          value={edu.level}
                          onChange={(e) => {
                            const updated = [...formData.educations];
                            updated[idx].level = e.target.value;
                            setFormData({ ...formData, educations: updated });
                          }}
                        >
                          {educationLevels.map((lvl) => (
                            <option key={lvl.code} value={lvl.code}>
                              {lvl.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Sekolah / Universitas
                        </label>
                        <Input
                          value={edu.institution_name || ''}
                          onChange={(e) => {
                            const updated = [...formData.educations];
                            updated[idx].institution_name = e.target.value;
                            setFormData({ ...formData, educations: updated });
                          }}
                          placeholder="Nama Institusi"
                          inputCase="proper"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Jurusan / Program Studi
                        </label>
                        <Input
                          value={edu.major || ''}
                          onChange={(e) => {
                            const updated = [...formData.educations];
                            updated[idx].major = e.target.value;
                            setFormData({ ...formData, educations: updated });
                          }}
                          placeholder="Jurusan"
                          inputCase="proper"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Tahun Lulus
                        </label>
                        <Input
                          type="number"
                          value={edu.graduation_year || ''}
                          onChange={(e) => {
                            const updated = [...formData.educations];
                            updated[idx].graduation_year = e.target.value ? parseInt(e.target.value, 10) : null;
                            setFormData({ ...formData, educations: updated });
                          }}
                          placeholder="Tahun"
                        />
                      </div>

                      <div className="flex items-center justify-between pb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={edu.is_highest}
                            onChange={(e) => {
                              const updated = formData.educations.map((item, i) => ({
                                ...item,
                                is_highest: i === idx ? e.target.checked : false,
                              }));
                              setFormData({ ...formData, educations: updated });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Tertinggi</span>
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.educations.filter((_, i) => i !== idx);
                            setFormData({ ...formData, educations: updated });
                          }}
                          className="text-rose-500 hover:text-rose-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kontak Darurat */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kontak Darurat (Emergency Call)
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      emergency_contacts: [
                        ...formData.emergency_contacts,
                        {
                          name: '',
                          relationship: 'Istri',
                          phone_number: '',
                          address: '',
                          is_primary: formData.emergency_contacts.length === 0,
                        },
                      ],
                    });
                  }}
                  className="text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Kontak Darurat
                </Button>
              </div>

              {formData.emergency_contacts.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  Belum ada kontak darurat.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.emergency_contacts.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Kontak
                        </label>
                        <Input
                          value={c.name || ''}
                          onChange={(e) => {
                            const updated = [...formData.emergency_contacts];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, emergency_contacts: updated });
                          }}
                          placeholder="Nama kontak darurat"
                          inputCase="proper"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Hubungan
                        </label>
                        <Input
                          value={c.relationship || ''}
                          onChange={(e) => {
                            const updated = [...formData.emergency_contacts];
                            updated[idx].relationship = e.target.value;
                            setFormData({ ...formData, emergency_contacts: updated });
                          }}
                          placeholder="Istri, Suami, Ayah, dll."
                          inputCase="proper"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nomor Telepon
                        </label>
                        <Input
                          value={c.phone_number || ''}
                          onChange={(e) => {
                            const updated = [...formData.emergency_contacts];
                            updated[idx].phone_number = e.target.value;
                            setFormData({ ...formData, emergency_contacts: updated });
                          }}
                          placeholder="08xxxxxxxxxx"
                        />
                      </div>

                      <div className="flex items-center justify-between pb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={c.is_primary}
                            onChange={(e) => {
                              const updated = formData.emergency_contacts.map((item, i) => ({
                                ...item,
                                is_primary: i === idx ? e.target.checked : false,
                              }));
                              setFormData({ ...formData, emergency_contacts: updated });
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Kontak Utama</span>
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = formData.emergency_contacts.filter((_, i) => i !== idx);
                            setFormData({ ...formData, emergency_contacts: updated });
                          }}
                          className="text-rose-500 hover:text-rose-700 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* =========================================================================
            SECTION 7: UPLOAD BERKAS DOKUMEN (STANDAR REFERENSI JENIS DOKUMEN)
        ========================================================================= */}
        <Card id="section-dokumen" className="p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs transition-all">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                7
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Upload Dokumen Sesuai Standar Referensi
                  {progressStats.sectionStatus.dokumen && (
                    <Badge variant="success" className="text-xs px-2 py-0.5">Lengkap</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Unggah berkas dokumen legalitas, identitas, asuransi, KIMPER, dan sertifikat kesehatan (Fit to Work). Format didukung: PDF, PNG, JPG (Maks. 20MB).
                </p>
              </div>
            </div>
            <FileText className="h-6 w-6 text-slate-400 hidden sm:block" />
          </div>

          {isLoadingDocTypes ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : documentTypes.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed rounded-xl">
              Tidak ada referensi jenis dokumen aktif yang ditemukan di sistem.
            </div>
          ) : (
            <div className="space-y-4">
              {documentTypes.map((docType) => {
                // Check if existing uploaded doc exists (edit mode)
                const existingDoc = existingDocuments.find((d) => d.document_type_id === docType.id);
                // Check if staged doc exists
                const staged = stagedDocs[docType.id];
                const isUploaded = !!existingDoc;
                const isStaged = !!staged?.file;
                const isUploadingThis = uploadingDocId === docType.id;

                // Category badges
                const categoryColor: Record<string, string> = {
                  IDENTITY: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                  FAMILY: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                  TAX: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                  INSURANCE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  MINE_SAFETY: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                  MEDICAL: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
                };

                return (
                  <div
                    key={docType.id}
                    className={`p-4 rounded-xl border transition-all ${isUploaded || isStaged
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : docType.required
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                        : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Document Type Header */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl flex items-center justify-center ${isUploaded || isStaged
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                          {isUploaded || isStaged ? (
                            <FileCheck className="h-5 w-5" />
                          ) : (
                            <File className="h-5 w-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {docType.name}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              ({docType.code})
                            </span>
                            {docType.required ? (
                              <Badge variant="danger" className="text-xs px-2 py-0.5">
                                Wajib
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 text-slate-400">
                                Opsional
                              </Badge>
                            )}
                            {docType.category && (
                              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${categoryColor[docType.category] || 'bg-slate-100 text-slate-700'}`}>
                                {docType.category}
                              </span>
                            )}
                          </div>

                          {/* Existing document info */}
                          {existingDoc && (
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                              <span className="font-semibold flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Terunggah: {existingDoc.file_name}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({existingDoc.formatted_file_size || `${Math.round((existingDoc.file_size || 0) / 1024)} KB`})
                              </span>
                              {existingDoc.expiry_date && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Exp: {existingDoc.expiry_date}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Staged file info */}
                          {isStaged && !existingDoc && (
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                              <span className="font-semibold flex items-center gap-1">
                                📄 Berkas Baru: {staged.file?.name}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({Math.round((staged.file?.size || 0) / 1024)} KB)
                              </span>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium">
                                Siap Disimpan
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* File Controls / Upload Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Expiry Date input if required by document type */}
                        {docType.expiry_required && (
                          <div className="w-44">
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Masa Berlaku (Exp) <span className="text-rose-500">*</span>
                            </label>
                            <DatePicker
                              value={staged?.expiry_date || existingDoc?.expiry_date || ''}
                              onChange={(val) => {
                                setStagedDocs((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    file: prev[docType.id]?.file || null,
                                    document_number: prev[docType.id]?.document_number || '',
                                    expiry_date: val,
                                    notes: prev[docType.id]?.notes || '',
                                  },
                                }));
                              }}
                              placeholder="Pilih Masa Berlaku"
                              className="h-8 text-xs"
                            />
                          </div>
                        )}

                        {/* File Input */}
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 20 * 1024 * 1024) {
                                  toast.error('Ukuran berkas maksimal 20MB');
                                  return;
                                }
                                setStagedDocs((prev) => ({
                                  ...prev,
                                  [docType.id]: {
                                    file,
                                    document_number: prev[docType.id]?.document_number || '',
                                    expiry_date: prev[docType.id]?.expiry_date || '',
                                    notes: prev[docType.id]?.notes || '',
                                  },
                                }));
                                toast.success(`Berkas "${file.name}" siap disimpan`);
                              }}
                            />
                            <div className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-2xs">
                              <UploadCloud className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{existingDoc ? 'Ganti Berkas' : 'Pilih Berkas'}</span>
                            </div>
                          </label>

                          {/* Direct upload button in edit mode if staged */}
                          {mode === 'edit' && staged?.file && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleDirectUploadDoc(docType)}
                              disabled={isUploadingThis}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              {isUploadingThis ? (
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <UploadCloud className="h-3 w-3 mr-1" />
                              )}
                              {isUploadingThis ? 'Mengunggah...' : 'Unggah Sekarang'}
                            </Button>
                          )}

                          {/* Cancel Staged */}
                          {staged?.file && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStagedDocs((prev) => {
                                  const next = { ...prev };
                                  delete next[docType.id];
                                  return next;
                                });
                              }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Existing Doc Actions: Preview, Download, Delete */}
                          {existingDoc && employeeId && (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewModalUrl(`/api/v1/admin/employees/${employeeId}/documents/${existingDoc.id}/preview`);
                                  setPreviewModalTitle(`${docType.name} - ${existingDoc.file_name}`);
                                }}
                                className="h-8 px-2.5 text-xs text-blue-600 dark:text-blue-400"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Lihat
                              </Button>

                              <a
                                href={`/api/v1/admin/employees/${employeeId}/documents/${existingDoc.id}/download`}
                                download
                                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center text-xs text-slate-700 dark:text-slate-300 font-medium"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Unduh
                              </a>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDoc(existingDoc.id, docType.name)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ================= STICKY BOTTOM ACTION BAR ================= */}
        <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${progressStats.percentage >= 85
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
              {progressStats.percentage}%
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {progressStats.percentage >= 85 ? 'Siap Disimpan & Diajukan' : 'Data Siap Disimpan'}
              </p>
              <p className="text-xs text-slate-500">
                {progressStats.filledCount} dari {progressStats.totalCount} parameter terpenuhi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href={mode === 'edit' && employeeId ? `/admin/employees/${employeeId}` : '/admin/employees'} className="flex-1 sm:flex-none">
              <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto font-medium text-xs">
                Batal
              </Button>
            </Link>

            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 shadow-md cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Menyimpan ke Database...' : mode === 'create' ? 'Daftarkan Karyawan Baru' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </form>

      {/* ================= MODAL PREVIEW DOKUMEN ================= */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                {previewModalTitle || 'Pratinjau Dokumen'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewModalUrl(null)}
                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2">
              <iframe
                src={previewModalUrl}
                className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800"
                title="Preview Berkas"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <a
                href={previewModalUrl.replace('/preview', '/download')}
                download
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh Berkas Ini
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewModalUrl(null)}
                className="text-xs"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
