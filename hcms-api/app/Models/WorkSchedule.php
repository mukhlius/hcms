<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'pattern_type',
        'cycle_days',
        'days_on',
        'days_off',
        'status',
    ];

    protected $casts = [
        'cycle_days' => 'integer',
        'days_on' => 'integer',
        'days_off' => 'integer',
    ];
}
