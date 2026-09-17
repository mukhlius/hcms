<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationDepartment extends Model
{
    use HasFactory;

    protected $fillable = ['site_id', 'code', 'name', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function site(): BelongsTo
    {
        return $this->belongsTo(OrganizationSite::class, 'site_id');
    }
}
