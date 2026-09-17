<?php

namespace App\Enums;

enum AuditAction: string
{
    case CREATE = 'CREATE';
    case UPDATE = 'UPDATE';
    case DELETE = 'DELETE';
    case APPROVE = 'APPROVE';
    case REJECT = 'REJECT';
    case VERIFY = 'VERIFY';
    case LOGIN = 'LOGIN';
    case LOGOUT = 'LOGOUT';
    case EXPORT = 'EXPORT';
    case IMPORT = 'IMPORT';
    case DOWNLOAD = 'DOWNLOAD';
    case UPLOAD = 'UPLOAD';
    case EXECUTE = 'EXECUTE';
}
