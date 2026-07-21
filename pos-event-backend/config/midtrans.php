<?php

/*
|--------------------------------------------------------------------------
| Konfigurasi Midtrans Payment Gateway
|--------------------------------------------------------------------------
|
| File ini mendefinisikan seluruh konfigurasi yang dibutuhkan untuk
| berkomunikasi dengan API Midtrans (Sandbox & Production).
|
| Seluruh nilai sensitif WAJIB diatur melalui file .env — JANGAN pernah
| meng-hardcode Server Key atau Client Key langsung di file ini.
|
| Referensi Dokumen: SDD Bab V — Payment Gateway Integration
| Tiket JIRA      : POS-10A, POS-11
|
*/

return [

    /*
    |--------------------------------------------------------------------------
    | Server Key
    |--------------------------------------------------------------------------
    |
    | Digunakan untuk otentikasi server-to-server (Basic Auth) pada setiap
    | request ke Midtrans Core API (charge, status, dll).
    | Format: Basic Auth → username = server_key, password = '' (kosong)
    |
    */
    'server_key' => env('MIDTRANS_SERVER_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Client Key
    |--------------------------------------------------------------------------
    |
    | Digunakan di sisi frontend/mobile (JavaScript / Flutter) untuk
    | tokenisasi kartu atau inisiasi Snap. Tidak digunakan di backend.
    |
    */
    'client_key' => env('MIDTRANS_CLIENT_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Mode Production vs Sandbox
    |--------------------------------------------------------------------------
    |
    | false → Sandbox (untuk development & testing lokal)
    | true  → Production (deployment ke lingkungan produksi nyata)
    |
    | URL API akan disesuaikan secara otomatis berdasarkan nilai ini.
    |
    */
    'is_production' => env('MIDTRANS_IS_PRODUCTION', false),

    /*
    |--------------------------------------------------------------------------
    | Sanitized Mode
    |--------------------------------------------------------------------------
    |
    | Jika true, Midtrans akan menghapus karakter spesial berbahaya
    | dari nilai string yang dikirim (XSS prevention).
    |
    */
    'is_sanitized' => env('MIDTRANS_IS_SANITIZED', true),

    /*
    |--------------------------------------------------------------------------
    | 3DS (Three-Domain Secure)
    |--------------------------------------------------------------------------
    |
    | Aktifkan 3DS untuk pembayaran kartu kredit guna meningkatkan keamanan.
    | Tidak berdampak pada QRIS.
    |
    */
    'is_3ds' => env('MIDTRANS_IS_3DS', true),

    /*
    |--------------------------------------------------------------------------
    | Base URL API
    |--------------------------------------------------------------------------
    |
    | URL endpoint Midtrans Core API berbeda antara Sandbox dan Production.
    | Tidak perlu mengubah ini secara manual — gunakan `is_production` di atas.
    |
    */
    'base_url' => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com',

    /*
    |--------------------------------------------------------------------------
    | QRIS Configuration
    |--------------------------------------------------------------------------
    |
    | Partner acquirer untuk transaksi QRIS dinamis.
    | Nilai yang didukung: 'gopay', 'airpay shopee'
    |
    */
    'qris_acquirer' => env('MIDTRANS_QRIS_ACQUIRER', 'gopay'),

    /*
    |--------------------------------------------------------------------------
    | Expiry QRIS (dalam menit)
    |--------------------------------------------------------------------------
    |
    | Waktu kadaluwarsa QR Code yang di-generate. Setelah melewati waktu ini,
    | pembayaran tidak dapat dilakukan dan transaksi akan menjadi 'Cancelled'.
    |
    */
    'qris_expiry_minutes' => env('MIDTRANS_QRIS_EXPIRY_MINUTES', 15),

];
