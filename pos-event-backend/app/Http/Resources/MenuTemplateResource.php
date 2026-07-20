<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MenuTemplateResource
 *
 * Mentransformasikan objek model MenuTemplate menjadi format JSON
 * yang seragam untuk semua response API terkait konfigurasi harga regional.
 *
 * Relasi menu, cabang, dan salesMode ditampilkan secara kondisional
 * (hanya jika sudah di-eager-load) untuk fleksibilitas penggunaan.
 */
class MenuTemplateResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_template'  => $this->id_template,
            'id_menu'      => $this->id_menu,
            'id_cabang'    => $this->id_cabang,
            'id_sales'     => $this->id_sales,
            'harga_produk' => (float) $this->harga_produk,

            // Sertakan data menu lengkap jika relasi sudah di-load
            'menu'         => $this->whenLoaded('menu', fn () => [
                'id_menu'           => $this->menu->id_menu,
                'nama_menu'         => $this->menu->nama_menu,
                // Sertakan sub-kategori jika ikut di-load (nested eager)
                'sub_kategori'      => $this->menu->relationLoaded('subKategori') ? [
                    'id_sub_kategori'   => $this->menu->subKategori->id_sub_kategori,
                    'nama_sub_kategori' => $this->menu->subKategori->nama_sub_kategori,
                ] : null,
            ]),

            // Sertakan data cabang jika relasi sudah di-load
            'cabang'       => $this->whenLoaded('cabang', fn () => [
                'id_cabang'    => $this->cabang->id_cabang,
                'nama_cabang'  => $this->cabang->nama_cabang,
                'pajak_persen' => (float) $this->cabang->pajak_persen,
            ]),

            // Sertakan data sales mode jika relasi sudah di-load
            'sales_mode'   => $this->whenLoaded('salesMode', fn () => [
                'id_sales'  => $this->salesMode->id_sales,
                'nama_mode' => $this->salesMode->nama_mode,
            ]),

            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
