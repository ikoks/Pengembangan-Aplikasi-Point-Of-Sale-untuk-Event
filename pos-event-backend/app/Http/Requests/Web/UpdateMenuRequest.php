<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $menu = $this->route('menu');
        $id = is_object($menu) ? $menu->id_menu : ($menu ?? $this->id_menu);

        return [
            'id_sub_kategori' => ['required', 'string', 'exists:sub_kategori,id_sub_kategori'],
            'nama_menu' => [
                'required', 
                'string', 
                'max:100',
                Rule::unique('menu', 'nama_menu')->ignore($id, 'id_menu')->whereNull('deleted_at')
            ],
        ];
    }
}
