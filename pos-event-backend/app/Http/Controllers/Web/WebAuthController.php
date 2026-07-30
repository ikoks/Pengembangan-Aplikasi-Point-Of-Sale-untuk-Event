<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\WebLoginRequest;
use App\Models\UserModel;
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
        if (Auth::check()) {
            return redirect()->route('admin.dashboard');
        }

        return view('auth.login');
    }

    /**
     * Memproses request login Admin dari form.
     *
     * Langkah-langkah:
     *   1. Validasi input (dijalankan oleh WebLoginRequest).
     *   2. Cari user berdasarkan username di tabel `user`.
     *   3. Verifikasi bahwa user adalah Admin dan status_aktif = true.
     *   4. Verifikasi password menggunakan Hash::check().
     *   5. Jika semua valid, buat sesi login dan redirect ke dashboard.
     *
     * @param  WebLoginRequest $request  Input yang sudah divalidasi.
     */
    public function login(WebLoginRequest $request): RedirectResponse
    {
        // Cari user berdasarkan username
        $user = UserModel::with('role')
            ->where('username', $request->username)
            ->first();

        // Validasi keberadaan user, role Admin, status aktif, dan kecocokan password
        if (
            ! $user ||
            $user->role?->nama_role !== 'Admin' ||
            ! $user->status_aktif ||
            ! Hash::check($request->password, $user->password_hash)
        ) {
            $this->auditLogService->log(
                aktivitas: 'LOGIN_FAILED',
                tabelTarget: 'user',
                idTarget: $user ? $user->id_user : 'UNKNOWN',
                idUserAktor: $user ? $user->id_user : null,
                dataSebelum: ['username_attempt' => $request->username],
                request: $request
            );

            return back()
                ->withInput($request->only('username'))
                ->withErrors(['username' => 'Username atau password tidak valid, atau akun tidak aktif.']);
        }

        // Login manual menggunakan Web Guard (membuat sesi)
        Auth::login($user, $request->boolean('remember'));

        // Catat ke Audit Log
        $this->auditLogService->log(
            aktivitas: 'LOGIN_WEB',
            tabelTarget: 'user',
            idTarget: $user->id_user,
            idUserAktor: $user->id_user,
            dataSesudah: [
                'username'  => $user->username,
                'nama_user' => $user->nama_user,
                'role'      => $user->role?->nama_role,
            ],
            request: $request
        );

        // Regenerasi session ID untuk mencegah Session Fixation Attack
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'))
            ->with('success', 'Selamat datang, ' . $user->nama_user . '!');
    }

    /**
     * Menghapus sesi login Admin (logout).
     * Invalidasi sesi dan regenerasi CSRF token untuk keamanan.
     */
    public function logout(Request $request): RedirectResponse
    {
        /** @var UserModel|null $user */
        $user = Auth::user();

        if ($user) {
            $this->auditLogService->log(
                aktivitas: 'LOGOUT_WEB',
                tabelTarget: 'user',
                idTarget: $user->id_user,
                idUserAktor: $user->id_user,
                dataSebelum: [
                    'username'  => $user->username,
                    'nama_user' => $user->nama_user,
                ],
                request: $request
            );
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')
            ->with('success', 'Anda berhasil keluar dari sistem.');
    }
}
