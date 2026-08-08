<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\View\View;

use App\Models\Transaksi;
use App\Models\Cabang;
use App\Models\Menu;

/**
 * DashboardController
 *
 * Controller untuk halaman utama panel admin setelah login.
 * Halaman ini dilindungi oleh middleware 'auth' (Web Guard).
 */
class DashboardController extends Controller
{
    /**
     * Menampilkan halaman dashboard admin.
     * Data statistik dan ringkasan akan ditambahkan pada sprint berikutnya.
     */
    public function index(): View
    {
        $totalTransaksi = Transaksi::where('status', 'Success')->count();
        $totalPendapatan = Transaksi::where('status', 'Success')->sum('total');
        $totalCabang = Cabang::count();
        $totalMenu = Menu::count();

        $periode = request('periode', 'hari');

        $labels = [];
        $dataPendapatan = [];
        $chartTitle = 'GRAFIK PENDAPATAN (7 HARI TERAKHIR)';

        if ($periode === 'minggu') {
            // 1 Minggu (7 Hari Terakhir)
            $startDate = now()->subDays(6)->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', $startDate)
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');
            
            for ($i = 6; $i >= 0; $i--) {
                $dateObj = now()->subDays($i);
                $date = $dateObj->format('Y-m-d');
                $labels[] = $dateObj->format('d-m-Y');
                $dataPendapatan[] = $transaksi->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 MINGGU TERAKHIR)';
        } elseif ($periode === 'bulan') {
            // 1 Bulan (30 Hari Terakhir)
            $startDate = now()->subDays(29)->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', '>=', $startDate)
                ->selectRaw('tanggal_transaksi as tanggal, sum(total) as pendapatan')
                ->groupBy('tanggal_transaksi')
                ->pluck('pendapatan', 'tanggal');
                
            for ($i = 29; $i >= 0; $i--) {
                $dateObj = now()->subDays($i);
                $date = $dateObj->format('Y-m-d');
                $labels[] = $dateObj->format('d-m-Y');
                $dataPendapatan[] = $transaksi->get($date, 0);
            }
            $chartTitle = 'GRAFIK PENDAPATAN (1 BULAN TERAKHIR)';
        } else {
            // Default: 1 hari (Hari Ini)
            $today = now()->format('Y-m-d');
            $transaksi = Transaksi::where('status', 'Success')
                ->where('tanggal_transaksi', $today)
                ->get();
            
            for ($i = 0; $i <= 23; $i++) {
                $hourStr = str_pad($i, 2, '0', STR_PAD_LEFT) . ':00';
                
                $sum = $transaksi->filter(function($t) use ($i) {
                    return (int) substr($t->jam_transaksi, 0, 2) === $i;
                })->sum('total');
                
                // Only show label if there's data, or just show every hour but it might be cramped.
                // Let's show every hour
                $labels[] = $hourStr;
                $dataPendapatan[] = $sum;
            }
            $chartTitle = 'GRAFIK PENDAPATAN (HARI INI)';
        }

        // 1. Top 5 Menu Terlaris
        $topMenuQuery = \App\Models\TransaksiDetail::join('transaksi', 'transaksi.id_transaksi', '=', 'transaksi_detail.id_transaksi')
            ->join('menu', 'menu.id_menu', '=', 'transaksi_detail.id_produk')
            ->where('transaksi.status', 'Success')
            ->where('transaksi_detail.status_item', 'Active');
            
        if ($periode === 'minggu') {
            $topMenuQuery->where('transaksi.tanggal_transaksi', '>=', now()->subDays(6)->format('Y-m-d'));
        } elseif ($periode === 'bulan') {
            $topMenuQuery->where('transaksi.tanggal_transaksi', '>=', now()->subDays(29)->format('Y-m-d'));
        } else {
            $topMenuQuery->where('transaksi.tanggal_transaksi', now()->format('Y-m-d'));
        }

        $topMenus = $topMenuQuery->selectRaw('menu.nama_menu, sum(transaksi_detail.quantity) as total_qty')
            ->groupBy('menu.id_menu', 'menu.nama_menu')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get();
            
        $topMenuLabels = $topMenus->pluck('nama_menu')->toArray();
        $topMenuData = $topMenus->pluck('total_qty')->toArray();

        // 2. Metode Pembayaran (Cash vs Non-Cash)
        $paymentQuery = \App\Models\Transaksi::join('metode_pembayaran', 'metode_pembayaran.id_metode', '=', 'transaksi.id_metode')
            ->where('transaksi.status', 'Success');
            
        if ($periode === 'minggu') {
            $paymentQuery->where('transaksi.tanggal_transaksi', '>=', now()->subDays(6)->format('Y-m-d'));
        } elseif ($periode === 'bulan') {
            $paymentQuery->where('transaksi.tanggal_transaksi', '>=', now()->subDays(29)->format('Y-m-d'));
        } else {
            $paymentQuery->where('transaksi.tanggal_transaksi', now()->format('Y-m-d'));
        }
        
        $paymentMethods = $paymentQuery->selectRaw('metode_pembayaran.nama_metode, count(transaksi.id_transaksi) as total_trx, sum(transaksi.total) as total_pendapatan')
            ->groupBy('metode_pembayaran.id_metode', 'metode_pembayaran.nama_metode')
            ->get();
            
        $paymentLabels = $paymentMethods->map(function($item) {
            $formattedTotal = number_format($item->total_pendapatan, 0, ',', '.');
            return $item->nama_metode . ' (' . $item->total_trx . ' Trx | Rp ' . $formattedTotal . ')';
        })->toArray();
        $paymentData = $paymentMethods->pluck('total_trx')->toArray();
        $paymentRevenue = $paymentMethods->pluck('total_pendapatan')->toArray();

        // 3. 5 Transaksi Terbaru
        $recentTransactions = \App\Models\Transaksi::with(['kasir', 'cabang', 'metodePembayaran'])
            ->orderBy('tanggal_transaksi', 'desc')
            ->orderBy('jam_transaksi', 'desc')
            ->limit(5)
            ->get();

        // 4. Shift Kasir Aktif
        $activeShifts = \App\Models\ShiftSession::with(['user', 'cabang'])
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
