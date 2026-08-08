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
        $kategoris = KategoriMetodePembayaran::when($search, function ($query, $search) {
                return $query->where('nama_kategori', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.kategori-metode-pembayaran.index', compact('kategoris', 'search'));
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

    public function destroy(string $id)
    {
        $kategori = KategoriMetodePembayaran::findOrFail($id);
        
        try {
            $kategori->delete();
            return redirect()->route('admin.kategori-metode.index')->with('success', 'Kategori metode berhasil dihapus.');
        } catch (\Exception $e) {
            return redirect()->route('admin.kategori-metode.index')->with('error', 'Gagal menghapus kategori. Kategori mungkin sedang digunakan.');
        }
    }
}
