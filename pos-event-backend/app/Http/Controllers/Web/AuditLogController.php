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
}
