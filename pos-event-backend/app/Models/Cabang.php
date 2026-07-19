<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Model Cabang
 *
 * Merepresentasikan tabel `cabang` yang menyimpan
 * data setiap cabang/lokasi event yang terdaftar.
 *
 * @property string $id_cabang    UUID v4 sebagai primary key.
 * @property string $nama_cabang  Nama cabang event.
 * @property float  $pajak_persen Persentase pajak yang berlaku di cabang ini.
 * @property string $lokasi       Alamat atau keterangan lokasi cabang.
 */
class Cabang extends Model
{
    use HasUuid;

    /** Nama tabel di database */
    protected $table = 'cabang';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_cabang';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_cabang',
        'nama_cabang',
        'pajak_persen',
        'lokasi',
    ];

    /** Casting tipe data kolom */
    protected $casts = [
        'pajak_persen' => 'decimal:2',
    ];

    // =========================================================================
    // RELASI
    // =========================================================================

    /**
     * Satu cabang dapat memiliki banyak user (kasir).
     */
    public function users(): HasMany
    {
        return $this->hasMany(UserModel::class, 'id_cabang', 'id_cabang');
    }
}
