<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MetodePembayaran;
use App\Models\KategoriMetodePembayaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MetodePembayaranController extends Controller
{
    public function index(Request $request)
    {
        $query = MetodePembayaran::with('kategoriMetode');

        if ($request->filled('search')) {
            $search = strtolower($request->search);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_metode) LIKE ?', ["%{$search}%"])
                  ->orWhereHas('kategoriMetode', function($k) use ($search) {
                      $k->whereRaw('LOWER(nama_kategori) LIKE ?', ["%{$search}%"]);
                  });
            });
        }

        $metodePembayaran = $query->orderBy('nama_metode', 'asc')->paginate(10)->withQueryString();
        $kategoriMetodes = KategoriMetodePembayaran::orderBy('nama_kategori', 'asc')->get();

        return view('admin.metode-pembayaran.index', compact('metodePembayaran', 'kategoriMetodes'));
    }

    public function store(Request $request)
    {
        $namaMetode = $request->nama_metode === 'lainnya' ? $request->nama_metode_custom : $request->nama_metode;

        $request->merge(['nama_metode_final' => $namaMetode]);

        $request->validate([
            'nama_metode_final' => ['required', 'string', 'max:50', 'unique:metode_pembayaran,nama_metode'],
            'id_kategori_metode' => ['required', 'exists:kategori_metode_pembayaran,id_kategori_metode'],
        ], [
            'nama_metode_final.required' => 'Nama metode wajib diisi.',
            'nama_metode_final.unique' => 'Nama metode sudah digunakan.',
            'id_kategori_metode.required' => 'Kategori metode wajib dipilih.',
            'id_kategori_metode.exists' => 'Kategori metode tidak valid.',
        ]);

        MetodePembayaran::create([
            'nama_metode' => $namaMetode,
            'id_kategori_metode' => $request->id_kategori_metode,
        ]);

        return redirect()->route('admin.metode-pembayaran.index')->with('success', 'Metode Pembayaran berhasil ditambahkan!');
    }

    public function update(Request $request, string $id)
    {
        $metode = MetodePembayaran::findOrFail($id);

        $namaMetode = $request->nama_metode === 'lainnya' ? $request->nama_metode_custom : $request->nama_metode;
        $request->merge(['nama_metode_final' => $namaMetode]);

        $request->validate([
            'nama_metode_final' => [
                'required', 
                'string', 
                'max:50', 
                Rule::unique('metode_pembayaran', 'nama_metode')->ignore($metode->id_metode, 'id_metode')
            ],
            'id_kategori_metode' => ['required', 'exists:kategori_metode_pembayaran,id_kategori_metode'],
        ], [
            'nama_metode_final.required' => 'Nama metode wajib diisi.',
            'nama_metode_final.unique' => 'Nama metode sudah digunakan.',
            'id_kategori_metode.required' => 'Kategori metode wajib dipilih.',
            'id_kategori_metode.exists' => 'Kategori metode tidak valid.',
        ]);

        $metode->update([
            'nama_metode' => $namaMetode,
            'id_kategori_metode' => $request->id_kategori_metode,
        ]);

        return redirect()->route('admin.metode-pembayaran.index')->with('success', 'Metode Pembayaran berhasil diperbarui!');
    }

    public function destroy(string $id)
    {
        $metode = MetodePembayaran::findOrFail($id);
        
        try {
            $metode->delete();
            return redirect()->route('admin.metode-pembayaran.index')->with('success', 'Metode Pembayaran berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->route('admin.metode-pembayaran.index')->with('error', 'Gagal menghapus! Metode Pembayaran mungkin sedang digunakan.');
        }
    }
}
