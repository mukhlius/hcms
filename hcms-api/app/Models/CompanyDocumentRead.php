<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyDocumentRead extends Model
{
    use HasFactory;

    protected $table = 'company_document_reads';

    protected $fillable = [
        'company_document_id',
        'user_id',
        'read_at',
        'acknowledged_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
        'acknowledged_at' => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(CompanyDocument::class, 'company_document_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
