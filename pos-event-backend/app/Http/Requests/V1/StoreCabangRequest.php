<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

use Illuminate\Validation\Rule;

/**
 * StoreCabangRequest
 *
 * Validasi input untuk membuat data cabang baru.
 * Aturan: nama_cabang & lokasi unik (abaikan record soft deleted).
 */
class StoreCabangRequest extends FormRequest
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
            'nama_cabang'  => [
                'required', 'string', 'max:100',
                Rule::unique('cabang', 'nama_cabang')->whereNull('deleted_at'),
            ],
            'pajak_persen' => ['required', 'numeric', 'min:0', 'max:100'],
            'lokasi'       => [
                'required', 'string', 'max:500',
                Rule::unique('cabang', 'lokasi')->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'nama_cabang.required'  => 'Nama cabang wajib diisi.',
            'nama_cabang.unique'    => 'Nama cabang sudah terdaftar di sistem.',
            'pajak_persen.required' => 'Persentase pajak wajib diisi.',
            'pajak_persen.numeric'  => 'Persentase pajak harus berupa angka.',
            'pajak_persen.min'      => 'Persentase pajak tidak boleh kurang dari 0.',
            'pajak_persen.max'      => 'Persentase pajak tidak boleh lebih dari 100.',
            'lokasi.required'       => 'Lokasi cabang wajib diisi.',
            'lokasi.unique'         => 'Lokasi cabang sudah terdaftar di sistem.',
        ];
    }
}
