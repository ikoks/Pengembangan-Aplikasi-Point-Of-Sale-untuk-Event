<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateSubKategoriRequest
 *
 * Validasi input untuk memperbarui data sub-kategori yang sudah ada.
 * Aturan unique dikecualikan untuk sub-kategori yang sedang di-update.
 */
class UpdateSubKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // Ambil ID sub-kategori dari route parameter
        $idSubKategori = $this->route('sub_kategori');

        return [
            'id_kategori'       => ['sometimes', 'required', 'string', 'size:36', 'exists:kategori,id_kategori'],
            'nama_sub_kategori' => [
                'sometimes', 'required', 'string', 'max:100',
                // Unik per kategori, kecualikan dirinya sendiri
                Rule::unique('sub_kategori', 'nama_sub_kategori')
                    ->where('id_kategori', $this->input('id_kategori'))
                    ->ignore($idSubKategori, 'id_sub_kategori')
                    ->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'id_kategori.exists'         => 'Kategori yang dipilih tidak valid.',
            'nama_sub_kategori.required' => 'Nama sub-kategori wajib diisi.',
            'nama_sub_kategori.unique'   => 'Nama sub-kategori sudah ada dalam kategori yang sama.',
        ];
    }
}
