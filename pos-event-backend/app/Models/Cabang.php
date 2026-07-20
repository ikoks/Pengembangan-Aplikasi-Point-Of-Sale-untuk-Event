<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Cabang
 *
 * Merepresentasikan tabel `cabang` yang menyimpan data
 * setiap cabang atau lokasi event yang terdaftar.
 *
 * Menggunakan SoftDeletes untuk memastikan data historis transaksi
 * tidak terputus ketika sebuah cabang "dihapus" dari sistem.
 *
 * @property string          $id_cabang    UUID v4 sebagai primary key.
 * @property string          $nama_cabang  Nama cabang event.
 * @property float           $pajak_persen Persentase pajak berlaku di cabang.
 * @property string          $lokasi       Alamat atau keterangan lokasi.
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
        'nama_cabang',
        'pajak_persen',
        'lokasi',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'pajak_persen' => 'decimal:2',
        'deleted_at'   => 'datetime',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu cabang dapat memiliki banyak user (kasir maupun admin cabang).
     * [Cabang] 1 --< [UserModel]
     */
    public function users(): HasMany
    {
        return $this->hasMany(UserModel::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Satu cabang memiliki banyak konfigurasi harga menu template.
     * [Cabang] 1 --< [MenuTemplate]
     */
    public function menuTemplates(): HasMany
    {
        return $this->hasMany(MenuTemplate::class, 'id_cabang', 'id_cabang');
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
