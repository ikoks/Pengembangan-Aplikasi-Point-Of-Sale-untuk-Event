<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * TransaksiResource
 *
 * Mentransformasikan objek model Transaksi menjadi format JSON seragam
 * untuk response API checkout dan manajemen transaksi.
 *
 * Resource ini menggabungkan:
 *   - Data header transaksi (finansial & status)
 *   - Data relasi kondisional (cabang, sales_mode, kasir, metode, promosi)
 *   - Koleksi item detail via TransaksiDetailResource
 */
class TransaksiResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // ================================================================
            // IDENTITAS & WAKTU TRANSAKSI
            // ================================================================
            'id_transaksi'      => $this->id_transaksi,
            'tanggal_transaksi' => $this->tanggal_transaksi,
            'jam_transaksi'     => $this->jam_transaksi,
            'nama_pelanggan'    => $this->nama_pelanggan,

            // ================================================================
            // DATA FINANSIAL
            // ================================================================
            'nominal_promo'     => (float) $this->nominal_promo,
            'tax'               => (float) $this->tax,
            'total'             => (float) $this->total,
            'status'            => $this->status,
            'alasan_batal'      => $this->alasan_batal,
            'catatan_koreksi'   => $this->catatan_koreksi,

            // ================================================================
            // DATA RELASI (kondisional — tampil hanya jika di-eager-load)
            // ================================================================

            // Cabang tempat transaksi terjadi
            'cabang'            => $this->whenLoaded('cabang', fn () => [
                'id_cabang'    => $this->cabang->id_cabang,
                'nama_cabang'  => $this->cabang->nama_cabang,
                'pajak_persen' => (float) $this->cabang->pajak_persen,
            ]),

            // Kanal penjualan yang digunakan
            'sales_mode'        => $this->whenLoaded('salesMode', fn () => [
                'id_sales'  => $this->salesMode->id_sales,
                'nama_mode' => $this->salesMode->nama_mode,
            ]),

            // Metode pembayaran yang dipilih
            'metode_pembayaran' => $this->whenLoaded('metodePembayaran', fn () => [
                'id_metode'       => $this->metodePembayaran->id_metode,
                'nama_metode'     => $this->metodePembayaran->nama_metode,
                'kategori_metode' => $this->metodePembayaran->kategori_metode,
            ]),

            // Kasir yang membuat transaksi
            'kasir'             => $this->whenLoaded('kasir', fn () => [
                'id_user'   => $this->kasir->id_user,
                'nama_user' => $this->kasir->nama_user,
                'username'  => $this->kasir->username,
            ]),

            // Promosi level transaksi (jika ada)
            'promosi'           => $this->whenLoaded('promosi', fn () => $this->promosi ? [
                'id_promo'   => $this->promosi->id_promo,
                'nama_promo' => $this->promosi->nama_promo,
                'tipe_promo' => $this->promosi->tipe_promo,
            ] : null),

            'detail_pembayaran_non_tunai' => $this->whenLoaded('detailPembayaranNonTunai', fn () => $this->detailPembayaranNonTunai ? [
                'payment_gateway_id' => $this->detailPembayaranNonTunai->payment_gateway_id,
                'reference_number'   => $this->detailPembayaranNonTunai->reference_number,
                'va_number'          => $this->detailPembayaranNonTunai->va_number,
                'status_api'         => $this->detailPembayaranNonTunai->status_api,
                'waktu_kedaluwarsa'  => $this->detailPembayaranNonTunai->waktu_kedaluwarsa?->toIso8601String(),
            ] : null),

            // ================================================================
            // KOLEKSI ITEM DETAIL
            // Menggunakan TransaksiDetailResource untuk konsistensi format
            // ================================================================
            'items'             => TransaksiDetailResource::collection(
                $this->whenLoaded('details')
            ),

            'created_at'        => $this->created_at?->toIso8601String(),
            'updated_at'        => $this->updated_at?->toIso8601String(),
        ];
    }
}
