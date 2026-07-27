<?php

namespace Tests\Feature\Checkout;

use App\Models\AuditLog;
use App\Models\Cabang;
use App\Models\MetodePembayaran;
use App\Models\OtpCode;
use App\Models\RoleUser;
use App\Models\SalesMode;
use App\Models\ShiftSession;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Menu;
use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * VoidOtpTest — POS-A-06 (Sprint 2)
 *
 * Memverifikasi aturan bisnis void berdasarkan status transaksi:
 *
 * Draft:
 *   [✓] Void Draft tanpa kode OTP berhasil (→ status Cancelled)
 *
 * Success:
 *   [✗] Void Success tanpa kode_otp → 422
 *   [✗] Void Success dengan kode OTP salah → 403
 *   [✗] Void Success dengan kode OTP expired → 403
 *   [✓] Void Success dengan kode OTP valid → 200 + audit_logs ter-insert
 *   [✗] Kode OTP tidak bisa dipakai dua kali (replay attack prevention)
 */
class VoidOtpTest extends TestCase
{
    use RefreshDatabase;

    private UserModel $kasir;
    private ShiftSession $shift;
    private Cabang $cabang;
    private SalesMode $salesMode;
    private MetodePembayaran $metodePembayaran;
    private Menu $menu;

    protected function setUp(): void
    {
        parent::setUp();

        $roleKasir        = RoleUser::create(['id_role' => (string) Str::uuid(), 'nama_role' => 'Kasir']);
        $this->cabang     = Cabang::create([
            'id_cabang'    => (string) Str::uuid(),
            'nama_cabang'  => 'Cabang Test Void',
            'pajak_persen' => 10.00,
        ]);
        $this->salesMode  = SalesMode::create(['id_sales' => (string) Str::uuid(), 'nama_sales' => 'Dine In']);
        $this->metodePembayaran = MetodePembayaran::create([
            'id_metode'       => (string) Str::uuid(),
            'nama_metode'     => 'Tunai',
            'kategori_metode' => 'Tunai',
        ]);

        $this->kasir = UserModel::create([
            'id_user'       => (string) Str::uuid(),
            'id_role'       => $roleKasir->id_role,
            'id_cabang'     => $this->cabang->id_cabang,
            'username'      => 'kasir.void.test',
            'password_hash' => null,
            'nama_user'     => 'Kasir Void Test',
            'status_aktif'  => true,
        ]);

        $this->shift = ShiftSession::create([
            'id_shift'      => (string) Str::uuid(),
            'id_user'       => $this->kasir->id_user,
            'id_user_aktif' => $this->kasir->id_user,
            'id_cabang'     => $this->cabang->id_cabang,
            'id_sales'      => $this->salesMode->id_sales,
            'waktu_mulai'   => now(),
            'modal_awal'    => 500000,
            'status_shift'  => 'OPEN',
        ]);
    }

    // =========================================================================
    // Helper: buat transaksi dengan status tertentu
    // =========================================================================

    private function buatTransaksi(string $status = 'Draft'): Transaksi
    {
        $transaksi = Transaksi::create([
            'id_transaksi'      => (string) Str::uuid(),
            'id_sales'          => $this->salesMode->id_sales,
            'id_cabang'         => $this->cabang->id_cabang,
            'id_user'           => $this->kasir->id_user,
            'id_metode'         => $this->metodePembayaran->id_metode,
            'id_shift'          => $this->shift->id_shift,
            'tanggal_transaksi' => now()->format('Y-m-d'),
            'jam_transaksi'     => now()->format('H:i:s'),
            'total'             => 55000,
            'tax'               => 5000,
            'status'            => $status,
            'nominal_promo'     => 0,
        ]);

        return $transaksi;
    }

    private function buatOtp(string $idTransaksi, bool $expired = false, bool $dipakai = false): OtpCode
    {
        return OtpCode::create([
            'id_otp'       => (string) Str::uuid(),
            'id_transaksi' => $idTransaksi,
            'kode'         => '123456',
            'expires_at'   => $expired ? now()->subMinute() : now()->addMinute(),
            'used_at'      => $dipakai ? now() : null,
        ]);
    }

    // =========================================================================
    // TEST: DRAFT — void tanpa OTP
    // =========================================================================

