<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_menu'      => ['required', 'exists:menu,id_menu'],
            // Poin 2: id_cabang dihapus — harga kini global (bukan per cabang)
            'id_sales'     => [
                'required',
                'string',
                'exists:sales_mode,id_sales',
                // Unique: satu menu hanya boleh punya satu harga per sales mode
                Rule::unique('menu_template', 'id_sales')->where('id_menu', $this->id_menu),
            ],
            'harga_produk' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_sales.unique' => 'Harga untuk menu ini pada mode penjualan yang dipilih sudah ada. Gunakan fitur Edit untuk mengubah harganya.',
        ];
    }
}
