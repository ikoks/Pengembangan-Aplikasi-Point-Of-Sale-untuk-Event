<?php

use App\Http\Controllers\Api\ApiAuthController;
use App\Http\Controllers\Api\V1\CabangController;
use App\Http\Controllers\Api\V1\KategoriController;
use App\Http\Controllers\Api\V1\MenuController;
use App\Http\Controllers\Api\V1\MenuTemplateController;
use App\Http\Controllers\Api\V1\ShiftSessionController;
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
|   - auth:sanctum              → Admin & Kasir (semua user bertoken valid)
|   - auth:sanctum + admin.only → Hanya Admin (mutasi master data)
|
| Versi: v1
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
        // READ  → Admin & Kasir | WRITE → Admin only
        // =====================================================================
        Route::prefix('cabang')->name('cabang.')->group(function () {
            Route::get('/', [CabangController::class, 'index'])->name('index');
            Route::get('/{cabang}', [CabangController::class, 'show'])->name('show');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [CabangController::class, 'store'])->name('store');
                Route::patch('/{cabang}', [CabangController::class, 'update'])->name('update');
                Route::delete('/{cabang}', [CabangController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: USER (POS-3)
        // READ  → Admin & Kasir | WRITE → Admin only
        // =====================================================================
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::get('/{user}', [UserController::class, 'show'])->name('show');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [UserController::class, 'store'])->name('store');
                Route::patch('/{user}', [UserController::class, 'update'])->name('update');
                Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MASTER DATA: KATEGORI (POS-3)
        // READ  → Admin & Kasir | WRITE → Admin only
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
        // READ  → Admin & Kasir | WRITE → Admin only
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
        // READ  → Admin & Kasir (download katalog) | WRITE → Admin only
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

        // =====================================================================
        // TEMPLATE HARGA REGIONAL (POS-4)
        // =====================================================================
        Route::prefix('menu-templates')->name('menu-templates.')->group(function () {

            /**
             * GET /api/v1/menu-templates/cabang/{id_cabang}
             * Ambil seluruh katalog harga untuk satu cabang tertentu.
             * Diakses oleh kasir (download harga) dan admin (verifikasi konfigurasi).
             * CATATAN: Route statis ini WAJIB dideklarasikan SEBELUM route parameter
             * dinamis {menu_template} agar tidak ter-overlap/terbajak.
             */
            Route::get('/cabang/{id_cabang}', [MenuTemplateController::class, 'getByCabang'])
                ->name('by-cabang');

            // Operasi Write: hanya Admin
            Route::middleware('admin.only')->group(function () {

                /**
                 * POST /api/v1/menu-templates
                 * Buat konfigurasi harga baru untuk kombinasi menu × cabang × sales mode.
                 */
                Route::post('/', [MenuTemplateController::class, 'store'])
                    ->name('store');

                /**
                 * PUT /api/v1/menu-templates/{menu_template}
                 * Perbarui nominal harga pada konfigurasi yang sudah ada.
                 */
                Route::put('/{menu_template}', [MenuTemplateController::class, 'update'])
                    ->name('update');

                /**
                 * DELETE /api/v1/menu-templates/{menu_template}
                 * Hapus konfigurasi harga (hard delete).
                 */
                Route::delete('/{menu_template}', [MenuTemplateController::class, 'destroy'])
                    ->name('destroy');
            });
        });

        // =====================================================================
        // MANAJEMEN SESI SHIFT KASIR (POS-5A — Opening Shift)
        // Endpoint berikutnya (POS-5B, 5C) akan ditambahkan di Hari 4+
        // =====================================================================
        Route::prefix('shift')->name('shift.')->group(function () {

            /**
             * POST /api/v1/shift/open
             * Kasir membuka sesi shift baru dengan modal awal kas.
             *
             * Logika: Cek shift aktif → jika ada tolak 422 → jika tidak ada buat shift baru.
             * Diakses oleh: Kasir & Admin terautentikasi Sanctum (tidak perlu admin.only).
             */
            Route::post('/open', [ShiftSessionController::class, 'open'])
                ->name('open');
        });
    });
});
