<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\ShiftSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\AuditLogService;

/**
 * AdminOtpController
 *
 * [Poin 8] Disederhanakan: OTP kini hanya terikat ke Sesi Shift yang sedang aktif.
 * Admin cukup memilih No. Shift yang sedang berjalan — kasir, cabang, dan sales mode
 * diambil otomatis dari data shift tersebut.
 */
class AdminOtpController extends Controller
{
    protected $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Helper: expire OTP lama yang sudah melewati batas waktu.
     */
    private function expireOldOtps(): void
    {
        OtpCode::where('status', 'active')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);
    }

    /**
     * Tampilkan halaman UI Generator OTP dan riwayat OTP.
     */
    public function index()
    {
        $this->expireOldOtps();

        $userId = Auth::id();

        // Ambil OTP active milik admin ini (jika ada)
        $activeOtp = OtpCode::with(['shiftSession.kasir', 'shiftSession.cabang', 'shiftSession.salesMode'])
            ->where('id_admin', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->latest()
            ->first();

        // Ambil 10 riwayat terakhir
        $historyOtps = OtpCode::with(['admin', 'shiftSession.kasir', 'shiftSession.cabang', 'shiftSession.salesMode'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // [Poin 8] Daftar shift yang sedang aktif (OPEN / ON_BREAK)
        $activeShifts = ShiftSession::with(['kasir', 'cabang', 'salesMode'])
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->orderBy('waktu_mulai', 'desc')
            ->get();

        return view('admin.otp.index', compact(
            'activeOtp', 'historyOtps', 'activeShifts'
        ));
    }

    /**
     * AJAX: Kembalikan daftar shift aktif saat ini (untuk refresh dropdown).
     */
    public function activeShifts()
    {
        $this->expireOldOtps();

        $shifts = ShiftSession::with(['kasir', 'cabang', 'salesMode'])
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->orderBy('waktu_mulai', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id_shift'    => $s->id_shift,
                'label'       => ($s->kasir->nama_kasir ?? '-') . ' — ' . ($s->cabang->nama_cabang ?? '-') . ' (' . ($s->salesMode->nama_mode ?? '-') . ')',
                'kasir'       => $s->kasir->nama_kasir ?? '-',
                'cabang'      => $s->cabang->nama_cabang ?? '-',
                'sales_mode'  => $s->salesMode->nama_mode ?? '-',
                'waktu_mulai' => $s->waktu_mulai?->format('H:i d/m/Y'),
                'status'      => $s->status_shift,
            ]);

        return response()->json(['success' => true, 'data' => $shifts]);
    }

    /**
     * [Poin 8] Generate OTP 6-digit baru, terikat ke sesi shift aktif.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'id_shift' => ['required', 'string', 'size:36', 'exists:shift_session,id_shift'],
        ]);

        $userId = Auth::id();

        // Ambil data shift untuk mengisi target OTP
        $shift = ShiftSession::with(['kasir', 'cabang', 'salesMode'])
            ->where('id_shift', $validated['id_shift'])
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->first();

        if (!$shift) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi shift tidak ditemukan atau tidak aktif.',
            ], 422);
        }

        // Expire semua OTP aktif milik admin ini sebelum generate yang baru
        OtpCode::where('id_admin', $userId)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        // Generate 6 random digits
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Buat record OTP baru
        $otp = OtpCode::create([
            'id_admin'   => $userId,
            'id_shift'   => $shift->id_shift,             // [Poin 8] Terikat ke shift
            'id_kasir'   => $shift->id_kasir_aktif ?? $shift->id_kasir, // Backward compat
            'id_cabang'  => $shift->id_cabang,            // Backward compat
            'id_sales'   => $shift->id_sales,             // Backward compat
            'otp_code'   => $code,
            'status'     => 'active',
            'expires_at' => now()->addMinute(),
            'used_at'    => null,
        ]);

        $otp->load(['shiftSession.kasir', 'shiftSession.cabang', 'shiftSession.salesMode']);

        $this->auditLogService->log(
            'Generate Kode OTP Void (Shift-Bound)',
            'otp_codes',
            $otp->id_otp,
            $userId,
            null,
            [
                'otp_code'       => $otp->otp_code,
                'target_shift'   => $otp->id_shift,
                'target_kasir'   => $shift->kasir?->nama_kasir,
                'target_cabang'  => $shift->cabang?->nama_cabang,
                'target_sales'   => $shift->salesMode?->nama_mode,
                'expires_at'     => $otp->expires_at,
            ],
            $request
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP berhasil digenerate',
            'data'    => [
                'id'                 => $otp->id_otp,
                'otp_code'           => $otp->otp_code,
                'expires_at'         => $otp->expires_at->toIso8601String(),
                'expires_in_seconds' => 60,
                'status'             => $otp->status,
                'target_kasir'       => $shift->kasir?->nama_kasir,
                'target_cabang'      => $shift->cabang?->nama_cabang,
                'target_sales'       => $shift->salesMode?->nama_mode,
            ],
        ]);
    }

    /**
     * Polling endpoint untuk mengecek status list OTP dan refresh tabel riwayat.
     */
    public function checkStatus(Request $request)
    {
        $this->expireOldOtps();

        $historyOtps = OtpCode::with(['admin', 'shiftSession.kasir', 'shiftSession.cabang', 'shiftSession.salesMode'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $html = view('admin.otp.partials.table', compact('historyOtps'))->render();

        $userId    = Auth::id();
        $activeOtp = OtpCode::with(['shiftSession.kasir', 'shiftSession.cabang', 'shiftSession.salesMode'])
            ->where('id_admin', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->latest()
            ->first();

        return response()->json([
            'success'    => true,
            'html'       => $html,
            'active_otp' => $activeOtp ? [
                'id'         => $activeOtp->id_otp,
                'status'     => $activeOtp->status,
                'expires_at' => $activeOtp->expires_at->toIso8601String(),
            ] : null,
        ]);
    }
}
