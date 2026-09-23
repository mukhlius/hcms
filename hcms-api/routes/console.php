<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Backup database snapshot harian otomatis pada pukul 01:00 WIB (retensi 30 hari)
Schedule::command('db:backup --keep=30')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/backup.log'));

