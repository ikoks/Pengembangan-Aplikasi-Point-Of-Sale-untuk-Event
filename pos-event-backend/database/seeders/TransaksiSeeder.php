<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Cabang;
use App\Models\MetodePembayaran;
use App\Models\SalesMode;
use App\Models\UserModel;
use App\Models\MenuTemplate;
use App\Models\ShiftSession;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Carbon\Carbon;

class TransaksiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cabangs = Cabang::all();
        $metodes = MetodePembayaran::all();
        $salesModes = SalesMode::where('status', 'Aktif')->get();
        $kasirs = UserModel::whereHas('role', function ($query) {
            $query->where('nama_role', 'Kasir');
        })->get();

        if ($cabangs->isEmpty() || $metodes->isEmpty() || $salesModes->isEmpty() || $kasirs->isEmpty()) {
            $this->command->info('Data master (Cabang/Metode/SalesMode/Kasir) belum lengkap. Seeding transaksi dibatalkan.');
            return;
        }

        $this->command->info('Memulai seeding transaksi...');

        $totalHari = 30; // 30 hari ke belakang
        $transaksiPerHari = 5; // 5 transaksi per hari (total 150 transaksi)

        for ($i = 0; $i < $totalHari; $i++) {
            $tanggal = Carbon::now()->subDays($i);
            
            for ($j = 0; $j < $transaksiPerHari; $j++) {
                $cabang = $cabangs->random();
                $kasir = $kasirs->random();
                $metode = $metodes->random();
                $salesMode = $salesModes->random();

                // 1. Buat atau ambil ShiftSession untuk Kasir, Cabang, dan SalesMode pada hari ini
                $shift = ShiftSession::firstOrCreate(
                    [
                        'id_user' => $kasir->id_user,
                        'id_cabang' => $cabang->id_cabang,
                        'id_sales' => $salesMode->id_sales,
                        // Hanya cocok jika tanggal mulai shift sama dengan tanggal transaksi
                    ],
                    [
                        'id_shift' => Str::uuid()->toString(),
                        'id_user_aktif' => $kasir->id_user,
                        'waktu_mulai' => $tanggal->copy()->setHour(8)->setMinute(0)->setSecond(0),
                        'waktu_selesai' => $tanggal->copy()->setHour(22)->setMinute(0)->setSecond(0),
                        'modal_awal' => 500000,
                        'status_shift' => 'CLOSED',
                    ]
                );

                // Ambil menu template yang tersedia untuk cabang & sales mode ini
                $menuTemplates = MenuTemplate::with('menu')
                    ->where('id_cabang', $cabang->id_cabang)
                    ->where('id_sales', $salesMode->id_sales)
                    ->get();

                if ($menuTemplates->isEmpty()) {
                    continue; // Skip jika tidak ada menu di cabang/mode ini
                }

                // Tentukan jumlah item unik yang dibeli (1 s/d 3 macam)
                $jumlahItemMacam = rand(1, min(3, $menuTemplates->count()));
                $itemTerpilih = $menuTemplates->random($jumlahItemMacam);
                
                $totalSubtotal = 0;
                $details = [];

                foreach ($itemTerpilih as $template) {
                    $qty = rand(1, 4);
                    $harga = $template->harga_produk;
                    $subtotal = $harga * $qty;
                    $totalSubtotal += $subtotal;

                    $details[] = [
                        'id_transaksi_detail' => Str::uuid()->toString(),
                        'id_produk' => $template->id_menu,
                        'harga_produk' => $harga,
                        'quantity' => $qty,
                        'id_promo' => null,
                        'nominal_promo' => 0,
                        'subtotal_item' => $subtotal,
                        'status_item' => 'Active',
                    ];
                }

                // Hitung Pajak Cabang
                $pajakPersen = $cabang->pajak_persen ?? 0;
                $tax = ($totalSubtotal * $pajakPersen) / 100;
                
                // Total
                $total = $totalSubtotal + $tax;

                $jam = $tanggal->copy()->setHour(rand(9, 21))->setMinute(rand(0, 59))->setSecond(rand(0, 59));
                $statusList = ['Success', 'Success', 'Success', 'Success', 'Void', 'Cancelled'];
                $status = $statusList[array_rand($statusList)];

                // Buat Header Transaksi
                $idTransaksi = Str::uuid()->toString();
                
                $transaksi = Transaksi::create([
                    'id_transaksi' => $idTransaksi,
                    'id_sales' => $salesMode->id_sales,
                    'id_cabang' => $cabang->id_cabang,
                    'id_user' => $kasir->id_user,
                    'id_metode' => $metode->id_metode,
                    'id_shift' => $shift->id_shift,
                    'id_promo' => null,
                    'tanggal_transaksi' => $tanggal->format('Y-m-d'),
                    'jam_transaksi' => $jam->format('H:i:s'),
                    'nama_pelanggan' => 'Pelanggan ' . Str::random(4),
                    'total' => $total,
                    'tax' => $tax,
                    'status' => $status,
                    'nomor_referensi' => $metode->nama_metode !== 'Tunai' ? 'REF' . rand(100000, 999999) : null,
                    'alasan_batal' => $status === 'Void' || $status === 'Cancelled' ? 'Salah input pesanan' : null,
                    'nominal_promo' => 0,
                ]);

                // Buat Detail Transaksi
                foreach ($details as $detail) {
                    $detail['id_transaksi'] = $idTransaksi;
                    if ($status === 'Void' || $status === 'Cancelled') {
                        $detail['status_item'] = 'Void';
                        $detail['alasan_batal_item'] = 'Transaksi dibatalkan';
                    }
                    TransaksiDetail::create($detail);
                }
            }
        }

        // Kalkulasi uang fisik akhir & buat log operator untuk tiap shift
        $shifts = ShiftSession::all();
        foreach ($shifts as $shift) {
            $totalTunai = Transaksi::where('id_shift', $shift->id_shift)
                ->where('status', 'Success')
                ->whereHas('metodePembayaran', function($q) {
                    $q->where('nama_metode', 'Cash')->orWhere('nama_metode', 'Tunai');
                })->sum('total');

            $uangAkhir = $shift->modal_awal + $totalTunai;
            $shift->update([
                'uang_fisik_akhir' => $uangAkhir,
                'selisih_uang' => 0,
            ]);

            \App\Models\ShiftOperatorLog::create([
                'id_log' => Str::uuid()->toString(),
                'id_shift' => $shift->id_shift,
                'id_user' => $shift->id_user,
                'aksi' => 'open',
                'waktu_kejadian' => $shift->waktu_mulai,
                'catatan' => 'Buka shift',
            ]);

            \App\Models\ShiftOperatorLog::create([
                'id_log' => Str::uuid()->toString(),
                'id_shift' => $shift->id_shift,
                'id_user' => $shift->id_user,
                'aksi' => 'closed',
                'waktu_kejadian' => $shift->waktu_selesai,
                'catatan' => 'Tutup shift',
            ]);
        }

        $this->command->info('Seeding transaksi selesai! (' . ($totalHari * $transaksiPerHari) . ' transaksi)');
    }
}
