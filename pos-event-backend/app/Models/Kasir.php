<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Kasir extends Authenticatable
{
    use HasApiTokens, HasUuid, Notifiable;

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
}
