<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_gateway'     => ['nullable', 'string', 'max:50'],
            'payment_gateway_id' => ['nullable', 'string', 'max:100'],
            'reference_number'  => ['nullable', 'string', 'max:100'],
            'va_number'         => ['nullable', 'string', 'max:50'],
        ];
    }
}
