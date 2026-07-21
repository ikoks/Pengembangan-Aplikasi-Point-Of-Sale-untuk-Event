<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model DetailPembayaranNonTunai
 *
 * Merepresentasikan tabel `detail_pembayaran_non_tunai` (Tabel 4.13 SDD).
 * Model ini menyimpan seluruh data teknis transaksi non-tunai yang diproses
 * melalui payment gateway Midtrans, termasuk QR string QRIS dinamis, nomor
 * referensi, status API real-time, dan raw payload callback webhook.
 *
 * Satu record di tabel ini berhubungan 1-ke-1 dengan satu record Transaksi.
 * Status `status_api` diperbarui secara otomatis melalui Webhook Midtrans.
 *
 * Siklus Status (status_api):
 *   PENDING    → QR sudah di-generate, menunggu konfirmasi pembayaran dari customer
 *   SETTLEMENT → Pembayaran berhasil dikonfirmasi Midtrans (trigger → Transaksi 'Success')
 *   EXPIRED    → QR Code melewati waktu kadaluwarsa (trigger → Transaksi 'Cancelled')
 *   DENIED     → Pembayaran ditolak/dibatalkan (trigger → Transaksi 'Cancelled')
 *
 * Referensi: SDD Tabel 4.13, SRS Bab 4.3, Tiket JIRA POS-10A & POS-11
 *
 * @property string          $id_detail_bayar       UUID v4 sebagai primary key.
 * @property string          $id_transaksi           FK ke tabel transaksi.
 * @property string          $payment_gateway_id     Transaction ID dari Midtrans (unik).
 * @property string|null     $reference_number       Nomor referensi bank/acquirer (nullable).
 * @property string|null     $qr_string_data         QR string / URL untuk render QR Code QRIS.
 * @property string|null     $va_number              Nomor Virtual Account (untuk metode VA).
 * @property string          $status_api             Status dari Midtrans: PENDING|SETTLEMENT|EXPIRED|DENIED.
 * @property string          $waktu_kedaluwarsa      Batas waktu QR Code dapat dibayar (DATETIME).
 * @property array|null      $raw_callback_payload   Payload JSON mentah dari webhook Midtrans.
 */
class DetailPembayaranNonTunai extends Model
{
    use HasUuid;

    /**
     * Nama tabel database sesuai SDD Tabel 4.13.
     */
    protected $table = 'detail_pembayaran_non_tunai';

    /**
     * Primary key menggunakan UUID v4 CHAR(36).
     */
    protected $primaryKey = 'id_detail_bayar';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /**
     * Kolom yang boleh diisi secara massal (mass assignment).
     * Memuat semua kolom data teknis payment gateway.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_detail_bayar',      // Bisa diisi manual jika diperlukan
        'id_transaksi',         // FK ke tabel transaksi
        'payment_gateway_id',   // Transaction ID dari Midtrans (unik per charge)
        'reference_number',     // Nomor referensi dari acquirer (nullable)
        'qr_string_data',       // QR string / URL untuk generate QR Code di HP kasir
        'va_number',            // Nomor Virtual Account (untuk metode VA, nullable)
        'status_api',           // Status real-time dari Midtrans
        'waktu_kedaluwarsa',    // Timestamp batas waktu pembayaran
        'raw_callback_payload', // Payload mentah webhook Midtrans (untuk audit)
    ];

    /**
     * Casting tipe data kolom untuk konsistensi tipe PHP.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'raw_callback_payload' => 'array',    // JSON → array asosiatif PHP
        'waktu_kedaluwarsa'    => 'datetime', // String DB → Carbon instance
    ];

    // =========================================================================
    // RELASI ELOQUENT — Sesuai SDD Tabel 4.13
    // =========================================================================

    /**
     * Transaksi induk yang memiliki record pembayaran non-tunai ini.
     *
     * Relasi: [DetailPembayaranNonTunai] >-- [Transaksi]
     * One detail_pembayaran_non_tunai belongs to one Transaksi.
     */
    public function transaksi(): BelongsTo
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi', 'id_transaksi');
    }
}
