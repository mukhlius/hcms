<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HolidayCalendar extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'year',
        'scope',
        'company_id',
        'site_id',
        'status',
    ];

    protected $casts = [
        'year' => 'integer',
    ];

    public function holidays(): HasMany
    {
        return $this->hasMany(Holiday::class, 'holiday_calendar_id');
    }
}
