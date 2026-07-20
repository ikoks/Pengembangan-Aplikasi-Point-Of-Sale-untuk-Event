<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder
 *
 * Entry point utama untuk semua seeder aplikasi.
 * Urutan pemanggilan sangat penting karena adanya ketergantungan
 * antar tabel melalui foreign key constraints.
 *
 * URUTAN SEEDING yang BENAR (sesuai dependency graph FK):
 *   1. RoleUserSeeder          → Mengisi role (tidak ada FK)
 *   2. CabangSeeder            → Mengisi cabang (tidak ada FK)
 *   3. SalesModeSeeder         → Mengisi mode penjualan (tidak ada FK)
 *   4. MetodePembayaranSeeder  → Mengisi metode pembayaran (tidak ada FK)
 *   5. UserSeeder              → Bergantung pada role_user & cabang
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Menjalankan semua seeder secara berurutan sesuai dependency graph.
     */
    public function run(): void
    {
        $this->call([
            RoleUserSeeder::class,         // Tidak ada FK — harus pertama
            CabangSeeder::class,           // Tidak ada FK — harus kedua
            SalesModeSeeder::class,        // Tidak ada FK — harus ketiga
            MetodePembayaranSeeder::class, // Tidak ada FK — harus keempat
            UserSeeder::class,             // Bergantung pada role & cabang — harus kelima
        ]);
    }
}
