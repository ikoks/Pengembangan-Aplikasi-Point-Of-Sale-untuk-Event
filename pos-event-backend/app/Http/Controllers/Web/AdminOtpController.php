<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Str;
use App\Services\AuditLogService;

class AdminOtpController extends Controller
{
    protected $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Helper untuk meng-expire-kan OTP dan mencatat log
     */
    private function expireOldOtps($userId = null)
    {
        $query = OtpCode::where('status', 'active');
        
        if ($userId) {
            $query->where('id_user', $userId);
        } else {
            $query->where('expires_at', '<', now());
        }

        $otpsToExpire = $query->get();

        foreach ($otpsToExpire as $otp) {
            $dataSebelum = $otp->toArray();
            $otp->status = 'expired';
            $otp->save();
            
            $this->auditLogService->log(
                'Status OTP Expired',
                'otp_codes',
                $otp->id_otp,
                Auth::id() ?? $otp->id_user,
                $dataSebelum,
                $otp->toArray(),
                request()
            );
        }
    }

    /**
     * Tampilkan halaman UI Generator OTP dan riwayat OTP
     */
    public function index()
    {
        $userId = Auth::id();

        // Expire-kan OTP yang sudah melewati batas waktu tapi statusnya masih active (Cleanup)
        $this->expireOldOtps();

        // Ambil OTP active saat ini (jika ada)
        $activeOtp = OtpCode::where('id_user', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->first();

        // Ambil 10 riwayat terakhir
        $historyOtps = OtpCode::with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return view('admin.otp.index', compact('activeOtp', 'historyOtps'));
    }

    /**
     * Buat kode OTP 6-digit baru dan expire-kan yang lama
     */
    public function generate(Request $request)
    {
        $userId = Auth::id();

        // Set semua OTP active milik user ini menjadi expired
        $this->expireOldOtps($userId);

        // Generate 6 random digits
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Buat record OTP baru
        $otp = OtpCode::create([
            'id_user' => $userId,
            'otp_code' => $code,
            'status' => 'active',
            'expires_at' => now()->addMinute(),
            'used_at' => null,
        ]);

        $this->auditLogService->log(
            'Generate Kode OTP Void',
            'otp_codes',
            $otp->id_otp,
            $userId,
            null,
            $otp->toArray(),
            $request
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP berhasil digenerate',
            'data' => [
                'id' => $otp->id_otp,
                'otp_code' => $otp->otp_code,
                'expires_at' => $otp->expires_at->toIso8601String(),
                'expires_in_seconds' => 60,
                'status' => $otp->status,
            ]
        ]);
    }

    /**
     * Polling endpoint untuk mengecek status list OTP
     */
    public function checkStatus(Request $request)
    {
        // Expire-kan OTP yang sudah lewat waktunya
        $this->expireOldOtps();

        $historyOtps = OtpCode::with('user')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
            
        // Render ulang partial view untuk tabel (jika menggunakan turbo/ajax html)
        // Atau kembalikan JSON
        
        $html = view('admin.otp.partials.table', compact('historyOtps'))->render();
        
        // Kita juga bisa return status active otp saat ini kalau dibutuhkan UI
        $userId = Auth::id();
        $activeOtp = OtpCode::where('id_user', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->first();

        return response()->json([
            'success' => true,
            'html' => $html,
            'active_otp' => $activeOtp ? [
                'id' => $activeOtp->id_otp,
                'status' => $activeOtp->status,
                'expires_at' => $activeOtp->expires_at->toIso8601String(),
            ] : null,
        ]);
    }
}
