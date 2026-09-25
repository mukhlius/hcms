<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeHealthSafety extends Model
{
    use HasFactory;

    protected $table = 'employee_health_safeties';

    protected $fillable = [
        'employee_id',
        'blood_type',
        'rhesus',
        'height_cm',
        'weight_kg',
        'shirt_size',
        'pants_size',
        'safety_shoe_size',
        'coverall_size',
        'medical_notes',
    ];

    protected $casts = [
        'height_cm' => 'float',
        'weight_kg' => 'float',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
