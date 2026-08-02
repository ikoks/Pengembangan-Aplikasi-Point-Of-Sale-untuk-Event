<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto close shift terbengkalai jam 03:00
Schedule::command('app:auto-close-stale-shifts')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/auto-close-shifts.log'));

// Backup database jam 02:00 (retensi 7 hari)
Schedule::command('app:database-backup', ['--keep' => 7])
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/database-backup.log'));

// Hapus otomatis OTP yang lebih dari 3 hari setiap jam 01:00
Schedule::command('model:prune', [
    '--model' => [\App\Models\OtpCode::class],
])->dailyAt('01:00')->runInBackground();
