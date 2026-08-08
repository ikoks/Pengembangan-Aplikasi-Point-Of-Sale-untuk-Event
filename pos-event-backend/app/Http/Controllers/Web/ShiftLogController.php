<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\ShiftSession;
use Illuminate\Http\Request;

// Viewer Log Shift Kasir
class ShiftLogController extends Controller
{
    // Tampilkan daftar sesi shift dengan filter
    public function index(Request $request)
    {
        $query = ShiftSession::with([
            'user',
            'userAktif',
            'cabang',
            'salesMode',
            'operatorLogs.user',
            'transaksis.metodePembayaran.kategoriMetode',
        ])->orderBy('waktu_mulai', 'desc');

        if ($request->filled('kasir')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('nama_user', 'like', '%' . $request->kasir . '%');
            });
        }

        if ($request->filled('id_cabang')) {
            $query->where('id_cabang', $request->id_cabang);
        }

        if ($request->filled('status_shift')) {
            $query->where('status_shift', $request->status_shift);
        }

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('waktu_mulai', '>=', $request->tanggal_mulai);
        }
        if ($request->filled('tanggal_akhir')) {
            $query->whereDate('waktu_mulai', '<=', $request->tanggal_akhir);
        }

        if ($request->boolean('auto_closed')) {
            $query->whereHas('operatorLogs', function ($q) {
                $q->where('catatan', 'like', '%auto_closed%');
            });
        }

        $shifts = $query->paginate(20)->withQueryString();
        $cabangs = Cabang::orderBy('nama_cabang')->get();

        return view('admin.log.shift', compact('shifts', 'cabangs'));
    }

    // Ekspor ke Excel
    public function exportExcel(Request $request)
    {
        $params = $request->only([
            'kasir', 'id_cabang', 'status_shift', 'tanggal_mulai', 'tanggal_akhir', 'auto_closed'
        ]);

        if (class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            $filename = 'shift-log-' . now()->format('Y-m-d-His') . '.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\ShiftLogExport($params),
                $filename
            );
        }

        return back()->with('error', 'Package Maatwebsite Excel belum terinstall.');
    }

    // Ekspor ke PDF
    public function exportPdf(Request $request)
    {
        $params = $request->only([
            'kasir', 'id_cabang', 'status_shift', 'tanggal_mulai', 'tanggal_akhir', 'auto_closed'
        ]);

        $query = ShiftSession::with([
            'user', 'cabang', 'salesMode', 'operatorLogs.user', 'transaksis',
        ])->orderBy('waktu_mulai', 'desc');

        if (!empty($params['kasir'])) {
            $query->whereHas('user', function ($q) use ($params) {
                $q->where('nama_user', 'like', '%' . $params['kasir'] . '%');
            });
        }
        if (!empty($params['id_cabang'])) {
            $query->where('id_cabang', $params['id_cabang']);
        }
        if (!empty($params['status_shift'])) {
            $query->where('status_shift', $params['status_shift']);
        }
        if (!empty($params['tanggal_mulai'])) {
            $query->whereDate('waktu_mulai', '>=', $params['tanggal_mulai']);
        }
        if (!empty($params['tanggal_akhir'])) {
            $query->whereDate('waktu_mulai', '<=', $params['tanggal_akhir']);
        }
        if (!empty($params['auto_closed'])) {
            $query->whereHas('operatorLogs', function ($q) {
                $q->where('catatan', 'like', '%auto_closed%');
            });
        }

        $shifts = $query->get();

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.log.shift-pdf', compact('shifts', 'params'));
            $pdf->setPaper('A4', 'landscape');
            $filename = 'shift-log-' . now()->format('Y-m-d-His') . '.pdf';
            return $pdf->download($filename);
        }

        return view('admin.log.shift-pdf', compact('shifts', 'params'))
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
}
