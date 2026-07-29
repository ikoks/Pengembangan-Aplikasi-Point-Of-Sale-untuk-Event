<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\Kategori;
use App\Models\MetodePembayaran;
use App\Services\ExportService;
use Illuminate\Http\Request;

// Controller Laporan Keuangan & Ekspor
class LaporanController extends Controller
{
    public function __construct(protected ExportService $exportService)
    {
    }

    // Tampilkan form & data laporan
    public function index(Request $request)
    {
        $cabangs  = Cabang::orderBy('nama_cabang')->get();
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        $metodes  = MetodePembayaran::orderBy('nama_metode')->get();

        $transaksis = null;
        $kpi        = null;
        $params     = [];

        if ($request->has('generate') || $request->has('tanggal_mulai')) {
            $params = $request->only([
                'jenis_laporan',
                'tanggal_mulai',
                'tanggal_akhir',
                'id_cabang',
                'id_kategori',
                'id_metode',
            ]);

            $laporanData = $this->exportService->getLaporanData($params);
            $transaksis  = $laporanData['transaksis'];
            $kpi         = $laporanData['kpi'];
        }

        return view('admin.laporan.index', compact(
            'cabangs',
            'kategoris',
            'metodes',
            'transaksis',
            'kpi',
            'params'
        ));
    }

    // Ekspor laporan ke PDF
    public function exportPdf(Request $request)
    {
        $params = $request->only([
            'jenis_laporan', 'tanggal_mulai', 'tanggal_akhir',
            'id_cabang', 'id_kategori', 'id_metode',
        ]);

        $laporanData = $this->exportService->getLaporanData($params);
        $transaksis  = $laporanData['transaksis'];
        $kpi         = $laporanData['kpi'];

        $cabangs   = Cabang::orderBy('nama_cabang')->get();
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        $metodes   = MetodePembayaran::orderBy('nama_metode')->get();

        $viewData = compact('transaksis', 'kpi', 'params', 'cabangs', 'kategoris', 'metodes');

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.laporan.pdf', $viewData);
            $pdf->setPaper('A4', 'landscape');

            $filename = 'laporan-keuangan-' . now()->format('Y-m-d-His') . '.pdf';
            return $pdf->download($filename);
        }

        return view('admin.laporan.pdf', $viewData)
            ->header('Content-Type', 'text/html; charset=utf-8');
    }

    // Ekspor laporan ke Excel
    public function exportExcel(Request $request)
    {
        $params = $request->only([
            'jenis_laporan', 'tanggal_mulai', 'tanggal_akhir',
            'id_cabang', 'id_kategori', 'id_metode',
        ]);

        if (class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            $filename = 'laporan-keuangan-' . now()->format('Y-m-d-His') . '.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\LaporanExport($params),
                $filename
            );
        }

        return redirect()->route('admin.laporan.index', $params)
            ->with('error', 'Package Maatwebsite Excel belum terinstall. Jalankan: composer require maatwebsite/excel');
    }
}
