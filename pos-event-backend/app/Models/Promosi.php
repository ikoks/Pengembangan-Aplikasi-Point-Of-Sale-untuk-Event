<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Promosi
 *
 * Merepresentasikan tabel `promosi` yang menyimpan data diskon dan
 * promosi yang berlaku per cabang dalam sistem POS Event.
 *
 * Tipe Promosi:
 *   - 'Nominal' → Potongan harga dalam Rupiah (contoh: Diskon Rp 10.000)
 *   - 'Persen'  → Potongan harga dalam persentase (contoh: Diskon 10%)
 *
 * Cakupan Promosi:
 *   - 'per_transaksi' → Berlaku untuk total keseluruhan transaksi
 *   - 'per_item'      → Berlaku untuk setiap item tertentu dalam keranjang
 *   - 'free_item'     → Memberikan item gratis (referensi ke `id_menu_free`)
 *
 * @property string      $id_promo         UUID v4 sebagai primary key.
 * @property string      $id_cabang        FK ke tabel cabang.
 * @property string      $nama_promo       Nama promosi yang tampil di UI.
 * @property string      $tipe_promo       Nominal | Persen.
 * @property string      $cakupan_promo    per_transaksi | per_item | free_item.
 * @property float|null  $nilai_promo      Nilai nominal atau persentase diskon.
 * @property string|null $id_menu_free     FK ke menu yang diberikan gratis (nullable).
 */
class Promosi extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.9 SDD) */
    protected $table = 'promosi';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_promo';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_cabang',
        'nama_promo',
        'tipe_promo',
        'cakupan_promo',
        'nilai_promo',
        'id_menu_free',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'nilai_promo' => 'decimal:2',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Promosi ini berlaku di satu cabang tertentu.
     * [Promosi] >-- [Cabang]
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Item menu yang diberikan gratis (hanya untuk cakupan 'free_item').
     * [Promosi] >-- [Menu]
     */
    public function menuFree(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'id_menu_free', 'id_menu');
    }

    /**
     * Transaksi yang menggunakan promosi ini di level transaksi utama.
     * [Promosi] 1 --< [Transaksi]
     */
    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_promo', 'id_promo');
    }

    /**
     * Transaksi detail (item) yang menggunakan promosi ini di level per item.
     * [Promosi] 1 --< [TransaksiDetail]
     */
    public function transaksiDetails(): HasMany
    {
        return $this->hasMany(TransaksiDetail::class, 'id_promo', 'id_promo');
    }
}