    public function test_void_draft_berhasil_tanpa_otp(): void
    {
        $transaksi = $this->buatTransaksi('Draft');
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'alasan_batal' => 'Pelanggan batal memesan.',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('transaksi', [
            'id_transaksi' => $transaksi->id_transaksi,
            'status'       => 'Cancelled',
        ]);
    }

    // =========================================================================
    // TEST: SUCCESS — void wajib OTP
    // =========================================================================

    public function test_void_success_tanpa_kode_otp_ditolak_422(): void
    {
        $transaksi = $this->buatTransaksi('Success');
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'alasan_batal' => 'Void tanpa OTP.',
            // kode_otp tidak dikirim
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['success' => false]);

        // Pastikan status transaksi tidak berubah
        $this->assertDatabaseHas('transaksi', [
            'id_transaksi' => $transaksi->id_transaksi,
            'status'       => 'Success',
        ]);
    }

    public function test_void_success_dengan_kode_otp_salah_ditolak_403(): void
    {
        $transaksi = $this->buatTransaksi('Success');
        $this->buatOtp($transaksi->id_transaksi); // kode valid: '123456'
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'kode_otp'     => '999999', // kode salah
            'alasan_batal' => 'Test kode salah.',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment(['success' => false]);

        $this->assertDatabaseHas('transaksi', [
            'id_transaksi' => $transaksi->id_transaksi,
            'status'       => 'Success',
        ]);
    }

    public function test_void_success_dengan_kode_otp_expired_ditolak_403(): void
    {
        $transaksi = $this->buatTransaksi('Success');
        $this->buatOtp($transaksi->id_transaksi, expired: true); // kode sudah expired
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'kode_otp'     => '123456', // kode benar tapi expired
            'alasan_batal' => 'Test kode expired.',
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('transaksi', [
            'id_transaksi' => $transaksi->id_transaksi,
            'status'       => 'Success',
        ]);
    }

    public function test_void_success_dengan_kode_otp_valid_berhasil(): void
    {
        $transaksi = $this->buatTransaksi('Success');
        $this->buatOtp($transaksi->id_transaksi); // kode valid: '123456'
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'kode_otp'     => '123456',
            'alasan_batal' => 'Test void dengan OTP valid.',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Status berubah ke Void
        $this->assertDatabaseHas('transaksi', [
            'id_transaksi' => $transaksi->id_transaksi,
            'status'       => 'Void',
        ]);
    }

    public function test_void_success_mencatat_ke_audit_logs(): void
    {
        $transaksi = $this->buatTransaksi('Success');
        $this->buatOtp($transaksi->id_transaksi); // kode valid: '123456'
        Sanctum::actingAs($this->kasir);

        $this->postJson("/api/v1/checkout/{$transaksi->id_transaksi}/void", [
            'kode_otp'     => '123456',
            'alasan_batal' => 'Test audit log.',
        ])->assertStatus(200);

        // Verifikasi audit_logs ter-insert dengan aktivitas VOID_TRANSACTION
        $this->assertDatabaseHas('audit_logs', [
            'aktivitas'    => 'VOID_TRANSACTION',
            'tabel_target' => 'transaksi',
            'id_target'    => $transaksi->id_transaksi,
        ]);
    }

    public function test_kode_otp_tidak_bisa_dipakai_dua_kali(): void
    {
        $transaksi1 = $this->buatTransaksi('Success');
        $transaksi2 = $this->buatTransaksi('Success');
        $this->buatOtp($transaksi1->id_transaksi); // kode '123456' untuk tx1
        Sanctum::actingAs($this->kasir);

        // Pakai kode OTP untuk transaksi 1 → berhasil
        $this->postJson("/api/v1/checkout/{$transaksi1->id_transaksi}/void", [
            'kode_otp'     => '123456',
            'alasan_batal' => 'Void pertama.',
        ])->assertStatus(200);

        // Buat OTP baru untuk transaksi 2 dengan kode sama, tapi tandai sudah dipakai
        $this->buatOtp($transaksi2->id_transaksi, dipakai: true); // kode sudah dipakai

        // Coba pakai kode OTP yang sama untuk transaksi 2 → harus ditolak
        $response = $this->postJson("/api/v1/checkout/{$transaksi2->id_transaksi}/void", [
            'kode_otp'     => '123456',
            'alasan_batal' => 'Void kedua dengan kode yang sama.',
        ]);

        $response->assertStatus(403);
    }
}
