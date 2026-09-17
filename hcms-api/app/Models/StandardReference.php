<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StandardReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'code',
        'name',
        'metadata',
        'status',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
