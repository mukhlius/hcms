<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LevelWorkRoster extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'level',
        'grade_id',
        'work_schedule_id',
        'roster_name',
        'days_on',
        'days_off',
        'poh_type',
        'travel_days',
        'description',
        'status',
    ];

    protected $casts = [
        'level' => 'integer',
        'days_on' => 'integer',
        'days_off' => 'integer',
        'travel_days' => 'integer',
    ];

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id');
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
