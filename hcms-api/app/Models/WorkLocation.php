<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkLocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'site_id',
        'code',
        'name',
        'type',
        'description',
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

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'location_id');
    }
}
