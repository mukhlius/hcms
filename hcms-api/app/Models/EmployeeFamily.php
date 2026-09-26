<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeFamily extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'employee_families';

    protected $fillable = [
        'employee_id',
        'relation_type',
        'child_order',
        'name',
        'gender',
        'birth_place',
        'birth_date',
        'id_card_number',
        'bpjs_kesehatan_no',
        'insurance_no',
        'health_provider_no',
        'is_covered_insurance',
        'is_alive',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'is_covered_insurance' => 'boolean',
        'is_alive' => 'boolean',
        'child_order' => 'integer',
    ];

    protected $appends = [
        'age',
    ];

    public function getAgeAttribute(): ?int
    {
        if (!$this->birth_date) {
            return null;
        }
        return Carbon::parse($this->birth_date)->age;
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
