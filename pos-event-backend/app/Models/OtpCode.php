<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model OtpCode
 *
 * Merepresentasikan tabel `otp_codes` yang menyimpan kode OTP sementara
 * untuk otorisasi void transaksi yang sudah berstatus 'Success'.
 *
 * Alur kerja:
 *   1. Kasir meminta OTP → record baru dibuat dengan expires_at = now + 1 menit.
 *   2. Admin melihat kode di Web Admin dashboard.
 *   3. Admin bacakan ke Kasir → Kasir submit ke /checkout/{id}/void.
 *   4. Server validasi: kode cocok, belum expired, belum dipakai (used_at NULL).
 *   5. Void berhasil → used_at diisi (kode tidak bisa dipakai ulang).
 *
 * @property string          $id_otp         UUID v4 primary key.
 * @property string          $id_transaksi   FK ke transaksi yang di-void.
 * @property string          $kode           Kode OTP 6 digit.
 * @property \Carbon\Carbon  $expires_at     Waktu kadaluwarsa kode.
 * @property \Carbon\Carbon|null $used_at    Waktu kode dipakai (null = belum dipakai).
 */
class OtpCode extends Model
{
    use HasUuid;

    protected $table      = 'otp_codes';
    protected $primaryKey = 'id_otp';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'id_transaksi',
        'kode',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];

    // =========================================================================
    // SCOPE
    // =========================================================================

    /**
     * Scope: hanya kode yang masih valid (belum expired & belum dipakai).
     */
    public function scopeValid($query)
    {
        return $query
            ->whereNull('used_at')
            ->where('expires_at', '>', now());
    }

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Transaksi yang membutuhkan otorisasi void dengan kode OTP ini.
     */
    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
