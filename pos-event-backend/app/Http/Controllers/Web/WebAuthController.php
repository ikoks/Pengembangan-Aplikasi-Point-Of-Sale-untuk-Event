<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\WebLoginRequest;
use App\Models\Admin;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

/**
 * WebAuthController — Tiket: POS-1
 *
 * Menangani autentikasi Admin melalui antarmuka web (browser).
 * Menggunakan mekanisme Session/Cookie bawaan Laravel (Web Guard).
 *
 * Alur:
 *   1. Admin mengakses halaman login → showLoginForm()
 *   2. Admin mengirim form → login()
 *   3. Admin menekan tombol logout → logout()
 */
class WebAuthController extends Controller
{
    public function __construct(protected AuditLogService $auditLogService)
    {
    }

    /**
     * Menampilkan halaman form login Admin.
     * Jika admin sudah terautentikasi, redirect ke dashboard.
     */
    public function showLoginForm(): View|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        return view('auth.login');
    }

    /**
     * Memproses request login Admin dari form.
     *
     * Langkah-langkah:
     *   1. Validasi input (dijalankan oleh WebLoginRequest).
     *   2. Cari user berdasarkan username di tabel `admins`.
     *   3. Verifikasi status_aktif = true.
     *   4. Verifikasi password menggunakan Hash::check().
     *   5. Jika semua valid, buat sesi login dan redirect ke dashboard.
     *
     * @param  WebLoginRequest $request  Input yang sudah divalidasi.
     */
    public function login(WebLoginRequest $request): RedirectResponse
    {
        // Cari user berdasarkan username
        $user = Admin::with('role')
            ->where('username', $request->username)
            ->first();

        // Validasi keberadaan user, status aktif, dan kecocokan password
        if (
            ! $user ||
            ! $user->status_aktif ||
            ! Hash::check($request->password, $user->password_hash)
        ) {
            $this->auditLogService->log(
                aktivitas: 'LOGIN_FAILED',
                tabelTarget: 'admins',
                idTarget: $user ? $user->id_admin : 'UNKNOWN',
                dataSebelum: ['username_attempt' => $request->username],
                request: $request
            );

            return back()
                ->withInput($request->only('username'))
                ->withErrors(['username' => 'Username atau password tidak valid, atau akun tidak aktif.']);
        }

        // Login manual menggunakan Web Guard (membuat sesi)
        Auth::guard('admin')->login($user, $request->boolean('remember'));

        // Catat ke Audit Log
        $this->auditLogService->log(
            aktivitas: 'LOGIN_WEB',
            tabelTarget: 'admins',
            idTarget: $user->id_admin,
            dataSesudah: [
                'username'  => $user->username,
                'nama_admin' => $user->nama_admin,
                'role'      => $user->role?->nama_role,
            ],
            request: $request
        );

        // Regenerasi session ID untuk mencegah Session Fixation Attack
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'))
            ->with('success', 'Selamat datang, ' . $user->nama_admin . '!');
    }

    /**
     * Menghapus sesi login Admin (logout).
     * Invalidasi sesi dan regenerasi CSRF token untuk keamanan.
     */
    public function logout(Request $request): RedirectResponse
    {
        /** @var Admin|null $user */
        $user = Auth::guard('admin')->user();

        if ($user) {
            $this->auditLogService->log(
                aktivitas: 'LOGOUT_WEB',
                tabelTarget: 'admins',
                idTarget: $user->id_admin,
                dataSebelum: [
                    'username'  => $user->username,
                    'nama_admin' => $user->nama_admin,
                ],
                request: $request
            );
        }

        Auth::guard('admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')
            ->with('success', 'Anda berhasil keluar dari sistem.');
    }
}
