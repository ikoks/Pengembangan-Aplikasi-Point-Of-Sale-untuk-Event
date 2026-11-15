<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecurityHeadersMiddleware
 *
 * Menginjeksi security response headers esensial untuk melindungi
 * Web Admin dari serangan siber umum seperti:
 * 1. Clickjacking / UI Redressing (X-Frame-Options & CSP frame-ancestors)
 * 2. MIME-type sniffing (X-Content-Type-Options)
 * 3. Referrer leakage (Referrer-Policy)
 * 4. Unauthorized peripheral access (Permissions-Policy)
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Mencegah Clickjacking: melarang embedding halaman web admin di situs asing
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Mencegah browser menebak MIME-type selain dari Content-Type resmi
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Mengontrol header Referer agar tidak mengekspos token/parameter privat ke domain luar
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Nonaktifkan akses fitur perangkat hardware yang tidak dibutuhkan panel admin
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Content Security Policy untuk memperkuat proteksi pembatasan framing
        $response->headers->set('Content-Security-Policy', "frame-ancestors 'self'", false);

        return $response;
    }
}

