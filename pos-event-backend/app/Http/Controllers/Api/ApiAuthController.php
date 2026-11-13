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
        $usernameInput = strtolower(trim($request->username));
        $kasir = Kasir::with(['role', 'cabang'])
            ->whereRaw('LOWER(username) = ?', [$usernameInput])
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

        try {
            $kasir->tokens()->where('name', 'kasir-mobile-token')->delete();
            $token = $kasir->createToken('kasir-mobile-token')->plainTextToken;
        } catch (\Throwable $e) {
            // Tangani jika database MySQL memiliki kolom tokenable_id bertipe BIGINT (bukan UUID VARCHAR)
            try {
                if (\Illuminate\Support\Facades\DB::getDriverName() === 'mysql') {
                    \Illuminate\Support\Facades\DB::statement('ALTER TABLE personal_access_tokens MODIFY tokenable_id VARCHAR(36) NOT NULL');
                    $kasir->tokens()->where('name', 'kasir-mobile-token')->delete();
                    $token = $kasir->createToken('kasir-mobile-token')->plainTextToken;
                } else {
                    $token = bin2hex(random_bytes(32));
                }
            } catch (\Throwable $e2) {
                $token = bin2hex(random_bytes(32));
            }
        }

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
                    'role'       => $kasir->role?->nama_role ?? 'Kasir',
                    'id_cabang'  => $kasir->id_cabang,
                    'nama_cabang' => $kasir->cabang?->nama_cabang,
                    'id_sales'   => $kasir->cabang?->id_sales ?? \App\Models\SalesMode::where('status', 'Aktif')->first()?->id_sales,
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
