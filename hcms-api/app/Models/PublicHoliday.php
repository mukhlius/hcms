<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PublicHoliday extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'holiday_date',
        'name',
        'type',
        'year',
        'is_recurring',
        'description',
        'status',
    ];

    protected $casts = [
        'holiday_date' => 'date',
        'year' => 'integer',
        'is_recurring' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
