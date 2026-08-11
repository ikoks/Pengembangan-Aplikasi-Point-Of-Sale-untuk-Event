<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\MassPrunable;

class OtpCode extends Model
{
    use HasFactory, HasUuids, MassPrunable;

    protected $table = 'otp_codes';
    protected $primaryKey = 'id_otp';

    // UUID is primary key and is not incrementing
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id_admin',   // Admin pembuat
        'id_shift',   // [Poin 8] Sesi shift yang menjadi target OTP
        'id_kasir',   // Kasir target (legacy/backward-compat, nullable)
        'id_cabang',  // Cabang target (legacy/backward-compat, nullable)
        'id_sales',   // Sales Mode target (legacy/backward-compat, nullable)
        'otp_code',
        'status',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Admin yang membuat OTP ini.
     */
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'id_admin', 'id_admin');
    }

    /**
     * [Poin 8] Sesi shift yang menjadi target OTP ini.
     */
    public function shiftSession()
    {
        return $this->belongsTo(ShiftSession::class, 'id_shift', 'id_shift');
    }

    /**
     * Kasir yang menjadi target OTP ini (nullable — legacy).
     */
    public function kasir()
    {
        return $this->belongsTo(Kasir::class, 'id_kasir', 'id_kasir');
    }

    /**
     * Cabang yang menjadi target OTP ini (nullable — legacy).
     */
    public function cabang()
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Sales Mode yang menjadi target OTP ini (nullable — legacy).
     */
    public function salesMode()
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }

    // =========================================================================
    // PRUNING
    // =========================================================================

    /**
     * Get the prunable model query.
     * Otomatis hapus OTP yang usianya lebih dari 3 hari.
     */
    public function prunable()
    {
        return static::where('created_at', '<', now()->subDays(3));
    }
}
