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
use App\Services\AuditLogService;

class MenuTemplateController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = MenuTemplate::with(['menu', 'cabang', 'salesMode'])
            ->whereHas('menu', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->whereHas('salesMode', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->when($search, function ($q, $search) {
                return $q->where(function($q2) use ($search) {
                    $q2->whereHas('menu', function ($q3) use ($search) {
                        $q3->where('nama_menu', 'like', "%{$search}%");
                    })
                    ->orWhereHas('cabang', function ($q3) use ($search) {
                        $q3->where('nama_cabang', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesMode', function ($q3) use ($search) {
                        $q3->where('nama_mode', 'like', "%{$search}%");
                    });
                });
            })
            ->latest();

        $allTemplates = $query->get();
        
        $grouped = $allTemplates->groupBy(function($item) {
            return $item->id_menu . '-' . (float)$item->harga_produk;
        })->values();

        $page = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $perPage = 15;
        $templates = new \Illuminate\Pagination\LengthAwarePaginator(
            $grouped->forPage($page, $perPage),
            $grouped->count(),
            $perPage,
            $page,
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(), 'query' => $request->query()]
        );

        $menus = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();

        return view('admin.harga-cabang.index', compact('templates', 'search', 'menus', 'cabangs', 'salesModes'));
    }

    public function create()
    {
        $menus = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        return view('admin.harga-cabang.create', compact('menus', 'cabangs', 'salesModes'));
    }

    public function store(StoreMenuTemplateRequest $request)
    {
        $cabangIds = (array) $request->id_cabang;
        $salesIds = (array) $request->id_sales;
        $createdCount = 0;
        $skippedCount = 0;

        foreach ($cabangIds as $idCabang) {
            foreach ($salesIds as $idSales) {
                $exists = MenuTemplate::where('id_menu', $request->id_menu)
                            ->where('id_cabang', $idCabang)
                            ->where('id_sales', $idSales)
                            ->exists();
                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                $menuTemplate = MenuTemplate::create([
                    'id_menu' => $request->id_menu,
                    'id_cabang' => $idCabang,
                    'id_sales' => $idSales,
                    'harga_produk' => $request->harga_produk,
                ]);

                $this->auditLog->log(
                    aktivitas: 'CREATE_HARGA_CABANG',
                    tabelTarget: 'menu_template',
                    idTarget: $menuTemplate->id_template,
                    dataSesudah: $menuTemplate->toArray(),
                    request: $request
                );

                $createdCount++;
            }
        }

        if ($createdCount === 0 && $skippedCount > 0) {
            return back()->with('error', 'Harga untuk menu, cabang, dan sales mode yang dipilih sudah ada.')->withInput();
        }

        $msg = "Harga produk berhasil ditambahkan ke {$createdCount} kombinasi.";
        if ($skippedCount > 0) {
            $msg .= " ({$skippedCount} kombinasi dilewati karena sudah ada harga).";
        }

        return redirect()->route('admin.harga-cabang.index')->with('success', $msg);
    }

    public function edit(MenuTemplate $menuTemplate)
    {
        $menus = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        return view('admin.harga-cabang.edit', compact('menuTemplate', 'menus', 'cabangs', 'salesModes'));
    }

    public function update(UpdateMenuTemplateRequest $request, MenuTemplate $menuTemplate)
    {
        $cabangIds = (array) $request->id_cabang;
        $salesIds = (array) $request->id_sales;
        
        $oldIdMenu = $menuTemplate->id_menu;
        $oldHargaProduk = $menuTemplate->harga_produk;

        $oldTemplates = MenuTemplate::where('id_menu', $oldIdMenu)
            ->where('harga_produk', $oldHargaProduk)
            ->get();

        foreach ($oldTemplates as $oldTpl) {
            $dataSebelum = $oldTpl->toArray();
            $oldTpl->delete();

            $this->auditLog->log(
                aktivitas: 'DELETE_HARGA_CABANG_REPLACE',
                tabelTarget: 'menu_template',
                idTarget: $oldTpl->id_template,
                dataSebelum: $dataSebelum
            );
        }

        $createdCount = 0;
        foreach ($cabangIds as $cId) {
            foreach ($salesIds as $sId) {
                $exists = MenuTemplate::where('id_menu', $request->id_menu)
                            ->where('id_cabang', $cId)
                            ->where('id_sales', $sId)
                            ->exists();
                if ($exists) {
                    continue;
                }

                $newTpl = MenuTemplate::create([
                    'id_menu' => $request->id_menu,
                    'id_cabang' => $cId,
                    'id_sales' => $sId,
                    'harga_produk' => $request->harga_produk,
                ]);

                $this->auditLog->log(
                    aktivitas: 'UPDATE_HARGA_CABANG',
                    tabelTarget: 'menu_template',
                    idTarget: $newTpl->id_template,
                    dataSesudah: $newTpl->toArray(),
                    request: $request
                );

                $createdCount++;
            }
        }

        $msg = "Harga produk berhasil diperbarui ({$createdCount} kombinasi tersimpan).";
        return redirect()->route('admin.harga-cabang.index')->with('success', $msg);
    }

    public function destroy(MenuTemplate $menuTemplate)
    {
        $oldIdMenu = $menuTemplate->id_menu;
        $oldHargaProduk = $menuTemplate->harga_produk;

        $oldTemplates = MenuTemplate::where('id_menu', $oldIdMenu)
            ->where('harga_produk', $oldHargaProduk)
            ->get();
            
        $count = 0;
        foreach ($oldTemplates as $tpl) {
            $dataSebelum = $tpl->toArray();
            $tpl->delete();
            
            $this->auditLog->log(
                aktivitas: 'DELETE_HARGA_CABANG',
                tabelTarget: 'menu_template',
                idTarget: $tpl->id_template,
                dataSebelum: $dataSebelum
            );
            $count++;
        }
        
        return redirect()->route('admin.harga-cabang.index')->with('success', "{$count} harga cabang dalam kombinasi tersebut berhasil dihapus.");
    }
}
