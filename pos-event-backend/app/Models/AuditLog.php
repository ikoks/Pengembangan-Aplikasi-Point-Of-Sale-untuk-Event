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
        'id_user',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }
}
