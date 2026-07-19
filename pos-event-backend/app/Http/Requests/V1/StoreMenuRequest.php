<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreMenuRequest
 *
 * Validasi input untuk menambahkan item menu baru ke dalam katalog.
 */
class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_sub_kategori' => ['required', 'string', 'size:36', 'exists:sub_kategori,id_sub_kategori'],
            'nama_menu'       => ['required', 'string', 'max:150'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_sub_kategori.required' => 'Sub-kategori wajib dipilih.',
            'id_sub_kategori.exists'   => 'Sub-kategori yang dipilih tidak valid atau tidak ditemukan.',
            'nama_menu.required'       => 'Nama menu wajib diisi.',
            'nama_menu.max'            => 'Nama menu tidak boleh lebih dari 150 karakter.',
        ];
    }
}
