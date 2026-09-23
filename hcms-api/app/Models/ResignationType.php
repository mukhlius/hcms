<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResignationType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'notice_period_days',
        'requires_clearance',
        'entitled_to_uang_pisah',
        'entitled_to_sisa_cuti',
        'description',
        'status',
    ];

    protected $casts = [
        'notice_period_days' => 'integer',
        'requires_clearance' => 'boolean',
        'entitled_to_uang_pisah' => 'boolean',
        'entitled_to_sisa_cuti' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
