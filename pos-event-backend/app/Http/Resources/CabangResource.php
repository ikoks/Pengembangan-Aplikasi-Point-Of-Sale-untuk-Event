<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * CabangResource
 *
 * Mentransformasikan objek model Cabang menjadi format JSON
 * yang seragam untuk semua response API yang melibatkan data cabang.
 */
class CabangResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_cabang'    => $this->id_cabang,
            'nama_cabang'  => $this->nama_cabang,
            'pajak_persen' => (float) $this->pajak_persen,
            'lokasi'       => $this->lokasi,
            'created_at'   => $this->created_at?->toIso8601String(),
            'updated_at'   => $this->updated_at?->toIso8601String(),
        ];
    }
}
