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
        ])->orderBy('tanggal_transaksi', 'desc')
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

        return redirect()->route('admin.log.transaksi.index');
    }
}
