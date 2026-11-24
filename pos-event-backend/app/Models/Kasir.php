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
     * Cek apakah kasir saat ini benar-benar sedang ONLINE dan terhubung:
     * - Akun aktif (status_aktif = true)
     * - Memiliki token autentikasi Sanctum yang aktif dan mengirimkan heartbeat / aktivitas
     *   dalam toleransi waktu maksimal 2 menit (120 detik) terakhir.
     */
    public function getIsOnlineAttribute(): bool
    {
        if (! $this->status_aktif) {
            return false;
        }

        $cutoff = now()->subMinutes(2);

        return $this->tokens()
            ->where(function ($q) use ($cutoff) {
                $q->where('last_used_at', '>=', $cutoff)
                  ->orWhere(function ($q2) use ($cutoff) {
                      $q2->whereNull('last_used_at')
                         ->where('created_at', '>=', $cutoff);
                  });
            })
            ->exists();
    }

    /**
     * Menentukan status sesi POS / shift kasir secara akurat dan real-time:
     * - 'ONLINE'     : Sedang terhubung online DAN bertugas sebagai operator aktif melayani transaksi (status_shift = OPEN)
     * - 'ISTIRAHAT'  : Sedang terhubung online DAN dalam masa jeda istirahat (status_shift = ON_BREAK)
     * - 'OFF_SWITCH' : Sedang terhubung online namun operasional diserahkan ke kasir pengganti
     * - 'STANDBY'    : Terhubung online (login aktif) tetapi belum membuka shift
     * - 'OFFLINE'    : Aplikasi ditutup, terputus dari jaringan, logout, atau shift sudah ditutup
     */
    public function getSesiPosStatusAttribute(): string
    {
        // 1. Jika kasir tidak terhubung online (heartbeat > 2 menit lalu atau tanpa token aktif),
        // status kasir dipastikan OFFLINE.
        if (! $this->is_online) {
            return 'OFFLINE';
        }

        // 2. Jika kasir online, cek sesi shift aktif dalam 24 jam terakhir
        $cutoff24h = now()->subHours(24);

        $activeShift = ShiftSession::where(function ($query) {
                $query->where('id_kasir_aktif', $this->id_kasir)
                      ->orWhere('id_kasir', $this->id_kasir);
            })
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->where('waktu_mulai', '>=', $cutoff24h)
            ->latest('waktu_mulai')
            ->first();

        if (! $activeShift) {
            return 'STANDBY';
        }

        if ($activeShift->status_shift === 'ON_BREAK') {
            return 'ISTIRAHAT';
        }

        if ($activeShift->id_kasir_aktif === $this->id_kasir) {
            return 'ONLINE';
        }

        return 'OFF_SWITCH';
    }
}
