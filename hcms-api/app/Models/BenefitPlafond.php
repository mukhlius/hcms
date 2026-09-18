<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BenefitPlafond extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'benefit_type',
        'salary_grade_id',
        'marital_category',
        'marital_status_id',
        'amount',
        'period_type',
        'description',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function salaryGrade(): BelongsTo
    {
        return $this->belongsTo(SalaryGrade::class, 'salary_grade_id');
    }

    public function maritalStatus(): BelongsTo
    {
        return $this->belongsTo(StandardReference::class, 'marital_status_id');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('benefit_type', $type);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
