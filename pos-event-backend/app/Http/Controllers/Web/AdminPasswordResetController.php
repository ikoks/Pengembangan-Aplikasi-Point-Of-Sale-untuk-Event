<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * AdminPasswordResetController — Poin 10
 *
 * Mengelola alur Lupa Password untuk akun Admin:
 *   1. Tampilkan form input email
 *   2. Generate token → simpan ke password_reset_tokens → kirim email
 *   3. Tampilkan form password baru (dari link di email)
 *   4. Validasi token → reset password → hapus token → redirect login
 */
class AdminPasswordResetController extends Controller
{
    /**
     * Tampilkan halaman form "Lupa Password".
     */
    public function showForgotForm()
    {
        return view('auth.forgot-password');
    }

    /**
     * Proses permintaan reset password — kirim email jika email ditemukan.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = $request->input('email');
        $user  = Admin::where('email', $email)->first();

        // Selalu tampilkan pesan sukses (security: jangan ekspos apakah email terdaftar)
        if (!$user) {
            return back()->with('status', 'Jika email tersebut terdaftar, kami telah mengirim tautan reset password.');
        }

        // Hapus token lama untuk email ini
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Buat token baru (60 karakter)
        $token = Str::random(64);

        // Simpan ke password_reset_tokens
        DB::table('password_reset_tokens')->insert([
            'email'      => $email,
            'token'      => Hash::make($token),
            'created_at' => now(),
        ]);

        // Kirim email
        $resetUrl = route('admin.password.reset.form', ['token' => $token, 'email' => $email]);

        Mail::send('emails.admin-reset-password', [
            'user'     => $user,
            'resetUrl' => $resetUrl,
        ], function ($message) use ($email, $user) {
            $message->to($email, $user->nama_admin)
                    ->subject('Reset Password — Admin POS Event');
        });

        return back()->with('status', 'Tautan reset password telah dikirim ke email Anda. Tautan berlaku selama 60 menit.');
    }

    /**
     * Tampilkan halaman form "Reset Password" (dari tautan di email).
     */
    public function showResetForm(Request $request, string $token)
    {
        return view('auth.reset-password', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    /**
     * Proses reset password baru.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => ['required'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required'],
        ]);

        // Ambil record token dari DB
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return back()->withErrors(['email' => 'Token tidak valid atau sudah kedaluwarsa.'])->withInput();
        }

        // Cek apakah token sudah expired (60 menit)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return back()->withErrors(['email' => 'Tautan reset password sudah kedaluwarsa. Silakan minta ulang.'])->withInput();
        }

        // Update password user
        $user = Admin::where('email', $request->email)->first();
        if (!$user) {
            return back()->withErrors(['email' => 'Email tidak ditemukan.'])->withInput();
        }

        $user->update(['password_hash' => Hash::make($request->password)]);

        // Hapus token setelah digunakan
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return redirect()->route('admin.login')->with('status', 'Password berhasil diubah! Silakan login dengan password baru Anda.');
    }
}
