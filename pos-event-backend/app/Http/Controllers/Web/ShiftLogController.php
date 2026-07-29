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
            'transaksis',
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
}
