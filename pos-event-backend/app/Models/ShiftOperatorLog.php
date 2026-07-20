<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model ShiftOperatorLog
 *
 * Merepresentasikan tabel `shift_operator_logs` yang menyimpan
 * jejak audit setiap aksi/kejadian penting selama sesi shift berlangsung.
 *
 * Tabel ini bersifat append-only (hanya INSERT, tidak pernah UPDATE/DELETE)
 * untuk menjamin integritas jejak audit yang tidak bisa dimanipulasi.
 *
 * Enum `aksi` yang tersedia:
 *   - open    → Kasir membuka shift baru dengan modal awal.
 *   - break   → Kasir memulai jeda sesi.
 *   - resume  → Kasir melanjutkan shift setelah jeda.
 *   - switch  → Pergantian operator kasir dalam shift yang sama.
 *   - closed  → Kasir menutup shift dengan rekonsiliasi uang.
 *
 * @property string          $id_log          UUID v4 sebagai primary key.
 * @property string          $id_shift        FK ke sesi shift yang bersangkutan.
 * @property string          $id_user         FK ke user yang melakukan aksi.
 * @property string          $aksi            Jenis aksi: open|break|resume|switch|closed.
 * @property \Carbon\Carbon  $waktu_kejadian  Timestamp tepat saat aksi terjadi.
 * @property string|null     $catatan         Catatan tambahan kontekstual.
 */
class ShiftOperatorLog extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.15 SDD) */
    protected $table = 'shift_operator_logs';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_log';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_shift',
        'id_user',
        'aksi',
        'waktu_kejadian',
        'catatan',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'waktu_kejadian' => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Log ini terkait dengan satu sesi shift tertentu.
     * [ShiftOperatorLog] >-- [ShiftSession]
     */
    public function shiftSession(): BelongsTo
    {
        return $this->belongsTo(ShiftSession::class, 'id_shift', 'id_shift');
    }

    /**
     * Log ini dicatat oleh user (kasir/admin) tertentu.
     * [ShiftOperatorLog] >-- [UserModel]
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }
}
