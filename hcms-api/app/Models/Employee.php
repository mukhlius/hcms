<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'user_id',
        'nrp',
        'name',
        'nickname',
        'gender',
        'birth_place',
        'birth_date',
        'religion',
        'marital_status',
        'marriage_date',
        'id_card_number',
        'tax_number',
        'tax_status',
        'bpjs_ketenagakerjaan',
        'bpjs_kesehatan',
        'insurance_admedika',
        'email_company',
        'email_personal',
        'phone_mobile',
        'phone_home',
        'ktp_address',
        'ktp_city',
        'ktp_district',
        'ktp_province',
        'ktp_postal_code',
        'residential_address',
        'residential_city',
        'residential_district',
        'residential_province',
        'residential_postal_code',
        'mailing_address',
        'mailing_city',
        'mailing_district',
        'mailing_province',
        'mailing_postal_code',
        'company_id',
        'site_id',
        'department_id',
        'section_id',
        'position_id',
        'grade_id',
        'salary_grade_id',
        'pangkat',
        'salary_grade_jenjang_id',
        'employment_type_id',
        'poh',
        'work_area',
        'hire_date',
        'probation_end_date',
        'contract_end_date',
        'employment_status',
        'photo_url',
        'notes',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'marriage_date' => 'date',
        'hire_date' => 'date',
        'probation_end_date' => 'date',
        'contract_end_date' => 'date',
    ];

    protected $appends = [
        'age',
    ];

    /**
     * Hitung usia dinamis berdasarkan tanggal lahir
     */
    public function getAgeAttribute(): ?int
    {
        if (!$this->birth_date) {
            return null;
        }
        return Carbon::parse($this->birth_date)->age;
    }

    // --- RELASI MASTER ORGANISASI & AUTH ---

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(OrganizationDepartment::class, 'department_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(OrganizationSection::class, 'section_id');
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function salaryGrade(): BelongsTo
    {
        return $this->belongsTo(SalaryGrade::class, 'salary_grade_id');
    }

    public function salaryGradeJenjang(): BelongsTo
    {
        return $this->belongsTo(SalaryGradeJenjang::class, 'salary_grade_jenjang_id');
    }

    public function employmentType(): BelongsTo
    {
        return $this->belongsTo(EmploymentType::class, 'employment_type_id');
    }

    // --- RELASI DATA PENDUKUNG KARYAWAN ---

    public function families(): HasMany
    {
        return $this->hasMany(EmployeeFamily::class, 'employee_id');
    }

    public function educations(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class, 'employee_id');
    }

    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmployeeEmergencyContact::class, 'employee_id');
    }

    public function healthSafety(): HasOne
    {
        return $this->hasOne(EmployeeHealthSafety::class, 'employee_id');
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(EmployeeBankAccount::class, 'employee_id');
    }

    public function careerHistories(): HasMany
    {
        return $this->hasMany(EmployeeCareerHistory::class, 'employee_id')->orderBy('effective_date', 'desc');
    }

    public function currentCareerHistory(): HasOne
    {
        return $this->hasOne(EmployeeCareerHistory::class, 'employee_id')->where('is_current', true);
    }
}
