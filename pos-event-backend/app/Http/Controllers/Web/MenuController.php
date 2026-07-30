<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\SubKategori;
use App\Http\Requests\Web\StoreMenuRequest;
use App\Http\Requests\Web\UpdateMenuRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class MenuController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

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

        $subKategoris = SubKategori::with('kategori')->get()->sortBy(function($sub) {
            return $sub->kategori->nama_kategori . ' - ' . $sub->nama_sub_kategori;
        });

        return view('admin.menu.index', compact('menus', 'search', 'subKategoris'));
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
        $menu = Menu::create($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'CREATE_MENU',
            tabelTarget: 'menu',
            idTarget: $menu->id_menu,
            dataSesudah: $menu->toArray(),
            request: $request
        );
        
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
        $dataSebelum = $menu->toArray();
        $menu->update($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_MENU',
            tabelTarget: 'menu',
            idTarget: $menu->id_menu,
            dataSebelum: $dataSebelum,
            dataSesudah: $menu->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.menu.index')->with('success', 'Menu berhasil diperbarui.');
    }

    public function destroy(Menu $menu)
    {
        $dataSebelum = $menu->toArray();
        $menu->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_MENU',
            tabelTarget: 'menu',
            idTarget: $menu->id_menu,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.menu.index')->with('success', 'Menu berhasil dihapus.');
    }

    public function toggleStatus(Menu $menu)
    {
        $dataSebelum = $menu->toArray();
        $menu->status = $menu->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $menu->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_MENU_STATUS',
            tabelTarget: 'menu',
            idTarget: $menu->id_menu,
            dataSebelum: $dataSebelum,
            dataSesudah: $menu->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status menu berhasil diubah.');
    }
}
