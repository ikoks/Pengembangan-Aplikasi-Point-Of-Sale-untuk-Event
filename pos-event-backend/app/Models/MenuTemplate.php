<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model MenuTemplate
 *
 * Merepresentasikan tabel `menu_template` yang menyimpan
 * konfigurasi harga produk per kombinasi Menu × Cabang × Sales Mode.
 *
 * Tabel ini adalah "jembatan harga regional" — item menu yang sama
 * bisa memiliki harga berbeda di cabang berbeda atau kanal penjualan berbeda.
 * Contoh: Nasi Goreng di JCC (Offline) = Rp 25.000, di JCC (GoFood) = Rp 28.000.
 *
 * Kombinasi (id_menu + id_cabang + id_sales) harus UNIK.
 * Constraint ini dijaga di level Form Request Validation.
 *
 * @property string $id_template  UUID v4 sebagai primary key.
 * @property string $id_menu      FK ke tabel menu.
 * @property string $id_cabang    FK ke tabel cabang.
 * @property string $id_sales     FK ke tabel sales_mode.
 * @property float  $harga_produk Harga produk dalam Rupiah (DECIMAL 12,2).
 */
class MenuTemplate extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.8 SDD) */
    protected $table = 'menu_template';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_template';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_menu',
        'id_cabang',
        'id_sales',
        'harga_produk',
    ];

    /** Casting tipe data kolom untuk konsistensi tipe PHP */
    protected $casts = [
        'harga_produk' => 'decimal:2',
    ];

    // =========================================================================
    // RELASI — Dua Arah (Bidirectional)
    // =========================================================================

    /**
     * Konfigurasi harga ini merujuk ke satu item menu tertentu.
     * [MenuTemplate] >-- [Menu]
     */
    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'id_menu', 'id_menu');
    }

    /**
     * Konfigurasi harga ini berlaku untuk satu cabang tertentu.
     * [MenuTemplate] >-- [Cabang]
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Konfigurasi harga ini berlaku untuk satu sales mode tertentu.
     * [MenuTemplate] >-- [SalesMode]
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }
}
