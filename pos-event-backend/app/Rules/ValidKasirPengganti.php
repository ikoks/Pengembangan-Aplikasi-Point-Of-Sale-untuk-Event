<?php

namespace App\Rules;

use App\Models\Kasir;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidKasirPengganti implements ValidationRule
{
    /**
     * Memastikan username menunjuk akun Kasir yang masih aktif.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $kasir = Kasir::query()
            ->where('username', $value)
            ->where('status_aktif', true)
            ->exists();

        if (! $kasir) {
            $fail('Username pengganti harus merupakan Kasir yang aktif.');
        }
    }
}
