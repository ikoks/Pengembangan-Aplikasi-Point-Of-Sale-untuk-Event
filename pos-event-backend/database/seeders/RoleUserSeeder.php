<?php

namespace Database\Seeders;

use App\Models\RoleUser;
use Illuminate\Database\Seeder;

/**
 * RoleUserSeeder
 *
 * Mengisi tabel `role_user` dengan data role awal yang dibutuhkan sistem.
 * UUID di-set secara manual agar konsisten di semua environment (dev, staging, prod)
 * dan agar dapat direferensikan dengan aman oleh seeder lain.
 */
class RoleUserSeeder extends Seeder
{
    /**
     * Daftar UUID tetap untuk setiap role.
     * Mendefinisikan UUID di sini memudahkan referensi lintas-seeder
     * tanpa perlu melakukan query ke database.
     */
    public const UUID_ADMIN  = 'a1b2c3d4-0001-0001-0001-000000000001';
    public const UUID_KASIR  = 'a1b2c3d4-0002-0002-0002-000000000002';

    /**
     * Menjalankan proses seeding untuk tabel `role_user`.
     * Menggunakan `firstOrCreate` agar idempoten (aman dijalankan berulang kali).
     */
    public function run(): void
    {
        $roles = [
            [
                'id_role'   => self::UUID_ADMIN,
                'nama_role' => 'Admin',
            ],
            [
                'id_role'   => self::UUID_KASIR,
                'nama_role' => 'Kasir',
            ],
        ];

        foreach ($roles as $role) {
            RoleUser::firstOrCreate(
                ['id_role' => $role['id_role']],
                ['nama_role' => $role['nama_role']]
            );
        }

        $this->command->info('✅ [RoleUserSeeder] 2 role berhasil di-seed: Admin, Kasir.');
    }
}
