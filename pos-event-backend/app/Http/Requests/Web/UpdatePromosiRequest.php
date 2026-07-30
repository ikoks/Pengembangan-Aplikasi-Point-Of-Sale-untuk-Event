<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePromosiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_cabang' => ['required', 'array', 'min:1'],
            'id_cabang.*' => ['required', 'string', 'exists:cabang,id_cabang'],
            'nama_promo' => ['required', 'string', 'max:100'],
            'tipe_promo' => ['required', 'string', 'in:Nominal,Persen'],
            'cakupan_promo' => ['required', 'string', 'in:Per Transaksi,Per Item,Free Item'],
            'nilai_promo' => ['nullable', 'numeric', 'min:0'],
            'min_pembelian' => ['nullable', 'numeric', 'min:0'],
            'tanggal_mulai' => ['nullable', 'date', 'after_or_equal:today'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:today', 'after_or_equal:tanggal_mulai'],
            'id_menu_free' => ['nullable', 'string', 'exists:menu,id_menu'],
        ];
    }
}
