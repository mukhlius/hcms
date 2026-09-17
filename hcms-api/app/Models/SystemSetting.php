<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'key',
        'value',
        'type',
        'label',
        'description',
        'is_public',
        'updated_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getCastValueAttribute()
    {
        $val = match ($this->type) {
            'integer' => (int) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            default => $this->value,
        };

        if ($this->key === 'app_icon' && is_string($val) && str_contains($val, '/storage/')) {
            $currentAppUrl = rtrim(config('app.url') ?: url('/'), '/');
            $val = preg_replace('#^https?://[^/]+(/storage/.*)$#', $currentAppUrl . '$1', $val);
        }

        return $val;
    }
}
