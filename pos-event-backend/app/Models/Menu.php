<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Menu
 *
 * Merepresentasikan tabel `menu` yang menyimpan daftar item
 * yang dapat dijual di setiap event (produk/makanan/minuman).
 *
 * Menggunakan SoftDeletes untuk menjaga integritas data historis transaksi:
 * item menu yang sudah dipesan di masa lalu tidak boleh dihapus permanen
 * agar laporan penjualan tetap akurat.
 *
 * @property string          $id_menu           UUID v4 sebagai primary key.
 * @property string          $id_sub_kategori   FK ke tabel sub_kategori.
 * @property string          $nama_menu         Nama item menu.
 * @property \Carbon\Carbon|null $deleted_at     Timestamp soft delete.
 */
class Menu extends Model
{
    use HasUuid, SoftDeletes;

    /** Nama tabel di database */
    protected $table = 'menu';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_menu';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_sub_kategori',
        'nama_menu',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Item menu tergabung dalam satu sub-kategori.
     * [Menu] >-- [SubKategori]
     */
    public function subKategori(): BelongsTo
    {
        return $this->belongsTo(SubKategori::class, 'id_sub_kategori', 'id_sub_kategori');
    }
}
