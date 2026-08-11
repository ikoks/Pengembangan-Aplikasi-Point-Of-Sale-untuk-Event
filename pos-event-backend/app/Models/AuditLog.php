<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasUuid;

    protected $table = 'audit_logs';
    protected $primaryKey = 'id_audit';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_user_aktor',
        'tipe_aktor',
        'aktivitas',
        'tabel_target',
        'id_target',
        'data_sebelum',
        'data_sesudah',
        'waktu_kejadian',
        'ip_address',
    ];

    protected $casts = [
        'data_sebelum'   => 'array',
        'data_sesudah'   => 'array',
        'waktu_kejadian' => 'datetime',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'id_user_aktor', 'id_admin');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(Kasir::class, 'id_user_aktor', 'id_kasir');
    }
}
