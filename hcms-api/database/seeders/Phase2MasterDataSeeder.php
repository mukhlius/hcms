<?php

namespace Database\Seeders;

use App\Models\CostCenter;
use App\Models\CustomMasterCategory;
use App\Models\CustomMasterValue;
use App\Models\DocumentType;
use App\Models\EmployeeGroup;
use App\Models\EmployeeSubGroup;
use App\Models\EmploymentStatus;
use App\Models\EmploymentType;
use App\Models\GeographicReference;
use App\Models\Grade;
use App\Models\Holiday;
use App\Models\HolidayCalendar;
use App\Models\JobFamily;
use App\Models\LeaveType;
use App\Models\OrganizationCompany;
use App\Models\OrganizationJob;
use App\Models\OrganizationSite;
use App\Models\OrganizationUnit;
use App\Models\OvertimeType;
use App\Models\Permission;
use App\Models\Position;
use App\Models\RecruitmentSource;
use App\Models\RelationshipType;
use App\Models\Role;
use App\Models\Shift;
use App\Models\StandardReference;
use App\Models\TerminationReason;
use App\Models\WorkCalendar;
use App\Models\WorkLocation;
use App\Models\WorkSchedule;
use App\Models\WorkerCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class Phase2MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Permissions & Role Assignment
            $permissions = [
                'master-data.view', 'master-data.create', 'master-data.update', 'master-data.delete', 'master-data.import', 'master-data.export',
                'organization.view', 'organization.create', 'organization.update', 'organization.delete', 'organization.move',
                'position.view', 'position.create', 'position.update', 'position.delete', 'position.freeze'
            ];

            foreach ($permissions as $p) {
                Permission::firstOrCreate(
                    ['name' => $p],
                    [
                        'display_name' => ucwords(str_replace(['.', '-'], ' ', $p)),
                        'group' => explode('.', $p)[0] ?? 'master-data',
                        'description' => "Izin akses untuk {$p}",
                    ]
                );
            }

            $superAdmin = Role::where('name', 'super_admin')->first();
            if ($superAdmin) {
                $allP = Permission::all();
                $superAdmin->permissions()->syncWithoutDetaching($allP);
            }

            // 2. Company
            $company = OrganizationCompany::firstOrCreate(
                ['code' => 'CMN'],
                [
                    'name' => 'PT Coal Mining Nusantara',
                    'legal_name' => 'PT Coal Mining Nusantara Tbk',
                    'short_name' => 'CMN',
                    'description' => 'Perusahaan pertambangan batubara terintegrasi kelas dunia di Indonesia.',
                    'tax_identifier' => '01.234.567.8-012.000',
                    'country' => 'ID',
                    'currency' => 'IDR',
                    'timezone' => 'Asia/Makassar',
                    'status' => 'ACTIVE',
                    'is_active' => true,
                    'effective_from' => '2020-01-01',
                ]
            );

            // 3. Sites
            $siteSgt = OrganizationSite::firstOrCreate(
                ['code' => 'SITE-SGT'],
                [
                    'company_id' => $company->id,
                    'name' => 'Sangatta Coal Mine',
                    'short_name' => 'SGT',
                    'site_type' => 'MINING_SITE',
                    'description' => 'Area tambang batubara terbuka utama Pit Sangatta.',
                    'location' => 'Sangatta, Kutai Timur',
                    'province' => 'Kalimantan Timur',
                    'city' => 'Kutai Timur',
                    'latitude' => 0.4901000,
                    'longitude' => 117.5401000,
                    'timezone' => 'Asia/Makassar',
                    'status' => 'ACTIVE',
                    'is_active' => true,
                ]
            );

            $siteBgl = OrganizationSite::firstOrCreate(
                ['code' => 'SITE-BGL'],
                [
                    'company_id' => $company->id,
                    'name' => 'Bengalon Coal Terminal & Processing',
                    'short_name' => 'BGL',
                    'site_type' => 'PROJECT_SITE',
                    'description' => 'Fasilitas peremukan batubara, stock ground, dan pelabuhan ekspor.',
                    'location' => 'Bengalon, Kutai Timur',
                    'province' => 'Kalimantan Timur',
                    'city' => 'Kutai Timur',
                    'latitude' => 0.7621000,
                    'longitude' => 117.6534000,
                    'timezone' => 'Asia/Makassar',
                    'status' => 'ACTIVE',
                    'is_active' => true,
                ]
            );

            $siteJkt = OrganizationSite::firstOrCreate(
                ['code' => 'SITE-JKT'],
                [
                    'company_id' => $company->id,
                    'name' => 'Jakarta Head Office',
                    'short_name' => 'JKT',
                    'site_type' => 'HEAD_OFFICE',
                    'description' => 'Kantor Pusat Eksekutif dan Corporate Services.',
                    'location' => 'Sudirman Central Business District (SCBD)',
                    'province' => 'DKI Jakarta',
                    'city' => 'Jakarta Selatan',
                    'timezone' => 'Asia/Jakarta',
                    'status' => 'ACTIVE',
                    'is_active' => true,
                ]
            );

            // 4. Cost Centers
            $ccMining = CostCenter::firstOrCreate(
                ['code' => 'CC-MIN-001'],
                ['company_id' => $company->id, 'name' => 'Mine Operations Pit A', 'status' => 'ACTIVE']
            );
            $ccSafety = CostCenter::firstOrCreate(
                ['code' => 'CC-HSE-001'],
                ['company_id' => $company->id, 'name' => 'Health & Safety Operations', 'status' => 'ACTIVE']
            );
            $ccHR = CostCenter::firstOrCreate(
                ['code' => 'CC-CORP-HR'],
                ['company_id' => $company->id, 'name' => 'Human Capital & Services', 'status' => 'ACTIVE']
            );

            // 5. Organization Units (Hierarchical Tree)
            $unitOp = OrganizationUnit::firstOrCreate(
                ['code' => 'DIR-OPS'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteSgt->id,
                    'parent_id' => null,
                    'type' => 'BUSINESS_UNIT',
                    'name' => 'Directorate of Mining Operations',
                    'description' => 'Direktorat operasi penambangan, geologi, dan perkapalan.',
                    'status' => 'ACTIVE',
                ]
            );

            $unitPitDiv = OrganizationUnit::firstOrCreate(
                ['code' => 'DIV-PIT'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteSgt->id,
                    'parent_id' => $unitOp->id,
                    'type' => 'DIVISION',
                    'name' => 'Pit Mining Division',
                    'status' => 'ACTIVE',
                ]
            );

            $unitDrillDept = OrganizationUnit::firstOrCreate(
                ['code' => 'DEPT-DRL'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteSgt->id,
                    'parent_id' => $unitPitDiv->id,
                    'type' => 'DEPARTMENT',
                    'name' => 'Drilling & Blasting Department',
                    'status' => 'ACTIVE',
                ]
            );

            $unitHaulDept = OrganizationUnit::firstOrCreate(
                ['code' => 'DEPT-HAUL'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteSgt->id,
                    'parent_id' => $unitPitDiv->id,
                    'type' => 'DEPARTMENT',
                    'name' => 'Loading & Hauling Department',
                    'status' => 'ACTIVE',
                ]
            );

            $unitHseDiv = OrganizationUnit::firstOrCreate(
                ['code' => 'DIV-HSE'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteSgt->id,
                    'parent_id' => $unitOp->id,
                    'type' => 'DIVISION',
                    'name' => 'Occupational Health, Safety & Environment',
                    'status' => 'ACTIVE',
                ]
            );

            $unitHrDiv = OrganizationUnit::firstOrCreate(
                ['code' => 'DIV-HR'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteJkt->id,
                    'parent_id' => null,
                    'type' => 'DIVISION',
                    'name' => 'Human Resources & Corporate Affairs',
                    'status' => 'ACTIVE',
                ]
            );

            $unitTalentDept = OrganizationUnit::firstOrCreate(
                ['code' => 'DEPT-HR-TALENT'],
                [
                    'company_id' => $company->id,
                    'site_id' => $siteJkt->id,
                    'parent_id' => $unitHrDiv->id,
                    'type' => 'DEPARTMENT',
                    'name' => 'Talent Management & Acquisition Dept',
                    'status' => 'ACTIVE',
                ]
            );

            // 6. Job Families & Jobs
            $jfMine = JobFamily::firstOrCreate(['code' => 'JF-MINE'], ['name' => 'Mining Operations & Engineering', 'status' => 'ACTIVE']);
            $jfHse = JobFamily::firstOrCreate(['code' => 'JF-HSE'], ['name' => 'Safety, Health & Environment', 'status' => 'ACTIVE']);
            $jfHR = JobFamily::firstOrCreate(['code' => 'JF-HR'], ['name' => 'Human Resources & Industrial Relations', 'status' => 'ACTIVE']);

            $jobDrillEng = OrganizationJob::firstOrCreate(['code' => 'JOB-BLAST-ENG'], [
                'job_family_id' => $jfMine->id,
                'name' => 'Blasting Engineer',
                'description' => 'Merancang dan mengawasi peledakan material penutup (overburden).',
                'status' => 'ACTIVE'
            ]);

            $jobHaulOpt = OrganizationJob::firstOrCreate(['code' => 'JOB-HAUL-OPT'], [
                'job_family_id' => $jfMine->id,
                'name' => 'Heavy Equipment / Hauler Operator',
                'status' => 'ACTIVE'
            ]);

            $jobHseInsp = OrganizationJob::firstOrCreate(['code' => 'JOB-HSE-INSP'], [
                'job_family_id' => $jfHse->id,
                'name' => 'Mine Safety Inspector',
                'status' => 'ACTIVE'
            ]);

            $jobHrOff = OrganizationJob::firstOrCreate(['code' => 'JOB-HR-OFF'], [
                'job_family_id' => $jfHR->id,
                'name' => 'People Operations Officer',
                'status' => 'ACTIVE'
            ]);

            // 7. Grades
            $grades = [
                ['code' => 'G01', 'name' => 'Operator / Junior Staff', 'level' => 1, 'min_salary' => 6500000, 'max_salary' => 9000000],
                ['code' => 'G02', 'name' => 'Senior Operator / Specialist', 'level' => 2, 'min_salary' => 8500000, 'max_salary' => 13000000],
                ['code' => 'G03', 'name' => 'Foreman / Lead Engineer', 'level' => 3, 'min_salary' => 12000000, 'max_salary' => 18000000],
                ['code' => 'G04', 'name' => 'Supervisor', 'level' => 4, 'min_salary' => 16000000, 'max_salary' => 24000000],
                ['code' => 'G05', 'name' => 'Superintendent', 'level' => 5, 'min_salary' => 22000000, 'max_salary' => 35000000],
                ['code' => 'G06', 'name' => 'Manager', 'level' => 6, 'min_salary' => 32000000, 'max_salary' => 50000000],
                ['code' => 'G07', 'name' => 'General Manager', 'level' => 7, 'min_salary' => 48000000, 'max_salary' => 75000000],
                ['code' => 'G08', 'name' => 'Director / C-Level', 'level' => 8, 'min_salary' => 70000000, 'max_salary' => 120000000],
            ];
            foreach ($grades as $g) {
                Grade::firstOrCreate(['code' => $g['code']], $g);
            }
            $g04 = Grade::where('code', 'G04')->first();
            $g05 = Grade::where('code', 'G05')->first();
            $g06 = Grade::where('code', 'G06')->first();
            $g08 = Grade::where('code', 'G08')->first();

            // 8. Work Locations
            $locPit = WorkLocation::firstOrCreate(
                ['code' => 'LOC-PIT-WEST'],
                ['company_id' => $company->id, 'site_id' => $siteSgt->id, 'name' => 'Pit West Mining Zone', 'type' => 'PIT', 'status' => 'ACTIVE']
            );
            $locPort = WorkLocation::firstOrCreate(
                ['code' => 'LOC-BGL-PORT'],
                ['company_id' => $company->id, 'site_id' => $siteBgl->id, 'name' => 'Coal Loading Port Terminal', 'type' => 'PORT', 'status' => 'ACTIVE']
            );
            $locJkt = WorkLocation::firstOrCreate(
                ['code' => 'LOC-JKT-HQ'],
                ['company_id' => $company->id, 'site_id' => $siteJkt->id, 'name' => 'Tower Nusantara Lt. 18', 'type' => 'OFFICE', 'status' => 'ACTIVE']
            );

            // 9. Positions (Hierarchy & Headcount Control)
            $posDirector = Position::firstOrCreate(
                ['code' => 'POS-DIR-OPS'],
                [
                    'title' => 'Director of Mining Operations',
                    'short_title' => 'Ops Director',
                    'organization_unit_id' => $unitOp->id,
                    'grade_id' => $g08?->id,
                    'cost_center_id' => $ccMining->id,
                    'approved_headcount' => 1,
                    'current_headcount' => 1,
                    'status' => 'ACTIVE',
                ]
            );

            $posPitMgr = Position::firstOrCreate(
                ['code' => 'POS-MGR-PIT'],
                [
                    'title' => 'Pit Operations Manager',
                    'organization_unit_id' => $unitPitDiv->id,
                    'grade_id' => $g06?->id,
                    'reports_to_position_id' => $posDirector->id,
                    'cost_center_id' => $ccMining->id,
                    'approved_headcount' => 1,
                    'current_headcount' => 1,
                    'status' => 'ACTIVE',
                ]
            );

            $posDrillSupt = Position::firstOrCreate(
                ['code' => 'POS-SUPT-DRL'],
                [
                    'title' => 'Drilling & Blasting Superintendent',
                    'organization_unit_id' => $unitDrillDept->id,
                    'grade_id' => $g05?->id,
                    'reports_to_position_id' => $posPitMgr->id,
                    'cost_center_id' => $ccMining->id,
                    'location_id' => $locPit->id,
                    'approved_headcount' => 2,
                    'current_headcount' => 1,
                    'status' => 'ACTIVE',
                ]
            );

            $posBlastingEng = Position::firstOrCreate(
                ['code' => 'POS-ENG-BLAST'],
                [
                    'title' => 'Lead Blasting Engineer',
                    'organization_unit_id' => $unitDrillDept->id,
                    'job_id' => $jobDrillEng->id,
                    'job_family_id' => $jfMine->id,
                    'grade_id' => $g04?->id,
                    'reports_to_position_id' => $posDrillSupt->id,
                    'cost_center_id' => $ccMining->id,
                    'location_id' => $locPit->id,
                    'approved_headcount' => 5,
                    'current_headcount' => 3,
                    'status' => 'ACTIVE',
                ]
            );

            // 10. Employment Masters
            $empTypes = [
                ['code' => 'PKWTT', 'name' => 'Perjanjian Kerja Waktu Tidak Tertentu (Tetap)'],
                ['code' => 'PKWT', 'name' => 'Perjanjian Kerja Waktu Tertentu (Kontrak)'],
                ['code' => 'PROBATION', 'name' => 'Masa Percobaan (Probation)'],
                ['code' => 'INTERNSHIP', 'name' => 'Magang / Praktik Industri'],
                ['code' => 'OUTSOURCING', 'name' => 'Tenaga Alih Daya'],
            ];
            foreach ($empTypes as $t) {
                EmploymentType::firstOrCreate(['code' => $t['code']], $t);
            }

            $empStatuses = [
                ['code' => 'ACTIVE_PERMANENT', 'name' => 'Karyawan Tetap Aktif'],
                ['code' => 'ACTIVE_CONTRACT', 'name' => 'Karyawan Kontrak Aktif'],
                ['code' => 'ON_LEAVE', 'name' => 'Cuti di Luar Tanggungan'],
                ['code' => 'SUSPENDED', 'name' => 'Skorsing / Penyelidikan'],
                ['code' => 'TERMINATED', 'name' => 'Diberhentikan / Pensiun'],
            ];
            foreach ($empStatuses as $s) {
                EmploymentStatus::firstOrCreate(['code' => $s['code']], $s);
            }

            $workerCats = [
                ['code' => 'STAFF', 'name' => 'Karyawan Staff'],
                ['code' => 'NON_STAFF', 'name' => 'Karyawan Non-Staff (Operasional Tambang)'],
                ['code' => 'EXPATRIATE', 'name' => 'Tenaga Kerja Asing (TKA)'],
            ];
            foreach ($workerCats as $c) {
                WorkerCategory::firstOrCreate(['code' => $c['code']], $c);
            }

            $groupOps = EmployeeGroup::firstOrCreate(['code' => 'GRP-OPS'], ['name' => 'Mining & Technical Operations Group']);
            EmployeeSubGroup::firstOrCreate(['code' => 'SUB-PIT'], ['employee_group_id' => $groupOps->id, 'name' => 'Pit Heavy Equipment Subgroup']);
            EmployeeSubGroup::firstOrCreate(['code' => 'SUB-PLANT'], ['employee_group_id' => $groupOps->id, 'name' => 'Coal Processing Plant Subgroup']);

            // 11. Shifts & Roster Work Schedules
            $shiftDay = Shift::firstOrCreate(
                ['code' => 'SHIFT-DAY-12H'],
                [
                    'name' => 'Shift Siang Tambang (12 Jam)',
                    'start_time' => '06:00',
                    'end_time' => '18:00',
                    'break_start' => '12:00',
                    'break_end' => '13:00',
                    'cross_day' => false,
                    'grace_period_minutes' => 15,
                    'status' => 'ACTIVE'
                ]
            );

            $shiftNight = Shift::firstOrCreate(
                ['code' => 'SHIFT-NIGHT-12H'],
                [
                    'name' => 'Shift Malam Tambang (Lintas Tengah Malam)',
                    'start_time' => '18:00',
                    'end_time' => '06:00',
                    'break_start' => '00:00',
                    'break_end' => '01:00',
                    'cross_day' => true,
                    'grace_period_minutes' => 15,
                    'status' => 'ACTIVE'
                ]
            );

            $schedMiningRoster = WorkSchedule::firstOrCreate(
                ['code' => 'ROSTER-14-7'],
                [
                    'name' => 'Roster Operasional Tambang (14 ON / 7 OFF)',
                    'pattern_type' => 'ROSTER',
                    'cycle_days' => 21,
                    'days_on' => 14,
                    'days_off' => 7,
                    'status' => 'ACTIVE'
                ]
            );

            $schedHQ = WorkSchedule::firstOrCreate(
                ['code' => 'OFFICE-5-2'],
                [
                    'name' => 'Jam Kerja Reguler Head Office (5 ON / 2 OFF)',
                    'pattern_type' => 'FIXED',
                    'cycle_days' => 7,
                    'days_on' => 5,
                    'days_off' => 2,
                    'status' => 'ACTIVE'
                ]
            );

            // 12. Standard References
            $standards = [
                ['category' => 'RELIGION', 'code' => 'ISLAM', 'name' => 'Islam'],
                ['category' => 'RELIGION', 'code' => 'KRISTEN', 'name' => 'Kristen Protestan'],
                ['category' => 'RELIGION', 'code' => 'KATOLIK', 'name' => 'Katolik'],
                ['category' => 'RELIGION', 'code' => 'HINDU', 'name' => 'Hindu'],
                ['category' => 'RELIGION', 'code' => 'BUDDHA', 'name' => 'Buddha'],
                ['category' => 'RELIGION', 'code' => 'KHONGHUCU', 'name' => 'Khonghucu'],

                ['category' => 'EDUCATION', 'code' => 'SMA_SMK', 'name' => 'SMA / SMK Sederajat'],
                ['category' => 'EDUCATION', 'code' => 'D3', 'name' => 'Diploma Tiga (D3)'],
                ['category' => 'EDUCATION', 'code' => 'S1', 'name' => 'Sarjana / Strata 1 (S1)'],
                ['category' => 'EDUCATION', 'code' => 'S2', 'name' => 'Magister / Strata 2 (S2)'],
                ['category' => 'EDUCATION', 'code' => 'S3', 'name' => 'Doktoral (S3)'],

                ['category' => 'MARITAL_STATUS', 'code' => 'TK0', 'name' => 'Belum Menikah (TK/0)', 'metadata' => json_encode(['category' => 'Tidak Menikah'])],
                ['category' => 'MARITAL_STATUS', 'code' => 'K0', 'name' => 'Menikah Tanpa Tanggungan (K/0)', 'metadata' => json_encode(['category' => 'Menikah'])],
                ['category' => 'MARITAL_STATUS', 'code' => 'K1', 'name' => 'Menikah 1 Tanggungan (K/1)', 'metadata' => json_encode(['category' => 'Menikah'])],
                ['category' => 'MARITAL_STATUS', 'code' => 'K2', 'name' => 'Menikah 2 Tanggungan (K/2)', 'metadata' => json_encode(['category' => 'Menikah'])],
                ['category' => 'MARITAL_STATUS', 'code' => 'K3', 'name' => 'Menikah 3+ Tanggungan (K/3)', 'metadata' => json_encode(['category' => 'Menikah'])],

                ['category' => 'BLOOD_TYPE', 'code' => 'A', 'name' => 'Golongan Darah A'],
                ['category' => 'BLOOD_TYPE', 'code' => 'B', 'name' => 'Golongan Darah B'],
                ['category' => 'BLOOD_TYPE', 'code' => 'AB', 'name' => 'Golongan Darah AB'],
                ['category' => 'BLOOD_TYPE', 'code' => 'O', 'name' => 'Golongan Darah O'],

                ['category' => 'BANK', 'code' => 'MANDIRI', 'name' => 'Bank Mandiri'],
                ['category' => 'BANK', 'code' => 'BCA', 'name' => 'Bank Central Asia (BCA)'],
                ['category' => 'BANK', 'code' => 'BRI', 'name' => 'Bank Rakyat Indonesia (BRI)'],
                ['category' => 'BANK', 'code' => 'BNI', 'name' => 'Bank Negara Indonesia (BNI)'],

                ['category' => 'CURRENCY', 'code' => 'IDR', 'name' => 'Indonesian Rupiah (Rp)'],
                ['category' => 'CURRENCY', 'code' => 'USD', 'name' => 'US Dollar ($)'],
            ];

            foreach ($standards as $std) {
                StandardReference::firstOrCreate(
                    ['category' => $std['category'], 'code' => $std['code']],
                    $std
                );
            }

            // 13. Geographic Reference (Provinsi & Kota)
            $propKaltim = GeographicReference::firstOrCreate(
                ['code' => 'PROP-64'],
                ['type' => 'PROVINCE', 'name' => 'Kalimantan Timur']
            );
            GeographicReference::firstOrCreate(
                ['code' => 'KOTA-6408'],
                ['type' => 'CITY', 'parent_id' => $propKaltim->id, 'name' => 'Kabupaten Kutai Timur']
            );
            GeographicReference::firstOrCreate(
                ['code' => 'KOTA-6471'],
                ['type' => 'CITY', 'parent_id' => $propKaltim->id, 'name' => 'Kota Balikpapan']
            );
            GeographicReference::firstOrCreate(
                ['code' => 'KOTA-6472'],
                ['type' => 'CITY', 'parent_id' => $propKaltim->id, 'name' => 'Kota Samarinda']
            );

            $propDki = GeographicReference::firstOrCreate(
                ['code' => 'PROP-31'],
                ['type' => 'PROVINCE', 'name' => 'DKI Jakarta']
            );
            GeographicReference::firstOrCreate(
                ['code' => 'KOTA-3174'],
                ['type' => 'CITY', 'parent_id' => $propDki->id, 'name' => 'Kota Jakarta Selatan']
            );

            // 14. Document Types
            $docTypes = [
                ['code' => 'DOC-KTP', 'name' => 'Kartu Tanda Penduduk (KTP)', 'category' => 'IDENTITY', 'required' => true],
                ['code' => 'DOC-KK', 'name' => 'Kartu Keluarga (KK)', 'category' => 'FAMILY', 'required' => true],
                ['code' => 'DOC-NPWP', 'name' => 'Nomor Pokok Wajib Pajak (NPWP)', 'category' => 'TAX', 'required' => true],
                ['code' => 'DOC-BPJS-TK', 'name' => 'BPJS Ketenagakerjaan', 'category' => 'INSURANCE', 'required' => true],
                ['code' => 'DOC-BPJS-KES', 'name' => 'BPJS Kesehatan', 'category' => 'INSURANCE', 'required' => true],
                ['code' => 'DOC-KIMPER', 'name' => 'Kartu Izin Mengemudi Perusahaan (KIMPER)', 'category' => 'MINE_SAFETY', 'required' => false],
                ['code' => 'DOC-MCU', 'name' => 'Sertifikat Medical Check-Up (Fit to Work)', 'category' => 'MEDICAL', 'required' => true, 'expiry_required' => true],
            ];
            foreach ($docTypes as $d) {
                DocumentType::firstOrCreate(['code' => $d['code']], $d);
            }

            // 15. Leave Types
            $leaves = [
                ['code' => 'LV-ANNUAL', 'name' => 'Cuti Tahunan', 'category' => 'ANNUAL', 'paid' => true, 'requires_approval' => true],
                ['code' => 'LV-ROSTER', 'name' => 'Off Roster Tambang', 'category' => 'ROSTER', 'paid' => true, 'requires_approval' => false],
                ['code' => 'LV-SICK', 'name' => 'Cuti Sakit', 'category' => 'SICK', 'paid' => true, 'requires_document' => true, 'requires_medical_document' => true],
                ['code' => 'LV-MATERNITY', 'name' => 'Cuti Melahirkan', 'category' => 'MATERNITY', 'paid' => true, 'requires_document' => true],
                ['code' => 'LV-UNPAID', 'name' => 'Izin di Luar Tanggungan', 'category' => 'UNPAID', 'paid' => false, 'requires_approval' => true],
            ];
            foreach ($leaves as $l) {
                LeaveType::firstOrCreate(['code' => $l['code']], $l);
            }

            // 16. Overtime Types
            $overtimes = [
                ['code' => 'OT-REGULAR', 'name' => 'Lembur Hari Kerja Reguler', 'rate_multiplier' => 1.50, 'category' => 'REGULAR'],
                ['code' => 'OT-RESTDAY', 'name' => 'Lembur Hari Libur / Istirahat', 'rate_multiplier' => 2.00, 'category' => 'REST_DAY'],
                ['code' => 'OT-HOLIDAY', 'name' => 'Lembur Hari Libur Nasional Resmi', 'rate_multiplier' => 3.00, 'category' => 'HOLIDAY'],
            ];
            foreach ($overtimes as $o) {
                OvertimeType::firstOrCreate(['code' => $o['code']], $o);
            }

            // 17. Custom Master Categories & Values
            $catSize = CustomMasterCategory::firstOrCreate(
                ['code' => 'SAFETY-COVERALL-SIZE'],
                ['name' => 'Ukuran Pakaian Kerja / Wearpack Tambang', 'description' => 'Ukuran pakaian keselamatan kerja lapangan.']
            );
            $sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
            foreach ($sizes as $idx => $s) {
                CustomMasterValue::firstOrCreate(
                    ['category_id' => $catSize->id, 'code' => $s],
                    ['name' => "Ukuran {$s}", 'order' => $idx + 1]
                );
            }

            $catBoots = CustomMasterCategory::firstOrCreate(
                ['code' => 'SAFETY-BOOT-SIZE'],
                ['name' => 'Ukuran Sepatu Safety Tambang', 'description' => 'Standar ukuran sepatu boots keselamatan.']
            );
            for ($size = 38; $size <= 45; $size++) {
                CustomMasterValue::firstOrCreate(
                    ['category_id' => $catBoots->id, 'code' => (string)$size],
                    ['name' => "Euro Size {$size}", 'order' => $size - 37]
                );
            }
        });
    }
}
