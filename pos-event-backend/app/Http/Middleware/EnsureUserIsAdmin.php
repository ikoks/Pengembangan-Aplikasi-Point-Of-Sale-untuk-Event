<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Middleware Proteksi Khusus Role Admin
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user->relationLoaded('role')) {
            $user->load('role');
        }

        if ($user->role?->nama_role !== 'Admin') {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Akses ditolak. Hanya Administrator yang diizinkan melakukan operasi ini.',
                    'data'    => null,
                ], Response::HTTP_FORBIDDEN);
            }

            return redirect()->route('admin.dashboard')->with('error', 'Akses ditolak. Anda bukan Administrator.');
        }

        return $next($request);
    }
}
