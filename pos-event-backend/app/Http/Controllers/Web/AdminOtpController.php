<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\OtpCode;
use App\Models\SalesMode;
use App\Models\UserModel;
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
     * Helper: expire OTP lama yang sudah melewati batas waktu (status cleanup).
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
        $activeOtp = OtpCode::with(['kasir', 'cabang', 'salesMode'])
            ->where('id_user', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->latest()
            ->first();

        // Ambil 10 riwayat terakhir
        $historyOtps = OtpCode::with(['user', 'kasir', 'cabang', 'salesMode'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        // Data untuk dropdown form
        $cabangs    = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        $kasirs     = UserModel::whereHas('role', fn ($q) => $q->where('nama_role', 'Kasir'))
            ->where('status_aktif', true)
            ->whereNull('deleted_at')
            ->orderBy('nama_user')
            ->get();

        return view('admin.otp.index', compact(
            'activeOtp', 'historyOtps', 'cabangs', 'salesModes', 'kasirs'
        ));
    }

    /**
     * AJAX: Ambil daftar kasir berdasarkan cabang (untuk dropdown dinamis).
     */
    public function kasirByCabang(Request $request)
    {
        $idCabang = $request->query('id_cabang');

        $query = UserModel::whereHas('role', fn ($q) => $q->where('nama_role', 'Kasir'))
            ->where('status_aktif', true)
            ->whereNull('deleted_at')
            ->orderBy('nama_user');

        if ($idCabang) {
            $query->where('id_cabang', $idCabang);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn ($k) => [
                'id_user'   => $k->id_user,
                'nama_user' => $k->nama_user,
            ]),
        ]);
    }

    /**
     * Generate OTP 6-digit baru, terikat ke target kasir/cabang/sales.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'id_kasir'  => ['required', 'string', 'size:36', 'exists:user,id_user'],
            'id_cabang' => ['required', 'string', 'size:36', 'exists:cabang,id_cabang'],
            'id_sales'  => ['required', 'string', 'size:36', 'exists:sales_mode,id_sales'],
        ]);

        $userId = Auth::id();

        // Expire semua OTP aktif milik admin ini sebelum generate yang baru
        OtpCode::where('id_user', $userId)
            ->where('status', 'active')
            ->update(['status' => 'expired']);

        // Generate 6 random digits
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Buat record OTP baru dengan data target
        $otp = OtpCode::create([
            'id_user'   => $userId,
            'id_kasir'  => $validated['id_kasir'],
            'id_cabang' => $validated['id_cabang'],
            'id_sales'  => $validated['id_sales'],
            'otp_code'  => $code,
            'status'    => 'active',
            'expires_at'=> now()->addMinute(),
            'used_at'   => null,
        ]);

        $otp->load(['kasir', 'cabang', 'salesMode']);

        $this->auditLogService->log(
            'Generate Kode OTP Void (Target-Bound)',
            'otp_codes',
            $otp->id_otp,
            $userId,
            null,
            [
                'otp_code'       => $otp->otp_code,
                'target_kasir'   => $otp->kasir?->nama_user,
                'target_cabang'  => $otp->cabang?->nama_cabang,
                'target_sales'   => $otp->salesMode?->nama_mode,
                'expires_at'     => $otp->expires_at,
            ],
            $request
        );

        return response()->json([
            'success' => true,
            'message' => 'OTP berhasil digenerate',
            'data' => [
                'id'              => $otp->id_otp,
                'otp_code'        => $otp->otp_code,
                'expires_at'      => $otp->expires_at->toIso8601String(),
                'expires_in_seconds' => 60,
                'status'          => $otp->status,
                'target_kasir'    => $otp->kasir?->nama_user,
                'target_cabang'   => $otp->cabang?->nama_cabang,
                'target_sales'    => $otp->salesMode?->nama_mode,
            ]
        ]);
    }

    /**
     * Polling endpoint untuk mengecek status list OTP dan refresh tabel riwayat.
     */
    public function checkStatus(Request $request)
    {
        $this->expireOldOtps();

        $historyOtps = OtpCode::with(['user', 'kasir', 'cabang', 'salesMode'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $html = view('admin.otp.partials.table', compact('historyOtps'))->render();

        $userId    = Auth::id();
        $activeOtp = OtpCode::with(['kasir', 'cabang', 'salesMode'])
            ->where('id_user', $userId)
            ->where('status', 'active')
            ->where('expires_at', '>=', now())
            ->latest()
            ->first();

        return response()->json([
            'success'    => true,
            'html'       => $html,
            'active_otp' => $activeOtp ? [
                'id'        => $activeOtp->id_otp,
                'status'    => $activeOtp->status,
                'expires_at'=> $activeOtp->expires_at->toIso8601String(),
            ] : null,
        ]);
    }
}
