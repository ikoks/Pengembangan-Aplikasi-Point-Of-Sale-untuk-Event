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

    public const UUID_KAT_TUNAI = 'k5f6a7b8-0001-0001-0001-000000000001';
    public const UUID_KAT_NONTUNAI = 'k5f6a7b8-0002-0002-0002-000000000002';

    /**
     * Menjalankan proses seeding untuk tabel `metode_pembayaran`.
     * Menggunakan `firstOrCreate` agar idempoten — aman dijalankan berulang.
     */
    public function run(): void
    {
        // Seed Kategori
        $kategoriTunai = \App\Models\KategoriMetodePembayaran::firstOrCreate(
            ['id_kategori_metode' => self::UUID_KAT_TUNAI],
            ['nama_kategori' => 'Tunai']
        );
        $kategoriNonTunai = \App\Models\KategoriMetodePembayaran::firstOrCreate(
            ['id_kategori_metode' => self::UUID_KAT_NONTUNAI],
            ['nama_kategori' => 'Non-Tunai']
        );

        $metodes = [
            [
                'id_metode'    => self::UUID_CASH,
                'nama_metode'  => 'Cash',
                'id_kategori_metode' => $kategoriTunai->id_kategori_metode,
            ],
            [
                'id_metode'    => self::UUID_QRIS,
                'nama_metode'  => 'QRIS Dynamic',
                'id_kategori_metode' => $kategoriNonTunai->id_kategori_metode,
            ],
            [
                'id_metode'    => self::UUID_MANDIRI_VA,
                'nama_metode'  => 'Mandiri Virtual Account',
                'id_kategori_metode' => $kategoriNonTunai->id_kategori_metode,
            ],
        ];

        foreach ($metodes as $metode) {
            MetodePembayaran::firstOrCreate(
                ['id_metode' => $metode['id_metode']],
                [
                    'nama_metode'  => $metode['nama_metode'],
                    'id_kategori_metode' => $metode['id_kategori_metode'],
                ]
            );
        }

        $this->command->info('[MetodePembayaranSeeder] 3 metode pembayaran di-seed: Cash, QRIS Dynamic, Mandiri Virtual Account.');
    }
}
