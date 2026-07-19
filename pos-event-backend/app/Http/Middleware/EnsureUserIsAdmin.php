<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureUserIsAdmin Middleware
 *
 * Middleware ini melindungi endpoint yang bersifat write-only (store, update, destroy)
 * agar hanya dapat diakses oleh pengguna dengan role 'Admin'.
 *
 * Alur kerja:
 *   1. Middleware ini HARUS digunakan setelah middleware `auth:sanctum`
 *      agar `auth()->user()` sudah tersedia.
 *   2. Middleware memeriksa relasi `role` pada UserModel.
 *   3. Jika role bukan 'Admin', kembalikan JSON 403 Forbidden.
 *   4. Jika role 'Admin', lanjutkan request ke Controller.
 *
 * Cara Pendaftaran: Di `bootstrap/app.php`, daftarkan sebagai alias 'admin.only'.
 */
class EnsureUserIsAdmin
{
    /**
     * Menangani request masuk dan memeriksa role user.
     *
     * @param  Request  $request  Request HTTP yang masuk.
     * @param  Closure  $next     Fungsi next dalam pipeline middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var \App\Models\UserModel $user */
        $user = $request->user();

        // Eager-load relasi role jika belum di-load untuk menghindari N+1
        if (! $user->relationLoaded('role')) {
            $user->load('role');
        }

        // Periksa apakah nama role user adalah 'Admin'
        if ($user->role?->nama_role !== 'Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Administrator yang diizinkan melakukan operasi ini.',
                'data'    => null,
            ], Response::HTTP_FORBIDDEN); // 403 Forbidden
        }

        return $next($request);
    }
}
