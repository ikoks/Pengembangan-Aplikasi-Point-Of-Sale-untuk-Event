<?php

namespace Database\Seeders;

use App\Models\UserModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * UserSeeder
 *
 * Mengisi tabel `user` dengan data pengguna awal:
 *   - 1 Akun Admin Pusat (password di-hash dengan bcrypt).
 *   - 2 Akun Kasir Lapangan (password_hash = NULL, login via username saja).
 *
 * DEPENDENSI: Seeder ini bergantung pada data dari RoleUserSeeder dan CabangSeeder.
 * Pastikan kedua seeder tersebut telah dijalankan terlebih dahulu.
 */
class UserSeeder extends Seeder
{
    /**
     * Menjalankan proses seeding untuk tabel `user`.
     * Menggunakan `firstOrCreate` agar idempoten.
     */
    public function run(): void
    {
        // =====================================================================
        // 1. AKUN ADMIN PUSAT
        //    - Memiliki password yang di-hash.
        //    - id_cabang = NULL karena admin pusat tidak terikat satu cabang.
        // =====================================================================
        UserModel::firstOrCreate(
            ['username' => 'admin.pusat'],
            [
                'id_user'       => 'c1d2e3f4-0001-0001-0001-000000000001',
                'id_role'       => RoleUserSeeder::UUID_ADMIN,
                'id_cabang'     => null, // Admin pusat tidak terikat cabang
                'username'      => 'admin.pusat',
                'password_hash' => Hash::make('AdminPOS@2026!'), // Ganti password ini di production!
                'nama_user'     => 'Administrator Pusat',
                'status_aktif'  => true,
            ]
        );

        // =====================================================================
        // 2. AKUN KASIR LAPANGAN
        //    - password_hash = NULL (login hanya menggunakan username).
        //    - Terikat ke cabang pusat sebagai contoh.
        // =====================================================================
        $cashiers = [
            [
                'id_user'       => 'c1d2e3f4-0002-0002-0002-000000000002',
                'id_role'       => RoleUserSeeder::UUID_KASIR,
                'id_cabang'     => CabangSeeder::UUID_CABANG_PUSAT,
                'username'      => 'kasir.satu',
                'password_hash' => null, // Login tanpa password
                'nama_user'     => 'Kasir Satu – JCC',
                'status_aktif'  => true,
            ],
            [
                'id_user'       => 'c1d2e3f4-0003-0003-0003-000000000003',
                'id_role'       => RoleUserSeeder::UUID_KASIR,
                'id_cabang'     => CabangSeeder::UUID_CABANG_PUSAT,
                'username'      => 'kasir.dua',
                'password_hash' => null, // Login tanpa password
                'nama_user'     => 'Kasir Dua – JCC',
                'status_aktif'  => true,
            ],
        ];

        foreach ($cashiers as $cashier) {
            UserModel::firstOrCreate(
                ['username' => $cashier['username']],
                $cashier
            );
        }

        $this->command->info('✅ [UserSeeder] 3 user berhasil di-seed: 1 Admin, 2 Kasir.');
        $this->command->line('   Admin  → username: admin.pusat | password: AdminPOS@2026!');
        $this->command->line('   Kasir  → username: kasir.satu  | (login tanpa password)');
        $this->command->line('   Kasir  → username: kasir.dua   | (login tanpa password)');
    }
}
