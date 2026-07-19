<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder
 *
 * Entry point utama untuk semua seeder aplikasi.
 * Urutan pemanggilan seeder sangat penting karena ada ketergantungan
 * antar tabel melalui foreign key.
 *
 * URUTAN SEEDING yang BENAR:
 *   1. RoleUserSeeder → Mengisi role (tidak punya dependensi FK)
 *   2. CabangSeeder   → Mengisi cabang (tidak punya dependensi FK)
 *   3. UserSeeder     → Mengisi user (bergantung pada role dan cabang)
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Menjalankan semua seeder secara berurutan.
     */
    public function run(): void
    {
        $this->call([
            RoleUserSeeder::class, // Harus pertama
            CabangSeeder::class,   // Harus kedua
            UserSeeder::class,     // Harus ketiga (bergantung pada role & cabang)
        ]);
    }
}
