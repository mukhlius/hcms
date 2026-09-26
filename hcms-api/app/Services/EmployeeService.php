<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeBankAccount;
use App\Models\EmployeeCareerHistory;
use App\Models\EmployeeEducation;
use App\Models\EmployeeEmergencyContact;
use App\Models\EmployeeFamily;
use App\Models\EmployeeHealthSafety;
use App\Models\Grade;
use App\Models\OrganizationDepartment;
use App\Models\OrganizationSite;
use App\Models\Position;
use App\Models\SalaryGrade;
use App\Models\SalaryGradeJenjang;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeService
{
    /**
     * Ambil daftar karyawan dengan filter & pencarian multi-dimensi
     */
    public function listEmployees(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Employee::query()
            ->with([
                'company:id,code,name',
                'site:id,code,name',
                'department:id,code,name',
                'section:id,code,name',
                'position:id,code,title',
                'grade:id,code,name,pangkat',
                'salaryGrade:id,code,name',
                'salaryGradeJenjang:id,name',
                'employmentType:id,code,name',
                'user:id,username,status',
            ]);

        // Search NRP, Nama, NIK, No HP, Email
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('nrp', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('id_card_number', 'like', "%{$search}%")
                    ->orWhere('phone_mobile', 'like', "%{$search}%")
                    ->orWhere('email_company', 'like', "%{$search}%");
            });
        }

        // Filter Perusahaan
        if (!empty($filters['company_id'])) {
            $query->where('company_id', $filters['company_id']);
        }

        // Filter Site / Area Kerja
        if (!empty($filters['site_id'])) {
            $query->where('site_id', $filters['site_id']);
        }

        // Filter Departemen
        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        // Filter Section
        if (!empty($filters['section_id'])) {
            $query->where('section_id', $filters['section_id']);
        }

        // Filter Work Area
        if (!empty($filters['work_area'])) {
            $query->where('work_area', $filters['work_area']);
        }

        // Filter Jabatan
        if (!empty($filters['position_id'])) {
            $query->where('position_id', $filters['position_id']);
        }

        // Filter Level Jabatan (Grade)
        if (!empty($filters['grade_id'])) {
            $query->where('grade_id', $filters['grade_id']);
        }

        // Filter Golongan (Salary Grade)
        if (!empty($filters['salary_grade_id'])) {
            $query->where('salary_grade_id', $filters['salary_grade_id']);
        }

        // Filter Pangkat (Staff / Non Staff)
        if (!empty($filters['pangkat'])) {
            $query->where('pangkat', $filters['pangkat']);
        }

        // Filter Level / Jenjang Karir
        if (!empty($filters['salary_grade_jenjang_id'])) {
            $query->where('salary_grade_jenjang_id', $filters['salary_grade_jenjang_id']);
        }

        // Filter Status Kepegawaian (ACTIVE, PROBATION, RESIGNED, TERMINATED)
        if (!empty($filters['employment_status'])) {
            $query->where('employment_status', $filters['employment_status']);
        }

        // Filter Hubungan Kerja (PKWT, PKWTT)
        if (!empty($filters['employment_type_id'])) {
            $query->where('employment_type_id', $filters['employment_type_id']);
        }

        // Filter Gender
        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        return $query->orderBy('name', 'asc')->paginate($perPage);
    }

    /**
     * Ambil detail lengkap satu karyawan beserta seluruh tabel relasinya
     */
    public function getEmployeeDetail(int $id): Employee
    {
        return Employee::with([
            'company',
            'site',
            'department',
            'section',
            'position',
            'grade',
            'salaryGrade',
            'salaryGradeJenjang',
            'employmentType',
            'user:id,username,email,status,force_password_change,locked_until',
            'families' => fn($q) => $q->orderBy('relation_type')->orderBy('child_order'),
            'educations' => fn($q) => $q->orderBy('graduation_year', 'desc'),
            'emergencyContacts' => fn($q) => $q->orderByDesc('is_primary'),
            'healthSafety',
            'bankAccounts' => fn($q) => $q->orderByDesc('is_payroll_primary'),
            'careerHistories' => fn($q) => $q->orderByDesc('effective_date'),
            'documents.documentType',
        ])->findOrFail($id);
    }

    /**
     * Registrasi Karyawan Baru secara Atomik:
     * 1. Buat akun login User (Username = NRP, Password default = HCMS#TglLahir)
     * 2. Buat profil Employee
     * 3. Buat snapshot awal Career History (movement_type = 'HIRE')
     * 4. Simpan relasi keluarga, pendidikan, kontak darurat, APD/kesehatan, & bank
     */
    public function createEmployee(array $data, ?int $approvedByUserId = null): Employee
    {
        return DB::transaction(function () use ($data, $approvedByUserId) {
            $nrp = trim($data['nrp']);
            $birthDate = Carbon::parse($data['birth_date']);

            // 1. Buat Akun User jika belum ada
            $user = null;
            if (empty($data['user_id'])) {
                // Pola password default: HCMS# + DDMMYYYY (contoh: HCMS#15081995)
                $defaultPasswordPlain = 'HCMS#' . $birthDate->format('dmY');
                $email = !empty($data['email_company']) ? trim($data['email_company']) : ($nrp . '@company.local');

                $user = User::create([
                    'uuid' => (string) Str::uuid(),
                    'username' => $nrp,
                    'name' => trim($data['name']),
                    'email' => $email,
                    'password' => Hash::make($defaultPasswordPlain),
                    'status' => 'ACTIVE',
                    'force_password_change' => true,
                    'company_id' => $data['company_id'] ?? null,
                    'site_id' => $data['site_id'] ?? null,
                    'department_id' => $data['department_id'] ?? null,
                    'section_id' => $data['section_id'] ?? null,
                    'position_id' => $data['position_id'] ?? null,
                ]);
            } else {
                $user = User::find($data['user_id']);
            }

            // 2. Simpan Data Utama Employee
            // Jika grade_id atau pangkat belum diset, otomatis ambil dari master Position
            if (!empty($data['position_id'])) {
                $pos = Position::with('grade')->find($data['position_id']);
                if ($pos) {
                    if (empty($data['grade_id']) && $pos->grade_id) {
                        $data['grade_id'] = $pos->grade_id;
                    }
                    if (empty($data['pangkat']) && $pos->grade?->pangkat) {
                        $data['pangkat'] = $pos->grade->pangkat;
                    }
                }
            }

            // Jika salary_grade_jenjang_id belum diset, otomatis cari dari pasangan grade_id & salary_grade_id
            if (empty($data['salary_grade_jenjang_id']) && !empty($data['grade_id']) && !empty($data['salary_grade_id'])) {
                $matchedJenjang = SalaryGradeJenjang::where('grade_id', $data['grade_id'])
                    ->where('salary_grade_id', $data['salary_grade_id'])
                    ->first();
                if ($matchedJenjang) {
                    $data['salary_grade_jenjang_id'] = $matchedJenjang->id;
                }
            }

            $employeeData = $data;
            $employeeData['user_id'] = $user?->id;
            $employee = Employee::create($employeeData);

            // 3. Buat Riwayat Karir Awal (Snapshot Baku)
            $this->createCareerHistorySnapshot(
                employee: $employee,
                movementType: 'HIRE',
                letterNumber: $data['sk_letter_number'] ?? null,
                letterDate: $data['sk_letter_date'] ?? null,
                effectiveDate: $employee->hire_date,
                reason: 'Penerimaan Karyawan Baru (New Hire)',
                approvedByUserId: $approvedByUserId
            );

            // 4. Simpan Relasi Pendukung jika disediakan
            if (!empty($data['families']) && is_array($data['families'])) {
                $isStaff = strtolower($employee->pangkat ?? '') === 'staff';
                foreach ($data['families'] as $fam) {
                    $fam['employee_id'] = $employee->id;
                    // BPJS kesehatan & Asuransi hanya berlaku untuk Istri/Suami dan Anak
                    if (!in_array($fam['relation_type'] ?? '', ['SPOUSE', 'CHILD'])) {
                        $fam['is_covered_insurance'] = false;
                        $fam['bpjs_kesehatan_no'] = null;
                        $fam['insurance_no'] = null;
                        $fam['health_provider_no'] = null;
                    } else {
                        $bpjs = $fam['bpjs_kesehatan_no'] ?? $fam['health_provider_no'] ?? null;
                        $fam['bpjs_kesehatan_no'] = $bpjs;
                        $fam['health_provider_no'] = $bpjs;
                        // Nomor asuransi hanya dialokasikan jika pangkat karyawan adalah Staff
                        if (!$isStaff) {
                            $fam['insurance_no'] = null;
                        }
                    }
                    EmployeeFamily::create($fam);
                }
            }

            if (!empty($data['educations']) && is_array($data['educations'])) {
                foreach ($data['educations'] as $edu) {
                    $edu['employee_id'] = $employee->id;
                    EmployeeEducation::create($edu);
                }
            }

            if (!empty($data['emergency_contacts']) && is_array($data['emergency_contacts'])) {
                foreach ($data['emergency_contacts'] as $contact) {
                    $contact['employee_id'] = $employee->id;
                    EmployeeEmergencyContact::create($contact);
                }
            }

            if (!empty($data['health_safety']) && is_array($data['health_safety'])) {
                $hsData = $data['health_safety'];
                $hsData['employee_id'] = $employee->id;
                EmployeeHealthSafety::create($hsData);
            }

            if (!empty($data['bank_accounts']) && is_array($data['bank_accounts'])) {
                foreach ($data['bank_accounts'] as $bank) {
                    $bank['employee_id'] = $employee->id;
                    EmployeeBankAccount::create($bank);
                }
            }

            // Otomatis sinkronisasi peran pengguna berdasarkan level jabatan
            try {
                app(\App\Services\RoleAssignmentService::class)->syncEmployeeRole($employee);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed auto-assign role on create employee: ' . $e->getMessage());
            }

            return $employee->load([
                'position', 'department', 'site', 'grade', 'salaryGradeJenjang', 'employmentType', 'user'
            ]);
        });
    }

    /**
     * Perbarui data karyawan & sinkronisasi data user
     */
    public function updateEmployee(int $id, array $data): Employee
    {
        return DB::transaction(function () use ($id, $data) {
            $employee = Employee::findOrFail($id);
            $employee->update($data);

            // Sinkronkan data ke tabel users jika ada akun
            if ($employee->user) {
                $userUpdates = [
                    'name' => $employee->name,
                    'position_id' => $employee->position_id,
                    'company_id' => $employee->company_id,
                    'site_id' => $employee->site_id,
                    'department_id' => $employee->department_id,
                    'section_id' => $employee->section_id,
                ];
                if (!empty($data['email_company'])) {
                    $userUpdates['email'] = trim($data['email_company']);
                }
                $employee->user->update($userUpdates);
            }

            // Update atau simpan data fisik/APD jika dikirim
            if (isset($data['health_safety']) && is_array($data['health_safety'])) {
                EmployeeHealthSafety::updateOrCreate(
                    ['employee_id' => $employee->id],
                    $data['health_safety']
                );
            }

            // Update atau sinkronkan data keluarga jika dikirim
            if (isset($data['families']) && is_array($data['families'])) {
                $isStaff = strtolower($employee->pangkat ?? '') === 'staff';
                $familyIds = [];
                foreach ($data['families'] as $fam) {
                    // BPJS kesehatan & Asuransi hanya berlaku untuk Istri/Suami dan Anak
                    if (!in_array($fam['relation_type'] ?? '', ['SPOUSE', 'CHILD'])) {
                        $fam['is_covered_insurance'] = false;
                        $fam['bpjs_kesehatan_no'] = null;
                        $fam['insurance_no'] = null;
                        $fam['health_provider_no'] = null;
                    } else {
                        $bpjs = $fam['bpjs_kesehatan_no'] ?? $fam['health_provider_no'] ?? null;
                        $fam['bpjs_kesehatan_no'] = $bpjs;
                        $fam['health_provider_no'] = $bpjs;
                        // Nomor asuransi hanya dialokasikan jika pangkat karyawan adalah Staff
                        if (!$isStaff) {
                            $fam['insurance_no'] = null;
                        }
                    }
                    if (!empty($fam['id'])) {
                        $existing = EmployeeFamily::where('employee_id', $employee->id)->where('id', $fam['id'])->first();
                        if ($existing) {
                            $existing->update($fam);
                            $familyIds[] = $existing->id;
                            continue;
                        }
                    }
                    $fam['employee_id'] = $employee->id;
                    $newFam = EmployeeFamily::create($fam);
                    $familyIds[] = $newFam->id;
                }
                EmployeeFamily::where('employee_id', $employee->id)->whereNotIn('id', $familyIds)->delete();
            }

            // Update pendidikan jika dikirim
            if (isset($data['educations']) && is_array($data['educations'])) {
                $eduIds = [];
                foreach ($data['educations'] as $edu) {
                    if (!empty($edu['id'])) {
                        $existingEdu = EmployeeEducation::where('employee_id', $employee->id)->where('id', $edu['id'])->first();
                        if ($existingEdu) {
                            $existingEdu->update($edu);
                            $eduIds[] = $existingEdu->id;
                            continue;
                        }
                    }
                    $edu['employee_id'] = $employee->id;
                    $newEdu = EmployeeEducation::create($edu);
                    $eduIds[] = $newEdu->id;
                }
                EmployeeEducation::where('employee_id', $employee->id)->whereNotIn('id', $eduIds)->delete();
            }

            // Update kontak darurat jika dikirim
            if (isset($data['emergency_contacts']) && is_array($data['emergency_contacts'])) {
                $contactIds = [];
                foreach ($data['emergency_contacts'] as $contact) {
                    if (!empty($contact['id'])) {
                        $existingContact = EmployeeEmergencyContact::where('employee_id', $employee->id)->where('id', $contact['id'])->first();
                        if ($existingContact) {
                            $existingContact->update($contact);
                            $contactIds[] = $existingContact->id;
                            continue;
                        }
                    }
                    $contact['employee_id'] = $employee->id;
                    $newContact = EmployeeEmergencyContact::create($contact);
                    $contactIds[] = $newContact->id;
                }
                EmployeeEmergencyContact::where('employee_id', $employee->id)->whereNotIn('id', $contactIds)->delete();
            }

            // Update rekening bank jika dikirim
            if (isset($data['bank_accounts']) && is_array($data['bank_accounts'])) {
                $bankIds = [];
                foreach ($data['bank_accounts'] as $bank) {
                    if (!empty($bank['id'])) {
                        $existingBank = EmployeeBankAccount::where('employee_id', $employee->id)->where('id', $bank['id'])->first();
                        if ($existingBank) {
                            $existingBank->update($bank);
                            $bankIds[] = $existingBank->id;
                            continue;
                        }
                    }
                    $bank['employee_id'] = $employee->id;
                    $newBank = EmployeeBankAccount::create($bank);
                    $bankIds[] = $newBank->id;
                }
                EmployeeBankAccount::where('employee_id', $employee->id)->whereNotIn('id', $bankIds)->delete();
            }

            // Jika posisi atau level jabatan berubah, sinkronkan peran pengguna
            if (array_key_exists('grade_id', $data) || array_key_exists('position_id', $data)) {
                try {
                    app(\App\Services\RoleAssignmentService::class)->syncEmployeeRole($employee);
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed auto-sync role on update employee: ' . $e->getMessage());
                }
            }

            return $this->getEmployeeDetail($employee->id);
        });
    }

    /**
     * Rekam Mutasi / Promosi / Perubahan Karir dengan SNAPSHOT BAKU
     */
    public function recordCareerMovement(int $employeeId, array $data, ?int $approvedByUserId = null): EmployeeCareerHistory
    {
        return DB::transaction(function () use ($employeeId, $data, $approvedByUserId) {
            $employee = Employee::findOrFail($employeeId);
            $effectiveDate = Carbon::parse($data['effective_date']);

            // 1. Tutup riwayat berjalan sebelumnya
            EmployeeCareerHistory::where('employee_id', $employee->id)
                ->where('is_current', true)
                ->update([
                    'is_current' => false,
                    'end_date' => $effectiveDate->copy()->subDay()->toDateString(),
                ]);

            // 2. Ambil master data baru untuk dijadikan snapshot teks permanen
            $position = !empty($data['position_id']) ? Position::with('grade')->find($data['position_id']) : $employee->position;
            $department = !empty($data['department_id']) ? OrganizationDepartment::find($data['department_id']) : $employee->department;
            $site = !empty($data['site_id']) ? OrganizationSite::find($data['site_id']) : $employee->site;
            $grade = !empty($data['grade_id']) ? Grade::find($data['grade_id']) : ($position?->grade ?? $employee->grade);
            $salaryGrade = !empty($data['salary_grade_id']) ? SalaryGrade::find($data['salary_grade_id']) : $employee->salaryGrade;
            $jenjang = !empty($data['salary_grade_jenjang_id']) ? SalaryGradeJenjang::find($data['salary_grade_jenjang_id']) : $employee->salaryGradeJenjang;
            if (empty($data['salary_grade_jenjang_id']) && $grade?->id && $salaryGrade?->id) {
                $matchedJenjang = SalaryGradeJenjang::where('grade_id', $grade->id)
                    ->where('salary_grade_id', $salaryGrade->id)
                    ->first();
                if ($matchedJenjang) {
                    $jenjang = $matchedJenjang;
                }
            }
            $pangkatVal = $data['pangkat'] ?? ($grade?->pangkat ?? $employee->pangkat);

            // 3. Simpan baris riwayat karir baru dengan snapshot baku
            $careerHistory = EmployeeCareerHistory::create([
                'employee_id'               => $employee->id,
                'movement_type'             => $data['movement_type'] ?? 'PROMOTION',
                'letter_number'             => $data['letter_number'] ?? null,
                'letter_date'               => $data['letter_date'] ?? null,
                'effective_date'            => $effectiveDate->toDateString(),
                'is_current'                => true,
                'position_id'               => $data['position_id'] ?? $employee->position_id,
                'department_id'             => $data['department_id'] ?? $employee->department_id,
                'site_id'                   => $data['site_id'] ?? $employee->site_id,
                'grade_id'                  => $grade?->id ?? $data['grade_id'] ?? $employee->grade_id,
                'salary_grade_id'           => $salaryGrade?->id ?? $data['salary_grade_id'] ?? $employee->salary_grade_id,
                'salary_grade_jenjang_id'   => $jenjang?->id ?? $data['salary_grade_jenjang_id'] ?? $employee->salary_grade_jenjang_id,
                'employment_type_id'        => $data['employment_type_id'] ?? $employee->employment_type_id,
                
                // SNAPSHOT BAKU
                'position_title_snapshot'   => $position?->title ?? 'Tidak Ada Jabatan',
                'department_name_snapshot'  => $department?->name ?? 'Tidak Ada Departemen',
                'site_name_snapshot'        => $site?->name ?? 'Tidak Ada Site',
                'grade_name_snapshot'       => $grade?->name,
                'pangkat_snapshot'          => $pangkatVal,
                'golongan_snapshot'         => $salaryGrade?->name,
                'level_jenjang_snapshot'    => $jenjang?->name,
                'poh_snapshot'              => $data['poh'] ?? $employee->poh,
                'work_area_snapshot'        => $data['work_area'] ?? $employee->work_area,
                'employment_type_snapshot'  => $employee->employmentType?->name,
                
                'reason'                    => $data['reason'] ?? null,
                'notes'                     => $data['notes'] ?? null,
                'sk_file_url'               => $data['sk_file_url'] ?? null,
                'approved_by_user_id'       => $approvedByUserId,
            ]);

            // 4. Perbarui data terkini di tabel employees
            $employee->update([
                'company_id'                => $data['company_id'] ?? $employee->company_id,
                'position_id'               => $careerHistory->position_id,
                'department_id'             => $careerHistory->department_id,
                'section_id'                => $data['section_id'] ?? $employee->section_id,
                'site_id'                   => $careerHistory->site_id,
                'grade_id'                  => $careerHistory->grade_id,
                'salary_grade_id'           => $careerHistory->salary_grade_id,
                'salary_grade_jenjang_id'   => $careerHistory->salary_grade_jenjang_id,
                'pangkat'                   => $pangkatVal,
                'employment_type_id'        => $careerHistory->employment_type_id,
                'poh'                       => $data['poh'] ?? $employee->poh,
                'work_area'                 => $data['work_area'] ?? $employee->work_area,
            ]);

            // Sinkronkan peran pengguna setelah mutasi/promosi karir
            try {
                app(\App\Services\RoleAssignmentService::class)->syncEmployeeRole($employee->fresh());
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed auto-sync role on career movement: ' . $e->getMessage());
            }

            return $careerHistory;
        });
    }

    /**
     * Nonaktifkan atau Aktifkan Karyawan (dengan pemutusan sesi login instan jika nonaktif)
     */
    public function toggleEmployeeStatus(int $employeeId, string $newStatus, ?string $reason = null): Employee
    {
        return DB::transaction(function () use ($employeeId, $newStatus, $reason) {
            $employee = Employee::findOrFail($employeeId);
            $employee->update([
                'employment_status' => $newStatus,
                'notes' => $reason ? ($employee->notes . "\n[Status Change]: " . $reason) : $employee->notes,
            ]);

            if ($employee->user) {
                if ($newStatus === 'ACTIVE') {
                    $employee->user->update(['status' => 'ACTIVE']);
                } else {
                    // Nonaktifkan user dan putus semua sesi aktif secara seketika
                    $employee->user->update(['status' => 'INACTIVE']);
                    $employee->user->tokens()->delete();
                    DB::table('sessions')->where('user_id', $employee->user->id)->delete();
                }
            }

            return $employee;
        });
    }

    /**
     * Reset Password Karyawan oleh Admin
     */
    public function resetEmployeePassword(int $employeeId, ?string $newPassword = null): array
    {
        return DB::transaction(function () use ($employeeId, $newPassword) {
            $employee = Employee::findOrFail($employeeId);
            if (!$employee->user) {
                throw new \Exception('Karyawan belum memiliki akun pengguna login.');
            }

            // Jika password tidak diinput, gunakan default HCMS#DDMMYYYY
            $plainPassword = $newPassword ?: ('HCMS#' . Carbon::parse($employee->birth_date)->format('dmY'));

            $employee->user->update([
                'password' => Hash::make($plainPassword),
                'force_password_change' => true,
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]);

            // Putus sesi lama
            $employee->user->tokens()->delete();
            DB::table('sessions')->where('user_id', $employee->user->id)->delete();

            return [
                'username' => $employee->user->username,
                'temporary_password' => $plainPassword,
                'force_password_change' => true,
            ];
        });
    }

    /**
     * Helper internal untuk membuat snapshot awal karir saat penerimaan
     */
    private function createCareerHistorySnapshot(
        Employee $employee,
        string $movementType,
        ?string $letterNumber,
        ?string $letterDate,
        $effectiveDate,
        ?string $reason,
        ?int $approvedByUserId
    ): EmployeeCareerHistory {
        $position = Position::find($employee->position_id);
        $department = OrganizationDepartment::find($employee->department_id);
        $site = OrganizationSite::find($employee->site_id);
        $grade = Grade::find($employee->grade_id);
        $salaryGrade = SalaryGrade::find($employee->salary_grade_id);
        $jenjang = SalaryGradeJenjang::find($employee->salary_grade_jenjang_id);

        return EmployeeCareerHistory::create([
            'employee_id'               => $employee->id,
            'movement_type'             => $movementType,
            'letter_number'             => $letterNumber,
            'letter_date'               => $letterDate,
            'effective_date'            => $effectiveDate,
            'is_current'                => true,
            'position_id'               => $employee->position_id,
            'department_id'             => $employee->department_id,
            'site_id'                   => $employee->site_id,
            'grade_id'                  => $employee->grade_id,
            'salary_grade_id'           => $employee->salary_grade_id,
            'salary_grade_jenjang_id'   => $employee->salary_grade_jenjang_id,
            'employment_type_id'        => $employee->employment_type_id,
            
            // SNAPSHOT BAKU
            'position_title_snapshot'   => $position?->title ?? 'Tidak Ada Jabatan',
            'department_name_snapshot'  => $department?->name ?? 'Tidak Ada Departemen',
            'site_name_snapshot'        => $site?->name ?? 'Tidak Ada Site',
            'grade_name_snapshot'       => $grade?->name,
            'pangkat_snapshot'          => $employee->pangkat ?? $grade?->pangkat,
            'golongan_snapshot'         => $salaryGrade?->name,
            'level_jenjang_snapshot'    => $jenjang?->name,
            'poh_snapshot'              => $employee->poh,
            'work_area_snapshot'        => $employee->work_area,
            'employment_type_snapshot'  => $employee->employmentType?->name,
            
            'reason'                    => $reason,
            'approved_by_user_id'       => $approvedByUserId,
        ]);
    }
}
