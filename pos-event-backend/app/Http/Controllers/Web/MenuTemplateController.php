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
        $templates = MenuTemplate::with(['menu', 'cabang', 'salesMode'])
            ->whereHas('menu', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->whereHas('salesMode', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->when($search, function ($query, $search) {
                return $query->where(function($q2) use ($search) {
                    $q2->whereHas('menu', function ($q) use ($search) {
                        $q->where('nama_menu', 'like', "%{$search}%");
                    })
                    ->orWhereHas('cabang', function ($q) use ($search) {
                        $q->where('nama_cabang', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesMode', function ($q) use ($search) {
                        $q->where('nama_mode', 'like', "%{$search}%");
                    });
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

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
        $createdCount = 0;
        $skippedCount = 0;

        foreach ($cabangIds as $idCabang) {
            $exists = MenuTemplate::where('id_menu', $request->id_menu)
                        ->where('id_cabang', $idCabang)
                        ->where('id_sales', $request->id_sales)
                        ->exists();
            if ($exists) {
                $skippedCount++;
                continue;
            }

            $menuTemplate = MenuTemplate::create([
                'id_menu' => $request->id_menu,
                'id_cabang' => $idCabang,
                'id_sales' => $request->id_sales,
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

        if ($createdCount === 0 && $skippedCount > 0) {
            return back()->with('error', 'Harga untuk menu, cabang, dan sales mode yang dipilih sudah ada.')->withInput();
        }

        $msg = "Harga produk berhasil ditambahkan ke {$createdCount} cabang.";
        if ($skippedCount > 0) {
            $msg .= " ({$skippedCount} cabang dilewati karena sudah ada harga).";
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
        $dataSebelum = $menuTemplate->toArray();

        $firstCabang = array_shift($cabangIds);
        $menuTemplate->update([
            'id_menu' => $request->id_menu,
            'id_cabang' => $firstCabang,
            'id_sales' => $request->id_sales,
            'harga_produk' => $request->harga_produk,
        ]);

        $this->auditLog->log(
            aktivitas: 'UPDATE_HARGA_CABANG',
            tabelTarget: 'menu_template',
            idTarget: $menuTemplate->id_template,
            dataSebelum: $dataSebelum,
            dataSesudah: $menuTemplate->fresh()->toArray(),
            request: $request
        );

        $additionalCount = 0;
        foreach ($cabangIds as $idCabang) {
            $exists = MenuTemplate::where('id_menu', $request->id_menu)
                        ->where('id_cabang', $idCabang)
                        ->where('id_sales', $request->id_sales)
                        ->exists();
            if ($exists) {
                continue;
            }

            $newTpl = MenuTemplate::create([
                'id_menu' => $request->id_menu,
                'id_cabang' => $idCabang,
                'id_sales' => $request->id_sales,
                'harga_produk' => $request->harga_produk,
            ]);

            $this->auditLog->log(
                aktivitas: 'CREATE_HARGA_CABANG',
                tabelTarget: 'menu_template',
                idTarget: $newTpl->id_template,
                dataSesudah: $newTpl->toArray(),
                request: $request
            );

            $additionalCount++;
        }

        $msg = 'Harga produk berhasil diperbarui.';
        if ($additionalCount > 0) {
            $msg .= " Serta ditambahkan ke {$additionalCount} cabang baru.";
        }

        return redirect()->route('admin.harga-cabang.index')->with('success', $msg);
    }

    public function destroy(MenuTemplate $menuTemplate)
    {
        $dataSebelum = $menuTemplate->toArray();
        $menuTemplate->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_HARGA_CABANG',
            tabelTarget: 'menu_template',
            idTarget: $menuTemplate->id_template,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga cabang berhasil dihapus.');
    }
}
