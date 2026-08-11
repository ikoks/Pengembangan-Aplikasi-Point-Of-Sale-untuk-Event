<?php

use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\WebAuthController;
use Illuminate\Support\Facades\Route;

// --- ROUTE PUBLIK ---
Route::get('/', fn () => redirect()->route('admin.login'));

Route::prefix('admin')->name('admin.')->middleware('guest')->group(function () {
    Route::get('/login', [WebAuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [WebAuthController::class, 'login'])->name('login.submit');

    // Poin 10: Lupa Password Admin
    Route::get('/forgot-password', [\App\Http\Controllers\Web\AdminPasswordResetController::class, 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [\App\Http\Controllers\Web\AdminPasswordResetController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [\App\Http\Controllers\Web\AdminPasswordResetController::class, 'showResetForm'])->name('password.reset.form');
    Route::post('/reset-password', [\App\Http\Controllers\Web\AdminPasswordResetController::class, 'resetPassword'])->name('password.update');
});

// --- ROUTE ADMIN (AUTH & ADMIN ONLY) ---
Route::prefix('admin')->name('admin.')->middleware('auth')->group(function () {

    Route::post('/logout', [WebAuthController::class, 'logout'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::middleware('admin.only')->group(function () {

        // Ajax Endpoints untuk Modal Pemilih (Poin 3)
        Route::prefix('ajax')->name('ajax.')->group(function () {
            Route::get('kategori', [\App\Http\Controllers\Web\AdminAjaxController::class, 'kategori'])->name('kategori');
            Route::get('sub-kategori', [\App\Http\Controllers\Web\AdminAjaxController::class, 'subKategori'])->name('sub-kategori');
            Route::get('menu', [\App\Http\Controllers\Web\AdminAjaxController::class, 'menu'])->name('menu');
            Route::get('sales-mode', [\App\Http\Controllers\Web\AdminAjaxController::class, 'salesMode'])->name('sales-mode');
            Route::get('cabang', [\App\Http\Controllers\Web\AdminAjaxController::class, 'cabang'])->name('cabang');
            Route::get('kategori-pembayaran', [\App\Http\Controllers\Web\AdminAjaxController::class, 'kategoriPembayaran'])->name('kategori-pembayaran');
            Route::get('menus-by-sales-mode', [\App\Http\Controllers\Web\AdminAjaxController::class, 'menusBySalesMode'])->name('menus-by-sales-mode');
        });

        // Master Data
        Route::resource('cabang', \App\Http\Controllers\Web\CabangController::class);
        Route::patch('cabang/{cabang}/toggle-status', [\App\Http\Controllers\Web\CabangController::class, 'toggleStatus'])->name('cabang.toggle-status');
        
        Route::resource('kategori', \App\Http\Controllers\Web\KategoriController::class);
        Route::patch('kategori/{kategori}/toggle-status', [\App\Http\Controllers\Web\KategoriController::class, 'toggleStatus'])->name('kategori.toggle-status');
        
        Route::resource('sub-kategori', \App\Http\Controllers\Web\SubKategoriController::class)->parameters([
            'sub-kategori' => 'subKategori'
        ]);
        Route::patch('sub-kategori/{subKategori}/toggle-status', [\App\Http\Controllers\Web\SubKategoriController::class, 'toggleStatus'])->name('sub-kategori.toggle-status');
        Route::resource('sales-mode', \App\Http\Controllers\Web\SalesModeController::class);
        Route::patch('sales-mode/{sales_mode}/toggle-status', [\App\Http\Controllers\Web\SalesModeController::class, 'toggleStatus'])->name('sales-mode.toggle-status');
        
        Route::resource('menu', \App\Http\Controllers\Web\MenuController::class);
        Route::patch('menu/{menu}/toggle-status', [\App\Http\Controllers\Web\MenuController::class, 'toggleStatus'])->name('menu.toggle-status');
        
        Route::resource('harga-cabang', \App\Http\Controllers\Web\MenuTemplateController::class)->parameters([
            'harga-cabang' => 'menuTemplate'
        ]);
        Route::resource('metode-pembayaran', \App\Http\Controllers\Web\MetodePembayaranController::class)->parameters([
            'metode-pembayaran' => 'metodePembayaran'
        ]);
        Route::patch('metode-pembayaran/{metodePembayaran}/toggle-status', [\App\Http\Controllers\Web\MetodePembayaranController::class, 'toggleStatus'])->name('metode-pembayaran.toggle-status');
        
        Route::resource('kategori-metode', \App\Http\Controllers\Web\KategoriMetodePembayaranController::class)->parameters([
            'kategori-metode' => 'kategoriMetode'
        ]);
        Route::patch('kategori-metode/{kategoriMetode}/toggle-status', [\App\Http\Controllers\Web\KategoriMetodePembayaranController::class, 'toggleStatus'])->name('kategori-metode.toggle-status');
        
        Route::resource('promosi', \App\Http\Controllers\Web\PromosiController::class);
        Route::patch('promosi/{promosi}/toggle-status', [\App\Http\Controllers\Web\PromosiController::class, 'toggleStatus'])->name('promosi.toggle-status');

        // Pegawai Kasir
        Route::prefix('pegawai')->name('pegawai.')->group(function () {
            Route::get('kasir', [\App\Http\Controllers\Web\PegawaiController::class, 'indexKasir'])->name('kasir.index');
            Route::get('kasir/create', [\App\Http\Controllers\Web\PegawaiController::class, 'createKasir'])->name('kasir.create');
            Route::post('kasir', [\App\Http\Controllers\Web\PegawaiController::class, 'storeKasir'])->name('kasir.store');
            Route::get('kasir/{id}/edit', [\App\Http\Controllers\Web\PegawaiController::class, 'editKasir'])->name('kasir.edit');
            Route::put('kasir/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'updateKasir'])->name('kasir.update');
            Route::patch('kasir/{id}/toggle-status', [\App\Http\Controllers\Web\PegawaiController::class, 'toggleStatusKasir'])->name('kasir.toggle-status');
            Route::delete('kasir/{id}', [\App\Http\Controllers\Web\PegawaiController::class, 'destroyKasir'])->name('kasir.destroy');
        });

        // Riwayat Transaksi
        Route::prefix('transaksi')->name('transaksi.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Web\TransaksiController::class, 'index'])->name('index');
            Route::get('export-excel', [\App\Http\Controllers\Web\TransaksiController::class, 'exportExcel'])->name('export-excel');
            Route::get('export-pdf', [\App\Http\Controllers\Web\TransaksiController::class, 'exportPdf'])->name('export-pdf');
            Route::get('{id}', [\App\Http\Controllers\Web\TransaksiController::class, 'show'])->name('show');
        });

        // Log & Riwayat
        Route::prefix('log')->name('log.')->group(function () {
            Route::get('audit', [\App\Http\Controllers\Web\AuditLogController::class, 'index'])->name('audit.index');
            Route::get('audit/export-excel', [\App\Http\Controllers\Web\AuditLogController::class, 'exportExcel'])->name('audit.export-excel');
            Route::get('audit/export-pdf', [\App\Http\Controllers\Web\AuditLogController::class, 'exportPdf'])->name('audit.export-pdf');
            Route::get('shift', [\App\Http\Controllers\Web\ShiftLogController::class, 'index'])->name('shift.index');
            Route::get('shift/export-excel', [\App\Http\Controllers\Web\ShiftLogController::class, 'exportExcel'])->name('shift.export-excel');
            Route::get('shift/export-pdf', [\App\Http\Controllers\Web\ShiftLogController::class, 'exportPdf'])->name('shift.export-pdf');
        });

        // Laporan Keuangan
        Route::prefix('laporan')->name('laporan.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Web\LaporanController::class, 'index'])->name('index');
            Route::get('export-pdf', [\App\Http\Controllers\Web\LaporanController::class, 'exportPdf'])->name('export-pdf');
            Route::get('export-excel', [\App\Http\Controllers\Web\LaporanController::class, 'exportExcel'])->name('export-excel');
        });

        // OTP Void
        Route::prefix('otp')->name('otp.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Web\AdminOtpController::class, 'index'])->name('index');
            Route::post('generate', [\App\Http\Controllers\Web\AdminOtpController::class, 'generate'])->name('generate');
            Route::get('status', [\App\Http\Controllers\Web\AdminOtpController::class, 'checkStatus'])->name('status');
            Route::get('kasir-by-cabang', [\App\Http\Controllers\Web\AdminOtpController::class, 'kasirByCabang'])->name('kasir-by-cabang');
            Route::get('active-shifts', [\App\Http\Controllers\Web\AdminOtpController::class, 'activeShifts'])->name('active-shifts');
        });

        // Manajemen Admin
        Route::prefix('pegawai/admin')->name('management.')->group(function () {
            Route::get('/', [\App\Http\Controllers\Web\AdminManagementController::class, 'index'])->name('index');
            Route::post('/', [\App\Http\Controllers\Web\AdminManagementController::class, 'store'])->name('store');
            Route::put('{id}', [\App\Http\Controllers\Web\AdminManagementController::class, 'update'])->name('update');
            Route::patch('{id}/toggle-status', [\App\Http\Controllers\Web\AdminManagementController::class, 'toggleStatus'])->name('toggle-status');
            Route::delete('{id}', [\App\Http\Controllers\Web\AdminManagementController::class, 'destroy'])->name('destroy');
            Route::post('{id}/reset-password', [\App\Http\Controllers\Web\AdminManagementController::class, 'resetPassword'])->name('reset-password');
        });

    });
});
