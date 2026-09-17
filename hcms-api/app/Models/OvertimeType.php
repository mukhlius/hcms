<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OvertimeType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'rate_multiplier',
        'category',
        'status',
    ];

    protected $casts = [
        'rate_multiplier' => 'float',
    ];
}
