<?php

namespace Database\Seeders;

use App\Models\Cabang;
use Illuminate\Database\Seeder;

/**
 * CabangSeeder
 *
 * Mengisi tabel `cabang` dengan data cabang contoh awal.
 * UUID di-set secara manual agar konsisten dan dapat
 * direferensikan oleh UserSeeder dengan aman.
 */
class CabangSeeder extends Seeder
{
    /**
     * UUID tetap untuk cabang contoh awal.
     * Didefinisikan sebagai konstanta agar mudah direferensikan oleh seeder lain.
     */
    public const UUID_CABANG_PUSAT = 'b1c2d3e4-0001-0001-0001-000000000001';

    /**
     * Menjalankan proses seeding untuk tabel `cabang`.
     */
    public function run(): void
    {
        $branches = [
            [
                'id_cabang'          => self::UUID_CABANG_PUSAT,
                'id_sales'           => SalesModeSeeder::UUID_OFFLINE,
                'nama_cabang'        => 'Cabang Pusat – Jakarta Convention Center',
                'pajak_persen'       => 11.00, // PPN 11%
                'lokasi'             => 'Jl. Gatot Subroto, Senayan, Jakarta Pusat, DKI Jakarta 10270',
                'status'             => 'Aktif',
            ],
        ];

        foreach ($branches as $branch) {
            Cabang::updateOrCreate(
                ['id_cabang' => $branch['id_cabang']],
                $branch
            );
        }

        $this->command->info('✅ [CabangSeeder] 1 cabang berhasil di-seed: Cabang Pusat – Jakarta Convention Center.');
    }
}
