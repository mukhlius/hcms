<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeCareerHistory extends Model
{
    use HasFactory;

    protected $table = 'employee_career_histories';

    protected $fillable = [
        'employee_id',
        'movement_type',
        'letter_number',
        'letter_date',
        'effective_date',
        'end_date',
        'is_current',
        'position_id',
        'department_id',
        'site_id',
        'grade_id',
        'salary_grade_id',
        'salary_grade_jenjang_id',
        'employment_type_id',
        'position_title_snapshot',
        'department_name_snapshot',
        'site_name_snapshot',
        'grade_name_snapshot',
        'golongan_snapshot',
        'pangkat_snapshot',
        'level_jenjang_snapshot',
        'poh_snapshot',
        'work_area_snapshot',
        'employment_type_snapshot',
        'reason',
        'notes',
        'sk_file_url',
        'approved_by_user_id',
    ];

    protected $casts = [
        'letter_date' => 'date',
        'effective_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(OrganizationDepartment::class, 'department_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function salaryGradeJenjang(): BelongsTo
    {
        return $this->belongsTo(SalaryGradeJenjang::class, 'salary_grade_jenjang_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
