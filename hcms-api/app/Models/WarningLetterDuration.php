<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WarningLetterDuration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'level',
        'name',
        'duration_months',
        'validity_unit',
        'consequence_description',
        'description',
        'status',
    ];

    protected $casts = [
        'duration_months' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
