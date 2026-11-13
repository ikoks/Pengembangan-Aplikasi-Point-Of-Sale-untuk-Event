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

    public function getIsOnlineAttribute(): bool
    {
        // 1. Sedang ada shift aktif (OPEN atau ON_BREAK) dalam 24 jam terakhir
        $hasActiveShift = $this->shiftSessions()
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->where('waktu_mulai', '>=', now()->subHours(24))
            ->exists();

        if ($hasActiveShift) {
            return true;
        }

        // 2. Memiliki token mobile aktif yang baru dibuat/dipakai dalam 2 jam terakhir
        return $this->tokens()
            ->where('name', 'kasir-mobile-token')
            ->where(function ($query) {
                $query->where('last_used_at', '>=', now()->subHours(2))
                      ->orWhere(function ($q) {
                          $q->whereNull('last_used_at')
                            ->where('created_at', '>=', now()->subHours(2));
                      });
            })
            ->exists();
    }
}
