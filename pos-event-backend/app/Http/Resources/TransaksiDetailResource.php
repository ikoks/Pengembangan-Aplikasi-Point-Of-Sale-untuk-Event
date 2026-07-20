<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * TransaksiDetailResource
 *
 * Mentransformasikan objek model TransaksiDetail menjadi format JSON
 * yang seragam untuk setiap baris item dalam response transaksi.
 *
 * Catatan Desain:
 *   `harga_produk` adalah nilai snapshot harga saat transaksi terjadi,
 *   bukan harga live dari tabel menu_template. Ini menjamin integritas
 *   data historis laporan keuangan.
 */
class TransaksiDetailResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_transaksi_detail' => $this->id_transaksi_detail,
            'id_produk'           => $this->id_produk,

            // Nama menu diambil dari relasi jika sudah di-eager-load
            'nama_menu'           => $this->whenLoaded('menu', fn () => $this->menu->nama_menu),

            // Harga snapshot saat transaksi (immutable, bukan harga live)
            'harga_produk'        => (float) $this->harga_produk,
            'quantity'            => (int) $this->quantity,

            // Data promosi per item (kondisional)
            'id_promo'            => $this->id_promo,
            'nama_promo'          => $this->whenLoaded('promosi', fn () => $this->promosi?->nama_promo),
            'nominal_promo'       => (float) $this->nominal_promo,

            // Subtotal sudah memperhitungkan promo dan quantity
            'subtotal_item'       => (float) $this->subtotal_item,

            'status_item'         => $this->status_item,
            'alasan_batal_item'   => $this->alasan_batal_item,
        ];
    }
}
