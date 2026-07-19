<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Kategori
 *
 * Merepresentasikan tabel `kategori` yang menyimpan
 * kategori utama dari item menu (contoh: Makanan, Minuman, Dessert).
 *
 * Menggunakan SoftDeletes agar relasi ke sub_kategori dan menu yang
 * mengacu pada kategori ini tetap konsisten secara historis.
 *
 * @property string          $id_kategori    UUID v4 sebagai primary key.
 * @property string          $nama_kategori  Nama kategori menu.
 * @property \Carbon\Carbon|null $deleted_at  Timestamp soft delete.
 */
class Kategori extends Model
{
    use HasUuid, SoftDeletes;

    /** Nama tabel di database */
    protected $table = 'kategori';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_kategori';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal (id dikecualikan, diisi oleh HasUuid) */
    protected $fillable = [
        'nama_kategori',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu kategori memiliki banyak sub-kategori.
     * [Kategori] 1 --< [SubKategori]
     */
    public function subKategoris(): HasMany
    {
        return $this->hasMany(SubKategori::class, 'id_kategori', 'id_kategori');
    }
}
