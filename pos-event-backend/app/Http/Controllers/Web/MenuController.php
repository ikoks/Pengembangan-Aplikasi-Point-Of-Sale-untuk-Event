<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\SubKategori;
use App\Http\Requests\Web\StoreMenuRequest;
use App\Http\Requests\Web\UpdateMenuRequest;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $menus = Menu::with('subKategori.kategori')
            ->when($search, function ($query, $search) {
                return $query->where('nama_menu', 'like', "%{$search}%")
                             ->orWhereHas('subKategori', function ($q) use ($search) {
                                 $q->where('nama_sub_kategori', 'like', "%{$search}%")
                                   ->orWhereHas('kategori', function ($q2) use ($search) {
                                       $q2->where('nama_kategori', 'like', "%{$search}%");
                                   });
                             });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.menu.index', compact('menus', 'search'));
    }

    public function create()
    {
        $subKategoris = SubKategori::with('kategori')->get()->sortBy(function($sub) {
            return $sub->kategori->nama_kategori . ' - ' . $sub->nama_sub_kategori;
        });
        return view('admin.menu.create', compact('subKategoris'));
    }

    public function store(StoreMenuRequest $request)
    {
        Menu::create($request->validated());
        return redirect()->route('admin.menu.index')->with('success', 'Menu berhasil ditambahkan.');
    }

    public function edit(Menu $menu)
    {
        $subKategoris = SubKategori::with('kategori')->get()->sortBy(function($sub) {
            return $sub->kategori->nama_kategori . ' - ' . $sub->nama_sub_kategori;
        });
        return view('admin.menu.edit', compact('menu', 'subKategoris'));
    }

    public function update(UpdateMenuRequest $request, Menu $menu)
    {
        $menu->update($request->validated());
        return redirect()->route('admin.menu.index')->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(Menu $menu)
    {
        $menu->delete();
        return redirect()->route('admin.menu.index')->with('success', 'Menu berhasil dihapus.');
    }
}
