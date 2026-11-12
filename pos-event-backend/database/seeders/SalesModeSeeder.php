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
    public const UUID_DINE_IN    = 'd1e2f3a4-0004-0004-0004-000000000004';
    public const UUID_TAKE_AWAY  = 'd1e2f3a4-0005-0005-0005-000000000005';
    public const UUID_OFFLINE    = 'd1e2f3a4-0001-0001-0001-000000000001';
    public const UUID_GOFOOD     = 'd1e2f3a4-0002-0002-0002-000000000002';
    public const UUID_GRABFOOD   = 'd1e2f3a4-0006-0006-0006-000000000006';
    public const UUID_SHOPEEFOOD = 'd1e2f3a4-0007-0007-0007-000000000007';
    public const UUID_TOKOPEDIA  = 'd1e2f3a4-0003-0003-0003-000000000003';

    /**
     * Menjalankan proses seeding untuk tabel `sales_mode`.
     * Menggunakan `firstOrCreate` agar operasi bersifat idempoten
     * (aman dijalankan berulang kali tanpa duplikasi data).
     */
    public function run(): void
    {
        $salesModes = [
            [
                'id_sales'   => self::UUID_DINE_IN,
                'nama_mode'  => 'Dine In',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_TAKE_AWAY,
                'nama_mode'  => 'Take Away',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_OFFLINE,
                'nama_mode'  => 'Offline',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_GOFOOD,
                'nama_mode'  => 'GoFood',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_GRABFOOD,
                'nama_mode'  => 'GrabFood',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_SHOPEEFOOD,
                'nama_mode'  => 'ShopeeFood',
                'status'     => 'Aktif',
            ],
            [
                'id_sales'   => self::UUID_TOKOPEDIA,
                'nama_mode'  => 'Tokopedia',
                'status'     => 'Aktif',
            ],
        ];

        foreach ($salesModes as $mode) {
            SalesMode::updateOrCreate(
                ['id_sales' => $mode['id_sales']],
                ['nama_mode' => $mode['nama_mode'], 'status' => $mode['status']]
            );
        }

        $this->command->info('✅ [SalesModeSeeder] 7 sales mode berhasil di-seed: Dine In, Take Away, Offline, GoFood, GrabFood, ShopeeFood, Tokopedia.');
    }
}
