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
        'id_user',
        'otp_code',
        'status',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * Get the user that owns the OTP code.
     */
    public function user()
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }

    /**
     * Get the prunable model query.
     * Otomatis hapus OTP yang usianya lebih dari 3 hari.
     */
    public function prunable()
    {
        return static::where('created_at', '<', now()->subDays(3));
    }
}
