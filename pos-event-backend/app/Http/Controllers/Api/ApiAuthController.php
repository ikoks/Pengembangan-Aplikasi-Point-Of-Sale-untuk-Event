<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KasirLoginRequest;
use App\Models\UserModel;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

// Controller Autentikasi Kasir API
class ApiAuthController extends Controller
{
    public function __construct(protected AuditLogService $auditLogService)
    {
    }

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
            $this->auditLogService->log(
                aktivitas: 'LOGIN_FAILED',
                tabelTarget: 'user',
                idTarget: $user ? $user->id_user : 'UNKNOWN',
                idUserAktor: $user ? $user->id_user : null,
                dataSebelum: ['username_attempt' => $request->username],
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Username tidak ditemukan, bukan role Kasir, atau akun tidak aktif.',
                'data'    => null,
            ], 401);
        }

        $user->tokens()->where('name', 'kasir-mobile-token')->delete();
        $token = $user->createToken('kasir-mobile-token')->plainTextToken;

        // Catat ke Audit Log
        $this->auditLogService->log(
            aktivitas: 'LOGIN_KASIR',
            tabelTarget: 'user',
            idTarget: $user->id_user,
            idUserAktor: $user->id_user,
            dataSesudah: [
                'username'   => $user->username,
                'nama_user'  => $user->nama_user,
                'role'       => $user->role?->nama_role,
                'nama_cabang' => $user->cabang?->nama_cabang,
            ],
            request: $request
        );

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
            $this->auditLogService->log(
                aktivitas: 'LOGOUT_KASIR',
                tabelTarget: 'user',
                idTarget: $user->id_user,
                idUserAktor: $user->id_user,
                dataSebelum: [
                    'username'  => $user->username,
                    'nama_user' => $user->nama_user,
                ],
                request: request()
            );

            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Token telah dicabut.',
            'data'    => null,
        ]);
    }
}
