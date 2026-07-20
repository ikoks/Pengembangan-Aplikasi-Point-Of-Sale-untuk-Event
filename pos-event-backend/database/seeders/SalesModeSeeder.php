<?php

namespace Database\Seeders;

use App\Models\SalesMode;
use Illuminate\Database\Seeder;

/**
 * SalesModeSeeder
 *
 * Mengisi tabel `sales_mode` dengan data mode penjualan awal
 * yang dibutuhkan sistem POS Event.
 *
 * UUID di-set secara manual agar konsisten di semua environment
 * (dev, staging, production) dan bisa direferensikan silang oleh seeder lain.
 *
 * DEPENDENSI: Tidak memiliki dependensi FK, aman dijalankan pertama.
 */
class SalesModeSeeder extends Seeder
{
    /**
     * UUID tetap untuk setiap sales mode.
     * Didefinisikan sebagai konstanta publik agar dapat
     * direferensikan oleh seeder atau factory lain tanpa query database.
     */
    public const UUID_OFFLINE   = 'd1e2f3a4-0001-0001-0001-000000000001';
    public const UUID_GOFOOD    = 'd1e2f3a4-0002-0002-0002-000000000002';
    public const UUID_TOKOPEDIA = 'd1e2f3a4-0003-0003-0003-000000000003';

    /**
     * Menjalankan proses seeding untuk tabel `sales_mode`.
     * Menggunakan `firstOrCreate` agar operasi bersifat idempoten
     * (aman dijalankan berulang kali tanpa duplikasi data).
     */
    public function run(): void
    {
        $salesModes = [
            [
                'id_sales'   => self::UUID_OFFLINE,
                'nama_mode'  => 'Offline',
            ],
            [
                'id_sales'   => self::UUID_GOFOOD,
                'nama_mode'  => 'GoFood',
            ],
            [
                'id_sales'   => self::UUID_TOKOPEDIA,
                'nama_mode'  => 'Tokopedia',
            ],
        ];

        foreach ($salesModes as $mode) {
            SalesMode::firstOrCreate(
                ['id_sales' => $mode['id_sales']],
                ['nama_mode' => $mode['nama_mode']]
            );
        }

        $this->command->info('✅ [SalesModeSeeder] 3 sales mode berhasil di-seed: Offline, GoFood, Tokopedia.');
    }
}
