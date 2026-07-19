<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreKategoriRequest
 *
 * Validasi input untuk membuat data kategori menu baru.
 */
class StoreKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'nama_kategori' => ['required', 'string', 'max:100', 'unique:kategori,nama_kategori'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique'   => 'Nama kategori sudah terdaftar di sistem.',
            'nama_kategori.max'      => 'Nama kategori tidak boleh lebih dari 100 karakter.',
        ];
    }
}
