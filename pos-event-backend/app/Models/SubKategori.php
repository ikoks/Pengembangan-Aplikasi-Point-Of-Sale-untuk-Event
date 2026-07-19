<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model SubKategori
 *
 * Merepresentasikan tabel `sub_kategori` yang menyimpan sub-kategori
 * dari setiap kategori menu (contoh: Kategori "Minuman" → Sub "Kopi Panas", "Jus Segar").
 *
 * Menggunakan SoftDeletes agar relasi ke menu dan data transaksi historis
 * tetap konsisten meski sub-kategori ini sudah "dihapus".
 *
 * @property string          $id_sub_kategori    UUID v4 sebagai primary key.
 * @property string          $id_kategori        FK ke tabel kategori.
 * @property string          $nama_sub_kategori  Nama sub-kategori.
 * @property \Carbon\Carbon|null $deleted_at      Timestamp soft delete.
 */
class SubKategori extends Model
{
    use HasUuid, SoftDeletes;

    /** Nama tabel di database */
    protected $table = 'sub_kategori';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_sub_kategori';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_kategori',
        'nama_sub_kategori',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Sub-kategori dimiliki oleh satu kategori induk.
     * [SubKategori] >-- [Kategori]
     */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class, 'id_kategori', 'id_kategori');
    }

    /**
     * Satu sub-kategori dapat memiliki banyak item menu.
     * [SubKategori] 1 --< [Menu]
     */
    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class, 'id_sub_kategori', 'id_sub_kategori');
    }
}
