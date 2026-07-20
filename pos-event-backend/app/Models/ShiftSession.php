<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model ShiftSession
 *
 * Merepresentasikan tabel `shift_session` yang menyimpan rekam jejak
 * setiap sesi kerja kasir dari awal (Opening) hingga akhir (Closing).
 *
 * Lifecycle Status Shift:
 *   OPEN     → Kasir aktif berjualan.
 *   ON_BREAK → Kasir sedang jeda / sesi diserahkan sementara.
 *   CLOSED   → Shift selesai, sudah dilakukan rekonsiliasi uang.
 *
 * Kolom Penting:
 *   - `id_user`       : Kasir yang pertama kali membuka shift (pembuat shift).
 *   - `id_user_aktif` : Kasir yang SEDANG memegang kendali POS saat ini
 *                       (bisa berbeda jika terjadi switch operator).
 *
 * @property string          $id_shift         UUID v4 sebagai primary key.
 * @property string          $id_user          FK ke user pembuat shift.
 * @property string|null     $id_user_aktif    FK ke user yang aktif saat ini.
 * @property string          $id_cabang        FK ke cabang tempat shift berlangsung.
 * @property string          $id_sales         FK ke sales mode yang digunakan.
 * @property \Carbon\Carbon  $waktu_mulai      Timestamp pembukaan shift.
 * @property \Carbon\Carbon|null $waktu_selesai Timestamp penutupan shift.
 * @property float           $modal_awal       Modal uang tunai saat opening.
 * @property float|null      $uang_fisik_akhir Uang fisik yang dihitung saat closing.
 * @property string          $status_shift     Status: OPEN | ON_BREAK | CLOSED.
 * @property float           $selisih_uang     Selisih antara ekspektasi vs fisik.
 */
class ShiftSession extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.14 SDD) */
    protected $table = 'shift_session';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_shift';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_user',
        'id_user_aktif',
        'id_cabang',
        'id_sales',
        'waktu_mulai',
        'waktu_selesai',
        'modal_awal',
        'uang_fisik_akhir',
        'status_shift',
        'selisih_uang',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'waktu_mulai'      => 'datetime',
        'waktu_selesai'    => 'datetime',
        'modal_awal'       => 'decimal:2',
        'uang_fisik_akhir' => 'decimal:2',
        'selisih_uang'     => 'decimal:2',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Kasir yang membuka dan memiliki shift ini (pemilik shift).
     * [ShiftSession] >-- [UserModel] via id_user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }

    /**
     * Kasir yang sedang aktif memegang kendali POS saat ini.
     * Dapat berbeda dengan pemilik shift jika terjadi switch operator.
     * [ShiftSession] >-- [UserModel] via id_user_aktif
     */
    public function userAktif(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'id_user_aktif', 'id_user');
    }

    /**
     * Cabang tempat shift ini berlangsung.
     * [ShiftSession] >-- [Cabang]
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Sales mode / kanal penjualan yang digunakan dalam shift ini.
     * [ShiftSession] >-- [SalesMode]
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }

    /**
     * Log jejak audit semua kejadian/aksi selama shift ini berlangsung.
     * [ShiftSession] 1 --< [ShiftOperatorLog]
     */
    public function operatorLogs(): HasMany
    {
        return $this->hasMany(ShiftOperatorLog::class, 'id_shift', 'id_shift');
    }

    /**
     * Semua transaksi yang terjadi dalam sesi shift ini.
     * [ShiftSession] 1 --< [Transaksi]
     */
    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class, 'id_shift', 'id_shift');
    }
}
