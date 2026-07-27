<?php

use App\Console\Commands\AutoCloseStaleShifts;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /**
         * Aktifkan CORS Middleware secara global agar HP Kasir (React Native)
         * dalam jaringan Wi-Fi lokal dapat mengakses API tanpa diblokir browser/RN.
         * Config CORS diambil dari config/cors.php.
         */
        $middleware->use([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        /**
         * Override URL redirect default middleware 'auth' (dari '/login' ke '/admin/login').
         * Ketika user yang belum login mengakses route yang dilindungi,
         * mereka akan diarahkan ke halaman login admin.
         */
        $middleware->redirectGuestsTo(fn (Request $request) => route('admin.login'));

        /**
         * Daftarkan alias middleware kustom.
         * 'admin.only' → EnsureUserIsAdmin: memastikan user adalah Admin
         *                sebelum mengizinkan akses ke operasi write (store/update/destroy).
         */
        $middleware->alias([
            'admin.only' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);
    })

    ->withSchedule(function (Schedule $schedule): void {
        /**
         * [POS-A-04] Auto-Close Shift Terbengkalai — Setiap hari pukul 03:00 pagi.
         *
         * Menutup semua shift OPEN/ON_BREAK yang waktu_mulai-nya sebelum
         * hari ini (H-1). Ini menangani kasir yang lupa menutup shift.
         *
         * Log: shift_operator_logs dengan aksi 'auto_closed'.
         * Laravel Log: storage/logs/laravel.log.
         *
         * Untuk mengaktifkan scheduler di production:
         *   Tambahkan ke crontab server:
         *   * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
         */
        $schedule->command(AutoCloseStaleShifts::class)
            ->dailyAt('03:00')
            ->withoutOverlapping()    // Cegah overlap jika command sebelumnya masih berjalan
            ->runInBackground()       // Jalankan di background agar tidak blokir scheduler
            ->appendOutputTo(storage_path('logs/auto-close-shifts.log'));
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        /**
         * Untuk request API (/api/*), kembalikan JSON 401 daripada redirect.
         * Untuk request web, gunakan redirect standar Laravel.
         */
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated. Token tidak valid atau sudah kadaluarsa.',
                    'data'    => null,
                ], 401);
            }
        });
    })->create();
