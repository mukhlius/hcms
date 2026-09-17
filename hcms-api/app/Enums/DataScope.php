<?php

namespace App\Enums;

enum DataScope: string
{
    case SELF = 'SELF';
    case SUBORDINATES = 'SUBORDINATES';
    case DEPARTMENT = 'DEPARTMENT';
    case SITE = 'SITE';
    case COMPANY = 'COMPANY';
    case GLOBAL = 'GLOBAL';
}
