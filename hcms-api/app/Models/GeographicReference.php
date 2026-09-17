<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeographicReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'parent_id',
        'code',
        'name',
        'postal_code',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(GeographicReference::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(GeographicReference::class, 'parent_id');
    }
}
