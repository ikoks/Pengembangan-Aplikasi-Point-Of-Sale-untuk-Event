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
| Arsitektur v1.1-Sprint2:
|   - Tidak ada Payment Gateway / Webhook callback.
|   - Non-cash manual: nomor_referensi disimpan di transaksi.
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

        /**
         * POST /api/v1/auth/logout/kasir
         * Logout Kasir — revoke Bearer Token aktif.
         */
        Route::post('/auth/logout/kasir', [ApiAuthController::class, 'logoutKasir'])
            ->name('auth.logout.kasir');

        // =====================================================================
        // MASTER DATA: CABANG
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
        // MASTER DATA: USER
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
        // MASTER DATA: KATEGORI
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
        // MASTER DATA: SUB-KATEGORI
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
        // MASTER DATA: MENU / KATALOG
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
        // TEMPLATE HARGA REGIONAL
        // =====================================================================
        Route::prefix('menu-templates')->name('menu-templates.')->group(function () {

            /**
             * GET /api/v1/menu-templates/cabang/{id_cabang}
             * Ambil seluruh katalog harga untuk satu cabang tertentu.
             * CATATAN: Route statis ini WAJIB dideklarasikan SEBELUM route parameter
             * dinamis {menu_template} agar tidak ter-overlap/terbajak.
             */
            Route::get('/cabang/{id_cabang}', [MenuTemplateController::class, 'getByCabang'])
                ->name('by-cabang');

            Route::middleware('admin.only')->group(function () {
                Route::post('/', [MenuTemplateController::class, 'store'])->name('store');
                Route::put('/{menu_template}', [MenuTemplateController::class, 'update'])->name('update');
                Route::delete('/{menu_template}', [MenuTemplateController::class, 'destroy'])->name('destroy');
            });
        });

        // =====================================================================
        // MANAJEMEN SESI SHIFT KASIR
        // =====================================================================
        Route::prefix('shift')->name('shift.')->group(function () {

            /**
             * POST /api/v1/shift/open
             * Kasir membuka sesi shift baru dengan modal awal kas.
             */
            Route::post('/open', [ShiftSessionController::class, 'open'])->name('open');

            /**
             * POST /api/v1/shift/break
             * Kasir memulai jeda — status → ON_BREAK, id_user_aktif → NULL.
             */
            Route::post('/break', [ShiftSessionController::class, 'break'])->name('break');

            /**
             * POST /api/v1/shift/resume
             * Kasir kembali dari jeda — status → OPEN, id_user_aktif diisi.
             */
            Route::post('/resume', [ShiftSessionController::class, 'resume'])->name('resume');

            /**
             * POST /api/v1/shift/switch
             * Ganti operator aktif (id_user_aktif) tanpa menutup shift pemilik.
             * Log ke shift_operator_logs dengan aksi 'switch'.
             */
            Route::post('/switch', [ShiftSessionController::class, 'switchOperator'])->name('switch');

            /**
             * POST /api/v1/shift/close
             * [POS-A-03] Menutup shift secara silent:
             *   - Hitung selisih kas → simpan di DB tanpa tampilkan di response
             *   - Revoke semua token Sanctum milik kasir → trigger direct logout di HP
             *   - Response bersih: { success: true, message: '...' }
             */
            Route::post('/close', [ShiftSessionController::class, 'close'])->name('close');
        });

        // =====================================================================
        // OTP VOID ADMIN
        // =====================================================================
        Route::prefix('otp')->name('otp.')->group(function () {

            /**
             * POST /api/v1/otp/request-void
             * [POS-A-06] Kasir request OTP untuk void transaksi Success.
             *
             * Logika:
             *   1. Validasi id_transaksi ada & berstatus 'Success'.
             *   2. Generate kode OTP 6 digit.
             *   3. Simpan ke tabel otp_codes dengan TTL 1 menit.
             *   4. Return sukses (Admin buka Web Admin untuk lihat kode).
             *
             * Diakses oleh: Kasir terautentikasi Sanctum.
             */
            Route::post('/request-void', [OtpController::class, 'requestVoid'])->name('request-void');
        });

        // =====================================================================
        // CHECKOUT / TRANSAKSI PENJUALAN
        // =====================================================================
        Route::prefix('checkout')->name('checkout.')->group(function () {

            /**
             * POST /api/v1/checkout/draft
             * [POS-A-05] Membuat draft transaksi baru dari keranjang kasir.
             *   - Validasi shift aktif milik kasir.
             *   - Hitung subtotal per item & kalkulasi pajak cabang + diskon promo.
             *   - Simpan Transaksi + TransaksiDetail dalam DB::transaction atomic.
             */
            Route::post('/draft', [CheckoutController::class, 'storeDraft'])->name('draft');

            /**
             * POST /api/v1/checkout/sync
             * [POS-A-07] Batch sinkronisasi transaksi offline (SyncManager).
             *   - Idempoten: UUID yang sudah ada di server tidak diduplikasi.
             *   - Response HTTP 207 Multi-Status.
             */
            Route::post('/sync', [SyncController::class, 'syncBatch'])->name('sync');

            /**
             * POST /api/v1/checkout/{id}/confirm
             * [POS-A-05] Konfirmasi pelunasan tunai atau non-tunai direct.
             *   - Tunai: langsung ubah status → Success.
             *   - Non-tunai: simpan nomor_referensi (RRN EDC/bukti transfer) → Success.
             */
            Route::post('/{id_transaksi}/confirm', [CheckoutController::class, 'confirmTransaction'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('confirm');

            /**
             * POST /api/v1/checkout/{id}/void
             * [POS-A-06] Void transaksi dengan aturan berbeda per status:
             *   - Draft: boleh void/hapus item tanpa OTP Admin.
             *   - Success: wajib verifikasi kode OTP Admin (6 digit, TTL 1 menit).
             *     Jika valid: void transaksi + catat ke audit_logs + pakai kode OTP.
             */
            Route::post('/{id_transaksi}/void', [CheckoutController::class, 'voidTransaction'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('void');
        });

        // =====================================================================
        // RIWAYAT TRANSAKSI
        // =====================================================================
        Route::prefix('transaksi')->name('transaksi.')->group(function () {
            Route::get('/', [TransaksiController::class, 'index'])->name('index');
            Route::get('/{id_transaksi}', [TransaksiController::class, 'show'])
                ->where('id_transaksi', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}')
                ->name('show');
        });

        // =====================================================================
        // KATALOG TERPADU (Download Katalog Offline)
        // =====================================================================
        Route::prefix('katalog')->name('katalog.')->group(function () {

            /**
             * GET /api/v1/katalog/download?id_cabang={uuid}&id_sales={uuid}
             * Download payload katalog terpadu: kategori+menu+harga, promosi, metode bayar.
             * Digunakan HP kasir saat opening shift untuk inisialisasi SQLite lokal.
             */
            Route::get('/download', [KatalogController::class, 'download'])->name('download');
        });
    });

    // =========================================================================
    // [POS-A-08] DEPRECATED: Payment Gateway & Webhook telah dihapus dari arsitektur.
    // Sistem tidak memanggil payment gateway. Non-cash manual memakai
    // transaksi.nomor_referensi (RRN EDC / bukti transfer).
    // =========================================================================
});
