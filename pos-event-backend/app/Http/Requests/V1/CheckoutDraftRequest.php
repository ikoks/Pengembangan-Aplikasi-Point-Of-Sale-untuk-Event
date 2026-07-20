<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * CheckoutDraftRequest
 *
 * Validasi input untuk endpoint pembuatan draft transaksi.
 * (POS Hari ke-4 — Checkout Draft Transaksi)
 *
 * Mendukung dua skenario penggunaan:
 *
 * 1. ONLINE MODE:
 *    `id_transaksi` tidak perlu dikirim. Server akan membuat UUID baru
 *    melalui Trait HasUuid secara otomatis.
 *
 * 2. OFFLINE / SYNC MODE:
 *    Aplikasi mobile men-generate UUID lokal saat offline dan menyimpannya
 *    di perangkat. Saat koneksi pulih, UUID tersebut dikirim sebagai
 *    `id_transaksi` agar SyncManager tidak membuat duplikat transaksi
 *    (idempotency support sesuai SDD Bab I.2).
 *
 * Struktur Input Utama:
 *   - Header transaksi (shift, cabang, sales, metode, promo, pelanggan)
 *   - Array `items[]` berisi setiap item yang dipesan
 */
class CheckoutDraftRequest extends FormRequest
{
    /**
     * Endpoint ini diakses oleh kasir yang sudah terautentikasi via Sanctum.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi untuk setiap field input.
     *
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            // ================================================================
            // ID TRANSAKSI (Opsional — untuk dukungan offline-sync)
            // Jika dikirim, harus berupa UUID v4 yang valid.
            // Jika tidak dikirim (null), Trait HasUuid akan membuatkan baru.
            // ================================================================
            'id_transaksi'          => ['nullable', 'uuid'],

            // ================================================================
            // FK HEADER TRANSAKSI — Semuanya wajib dan harus ada di database
            // ================================================================
            'id_shift'              => ['required', 'uuid', 'exists:shift_session,id_shift'],
            'id_cabang'             => ['required', 'uuid', 'exists:cabang,id_cabang'],
            'id_sales'              => ['required', 'uuid', 'exists:sales_mode,id_sales'],
            'id_metode'             => ['required', 'uuid', 'exists:metode_pembayaran,id_metode'],

            // Promosi level transaksi (opsional)
            'id_promo'              => ['nullable', 'uuid', 'exists:promosi,id_promo'],

            // Nama pelanggan opsional (untuk kebutuhan cetak struk)
            'nama_pelanggan'        => ['nullable', 'string', 'max:100'],

            // ================================================================
            // ARRAY ITEMS — Minimal 1 item wajib ada dalam transaksi
            // ================================================================
            'items'                 => ['required', 'array', 'min:1'],
            'items.*.id_produk'     => ['required', 'uuid', 'exists:menu,id_menu'],
            'items.*.harga_produk'  => ['nullable', 'numeric', 'min:0'],
            'items.*.quantity'      => ['required', 'integer', 'min:1'],

            // Promosi per item (opsional — untuk promosi 'per_item')
            'items.*.id_promo'      => ['nullable', 'uuid', 'exists:promosi,id_promo'],
            'items.*.nominal_promo' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Pesan validasi dalam Bahasa Indonesia yang ramah pengguna.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // ID Transaksi
            'id_transaksi.uuid'           => 'Format ID transaksi tidak valid, harus berupa UUID v4.',

            // FK Header
            'id_shift.required'           => 'ID sesi shift wajib disertakan.',
            'id_shift.uuid'               => 'Format ID shift tidak valid.',
            'id_shift.exists'             => 'Sesi shift yang dikirim tidak ditemukan dalam sistem.',
            'id_cabang.required'          => 'ID cabang wajib disertakan.',
            'id_cabang.uuid'              => 'Format ID cabang tidak valid.',
            'id_cabang.exists'            => 'Cabang yang dikirim tidak ditemukan dalam sistem.',
            'id_sales.required'           => 'ID sales mode wajib disertakan.',
            'id_sales.uuid'               => 'Format ID sales mode tidak valid.',
            'id_sales.exists'             => 'Sales mode yang dikirim tidak ditemukan dalam sistem.',
            'id_metode.required'          => 'Metode pembayaran wajib dipilih.',
            'id_metode.uuid'              => 'Format ID metode pembayaran tidak valid.',
            'id_metode.exists'            => 'Metode pembayaran yang dipilih tidak ditemukan dalam sistem.',
            'id_promo.uuid'               => 'Format ID promosi tidak valid.',
            'id_promo.exists'             => 'Promosi yang dipilih tidak ditemukan dalam sistem.',
            'nama_pelanggan.max'          => 'Nama pelanggan tidak boleh lebih dari 100 karakter.',

            // Items
            'items.required'              => 'Transaksi harus memiliki minimal 1 item.',
            'items.array'                 => 'Format data items tidak valid.',
            'items.min'                   => 'Transaksi harus memiliki minimal 1 item.',
            'items.*.id_produk.required'  => 'Setiap item harus memiliki ID produk.',
            'items.*.id_produk.uuid'      => 'Format ID produk pada item tidak valid.',
            'items.*.id_produk.exists'    => 'Produk pada salah satu item tidak ditemukan dalam katalog.',
            'items.*.harga_produk.required' => 'Harga produk pada setiap item wajib diisi.',
            'items.*.harga_produk.numeric'  => 'Harga produk harus berupa angka.',
            'items.*.harga_produk.min'      => 'Harga produk tidak boleh bernilai negatif.',
            'items.*.quantity.required'   => 'Jumlah (quantity) setiap item wajib diisi.',
            'items.*.quantity.integer'    => 'Quantity harus berupa bilangan bulat.',
            'items.*.quantity.min'        => 'Quantity minimal adalah 1.',
            'items.*.id_promo.uuid'       => 'Format ID promo item tidak valid.',
            'items.*.id_promo.exists'     => 'Promo pada salah satu item tidak ditemukan.',
            'items.*.nominal_promo.numeric' => 'Nominal promo item harus berupa angka.',
            'items.*.nominal_promo.min'   => 'Nominal promo tidak boleh negatif.',
        ];
    }
}
