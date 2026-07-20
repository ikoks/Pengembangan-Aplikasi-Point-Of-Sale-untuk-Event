<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreMenuTemplateRequest
 *
 * Validasi input untuk membuat konfigurasi harga baru (menu template).
 *
 * Aturan Kunci — Scoped Uniqueness (Kombinasi 3 FK):
 *   Kombinasi (id_menu + id_cabang + id_sales) harus bersifat unik.
 *   Sistem tidak mengizinkan dua record dengan kombinasi ketiga FK yang sama,
 *   karena setiap item hanya boleh memiliki SATU harga per kanal per cabang.
 *
 *   Contoh VALID   : Nasi Goreng | JCC | GoFood (belum ada)
 *   Contoh INVALID  : Nasi Goreng | JCC | GoFood (sudah ada → TOLAK)
 *   Contoh VALID   : Nasi Goreng | JIEXPO | GoFood (berbeda cabang → IZINKAN)
 */
class StoreMenuTemplateRequest extends FormRequest
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
            'id_menu'      => [
                'required',
                'string',
                'size:36',
                'exists:menu,id_menu',
            ],
            'id_cabang'    => [
                'required',
                'string',
                'size:36',
                'exists:cabang,id_cabang',
            ],
            'id_sales'     => [
                'required',
                'string',
                'size:36',
                'exists:sales_mode,id_sales',
                Rule::unique('menu_template')
                    ->where('id_menu', $this->input('id_menu'))
                    ->where('id_cabang', $this->input('id_cabang'))
                    ->where('id_sales', $this->input('id_sales')),
            ],
            'harga_produk' => [
                'required',
                'numeric',
                'min:0',
                'max:9999999999.99',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'id_menu.required'      => 'Item menu wajib dipilih.',
            'id_menu.exists'        => 'Item menu yang dipilih tidak valid atau tidak ditemukan.',
            'id_cabang.required'    => 'Cabang wajib dipilih.',
            'id_cabang.exists'      => 'Cabang yang dipilih tidak valid atau tidak ditemukan.',
            'id_sales.required'     => 'Sales mode / kanal penjualan wajib dipilih.',
            'id_sales.exists'       => 'Sales mode yang dipilih tidak valid.',
            'id_sales.unique'       => 'Konfigurasi harga untuk kombinasi menu, cabang, dan sales mode ini sudah ada. Gunakan endpoint update untuk mengubah harga.',
            'harga_produk.required' => 'Harga produk wajib diisi.',
            'harga_produk.numeric'  => 'Harga produk harus berupa angka.',
            'harga_produk.min'      => 'Harga produk tidak boleh bernilai negatif.',
        ];
    }

    /**
     * Nama atribut yang lebih ramah untuk pesan error.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'kombinasi_unik' => 'kombinasi menu + cabang + sales mode',
        ];
    }
}
