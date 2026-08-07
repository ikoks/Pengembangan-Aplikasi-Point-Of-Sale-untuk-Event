<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\MetodePembayaran;
use App\Models\Transaksi;
use Illuminate\Http\Request;

// Controller Riwayat Transaksi & Detail Struk
class TransaksiController extends Controller
{
    // Tampilkan daftar transaksi dengan filter
    public function index(Request $request)
    {
        $query = Transaksi::with([
            'kasir',
            'cabang',
            'metodePembayaran',
            'details.menu',
            'promosi',
        ])->where('status', '!=', 'Draft')
          ->orderBy('tanggal_transaksi', 'desc')
          ->orderBy('jam_transaksi', 'desc');

        if ($request->filled('id_transaksi')) {
            $query->where('id_transaksi', 'like', '%' . $request->id_transaksi . '%');
        }

        if ($request->filled('kasir')) {
            $query->whereHas('kasir', function ($q) use ($request) {
                $q->where('nama_user', 'like', '%' . $request->kasir . '%');
            });
        }

        if ($request->filled('id_cabang')) {
            $query->where('id_cabang', $request->id_cabang);
        }

        if ($request->filled('id_metode')) {
            $query->where('id_metode', $request->id_metode);
        }

        if ($request->filled('tanggal_mulai')) {
            $query->where('tanggal_transaksi', '>=', $request->tanggal_mulai);
        }

        if ($request->filled('tanggal_akhir')) {
            $query->where('tanggal_transaksi', '<=', $request->tanggal_akhir);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('nomor_referensi')) {
            $query->where('nomor_referensi', 'like', '%' . $request->nomor_referensi . '%');
        }

        $transaksis = $query->paginate(25)->withQueryString();

        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $metodes = MetodePembayaran::orderBy('nama_metode')->get();

        return view('admin.log.transaksi', compact('transaksis', 'cabangs', 'metodes'));
    }

    // Detail transaksi via AJAX
    public function show(string $id)
    {
        $transaksi = Transaksi::with([
            'kasir',
            'updatedBy',
            'cabang',
            'metodePembayaran',
            'salesMode',
            'shiftSession',
            'promosi',
            'details.menu',
            'details.promosi',
        ])->findOrFail($id);

        if (request()->expectsJson() || request()->ajax()) {
            return response()->json([
                'success'   => true,
                'transaksi' => $transaksi,
            ]);
        }

        return view('admin.log.transaksi-struk', compact('transaksi'));
    }

    // Ekspor ke Excel
    public function exportExcel(Request $request)
    {
        $params = $request->only([
            'id_transaksi', 'kasir', 'id_cabang', 'id_metode', 'tanggal_mulai', 'tanggal_akhir', 'status', 'nomor_referensi'
        ]);

        if (class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            $filename = 'transaksi-' . now()->format('Y-m-d-His') . '.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\TransaksiExport($params),
                $filename
            );
        }

        return back()->with('error', 'Package Maatwebsite Excel belum terinstall.');
    }

    // Ekspor ke PDF
    public function exportPdf(Request $request)
    {
        $params = $request->only([
            'id_transaksi', 'kasir', 'id_cabang', 'id_metode', 'tanggal_mulai', 'tanggal_akhir', 'status', 'nomor_referensi'
        ]);

        $query = Transaksi::with([
            'kasir', 'cabang', 'metodePembayaran', 'details.menu', 'promosi',
        ])->where('status', '!=', 'Draft')->orderBy('tanggal_transaksi', 'desc')->orderBy('jam_transaksi', 'desc');

        if (!empty($params['id_transaksi'])) {
            $query->where('id_transaksi', 'like', '%' . $params['id_transaksi'] . '%');
        }
        if (!empty($params['kasir'])) {
            $query->whereHas('kasir', function ($q) use ($params) {
                $q->where('nama_user', 'like', '%' . $params['kasir'] . '%');
            });
        }
        if (!empty($params['id_cabang'])) {
            $query->where('id_cabang', $params['id_cabang']);
        }
        if (!empty($params['id_metode'])) {
            $query->where('id_metode', $params['id_metode']);
        }
        if (!empty($params['tanggal_mulai'])) {
            $query->where('tanggal_transaksi', '>=', $params['tanggal_mulai']);
        }
        if (!empty($params['tanggal_akhir'])) {
            $query->where('tanggal_transaksi', '<=', $params['tanggal_akhir']);
        }
        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }
        if (!empty($params['nomor_referensi'])) {
            $query->where('nomor_referensi', 'like', '%' . $params['nomor_referensi'] . '%');
        }

        $transaksis = $query->get();

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.log.transaksi-pdf', compact('transaksis', 'params'));
            $pdf->setPaper('A4', 'landscape');
            $filename = 'transaksi-' . now()->format('Y-m-d-His') . '.pdf';
            return $pdf->download($filename);
        }

        return view('admin.log.transaksi-pdf', compact('transaksis', 'params'))
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
}
