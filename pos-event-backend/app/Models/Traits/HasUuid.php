<?php

namespace App\Models\Traits;

use Illuminate\Support\Str;

/**
 * HasUuid Trait
 *
 * Trait ini secara otomatis menangani pembuatan UUID v4
 * sebagai primary key ketika sebuah model baru dibuat.
 *
 * Cara Penggunaan: Tambahkan `use HasUuid;` di dalam class Model.
 *
 * Trait ini MENGASUMSIKAN bahwa model yang menggunakannya telah
 * mendefinisikan `$primaryKey`, `$incrementing = false`, dan `$keyType = 'string'`.
 */
trait HasUuid
{
    /**
     * Boot the trait ke dalam lifecycle model.
     * Listener 'creating' akan dijalankan sebelum INSERT ke database.
     */
    protected static function bootHasUuid(): void
    {
        static::creating(function ($model) {
            // Hanya isi primary key jika belum di-set secara manual
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::uuid();
            }
        });
    }
}
