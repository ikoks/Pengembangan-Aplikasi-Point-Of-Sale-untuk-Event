<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Cabang
 *
 * Merepresentasikan tabel `cabang` yang menyimpan data
 * setiap cabang atau lokasi event yang terdaftar.
 *
 * Menggunakan SoftDeletes untuk memastikan data historis transaksi
 * tidak terputus ketika sebuah cabang "dihapus" dari sistem.
 *
 * @property string          $id_cabang        UUID v4 sebagai primary key.
 * @property string          $nama_cabang      Nama cabang event.
 * @property float|null      $pajak_persen     Persentase pajak (null = tanpa pajak). [Poin 4]
 * @property string          $lokasi           Alamat atau keterangan lokasi.
 * @property string|null     $qr_static_payload Payload QR Code statis cabang. [Poin 5]
 * @property \Carbon\Carbon|null $deleted_at   Timestamp soft delete.
 */
class Cabang extends Model
{
    use HasUuid, SoftDeletes;

    /** Nama tabel di database */
    protected $table = 'cabang';

    /** Primary key menggunakan UUID string, bukan auto-increment integer */
    protected $primaryKey = 'id_cabang';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_cabang',
        'id_sales',
        'nama_cabang',
        'pajak_persen',
        'lokasi',
        'qr_static_payload',
        'qr_static_token',
        'status',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'pajak_persen' => 'decimal:2', // null-safe, tidak ada default
        'deleted_at'   => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Relasi ke SalesMode
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }

    /**
     * Satu cabang dapat memiliki banyak kasir.
     * [Cabang] 1 --< [Kasir]
     */
    public function kasirs(): HasMany
    {
        return $this->hasMany(Kasir::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Satu cabang dapat memiliki banyak admin.
     * [Cabang] 1 --< [Admin]
     */
    public function admins(): HasMany
    {
        return $this->hasMany(Admin::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Satu cabang memiliki banyak sesi shift kasir yang berlangsung di dalamnya.
     * [Cabang] 1 --< [ShiftSession]
     */
    public function shiftSessions(): HasMany
    {
        return $this->hasMany(ShiftSession::class, 'id_cabang', 'id_cabang');
    }
}
