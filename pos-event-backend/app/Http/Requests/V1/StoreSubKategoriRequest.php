<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreSubKategoriRequest
 *
 * Validasi input untuk membuat data sub-kategori menu baru.
 * Memastikan id_kategori valid dan nama_sub_kategori tidak duplikat
 * dalam satu kategori yang sama.
 */
class StoreSubKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'id_kategori'       => ['required', 'string', 'size:36', 'exists:kategori,id_kategori'],
            'nama_sub_kategori' => [
                'required', 'string', 'max:100',
                // Unik per kategori: nama sub_kategori boleh sama di kategori berbeda
                Rule::unique('sub_kategori', 'nama_sub_kategori')
                    ->where('id_kategori', $this->input('id_kategori'))
                    ->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_kategori.required'       => 'Kategori induk wajib dipilih.',
            'id_kategori.exists'         => 'Kategori yang dipilih tidak valid atau tidak ditemukan.',
            'nama_sub_kategori.required' => 'Nama sub-kategori wajib diisi.',
            'nama_sub_kategori.unique'   => 'Nama sub-kategori sudah ada dalam kategori yang sama.',
        ];
    }
}
