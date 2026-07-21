<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * KatalogResource
 *
 * Mentransformasikan payload katalog terpadu menjadi format JSON yang
 * dioptimalkan untuk diunduh oleh HP Kasir saat pembukaan shift.
 *
 * Satu kali download ini menyertakan SEMUA data yang dibutuhkan kasir
 * agar dapat beroperasi penuh secara offline:
 *   1. Informasi cabang + persentase pajak.
 *   2. Informasi sales mode aktif.
 *   3. Hierarki katalog menu: Kategori → SubKategori → Menu (+ harga regional).
 *   4. Daftar promosi aktif untuk cabang tersebut.
 *   5. Seluruh metode pembayaran yang tersedia.
 *
 * Desain Resource (Non-standar — wrap manual):
 * Resource ini tidak meng-extend model tunggal seperti resource lainnya,
 * melainkan bertugas sebagai "wrapper" untuk payload array yang sudah
 * disiapkan oleh KatalogController. Ini adalah pendekatan yang sah dan
 * semantik untuk resource yang bersifat agregat.
 *
 * Cara Penggunaan:
 *   return new KatalogResource($payloadArray);
 *   di mana $payloadArray berisi key: cabang, sales_mode, kategori, promosi, metode_pembayaran.
 */
class KatalogResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     * `$this->resource` adalah array payload yang disiapkan controller.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // ================================================================
            // INFORMASI CABANG
            // Digunakan HP kasir untuk: menampilkan nama venue, pajak struk.
            // ================================================================
            'cabang'             => $this->resource['cabang'],

            // ================================================================
            // INFORMASI SALES MODE AKTIF
            // Digunakan untuk: label kanal penjualan di struk & keranjang.
            // ================================================================
            'sales_mode'         => $this->resource['sales_mode'],

            // ================================================================
            // KATALOG MENU HIERARKIS (Kategori → SubKategori → Menu + Harga)
            // Sudah disertakan harga_produk spesifik per kombinasi cabang+sales.
            // ================================================================
            'kategori'           => $this->resource['kategori'],

            // ================================================================
            // DAFTAR PROMOSI AKTIF
            // Kasir dapat memilih promosi dari list ini saat membuat transaksi.
            // ================================================================
            'promosi'            => $this->resource['promosi'],

            // ================================================================
            // METODE PEMBAYARAN TERSEDIA
            // Kasir memilih dari daftar ini saat konfirmasi pembayaran.
            // ================================================================
            'metode_pembayaran'  => $this->resource['metode_pembayaran'],

            // Metadata download untuk keperluan cache invalidation di HP kasir
            'diunduh_pada'       => now()->toIso8601String(),
            'total_item_menu'    => $this->resource['total_item_menu'],
        ];
    }
}
