<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationJob extends Model
{
    use HasFactory;

    protected $table = 'organization_jobs';

    protected $fillable = [
        'job_family_id',
        'code',
        'name',
        'description',
        'status',
    ];

    public function jobFamily(): BelongsTo
    {
        return $this->belongsTo(JobFamily::class, 'job_family_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'job_id');
    }
}
