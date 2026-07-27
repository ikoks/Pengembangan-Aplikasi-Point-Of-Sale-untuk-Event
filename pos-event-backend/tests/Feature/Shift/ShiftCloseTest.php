<?php

namespace Tests\Feature\Shift;

use App\Models\Cabang;
use App\Models\MetodePembayaran;
use App\Models\RoleUser;
use App\Models\SalesMode;
use App\Models\ShiftOperatorLog;
use App\Models\ShiftSession;
use App\Models\Transaksi;
use App\Models\UserModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ShiftCloseTest — POS-A-03 (Sprint 2)
 *
 * Memverifikasi behavior kritis closing shift:
 *   1. Token Sanctum kasir di-revoke setelah closing berhasil.
 *   2. Response tidak mengandung nominal selisih (silent).
 *   3. Log 'closed' tersimpan di shift_operator_logs.
 *   4. Status shift berubah menjadi 'CLOSED'.
 *   5. Shift yang sudah CLOSED tidak bisa ditutup ulang.
 */
class ShiftCloseTest extends TestCase
{
    use RefreshDatabase;

    private UserModel $kasir;
    private ShiftSession $shift;
    private Cabang $cabang;
    private SalesMode $salesMode;

    protected function setUp(): void
    {
        parent::setUp();

        // Buat data master yang diperlukan
        $roleKasir       = RoleUser::create(['id_role' => (string) Str::uuid(), 'nama_role' => 'Kasir']);
        $this->cabang    = Cabang::create([
            'id_cabang'    => (string) Str::uuid(),
            'nama_cabang'  => 'Cabang Test',
            'pajak_persen' => 10.00,
        ]);
        $this->salesMode = SalesMode::create([
            'id_sales'   => (string) Str::uuid(),
            'nama_sales' => 'Dine In',
        ]);

        // Buat kasir
        $this->kasir = UserModel::create([
            'id_user'       => (string) Str::uuid(),
            'id_role'       => $roleKasir->id_role,
            'id_cabang'     => $this->cabang->id_cabang,
            'username'      => 'kasir.test',
            'password_hash' => null,
            'nama_user'     => 'Kasir Test',
            'status_aktif'  => true,
        ]);

        // Buat shift aktif
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

    /**
     * Test utama: Token harus di-revoke setelah closing berhasil.
     *
     * HP Kasir menerima response 200 → mencoba request berikutnya dengan
     * token lama → harus mendapat 401 Unauthenticated.
     */
    public function test_token_dihapus_setelah_closing_shift(): void
    {
        // Login kasir dan dapatkan token
        $token = $this->kasir->createToken('test-token')->plainTextToken;

        // Tutup shift
        $response = $this->withToken($token)
            ->postJson('/api/v1/shift/close', [
                'uang_fisik_akhir' => 500000,
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        // Token lama harus sudah tidak berlaku
        $responseSetelahClose = $this->withToken($token)
            ->getJson('/api/v1/me');

        $responseSetelahClose->assertStatus(401);
    }

    /**
     * Test: Response closing TIDAK boleh mengandung nominal keuangan.
     * Angka selisih, omzet, dsb. hanya tersimpan di DB — tidak di response.
     */
    public function test_response_closing_tidak_mengandung_nominal_selisih(): void
    {
        Sanctum::actingAs($this->kasir);

        $response = $this->postJson('/api/v1/shift/close', [
            'uang_fisik_akhir' => 600000,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonMissing(['selisih_uang'])
            ->assertJsonMissing(['total_tunai'])
            ->assertJsonMissing(['total_omzet'])
            ->assertJsonMissing(['ekspektasi_uang_fisik']);

        // Pastikan hanya 2 field: success & message
        $responseData = $response->json();
        $this->assertArrayHasKey('success', $responseData);
        $this->assertArrayHasKey('message', $responseData);
        $this->assertArrayNotHasKey('data', $responseData);
    }

    /**
     * Test: Selisih dihitung dan TERSIMPAN di database (meski tidak di response).
     */
    public function test_selisih_tersimpan_silent_di_database(): void
    {
        // Setup: buat transaksi tunai di shift ini
        $metodeTunai = MetodePembayaran::create([
            'id_metode'       => (string) Str::uuid(),
            'nama_metode'     => 'Tunai',
            'kategori_metode' => 'Tunai',
        ]);

        Transaksi::create([
            'id_transaksi'      => (string) Str::uuid(),
            'id_sales'          => $this->salesMode->id_sales,
            'id_cabang'         => $this->cabang->id_cabang,
            'id_user'           => $this->kasir->id_user,
            'id_metode'         => $metodeTunai->id_metode,
            'id_shift'          => $this->shift->id_shift,
            'tanggal_transaksi' => now()->format('Y-m-d'),
            'jam_transaksi'     => now()->format('H:i:s'),
            'total'             => 100000,
            'tax'               => 10000,
            'status'            => 'Success',
            'nominal_promo'     => 0,
        ]);

        Sanctum::actingAs($this->kasir);

        // Kasir memasukkan uang fisik lebih dari ekspektasi
        // Modal awal: 500.000, Total tunai: 100.000 → Ekspektasi: 600.000
        // Uang fisik: 620.000 → Selisih: +20.000
        $this->postJson('/api/v1/shift/close', [
            'uang_fisik_akhir' => 620000,
        ])->assertStatus(200);

        // Verifikasi selisih tersimpan di DB
        $shiftTersimpan = ShiftSession::find($this->shift->id_shift);
        $this->assertEquals('CLOSED', $shiftTersimpan->status_shift);
        $this->assertEquals(620000, $shiftTersimpan->uang_fisik_akhir);
        $this->assertEquals(20000, $shiftTersimpan->selisih_uang);
    }

    /**
     * Test: Log 'closed' tersimpan di shift_operator_logs.
     */
    public function test_log_closed_tersimpan_di_shift_operator_logs(): void
    {
        Sanctum::actingAs($this->kasir);

        $this->postJson('/api/v1/shift/close', [
            'uang_fisik_akhir' => 500000,
        ])->assertStatus(200);

        $this->assertDatabaseHas('shift_operator_logs', [
            'id_shift' => $this->shift->id_shift,
            'id_user'  => $this->kasir->id_user,
            'aksi'     => 'closed',
        ]);
    }

    /**
     * Test: Shift yang sudah CLOSED tidak bisa ditutup ulang → 422.
     */
    public function test_tidak_bisa_tutup_shift_yang_sudah_closed(): void
    {
        // Tutup shift pertama
        Sanctum::actingAs($this->kasir);
        $this->postJson('/api/v1/shift/close', ['uang_fisik_akhir' => 500000])
            ->assertStatus(200);

        // Re-login karena token lama sudah di-revoke
        $kasirBaru = $this->kasir->fresh();
        $token = $kasirBaru->createToken('new-token')->plainTextToken;

        // Coba tutup lagi → harus gagal
        $this->withToken($token)
            ->postJson('/api/v1/shift/close', ['uang_fisik_akhir' => 500000])
            ->assertStatus(422)
            ->assertJson(['success' => false]);
    }
}
