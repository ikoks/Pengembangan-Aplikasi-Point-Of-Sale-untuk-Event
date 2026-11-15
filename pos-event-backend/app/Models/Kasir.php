<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Kasir extends Authenticatable
{
    use HasApiTokens, HasUuid, Notifiable, SoftDeletes;

    protected $table = 'kasirs';
    protected $primaryKey = 'id_kasir';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_role',
        'id_cabang',
        'username',
        'pin',
        'nama_kasir',
        'status_aktif',
    ];

    protected $hidden = [
        'pin',
    ];

    protected $casts = [
        'status_aktif' => 'boolean',
        'deleted_at'   => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->pin; // Kasir uses PIN instead of password
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUser::class, 'id_role', 'id_role');
    }

    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    public function shiftSessions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ShiftSession::class, 'id_kasir', 'id_kasir');
    }

    public function activeShiftSessions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ShiftSession::class, 'id_kasir_aktif', 'id_kasir');
    }

    /**
     * Menentukan status sesi POS / shift kasir secara akurat:
     * - 'ONLINE'     : Sedang bertugas sebagai operator aktif melayani transaksi (status_shift = OPEN)
     * - 'ISTIRAHAT'  : Kasir sedang dalam masa jeda istirahat (status_shift = ON_BREAK)
     * - 'OFF_SWITCH' : Kasir telah menyerahkan giliran shift ke kasir pengganti (Kasir ini sedang OFF)
     * - 'OFFLINE'    : Tidak ada shift aktif (belum buka shift atau sudah tutup shift)
     */
    public function getSesiPosStatusAttribute(): string
    {
        // 1. Cek apakah kasir ini sedang menjadi operator aktif pada shift yang statusnya OPEN
        $isActiveOperator = ShiftSession::where('id_kasir_aktif', $this->id_kasir)
            ->where('status_shift', 'OPEN')
            ->exists();

        if ($isActiveOperator) {
            return 'ONLINE';
        }

        // 2. Cek apakah kasir ini terkait dengan shift yang sedang ON_BREAK (Istirahat)
        $isOnBreak = ShiftSession::where(function ($query) {
                $query->where('id_kasir', $this->id_kasir)
                      ->orWhere('id_kasir_aktif', $this->id_kasir);
            })
            ->where('status_shift', 'ON_BREAK')
            ->where('waktu_mulai', '>=', now()->subHours(24))
            ->exists();

        if ($isOnBreak) {
            return 'ISTIRAHAT';
        }

        // 3. Cek apakah kasir ini adalah pemilik shift, namun operator aktifnya sudah
        // dialihkan ke kasir lain (Pergantian Shift). Kasir ini statusnya OFF (berganti shift).
        $isHandedOver = ShiftSession::where('id_kasir', $this->id_kasir)
            ->where('status_shift', 'OPEN')
            ->whereNotNull('id_kasir_aktif')
            ->where('id_kasir_aktif', '!=', $this->id_kasir)
            ->where('waktu_mulai', '>=', now()->subHours(24))
            ->exists();

        if ($isHandedOver) {
            return 'OFF_SWITCH';
        }

        // 4. Default: OFFLINE (Shift CLOSED atau belum buka shift)
        return 'OFFLINE';
    }

    /**
     * Kasir hanya dihitung "online/aktif" jika benar-benar sedang bertugas melayani transaksi (OPEN).
     * Saat istirahat, berganti shift, atau tutup shift, nilainya adalah false.
     */
    public function getIsOnlineAttribute(): bool
    {
        return $this->sesi_pos_status === 'ONLINE';
    }
}
