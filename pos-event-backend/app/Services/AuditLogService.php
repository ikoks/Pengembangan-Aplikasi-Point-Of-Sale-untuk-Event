<?php

namespace App\Services;

use App\Models\AuditLog;

class AuditLogService
{
    /**
     * @param array<string, mixed>|null $dataSebelum
     * @param array<string, mixed>|null $dataSesudah
     */
    public function log(
        string $aktivitas,
        string $tabelTarget,
        string $idTarget,
        ?array $dataSebelum,
        ?array $dataSesudah
    ): AuditLog {
        /** @var \App\Models\UserModel $user */
        $user = auth()->user();

        return AuditLog::create([
            'id_user'        => $user->id_user,
            'aktivitas'      => $aktivitas,
            'tabel_target'   => $tabelTarget,
            'id_target'      => $idTarget,
            'data_sebelum'   => $dataSebelum,
            'data_sesudah'   => $dataSesudah,
            'waktu_kejadian' => now(),
            'ip_address'     => request()->ip(),
        ]);
    }
}
