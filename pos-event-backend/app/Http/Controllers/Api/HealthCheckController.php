<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Endpoint Health Check Publik (/api/v1/health)
class HealthCheckController extends Controller
{
    public function __invoke()
    {
        $checks  = [];
        $allOk   = true;
        $startMs = microtime(true);

        // 1. Cek MySQL
        try {
            DB::connection()->getPdo();
            $dbVersion = DB::select('SELECT VERSION() as version')[0]->version ?? 'unknown';
            $checks['database'] = [
                'status'  => 'ok',
                'message' => 'MySQL connected',
                'version' => $dbVersion,
            ];
        } catch (\Throwable $e) {
            $checks['database'] = [
                'status'  => 'fail',
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ];
            $allOk = false;
        }

        // 2. Cek Queue
        try {
            $pendingJobs = DB::table('jobs')->count();
            $failedJobs  = DB::table('failed_jobs')->count();
            $queueStatus = $failedJobs > 50 ? 'warn' : 'ok';

            $checks['queue'] = [
                'status'       => $queueStatus,
                'message'      => $queueStatus === 'ok' ? 'Queue operational' : 'High failed job count',
                'pending_jobs' => $pendingJobs,
                'failed_jobs'  => $failedJobs,
                'driver'       => config('queue.default', 'sync'),
            ];
        } catch (\Throwable $e) {
            $checks['queue'] = [
                'status'  => 'warn',
                'message' => 'Queue check failed: ' . $e->getMessage(),
                'driver'  => config('queue.default', 'sync'),
            ];
        }

        // 3. Cek Storage
        try {
            $testFile    = 'health-check-' . time() . '.tmp';
            $testContent = 'health-check-' . now()->toIso8601String();

            Storage::put($testFile, $testContent);
            $readBack = Storage::get($testFile);
            Storage::delete($testFile);

            if ($readBack !== $testContent) {
                throw new \RuntimeException('Storage read/write mismatch');
            }

            $checks['storage'] = [
                'status'  => 'ok',
                'message' => 'Storage read/write access verified',
                'disk'    => config('filesystems.default', 'local'),
            ];
        } catch (\Throwable $e) {
            $checks['storage'] = [
                'status'  => 'fail',
                'message' => 'Storage write failed: ' . $e->getMessage(),
            ];
            $allOk = false;
        }

        // 4. Info Aplikasi
        $checks['application'] = [
            'status'          => 'ok',
            'name'            => config('app.name', 'POS Event'),
            'environment'     => config('app.env', 'production'),
            'debug_mode'      => config('app.debug', false),
            'timezone'        => config('app.timezone', 'UTC'),
            'php_version'     => PHP_VERSION,
            'laravel_version' => app()->version(),
        ];

        if (config('app.debug') && config('app.env') === 'production') {
            $checks['application']['status']  = 'warn';
            $checks['application']['message'] = 'DEBUG mode is ON in production — security risk!';
        }

        $responseTimeMs = round((microtime(true) - $startMs) * 1000, 2);
        $httpStatus     = $allOk ? 200 : 503;

        $overallStatus = 'ok';
        foreach ($checks as $check) {
            if (($check['status'] ?? 'ok') === 'fail') {
                $overallStatus = 'fail';
                break;
            }
            if (($check['status'] ?? 'ok') === 'warn') {
                $overallStatus = 'warn';
            }
        }

        return response()->json([
            'status'           => $overallStatus,
            'timestamp'        => now()->toIso8601String(),
            'response_time_ms' => $responseTimeMs,
            'checks'           => $checks,
        ], $httpStatus);
    }
}
