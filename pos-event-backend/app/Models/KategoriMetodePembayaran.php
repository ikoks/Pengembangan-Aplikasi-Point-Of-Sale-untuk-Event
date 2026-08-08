<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KategoriMetodePembayaran extends Model
{
    use HasUuid, SoftDeletes;

    protected $table = 'kategori_metode_pembayaran';

    protected $primaryKey = 'id_kategori_metode';
    public $incrementing  = false;
    protected $keyType    = 'string';

    protected $fillable = [
        'nama_kategori',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];

    public function metodePembayarans(): HasMany
    {
        return $this->hasMany(MetodePembayaran::class, 'id_kategori_metode', 'id_kategori_metode');
    }
}
