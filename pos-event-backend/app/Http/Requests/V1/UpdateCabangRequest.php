<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateCabangRequest
 *
 * Validasi input untuk memperbarui data cabang yang sudah ada.
 * Aturan unique dikecualikan untuk ID cabang yang sedang di-update
 * agar tidak bentrok dengan dirinya sendiri.
 */
class UpdateCabangRequest extends FormRequest
{
    /** Endpoint ini dilindungi middleware, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        // Ambil ID cabang dari route parameter: PATCH /api/v1/cabang/{cabang}
        $idCabang = $this->route('cabang');

        return [
            'nama_cabang'  => [
                'sometimes', 'required', 'string', 'max:100',
                Rule::unique('cabang', 'nama_cabang')->ignore($idCabang, 'id_cabang')->whereNull('deleted_at'),
            ],
            'pajak_persen' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'lokasi'       => [
                'sometimes', 'required', 'string', 'max:500',
                Rule::unique('cabang', 'lokasi')->ignore($idCabang, 'id_cabang')->whereNull('deleted_at'),
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
