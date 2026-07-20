<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model MetodePembayaran
 *
 * Merepresentasikan tabel `metode_pembayaran` yang menyimpan daftar
 * kanal/instrumen pembayaran yang tersedia dalam sistem POS Event.
 *
 * Kategori metode yang didukung:
 *   - 'Tunai'  → Pembayaran uang fisik (Cash)
 *   - 'QRIS'   → QR Code Indonesia Standard (Midtrans / direct)
 *   - 'VA'     → Virtual Account Bank (Midtrans)
 *   - 'EDC'    → Mesin gesek kartu debit/kredit
 *
 * @property string      $id_metode        UUID v4 sebagai primary key.
 * @property string      $nama_metode      Nama tampilan metode (contoh: 'QRIS Dynamic').
 * @property string      $kategori_metode  Kategori: Tunai | QRIS | VA | EDC.
 * @property string|null $vendor_gateway   Nama payment gateway (contoh: 'Midtrans') atau NULL untuk tunai.
 */
class MetodePembayaran extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.10 SDD) */
    protected $table = 'metode_pembayaran';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_metode';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'nama_metode',
        'kategori_metode',
        'vendor_gateway',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu metode pembayaran dapat digunakan di banyak transaksi.
     * [MetodePembayaran] 1 --< [Transaksi]
     */
    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_metode', 'id_metode');
    }
}
