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
 * @property string|null $tanggal_mulai    Tanggal promosi mulai berlaku.
 * @property string|null $tanggal_selesai  Tanggal promosi berakhir.
 * @property float|null  $nilai_promo      Nilai nominal atau persentase diskon.
 * @property float       $min_pembelian    Minimal pembelian transaksi.
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
    public $timestamps    = false;

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_cabang',
        'id_sales',
        'nama_promo',
        'tipe_promo',
        'cakupan_promo',
        'tanggal_mulai',
        'tanggal_selesai',
        'waktu_mulai',
        'waktu_selesai',
        'hari_aktif',
        'nilai_promo',
        'min_pembelian',
        'syarat_menu',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'nilai_promo'   => 'decimal:2',
        'min_pembelian' => 'decimal:2',
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'waktu_mulai'   => 'datetime:H:i',
        'waktu_selesai' => 'datetime:H:i',
        'hari_aktif'    => 'array',
        'syarat_menu'   => 'array',
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
     * Promosi ini berlaku di satu mode penjualan tertentu.
     * [Promosi] >-- [SalesMode]
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }

    /**
     * Mengambil koleksi model Menu berdasarkan array UUID di syarat_menu.
     */
    public function getMenusAttribute()
    {
        if (empty($this->syarat_menu)) return collect();
        return Menu::whereIn('id_menu', $this->syarat_menu)->get();
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
