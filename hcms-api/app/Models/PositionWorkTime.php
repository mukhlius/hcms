<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PositionWorkTime extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'position_id',
        'shift_id',
        'shift_type',
        'work_schedule_id',
        'work_type',
        'start_time',
        'end_time',
        'late_tolerance_minutes',
        'early_out_tolerance_minutes',
        'daily_hours',
        'weekly_days',
        'break_minutes',
        'is_overtime_eligible',
        'description',
        'status',
    ];

    protected $casts = [
        'daily_hours' => 'decimal:2',
        'weekly_days' => 'integer',
        'break_minutes' => 'integer',
        'late_tolerance_minutes' => 'integer',
        'early_out_tolerance_minutes' => 'integer',
        'is_overtime_eligible' => 'boolean',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function workSchedule(): BelongsTo
    {
        return $this->belongsTo(WorkSchedule::class, 'work_schedule_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
