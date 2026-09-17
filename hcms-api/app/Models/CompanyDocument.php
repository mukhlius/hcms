<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class CompanyDocument extends Model
{
    use HasFactory;

    protected $table = 'company_documents';

    protected $fillable = [
        'document_number',
        'title',
        'category',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'version',
        'effective_date',
        'expiry_date',
        'is_acknowledgment_required',
        'audience_type',
        'status',
        'created_by',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'expiry_date' => 'date',
        'is_acknowledgment_required' => 'boolean',
        'file_size' => 'integer',
    ];

    protected $appends = [
        'formatted_file_size',
    ];

    public function targets(): HasMany
    {
        return $this->hasMany(CompanyDocumentTarget::class, 'company_document_id');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(CompanyDocumentRead::class, 'company_document_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }
}
