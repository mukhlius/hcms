<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeBankAccount extends Model
{
    use HasFactory;

    protected $table = 'employee_bank_accounts';

    protected $fillable = [
        'employee_id',
        'bank_name',
        'account_number',
        'account_holder',
        'is_payroll_primary',
    ];

    protected $casts = [
        'is_payroll_primary' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
