<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaidLeavePolicy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'category',
        'duration_days',
        'duration_unit',
        'requires_document',
        'required_document_name',
        'description',
        'status',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'requires_document' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
