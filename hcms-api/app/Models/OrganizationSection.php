<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrganizationSection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'site_id',
        'department_id',
        'code',
        'name',
        'description',
        'leader_user_id',
        'status',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(OrganizationCompany::class, 'company_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(OrganizationDepartment::class, 'department_id');
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_user_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'section_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
