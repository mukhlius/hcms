<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Grade extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'level',
        'pangkat',
        'min_salary',
        'max_salary',
        'field_duty_duration_days',
        'field_leave_duration_days',
        'field_allowance',
        'leave_lumpsum_allowance',
        'business_trip_allowance_daily',
        'status',
    ];

    protected $casts = [
        'level' => 'integer',
        'pangkat' => 'string',
        'min_salary' => 'float',
        'max_salary' => 'float',
        'field_duty_duration_days' => 'integer',
        'field_leave_duration_days' => 'integer',
        'field_allowance' => 'float',
        'leave_lumpsum_allowance' => 'float',
        'business_trip_allowance_daily' => 'float',
    ];

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'grade_id');
    }
}
