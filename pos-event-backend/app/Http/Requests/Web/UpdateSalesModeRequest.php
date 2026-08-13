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
        $mode = $this->route('sales_mode');
        $id = is_object($mode) ? $mode->id_sales : ($mode ?? $this->id_sales);

        return [
            'nama_mode' => ['required', 'string', 'max:50', Rule::unique('sales_mode', 'nama_mode')->ignore($id, 'id_sales')],
        ];
    }
}
