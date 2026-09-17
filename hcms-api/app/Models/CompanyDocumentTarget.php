<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyDocumentTarget extends Model
{
    use HasFactory;

    protected $table = 'company_document_targets';

    protected $fillable = [
        'company_document_id',
        'target_type',
        'target_id',
        'target_name',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(CompanyDocument::class, 'company_document_id');
    }
}
