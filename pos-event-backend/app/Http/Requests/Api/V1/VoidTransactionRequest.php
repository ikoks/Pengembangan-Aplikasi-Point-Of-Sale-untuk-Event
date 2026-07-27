<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * VoidTransactionRequest — POS-A-06 (Sprint 2)
 *
 * Validasi request void transaksi.
 *
 * Aturan berdasarkan status transaksi:
 *
 * 1. Status 'Draft' → tidak perlu kode_otp.
 *    Kasir boleh langsung membatalkan transaksi draft.
 *
 * 2. Status 'Success' → wajib kode_otp (6 digit).
 *    Server akan memvalidasi kode ke tabel otp_codes.
 *    Kode harus belum dipakai dan belum expired (TTL 1 menit).
 *
 * Validasi status (Draft vs Success) dilakukan di controller,
 * bukan di sini, karena memerlukan query ke DB.
 */
class VoidTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            /**
             * Kode OTP Admin 6 digit.
             * Nullable di level request — validasi wajib/tidaknya dilakukan
             * di controller berdasarkan status transaksi.
             *
             * Format: 6 karakter numerik (contoh: "042819")
             */
            'kode_otp' => ['nullable', 'string', 'size:6', 'regex:/^\d{6}$/'],

            /**
             * Alasan pembatalan/void.
             * Wajib diisi agar ada audit trail yang bermakna.
             */
            'alasan_batal' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'kode_otp.size'  => 'Kode OTP harus tepat 6 digit angka.',
            'kode_otp.regex' => 'Kode OTP hanya boleh berisi angka (0-9).',
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'kode_otp' => [
                'description' => 'Kode OTP 6 digit dari Admin (diperlukan hanya jika transaksi berstatus "Success"). Dapatkan kode dengan memanggil POST /otp/request-void terlebih dahulu.',
                'example'     => '042819',
            ],
            'alasan_batal' => [
                'description' => 'Alasan pembatalan atau void transaksi.',
                'example'     => 'Pelanggan membatalkan pesanan.',
            ],
        ];
    }
}
