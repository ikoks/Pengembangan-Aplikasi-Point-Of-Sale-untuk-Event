<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\KategoriMetodePembayaran;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KategoriMetodePembayaranController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'Aktif');
        
        $kategoris = KategoriMetodePembayaran::when($search, function ($query, $search) {
                return $query->where('nama_kategori', 'like', "%{$search}%");
            })
            ->when($status !== 'Semua', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.kategori-metode-pembayaran.index', compact('kategoris', 'search', 'status'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_kategori' => ['required', 'string', 'max:50', 'unique:kategori_metode_pembayaran,nama_kategori'],
        ], [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique' => 'Nama kategori sudah ada.',
        ]);

        KategoriMetodePembayaran::create($request->only('nama_kategori'));
        
        return redirect()->route('admin.kategori-metode.index')->with('success', 'Kategori metode berhasil ditambahkan.');
    }

    public function update(Request $request, string $id)
    {
        $kategori = KategoriMetodePembayaran::findOrFail($id);

        $request->validate([
            'nama_kategori' => [
                'required', 
                'string', 
                'max:50', 
                Rule::unique('kategori_metode_pembayaran', 'nama_kategori')->ignore($kategori->id_kategori_metode, 'id_kategori_metode')
            ],
        ], [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.unique' => 'Nama kategori sudah ada.',
        ]);

        $kategori->update($request->only('nama_kategori'));
        
        return redirect()->route('admin.kategori-metode.index')->with('success', 'Kategori metode berhasil diperbarui.');
    }

    public function destroy(KategoriMetodePembayaran $kategoriMetode)
    {
        try {
            $dataSebelum = $kategoriMetode->toArray();
            $kategoriMetode->delete();

            $this->auditLog->log(
                aktivitas: 'DELETE_KATEGORI_METODE_PEMBAYARAN',
                tabelTarget: 'kategori_metode_pembayaran',
                idTarget: $kategoriMetode->id_kategori_metode,
                dataSebelum: $dataSebelum
            );

            return redirect()->route('admin.kategori-metode.index')->with('success', 'Kategori metode pembayaran berhasil dihapus.');
        } catch (\Illuminate\Database\QueryException $e) {
            return redirect()->route('admin.kategori-metode.index')->with('error', 'Gagal menghapus! Kategori ini mungkin sedang digunakan.');
        }
    }

    public function toggleStatus(KategoriMetodePembayaran $kategoriMetode)
    {
        $dataSebelum = $kategoriMetode->toArray();
        $kategoriMetode->status = $kategoriMetode->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $kategoriMetode->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_KATEGORI_METODE_STATUS',
            tabelTarget: 'kategori_metode_pembayaran',
            idTarget: $kategoriMetode->id_kategori_metode,
            dataSebelum: $dataSebelum,
            dataSesudah: $kategoriMetode->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status kategori metode pembayaran berhasil diubah.');
    }
}
