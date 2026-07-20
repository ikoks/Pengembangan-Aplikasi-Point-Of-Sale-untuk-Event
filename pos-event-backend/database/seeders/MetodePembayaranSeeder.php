<?php

namespace Database\Seeders;

use App\Models\MetodePembayaran;
use Illuminate\Database\Seeder;

/**
 * MetodePembayaranSeeder
 *
 * Mengisi tabel `metode_pembayaran` dengan data metode pembayaran awal
 * yang dibutuhkan sistem POS Event sesuai Tabel 4.10 SDD.
 *
 * UUID di-set secara manual agar konsisten di semua environment
 * (dev, staging, production) dan dapat direferensikan silang.
 *
 * DEPENDENSI: Tidak memiliki dependensi FK, aman dijalankan kapan saja.
 */
class MetodePembayaranSeeder extends Seeder
{
    /**
     * UUID tetap untuk setiap metode pembayaran.
     * Didefinisikan sebagai konstanta publik agar bisa
     * direferensikan oleh seeder atau factory lain.
     */
    public const UUID_CASH       = 'e5f6a7b8-0001-0001-0001-000000000001';
    public const UUID_QRIS       = 'e5f6a7b8-0002-0002-0002-000000000002';
    public const UUID_MANDIRI_VA = 'e5f6a7b8-0003-0003-0003-000000000003';

    /**
     * Menjalankan proses seeding untuk tabel `metode_pembayaran`.
     * Menggunakan `firstOrCreate` agar idempoten — aman dijalankan berulang.
     */
    public function run(): void
    {
        $metodes = [
            [
                'id_metode'       => self::UUID_CASH,
                'nama_metode'     => 'Cash',
                'kategori_metode' => 'Tunai',
                'vendor_gateway'  => null,
            ],
            [
                'id_metode'       => self::UUID_QRIS,
                'nama_metode'     => 'QRIS Dynamic',
                'kategori_metode' => 'QRIS',
                'vendor_gateway'  => 'Midtrans',
            ],
            [
                'id_metode'       => self::UUID_MANDIRI_VA,
                'nama_metode'     => 'Mandiri Virtual Account',
                'kategori_metode' => 'VA',
                'vendor_gateway'  => 'Midtrans',
            ],
        ];

        foreach ($metodes as $metode) {
            MetodePembayaran::firstOrCreate(
                ['id_metode' => $metode['id_metode']],
                [
                    'nama_metode'     => $metode['nama_metode'],
                    'kategori_metode' => $metode['kategori_metode'],
                    'vendor_gateway'  => $metode['vendor_gateway'],
                ]
            );
        }

        $this->command->info('✅ [MetodePembayaranSeeder] 3 metode pembayaran di-seed: Cash, QRIS Dynamic, Mandiri Virtual Account.');
    }
}
