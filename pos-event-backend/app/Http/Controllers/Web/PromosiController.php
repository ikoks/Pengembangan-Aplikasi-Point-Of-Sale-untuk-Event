<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Promosi;
use App\Http\Requests\Web\StorePromosiRequest;
use App\Http\Requests\Web\UpdatePromosiRequest;
use Illuminate\Http\Request;

class PromosiController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $promosis = Promosi::when($search, function ($query, $search) {
                return $query->where('nama_promo', 'like', "%{$search}%");
            })
            ->orderByDesc('nama_promo')
            ->paginate(15)
            ->withQueryString();

        return view('admin.promosi.index', compact('promosis', 'search'));
    }

    public function create()
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        return view('admin.promosi.create', compact('cabangs'));
    }

    public function store(StorePromosiRequest $request)
    {
        $validated = $request->validated();
        Promosi::create($validated);
        return redirect()->route('admin.promosi.index')->with('success', 'Promosi berhasil ditambahkan.');
    }

    public function edit(Promosi $promosi)
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        return view('admin.promosi.edit', compact('promosi', 'cabangs'));
    }

    public function update(UpdatePromosiRequest $request, Promosi $promosi)
    {
        $validated = $request->validated();
        $promosi->update($validated);
        return redirect()->route('admin.promosi.index')->with('success', 'Promosi berhasil diperbarui.');
    }

    public function destroy(Promosi $promosi)
    {
        $promosi->delete();
        return redirect()->route('admin.promosi.index')->with('success', 'Promosi berhasil dihapus.');
    }
}
