<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class StorePromosiRequest extends FormRequest
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
            'id_sales' => ['required', 'array', 'min:1'],
            'id_sales.*' => ['required', 'string', 'exists:sales_mode,id_sales'],
            'nama_promo' => ['required', 'string', 'max:100'],
            'tipe_promo' => ['nullable', 'required_if:cakupan_promo,Per Transaksi,Per Item', 'string', 'in:Nominal,Persen'],
            'cakupan_promo' => ['required', 'string', 'in:Per Transaksi,Per Item,Free Item'],
            'nilai_promo' => ['nullable', 'numeric', 'min:0'],
            'min_pembelian' => ['nullable', 'numeric', 'min:0'],
            'tanggal_mulai' => ['nullable', 'date', 'after_or_equal:today'],
            'tanggal_selesai' => ['nullable', 'date', 'after_or_equal:today', 'after_or_equal:tanggal_mulai'],
            'waktu_mulai' => ['nullable', 'date_format:H:i'],
            'waktu_selesai' => ['nullable', 'date_format:H:i'],
            'hari_aktif' => ['nullable', 'array'],
            'hari_aktif.*' => ['string', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'],
            'syarat_menu' => ['nullable', 'array'],
            'syarat_menu.*' => ['string', 'exists:menu,id_menu'],
        ];
    }
}
