<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KasirLoginRequest;
use App\Models\UserModel;
use Illuminate\Http\JsonResponse;

/**
 * ApiAuthController — Tiket: POS-2A
 *
 * Menangani autentikasi Kasir Lapangan melalui REST API.
 * Menggunakan Laravel Sanctum untuk menerbitkan Bearer Token
 * yang akan digunakan oleh aplikasi mobile React Native.
 *
 * Alur:
 *   1. Kasir mengirim POST /api/login/kasir dengan { "username": "kasir.satu" }
 *   2. Controller memvalidasi username, role, dan status_aktif.
 *   3. Jika valid, terbitkan Sanctum Token dan kembalikan dalam JSON response.
 */
class ApiAuthController extends Controller
{
    /**
     * Memproses request login Kasir Lapangan via API.
     *
     * Endpoint: POST /api/login/kasir
     *
     * Response sukses (200):
     * {
     *   "success": true,
     *   "message": "Login berhasil.",
     *   "data": {
     *     "token": "...",
     *     "token_type": "Bearer",
     *     "user": { ... }
     *   }
     * }
     *
     * Response gagal (401):
     * {
     *   "success": false,
     *   "message": "Username tidak ditemukan atau akun tidak aktif.",
     *   "data": null
     * }
     *
     * @param  KasirLoginRequest $request  Input yang sudah divalidasi.
     */
    public function loginKasir(KasirLoginRequest $request): JsonResponse
    {
        // Cari user berdasarkan username dengan eager-load relasi role dan cabang
        $user = UserModel::with(['role', 'cabang'])
            ->where('username', $request->username)
            ->first();

        // Validasi:
        //   1. User harus ada di database.
        //   2. Role user harus 'Kasir' (mencegah admin login ke endpoint ini).
        //   3. Status akun harus aktif.
        if (
            ! $user ||
            $user->role?->nama_role !== 'Kasir' ||
            ! $user->status_aktif
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Username tidak ditemukan, bukan kasir, atau akun tidak aktif.',
                'data'    => null,
            ], 401);
        }

        // Hapus semua token lama milik kasir ini untuk keamanan (one-device policy).
        // Kasir hanya boleh memiliki satu sesi aktif pada satu waktu.
        $user->tokens()->delete();

        // Buat token baru dengan nama deskriptif untuk identifikasi di panel admin
        $tokenName  = 'kasir-token-' . $user->username;
        $plainToken = $user->createToken($tokenName)->plainTextToken;

        // Kembalikan token dan data user yang relevan dalam JSON response
        return response()->json([
            'success' => true,
            'message' => 'Login kasir berhasil.',
            'data'    => [
                'token'      => $plainToken,
                'token_type' => 'Bearer',
                'user'       => [
                    'id_user'    => $user->id_user,
                    'username'   => $user->username,
                    'nama_user'  => $user->nama_user,
                    'role'       => $user->role?->nama_role,
                    'cabang'     => [
                        'id_cabang'    => $user->cabang?->id_cabang,
                        'nama_cabang'  => $user->cabang?->nama_cabang,
                        'pajak_persen' => $user->cabang?->pajak_persen,
                    ],
                ],
            ],
        ], 200);
    }

    /**
     * Memproses request logout Kasir melalui API.
     * Menghapus token Sanctum aktif yang digunakan untuk request ini.
     *
     * Endpoint: POST /api/logout/kasir
     * Middleware: auth:sanctum
     */
    public function logoutKasir(): JsonResponse
    {
        /** @var UserModel $user */
        $user = auth('sanctum')->user();

        // Validasi: Pastikan user yang menggunakan token ini ber-role 'Kasir'
        if (! $user || $user->role?->nama_role !== 'Kasir') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Endpoint ini hanya untuk Kasir.',
                'data'    => null,
            ], 403);
        }

        // Hapus hanya token yang sedang aktif digunakan untuk request ini
        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout kasir berhasil. Token telah dicabut.',
            'data'    => null,
        ], 200);
    }
}
