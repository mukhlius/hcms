<?php

namespace App\Enums;

enum SecuritySeverity: string
{
    case INFO = 'INFO';
    case WARNING = 'WARNING';
    case HIGH = 'HIGH';
    case CRITICAL = 'CRITICAL';
}
