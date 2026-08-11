<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

// Service Pencatatan Audit Log
class AuditLogService
{
    // Catat aksi kritis ke audit_logs
    public function log(
        string $aktivitas,
        string $tabelTarget,
        string $idTarget,
        ?string $idUserAktor = null,
        ?array $dataSebelum = null,
        ?array $dataSesudah = null,
        ?Request $request = null,
        ?string $tipeAktor = null
    ): AuditLog {
        $userId = $idUserAktor;
        $aktorType = $tipeAktor;

        if ($userId === null && auth()->check()) {
            $user = auth()->user();
            $userId = $user->id_admin ?? $user->id_kasir;
            $aktorType = $user instanceof \App\Models\Admin ? 'Admin' : ($user instanceof \App\Models\Kasir ? 'Kasir' : null);
        }

        $requestInstance = $request ?? request();

        return AuditLog::create([
            'id_user_aktor'  => $userId,
            'tipe_aktor'     => $aktorType,
            'aktivitas'      => $aktivitas,
            'tabel_target'   => $tabelTarget,
            'id_target'      => $idTarget,
            'data_sebelum'   => $dataSebelum,
            'data_sesudah'   => $dataSesudah,
            'waktu_kejadian' => now(),
            'ip_address'     => $requestInstance->ip(),
        ]);
    }
}
