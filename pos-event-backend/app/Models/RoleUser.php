<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model RoleUser
 *
 * Merepresentasikan tabel `role_user` yang menyimpan
 * daftar peran pengguna dalam sistem (contoh: Admin, Kasir).
 *
 * @property string $id_role   UUID v4 sebagai primary key.
 * @property string $nama_role Nama peran (contoh: 'Admin', 'Kasir').
 */
class RoleUser extends Model
{
    use HasUuid;

    /** Nama tabel di database (non-plural, sesuai skema) */
    protected $table = 'role_user';

    /** Primary key menggunakan UUID string, bukan integer auto-increment */
    protected $primaryKey = 'id_role';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal (mass assignment) */
    protected $fillable = [
        'id_role',
        'nama_role',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu role dapat dimiliki oleh banyak user.
     */
    public function users(): HasMany
    {
        return $this->hasMany(UserModel::class, 'id_role', 'id_role');
    }
}
