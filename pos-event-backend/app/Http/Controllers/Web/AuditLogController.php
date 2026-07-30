<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

// Viewer Audit Log Sistem
class AuditLogController extends Controller
{
    // Tampilkan daftar audit log dengan filter
    public function index(Request $request)
    {
        $query = AuditLog::with('user')
            ->orderBy('waktu_kejadian', 'desc');

        if ($request->filled('aktivitas')) {
            $query->where('aktivitas', 'like', '%' . $request->aktivitas . '%');
        }

        if ($request->filled('actor')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('nama_user', 'like', '%' . $request->actor . '%');
            });
        }

        if ($request->filled('tabel_target')) {
            $query->where('tabel_target', $request->tabel_target);
        }

        if ($request->filled('ip_address')) {
            $query->where('ip_address', 'like', '%' . $request->ip_address . '%');
        }

        if ($request->filled('tanggal_mulai')) {
            $query->whereDate('waktu_kejadian', '>=', $request->tanggal_mulai);
        }
        if ($request->filled('tanggal_akhir')) {
            $query->whereDate('waktu_kejadian', '<=', $request->tanggal_akhir);
        }

        $logs = $query->paginate(30)->withQueryString();

        return view('admin.log.audit', compact('logs'));
    }

    // Ekspor ke Excel
    public function exportExcel(Request $request)
    {
        $params = $request->only([
            'aktivitas', 'actor', 'tabel_target', 'ip_address', 'tanggal_mulai', 'tanggal_akhir'
        ]);

        if (class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            $filename = 'audit-log-' . now()->format('Y-m-d-His') . '.xlsx';
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\AuditLogExport($params),
                $filename
            );
        }

        return back()->with('error', 'Package Maatwebsite Excel belum terinstall.');
    }

    // Ekspor ke PDF
    public function exportPdf(Request $request)
    {
        $params = $request->only([
            'aktivitas', 'actor', 'tabel_target', 'ip_address', 'tanggal_mulai', 'tanggal_akhir'
        ]);

        // Re-use the query logic from index to get all filtered data
        $query = AuditLog::with('user')->orderBy('waktu_kejadian', 'desc');

        if (!empty($params['aktivitas'])) {
            $query->where('aktivitas', 'like', '%' . $params['aktivitas'] . '%');
        }
        if (!empty($params['actor'])) {
            $actor = $params['actor'];
            $query->whereHas('user', function ($q) use ($actor) {
                $q->where('nama_user', 'like', '%' . $actor . '%');
            });
        }
        if (!empty($params['tabel_target'])) {
            $query->where('tabel_target', $params['tabel_target']);
        }
        if (!empty($params['ip_address'])) {
            $query->where('ip_address', 'like', '%' . $params['ip_address'] . '%');
        }
        if (!empty($params['tanggal_mulai'])) {
            $query->whereDate('waktu_kejadian', '>=', $params['tanggal_mulai']);
        }
        if (!empty($params['tanggal_akhir'])) {
            $query->whereDate('waktu_kejadian', '<=', $params['tanggal_akhir']);
        }

        $logs = $query->get();

        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.log.audit-pdf', compact('logs', 'params'));
            $pdf->setPaper('A4', 'landscape');
            $filename = 'audit-log-' . now()->format('Y-m-d-His') . '.pdf';
            return $pdf->download($filename);
        }

        return view('admin.log.audit-pdf', compact('logs', 'params'))
            ->header('Content-Type', 'text/html; charset=utf-8');
    }
}
