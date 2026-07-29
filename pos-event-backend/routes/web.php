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

    // =========================================================================
    // RESOURCE ROUTES (Admin Only)
    // =========================================================================
    
    // Semua operasi master data wajib admin
    Route::middleware('admin.only')->group(function () {
        
        // POS-A-10: Cabang, Kategori, SubKategori, SalesMode, Pegawai
        Route::resource('cabang', \App\Http\Controllers\Web\CabangController::class);
        Route::resource('kategori', \App\Http\Controllers\Web\KategoriController::class);
        Route::resource('sub-kategori', \App\Http\Controllers\Web\SubKategoriController::class)->parameters([
            'sub-kategori' => 'subKategori'
        ]);
        Route::resource('sales-mode', \App\Http\Controllers\Web\SalesModeController::class);
        
        // Pegawai (Kasir & Admin)
        Route::prefix('pegawai')->name('pegawai.')->group(function () {
            // Kasir
            Route::get('kasir', [\App\Http\Controllers\Web\PegawaiController::class, 'indexKasir'])->name('kasir.index');
            Route::get('kasir/create', [\App\Http\Controllers\Web\PegawaiController::class, 'createKasir'])->name('kasir.create');
            Route::post('kasir', [\App\Http\Controllers\Web\PegawaiController::class, 'storeKasir'])->name('kasir.store');
            Route::get('kasir/{id}/edit', [\App\Http\Controllers\Web\PegawaiController::class, 'editKasir'])->name('kasir.edit');
            Route::put('kasir/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'updateKasir'])->name('kasir.update');
            Route::delete('kasir/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'destroyKasir'])->name('kasir.destroy');
            Route::post('kasir/{id}/reset-password', [\App\Http\Controllers\Web\PegawaiController::class, 'resetPasswordKasir'])->name('kasir.reset-password');
            
            // Admin
            Route::get('admin', [\App\Http\Controllers\Web\PegawaiController::class, 'indexAdmin'])->name('admin.index');
            Route::get('admin/create', [\App\Http\Controllers\Web\PegawaiController::class, 'createAdmin'])->name('admin.create');
            Route::post('admin', [\App\Http\Controllers\Web\PegawaiController::class, 'storeAdmin'])->name('admin.store');
            Route::get('admin/{id}/edit', [\App\Http\Controllers\Web\PegawaiController::class, 'editAdmin'])->name('admin.edit');
            Route::put('admin/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'updateAdmin'])->name('admin.update');
            Route::delete('admin/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'destroyAdmin'])->name('admin.destroy');
            Route::post('admin/{id}/reset-password', [\App\Http\Controllers\Web\PegawaiController::class, 'resetPasswordAdmin'])->name('admin.reset-password');
        });

        // POS-A-11: Menu, Harga Cabang, Promosi
        Route::resource('menu', \App\Http\Controllers\Web\MenuController::class);
        Route::resource('harga-cabang', \App\Http\Controllers\Web\MenuTemplateController::class)->parameters([
            'harga-cabang' => 'menuTemplate'
        ]);
        Route::resource('promosi', \App\Http\Controllers\Web\PromosiController::class);
        
    });
});
