<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'category',
        'required',
        'expiry_required',
        'employee_required',
        'verification_required',
        'status',
    ];

    protected $casts = [
        'required' => 'boolean',
        'expiry_required' => 'boolean',
        'employee_required' => 'boolean',
        'verification_required' => 'boolean',
    ];
}
