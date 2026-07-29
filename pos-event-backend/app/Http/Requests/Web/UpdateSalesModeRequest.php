<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalesModeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_mode' => [
                'required', 
                'string', 
                'max:50', 
                Rule::unique('sales_mode')->ignore($this->route('sales_mode'))
            ],
        ];
    }
}
