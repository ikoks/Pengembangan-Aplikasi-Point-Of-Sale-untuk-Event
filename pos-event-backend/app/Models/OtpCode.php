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
        'id_user',    // Admin pembuat
        'id_kasir',   // Kasir target
        'id_cabang',  // Cabang target
        'id_sales',   // Sales Mode target
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
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }

    /**
     * Kasir yang menjadi target OTP ini.
     */
    public function kasir()
    {
        return $this->belongsTo(UserModel::class, 'id_kasir', 'id_user');
    }

    /**
     * Cabang yang menjadi target OTP ini.
     */
    public function cabang()
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Sales Mode yang menjadi target OTP ini.
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
