<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TerminationType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'legal_basis',
        'pesangon_multiplier',
        'pmtk_multiplier',
        'entitled_to_uph',
        'entitled_to_uang_pisah',
        'description',
        'status',
    ];

    protected $casts = [
        'pesangon_multiplier' => 'decimal:2',
        'pmtk_multiplier' => 'decimal:2',
        'entitled_to_uph' => 'boolean',
        'entitled_to_uang_pisah' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
