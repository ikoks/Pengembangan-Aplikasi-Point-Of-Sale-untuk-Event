<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * MenuResource
 *
 * Mentransformasikan objek model Menu menjadi format JSON seragam.
 * Relasi sub-kategori (beserta kategori induknya) disertakan kondisional.
 */
class MenuResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_menu'         => $this->id_menu,
            'id_sub_kategori' => $this->id_sub_kategori,
            'nama_menu'       => $this->nama_menu,
            // Sertakan data sub-kategori induk hanya jika relasi sudah di-load
            'sub_kategori'    => $this->whenLoaded('subKategori', fn () => [
                'id_sub_kategori'   => $this->subKategori->id_sub_kategori,
                'nama_sub_kategori' => $this->subKategori->nama_sub_kategori,
                // Sertakan data kategori induk jika sub-kategori relasi juga di-load
                'kategori'          => $this->subKategori->relationLoaded('kategori') ? [
                    'id_kategori'   => $this->subKategori->kategori->id_kategori,
                    'nama_kategori' => $this->subKategori->kategori->nama_kategori,
                ] : null,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
