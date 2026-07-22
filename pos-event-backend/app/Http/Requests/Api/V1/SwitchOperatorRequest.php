<?php

namespace App\Http\Requests\Api\V1;

use App\Rules\ValidKasirPengganti;
use Illuminate\Foundation\Http\FormRequest;

class SwitchOperatorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username_pengganti' => [
                'required',
                'string',
                'exists:user,username',
                new ValidKasirPengganti,
            ],
        ];
    }
}
