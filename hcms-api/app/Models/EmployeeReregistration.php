<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeReregistration extends Model
{
    use HasFactory;

    protected $table = 'employee_reregistrations';

    const STATUS_PENDING = 'PENDING';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_REJECTED = 'REJECTED';

    protected $fillable = [
        'ticket_number',
        'employee_id',
        'submitted_by_user_id',
        'status',
        'submission_notes',
        'original_data',
        'proposed_data',
        'review_notes',
        'reviewed_by_user_id',
        'reviewed_at',
    ];

    protected $casts = [
        'original_data' => 'array',
        'proposed_data' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
