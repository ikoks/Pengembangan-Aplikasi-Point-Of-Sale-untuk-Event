<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Kasir;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * UserSeeder
 *
 * Mengisi tabel `admins` dan `kasirs` dengan data pengguna awal:
 *   - 1 Akun Admin Pusat (password di-hash dengan bcrypt).
 *   - 2 Akun Kasir Lapangan (pin 6 digit).
 *
 * DEPENDENSI: Seeder ini bergantung pada data dari RoleUserSeeder dan CabangSeeder.
 * Pastikan kedua seeder tersebut telah dijalankan terlebih dahulu.
 */
class UserSeeder extends Seeder
{
    /**
     * Menjalankan proses seeding untuk tabel `admins` dan `kasirs`.
     * Menggunakan `firstOrCreate` agar idempoten.
     */
    public function run(): void
    {
        // =====================================================================
        // 1. AKUN ADMIN PUSAT
        //    - Memiliki password yang di-hash.
        // =====================================================================
        Admin::firstOrCreate(
            ['username' => 'admin.pusat'],
            [
                'id_admin'      => 'c1d2e3f4-0001-0001-0001-000000000001',
                'id_role'       => RoleUserSeeder::UUID_ADMIN,
                'username'      => 'admin.pusat',
                'password_hash' => Hash::make('AdminPOS@2026!'), // Ganti password ini di production!
                'nama_admin'    => 'Administrator Pusat',
                'email'         => 'admin@pos-event.com',
                'status_aktif'  => true,
            ]
        );

        // =====================================================================
        // 2. AKUN KASIR LAPANGAN
        //    - pin = '123456' (login via PIN 6 digit).
        //    - Terikat ke cabang pusat sebagai contoh.
        // =====================================================================
        $cashiers = [
            [
                'id_kasir'      => 'c1d2e3f4-0002-0002-0002-000000000002',
                'id_role'       => RoleUserSeeder::UUID_KASIR,
                'id_cabang'     => CabangSeeder::UUID_CABANG_PUSAT,
                'username'      => 'kasir.satu',
                'pin'           => '123456', // Poin 9: Login via PIN
                'nama_kasir'    => 'Kasir Satu – JCC',
                'status_aktif'  => true,
            ],
            [
                'id_kasir'      => 'c1d2e3f4-0003-0003-0003-000000000003',
                'id_role'       => RoleUserSeeder::UUID_KASIR,
                'id_cabang'     => CabangSeeder::UUID_CABANG_PUSAT,
                'username'      => 'kasir.dua',
                'pin'           => '123456', // Poin 9: Login via PIN
                'nama_kasir'    => 'Kasir Dua – JCC',
                'status_aktif'  => true,
            ],
        ];

        foreach ($cashiers as $cashier) {
            Kasir::firstOrCreate(
                ['username' => $cashier['username']],
                $cashier
            );
        }

        $this->command->info(' [UserSeeder] 3 user berhasil di-seed: 1 Admin, 2 Kasir.');
        $this->command->line('   Admin  → username: admin.pusat | password: AdminPOS@2026!');
        $this->command->line('   Kasir  → username: kasir.satu  | PIN: 123456');
        $this->command->line('   Kasir  → username: kasir.dua   | PIN: 123456');
    }
}
