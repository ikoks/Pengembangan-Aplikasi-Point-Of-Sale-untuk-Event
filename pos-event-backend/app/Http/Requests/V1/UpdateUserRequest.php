<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateUserRequest
 *
 * Validasi input untuk memperbarui akun user yang sudah ada.
 * Aturan unique untuk `username` dikecualikan untuk user yang sedang di-update
 * agar tidak bentrok dengan username dirinya sendiri.
 */
class UpdateUserRequest extends FormRequest
{
    /** Endpoint ini dilindungi middleware, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // Ambil ID user dari route parameter: PATCH /api/v1/users/{user}
        $idUser = $this->route('user');

        return [
            'id_role'       => ['sometimes', 'required', 'string', 'size:36', 'exists:role_user,id_role'],
            'id_cabang'     => ['sometimes', 'nullable', 'string', 'size:36', 'exists:cabang,id_cabang'],
            'username'      => [
                'sometimes', 'required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9._-]+$/',
                // Izinkan username yang sama untuk user yang sedang di-update
                Rule::unique('user', 'username')->ignore($idUser, 'id_user'),
            ],
            'password_hash' => ['sometimes', 'nullable', 'string', 'min:8'],
            'nama_user'     => ['sometimes', 'required', 'string', 'max:100'],
            'status_aktif'  => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_role.exists'         => 'Role yang dipilih tidak valid.',
            'id_cabang.exists'       => 'Cabang yang dipilih tidak valid.',
            'username.unique'        => 'Username sudah digunakan oleh user lain.',
            'username.regex'         => 'Username hanya boleh mengandung huruf, angka, titik, underscore, atau tanda hubung.',
            'password_hash.min'      => 'Password minimal 8 karakter.',
            'nama_user.required'     => 'Nama user wajib diisi.',
        ];
    }
}
