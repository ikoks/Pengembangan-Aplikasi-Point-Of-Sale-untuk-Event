<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_menu' => ['required', 'exists:menu,id_menu'],
            'id_cabang' => ['required', 'array', 'min:1'],
            'id_cabang.*' => ['required', 'string', 'exists:cabang,id_cabang'],
            'id_sales' => ['required', 'exists:sales_mode,id_sales'],
            'harga_produk' => ['required', 'numeric', 'min:0'],
        ];
    }
}
