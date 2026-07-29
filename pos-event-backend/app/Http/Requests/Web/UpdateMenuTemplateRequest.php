<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_menu' => ['required', 'exists:menu,id_menu'],
            'id_cabang' => ['required', 'exists:cabang,id_cabang'],
            'id_sales' => ['required', 'exists:sales_mode,id_sales'],
            'harga_produk' => ['required', 'numeric', 'min:0'],
        ];
    }
}
