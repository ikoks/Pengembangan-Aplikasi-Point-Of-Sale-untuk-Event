<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateMenuTemplateRequest
 *
 * Validasi input untuk memperbarui harga pada konfigurasi menu template yang ada.
 *
 * Catatan Desain:
 *   Endpoint UPDATE hanya memperbolehkan perubahan `harga_produk`.
 *   Kombinasi FK (id_menu + id_cabang + id_sales) adalah identitas record
 *   dan TIDAK boleh diubah via update. Jika kombinasinya ingin berubah,
 *   Admin harus menghapus record lama dan membuat record baru.
 *
 *   Ini adalah keputusan desain yang disengaja untuk menjaga integritas
 *   audit trail harga historis.
 */
class UpdateMenuTemplateRequest extends FormRequest
{
    /** Endpoint ini dilindungi middleware admin.only, user sudah terautentikasi. */
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            // Hanya harga_produk yang bisa diperbarui.
            // FK combination tidak boleh diubah via update.
            'harga_produk' => [
                'required',
                'numeric',
                'min:0',
                'max:9999999999.99',
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'harga_produk.required' => 'Harga produk baru wajib diisi.',
            'harga_produk.numeric'  => 'Harga produk harus berupa angka.',
            'harga_produk.min'      => 'Harga produk tidak boleh bernilai negatif.',
        ];
    }
}
