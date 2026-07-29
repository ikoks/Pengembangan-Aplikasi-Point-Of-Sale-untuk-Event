<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KasirLoginRequest;
use App\Models\UserModel;
use Illuminate\Http\JsonResponse;

// Controller Autentikasi Kasir API
class ApiAuthController extends Controller
{
    // Login Kasir (POST /api/v1/auth/login/kasir)
    public function loginKasir(KasirLoginRequest $request): JsonResponse
    {
        $user = UserModel::with(['role', 'cabang'])
            ->where('username', $request->username)
            ->first();

        if (
            ! $user ||
            $user->role?->nama_role !== 'Kasir' ||
            ! $user->status_aktif
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Username tidak ditemukan, bukan role Kasir, atau akun tidak aktif.',
                'data'    => null,
            ], 401);
        }

        $user->tokens()->where('name', 'kasir-mobile-token')->delete();
        $token = $user->createToken('kasir-mobile-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'token'      => $token,
                'token_type' => 'Bearer',
                'user'       => [
                    'id_user'    => $user->id_user,
                    'username'   => $user->username,
                    'nama_user'  => $user->nama_user,
                    'role'       => $user->role->nama_role,
                    'id_cabang'  => $user->id_cabang,
                    'nama_cabang' => $user->cabang?->nama_cabang,
                ],
            ],
        ]);
    }

    // Logout Kasir (POST /api/v1/auth/logout/kasir)
    public function logoutKasir(): JsonResponse
    {
        /** @var UserModel $user */
        $user = auth()->user();

        if ($user) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Token telah dicabut.',
            'data'    => null,
        ]);
    }
}
