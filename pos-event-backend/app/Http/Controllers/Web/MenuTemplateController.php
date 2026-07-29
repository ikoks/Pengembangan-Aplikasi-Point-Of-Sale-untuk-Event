<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MenuTemplate;
use App\Models\Menu;
use App\Models\Cabang;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreMenuTemplateRequest;
use App\Http\Requests\Web\UpdateMenuTemplateRequest;
use Illuminate\Http\Request;

class MenuTemplateController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $templates = MenuTemplate::with(['menu', 'cabang', 'salesMode'])
            ->when($search, function ($query, $search) {
                return $query->whereHas('menu', function ($q) use ($search) {
                                 $q->where('nama_menu', 'like', "%{$search}%");
                             })
                             ->orWhereHas('cabang', function ($q) use ($search) {
                                 $q->where('nama_cabang', 'like', "%{$search}%");
                             })
                             ->orWhereHas('salesMode', function ($q) use ($search) {
                                 $q->where('nama_mode', 'like', "%{$search}%");
                             });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.harga-cabang.index', compact('templates', 'search'));
    }

    public function create()
    {
        $menus = Menu::orderBy('nama_menu')->get();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::orderBy('nama_mode')->get();
        return view('admin.harga-cabang.create', compact('menus', 'cabangs', 'salesModes'));
    }

    public function store(StoreMenuTemplateRequest $request)
    {
        // Cegah duplikasi
        $exists = MenuTemplate::where('id_menu', $request->id_menu)
                    ->where('id_cabang', $request->id_cabang)
                    ->where('id_sales', $request->id_sales)
                    ->exists();
        
        if ($exists) {
            return back()->with('error', 'Harga untuk menu, cabang, dan sales mode tersebut sudah ada.')->withInput();
        }

        MenuTemplate::create($request->validated());
        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga cabang berhasil ditambahkan.');
    }

    public function edit(MenuTemplate $menuTemplate)
    {
        $menus = Menu::orderBy('nama_menu')->get();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::orderBy('nama_mode')->get();
        return view('admin.harga-cabang.edit', compact('menuTemplate', 'menus', 'cabangs', 'salesModes'));
    }

    public function update(UpdateMenuTemplateRequest $request, MenuTemplate $menuTemplate)
    {
        $exists = MenuTemplate::where('id_menu', $request->id_menu)
                    ->where('id_cabang', $request->id_cabang)
                    ->where('id_sales', $request->id_sales)
                    ->where('id_template', '!=', $menuTemplate->id_template)
                    ->exists();
        
        if ($exists) {
            return back()->with('error', 'Harga untuk menu, cabang, dan sales mode tersebut sudah ada.')->withInput();
        }

        $menuTemplate->update($request->validated());
        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga cabang berhasil diperbarui.');
    }

    public function destroy(MenuTemplate $menuTemplate)
    {
        $menuTemplate->delete();
        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga cabang berhasil dihapus.');
    }
}
