<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SubKategori;
use App\Models\Kategori;
use App\Http\Requests\Web\StoreSubKategoriRequest;
use App\Http\Requests\Web\UpdateSubKategoriRequest;
use Illuminate\Http\Request;

class SubKategoriController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $subKategoris = SubKategori::with('kategori')
            ->when($search, function ($query, $search) {
                return $query->where('nama_sub_kategori', 'like', "%{$search}%")
                             ->orWhereHas('kategori', function ($q) use ($search) {
                                 $q->where('nama_kategori', 'like', "%{$search}%");
                             });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.sub-kategori.index', compact('subKategoris', 'search'));
    }

    public function create()
    {
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        return view('admin.sub-kategori.create', compact('kategoris'));
    }

    public function store(StoreSubKategoriRequest $request)
    {
        SubKategori::create($request->validated());
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil ditambahkan.');
    }

    public function edit(SubKategori $subKategori)
    {
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        return view('admin.sub-kategori.edit', compact('subKategori', 'kategoris'));
    }

    public function update(UpdateSubKategoriRequest $request, SubKategori $subKategori)
    {
        $subKategori->update($request->validated());
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil diperbarui.');
    }

    public function destroy(SubKategori $subKategori)
    {
        $subKategori->delete();
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil dihapus.');
    }
}
