<?php

namespace App\Http\Requests\Web;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePegawaiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Route parameter 'id' for kasir/admin
        $userId = $this->route('id');

        return [
            'nama_user' => ['required', 'string', 'max:100'],
            'username' => [
                'required', 
                'string', 
                'max:50', 
                Rule::unique('user')->ignore($userId, 'id_user')
            ],
            'password' => ['nullable', 'string', 'min:6'], // opsional saat update
            'id_cabang' => ['nullable', 'string', 'exists:cabang,id_cabang'],
        ];
    }
}
