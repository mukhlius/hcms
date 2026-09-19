<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryGrade extends Model
{
    use HasFactory;

    protected $table = 'salary_grades';

    protected $fillable = [
        'code',
        'name',
        'jenjang',
        'housing_allowance',
        'level_id',
        'min_salary',
        'mid_salary',
        'max_salary',
        'description',
        'status',
    ];

    protected $casts = [
        'housing_allowance' => 'float',
        'level_id' => 'integer',
        'min_salary' => 'float',
        'mid_salary' => 'float',
        'max_salary' => 'float',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'level_id');
    }

    public function jenjangs(): HasMany
    {
        return $this->hasMany(SalaryGradeJenjang::class, 'salary_grade_id')->orderBy('name');
    }
}
