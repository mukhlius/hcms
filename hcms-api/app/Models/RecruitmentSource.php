<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecruitmentSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'status',
    ];
}
