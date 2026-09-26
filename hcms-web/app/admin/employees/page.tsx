'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Key,
  ShieldAlert,
  ShieldCheck,
  ArrowRightLeft,
  Building2,
  MapPin,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  UserCheck,
  UserX,
  Copy,
  Check,
  Download,
  Award
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
import { Employee, EmployeeFilterParams, ReferenceItem, MasterCompany, MasterSite, MasterDepartment, MasterSection, PositionItem, GradeItem, SalaryGradeItem, SalaryGradeJenjangItem, EmploymentTypeItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TablePagination } from '@/components/ui/TablePagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast, confirmDialog } from '@/stores/alertStore';
import { formatDate } from '@/lib/utils';
import { INDONESIA_PROVINCES, getCitiesByProvince, getDistrictsByCity } from '@/lib/indonesiaRegions';

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  // Filter & Pagination State
  const [params, setParams] = useState<EmployeeFilterParams>({
    page: 1,
    per_page: 10,
    search: '',
    company_id: '',
    site_id: '',
    department_id: '',
    section_id: '',
    position_id: '',
    pangkat: '',
    grade_id: '',
    salary_grade_id: '',
    salary_grade_jenjang_id: '',
    work_area: '',
    employment_status: '',
    gender: '',
  });

  const [sameAsKtp, setSameAsKtp] = useState(false);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementEmployee, setMovementEmployee] = useState<Employee | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetResult, setResetResult] = useState<{ username: string; temporary_password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form Wizard State (Steps 1 to 5)
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
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
    ktp_province: '',
    ktp_postal_code: '',
    residential_address: '',
    residential_city: '',
    residential_district: '',
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
    employment_status: '',
    health_safety: {
      blood_type: '',
      rhesus: '',
      height_cm: '',
      weight_kg: '',
      shirt_size: '',
      pants_size: '',
      safety_shoe_size: '',
      medical_notes: '',
    },
    families: [] as any[],
    educations: [] as any[],
    emergency_contacts: [] as any[],
    bank_accounts: [] as any[],
  });

  // Movement Form State
  const [movementForm, setMovementForm] = useState({
    movement_type: 'PROMOTION',
    letter_number: '',
    letter_date: '',
    effective_date: new Date().toISOString().split('T')[0],
    company_id: '',
    site_id: '',
    department_id: '',
    section_id: '',
    position_id: '',
    pangkat: 'Staff',
    grade_id: '',
    salary_grade_id: '',
    salary_grade_jenjang_id: '',
    employment_type_id: '',
    poh: '',
    work_area: '',
    reason: '',
  });

  // Load Main Employee Query
  const { data: employeeData, isLoading, refetch } = useQuery({
    queryKey: ['employees', params],
    queryFn: () => employeeService.getEmployees(params),
  });

  // Load Referensi Organisasi Queries
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

  // Load Referensi Standar Queries
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

  // Helpers parsing list
  const getRefList = (res: any, defaults: { code: string; name: string }[] = []): { code: string; name: string }[] => {
    if (!res) return defaults;
    const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
    return (items.length > 0 ? items : defaults) as { code: string; name: string }[];
  };

  const companies: MasterCompany[] = Array.isArray(companiesData?.data)
    ? companiesData.data
    : (Array.isArray(companiesData?.data?.data) ? companiesData.data.data : []);

  const sites: MasterSite[] = Array.isArray(sitesData?.data)
    ? sitesData.data
    : (Array.isArray(sitesData?.data?.data) ? sitesData.data.data : []);

  const departments: MasterDepartment[] = Array.isArray(departmentsData?.data)
    ? departmentsData.data
    : (Array.isArray(departmentsData?.data?.data) ? departmentsData.data.data : []);

  const sections: MasterSection[] = Array.isArray(sectionsData?.data)
    ? sectionsData.data
    : (Array.isArray(sectionsData?.data?.data) ? sectionsData.data.data : []);

  const positions: PositionItem[] = Array.isArray(positionsData?.data)
    ? positionsData.data
    : (Array.isArray(positionsData?.data?.data) ? positionsData.data.data : []);
  const grades: GradeItem[] = gradesData?.data || [];
  const salaryGrades: SalaryGradeItem[] = salaryGradesData?.data || [];
  const jenjangList: SalaryGradeJenjangItem[] = jenjangData?.data || [];
  const employmentTypes: EmploymentTypeItem[] = employmentTypesData?.data || [];

  const defaultReligions = [
    { code: 'ISLAM', name: 'Islam' },
    { code: 'KRISTEN', name: 'Kristen Protestan' },
    { code: 'KATOLIK', name: 'Katolik' },
    { code: 'HINDU', name: 'Hindu' },
    { code: 'BUDDHA', name: 'Buddha' },
    { code: 'KHONGHUCU', name: 'Khonghucu' },
  ];

  const defaultMaritalStatuses = [
    { code: 'SINGLE', name: 'Belum Menikah (Lajang)' },
    { code: 'MARRIED', name: 'Menikah' },
    { code: 'DIVORCED', name: 'Cerai Hidup' },
    { code: 'WIDOWED', name: 'Cerai Mati (Janda / Duda)' },
  ];

  const defaultTaxStatuses = [
    { code: 'TK/0', name: 'TK/0 - Tidak Kawin (Tanpa Tanggungan)' },
    { code: 'TK/1', name: 'TK/1 - Tidak Kawin (1 Tanggungan)' },
    { code: 'TK/2', name: 'TK/2 - Tidak Kawin (2 Tanggungan)' },
    { code: 'TK/3', name: 'TK/3 - Tidak Kawin (3 Tanggungan)' },
    { code: 'K/0', name: 'K/0 - Kawin (Tanpa Tanggungan)' },
    { code: 'K/1', name: 'K/1 - Kawin (1 Tanggungan)' },
    { code: 'K/2', name: 'K/2 - Kawin (2 Tanggungan)' },
    { code: 'K/3', name: 'K/3 - Kawin (3 Tanggungan)' },
    { code: 'K/I/0', name: 'K/I/0 - Kawin Istri Bekerja (Tanpa Tanggungan)' },
    { code: 'K/I/1', name: 'K/I/1 - Kawin Istri Bekerja (1 Tanggungan)' },
    { code: 'K/I/2', name: 'K/I/2 - Kawin Istri Bekerja (2 Tanggungan)' },
    { code: 'K/I/3', name: 'K/I/3 - Kawin Istri Bekerja (3 Tanggungan)' },
  ];

  const defaultBloodTypes = [
    { code: 'A', name: 'Golongan Darah A' },
    { code: 'B', name: 'Golongan Darah B' },
    { code: 'AB', name: 'Golongan Darah AB' },
    { code: 'O', name: 'Golongan Darah O' },
  ];

  const defaultUniformSizes = [
    { code: 'S', name: 'S' },
    { code: 'M', name: 'M' },
    { code: 'L', name: 'L' },
    { code: 'XL', name: 'XL' },
    { code: 'XXL', name: 'XXL' },
    { code: 'XXXL', name: 'XXXL' },
    { code: '4XL', name: '4XL' },
  ];

  const defaultPantsSizes = [
    { code: '28', name: '28' },
    { code: '29', name: '29' },
    { code: '30', name: '30' },
    { code: '31', name: '31' },
    { code: '32', name: '32' },
    { code: '33', name: '33' },
    { code: '34', name: '34' },
    { code: '36', name: '36' },
    { code: '38', name: '38' },
    { code: '40', name: '40' },
    { code: '42', name: '42' },
  ];

  const defaultShoeSizes = [
    { code: '38', name: '38' },
    { code: '39', name: '39' },
    { code: '40', name: '40' },
    { code: '41', name: '41' },
    { code: '42', name: '42' },
    { code: '43', name: '43' },
    { code: '44', name: '44' },
    { code: '45', name: '45' },
    { code: '46', name: '46' },
  ];

  const defaultBanks = [
    { code: 'MANDIRI', name: 'Bank Mandiri' },
    { code: 'BCA', name: 'Bank Central Asia (BCA)' },
    { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
    { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
    { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)' },
    { code: 'KALTIMTARA', name: 'Bank Kaltimtara' },
  ];

  const defaultEducationLevels = [
    { code: 'SMA_SMK', name: 'SMA / SMK Sederajat' },
    { code: 'D3', name: 'Diploma Tiga (D3)' },
    { code: 'D4', name: 'Diploma Empat (D4)' },
    { code: 'S1', name: 'Sarjana (S1)' },
    { code: 'S2', name: 'Magister (S2)' },
    { code: 'S3', name: 'Doktor (S3)' },
  ];

  const defaultPohList = [
    { code: 'Balikpapan', name: 'Balikpapan' },
    { code: 'Samarinda', name: 'Samarinda' },
    { code: 'Jakarta', name: 'Jakarta' },
    { code: 'Banjarmasin', name: 'Banjarmasin' },
    { code: 'Surabaya', name: 'Surabaya' },
    { code: 'Lokal Site', name: 'Lokal Site' },
    { code: 'Yogyakarta', name: 'Yogyakarta' },
    { code: 'Bandung', name: 'Bandung' },
  ];

  const defaultWorkAreas = [
    { code: 'Pit Mining', name: 'Pit Mining / Front Penambangan' },
    { code: 'Coal Processing Plant (CPP)', name: 'Coal Processing Plant (CPP)' },
    { code: 'Port / Jetty Khusus', name: 'Port / Terminal Jetty Khusus Batubara' },
    { code: 'Hauling Road', name: 'Jalan Angkut / Hauling Road' },
    { code: 'Workshop & Maintenance', name: 'Workshop Alat Berat & Maintenance' },
    { code: 'Camp & Mess', name: 'Camp / Mess Karyawan Site' },
    { code: 'Head Office', name: 'Head Office (HO)' },
    { code: 'Exploration Pit', name: 'Area Eksplorasi & Geoteknik' },
  ];

  const religions = getRefList(religionsData, defaultReligions);
  const maritalStatuses = getRefList(maritalData, defaultMaritalStatuses);
  const bloodTypes = getRefList(bloodTypesData, defaultBloodTypes);
  const uniformSizes = getRefList(uniformSizesData, defaultUniformSizes);
  const pantsSizes = getRefList(pantsSizesData, defaultPantsSizes);
  const shoeSizes = getRefList(shoeSizesData, defaultShoeSizes);
  const banks = getRefList(banksData, defaultBanks);
  const educationLevels = getRefList(educationsData, defaultEducationLevels);
  const pohList = getRefList(pohData, defaultPohList);
  const workAreaList = getRefList(workAreaData, defaultWorkAreas);

  // Cascading options untuk Wizard Form
  const formSites = formData.company_id
    ? sites.filter((s) => !s.company_id || String(s.company_id) === String(formData.company_id))
    : sites;

  const formDepartments = formData.site_id
    ? departments.filter((d) => !d.site_id || String(d.site_id) === String(formData.site_id))
    : (formData.company_id
      ? departments.filter((d) => !d.company_id || String(d.company_id) === String(formData.company_id))
      : departments);

  // SECTION INLINE DENGAN DEPARTEMEN
  const formSections = formData.department_id
    ? sections.filter((s) => String(s.department_id) === String(formData.department_id))
    : [];

  // POSITION INLINE DENGAN DEPARTEMEN & SECTION
  const formPositions = formData.department_id
    ? positions.filter((p) => {
        const matchDept = String(p.department_id) === String(formData.department_id);
        if (!matchDept) return false;
        if (formData.section_id) {
          return String(p.section_id) === String(formData.section_id);
        }
        return true;
      })
    : [];

  // Helper: Mencari SalaryGradeJenjang yang cocok secara presisi berdasarkan Level Jabatan (gradeId) & Golongan (salaryGradeId)
  const resolveAutoJenjangId = (
    gradeId?: string | number | null,
    salaryGradeId?: string | number | null,
    currentJenjangId?: string | number | null
  ): string => {
    const gId = gradeId ? String(gradeId) : '';
    const sgId = salaryGradeId ? String(salaryGradeId) : '';

    // Prioritas 1: Jika keduanya terisi, cari pasangan tepat
    if (gId && sgId) {
      const exactMatch = jenjangList.find(
        (j) => String(j.grade_id) === gId && String(j.salary_grade_id) === sgId
      );
      if (exactMatch) return String(exactMatch.id);
    }

    // Jika saat ini sudah ada currentJenjangId dan masih cocok dengan filter aktif, pertahankan
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

    // Prioritas 2: Jika hanya salah satu terisi dan hanya ada TEPAT 1 pilihan jenjang
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

  // Cascading Wilayah Bertingkat untuk Alamat KTP & Domisili
  const ktpCities = formData.ktp_province ? getCitiesByProvince(formData.ktp_province) : [];
  const ktpDistricts = formData.ktp_city ? getDistrictsByCity(formData.ktp_city) : [];

  const residentialCities = formData.residential_province ? getCitiesByProvince(formData.residential_province) : [];
  const residentialDistricts = formData.residential_city ? getDistrictsByCity(formData.residential_city) : [];

  // Cascading options untuk Movement Modal
  const movementSites = movementForm.company_id
    ? sites.filter((s) => !s.company_id || String(s.company_id) === String(movementForm.company_id))
    : sites;

  const movementDepartments = movementForm.site_id
    ? departments.filter((d) => !d.site_id || String(d.site_id) === String(movementForm.site_id))
    : (movementForm.company_id
      ? departments.filter((d) => !d.company_id || String(d.company_id) === String(movementForm.company_id))
      : departments);

  const movementSections = movementForm.department_id
    ? sections.filter((s) => String(s.department_id) === String(movementForm.department_id))
    : [];

  const movementPositions = movementForm.department_id
    ? positions.filter((p) => {
        const matchDept = String(p.department_id) === String(movementForm.department_id);
        if (!matchDept) return false;
        if (movementForm.section_id) {
          return String(p.section_id) === String(movementForm.section_id);
        }
        return true;
      })
    : [];

  const movementJenjang = jenjangList.filter((j) => {
    if (movementForm.salary_grade_jenjang_id && String(j.id) === String(movementForm.salary_grade_jenjang_id)) {
      return true;
    }
    if (movementForm.salary_grade_id && j.salary_grade_id && String(j.salary_grade_id) !== String(movementForm.salary_grade_id)) {
      return false;
    }
    if (movementForm.grade_id && j.grade_id && String(j.grade_id) !== String(movementForm.grade_id)) {
      return false;
    }
    return true;
  });

  // Cascading options untuk Filter Toolbar
  const filterSections = params.department_id
    ? sections.filter((s) => String(s.department_id) === String(params.department_id))
    : sections;

  const filterPositions = params.department_id
    ? positions.filter((p) => {
        const matchDept = String(p.department_id) === String(params.department_id) ||
                          String(p.organization_unit_id) === String(params.department_id);
        if (!matchDept) return false;
        if (params.section_id && p.section_id) {
          return String(p.section_id) === String(params.section_id);
        }
        return true;
      })
    : positions;

  const filterJenjang = params.salary_grade_id
    ? jenjangList.filter((j) => !j.salary_grade_id || String(j.salary_grade_id) === String(params.salary_grade_id))
    : (params.grade_id
      ? jenjangList.filter((j) => !j.grade_id || String(j.grade_id) === String(params.grade_id))
      : jenjangList);

  // ============================================================
  // TOMBOL SEMENTARA DUMMY DATA (TESTING ONLY - REMOVE IN PROD)
  // ============================================================
  const fillDummyData = () => {
    const comp = companies[0];
    const compId = comp ? String(comp.id) : '';

    const availableSites = compId ? sites.filter((s) => !s.company_id || String(s.company_id) === compId) : sites;
    const site = availableSites[0] || sites[0];
    const siteId = site ? String(site.id) : '';

    const availableDepts = siteId ? departments.filter((d) => !d.site_id || String(d.site_id) === siteId) : departments;
    const dept = availableDepts[0] || departments[0];
    const deptId = dept ? String(dept.id) : '';

    const availableSecs = deptId ? sections.filter((s) => String(s.department_id) === deptId) : sections;
    const sec = availableSecs[0];
    const secId = sec ? String(sec.id) : '';

    const availablePositions = deptId
      ? positions.filter((p) => {
          const matchDept = String(p.department_id) === deptId || String(p.organization_unit_id) === deptId;
          if (!matchDept) return false;
          if (secId && p.section_id) return String(p.section_id) === secId;
          return true;
        })
      : positions;
    const pos = availablePositions[0] || positions[0];
    const posId = pos ? String(pos.id) : '';

    // Ambil grade dan pangkat langsung dari position yang dipilih
    const posGradeId = pos?.grade_id ? String(pos.grade_id) : (pos?.grade?.id ? String(pos.grade.id) : (grades[0] ? String(grades[0].id) : ''));
    const matchedGrade = grades.find((g) => String(g.id) === posGradeId) || pos?.grade || grades[0];
    const grdId = posGradeId;
    const pangkatVal = matchedGrade?.pangkat || 'Staff';

    // Cari pasangan Jenjang & Golongan yang selaras dengan Level Jabatan (grdId)
    const matchingJenjang = jenjangList.find((j) => String(j.grade_id) === grdId);
    const salGrdId = matchingJenjang?.salary_grade_id
      ? String(matchingJenjang.salary_grade_id)
      : (salaryGrades[0] ? String(salaryGrades[0].id) : '');

    const autoJnjId = resolveAutoJenjangId(grdId, salGrdId);
    const jnjId = autoJnjId || (matchingJenjang ? String(matchingJenjang.id) : (jenjangList[0] ? String(jenjangList[0].id) : ''));

    const empType = employmentTypes[0];
    const empTypeId = empType ? String(empType.id) : '';

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dummyNrp = `EMP${randomSuffix}`;
    const dummyNames = [
      'Budi Santoso, S.T.',
      'Reza Pratama, S.Kom.',
      'Ahmad Fauzi, A.Md.',
      'Dedi Kurniawan, S.T.',
      'Eko Prasetyo, S.E.',
      'Bambang Wijaya, S.T.',
      'Doni Setiawan, S.T.',
      'Hendra Saputra, S.T.',
    ];
    const randomName = dummyNames[Math.floor(Math.random() * dummyNames.length)];
    const randomNick = randomName.split(' ')[0];

    setFormData({
      nrp: dummyNrp,
      name: randomName,
      nickname: randomNick,
      gender: 'MALE',
      birth_place: 'Samarinda',
      birth_date: '1993-05-14',
      religion: 'ISLAM',
      marital_status: 'MARRIED',
      marriage_date: '2020-02-20',
      id_card_number: `647201140593000${Math.floor(1 + Math.random() * 9)}`,
      tax_number: '948123456789000',
      tax_status: 'K/1',
      bpjs_ketenagakerjaan: '22019485761',
      bpjs_kesehatan: '0001849204918',
      insurance_admedika: 'ADM-6472-991',
      email_company: `${randomNick.toLowerCase()}.${dummyNrp.toLowerCase()}@pertambangan.co.id`,
      email_personal: `${randomNick.toLowerCase()}${randomSuffix}@gmail.com`,
      phone_mobile: `08125544${randomSuffix}`,
      phone_home: `0541743${Math.floor(100 + Math.random() * 900)}`,
      ktp_address: 'Jl. Mulawarman No. 45 RT 012 RW 003, Kel. Karang Mumus',
      ktp_province: 'Kalimantan Timur',
      ktp_city: 'Kota Samarinda',
      ktp_district: 'Samarinda Kota',
      ktp_postal_code: '75113',
      residential_address: 'Mess Karyawan Blok B-04, Pit Mining Camp',
      residential_province: 'Kalimantan Timur',
      residential_city: 'Kabupaten Kutai Barat',
      residential_district: 'Barong Tongkok',
      residential_postal_code: '75776',
      company_id: compId,
      site_id: siteId,
      department_id: deptId,
      section_id: secId,
      position_id: posId,
      pangkat: pangkatVal,
      grade_id: grdId,
      salary_grade_id: salGrdId,
      salary_grade_jenjang_id: jnjId,
      employment_type_id: empTypeId,
      poh: 'Balikpapan',
      work_area: 'Pit Mining / Front Penambangan',
      hire_date: '2022-03-01',
      employment_status: 'ACTIVE',
      health_safety: {
        blood_type: 'O',
        rhesus: '+',
        height_cm: '173',
        weight_kg: '68',
        shirt_size: 'XL',
        pants_size: '34',
        safety_shoe_size: '42',
        medical_notes: 'Tidak ada riwayat alergi makanan/obat. Kondisi fisik prima K3.',
      },
      families: [
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
        {
          relation_type: 'FATHER',
          name: 'Hadi Santoso',
          gender: 'MALE',
          birth_place: 'Solo',
          birth_date: '1965-03-12',
          id_card_number: '6472011203650003',
          bpjs_kesehatan_no: '',
          insurance_no: '',
          health_provider_no: '',
          is_covered_insurance: false,
          is_alive: true,
        },
      ],
      educations: [
        {
          level: 'S1',
          institution_name: 'Universitas Mulawarman',
          major: 'Teknik Pertambangan',
          graduation_year: 2016,
          gpa: 3.52,
          is_highest: true,
        },
      ],
      emergency_contacts: [
        {
          name: 'Dewi Lestari (Istri)',
          relationship: 'SPOUSE',
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

    toast.success(`🧪 [Dummy Data Test] Berhasil mengisi 40+ field lengkap untuk "${randomName}"!`);
  };

  const rawData: any = employeeData?.data;
  const employees: Employee[] = Array.isArray(rawData)
    ? rawData
    : (Array.isArray(rawData?.data) ? rawData.data : []);
  const meta = employeeData?.meta?.total !== undefined ? employeeData.meta : rawData;

  // Mutasi & Actions
  const createMutation = useMutation({
    mutationFn: (payload: any) => employeeService.createEmployee(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Karyawan berhasil didaftarkan');
      setCreateModalOpen(false);
      resetWizardForm();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mendaftarkan karyawan');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => employeeService.updateEmployee(id, payload),
    onSuccess: () => {
      toast.success('Data karyawan berhasil diperbarui');
      setCreateModalOpen(false);
      setEditEmployee(null);
      resetWizardForm();
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal memperbarui karyawan');
    },
  });

  const movementMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => employeeService.recordMovement(id, payload),
    onSuccess: () => {
      toast.success('Perubahan karir / mutasi jabatan berhasil disimpan');
      setMovementModalOpen(false);
      setMovementEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal merekam mutasi karir');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => employeeService.toggleStatus(id, status),
    onSuccess: () => {
      toast.success('Status kepegawaian berhasil diubah');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: number) => employeeService.resetPassword(id),
    onSuccess: (res) => {
      setResetResult(res.data);
      setResetModalOpen(true);
      toast.success('Password karyawan berhasil di-reset');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal me-reset password');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeService.deleteEmployee(id),
    onSuccess: () => {
      toast.success('Karyawan berhasil dinonaktifkan / dipindahkan ke tempat sampah');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal menghapus karyawan');
    },
  });

  // Handlers
  const resetWizardForm = () => {
    setCurrentStep(1);
    setEditEmployee(null);
    setFormData({
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
      ktp_province: '',
      ktp_postal_code: '',
      residential_address: '',
      residential_city: '',
      residential_district: '',
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
      employment_status: '',
      health_safety: {
        blood_type: '',
        rhesus: '',
        height_cm: '',
        weight_kg: '',
        shirt_size: '',
        pants_size: '',
        safety_shoe_size: '',
        medical_notes: '',
      },
      families: [],
      educations: [],
      emergency_contacts: [],
      bank_accounts: [],
    });
  };

  const handleOpenCreate = () => {
    resetWizardForm();
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setFormData({
      nrp: emp.nrp,
      name: emp.name,
      nickname: emp.nickname || '',
      gender: emp.gender,
      birth_place: emp.birth_place || '',
      birth_date: emp.birth_date ? emp.birth_date.split('T')[0] : '',
      religion: emp.religion || 'ISLAM',
      marital_status: emp.marital_status || 'SINGLE',
      marriage_date: emp.marriage_date ? emp.marriage_date.split('T')[0] : '',
      id_card_number: emp.id_card_number || '',
      tax_number: emp.tax_number || '',
      tax_status: emp.tax_status || 'TK/0',
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
      ktp_province: emp.ktp_province || '',
      ktp_postal_code: emp.ktp_postal_code || '',
      residential_address: emp.residential_address || '',
      residential_city: emp.residential_city || '',
      residential_district: emp.residential_district || '',
      residential_province: emp.residential_province || '',
      residential_postal_code: emp.residential_postal_code || '',
      company_id: emp.company_id ? String(emp.company_id) : (emp.site?.company_id ? String(emp.site.company_id) : ''),
      site_id: emp.site_id ? String(emp.site_id) : '',
      department_id: emp.department_id ? String(emp.department_id) : '',
      section_id: emp.section_id ? String(emp.section_id) : '',
      position_id: emp.position_id ? String(emp.position_id) : '',
      pangkat: emp.pangkat || emp.grade?.pangkat || 'Staff',
      grade_id: emp.grade_id ? String(emp.grade_id) : '',
      salary_grade_id: emp.salary_grade_id ? String(emp.salary_grade_id) : '',
      salary_grade_jenjang_id: emp.salary_grade_jenjang_id
        ? String(emp.salary_grade_jenjang_id)
        : resolveAutoJenjangId(emp.grade_id, emp.salary_grade_id),
      employment_type_id: emp.employment_type_id ? String(emp.employment_type_id) : '',
      poh: emp.poh || '',
      work_area: emp.work_area || '',
      hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
      employment_status: emp.employment_status || 'ACTIVE',
      health_safety: {
        blood_type: emp.health_safety?.blood_type || 'O',
        rhesus: emp.health_safety?.rhesus || '+',
        height_cm: emp.health_safety?.height_cm || '',
        weight_kg: emp.health_safety?.weight_kg || '',
        shirt_size: emp.health_safety?.shirt_size || 'L',
        pants_size: emp.health_safety?.pants_size || '32',
        safety_shoe_size: emp.health_safety?.safety_shoe_size || '42',
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
    setCurrentStep(1);
    setCreateModalOpen(true);
  };

  const handleOpenMovement = (emp: Employee) => {
    setMovementEmployee(emp);
    setMovementForm({
      movement_type: 'PROMOTION',
      letter_number: '',
      letter_date: new Date().toISOString().split('T')[0],
      effective_date: new Date().toISOString().split('T')[0],
      company_id: emp.company_id ? String(emp.company_id) : (emp.site?.company_id ? String(emp.site.company_id) : ''),
      site_id: emp.site_id ? String(emp.site_id) : '',
      department_id: emp.department_id ? String(emp.department_id) : '',
      section_id: emp.section_id ? String(emp.section_id) : '',
      position_id: emp.position_id ? String(emp.position_id) : '',
      pangkat: emp.pangkat || emp.grade?.pangkat || 'Staff',
      grade_id: emp.grade_id ? String(emp.grade_id) : '',
      salary_grade_id: emp.salary_grade_id ? String(emp.salary_grade_id) : '',
      salary_grade_jenjang_id: emp.salary_grade_jenjang_id
        ? String(emp.salary_grade_jenjang_id)
        : resolveAutoJenjangId(emp.grade_id, emp.salary_grade_id),
      employment_type_id: emp.employment_type_id ? String(emp.employment_type_id) : '',
      poh: emp.poh || '',
      work_area: emp.work_area || '',
      reason: '',
    });
    setMovementModalOpen(true);
  };

  const handleDelete = async (emp: Employee) => {
    const confirmed = await confirmDialog({
      title: 'Hapus / Nonaktifkan Karyawan',
      message: `Apakah Anda yakin ingin menonaktifkan data karyawan "${emp.name}" (NRP: ${emp.nrp})? Akun login terkait juga akan dinonaktifkan.`,
      confirmText: 'Ya, Nonaktifkan',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (confirmed) {
      deleteMutation.mutate(emp.id);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.employment_status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmed = await confirmDialog({
      title: `${nextStatus === 'ACTIVE' ? 'Aktifkan' : 'Nonaktifkan'} Karyawan`,
      message: nextStatus === 'ACTIVE'
        ? `Aktifkan kembali karyawan "${emp.name}" dan aktifkan hak akses login ESS?`
        : `Nonaktifkan karyawan "${emp.name}"? Karyawan akan otomatis dikeluarkan dari semua sesi login aktif.`,
      confirmText: nextStatus === 'ACTIVE' ? 'Aktifkan' : 'Nonaktifkan',
      cancelText: 'Batal',
      variant: nextStatus === 'ACTIVE' ? 'primary' : 'warning',
    });
    if (confirmed) {
      toggleStatusMutation.mutate({ id: emp.id, status: nextStatus });
    }
  };

  const handleSaveWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nrp || !formData.name || !formData.birth_date) {
      toast.error('NRP, Nama, dan Tanggal Lahir wajib diisi');
      return;
    }

    // Validasi data keluarga: nama, NIK, tempat lahir, tanggal lahir WAJIB ADA
    if (formData.families && formData.families.length > 0) {
      for (let i = 0; i < formData.families.length; i++) {
        const fam = formData.families[i];
        if (!fam.name || !fam.name.trim()) {
          toast.error(`Nama anggota keluarga #${i + 1} wajib diisi`);
          setCurrentStep(3);
          return;
        }
        if (!fam.id_card_number || !fam.id_card_number.trim()) {
          toast.error(`NIK / No. KTP untuk "${fam.name || `Keluarga #${i + 1}`}" wajib diisi`);
          setCurrentStep(3);
          return;
        }
        if (!fam.birth_place || !fam.birth_place.trim()) {
          toast.error(`Tempat lahir untuk "${fam.name || `Keluarga #${i + 1}`}" wajib diisi`);
          setCurrentStep(3);
          return;
        }
        if (!fam.birth_date) {
          toast.error(`Tanggal lahir untuk "${fam.name || `Keluarga #${i + 1}`}" wajib diisi`);
          setCurrentStep(3);
          return;
        }
      }
    }

    // Bersihkan BPJS/Asuransi jika bukan pasangan atau anak, dan asuransi hanya untuk Staff
    const isStaffEmployee = (formData.pangkat || 'Staff').toLowerCase() === 'staff';
    const sanitizedFamilies = (formData.families || []).map((fam: any) => {
      const isEligible = fam.relation_type === 'SPOUSE' || fam.relation_type === 'CHILD';
      const bpjsNo = isEligible ? (fam.bpjs_kesehatan_no || fam.health_provider_no || null) : null;
      const insNo = (isEligible && isStaffEmployee) ? (fam.insurance_no || null) : null;
      return {
        ...fam,
        bpjs_kesehatan_no: bpjsNo,
        health_provider_no: bpjsNo,
        insurance_no: insNo,
        is_covered_insurance: isEligible ? (fam.is_covered_insurance ?? true) : false,
      };
    });

    const payload = {
      ...formData,
      families: sanitizedFamilies,
    };

    if (editEmployee) {
      updateMutation.mutate({ id: editEmployee.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Password sementara disalin ke clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
            Manajemen Data Karyawan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan biodata personel, mutasi karir historis, APD pertambangan, dan integrasi akun ESS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/employees/create">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm shadow-blue-500/20"
            >
              <Plus className="h-4 w-4" />
              Tambah Karyawan
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Karyawan</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {meta?.total ?? employees.length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Status Aktif</p>
              <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {employees.filter(e => e.employment_status === 'ACTIVE').length}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Penempatan Site</p>
              <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {sites.length} Site
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Departemen</p>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {departments.length}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={params.search || ''}
              onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              placeholder="Cari NRP, Nama, atau No. KTP..."
              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>

          {/* Filter Perusahaan */}
          <Select
            value={params.company_id ? String(params.company_id) : ''}
            onChange={(e) => setParams((prev) => ({ ...prev, company_id: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Perusahaan</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>

          {/* Filter Site */}
          <Select
            value={params.site_id ? String(params.site_id) : ''}
            onChange={(e) => setParams((prev) => ({ ...prev, site_id: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Site / Area</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.code})
              </option>
            ))}
          </Select>

          {/* Filter Departemen */}
          <Select
            value={params.department_id ? String(params.department_id) : ''}
            onChange={(e) => {
              const newDeptId = e.target.value;
              setParams((prev) => ({
                ...prev,
                department_id: newDeptId,
                section_id: '',
                position_id: '',
                page: 1,
              }));
            }}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Departemen</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>

          {/* Filter Section (Inline dengan Departemen) */}
          <Select
            value={params.section_id ? String(params.section_id) : ''}
            onChange={(e) => {
              const newSecId = e.target.value;
              setParams((prev) => ({
                ...prev,
                section_id: newSecId,
                position_id: '',
                page: 1,
              }));
            }}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">
              {params.department_id ? 'Semua Section di Dept Terpilih' : 'Semua Section'}
            </option>
            {filterSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} ({sec.code})
              </option>
            ))}
          </Select>

          {/* Filter Jabatan (Inline dengan Departemen & Section) */}
          <Select
            value={params.position_id ? String(params.position_id) : ''}
            onChange={(e) => setParams((prev) => ({ ...prev, position_id: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">
              {params.department_id ? 'Semua Jabatan di Dept Terpilih' : 'Semua Jabatan'}
            </option>
            {filterPositions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.title}
              </option>
            ))}
          </Select>

          {/* Filter Pangkat (Staff / Non Staff) */}
          <Select
            value={params.pangkat || ''}
            onChange={(e) => setParams((prev) => ({ ...prev, pangkat: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Pangkat</option>
            <option value="Staff">Staff</option>
            <option value="Non Staff">Non Staff</option>
          </Select>

          {/* Filter Level Jabatan (Grade) */}
          <Select
            value={params.grade_id ? String(params.grade_id) : ''}
            onChange={(e) => setParams((prev) => ({ ...prev, grade_id: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Level Jabatan</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>

          {/* Filter Golongan (Salary Grade) */}
          <Select
            value={params.salary_grade_id ? String(params.salary_grade_id) : ''}
            onChange={(e) => {
              const newSalGrdId = e.target.value;
              setParams((prev) => ({
                ...prev,
                salary_grade_id: newSalGrdId,
                salary_grade_jenjang_id: '',
                page: 1,
              }));
            }}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Golongan</option>
            {salaryGrades.map((sg) => (
              <option key={sg.id} value={sg.id}>
                Golongan {sg.name}
              </option>
            ))}
          </Select>

          {/* Filter Level / Jenjang Karir */}
          <Select
            value={params.salary_grade_jenjang_id ? String(params.salary_grade_jenjang_id) : ''}
            onChange={(e) => setParams((prev) => ({ ...prev, salary_grade_jenjang_id: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">
              {params.salary_grade_id ? 'Semua Jenjang di Golongan Ini' : 'Semua Level / Jenjang'}
            </option>
            {filterJenjang.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </Select>

          {/* Filter Area Kerja Tambang */}
          <Select
            value={params.work_area || ''}
            onChange={(e) => setParams((prev) => ({ ...prev, work_area: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Area Tambang</option>
            {workAreaList.map((wa) => (
              <option key={wa.code} value={wa.name}>
                {wa.name}
              </option>
            ))}
          </Select>

          {/* Filter Status */}
          <Select
            value={params.employment_status || ''}
            onChange={(e) => setParams((prev) => ({ ...prev, employment_status: e.target.value, page: 1 }))}
            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">AKTIF</option>
            <option value="PROBATION">PROBATION</option>
            <option value="INACTIVE">NON-AKTIF</option>
            <option value="RESIGNED">RESIGNED</option>
            <option value="TERMINATED">TERMINATED</option>
          </Select>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Karyawan</th>
                <th className="px-4 py-3.5">Jabatan & Pangkat</th>
                <th className="px-4 py-3.5">Unit Organisasi</th>
                <th className="px-4 py-3.5">Hubungan Kerja</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-36" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState
                      icon={<Users className="h-6 w-6" />}
                      title="Belum Ada Data Karyawan"
                      description="Data karyawan yang cocok dengan kriteria filter belum ditemukan."
                      actionLabel="Tambah Karyawan Baru"
                      onAction={handleOpenCreate}
                    />
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isActive = emp.employment_status === 'ACTIVE';

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Karyawan */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold text-sm shadow-xs border border-blue-200/50 dark:border-blue-800/50">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/admin/employees/${emp.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>{emp.name}</span>
                              {emp.age !== null && (
                                <span className="text-[11px] font-normal text-slate-400">
                                  ({emp.age} thn)
                                </span>
                              )}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                {emp.nrp}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {emp.gender === 'MALE' ? 'L' : 'P'} • {emp.religion || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Jabatan & Pangkat */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {emp.position?.title || '-'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {(emp.pangkat || emp.grade?.pangkat) && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300">
                              {emp.pangkat || emp.grade?.pangkat}
                            </Badge>
                          )}
                          {emp.grade && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                              {emp.grade.name}
                            </Badge>
                          )}
                          {emp.salary_grade && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300">
                              Gol. {emp.salary_grade.name}
                            </Badge>
                          )}
                          {emp.salary_grade_jenjang && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              • {emp.salary_grade_jenjang.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Unit Organisasi & Area */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {emp.company && (
                            <span className="font-semibold text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200/60 dark:border-blue-800/60">
                              {emp.company.code || emp.company.name}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {emp.department?.name || '-'}
                          </span>
                        </div>
                        {emp.section && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Sec: {emp.section.name}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{emp.site?.name || 'HO'}</span>
                          {emp.work_area && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              • {emp.work_area}
                            </span>
                          )}
                          {emp.poh && <span className="text-slate-400">• POH {emp.poh}</span>}
                        </div>
                      </td>

                      {/* 4. Hubungan Kerja */}
                      <td className="px-4 py-3.5">
                        <Badge variant="neutral" className="text-[10px]">
                          {emp.employment_type?.name || 'PKWTT'}
                        </Badge>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Masuk: {formatDate(emp.hire_date)}
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={isActive ? 'success' : 'neutral'}>
                          {emp.employment_status}
                        </Badge>
                      </td>

                      {/* 6. Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detail Profile Link */}
                          <Link
                            href={`/admin/employees/${emp.id}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Lihat Detail Profil & Riwayat"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Tombol Mutasi / Promosi Karir */}
                          <button
                            type="button"
                            onClick={() => handleOpenMovement(emp)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Mutasi / Promosi Jabatan (Snapshot Baku)"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>

                          {/* Tombol Reset Password User */}
                          <button
                            type="button"
                            onClick={() => resetPasswordMutation.mutate(emp.id)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Reset Password Akun Login"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          {/* Edit Profil */}
                          <Link
                            href={`/admin/employees/${emp.id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Edit Data Karyawan (Halaman Lengkap)"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {/* Toggle Aktif / Nonaktif */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                            }`}
                            title={isActive ? 'Nonaktifkan Akun (Auto-Logout)' : 'Aktifkan Kembali'}
                          >
                            {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>

                          {/* Hapus Soft Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Karyawan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.total! > 0 && (
          <TablePagination
            currentPage={params.page || 1}
            totalPages={meta.last_page || 1}
            perPage={params.per_page || 10}
            totalItems={meta.total || 0}
            itemLabel="karyawan"
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
            onPerPageChange={(per_page) => setParams((prev) => ({ ...prev, per_page, page: 1 }))}
          />
        )}
      </Card>

      {/* MODAL 1: FORM WIZARD TAMBAH / EDIT KARYAWAN */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={
          <div className="flex items-center justify-between gap-3 w-full pr-6 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white">
              {editEmployee ? `Edit Data Karyawan: ${editEmployee.name}` : 'Registrasi Karyawan Baru'}
            </span>
            {/* TEMPORARY DUMMY DATA BUTTON - REMOVE BEFORE PRODUCTION */}
            {!editEmployee && (
              <button
                type="button"
                onClick={fillDummyData}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 hover:bg-amber-500/20 transition-all cursor-pointer shadow-xs"
                title="Tombol Sementara Pengujian: Isi otomatis seluruh formulir 5 langkah dengan data dummy personel tambang yang valid (Akan dihapus saat produksi)"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>🧪 Isi Dummy Data (Testing)</span>
              </button>
            )}
          </div>
        }
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveWizard} className="space-y-5">
          {/* Stepper Wizard Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { num: 1, label: 'Penempatan' },
              { num: 2, label: 'Biodata & Alamat' },
              { num: 3, label: 'Data Fisik & APD' },
              { num: 4, label: 'Keluarga & Darurat' },
              { num: 5, label: 'Pendidikan & Konfirmasi' },
            ].map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num)}
                className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  currentStep === step.num
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    currentStep === step.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {step.num}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>

          {/* STEP 1: INFORMASI PENEMPATAN & REFERENSI ORGANISASI */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    NRP Karyawan <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.nrp}
                    onChange={(e) => setFormData({ ...formData, nrp: e.target.value })}
                    placeholder="Contoh: 20260012"
                  />
                  <span className="text-[10px] text-slate-400">NRP akan otomatis menjadi Username login ESS</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap (Sesuai KTP) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama Lengkap Karyawan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Panggilan (Nickname)
                  </label>
                  <Input
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="Nama Panggilan / Alias"
                  />
                </div>

                {/* Referensi Organisasi: Perusahaan */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Entitas Perusahaan (Company)
                  </label>
                  <Select
                    value={formData.company_id}
                    onChange={(e) => {
                      const newCompanyId = e.target.value;
                      setFormData({
                        ...formData,
                        company_id: newCompanyId,
                        site_id: '',
                        department_id: '',
                        section_id: '',
                        position_id: '',
                      });
                    }}
                  >
                    <option value="">Pilih Perusahaan (Opsional)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Site Tambang */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Area Kerja / Site Tambang <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={formData.site_id}
                    onChange={(e) => {
                      const newSiteId = e.target.value;
                      setFormData({
                        ...formData,
                        site_id: newSiteId,
                        department_id: '',
                        section_id: '',
                        position_id: '',
                      });
                    }}
                  >
                    <option value="">Pilih Site</option>
                    {formSites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Departemen */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Departemen <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={formData.department_id}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      setFormData({
                        ...formData,
                        department_id: newDeptId,
                        section_id: '',
                        position_id: '',
                      });
                    }}
                  >
                    <option value="">Pilih Departemen</option>
                    {formDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Section (INLINE DENGAN DEPARTEMEN) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Section / Sub-Bagian</span>
                    {formData.department_id && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                        {formSections.length} Section tersedia
                      </span>
                    )}
                  </label>
                  <Select
                    disabled={!formData.department_id}
                    value={formData.section_id}
                    onChange={(e) => {
                      const newSectionId = e.target.value;
                      setFormData({
                        ...formData,
                        section_id: newSectionId,
                        position_id: '',
                      });
                    }}
                  >
                    <option value="">
                      {!formData.department_id
                        ? '-- Pilih Departemen Terlebih Dahulu --'
                        : formSections.length === 0
                        ? '-- Tidak Ada Section di Departemen Ini --'
                        : '-- Pilih Section (Opsional) --'}
                    </option>
                    {formSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.code})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Jabatan (INLINE DENGAN DEPARTEMEN & SECTION) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Jabatan (Position) <span className="text-rose-500">*</span></span>
                    {formData.department_id && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                        {formPositions.length} Jabatan tersedia
                      </span>
                    )}
                  </label>
                  <Select
                    required
                    disabled={!formData.department_id}
                    value={formData.position_id}
                    onChange={(e) => {
                      const newPosId = e.target.value;
                      const selectedPos = positions.find((p) => String(p.id) === newPosId);

                      // Otomatis ambil Level Jabatan (Grade) dan Pangkat dari data Position yang dipilih
                      const posGradeId = selectedPos?.grade_id
                        ? String(selectedPos.grade_id)
                        : (selectedPos?.grade?.id ? String(selectedPos.grade.id) : '');
                      const posGrade = grades.find((g) => String(g.id) === posGradeId) || selectedPos?.grade;
                      const posPangkat = posGrade?.pangkat || selectedPos?.grade?.pangkat || (posGradeId ? 'Staff' : formData.pangkat);
                      const targetGradeId = posGradeId || formData.grade_id;
                      const autoJenjangId = resolveAutoJenjangId(targetGradeId, formData.salary_grade_id, formData.salary_grade_jenjang_id);

                      setFormData({
                        ...formData,
                        position_id: newPosId,
                        grade_id: targetGradeId,
                        pangkat: posPangkat || formData.pangkat || 'Staff',
                        salary_grade_jenjang_id: autoJenjangId,
                      });
                    }}
                  >
                    <option value="">
                      {!formData.department_id
                        ? '-- Pilih Departemen Terlebih Dahulu --'
                        : formPositions.length === 0
                        ? '-- Tidak Ada Jabatan di Dept/Section Ini --'
                        : '-- Pilih Jabatan --'}
                    </option>
                    {formPositions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Pangkat */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Pangkat</span>
                    {formData.position_id && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Otomatis dari Jabatan
                      </span>
                    )}
                  </label>
                  <Select
                    value={formData.pangkat}
                    onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                  >
                    <option value="">-- Pilih Pangkat --</option>
                    <option value="Staff">Staff</option>
                    <option value="Non Staff">Non Staff</option>
                  </Select>
                </div>

                {/* Referensi Organisasi: Level Jabatan (Grade) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Level Jabatan (Grade)</span>
                    {formData.position_id && formData.grade_id && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                        Otomatis dari Jabatan
                      </span>
                    )}
                  </label>
                  <Select
                    value={formData.grade_id}
                    onChange={(e) => {
                      const newGradeId = e.target.value;
                      const selectedGrade = grades.find((g) => String(g.id) === newGradeId);
                      const autoJenjangId = resolveAutoJenjangId(newGradeId, formData.salary_grade_id, formData.salary_grade_jenjang_id);
                      setFormData({
                        ...formData,
                        grade_id: newGradeId,
                        pangkat: selectedGrade?.pangkat || formData.pangkat || 'Staff',
                        salary_grade_jenjang_id: autoJenjangId,
                      });
                    }}
                  >
                    <option value="">Pilih Level Jabatan</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} {g.pangkat ? `(${g.pangkat})` : ''}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Golongan (Salary Grade) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Golongan (Salary Grade)
                  </label>
                  <Select
                    value={formData.salary_grade_id || ''}
                    onChange={(e) => {
                      const newSalGrdId = e.target.value;
                      const autoJenjangId = resolveAutoJenjangId(formData.grade_id, newSalGrdId, formData.salary_grade_jenjang_id);
                      setFormData({
                        ...formData,
                        salary_grade_id: newSalGrdId,
                        salary_grade_jenjang_id: autoJenjangId,
                      });
                    }}
                  >
                    <option value="">Pilih Golongan</option>
                    {salaryGrades.map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        Golongan {sg.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Jenjang / Level Karir */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span>Level / Jenjang Karir</span>
                    {(formData.salary_grade_id || formData.grade_id) && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                        {formJenjang.length} Jenjang tersedia
                      </span>
                    )}
                  </label>
                  <Select
                    value={formData.salary_grade_jenjang_id}
                    onChange={(e) => {
                      const newJnjId = e.target.value;
                      const matchedJnj = jenjangList.find((j) => String(j.id) === newJnjId);
                      setFormData({
                        ...formData,
                        salary_grade_jenjang_id: newJnjId,
                        grade_id: matchedJnj?.grade_id ? String(matchedJnj.grade_id) : formData.grade_id,
                        salary_grade_id: matchedJnj?.salary_grade_id ? String(matchedJnj.salary_grade_id) : formData.salary_grade_id,
                      });
                    }}
                  >
                    <option value="">
                      {!formData.salary_grade_id && !formData.grade_id
                        ? '-- Pilih Golongan & Level Jabatan Terlebih Dahulu --'
                        : formJenjang.length === 0
                        ? '-- Belum Ada Jenjang di Golongan & Level Ini --'
                        : '-- Pilih Level / Jenjang --'}
                    </option>
                    {formJenjang.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Organisasi: Hubungan Kerja */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Hubungan Kerja
                  </label>
                  <Select
                    value={formData.employment_type_id}
                    onChange={(e) => setFormData({ ...formData, employment_type_id: e.target.value })}
                  >
                    <option value="">Pilih Hubungan Kerja</option>
                    {employmentTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.name} ({et.code})
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Standar: Area Kerja Tambang (WORK_AREA) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Area Kerja Tambang (Work Area)
                  </label>
                  <Select
                    value={formData.work_area}
                    onChange={(e) => setFormData({ ...formData, work_area: e.target.value })}
                  >
                    <option value="">Pilih Area Kerja Tambang</option>
                    {workAreaList.map((wa) => (
                      <option key={wa.code} value={wa.name}>
                        {wa.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Standar: Point of Hire (POH) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Point of Hire (POH)
                  </label>
                  <Select
                    value={formData.poh}
                    onChange={(e) => setFormData({ ...formData, poh: e.target.value })}
                  >
                    <option value="">Pilih Point of Hire (POH)</option>
                    {pohList.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Masuk Kerja (Hire Date) <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                    required
                    value={formData.hire_date}
                    onChange={(val) => setFormData({ ...formData, hire_date: val })}
                    placeholder="Pilih Tanggal Masuk"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Kepegawaian
                  </label>
                  <Select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                  >
                    <option value="ACTIVE">AKTIF</option>
                    <option value="PROBATION">PROBATION (Percobaan)</option>
                    <option value="INACTIVE">NON-AKTIF</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BIODATA PRIBADI & REFERENSI STANDAR */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">-- Pilih Jenis Kelamin --</option>
                    <option value="MALE">Laki-Laki</option>
                    <option value="FEMALE">Perempuan</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tempat Lahir
                  </label>
                  <Input
                    value={formData.birth_place}
                    onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                    placeholder="Kota Tempat Lahir"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  <DatePicker
                    required
                    value={formData.birth_date}
                    onChange={(val) => setFormData({ ...formData, birth_date: val })}
                    placeholder="Pilih Tanggal Lahir"
                  />
                  <span className="text-[10px] text-slate-400">Digunakan untuk password default (HCMS#DDMMYYYY)</span>
                </div>

                {/* Referensi Standar: Agama */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nomor KTP (NIK 16 Digit)
                  </label>
                  <Input
                    value={formData.id_card_number}
                    onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                    placeholder="3507xxxxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nomor NPWP
                  </label>
                  <Input
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="Format NPWP 16 Digit"
                  />
                </div>

                {/* Referensi Standar: Status Pernikahan & PTKP Pajak */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Pernikahan
                  </label>
                  <Select
                    value={formData.marital_status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setFormData((prev: any) => {
                        const updated = { ...prev, marital_status: newStatus };
                        if (newStatus === 'SINGLE') {
                          updated.tax_status = 'TK/0';
                          updated.marriage_date = '';
                        } else if (newStatus === 'MARRIED' && prev.tax_status?.startsWith('TK')) {
                          updated.tax_status = 'K/0';
                        }
                        return updated;
                      });
                    }}
                  >
                    <option value="">-- Pilih Status Pernikahan --</option>
                    {maritalStatuses.map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Pajak PTKP
                  </label>
                  <Select
                    value={formData.tax_status}
                    onChange={(e) => setFormData({ ...formData, tax_status: e.target.value })}
                  >
                    <option value="">-- Pilih Status Pajak PTKP --</option>
                    {defaultTaxStatuses.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {formData.marital_status === 'MARRIED' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Pernikahan
                    </label>
                    <DatePicker
                      value={formData.marriage_date}
                      onChange={(val) => setFormData({ ...formData, marriage_date: val })}
                      placeholder="Pilih Tanggal Pernikahan"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <Input
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                    placeholder="0812xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Kantor / Perusahaan
                  </label>
                  <Input
                    type="email"
                    value={formData.email_company}
                    onChange={(e) => setFormData({ ...formData, email_company: e.target.value })}
                    placeholder="nama@perusahaan.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Pribadi
                  </label>
                  <Input
                    type="email"
                    value={formData.email_personal}
                    onChange={(e) => setFormData({ ...formData, email_personal: e.target.value })}
                    placeholder="nama@gmail.com"
                  />
                </div>

                {/* WILAYAH BERTINGKAT: ALAMAT KTP (CASCADING DROPDOWN) */}
                <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    Alamat Sesuai KTP (Wilayah Bertingkat)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Provinsi (KTP)
                      </label>
                      <Select
                        value={formData.ktp_province}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          setFormData((prev: any) => {
                            const updated = {
                              ...prev,
                              ktp_province: newProv,
                              ktp_city: '',
                              ktp_district: '',
                            };
                            if (sameAsKtp) {
                              updated.residential_province = newProv;
                              updated.residential_city = '';
                              updated.residential_district = '';
                            }
                            return updated;
                          });
                        }}
                      >
                        <option value="">-- Pilih Provinsi KTP --</option>
                        {INDONESIA_PROVINCES.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Kota / Kabupaten (KTP)
                      </label>
                      <Select
                        disabled={!formData.ktp_province}
                        value={formData.ktp_city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setFormData((prev: any) => {
                            const updated = { ...prev, ktp_city: newCity, ktp_district: '' };
                            if (sameAsKtp) {
                              updated.residential_city = newCity;
                              updated.residential_district = '';
                            }
                            return updated;
                          });
                        }}
                      >
                        <option value="">
                          {!formData.ktp_province ? '-- Pilih Provinsi Dahulu --' : '-- Pilih Kota / Kabupaten --'}
                        </option>
                        {ktpCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Kecamatan (KTP)
                      </label>
                      {ktpDistricts.length > 0 ? (
                        <Select
                          disabled={!formData.ktp_city}
                          value={formData.ktp_district}
                          onChange={(e) => {
                            const newDistrict = e.target.value;
                            setFormData((prev: any) => {
                              const updated = { ...prev, ktp_district: newDistrict };
                              if (sameAsKtp) updated.residential_district = newDistrict;
                              return updated;
                            });
                          }}
                        >
                          <option value="">
                            {!formData.ktp_city ? '-- Pilih Kota Dahulu --' : '-- Pilih Kecamatan --'}
                          </option>
                          {ktpDistricts.map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                          {formData.ktp_district && !ktpDistricts.includes(formData.ktp_district) && (
                            <option value={formData.ktp_district}>{formData.ktp_district}</option>
                          )}
                        </Select>
                      ) : (
                        <Input
                          disabled={!formData.ktp_city}
                          value={formData.ktp_district}
                          onChange={(e) => {
                            const newDistrict = e.target.value;
                            setFormData((prev: any) => {
                              const updated = { ...prev, ktp_district: newDistrict };
                              if (sameAsKtp) updated.residential_district = newDistrict;
                              return updated;
                            });
                          }}
                          placeholder={!formData.ktp_city ? '-- Pilih Kota Dahulu --' : 'Nama Kecamatan'}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Kode Pos (KTP)
                      </label>
                      <Input
                        value={formData.ktp_postal_code}
                        onChange={(e) => {
                          const newPostal = e.target.value;
                          setFormData((prev: any) => {
                            const updated = { ...prev, ktp_postal_code: newPostal };
                            if (sameAsKtp) updated.residential_postal_code = newPostal;
                            return updated;
                          });
                        }}
                        placeholder="Contoh: 75113"
                      />
                    </div>

                    <div className="sm:col-span-2 md:col-span-4">
                      <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                        Jalan, RT/RW, Kelurahan / Desa, No. Rumah (KTP)
                      </label>
                      <Input
                        value={formData.ktp_address}
                        onChange={(e) => {
                          const newAddr = e.target.value;
                          setFormData((prev: any) => {
                            const updated = { ...prev, ktp_address: newAddr };
                            if (sameAsKtp) updated.residential_address = newAddr;
                            return updated;
                          });
                        }}
                        placeholder="Contoh: Jl. Mulawarman No. 45 RT 012 RW 003, Kel. Karang Mumus"
                      />
                    </div>
                  </div>
                </div>

                {/* WILAYAH BERTINGKAT: ALAMAT TINGGAL DOMISILI / MESS SITE */}
                <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                      Alamat Domisili / Mess Karyawan (Wilayah Bertingkat)
                    </h4>
                    <label className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 cursor-pointer font-medium select-none">
                      <input
                        type="checkbox"
                        checked={sameAsKtp}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSameAsKtp(checked);
                          if (checked) {
                            setFormData((prev: any) => ({
                              ...prev,
                              residential_province: prev.ktp_province,
                              residential_city: prev.ktp_city,
                              residential_district: prev.ktp_district,
                              residential_postal_code: prev.ktp_postal_code,
                              residential_address: prev.ktp_address,
                            }));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>Sama dengan Alamat KTP</span>
                    </label>
                  </div>

                  {!sameAsKtp ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                          Provinsi (Domisili)
                        </label>
                        <Select
                          value={formData.residential_province}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              residential_province: e.target.value,
                              residential_city: '',
                              residential_district: '',
                            })
                          }
                        >
                          <option value="">-- Pilih Provinsi Domisili --</option>
                          {INDONESIA_PROVINCES.map((p) => (
                            <option key={p.name} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                          Kota / Kabupaten (Domisili)
                        </label>
                        <Select
                          disabled={!formData.residential_province}
                          value={formData.residential_city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              residential_city: e.target.value,
                              residential_district: '',
                            })
                          }
                        >
                          <option value="">
                            {!formData.residential_province
                              ? '-- Pilih Provinsi Dahulu --'
                              : '-- Pilih Kota / Kabupaten --'}
                          </option>
                          {residentialCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                          Kecamatan (Domisili)
                        </label>
                        {residentialDistricts.length > 0 ? (
                          <Select
                            disabled={!formData.residential_city}
                            value={formData.residential_district}
                            onChange={(e) =>
                              setFormData({ ...formData, residential_district: e.target.value })
                            }
                          >
                            <option value="">
                              {!formData.residential_city
                                ? '-- Pilih Kota Dahulu --'
                                : '-- Pilih Kecamatan --'}
                            </option>
                            {residentialDistricts.map((dist) => (
                              <option key={dist} value={dist}>
                                {dist}
                              </option>
                            ))}
                            {formData.residential_district &&
                              !residentialDistricts.includes(formData.residential_district) && (
                                <option value={formData.residential_district}>
                                  {formData.residential_district}
                                </option>
                              )}
                          </Select>
                        ) : (
                          <Input
                            disabled={!formData.residential_city}
                            value={formData.residential_district}
                            onChange={(e) =>
                              setFormData({ ...formData, residential_district: e.target.value })
                            }
                            placeholder={!formData.residential_city ? '-- Pilih Kota Dahulu --' : 'Nama Kecamatan'}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                          Kode Pos (Domisili)
                        </label>
                        <Input
                          value={formData.residential_postal_code}
                          onChange={(e) => setFormData({ ...formData, residential_postal_code: e.target.value })}
                          placeholder="Kode Pos"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-4">
                        <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                          Alamat Domisili / Mess / Kamar Camp
                        </label>
                        <Input
                          value={formData.residential_address}
                          onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                          placeholder="Contoh: Mess Karyawan Blok B-04 / Rumah Domisili"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
                      Menggunakan alamat KTP: {formData.ktp_address ? `${formData.ktp_address}, Kec. ${formData.ktp_district || '-'}, ${formData.ktp_city || ''}, ${formData.ktp_province || ''}` : 'Sesuai isian KTP di atas.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DATA FISIK & APD TAMBANG (REFERENSI STANDAR) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                Data fisik dan APD ini digunakan langsung oleh tim K3/HSE site untuk pembagian Seragam Tambang, Sepatu Safety, dan kesiapsiagaan First Aid.
              </div>

              {/* Tinggi & Berat Badan + Kalkulasi BMI Otomatis */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  Parameter Fisik & Skrining Kesehatan K3
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tinggi Badan (cm)
                    </label>
                    <Input
                      type="number"
                      min="100"
                      max="250"
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
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Berat Badan (kg)
                    </label>
                    <Input
                      type="number"
                      min="30"
                      max="200"
                      value={formData.health_safety.weight_kg}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          health_safety: { ...formData.health_safety, weight_kg: e.target.value },
                        })
                      }
                      placeholder="Contoh: 68"
                    />
                  </div>

                  <div className="pt-1">
                    {(() => {
                      const h = Number(formData.health_safety.height_cm) / 100;
                      const w = Number(formData.health_safety.weight_kg);
                      if (h > 1.2 && w > 30) {
                        const bmi = (w / (h * h)).toFixed(1);
                        const bmiNum = Number(bmi);
                        let statusText = 'Normal / Ideal';
                        let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
                        if (bmiNum < 18.5) {
                          statusText = 'Underweight (Kurang)';
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
                        } else if (bmiNum >= 25 && bmiNum < 30) {
                          statusText = 'Overweight (Berlebih)';
                          badgeColor = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
                        } else if (bmiNum >= 30) {
                          statusText = 'Obesitas';
                          badgeColor = 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300';
                        }
                        return (
                          <div className={`p-2.5 rounded-lg border text-xs text-center font-medium ${badgeColor}`}>
                            <div>BMI: <span className="font-bold">{bmi}</span></div>
                            <div className="text-[11px] font-semibold">{statusText}</div>
                          </div>
                        );
                      }
                      return (
                        <div className="text-[11px] text-slate-400 italic text-center p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                          Masukkan tinggi & berat badan untuk skrining BMI K3
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Referensi Standar: Golongan Darah */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                    {bloodTypes.map((bt) => (
                      <option key={bt.code} value={bt.code}>
                        {bt.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                    <option value="+">Positif (+)</option>
                    <option value="-">Negatif (-)</option>
                  </Select>
                </div>

                {/* Referensi Standar: Ukuran Seragam / Wearpack */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ukuran Baju / Wearpack
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
                    {uniformSizes.map((u) => (
                      <option key={u.code} value={u.code}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Standar: Ukuran Celana Kerja */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ukuran Celana Kerja
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
                    {pantsSizes.map((ps) => (
                      <option key={ps.code} value={ps.code}>
                        {ps.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Referensi Standar: Ukuran Sepatu Safety */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ukuran Sepatu Safety
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
                    {shoeSizes.map((ss) => (
                      <option key={ss.code} value={ss.code}>
                        {ss.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Medis / Alergi Obat
                </label>
                <Input
                  value={formData.health_safety.medical_notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      health_safety: { ...formData.health_safety, medical_notes: e.target.value },
                    })
                  }
                  placeholder="Contoh: Alergi Penisilin, Asma, dsb"
                />
              </div>

              {/* Jaminan Sosial & Asuransi */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
                  BPJS & Asuransi Kesehatan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      BPJS Ketenagakerjaan (KPJ)
                    </label>
                    <Input
                      value={formData.bpjs_ketenagakerjaan}
                      onChange={(e) => setFormData({ ...formData, bpjs_ketenagakerjaan: e.target.value })}
                      placeholder="Nomor KPJ"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      BPJS Kesehatan
                    </label>
                    <Input
                      value={formData.bpjs_kesehatan}
                      onChange={(e) => setFormData({ ...formData, bpjs_kesehatan: e.target.value })}
                      placeholder="Nomor Kartu BPJS"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Asuransi Admedika
                    </label>
                    <Input
                      value={formData.insurance_admedika}
                      onChange={(e) => setFormData({ ...formData, insurance_admedika: e.target.value })}
                      placeholder="Nomor Polis Admedika"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: KELUARGA & REKENING BANK PAYROLL */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Anggota Keluarga */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Anggota Keluarga & Tanggungan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pasangan, Anak 1..n, Ayah, Ibu, atau Mertua
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        families: [
                          ...formData.families,
                          {
                            relation_type: formData.families.length === 0 ? 'SPOUSE' : 'CHILD',
                            child_order: formData.families.filter((f: any) => f.relation_type === 'CHILD').length + 1,
                            name: '',
                            gender: formData.families.length === 0 ? 'FEMALE' : 'MALE',
                            birth_place: '',
                            birth_date: '',
                            id_card_number: '',
                            bpjs_kesehatan_no: '',
                            insurance_no: '',
                            health_provider_no: '',
                            is_covered_insurance: true,
                            is_alive: true,
                          },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Keluarga
                  </Button>
                </div>

                {formData.families.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada data anggota keluarga</p>
                    <p className="text-[11px] text-slate-400">
                      Klik tombol &quot;Tambah Keluarga&quot; di atas untuk memasukkan data Pasangan, Anak, atau Orang Tua.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.families.map((fam: any, idx: number) => {
                      const isEligibleForInsurance = fam.relation_type === 'SPOUSE' || fam.relation_type === 'CHILD';
                      const isStaff = (formData.pangkat || 'Staff').toLowerCase() === 'staff';

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-3.5"
                        >
                          {/* Header Anggota Keluarga */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {fam.relation_type === 'SPOUSE'
                                  ? 'Pasangan (Istri / Suami)'
                                  : fam.relation_type === 'CHILD'
                                  ? `Anak ke-${fam.child_order || idx + 1}`
                                  : fam.relation_type === 'FATHER'
                                  ? 'Ayah Kandung'
                                  : fam.relation_type === 'MOTHER'
                                  ? 'Ibu Kandung'
                                  : fam.relation_type === 'FATHER_IN_LAW'
                                  ? 'Ayah Mertua'
                                  : fam.relation_type === 'MOTHER_IN_LAW'
                                  ? 'Ibu Mertua'
                                  : 'Anggota Lainnya'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.families.filter((_: any, i: number) => i !== idx);
                                setFormData({ ...formData, families: updated });
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Anggota Keluarga"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Hubungan & Urutan Anak */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Hubungan Keluarga <span className="text-rose-500">*</span>
                              </label>
                              <Select
                                value={fam.relation_type}
                                onChange={(e) => {
                                  const updated = [...formData.families];
                                  const newRel = e.target.value;
                                  updated[idx].relation_type = newRel;
                                  // Jika bukan pasangan atau anak, reset BPJS & Asuransi
                                  if (newRel !== 'SPOUSE' && newRel !== 'CHILD') {
                                    updated[idx].bpjs_kesehatan_no = '';
                                    updated[idx].insurance_no = '';
                                    updated[idx].health_provider_no = '';
                                    updated[idx].is_covered_insurance = false;
                                  } else {
                                    updated[idx].is_covered_insurance = true;
                                  }
                                  setFormData({ ...formData, families: updated });
                                }}
                              >
                                <option value="SPOUSE">Pasangan (Istri/Suami)</option>
                                <option value="CHILD">Anak</option>
                                <option value="FATHER">Ayah Kandung</option>
                                <option value="MOTHER">Ibu Kandung</option>
                                <option value="FATHER_IN_LAW">Ayah Mertua</option>
                                <option value="MOTHER_IN_LAW">Ibu Mertua</option>
                                <option value="OTHER">Lainnya</option>
                              </Select>
                            </div>

                            {fam.relation_type === 'CHILD' && (
                              <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Urutan Anak (Anak Ke-)
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={fam.child_order || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.families];
                                    updated[idx].child_order = e.target.value ? parseInt(e.target.value) : null;
                                    setFormData({ ...formData, families: updated });
                                  }}
                                  placeholder="Contoh: 1, 2, 3"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Jenis Kelamin
                              </label>
                              <Select
                                value={fam.gender || 'MALE'}
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
                          </div>

                          {/* Data Pokok Wajib: Nama, NIK, Tempat Lahir, Tgl Lahir */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nama Lengkap <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                required
                                value={fam.name}
                                onChange={(e) => {
                                  const updated = [...formData.families];
                                  updated[idx].name = e.target.value;
                                  setFormData({ ...formData, families: updated });
                                }}
                                placeholder="Nama sesuai KTP/KIA"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                NIK / No. KTP / KIA <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                required
                                maxLength={20}
                                value={fam.id_card_number || ''}
                                onChange={(e) => {
                                  const updated = [...formData.families];
                                  updated[idx].id_card_number = e.target.value;
                                  setFormData({ ...formData, families: updated });
                                }}
                                placeholder="16 digit NIK"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tempat Lahir <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                required
                                value={fam.birth_place || ''}
                                onChange={(e) => {
                                  const updated = [...formData.families];
                                  updated[idx].birth_place = e.target.value;
                                  setFormData({ ...formData, families: updated });
                                }}
                                placeholder="Kota / Kabupaten"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tanggal Lahir <span className="text-rose-500">*</span>
                              </label>
                              <DatePicker
                                required
                                value={fam.birth_date ? fam.birth_date.split('T')[0] : ''}
                                onChange={(val) => {
                                  const updated = [...formData.families];
                                  updated[idx].birth_date = val;
                                  setFormData({ ...formData, families: updated });
                                }}
                                placeholder="Pilih Tanggal Lahir"
                              />
                            </div>
                          </div>

                          {/* BPJS Kesehatan & Asuransi (HANYA UNTUK ISTRI/SUAMI DAN ANAK) */}
                          {isEligibleForInsurance ? (
                            <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  <span>Fasilitas Jaminan Kesehatan &amp; Asuransi</span>
                                </div>
                                {isStaff ? (
                                  <span className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                    Pangkat: Staff (BPJS + Asuransi)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                    Pangkat: Non Staff (BPJS Kesehatan)
                                  </span>
                                )}
                              </div>

                              <div className={`grid grid-cols-1 ${isStaff ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-3`}>
                                <div>
                                  <label className="block text-xs font-medium text-emerald-900 dark:text-emerald-300 mb-1">
                                    Nomor BPJS Kesehatan
                                  </label>
                                  <Input
                                    value={fam.bpjs_kesehatan_no ?? fam.health_provider_no ?? ''}
                                    onChange={(e) => {
                                      const updated = [...formData.families];
                                      updated[idx].bpjs_kesehatan_no = e.target.value;
                                      updated[idx].health_provider_no = e.target.value;
                                      setFormData({ ...formData, families: updated });
                                    }}
                                    placeholder="Contoh: 0001849204919 (13 digit)"
                                    className="bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                                  />
                                </div>

                                {isStaff && (
                                  <div>
                                    <label className="block text-xs font-medium text-emerald-900 dark:text-emerald-300 mb-1 flex items-center justify-between">
                                      <span>Nomor Asuransi</span>
                                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-normal">
                                        Asuransi Rawat / Komersial
                                      </span>
                                    </label>
                                    <Input
                                      value={fam.insurance_no || ''}
                                      onChange={(e) => {
                                        const updated = [...formData.families];
                                        updated[idx].insurance_no = e.target.value;
                                        setFormData({ ...formData, families: updated });
                                      }}
                                      placeholder="Contoh: ADM-9928174 / No. Polis"
                                      className="bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40">
                                <input
                                  type="checkbox"
                                  id={`covered-${idx}`}
                                  checked={fam.is_covered_insurance !== false}
                                  onChange={(e) => {
                                    const updated = [...formData.families];
                                    updated[idx].is_covered_insurance = e.target.checked;
                                    setFormData({ ...formData, families: updated });
                                  }}
                                  className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label
                                  htmlFor={`covered-${idx}`}
                                  className="text-xs font-medium text-emerald-900 dark:text-emerald-300 cursor-pointer select-none"
                                >
                                  Ditanggung Fasilitas Kesehatan &amp; Asuransi Perusahaan
                                </label>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
                              <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" />
                              <span>Fasilitas BPJS Kesehatan &amp; Asuransi Perusahaan hanya dialokasikan untuk Pasangan (Istri/Suami) dan Anak.</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Referensi Standar: Rekening Bank Payroll */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Rekening Bank Payroll Karyawan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Rekening utama yang digunakan untuk transfer gaji bulanan
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        bank_accounts: [
                          ...formData.bank_accounts,
                          { bank_name: banks[0]?.name || 'Bank Mandiri', account_number: '', account_holder: formData.name || '', is_payroll_primary: true },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Rekening
                  </Button>
                </div>

                {formData.bank_accounts.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    Belum ada rekening bank yang didaftarkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.bank_accounts.map((b: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
                      >
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Nama Bank</label>
                          <Select
                            value={b.bank_name}
                            onChange={(e) => {
                              const updated = [...formData.bank_accounts];
                              updated[idx].bank_name = e.target.value;
                              setFormData({ ...formData, bank_accounts: updated });
                            }}
                          >
                            {banks.map((bk) => (
                              <option key={bk.code} value={bk.name}>
                                {bk.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Nomor Rekening</label>
                          <Input
                            value={b.account_number}
                            onChange={(e) => {
                              const updated = [...formData.bank_accounts];
                              updated[idx].account_number = e.target.value;
                              setFormData({ ...formData, bank_accounts: updated });
                            }}
                            placeholder="Contoh: 14200xxxxxxxx"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 mb-1">Atas Nama Rekening</label>
                            <Input
                              value={b.account_holder}
                              onChange={(e) => {
                                const updated = [...formData.bank_accounts];
                                updated[idx].account_holder = e.target.value;
                                setFormData({ ...formData, bank_accounts: updated });
                              }}
                              placeholder="Nama pemilik buku tabungan"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.bank_accounts.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, bank_accounts: updated });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer mb-0.5"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: PENDIDIKAN & KONFIRMASI */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Riwayat Pendidikan Terakhir */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Riwayat Pendidikan Karyawan
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pendidikan terakhir dan kualifikasi akademis
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        educations: [
                          ...formData.educations,
                          { level: 'S1', institution_name: '', major: '', graduation_year: new Date().getFullYear(), is_highest: true },
                        ],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Pendidikan
                  </Button>
                </div>

                {formData.educations.length === 0 ? (
                  <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                    Belum ada riwayat pendidikan yang didaftarkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.educations.map((edu: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end"
                      >
                        {/* Referensi Standar: Jenjang Pendidikan */}
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Jenjang</label>
                          <Select
                            value={edu.level}
                            onChange={(e) => {
                              const updated = [...formData.educations];
                              updated[idx].level = e.target.value;
                              setFormData({ ...formData, educations: updated });
                            }}
                          >
                            {educationLevels.map((el) => (
                              <option key={el.code} value={el.code}>
                                {el.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Institusi / Sekolah</label>
                          <Input
                            value={edu.institution_name}
                            onChange={(e) => {
                              const updated = [...formData.educations];
                              updated[idx].institution_name = e.target.value;
                              setFormData({ ...formData, educations: updated });
                            }}
                            placeholder="Nama Kampus / Sekolah"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1">Jurusan</label>
                          <Input
                            value={edu.major}
                            onChange={(e) => {
                              const updated = [...formData.educations];
                              updated[idx].major = e.target.value;
                              setFormData({ ...formData, educations: updated });
                            }}
                            placeholder="Teknik Pertambangan, dsb"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 mb-1">Tahun Lulus</label>
                            <Input
                              type="number"
                              value={edu.graduation_year}
                              onChange={(e) => {
                                const updated = [...formData.educations];
                                updated[idx].graduation_year = Number(e.target.value);
                                setFormData({ ...formData, educations: updated });
                              }}
                              placeholder="2020"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.educations.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, educations: updated });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer mb-0.5"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 mt-4">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-4 w-4" />
                  Otomatisasi Akun ESS & Riwayat Karir
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>
                    Akun login otomatis dibuat dengan Username: <strong className="font-mono">{formData.nrp || 'NRP'}</strong>
                  </li>
                  <li>
                    Password default sementara: <strong className="font-mono">HCMS#DDMMYYYY</strong> (dari Tanggal Lahir)
                  </li>
                  <li>
                    Karyawan diwajibkan mengganti password saat login pertama kali (*force password change*).
                  </li>
                  <li>
                    Riwayat karir awal (*New Hire Snapshot*) akan dibukukan secara permanen.
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Tambahan Internal
                </label>
                <Input
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan internal HCMS mengenai karyawan ini..."
                />
              </div>
            </div>
          )}

          {/* Wizard Action Buttons */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (currentStep > 1) setCurrentStep(currentStep - 1);
                else setCreateModalOpen(false);
              }}
            >
              {currentStep > 1 ? 'Kembali' : 'Batal'}
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Lanjut ke Langkah {currentStep + 1}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {editEmployee ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: MUTASI & PROMOSI KARIR (SNAPSHOT BAKU) */}
      <Modal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        title={`Mutasi / Promosi Karir: ${movementEmployee?.name}`}
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!movementEmployee) return;
            movementMutation.mutate({ id: movementEmployee.id, payload: movementForm });
          }}
          className="space-y-4"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
            Perubahan ini akan dicatat sebagai <strong>Snapshot Baku (Immutable)</strong> di riwayat karir. Riwayat masa lalu tidak akan berubah meskipun master data di kemudian hari diganti.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Jenis Gerakan Karir
              </label>
              <Select
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
              >
                <option value="PROMOTION">Promosi (Naik Jabatan/Grade)</option>
                <option value="ROTATION">Rotasi Setara</option>
                <option value="MUTATION_SITE">Mutasi Area Kerja / Site</option>
                <option value="STATUS_CHANGE">Pengangkatan Tetap (PKWTT)</option>
                <option value="DEMOTION">Demosi</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Efektif (TMT) <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                required
                value={movementForm.effective_date}
                onChange={(val) => setMovementForm({ ...movementForm, effective_date: val })}
                placeholder="Pilih Tanggal Efektif"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nomor Surat Keputusan (SK)
              </label>
              <Input
                value={movementForm.letter_number}
                onChange={(e) => setMovementForm({ ...movementForm, letter_number: e.target.value })}
                placeholder="SK/DIR/HC/2026/045"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Terbit SK
              </label>
              <DatePicker
                value={movementForm.letter_date}
                onChange={(val) => setMovementForm({ ...movementForm, letter_date: val })}
                placeholder="Pilih Tanggal SK"
              />
            </div>

            {/* Referensi Organisasi Baru: Perusahaan */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Perusahaan Baru
              </label>
              <Select
                value={movementForm.company_id}
                onChange={(e) => {
                  const newCompanyId = e.target.value;
                  setMovementForm({
                    ...movementForm,
                    company_id: newCompanyId,
                    site_id: '',
                    department_id: '',
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">Pilih Perusahaan Baru</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Site */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Site Baru
              </label>
              <Select
                value={movementForm.site_id}
                onChange={(e) => {
                  const newSiteId = e.target.value;
                  setMovementForm({
                    ...movementForm,
                    site_id: newSiteId,
                    department_id: '',
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">Pilih Site Baru</option>
                {movementSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Departemen */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Departemen Baru
              </label>
              <Select
                value={movementForm.department_id}
                onChange={(e) => {
                  const newDeptId = e.target.value;
                  setMovementForm({
                    ...movementForm,
                    department_id: newDeptId,
                    section_id: '',
                    position_id: '',
                  });
                }}
              >
                <option value="">Pilih Departemen Baru</option>
                {movementDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Section (INLINE DENGAN DEPARTEMEN) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Section Baru</span>
                {movementForm.department_id && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                    {movementSections.length} Section tersedia
                  </span>
                )}
              </label>
              <Select
                disabled={!movementForm.department_id}
                value={movementForm.section_id}
                onChange={(e) => {
                  const newSectionId = e.target.value;
                  setMovementForm({
                    ...movementForm,
                    section_id: newSectionId,
                    position_id: '',
                  });
                }}
              >
                <option value="">
                  {!movementForm.department_id
                    ? '-- Pilih Departemen Terlebih Dahulu --'
                    : movementSections.length === 0
                    ? '-- Tidak Ada Section di Dept Ini --'
                    : '-- Pilih Section Baru --'}
                </option>
                {movementSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Jabatan (INLINE DENGAN DEPARTEMEN & SECTION) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Jabatan Baru</span>
                {movementForm.department_id && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                    {movementPositions.length} Jabatan tersedia
                  </span>
                )}
              </label>
              <Select
                disabled={!movementForm.department_id}
                value={movementForm.position_id}
                onChange={(e) => {
                  const newPosId = e.target.value;
                  const selectedPos = movementPositions.find((p) => String(p.id) === newPosId);

                  // Otomatis ambil Level Jabatan (Grade) dan Pangkat dari data Position baru yang dipilih
                  const posGradeId = selectedPos?.grade_id
                    ? String(selectedPos.grade_id)
                    : (selectedPos?.grade?.id ? String(selectedPos.grade.id) : '');
                  const posGrade = grades.find((g) => String(g.id) === posGradeId) || selectedPos?.grade;
                  const posPangkat = posGrade?.pangkat || selectedPos?.grade?.pangkat || (posGradeId ? 'Staff' : movementForm.pangkat);
                  const targetGradeId = posGradeId || movementForm.grade_id;
                  const autoJenjangId = resolveAutoJenjangId(targetGradeId, movementForm.salary_grade_id, movementForm.salary_grade_jenjang_id);

                  setMovementForm({
                    ...movementForm,
                    position_id: newPosId,
                    grade_id: targetGradeId,
                    pangkat: posPangkat || movementForm.pangkat || 'Staff',
                    salary_grade_jenjang_id: autoJenjangId,
                  });
                }}
              >
                <option value="">
                  {!movementForm.department_id
                    ? '-- Pilih Departemen Terlebih Dahulu --'
                    : movementPositions.length === 0
                    ? '-- Tidak Ada Jabatan di Dept/Section Ini --'
                    : '-- Pilih Jabatan Baru --'}
                </option>
                {movementPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Pangkat */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Pangkat Baru</span>
                {movementForm.position_id && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    Otomatis dari Jabatan
                  </span>
                )}
              </label>
              <Select
                value={movementForm.pangkat || 'Staff'}
                onChange={(e) => setMovementForm({ ...movementForm, pangkat: e.target.value })}
              >
                <option value="Staff">Staff</option>
                <option value="Non Staff">Non Staff</option>
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Level Jabatan (Grade) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Level Jabatan (Grade) Baru</span>
                {movementForm.position_id && movementForm.grade_id && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                    Otomatis dari Jabatan
                  </span>
                )}
              </label>
              <Select
                value={movementForm.grade_id}
                onChange={(e) => {
                  const newGradeId = e.target.value;
                  const selectedGrade = grades.find((g) => String(g.id) === newGradeId);
                  const autoJenjangId = resolveAutoJenjangId(newGradeId, movementForm.salary_grade_id, movementForm.salary_grade_jenjang_id);
                  setMovementForm({
                    ...movementForm,
                    grade_id: newGradeId,
                    pangkat: selectedGrade?.pangkat || movementForm.pangkat || 'Staff',
                    salary_grade_jenjang_id: autoJenjangId,
                  });
                }}
              >
                <option value="">Pilih Level Jabatan Baru</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.pangkat ? `(${g.pangkat})` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Golongan (Salary Grade) */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Golongan (Salary Grade) Baru
              </label>
              <Select
                value={movementForm.salary_grade_id || ''}
                onChange={(e) => {
                  const newSalGrdId = e.target.value;
                  const autoJenjangId = resolveAutoJenjangId(movementForm.grade_id, newSalGrdId, movementForm.salary_grade_jenjang_id);
                  setMovementForm({
                    ...movementForm,
                    salary_grade_id: newSalGrdId,
                    salary_grade_jenjang_id: autoJenjangId,
                  });
                }}
              >
                <option value="">Pilih Golongan Baru</option>
                {salaryGrades.map((sg) => (
                  <option key={sg.id} value={sg.id}>
                    Golongan {sg.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Jenjang */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Level / Jenjang Baru
              </label>
              <Select
                value={movementForm.salary_grade_jenjang_id}
                onChange={(e) => {
                  const newJnjId = e.target.value;
                  const matchedJnj = jenjangList.find((j) => String(j.id) === newJnjId);
                  setMovementForm({
                    ...movementForm,
                    salary_grade_jenjang_id: newJnjId,
                    grade_id: matchedJnj?.grade_id ? String(matchedJnj.grade_id) : movementForm.grade_id,
                    salary_grade_id: matchedJnj?.salary_grade_id ? String(matchedJnj.salary_grade_id) : movementForm.salary_grade_id,
                  });
                }}
              >
                <option value="">
                  {!movementForm.salary_grade_id && !movementForm.grade_id
                    ? '-- Pilih Golongan & Level Terlebih Dahulu --'
                    : movementJenjang.length === 0
                    ? '-- Belum Ada Jenjang di Golongan & Level Ini --'
                    : '-- Pilih Jenjang Baru --'}
                </option>
                {movementJenjang.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Organisasi Baru: Hubungan Kerja */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hubungan Kerja Baru
              </label>
              <Select
                value={movementForm.employment_type_id}
                onChange={(e) => setMovementForm({ ...movementForm, employment_type_id: e.target.value })}
              >
                <option value="">Pilih Hubungan Kerja</option>
                {employmentTypes.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.name} ({et.code})
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Standar: Area Kerja Tambang Baru */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Area Kerja Tambang Baru (Work Area)
              </label>
              <Select
                value={movementForm.work_area}
                onChange={(e) => setMovementForm({ ...movementForm, work_area: e.target.value })}
              >
                <option value="">Pilih Area Kerja Baru</option>
                {workAreaList.map((wa) => (
                  <option key={wa.code} value={wa.name}>
                    {wa.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Referensi Standar: POH Baru */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Point of Hire (POH) Baru
              </label>
              <Select
                value={movementForm.poh}
                onChange={(e) => setMovementForm({ ...movementForm, poh: e.target.value })}
              >
                <option value="">Pilih POH Baru</option>
                {pohList.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Alasan / Keterangan Pertimbangan
            </label>
            <Input
              value={movementForm.reason}
              onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
              placeholder="Contoh: Kebutuhan operasional pit tambang timur / hasil evaluasi tahunan"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setMovementModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={movementMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Simpan Mutasi Karir
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: HASIL RESET PASSWORD */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Password Karyawan Berhasil Di-Reset"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Kredensial Login Baru
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Berikan password sementara ini kepada karyawan yang bersangkutan:
            </p>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1.5 font-mono text-left">
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Username:</span>
              <strong className="text-slate-800 dark:text-slate-200">{resetResult?.username}</strong>
            </div>
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>Password Baru:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                {resetResult?.temporary_password}
              </strong>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => copyToClipboard(resetResult?.temporary_password || '')}
            className="w-full flex items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Tersalin!' : 'Salin Password Sementara'}
          </Button>

          <Button
            type="button"
            onClick={() => setResetModalOpen(false)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Selesai
          </Button>
        </div>
      </Modal>
    </div>
  );
}
