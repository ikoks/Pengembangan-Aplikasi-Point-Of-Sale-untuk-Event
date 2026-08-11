<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

use App\Models\Transaksi;
use App\Models\Cabang;
use App\Models\Menu;
use App\Models\ShiftSession;

/**
 * DashboardController
 *
 * Controller untuk halaman utama panel admin setelah login.
 * [Poin 1] Menambahkan filter rentang tanggal kustom (tanggal_mulai & tanggal_selesai).
 */
class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $totalTransaksi  = Transaksi::where('status', 'Success')->count();
        $totalPendapatan = Transaksi::where('status', 'Success')->sum('total');
        $totalCabang     = Cabang::count();
        $totalMenu       = Menu::count();

        // Poin 1: Deteksi mode filter — custom date range ATAU periode preset
        $tanggalMulai   = $request->input('tanggal_mulai');
        $tanggalSelesai = $request->input('tanggal_selesai');
        $periode        = $request->input('periode', 'hari');

        $isCustomRange  = $tanggalMulai && $tanggalSelesai;

        $labels        = [];
        $dataPendapatan = [];
        $chartTitle    = 'GRAFIK PENDAPATAN';

        // ─────────────────────────────────────────────────────────────────────
        // Helper: buat query dasar transaksi sukses dengan filter tanggal
        // ─────────────────────────────────────────────────────────────────────
        $baseQuery = fn () => Transaksi::where('status', 'Success');

        $applyDateFilter = function ($query) use ($isCustomRange, $tanggalMulai, $tanggalSelesai, $periode) {
            if ($isCustomRange) {
                $query->whereBetween('tanggal_transaksi', [$tanggalMulai, $tanggalSelesai]);
            } elseif ($periode === 'minggu') {
                $query->where('tanggal_transaksi', '>=', now()->subDays(6)->format('Y-m-d'));
            } elseif ($periode === 'bulan') {
                $query->where('tanggal_transaksi', '>=', now()->subDays(29)->format('Y-m-d'));
            } else {
                $query->where('tanggal_transaksi', now()->format('Y-m-d'));
            }
            return $query;
        };

        // ─────────────────────────────────────────────────────────────────────
        // Data Grafik Pendapatan
        // ─────────────────────────────────────────────────────────────────────
        if ($isCustomRange) {
            $transaksiQuery = $applyDateFilter(Transaksi::where('status', 'Success'));
            $transaksiData  = $transaksiQuery
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');

            $start = \Carbon\Carbon::parse($tanggalMulai);
            $end   = \Carbon\Carbon::parse($tanggalSelesai);
            for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
                $date          = $d->format('Y-m-d');
                $labels[]      = $d->format('d-m-Y');
                $dataPendapatan[] = $transaksiData->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (' . \Carbon\Carbon::parse($tanggalMulai)->format('d/m/Y') . ' – ' . \Carbon\Carbon::parse($tanggalSelesai)->format('d/m/Y') . ')';

        } elseif ($periode === 'minggu') {
            $transaksiData = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', now()->subDays(6)->format('Y-m-d'))
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');

            for ($i = 6; $i >= 0; $i--) {
                $dateObj        = now()->subDays($i);
                $date           = $dateObj->format('Y-m-d');
                $labels[]       = $dateObj->format('d-m-Y');
                $dataPendapatan[] = $transaksiData->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 MINGGU TERAKHIR)';

        } elseif ($periode === 'bulan') {
            $transaksiData = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', now()->subDays(29)->format('Y-m-d'))
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');

            for ($i = 29; $i >= 0; $i--) {
                $dateObj        = now()->subDays($i);
                $date           = $dateObj->format('Y-m-d');
                $labels[]       = $dateObj->format('d-m-Y');
                $dataPendapatan[] = $transaksiData->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 BULAN TERAKHIR)';

        } else {
            $today        = now()->format('Y-m-d');
            $transaksiHari = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', $today)
                ->get();

            for ($i = 0; $i <= 23; $i++) {
                $hourStr         = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
                $sum             = $transaksiHari->filter(fn ($t) => (int) substr($t->jam_transaksi, 0, 2) === $i)->sum('total');
                $labels[]        = $hourStr;
                $dataPendapatan[] = $sum;
            }
            $chartTitle = 'GRAFIK PENDAPATAN (HARI INI)';
        }

        // ─────────────────────────────────────────────────────────────────────
        // Top 5 Menu Terlaris
        // ─────────────────────────────────────────────────────────────────────
        $topMenuQuery = \App\Models\TransaksiDetail::join('transaksi', 'transaksi.id_transaksi', '=', 'transaksi_detail.id_transaksi')
            ->join('menu', 'menu.id_menu', '=', 'transaksi_detail.id_produk')
            ->where('transaksi.status', 'Success')
            ->where('transaksi_detail.status_item', 'Active');

        $applyDateFilter($topMenuQuery);

        $topMenus      = $topMenuQuery
            ->selectRaw('menu.nama_menu, sum(transaksi_detail.quantity) as total_qty')
            ->groupBy('menu.id_menu', 'menu.nama_menu')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get();

        $topMenuLabels = $topMenus->pluck('nama_menu')->toArray();
        $topMenuData   = $topMenus->pluck('total_qty')->toArray();

        // ─────────────────────────────────────────────────────────────────────
        // Metode Pembayaran
        // ─────────────────────────────────────────────────────────────────────
        $paymentQuery = \App\Models\Transaksi::join('metode_pembayaran', 'metode_pembayaran.id_metode', '=', 'transaksi.id_metode')
            ->where('transaksi.status', 'Success');

        $applyDateFilter($paymentQuery);

        $paymentMethods = $paymentQuery
            ->selectRaw('metode_pembayaran.nama_metode, count(transaksi.id_transaksi) as total_trx, sum(transaksi.total) as total_pendapatan')
            ->groupBy('metode_pembayaran.id_metode', 'metode_pembayaran.nama_metode')
            ->get();

        $paymentLabels  = $paymentMethods->map(function ($item) {
            $formattedTotal = number_format($item->total_pendapatan, 0, ',', '.');
            return $item->nama_metode . ' (' . $item->total_trx . ' Trx | Rp ' . $formattedTotal . ')';
        })->toArray();
        $paymentData    = $paymentMethods->pluck('total_trx')->toArray();
        $paymentRevenue = $paymentMethods->pluck('total_pendapatan')->toArray();

        // ─────────────────────────────────────────────────────────────────────
        // 5 Transaksi Terbaru
        // ─────────────────────────────────────────────────────────────────────
        $recentTransactions = \App\Models\Transaksi::with(['kasir', 'cabang', 'metodePembayaran'])
            ->orderBy('tanggal_transaksi', 'desc')
            ->orderBy('jam_transaksi', 'desc')
            ->limit(5)
            ->get();

        // ─────────────────────────────────────────────────────────────────────
        // Shift Kasir Aktif
        // ─────────────────────────────────────────────────────────────────────
        $activeShifts = ShiftSession::with(['kasir', 'cabang'])
            ->whereIn('status_shift', ['OPEN', 'ON_BREAK'])
            ->get();

        return view('admin.dashboard', compact(
            'totalTransaksi',
            'totalPendapatan',
            'totalCabang',
            'totalMenu',
            'labels',
            'dataPendapatan',
            'chartTitle',
            'periode',
            'tanggalMulai',
            'tanggalSelesai',
            'isCustomRange',
            'topMenuLabels',
            'topMenuData',
            'paymentLabels',
            'paymentData',
            'paymentRevenue',
            'recentTransactions',
            'activeShifts'
        ));
    }
}
