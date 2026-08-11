<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource
 *
 * Mentransformasikan objek model Kasir menjadi format JSON
 * yang aman untuk dikonsumsi API. Kolom sensitif
 * dikecualikan sepenuhnya dari output.
 */
class UserResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_kasir'    => $this->id_kasir,
            'username'    => $this->username,
            'nama_kasir'  => $this->nama_kasir,
            'status_aktif'=> $this->status_aktif,
            // Tampilkan data relasi hanya jika sudah di-load (eager-loaded)
            'role'        => $this->whenLoaded('role', fn () => [
                'id_role'   => $this->role->id_role,
                'nama_role' => $this->role->nama_role,
            ]),
            'cabang'      => $this->whenLoaded('cabang', fn () => $this->cabang ? [
                'id_cabang'   => $this->cabang->id_cabang,
                'nama_cabang' => $this->cabang->nama_cabang,
            ] : null),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
