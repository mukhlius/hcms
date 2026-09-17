<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobFamily extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'status',
    ];

    public function jobs(): HasMany
    {
        return $this->hasMany(OrganizationJob::class, 'job_family_id');
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class, 'job_family_id');
    }
}
