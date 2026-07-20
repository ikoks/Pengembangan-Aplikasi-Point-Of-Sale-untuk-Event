<?php

namespace Database\Seeders;

use App\Models\Promosi;
use Illuminate\Database\Seeder;

/**
 * PromosiSeeder
 *
 * Mengisi sampel data promosi lengkap (Nominal & Persen, per_item & per_transaksi)
 * untuk pengujian fitur promo/diskon pada checkout POS Event.
 */
class PromosiSeeder extends Seeder
{
    // UUID Tetap untuk Pengujian Postman
    public const UUID_PROMO_ITEM_NOMINAL = 'f6a7b8c9-0001-0001-0001-000000000001';
    public const UUID_PROMO_ITEM_PERSEN  = 'f6a7b8c9-0001-0001-0001-000000000002';
    public const UUID_PROMO_TX_NOMINAL   = 'f6a7b8c9-0002-0002-0002-000000000001';
    public const UUID_PROMO_TX_PERSEN    = 'f6a7b8c9-0002-0002-0002-000000000002';

    public function run(): void
    {
        $promos = [
            // 1. Diskon Item Nominal (Rp 2.000)
            [
                'id_promo'       => self::UUID_PROMO_ITEM_NOMINAL,
                'id_cabang'      => 'b1c2d3e4-0001-0001-0001-000000000001',
                'nama_promo'     => 'Potongan Item Rp 2.000',
                'tipe_promo'     => 'Nominal',
                'cakupan_promo'  => 'per_item',
                'nilai_promo'    => 2000.00,
            ],
            // 2. Diskon Item Persentase (10%)
            [
                'id_promo'       => self::UUID_PROMO_ITEM_PERSEN,
                'id_cabang'      => 'b1c2d3e4-0001-0001-0001-000000000001',
                'nama_promo'     => 'Diskon Item 10%',
                'tipe_promo'     => 'Persen',
                'cakupan_promo'  => 'per_item',
                'nilai_promo'    => 10.00,
            ],
            // 3. Diskon Transaksi Nominal (Rp 10.000)
            [
                'id_promo'       => self::UUID_PROMO_TX_NOMINAL,
                'id_cabang'      => 'b1c2d3e4-0001-0001-0001-000000000001',
                'nama_promo'     => 'Voucher Hemat Rp 10.000',
                'tipe_promo'     => 'Nominal',
                'cakupan_promo'  => 'per_transaksi',
                'nilai_promo'    => 10000.00,
            ],
            // 4. Diskon Transaksi Persentase (15%)
            [
                'id_promo'       => self::UUID_PROMO_TX_PERSEN,
                'id_cabang'      => 'b1c2d3e4-0001-0001-0001-000000000001',
                'nama_promo'     => 'Diskon Transaksi 15%',
                'tipe_promo'     => 'Persen',
                'cakupan_promo'  => 'per_transaksi',
                'nilai_promo'    => 15.00,
            ],
        ];

        foreach ($promos as $promo) {
            Promosi::firstOrCreate(
                ['id_promo' => $promo['id_promo']],
                $promo
            );
        }

        $this->command->info('✅ [PromosiSeeder] 4 jenis sampel promosi (Nominal & Persen) berhasil di-seed.');
    }
}
