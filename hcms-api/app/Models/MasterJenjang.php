<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MasterJenjang extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'master_jenjangs';

    protected $fillable = [
        'code',
        'name',
        'level',
        'description',
        'status',
    ];

    protected $casts = [
        'level' => 'integer',
    ];

    public function salaryGradeJenjangs(): HasMany
    {
        return $this->hasMany(SalaryGradeJenjang::class, 'master_jenjang_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    public static function generateCode(): string
    {
        $count = static::withTrashed()->count() + 1;
        $code = 'JNJ-' . str_pad((string)$count, 3, '0', STR_PAD_LEFT);
        while (static::withTrashed()->where('code', $code)->exists()) {
            $count++;
            $code = 'JNJ-' . str_pad((string)$count, 3, '0', STR_PAD_LEFT);
        }
        return $code;
    }
}
