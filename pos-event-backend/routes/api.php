<?php

use App\Http\Controllers\Api\ApiAuthController;
use App\Http\Controllers\Api\V1\CabangController;
use App\Http\Controllers\Api\V1\KategoriController;
use App\Http\Controllers\Api\V1\MenuController;
use App\Http\Controllers\Api\V1\SubKategoriController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem POS Event (Mobile Kasir & Panel Admin)
|--------------------------------------------------------------------------
|
| Semua response menggunakan format JSON.
| Token-based auth menggunakan Laravel Sanctum (Bearer Token).
|
| Struktur Hak Akses:
|   - auth:sanctum              → Semua user yang memiliki token valid (Admin & Kasir)
|   - auth:sanctum + admin.only → Hanya Admin (store, update, destroy)
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {

    // =========================================================================
    // AUTENTIKASI PUBLIK — Tidak memerlukan token
    // =========================================================================
    Route::prefix('auth')->name('auth.')->group(function () {

        /**
         * POST /api/v1/auth/login/kasir
         * Login Kasir Lapangan (username saja). Response: Bearer Token.
         */
        Route::post('/login/kasir', [ApiAuthController::class, 'loginKasir'])
            ->name('login.kasir');
    });

    // =========================================================================
    // ROUTE TERPROTEKSI — Memerlukan Bearer Token Sanctum yang valid
    // =========================================================================
    Route::middleware('auth:sanctum')->group(function () {

        /**
         * GET /api/v1/me
         * Kembalikan data profil user yang sedang login.
         */
        Route::get('/me', function (Request $request) {
            /** @var \App\Models\UserModel $user */
            $user = $request->user();
            $user->load(['role', 'cabang']);

            return response()->json([
                'success' => true,
                'message' => 'Data pengguna aktif.',
                'data'    => [
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

        /**
         * POST /api/v1/auth/logout/kasir
         * Logout Kasir — revoke Bearer Token aktif.
         */
        Route::post('/auth/logout/kasir', [ApiAuthController::class, 'logoutKasir'])
            ->name('auth.logout.kasir');

        // =====================================================================
        // MASTER DATA: CABANG (POS-3)
        // READ   → semua user terautentikasi (Admin & Kasir)
        // WRITE  → admin.only
        // =====================================================================
        Route::prefix('cabang')->name('cabang.')->group(function () {
            Route::get('/', [CabangController::class, 'index'])->name('index');
            Route::get('/{cabang}', [CabangController::class, 'show'])->name('show');

            // Operasi Write: hanya Admin
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [CabangController::class, 'store'])->name('store');
                Route::patch('/{cabang}', [CabangController::class, 'update'])->name('update');
                Route::delete('/{cabang}', [CabangController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: USER (POS-3)
        // READ   → semua user terautentikasi (contoh: kasir lihat profil sendiri)
        // WRITE  → admin.only
        // =====================================================================
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/{user}', [UserController::class, 'show'])->name('show');

            // Operasi Write: hanya Admin
            Route::middleware('admin.only')->group(function () {
                Route::post('/', [UserController::class, 'store'])->name('store');
                Route::patch('/{user}', [UserController::class, 'update'])->name('update');
                Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: KATEGORI (POS-3)
        // READ   → semua user terautentikasi (kasir download katalog)
        // WRITE  → admin.only
        // =====================================================================
        Route::prefix('kategoris')->name('kategoris.')->group(function () {
            Route::get('/', [KategoriController::class, 'index'])->name('index');
            Route::get('/{kategori}', [KategoriController::class, 'show'])->name('show');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [KategoriController::class, 'store'])->name('store');
                Route::patch('/{kategori}', [KategoriController::class, 'update'])->name('update');
                Route::delete('/{kategori}', [KategoriController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: SUB-KATEGORI (POS-3)
        // READ   → semua user terautentikasi
        // WRITE  → admin.only
        // =====================================================================
        Route::prefix('sub-kategoris')->name('sub-kategoris.')->group(function () {
            Route::get('/', [SubKategoriController::class, 'index'])->name('index');
            Route::get('/{sub_kategori}', [SubKategoriController::class, 'show'])->name('show');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [SubKategoriController::class, 'store'])->name('store');
                Route::patch('/{sub_kategori}', [SubKategoriController::class, 'update'])->name('update');
                Route::delete('/{sub_kategori}', [SubKategoriController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: MENU / KATALOG (POS-3)
        // READ   → semua user terautentikasi (kasir download katalog produk)
        // WRITE  → admin.only
        // =====================================================================
        Route::prefix('menus')->name('menus.')->group(function () {
            Route::get('/', [MenuController::class, 'index'])->name('index');
            Route::get('/{menu}', [MenuController::class, 'show'])->name('show');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [MenuController::class, 'store'])->name('store');
                Route::patch('/{menu}', [MenuController::class, 'update'])->name('update');
                Route::delete('/{menu}', [MenuController::class, 'destroy'])->name('destroy');
            });
        });
    });
});
