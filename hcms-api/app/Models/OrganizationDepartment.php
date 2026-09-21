<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationDepartment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'site_id',
        'code',
        'name',
        'description',
        'leader_user_id',
        'status',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function booted()
    {
        static::saved(function ($dept) {
            app(\App\Services\OrganizationSyncService::class)->syncDepartment($dept);
        });

        static::deleted(function ($dept) {
            app(\App\Services\OrganizationSyncService::class)->deleteDepartment($dept);
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(OrganizationSection::class, 'department_id');
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_user_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
