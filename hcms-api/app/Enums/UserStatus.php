<?php

namespace App\Enums;

enum UserStatus: string
{
    case ACTIVE = 'ACTIVE';
    case INACTIVE = 'INACTIVE';
    case LOCKED = 'LOCKED';
    case SUSPENDED = 'SUSPENDED';
    case PENDING = 'PENDING';
}
