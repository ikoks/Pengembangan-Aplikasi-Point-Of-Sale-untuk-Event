<?php

namespace Database\Seeders;

use App\Models\Kategori;
use App\Models\SubKategori;
use App\Models\Menu;
use App\Models\MenuTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class KatalogSeeder extends Seeder
{
    // UUID Constants untuk Kategori
    public const UUID_KAT_MAKANAN = 'c1c2c3c4-0001-0001-0001-000000000001';
    public const UUID_KAT_MINUMAN = 'c1c2c3c4-0001-0001-0001-000000000002';

    // UUID Constants untuk Sub Kategori
    public const UUID_SUB_MAKANAN_BERAT = 's1s2s3s4-0001-0001-0001-000000000001';
    public const UUID_SUB_SNACK         = 's1s2s3s4-0001-0001-0001-000000000002';
    public const UUID_SUB_KOPI          = 's1s2s3s4-0001-0001-0001-000000000003';

    // UUID Constants untuk Menu (Sesuai dengan PromosiSeeder)
    public const UUID_MENU_NASI_GORENG = 'a1b2c3d4-0001-0001-0001-000000000001';
    public const UUID_MENU_MIE_GORENG  = 'a1b2c3d4-0001-0001-0001-000000000002';
    public const UUID_MENU_KENTANG     = 'a1b2c3d4-0001-0001-0001-000000000003';
    public const UUID_MENU_KOPI_SUSU   = 'a1b2c3d4-0001-0001-0001-000000000004';
    public const UUID_MENU_AYAM_BAKAR  = 'a1b2c3d4-0001-0001-0001-000000000005';
    public const UUID_MENU_SATE_AYAM   = 'a1b2c3d4-0001-0001-0001-000000000006';
    public const UUID_MENU_TAHU_CRISPY = 'a1b2c3d4-0001-0001-0001-000000000007';
    public const UUID_MENU_PISANG_GRG  = 'a1b2c3d4-0001-0001-0001-000000000008';
    public const UUID_MENU_AMERICANO   = 'a1b2c3d4-0001-0001-0001-000000000009';
    public const UUID_MENU_CAPPUCCINO  = 'a1b2c3d4-0001-0001-0001-000000000010';

    public function run(): void
    {
        // 1. Kategori
        $katMakanan = Kategori::firstOrCreate(
            ['id_kategori' => self::UUID_KAT_MAKANAN],
            ['nama_kategori' => 'Makanan', 'status' => 'Aktif']
        );
        $katMinuman = Kategori::firstOrCreate(
            ['id_kategori' => self::UUID_KAT_MINUMAN],
            ['nama_kategori' => 'Minuman', 'status' => 'Aktif']
        );

        // 2. Sub Kategori
        $subMakananBerat = SubKategori::firstOrCreate(
            ['id_sub_kategori' => self::UUID_SUB_MAKANAN_BERAT],
            ['id_kategori' => $katMakanan->id_kategori, 'nama_sub_kategori' => 'Makanan Berat', 'status' => 'Aktif']
        );
        $subSnack = SubKategori::firstOrCreate(
            ['id_sub_kategori' => self::UUID_SUB_SNACK],
            ['id_kategori' => $katMakanan->id_kategori, 'nama_sub_kategori' => 'Snack', 'status' => 'Aktif']
        );
        $subKopi = SubKategori::firstOrCreate(
            ['id_sub_kategori' => self::UUID_SUB_KOPI],
            ['id_kategori' => $katMinuman->id_kategori, 'nama_sub_kategori' => 'Kopi', 'status' => 'Aktif']
        );

        // 3. Menu
        $menus = [
            ['id_menu' => self::UUID_MENU_NASI_GORENG, 'id_sub_kategori' => $subMakananBerat->id_sub_kategori, 'nama_menu' => 'Nasi Goreng',           'harga_dasar' => 35000],
            ['id_menu' => self::UUID_MENU_MIE_GORENG,  'id_sub_kategori' => $subMakananBerat->id_sub_kategori, 'nama_menu' => 'Mie Goreng',             'harga_dasar' => 38000],
            ['id_menu' => self::UUID_MENU_AYAM_BAKAR,  'id_sub_kategori' => $subMakananBerat->id_sub_kategori, 'nama_menu' => 'Ayam Bakar Madu',        'harga_dasar' => 45000],
            ['id_menu' => self::UUID_MENU_SATE_AYAM,   'id_sub_kategori' => $subMakananBerat->id_sub_kategori, 'nama_menu' => 'Sate Ayam Taichan',      'harga_dasar' => 30000],
            ['id_menu' => self::UUID_MENU_KENTANG,      'id_sub_kategori' => $subSnack->id_sub_kategori,        'nama_menu' => 'Kentang Goreng',         'harga_dasar' => 20000],
            ['id_menu' => self::UUID_MENU_TAHU_CRISPY,  'id_sub_kategori' => $subSnack->id_sub_kategori,        'nama_menu' => 'Tahu Crispy Pedas',      'harga_dasar' => 15000],
            ['id_menu' => self::UUID_MENU_PISANG_GRG,   'id_sub_kategori' => $subSnack->id_sub_kategori,        'nama_menu' => 'Pisang Goreng Keju',     'harga_dasar' => 18000],
            ['id_menu' => self::UUID_MENU_KOPI_SUSU,    'id_sub_kategori' => $subKopi->id_sub_kategori,         'nama_menu' => 'Es Kopi Susu Gula Aren', 'harga_dasar' => 25000],
            ['id_menu' => self::UUID_MENU_AMERICANO,    'id_sub_kategori' => $subKopi->id_sub_kategori,         'nama_menu' => 'Americano',              'harga_dasar' => 22000],
            ['id_menu' => self::UUID_MENU_CAPPUCCINO,   'id_sub_kategori' => $subKopi->id_sub_kategori,         'nama_menu' => 'Cappuccino',             'harga_dasar' => 28000],
        ];

        // 4. Harga per Sales Mode
        // Poin 2: menu_template tidak lagi menggunakan id_cabang, hanya id_menu + id_sales
        $salesModes = [
            SalesModeSeeder::UUID_OFFLINE   => 1.0,   // Harga normal
            SalesModeSeeder::UUID_GOFOOD    => 1.2,   // Harga + 20% (platform fee)
            SalesModeSeeder::UUID_TOKOPEDIA => 1.05,  // Harga + 5%
        ];

        foreach ($menus as $m) {
            $menu = Menu::firstOrCreate(
                ['id_menu' => $m['id_menu']],
                [
                    'id_sub_kategori' => $m['id_sub_kategori'],
                    'nama_menu'       => $m['nama_menu'],
                    'status'          => 'Aktif',
                ]
            );

            foreach ($salesModes as $idSales => $multiplier) {
                $hargaFinal = $m['harga_dasar'] * $multiplier;

                MenuTemplate::firstOrCreate(
                    [
                        'id_menu'  => $menu->id_menu,
                        'id_sales' => $idSales,
                    ],
                    [
                        'id_template'  => (string) Str::uuid(),
                        'harga_produk' => $hargaFinal,
                    ]
                );
            }
        }

        $this->command->info('✅ [KatalogSeeder] Kategori, Sub-Kategori, Menu, dan Harga per Sales Mode berhasil di-seed.');
    }
}
