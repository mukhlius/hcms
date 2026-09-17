<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'cross_day',
        'grace_period_minutes',
        'status',
    ];

    protected $casts = [
        'cross_day' => 'boolean',
        'grace_period_minutes' => 'integer',
    ];
}
