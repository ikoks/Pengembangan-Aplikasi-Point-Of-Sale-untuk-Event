<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model MenuTemplate
 *
 * Merepresentasikan tabel `menu_template` yang menyimpan
 * konfigurasi harga produk per kombinasi Menu × Sales Mode.
 *
 * [Poin 2] Harga kini bersifat GLOBAL — tidak lagi per cabang.
 * Satu menu memiliki harga yang sama di semua cabang, berbeda hanya
 * berdasarkan Sales Mode (mis: Offline vs GoFood vs GrabFood).
 *
 * Kombinasi (id_menu + id_sales) harus UNIK.
 *
 * @property string $id_template  UUID v4 sebagai primary key.
 * @property string $id_menu      FK ke tabel menu.
 * @property string $id_sales     FK ke tabel sales_mode.
 * @property float  $harga_produk Harga produk dalam Rupiah (DECIMAL 12,2).
 */
class MenuTemplate extends Model
{
    use HasUuid;

    /** Nama tabel di database */
    protected $table = 'menu_template';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_template';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /**
     * Kolom yang boleh diisi secara massal.
     * [Poin 2] id_cabang DIHAPUS — harga kini global (tidak per cabang).
     */
    protected $fillable = [
        'id_menu',
        'id_sales',
        'harga_produk',
    ];

    /** Casting tipe data kolom untuk konsistensi tipe PHP */
    protected $casts = [
        'harga_produk' => 'decimal:2',
    ];

    // =========================================================================
    // RELASI
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
     * Konfigurasi harga ini berlaku untuk satu sales mode tertentu.
     * [MenuTemplate] >-- [SalesMode]
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }
}
