<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model TransaksiDetail
 *
 * Merepresentasikan tabel `transaksi_detail` yang menyimpan setiap
 * baris item dalam sebuah transaksi penjualan (keranjang belanja).
 *
 * Setiap baris detail merekam snapshot harga pada saat transaksi terjadi
 * (disimpan di `harga_produk`) sehingga perubahan harga menu di masa depan
 * tidak mengubah nilai historis transaksi yang sudah terjadi.
 *
 * Status Item:
 *   - 'Active' → Item masih aktif dalam transaksi.
 *   - 'Void'   → Item dibatalkan oleh kasir (dengan alasan), transaksi header tetap ada.
 *
 * @property string      $id_transaksi_detail  UUID v4 sebagai primary key.
 * @property string      $id_transaksi         FK ke tabel transaksi induk.
 * @property string      $id_produk            FK ke tabel menu (id_menu).
 * @property float       $harga_produk         Snapshot harga saat transaksi (bukan harga live).
 * @property int         $quantity             Jumlah item yang dipesan.
 * @property string|null $id_promo             FK ke promosi level item (nullable).
 * @property float       $nominal_promo        Nilai potongan promo untuk item ini (default 0).
 * @property float       $subtotal_item        Subtotal = (harga * qty) - nominal_promo.
 * @property string      $status_item          Active | Void.
 * @property string|null $alasan_batal_item    Alasan pembatalan item (untuk Void).
 */
class TransaksiDetail extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.12 SDD) */
    protected $table = 'transaksi_detail';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_transaksi_detail';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_transaksi',
        'id_produk',
        'harga_produk',
        'quantity',
        'id_promo',
        'nominal_promo',
        'subtotal_item',
        'status_item',
        'alasan_batal_item',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'harga_produk'  => 'decimal:2',
        'nominal_promo' => 'decimal:2',
        'subtotal_item' => 'decimal:2',
        'quantity'      => 'integer',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Detail item ini tergabung dalam satu transaksi induk.
     * [TransaksiDetail] >-- [Transaksi]
     */
    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }

    /**
     * Produk/menu yang dipesan dalam baris item ini.
     * FK kolom `id_produk` merujuk ke kolom `id_menu` di tabel `menu`.
     * [TransaksiDetail] >-- [Menu]
     */
    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'id_produk', 'id_menu');
    }

    /**
     * Promosi level item yang diterapkan (nullable).
     * [TransaksiDetail] >-- [Promosi]
     */
    public function promosi(): BelongsTo
    {
        return $this->belongsTo(Promosi::class, 'id_promo', 'id_promo');
    }
}
