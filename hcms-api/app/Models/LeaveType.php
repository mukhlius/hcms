<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'paid',
        'requires_document',
        'requires_approval',
        'requires_medical_document',
        'duration_type',
        'status',
    ];

    protected $casts = [
        'paid' => 'boolean',
        'requires_document' => 'boolean',
        'requires_approval' => 'boolean',
        'requires_medical_document' => 'boolean',
    ];
}
