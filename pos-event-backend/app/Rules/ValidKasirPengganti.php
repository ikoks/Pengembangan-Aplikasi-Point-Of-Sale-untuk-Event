<?php

namespace App\Rules;

use App\Models\UserModel;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidKasirPengganti implements ValidationRule
{
    /**
     * Memastikan username menunjuk akun Kasir yang masih aktif.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $kasir = UserModel::query()
            ->where('username', $value)
            ->where('status_aktif', true)
            ->whereHas('role', fn ($query) => $query->where('nama_role', 'Kasir'))
            ->exists();

        if (! $kasir) {
            $fail('Username pengganti harus merupakan Kasir yang aktif.');
        }
    }
}
