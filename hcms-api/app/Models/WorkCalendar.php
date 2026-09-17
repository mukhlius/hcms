<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkCalendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'site_id',
        'employee_group_id',
        'work_schedule_id',
        'shift_id',
        'holiday_calendar_id',
        'code',
        'name',
        'status',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function employeeGroup(): BelongsTo
    {
        return $this->belongsTo(EmployeeGroup::class, 'employee_group_id');
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'work_schedule_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function holidayCalendar(): BelongsTo
    {
        return $this->belongsTo(HolidayCalendar::class, 'holiday_calendar_id');
    }
}
