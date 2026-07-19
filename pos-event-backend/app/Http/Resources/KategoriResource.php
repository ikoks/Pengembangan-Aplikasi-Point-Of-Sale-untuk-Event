<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * KategoriResource
 *
 * Mentransformasikan objek model Kategori menjadi format JSON seragam.
 * Sub-kategori disertakan hanya jika relasi sudah di-eager-load.
 */
class KategoriResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_kategori'   => $this->id_kategori,
            'nama_kategori' => $this->nama_kategori,
            // Sertakan daftar sub-kategori hanya jika relasi sudah di-load
            'sub_kategoris' => SubKategoriResource::collection($this->whenLoaded('subKategoris')),
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),
        ];
    }
}
