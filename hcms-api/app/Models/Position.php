<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Position extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'title',
        'short_title',
        'site_id',
        'department_id',
        'section_id',
        'organization_unit_id',
        'job_id',
        'job_family_id',
        'grade_id',
        'reports_to_position_id',
        'location_id',
        'cost_center_id',
        'approved_headcount',
        'current_headcount',
        'is_frozen',
        'status',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'approved_headcount' => 'integer',
        'current_headcount' => 'integer',
        'is_frozen' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    protected $appends = [
        'vacancy_headcount',
    ];

    public function getVacancyHeadcountAttribute(): int
    {
        return max(0, (int)$this->approved_headcount - (int)$this->current_headcount);
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

    public function organizationUnit(): BelongsTo
    {
        return $this->belongsTo(OrganizationUnit::class, 'organization_unit_id');
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(OrganizationJob::class, 'job_id');
    }

    public function jobFamily(): BelongsTo
    {
        return $this->belongsTo(JobFamily::class, 'job_family_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }

    public function reportsTo(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'reports_to_position_id');
    }

    public function subordinates(): HasMany
    {
        return $this->hasMany(Position::class, 'reports_to_position_id');
    }

    public function workLocation(): BelongsTo
    {
        return $this->belongsTo(WorkLocation::class, 'location_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }
}
