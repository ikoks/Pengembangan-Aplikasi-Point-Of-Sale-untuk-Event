<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreUserRequest
 *
 * Validasi input untuk membuat akun user baru (Admin atau Kasir).
 * Memastikan username bersifat unik di seluruh tabel `user`.
 */
class StoreUserRequest extends FormRequest
{
    /** Endpoint ini dilindungi middleware, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_role'       => ['required', 'string', 'size:36', 'exists:role_user,id_role'],
            'id_cabang'     => ['nullable', 'string', 'size:36', 'exists:cabang,id_cabang'],
            'username'      => ['required', 'string', 'max:50', 'unique:user,username', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'password_hash' => ['nullable', 'string', 'min:8'],
            'nama_user'     => ['required', 'string', 'max:100'],
            'status_aktif'  => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_role.required'       => 'Role user wajib dipilih.',
            'id_role.exists'         => 'Role yang dipilih tidak valid.',
            'id_cabang.exists'       => 'Cabang yang dipilih tidak valid.',
            'username.required'      => 'Username wajib diisi.',
            'username.unique'        => 'Username sudah digunakan oleh user lain.',
            'username.regex'         => 'Username hanya boleh mengandung huruf, angka, titik, underscore, atau tanda hubung.',
            'password_hash.min'      => 'Password minimal 8 karakter.',
            'nama_user.required'     => 'Nama user wajib diisi.',
        ];
    }
}
