<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ShiftSessionResource
 *
 * Mentransformasikan objek model ShiftSession menjadi format JSON
 * yang seragam untuk response API sesi shift kasir.
 *
 * Data sensitif keuangan (selisih_uang, uang_fisik_akhir) disertakan
 * penuh karena endpoint shift hanya diakses oleh kasir terautentikasi
 * dan admin. Tidak ada data sensitif personal yang perlu disembunyikan.
 */
class ShiftSessionResource extends JsonResource
{
    /**
     * Ubah resource menjadi array JSON yang akan dikirim ke client.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_shift'         => $this->id_shift,
            'status_shift'     => $this->status_shift,
            'waktu_mulai'      => $this->waktu_mulai?->toIso8601String(),
            'waktu_selesai'    => $this->waktu_selesai?->toIso8601String(),
            'modal_awal'       => (float) $this->modal_awal,
            'uang_fisik_akhir' => $this->uang_fisik_akhir !== null
                                    ? (float) $this->uang_fisik_akhir
                                    : null,
            'selisih_uang'     => (float) $this->selisih_uang,

            // Kasir pemilik shift (pembuat)
            'kasir_pembuka'    => $this->whenLoaded('user', fn () => [
                'id_user'   => $this->user->id_user,
                'nama_user' => $this->user->nama_user,
                'username'  => $this->user->username,
            ]),

            // Kasir yang sedang aktif (bisa berbeda jika terjadi switch operator)
            'kasir_aktif'      => $this->whenLoaded('userAktif', fn () => $this->userAktif ? [
                'id_user'   => $this->userAktif->id_user,
                'nama_user' => $this->userAktif->nama_user,
                'username'  => $this->userAktif->username,
            ] : null),

            // Data cabang tempat shift berlangsung
            'cabang'           => $this->whenLoaded('cabang', fn () => [
                'id_cabang'    => $this->cabang->id_cabang,
                'nama_cabang'  => $this->cabang->nama_cabang,
                'pajak_persen' => (float) $this->cabang->pajak_persen,
            ]),

            // Kanal penjualan yang digunakan dalam shift
            'sales_mode'       => $this->whenLoaded('salesMode', fn () => [
                'id_sales'  => $this->salesMode->id_sales,
                'nama_mode' => $this->salesMode->nama_mode,
            ]),

            // Log audit (hanya jika di-load secara eksplisit)
            'operator_logs'    => $this->whenLoaded('operatorLogs', fn () =>
                $this->operatorLogs->map(fn ($log) => [
                    'id_log'         => $log->id_log,
                    'aksi'           => $log->aksi,
                    'waktu_kejadian' => $log->waktu_kejadian?->toIso8601String(),
                    'catatan'        => $log->catatan,
                ])
            ),

            'created_at'       => $this->created_at?->toIso8601String(),
            'updated_at'       => $this->updated_at?->toIso8601String(),
        ];
    }
}
