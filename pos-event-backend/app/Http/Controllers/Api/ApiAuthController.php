<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\KasirLoginRequest;
use App\Models\Kasir;
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
        $kasir = Kasir::with(['role', 'cabang'])
            ->where('username', $request->username)
            ->first();

        if (
            ! $kasir ||
            ! $kasir->status_aktif ||
            $kasir->pin !== $request->pin
        ) {
            $this->auditLogService->log(
                aktivitas: 'LOGIN_FAILED',
                tabelTarget: 'kasirs',
                idTarget: $kasir ? $kasir->id_kasir : 'UNKNOWN',
                dataSebelum: ['username_attempt' => $request->username],
                request: $request
            );

            return response()->json([
                'success' => false,
                'message' => 'Username atau PIN tidak valid, atau akun tidak aktif.',
                'data'    => null,
            ], 401);
        }

        $kasir->tokens()->where('name', 'kasir-mobile-token')->delete();
        $token = $kasir->createToken('kasir-mobile-token')->plainTextToken;

        // Catat ke Audit Log
        $this->auditLogService->log(
            aktivitas: 'LOGIN_KASIR',
            tabelTarget: 'kasirs',
            idTarget: $kasir->id_kasir,
            dataSesudah: [
                'username'   => $kasir->username,
                'nama_kasir'  => $kasir->nama_kasir,
                'role'       => $kasir->role?->nama_role,
                'nama_cabang' => $kasir->cabang?->nama_cabang,
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
                    'id_kasir'    => $kasir->id_kasir,
                    'username'   => $kasir->username,
                    'nama_kasir'  => $kasir->nama_kasir,
                    'role'       => $kasir->role->nama_role,
                    'id_cabang'  => $kasir->id_cabang,
                    'nama_cabang' => $kasir->cabang?->nama_cabang,
                ],
            ],
        ]);
    }

    // Logout Kasir (POST /api/v1/auth/logout/kasir)
    public function logoutKasir(): JsonResponse
    {
        /** @var Kasir $kasir */
        $kasir = auth()->user();

        if ($kasir) {
            $this->auditLogService->log(
                aktivitas: 'LOGOUT_KASIR',
                tabelTarget: 'kasirs',
                idTarget: $kasir->id_kasir,
                dataSebelum: [
                    'username'  => $kasir->username,
                    'nama_kasir' => $kasir->nama_kasir,
                ],
                request: request()
            );

            $kasir->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil. Token telah dicabut.',
            'data'    => null,
        ]);
    }
}
