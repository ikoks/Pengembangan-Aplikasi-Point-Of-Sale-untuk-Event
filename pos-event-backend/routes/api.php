<?php

use App\Http\Controllers\Api\ApiAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem POS Event (Mobile Kasir)
|--------------------------------------------------------------------------
|
| File ini mendefinisikan semua route untuk REST API yang dikonsumsi
| oleh aplikasi mobile React Native (PosEventKasir).
|
| Semua response menggunakan format JSON.
| Token-based auth menggunakan Laravel Sanctum (Bearer Token).
|
*/

// =============================================================================
// API v1 — Versi pertama dari API POS Event
// =============================================================================
Route::prefix('v1')->name('api.v1.')->group(function () {

    // =========================================================================
    // AUTENTIKASI KASIR — POS-2A
    // Endpoint publik (tidak memerlukan token Sanctum)
    // =========================================================================
    Route::prefix('auth')->name('auth.')->group(function () {

        /**
         * POST /api/v1/auth/login/kasir
         *
         * Login Kasir Lapangan menggunakan username saja.
         * Response: Bearer Token + data user.
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
         *
         * Mengembalikan data user yang sedang aktif (untuk validasi token).
         */
        Route::get('/me', function (Request $request) {
            /** @var \App\Models\UserModel $user */
            $user = $request->user();
            $user->load(['role', 'cabang']);

            return response()->json([
                'success' => true,
                'message' => 'Data pengguna aktif.',
                'data'    => [
                    'id_user'   => $user->id_user,
                    'username'  => $user->username,
                    'nama_user' => $user->nama_user,
                    'role'      => $user->role?->nama_role,
                    'cabang'    => [
                        'id_cabang'    => $user->cabang?->id_cabang,
                        'nama_cabang'  => $user->cabang?->nama_cabang,
                        'pajak_persen' => $user->cabang?->pajak_persen,
                    ],
                ],
            ]);
        })->name('me');

        /**
         * POST /api/v1/auth/logout/kasir
         *
         * Logout Kasir — mencabut (revoke) Bearer Token aktif.
         */
        Route::post('/auth/logout/kasir', [ApiAuthController::class, 'logoutKasir'])
            ->name('auth.logout.kasir');
    });
});
