<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSubGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_group_id',
        'code',
        'name',
        'description',
        'status',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(EmployeeGroup::class, 'employee_group_id');
    }
}
