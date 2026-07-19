<?php

use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\WebAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — Sistem POS Event (Panel Admin)
|--------------------------------------------------------------------------
|
| File ini mendefinisikan semua route untuk antarmuka web (browser).
| Semua route web menggunakan Web Guard (session/cookie) Laravel.
|
*/

// =============================================================================
// ROUTE PUBLIK — Tidak memerlukan autentikasi
// =============================================================================

/**
 * Redirect root URL ke halaman login admin.
 */
Route::get('/', function () {
    return redirect()->route('admin.login');
});

/**
 * Group route autentikasi admin.
 * Menggunakan prefix 'admin' dan middleware 'guest' agar user yang
 * sudah login tidak bisa mengakses halaman login lagi.
 */
Route::prefix('admin')->name('admin.')->middleware('guest')->group(function () {

    /** GET  /admin/login → Menampilkan form login */
    Route::get('/login', [WebAuthController::class, 'showLoginForm'])->name('login');

    /** POST /admin/login → Memproses submit form login */
    Route::post('/login', [WebAuthController::class, 'login'])->name('login.submit');
});

// =============================================================================
// ROUTE TERPROTEKSI — Memerlukan autentikasi (middleware 'auth')
// =============================================================================

/**
 * Group route panel admin yang terproteksi.
 * Semua route di sini memerlukan pengguna untuk sudah login.
 */
Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {

    /** POST /admin/logout → Menghapus sesi login */
    Route::post('/logout', [WebAuthController::class, 'logout'])->name('logout');

    /** GET  /admin/dashboard → Halaman utama panel admin */
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});
