<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $menuTemplate = $this->route('menuTemplate');
        $currentId    = is_object($menuTemplate) ? $menuTemplate->id_template : $menuTemplate;

        return [
            'id_menu'      => ['required', 'exists:menu,id_menu'],
            // Poin 2: id_cabang dihapus, id_sales menjadi single select
            'id_sales'     => [
                'required',
                'string',
                'exists:sales_mode,id_sales',
                // Unique per (id_menu, id_sales), kecuali record yang sedang diedit
                Rule::unique('menu_template', 'id_sales')
                    ->where('id_menu', $this->id_menu)
                    ->ignore($currentId, 'id_template'),
            ],
            'harga_produk' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_sales.unique' => 'Harga untuk menu ini pada mode penjualan yang dipilih sudah ada.',
        ];
    }
}
