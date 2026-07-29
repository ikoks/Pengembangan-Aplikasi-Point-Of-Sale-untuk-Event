<?php

use App\Http\Controllers\Api\ApiAuthController;
use App\Http\Controllers\Api\V1\CabangController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\KatalogController;
use App\Http\Controllers\Api\V1\KategoriController;
use App\Http\Controllers\Api\V1\MenuController;
use App\Http\Controllers\Api\V1\MenuTemplateController;
use App\Http\Controllers\Api\V1\OtpController;
use App\Http\Controllers\Api\V1\ShiftSessionController;
use App\Http\Controllers\Api\V1\SubKategoriController;
use App\Http\Controllers\Api\V1\SyncController;
use App\Http\Controllers\Api\V1\TransaksiController;
use App\Http\Controllers\Api\V1\UserController;
use App\Models\UserModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// API Routes — Sistem POS Event
Route::prefix('v1')->name('api.v1.')->group(function () {

    // Health Check Endpoint (Publik)
    Route::get('/health', \App\Http\Controllers\Api\HealthCheckController::class)->name('health');

    // Autentikasi Publik
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('/login/kasir', [ApiAuthController::class, 'loginKasir'])->name('login.kasir');
    });

    // Route Terproteksi (Bearer Token Sanctum)
    Route::middleware('auth:sanctum')->group(function () {

        // User Profile
        Route::get('/me', function (Request $request) {
            /** @var UserModel $user */
            $user = $request->user();
            $user->load(['role', 'cabang']);

            return response()->json([
                'success' => true,
                'message' => 'Data pengguna aktif.',
                'data' => [
                    'id_user'    => $user->id_user,
                    'username'   => $user->username,
                    'nama_user'  => $user->nama_user,
                    'role'       => $user->role?->nama_role,
                    'cabang'     => $user->cabang ? [
                        'id_cabang'    => $user->cabang->id_cabang,
                        'nama_cabang'  => $user->cabang->nama_cabang,
                        'pajak_persen' => (float) $user->cabang->pajak_persen,
                    ] : null,
                ],
            ]);
        })->name('me');

        Route::post('/auth/logout/kasir', [ApiAuthController::class, 'logoutKasir'])->name('auth.logout.kasir');

        // Master Data: Cabang
        Route::prefix('cabang')->name('cabang.')->group(function () {
            Route::get('/', [CabangController::class, 'index'])->name('index');
            Route::get('/{cabang}', [CabangController::class, 'show'])->name('show');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [CabangController::class, 'store'])->name('store');
                Route::patch('/{cabang}', [CabangController::class, 'update'])->name('update');
                Route::delete('/{cabang}', [CabangController::class, 'destroy'])->name('destroy');
            });
        });

        // Master Data: User
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/{user}', [UserController::class, 'show'])->name('show');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [UserController::class, 'store'])->name('store');
                Route::patch('/{user}', [UserController::class, 'update'])->name('update');
                Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
            });
        });

        // Master Data: Kategori
        Route::prefix('kategoris')->name('kategoris.')->group(function () {
            Route::get('/', [KategoriController::class, 'index'])->name('index');
            Route::get('/{kategori}', [KategoriController::class, 'show'])->name('show');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [KategoriController::class, 'store'])->name('store');
                Route::patch('/{kategori}', [KategoriController::class, 'update'])->name('update');
                Route::delete('/{kategori}', [KategoriController::class, 'destroy'])->name('destroy');
            });
        });

        // Master Data: Sub-Kategori
        Route::prefix('sub-kategoris')->name('sub-kategoris.')->group(function () {
            Route::get('/', [SubKategoriController::class, 'index'])->name('index');
            Route::get('/{sub_kategori}', [SubKategoriController::class, 'show'])->name('show');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [SubKategoriController::class, 'store'])->name('store');
                Route::patch('/{sub_kategori}', [SubKategoriController::class, 'update'])->name('update');
                Route::delete('/{sub_kategori}', [SubKategoriController::class, 'destroy'])->name('destroy');
            });
        });

        // Master Data: Menu / Katalog
        Route::prefix('menus')->name('menus.')->group(function () {
            Route::get('/', [MenuController::class, 'index'])->name('index');
            Route::get('/{menu}', [MenuController::class, 'show'])->name('show');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [MenuController::class, 'store'])->name('store');
                Route::patch('/{menu}', [MenuController::class, 'update'])->name('update');
                Route::delete('/{menu}', [MenuController::class, 'destroy'])->name('destroy');
            });
        });

        // Template Harga Regional
        Route::prefix('menu-templates')->name('menu-templates.')->group(function () {
            Route::get('/cabang/{id_cabang}', [MenuTemplateController::class, 'getByCabang'])->name('by-cabang');
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [MenuTemplateController::class, 'store'])->name('store');
                Route::put('/{menu_template}', [MenuTemplateController::class, 'update'])->name('update');
                Route::delete('/{menu_template}', [MenuTemplateController::class, 'destroy'])->name('destroy');
            });
        });

        // Manajemen Shift Kasir
        Route::prefix('shift')->name('shift.')->group(function () {
            Route::post('/open', [ShiftSessionController::class, 'open'])->name('open');
            Route::post('/break', [ShiftSessionController::class, 'break'])->name('break');
            Route::post('/resume', [ShiftSessionController::class, 'resume'])->name('resume');
            Route::post('/switch', [ShiftSessionController::class, 'switchOperator'])->name('switch');
            Route::post('/close', [ShiftSessionController::class, 'close'])->name('close');
        });

        // OTP Void Admin
        Route::prefix('otp')->name('otp.')->group(function () {
            Route::post('/request-void', [OtpController::class, 'requestVoid'])->name('request-void');
        });

        // Checkout / Transaksi Penjualan
        Route::prefix('checkout')->name('checkout.')->group(function () {
            Route::post('/draft', [CheckoutController::class, 'storeDraft'])->name('draft');
            Route::post('/sync', [SyncController::class, 'syncBatch'])->name('sync');
            Route::post('/{id_transaksi}/confirm', [CheckoutController::class, 'confirmTransaction'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('confirm');
            Route::post('/{id_transaksi}/void', [CheckoutController::class, 'voidTransaction'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('void');
        });

        // Riwayat Transaksi
        Route::prefix('transaksi')->name('transaksi.')->group(function () {
            Route::get('/', [TransaksiController::class, 'index'])->name('index');
            Route::get('/{id_transaksi}', [TransaksiController::class, 'show'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('show');
        });

        // Download Katalog Offline
        Route::prefix('katalog')->name('katalog.')->group(function () {
            Route::get('/download', [KatalogController::class, 'download'])->name('download');
        });
    });
});
