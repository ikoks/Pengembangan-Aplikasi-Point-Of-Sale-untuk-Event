<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateMenuRequest
 *
 * Validasi input untuk memperbarui data item menu yang sudah ada.
 * Menggunakan 'sometimes' agar field bersifat opsional (support PATCH partial update).
 */
class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_sub_kategori' => ['sometimes', 'required', 'string', 'size:36', 'exists:sub_kategori,id_sub_kategori'],
            'nama_menu'       => ['sometimes', 'required', 'string', 'max:150'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_sub_kategori.exists' => 'Sub-kategori yang dipilih tidak valid.',
            'nama_menu.required'     => 'Nama menu wajib diisi.',
            'nama_menu.max'          => 'Nama menu tidak boleh lebih dari 150 karakter.',
        ];
    }
}
