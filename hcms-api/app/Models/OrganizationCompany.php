<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'legal_name',
        'short_name',
        'description',
        'tax_identifier',
        'address',
        'country',
        'currency',
        'timezone',
        'status',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function sites(): HasMany
    {
        return $this->hasMany(OrganizationSite::class, 'company_id');
    }

    public function organizationUnits(): HasMany
    {
        return $this->hasMany(OrganizationUnit::class, 'company_id');
    }
}
