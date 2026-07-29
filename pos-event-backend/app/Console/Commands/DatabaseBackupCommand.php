<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

// Command Backup Database MySQL
class DatabaseBackupCommand extends Command
{
    protected $signature = 'app:database-backup
                            {--keep=7 : Jumlah hari retensi backup}
                            {--no-gzip : Simpan tanpa gzip}
                            {--path= : Direktori simpan kustom}';

    protected $description = 'Backup database MySQL ke storage/backups/db/';

    public function handle(): int
    {
        $this->info('DATABASE BACKUP — ' . now()->format('Y-m-d H:i:s'));

        $dbHost   = config('database.connections.mysql.host', '127.0.0.1');
        $dbPort   = config('database.connections.mysql.port', '3306');
        $dbName   = config('database.connections.mysql.database');
        $dbUser   = config('database.connections.mysql.username');
        $dbPass   = config('database.connections.mysql.password');
        $keepDays = (int) $this->option('keep');
        $noGzip   = (bool) $this->option('no-gzip');

        if (empty($dbName)) {
            $this->error('Nama database tidak ditemukan!');
            return Command::FAILURE;
        }

        $customPath = $this->option('path');
        $backupDir  = $customPath ? rtrim($customPath, '/') : storage_path('backups/db');

        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $timestamp = now()->format('Y-m-d_H-i-s');
        $extension = $noGzip ? '.sql' : '.sql.gz';
        $filepath  = "{$backupDir}/{$dbName}_{$timestamp}{$extension}";

        $passOption = $dbPass ? "--password=" . escapeshellarg($dbPass) : '';
        $mysqldump  = sprintf(
            'mysqldump --host=%s --port=%s --user=%s %s --single-transaction --quick --lock-tables=false %s',
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            $passOption,
            escapeshellarg($dbName)
        );

        $command = $noGzip
            ? "{$mysqldump} > " . escapeshellarg($filepath)
            : "{$mysqldump} | gzip > " . escapeshellarg($filepath);

        $startTime = microtime(true);
        exec($command . ' 2>&1', $output, $exitCode);
        $elapsed = round(microtime(true) - $startTime, 2);

        if ($exitCode !== 0 || !file_exists($filepath) || filesize($filepath) === 0) {
            $this->error('mysqldump gagal! Exit code: ' . $exitCode);
            Log::error('[DatabaseBackup] Backup gagal', ['exit_code' => $exitCode, 'output' => $output]);
            return Command::FAILURE;
        }

        $sizeKb = round(filesize($filepath) / 1024, 1);
        $this->info("Backup selesai dalam {$elapsed}s ({$sizeKb} KB)");
        Log::info('[DatabaseBackup] Backup berhasil', ['file' => $filepath, 'size_kb' => $sizeKb]);

        // Clean backup lama
        $deleted = 0;
        $cutoff  = now()->subDays($keepDays)->timestamp;
        $files   = glob($backupDir . "/{$dbName}_*.sql*");

        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $deleted++;
            }
        }

        $this->info("Database backup selesai. {$deleted} file lama dihapus.");
        return Command::SUCCESS;
    }
}
