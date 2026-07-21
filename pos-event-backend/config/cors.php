<?php

/**
 * Konfigurasi CORS (Cross-Origin Resource Sharing) — POS Event
 *
 * File ini mengontrol kebijakan akses lintas-origin untuk seluruh request
 * yang masuk ke server backend Laravel.
 *
 * KONTEKS STAGING / PRODUKSI LAPANGAN:
 * Aplikasi Mobile Kasir (React Native) berjalan di perangkat HP yang
 * terhubung via jaringan Wi-Fi lokal pada area event (indoor venue).
 * Baik HP kasir maupun laptop server berada dalam subnet yang SAMA
 * (misalnya: 192.168.1.x), sehingga request dari HP ke server
 * dikategorikan sebagai Cross-Origin karena perbedaan port/protokol.
 *
 * KEBIJAKAN YANG DITERAPKAN (Staging/Lokal):
 * - Semua origin diizinkan ('*') karena dalam jaringan privat event.
 * - Semua method HTTP diizinkan agar API REST penuh dapat diakses.
 * - Semua header diizinkan termasuk Authorization (Bearer Token Sanctum).
 * - Credentials diizinkan untuk mendukung Sanctum cookie-based auth (web admin).
 *
 * CATATAN KEAMANAN PRODUKSI:
 * Untuk lingkungan produksi publik, ubah `allowed_origins` menjadi
 * domain/IP spesifik aplikasi frontend Anda.
 * Contoh: ['https://admin.posevent.com', 'capacitor://localhost']
 *
 * @see https://laravel.com/docs/11.x/sanctum#cors-and-cookies
 */
return [

    /*
    |--------------------------------------------------------------------------
    | Path yang Tunduk pada Kebijakan CORS
    |--------------------------------------------------------------------------
    | Tentukan pola URL yang akan diproses oleh middleware CORS.
    | - 'api/*'              → Semua endpoint API v1 (kasir lapangan via Sanctum Bearer)
    | - 'sanctum/csrf-cookie' → Endpoint pengambilan CSRF cookie (admin web panel)
    */
    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP Methods yang Diizinkan
    |--------------------------------------------------------------------------
    | Gunakan ['*'] untuk mengizinkan semua method: GET, POST, PUT, PATCH, DELETE, OPTIONS.
    | Pastikan OPTIONS tercakup agar preflight request dari browser/React Native tidak diblokir.
    */
    'allowed_methods' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Origin (Domain/IP) yang Diizinkan
    |--------------------------------------------------------------------------
    | ['*'] → Izinkan semua origin (digunakan saat staging lapangan di jaringan Wi-Fi event).
    |
    | Pola wildcard subdomain (allowed_origins_patterns) digunakan jika Anda
    | ingin izinkan semua subdomain dari domain tertentu:
    | Contoh: ['^https://.*\.posevent\.com$']
    */
    'allowed_origins' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Pola Origin Tambahan (Regex)
    |--------------------------------------------------------------------------
    | Kosongkan jika menggunakan wildcard '*' di atas.
    */
    'allowed_origins_patterns' => [],

    /*
    |--------------------------------------------------------------------------
    | Header yang Diizinkan dalam Request dari Client
    |--------------------------------------------------------------------------
    | ['*'] → Izinkan semua header termasuk:
    |   - Authorization: Bearer <token>  (Sanctum Token)
    |   - Content-Type: application/json
    |   - Accept: application/json
    |   - X-Requested-With: XMLHttpRequest
    */
    'allowed_headers' => ['*'],

    /*
    |--------------------------------------------------------------------------
    | Header yang Boleh Dibaca oleh Client dari Response
    |--------------------------------------------------------------------------
    | Biarkan kosong untuk menggunakan header standar browser.
    */
    'exposed_headers' => [],

    /*
    |--------------------------------------------------------------------------
    | Durasi Cache Preflight Request (dalam detik)
    |--------------------------------------------------------------------------
    | 0 = Tidak ada cache preflight (direkomendasikan untuk development).
    | Untuk produksi: gunakan 7200 (2 jam) untuk mengurangi preflight round-trip.
    */
    'max_age' => 0,

    /*
    |--------------------------------------------------------------------------
    | Izinkan Credentials (Cookies & Authorization Header)
    |--------------------------------------------------------------------------
    | Harus true agar:
    | - Admin web panel dapat menggunakan session-based auth (cookie).
    | - Sanctum dapat memvalidasi CSRF token via cookie pada web routes.
    |
    | CATATAN: Jika `supports_credentials` = true, maka `allowed_origins`
    | TIDAK BOLEH menggunakan wildcard '*' di produksi (harus domain spesifik).
    | Untuk staging lokal dengan wildcard, ini aman karena jaringan privat.
    */
    'supports_credentials' => true,

];
