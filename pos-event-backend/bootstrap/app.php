<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

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
