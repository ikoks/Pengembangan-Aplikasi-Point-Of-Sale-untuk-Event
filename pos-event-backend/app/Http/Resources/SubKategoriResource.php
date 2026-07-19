<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * SubKategoriResource
 *
 * Mentransformasikan objek model SubKategori menjadi format JSON seragam.
 * Relasi kategori induk dan daftar menu disertakan kondisional.
 */
class SubKategoriResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_sub_kategori'   => $this->id_sub_kategori,
            'id_kategori'       => $this->id_kategori,
            'nama_sub_kategori' => $this->nama_sub_kategori,
            // Sertakan data kategori induk hanya jika relasi sudah di-load
            'kategori'          => $this->whenLoaded('kategori', fn () => [
                'id_kategori'   => $this->kategori->id_kategori,
                'nama_kategori' => $this->kategori->nama_kategori,
            ]),
            // Sertakan daftar menu hanya jika relasi sudah di-load
            'menus'             => MenuResource::collection($this->whenLoaded('menus')),
            'created_at'        => $this->created_at?->toIso8601String(),
            'updated_at'        => $this->updated_at?->toIso8601String(),
        ];
    }
}
