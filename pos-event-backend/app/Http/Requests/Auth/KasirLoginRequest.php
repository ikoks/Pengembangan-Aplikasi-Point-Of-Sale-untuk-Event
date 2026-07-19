<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * KasirLoginRequest — Form Request untuk Login Kasir via API
 *
 * Kelas ini menangani validasi input dari endpoint POST /api/login/kasir.
 * Kasir lapangan hanya membutuhkan `username` untuk autentikasi cepat.
 */
class KasirLoginRequest extends FormRequest
{
    /**
     * Endpoint ini bersifat publik, semua request diizinkan masuk ke validasi.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Mendefinisikan aturan validasi untuk login kasir via API.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
        ];
    }

    /**
     * Pesan error kustom dalam Bahasa Indonesia.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'Username wajib diisi.',
            'username.string'   => 'Format username tidak valid.',
            'username.max'      => 'Username tidak boleh lebih dari 50 karakter.',
        ];
    }
}
