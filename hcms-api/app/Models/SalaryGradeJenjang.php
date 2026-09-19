<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryGradeJenjang extends Model
{
    use HasFactory;

    protected $table = 'salary_grade_jenjang';

    protected $fillable = [
        'salary_grade_id',
        'grade_id',
        'name',
        'status',
    ];

    protected $casts = [
        'salary_grade_id' => 'integer',
        'grade_id' => 'integer',
    ];

    public function salaryGrade(): BelongsTo
    {
        return $this->belongsTo(SalaryGrade::class, 'salary_grade_id');
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class, 'grade_id');
    }
}
