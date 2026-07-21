<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * DetailPembayaranResource
 *
 * Mentransformasikan model `DetailPembayaranNonTunai` menjadi format JSON
 * yang konsisten untuk response API payment endpoint.
 *
 * Digunakan pada:
 *   - POST /api/v1/payment/qris    → Response setelah generate QR sukses
 *   - GET  /api/v1/payment/status/{id} → Response polling status transaksi
 *
 * Field yang dikembalikan ke client (HP Kasir):
 *   - Data QR Code untuk dirender
 *   - Status terkini dari payment gateway
 *   - Waktu kadaluwarsa untuk countdown timer di UI
 *   - ID referensi untuk tracking/rekonsiliasi
 *
 * Field yang TIDAK dikembalikan (dirahasiakan dari client):
 *   - `raw_callback_payload` (audit internal saja)
 *
 * Tiket JIRA: POS-10A
 */
class DetailPembayaranResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON untuk response API.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // ================================================================
            // IDENTITAS RECORD PAYMENT
            // ================================================================
            'id_detail_bayar'     => $this->id_detail_bayar,
            'id_transaksi'        => $this->id_transaksi,

            // ================================================================
            // DATA PAYMENT GATEWAY
            // ================================================================

            // Transaction ID dari Midtrans (untuk tracking di dashboard Midtrans)
            'payment_gateway_id'  => $this->payment_gateway_id,

            // Nomor referensi dari acquirer/bank (nullable — muncul setelah settlement)
            'reference_number'    => $this->reference_number,

            // ================================================================
            // DATA QR CODE (utama yang dibutuhkan HP Kasir)
            // ================================================================

            // String / URL untuk render QR Code di layar kasir
            // Format: bisa berupa deep link (gojek://...) atau URL image QR
            'qr_string_data'      => $this->qr_string_data,

            // Nomor Virtual Account (untuk metode VA — null untuk QRIS)
            'va_number'           => $this->va_number,

            // ================================================================
            // STATUS & WAKTU
            // ================================================================

            // Status real-time dari Midtrans: PENDING | SETTLEMENT | EXPIRED | DENIED
            'status_api'          => $this->status_api,

            // Waktu kadaluwarsa QR Code dalam format ISO 8601 (untuk countdown timer UI)
            'waktu_kedaluwarsa'   => $this->waktu_kedaluwarsa?->toIso8601String(),

            // ================================================================
            // DATA TRANSAKSI INDUK (kondisional — tampil jika di-eager-load)
            // ================================================================
            'transaksi'           => $this->whenLoaded('transaksi', fn () => [
                'id_transaksi' => $this->transaksi->id_transaksi,
                'total'        => (float) $this->transaksi->total,
                'status'       => $this->transaksi->status,
            ]),

            // ================================================================
            // TIMESTAMPS
            // ================================================================
            'created_at'          => $this->created_at?->toIso8601String(),
            'updated_at'          => $this->updated_at?->toIso8601String(),
        ];
    }
}
