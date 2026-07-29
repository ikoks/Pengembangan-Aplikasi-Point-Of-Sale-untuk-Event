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
        ?Request $request = null
    ): AuditLog {
        $userId = $idUserAktor ?? (auth()->check() ? auth()->user()->id_user : null);
        $requestInstance = $request ?? request();

        return AuditLog::create([
            'id_user'        => $userId,
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
