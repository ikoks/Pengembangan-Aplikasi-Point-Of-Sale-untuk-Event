<?php

namespace App\Models;

use App\Models\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Model Transaksi
 *
 * Merepresentasikan tabel `transaksi` yang menyimpan header/kepala
 * setiap transaksi penjualan dalam sistem POS Event.
 *
 * Lifecycle Status Transaksi:
 *   - 'Draft'     → Transaksi dibuat kasir, belum dikonfirmasi (mode offline / keranjang)
 *   - 'Pending'   → Menunggu konfirmasi pembayaran (untuk payment gateway non-tunai)
 *   - 'Success'   → Pembayaran berhasil dikonfirmasi
 *   - 'Void'      → Dibatalkan oleh kasir setelah transaksi selesai (dengan alasan)
 *   - 'Cancelled' → Dibatalkan sebelum pembayaran terjadi
 *
 * Dukungan Offline-Sync:
 *   `id_transaksi` dapat dikirim dari aplikasi mobile yang sudah memiliki
 *   UUID yang di-generate secara lokal saat mode offline. Jika tidak dikirim,
 *   Trait `HasUuid` akan membuatkan UUID baru secara otomatis.
 *
 * @property string          $id_transaksi      UUID v4 sebagai primary key.
 * @property string          $id_sales          FK ke sales_mode.
 * @property string          $id_cabang         FK ke cabang.
 * @property string          $id_user           FK ke user/kasir yang membuat transaksi.
 * @property string          $id_metode         FK ke metode_pembayaran.
 * @property string          $id_shift          FK ke shift_session aktif.
 * @property string|null     $id_promo          FK ke promosi (level transaksi), nullable.
 * @property string          $tanggal_transaksi Tanggal transaksi (DATE).
 * @property string          $jam_transaksi     Waktu transaksi (TIME H:i:s).
 * @property string|null     $nama_pelanggan    Nama pelanggan opsional.
 * @property float           $total             Total akhir setelah promo & pajak.
 * @property float           $tax               Nominal pajak yang dikenakan.
 * @property string          $status            Draft|Pending|Success|Void|Cancelled.
 * @property string|null     $alasan_batal      Alasan pembatalan (untuk Void/Cancelled).
 * @property string|null     $diperbarui_oleh   FK user yang melakukan koreksi.
 * @property string|null     $catatan_koreksi   Catatan saat ada koreksi/perubahan.
 * @property float           $nominal_promo     Nilai diskon level transaksi (default 0.00).
 */
class Transaksi extends Model
{
    use HasUuid;

    /** Nama tabel di database (Tabel 4.11 SDD) */
    protected $table = 'transaksi';

    /** Primary key menggunakan UUID string */
    protected $primaryKey = 'id_transaksi';
    public $incrementing  = false;
    protected $keyType    = 'string';

    /** Kolom yang boleh diisi secara massal */
    protected $fillable = [
        'id_transaksi',      // Dapat diisi manual untuk keperluan offline-sync
        'id_sales',
        'id_cabang',
        'id_user',
        'id_metode',
        'id_shift',
        'id_promo',
        'tanggal_transaksi',
        'jam_transaksi',
        'nama_pelanggan',
        'total',
        'tax',
        'status',
        'alasan_batal',
        'diperbarui_oleh',
        'catatan_koreksi',
        'nominal_promo',
    ];

    /** Casting tipe data kolom untuk konsistensi tipe PHP */
    protected $casts = [
        'total'         => 'decimal:2',
        'tax'           => 'decimal:2',
        'nominal_promo' => 'decimal:2',
    ];

    // =========================================================================
    // RELASI — Dua Arah (Bidirectional)
    // =========================================================================

    /**
     * Kasir yang membuat transaksi ini.
     * [Transaksi] >-- [UserModel] via id_user
     */
    public function kasir(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'id_user', 'id_user');
    }

    /**
     * User yang terakhir kali mengubah/mengoreksi transaksi ini.
     * [Transaksi] >-- [UserModel] via diperbarui_oleh
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(UserModel::class, 'diperbarui_oleh', 'id_user');
    }

    /**
     * Cabang tempat transaksi ini terjadi.
     * [Transaksi] >-- [Cabang]
     */
    public function cabang(): BelongsTo
    {
        return $this->belongsTo(Cabang::class, 'id_cabang', 'id_cabang');
    }

    /**
     * Kanal penjualan yang digunakan dalam transaksi ini.
     * [Transaksi] >-- [SalesMode]
     */
    public function salesMode(): BelongsTo
    {
        return $this->belongsTo(SalesMode::class, 'id_sales', 'id_sales');
    }

    /**
     * Sesi shift kasir tempat transaksi ini berlangsung.
     * [Transaksi] >-- [ShiftSession]
     */
    public function shiftSession(): BelongsTo
    {
        return $this->belongsTo(ShiftSession::class, 'id_shift', 'id_shift');
    }

    /**
     * Metode pembayaran yang digunakan dalam transaksi.
     * [Transaksi] >-- [MetodePembayaran]
     */
    public function metodePembayaran(): BelongsTo
    {
        return $this->belongsTo(MetodePembayaran::class, 'id_metode', 'id_metode');
    }

    /**
     * Promosi di level transaksi yang diterapkan (nullable).
     * [Transaksi] >-- [Promosi]
     */
    public function promosi(): BelongsTo
    {
        return $this->belongsTo(Promosi::class, 'id_promo', 'id_promo');
    }

    /**
     * Daftar item detail yang terkandung dalam transaksi ini.
     * [Transaksi] 1 --< [TransaksiDetail]
     */
    public function details(): HasMany
    {
        return $this->hasMany(TransaksiDetail::class, 'id_transaksi', 'id_transaksi');
    }

    /**
     * Data pembayaran non-tunai (QRIS/VA) yang terkait dengan transaksi ini.
     * Hanya ada satu record untuk setiap transaksi non-tunai.
     *
     * [Transaksi] 1 --> [DetailPembayaranNonTunai]
     *
     * Relasi ini digunakan oleh:
     *   - MidtransService untuk upsert data charge
     *   - PaymentController@webhook untuk atomic status update
     *   - GET /api/v1/payment/status/{id} untuk polling status
     */
    public function detailPembayaranNonTunai(): HasOne
    {
        return $this->hasOne(DetailPembayaranNonTunai::class, 'id_transaksi', 'id_transaksi');
    }
}
