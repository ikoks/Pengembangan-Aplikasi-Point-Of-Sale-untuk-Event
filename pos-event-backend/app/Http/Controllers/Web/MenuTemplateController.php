<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\MenuTemplate;
use App\Models\Menu;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreMenuTemplateRequest;
use App\Http\Requests\Web\UpdateMenuTemplateRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

/**
 * MenuTemplateController — Harga Produk per Sales Mode
 *
 * [Poin 2] Refaktor: Harga kini diatur per Menu × Sales Mode (TANPA Cabang).
 * Setiap kombinasi Menu + Sales Mode hanya boleh ada satu baris harga.
 */
class MenuTemplateController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search  = $request->input('search');
        $idSales = $request->input('id_sales');

        $templates = MenuTemplate::with(['menu', 'salesMode'])
            ->whereHas('menu', fn ($q) => $q->where('status', 'Aktif'))
            ->whereHas('salesMode', fn ($q) => $q->where('status', 'Aktif'))
            ->when($idSales, fn ($q) => $q->where('id_sales', $idSales))
            ->when($search, function ($q, $search) {
                return $q->where(function ($q2) use ($search) {
                    $q2->whereHas('menu', fn ($q3) => $q3->where('nama_menu', 'like', "%{$search}%"))
                       ->orWhereHas('salesMode', fn ($q3) => $q3->where('nama_mode', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $menus      = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();

        // Untuk menampilkan nama mode yang sedang difilter di header
        $activeSalesMode = $idSales ? SalesMode::find($idSales) : null;

        return view('admin.harga-cabang.index', compact('templates', 'search', 'menus', 'salesModes', 'activeSalesMode'));
    }

    public function create()
    {
        $menus      = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        return view('admin.harga-cabang.create', compact('menus', 'salesModes'));
    }

    public function store(StoreMenuTemplateRequest $request)
    {
        // Poin 2: Satu menu + satu sales mode = satu harga (sudah divalidasi di FormRequest)
        $menuTemplate = MenuTemplate::create([
            'id_menu'      => $request->id_menu,
            'id_sales'     => $request->id_sales,
            'harga_produk' => $request->harga_produk,
        ]);

        $this->auditLog->log(
            aktivitas: 'CREATE_HARGA_PRODUK',
            tabelTarget: 'menu_template',
            idTarget: $menuTemplate->id_template,
            dataSesudah: $menuTemplate->toArray(),
            request: $request
        );

        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga produk berhasil ditambahkan.');
    }

    public function edit(MenuTemplate $menuTemplate)
    {
        $menus      = Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        return view('admin.harga-cabang.edit', compact('menuTemplate', 'menus', 'salesModes'));
    }

    public function update(UpdateMenuTemplateRequest $request, MenuTemplate $menuTemplate)
    {
        $dataSebelum = $menuTemplate->toArray();

        $menuTemplate->update([
            'id_menu'      => $request->id_menu,
            'id_sales'     => $request->id_sales,
            'harga_produk' => $request->harga_produk,
        ]);

        $this->auditLog->log(
            aktivitas: 'UPDATE_HARGA_PRODUK',
            tabelTarget: 'menu_template',
            idTarget: $menuTemplate->id_template,
            dataSebelum: $dataSebelum,
            dataSesudah: $menuTemplate->fresh()->toArray(),
            request: $request
        );

        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga produk berhasil diperbarui.');
    }

    public function destroy(MenuTemplate $menuTemplate)
    {
        $dataSebelum = $menuTemplate->toArray();
        $menuTemplate->delete();

        $this->auditLog->log(
            aktivitas: 'DELETE_HARGA_PRODUK',
            tabelTarget: 'menu_template',
            idTarget: $menuTemplate->id_template,
            dataSebelum: $dataSebelum
        );

        return redirect()->route('admin.harga-cabang.index')->with('success', 'Harga produk berhasil dihapus.');
    }
}
