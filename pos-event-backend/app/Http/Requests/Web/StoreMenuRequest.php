<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_sub_kategori' => ['required', 'string', 'exists:sub_kategori,id_sub_kategori'],
            'nama_menu' => ['required', 'string', 'max:100', Rule::unique('menu', 'nama_menu')->whereNull('deleted_at')],
        ];
    }
}
