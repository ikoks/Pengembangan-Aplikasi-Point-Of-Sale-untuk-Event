<?php

namespace App\Services;

use App\Models\AuditLog;

/**
 * AuditLogService — Sprint 2 Update
 *
 * Service untuk mencatat semua aksi kritis ke tabel `audit_logs`.
 *
 * Aksi yang dilog:
 *   - VOID_TRANSACTION : Void transaksi Success (wajib OTP Admin)
 *   - CANCEL_DRAFT     : Pembatalan transaksi Draft (tanpa OTP)
 *   - VOID_ITEM        : Void item pada transaksi Success (wajib OTP)
 *   - AUTO_CLOSED      : Shift ditutup otomatis oleh cron (dilog via ShiftOperatorLog)
 *
 * Setiap record menyimpan:
 *   - id_user        : Siapa yang melakukan aksi (kasir / admin / sistem)
 *   - aktivitas      : Nama aksi dalam format SCREAMING_SNAKE_CASE
 *   - tabel_target   : Tabel yang terpengaruh
 *   - id_target      : UUID record yang terpengaruh
 *   - data_sebelum   : Snapshot JSON sebelum perubahan
 *   - data_sesudah   : Snapshot JSON setelah perubahan (termasuk metadata OTP)
 *   - waktu_kejadian : Timestamp aksi
 *   - ip_address     : IP address request
 */
class AuditLogService
{
    /**
     * Catat aksi ke audit_logs.
     *
     * @param  string      $aktivitas    Nama aksi (VOID_TRANSACTION, CANCEL_DRAFT, dll.)
     * @param  string      $tabelTarget  Nama tabel yang terpengaruh
     * @param  string      $idTarget     UUID record yang terpengaruh
     * @param  string|null $idUserAktor  UUID user yang melakukan aksi (override auth user)
     * @param  array|null  $dataSebelum  Snapshot data sebelum perubahan
     * @param  array|null  $dataSesudah  Snapshot data setelah perubahan
     */
    public function log(
        string $aktivitas,
        string $tabelTarget,
        string $idTarget,
        ?string $idUserAktor = null,
        ?array $dataSebelum = null,
        ?array $dataSesudah = null
    ): AuditLog {
        // Prioritas aktor: parameter eksplisit > user dari auth session
        $userId = $idUserAktor ?? (auth()->check() ? auth()->user()->id_user : null);

        return AuditLog::create([
            'id_user'        => $userId,
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
