<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationSite extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'short_name',
        'site_type',
        'description',
        'location',
        'address',
        'country',
        'province',
        'city',
        'district',
        'postal_code',
        'latitude',
        'longitude',
        'timezone',
        'status',
        'effective_from',
        'effective_to',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function departments(): HasMany
    {
        return $this->hasMany(OrganizationDepartment::class, 'site_id');
    }

    public function workLocations(): HasMany
    {
        return $this->hasMany(WorkLocation::class, 'site_id');
    }
}
