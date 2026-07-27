<?php

namespace Database\Factories;

use App\Models\Cabang;
use App\Models\RoleUser;
use App\Models\UserModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Factory for UserModel
 * Digunakan dalam Feature Tests Sprint 2.
 */
class UserModelFactory extends Factory
{
    protected $model = UserModel::class;

    public function definition(): array
    {
        return [
            'id_user'       => (string) Str::uuid(),
            'id_role'       => null, // Set via state
            'id_cabang'     => null,
            'username'      => $this->faker->unique()->userName(),
            'password_hash' => Hash::make('password'),
            'nama_user'     => $this->faker->name(),
            'status_aktif'  => true,
        ];
    }

    /** State: kasir lapangan (tanpa password) */
    public function kasir(): static
    {
        return $this->state(fn (array $attributes) => [
            'password_hash' => null,
            'nama_user'     => 'Test Kasir ' . $this->faker->firstName(),
        ]);
    }

    /** State: admin pusat (dengan password) */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'password_hash' => Hash::make('AdminTest@123'),
            'nama_user'     => 'Test Admin ' . $this->faker->firstName(),
        ]);
    }

    /** State: user dengan role dan cabang tertentu */
    public function withRole(string $idRole, ?string $idCabang = null): static
    {
        return $this->state(fn (array $attributes) => [
            'id_role'   => $idRole,
            'id_cabang' => $idCabang,
        ]);
    }
}
