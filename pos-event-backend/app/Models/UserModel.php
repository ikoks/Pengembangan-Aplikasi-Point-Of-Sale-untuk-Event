<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model UserModel
 *
 * Merepresentasikan tabel `user` dalam sistem POS Event.
 * Model ini meng-extend Authenticatable agar dapat digunakan
 * oleh sistem autentikasi Laravel (Web Guard & API Sanctum).
 *
 * CATATAN PENAMAAN: Kelas ini dinamai `UserModel` (bukan `User`)
 * untuk menghindari konflik namespace dengan model User default Laravel
 * yang sudah ada di file `User.php`.
 *
 * @property string      $id_user       UUID v4 sebagai primary key.
 * @property string      $id_role       FK ke tabel role_user.
 * @property string|null $id_cabang     FK ke tabel cabang (nullable untuk Admin Pusat).
 * @property string      $username      Username unik untuk login.
 * @property string|null $password_hash Password bcrypt (NULL untuk kasir login-cepat).
 * @property string      $nama_user     Nama lengkap pengguna.
 * @property bool        $status_aktif  Status aktif/nonaktif akun.
 */
class UserModel extends Authenticatable
{
    use HasUuid, HasApiTokens, Notifiable;

    /** Nama tabel di database */
    protected $table = 'user';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_user';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_user',
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
    ];

    // =========================================================================
    // OVERRIDE KOLOM AUTENTIKASI LARAVEL
    // Karena kita menggunakan nama kolom non-standar (`password_hash`
    // bukan `password`), kita harus memberi tahu Laravel kolom mana
    // yang digunakan untuk verifikasi password.
    // =========================================================================

    /**
     * Mengembalikan nilai dari kolom password untuk proses hashing/verifikasi.
     * Diperlukan oleh Authenticatable contract Laravel.
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
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(RoleUser::class, 'id_role', 'id_role');
    }

    /**
     * User (kasir) terdaftar di satu cabang.
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }
}
