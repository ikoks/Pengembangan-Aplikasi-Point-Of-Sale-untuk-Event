<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

/**
 * WebLoginRequest — Form Request untuk Login Admin Web
 *
 * Kelas ini memisahkan logika validasi dari Controller (OOP best practice).
 * Menangani validasi input dari form login halaman admin web.
 */
class WebLoginRequest extends FormRequest
{
    /**
     * Menentukan apakah user saat ini berhak membuat request ini.
     * Untuk halaman login publik, selalu kembalikan true (tidak ada auth check).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Mendefinisikan aturan validasi untuk input login admin.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6'],
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
            'password.required' => 'Password wajib diisi.',
            'password.string'   => 'Format password tidak valid.',
            'password.min'      => 'Password minimal 6 karakter.',
        ];
    }
}
