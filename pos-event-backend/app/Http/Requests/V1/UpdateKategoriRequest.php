<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateKategoriRequest
 *
 * Validasi input untuk memperbarui data kategori yang sudah ada.
 * Aturan unique dikecualikan untuk kategori yang sedang di-update.
 */
class UpdateKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // Ambil ID kategori dari route parameter: PATCH /api/v1/kategoris/{kategori}
        $idKategori = $this->route('kategori');

        return [
            'nama_kategori' => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('kategori', 'nama_kategori')->ignore($idKategori, 'id_kategori')->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique'   => 'Nama kategori sudah terdaftar di sistem.',
        ];
    }
}
