<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model UserModel
 *
 * Merepresentasikan tabel `user` dalam sistem POS Event.
 * Model ini meng-extend Authenticatable agar dapat digunakan oleh
 * sistem autentikasi Laravel (Web Guard & API via Sanctum).
 *
 * Menggunakan SoftDeletes: akun yang dihapus tidak hilang permanen,
 * sehingga relasi ke audit_log dan transaksi historis tetap utuh.
 *
 * CATATAN PENAMAAN: Dinamai `UserModel` (bukan `User`) untuk menghindari
 * konflik namespace dengan model bawaan Laravel di file `User.php`.
 *
 * @property string          $id_user       UUID v4 sebagai primary key.
 * @property string          $id_role       FK ke tabel role_user.
 * @property string|null     $id_cabang     FK ke tabel cabang (nullable untuk Admin Pusat).
 * @property string          $username      Username unik untuk login.
 * @property string|null     $password_hash Password bcrypt (NULL untuk kasir login-cepat).
 * @property string          $nama_user     Nama lengkap pengguna.
 * @property bool            $status_aktif  Status aktif/nonaktif akun.
 * @property \Carbon\Carbon|null $deleted_at Timestamp soft delete.
 */
class UserModel extends Authenticatable
{
    use HasUuid, HasApiTokens, Notifiable, SoftDeletes;

    /** Nama tabel di database */
    protected $table = 'user';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_user';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_role',
        'id_cabang',
        'username',
        'password_hash',
        'nama_user',
        'status_aktif',
    ];

    /**
     * Kolom yang disembunyikan saat model di-serialize ke JSON/array.
     * Pastikan `password_hash` tidak pernah bocor ke response API.
     */
    protected $hidden = [
        'password_hash',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'status_aktif' => 'boolean',
        'deleted_at'   => 'datetime',
    ];

    // =========================================================================
    // OVERRIDE KOLOM AUTENTIKASI LARAVEL
    // Kolom password di database bernama `password_hash` (non-standar),
    // sehingga kita harus memberi tahu Laravel cara mengambil nilainya.
    // =========================================================================

    /**
     * Mengembalikan nilai kolom password untuk verifikasi hash.
     * Diperlukan oleh kontrak Authenticatable Laravel.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash ?? '';
    }

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * User dimiliki oleh satu role.
     * [UserModel] >-- [RoleUser]
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUser::class, 'id_role', 'id_role');
    }

    /**
     * User (kasir) terdaftar di satu cabang.
     * [UserModel] >-- [Cabang]
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }
}
