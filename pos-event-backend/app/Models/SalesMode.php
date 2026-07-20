<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model SalesMode
 *
 * Merepresentasikan tabel `sales_mode` yang menyimpan daftar
 * jalur/kanal penjualan yang tersedia dalam sistem POS Event.
 *
 * Contoh data: Offline (booth langsung), GoFood, Tokopedia.
 * Setiap kanal dapat memiliki struktur harga yang berbeda
 * per cabang melalui tabel `menu_template`.
 *
 * @property string $id_sales   UUID v4 sebagai primary key.
 * @property string $nama_mode  Nama mode penjualan (maks. 50 karakter).
 */
class SalesMode extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.7 SDD) */
    protected $table = 'sales_mode';

    /** Primary key menggunakan UUID string, bukan auto-increment */
    protected $primaryKey = 'id_sales';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'nama_mode',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu sales mode dapat memiliki banyak konfigurasi harga template menu.
     * [SalesMode] 1 --< [MenuTemplate]
     */
    public function menuTemplates(): HasMany
    {
        return $this->hasMany(MenuTemplate::class, 'id_sales', 'id_sales');
    }

    /**
     * Satu sales mode dapat memiliki banyak sesi shift kasir.
     * [SalesMode] 1 --< [ShiftSession]
     */
    public function shiftSessions(): HasMany
    {
        return $this->hasMany(ShiftSession::class, 'id_sales', 'id_sales');
    }
}
