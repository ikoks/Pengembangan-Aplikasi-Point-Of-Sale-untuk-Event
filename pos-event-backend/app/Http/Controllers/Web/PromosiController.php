<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Promosi;
use App\Http\Requests\Web\StorePromosiRequest;
use App\Http\Requests\Web\UpdatePromosiRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class PromosiController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $promosis = Promosi::when($search, function ($query, $search) {
                return $query->where('nama_promo', 'like', "%{$search}%");
            })
            ->orderByDesc('nama_promo')
            ->paginate(15)
            ->withQueryString();

        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        $salesModes = \App\Models\SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        $menus = \App\Models\Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        return view('admin.promosi.index', compact('promosis', 'search', 'cabangs', 'salesModes', 'menus'));
    }

    public function create()
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        $salesModes = \App\Models\SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        $menus = \App\Models\Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        return view('admin.promosi.create', compact('cabangs', 'salesModes', 'menus'));
    }

    public function store(StorePromosiRequest $request)
    {
        $validated = $request->validated();
        
        // Clean data based on cakupan
        if ($validated['cakupan_promo'] === 'Per Transaksi') {
            $validated['syarat_menu'] = null;
        } elseif ($validated['cakupan_promo'] === 'Free Item') {
            $validated['tipe_promo'] = null;
            $validated['nilai_promo'] = null;
        }

        $cabangIds = (array) $request->id_cabang;
        $salesIds = (array) $request->id_sales;
        $createdCount = 0;

        foreach ($cabangIds as $idCabang) {
            foreach ($salesIds as $idSales) {
                $data = $validated;
                $data['id_cabang'] = $idCabang;
                $data['id_sales'] = $idSales;
                $promosi = Promosi::create($data);
                
                $this->auditLog->log(
                    aktivitas: 'CREATE_PROMOSI',
                    tabelTarget: 'promosi',
                    idTarget: $promosi->id_promo,
                    dataSesudah: $promosi->toArray(),
                    request: $request
                );
                $createdCount++;
            }
        }
        
        return redirect()->route('admin.promosi.index')->with('success', "Promosi berhasil ditambahkan dengan {$createdCount} kombinasi cabang & sales mode.");
    }

    public function edit(Promosi $promosi)
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        $salesModes = \App\Models\SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();
        $menus = \App\Models\Menu::where('status', 'Aktif')->orderBy('nama_menu')->get();
        return view('admin.promosi.edit', compact('promosi', 'cabangs', 'salesModes', 'menus'));
    }

    public function update(UpdatePromosiRequest $request, Promosi $promosi)
    {
        $validated = $request->validated();
        
        // Clean data based on cakupan
        if ($validated['cakupan_promo'] === 'Per Transaksi') {
            $validated['syarat_menu'] = null;
        } elseif ($validated['cakupan_promo'] === 'Free Item') {
            $validated['tipe_promo'] = null;
            $validated['nilai_promo'] = null;
        }

        $cabangIds = (array) $request->id_cabang;
        $salesIds = (array) $request->id_sales;
        $dataSebelum = $promosi->toArray();

        $combinations = [];
        foreach ($cabangIds as $cId) {
            foreach ($salesIds as $sId) {
                $combinations[] = ['id_cabang' => $cId, 'id_sales' => $sId];
            }
        }

        $firstCombo = array_shift($combinations);
        $dataCurrent = $validated;
        $dataCurrent['id_cabang'] = $firstCombo['id_cabang'];
        $dataCurrent['id_sales'] = $firstCombo['id_sales'];
        $promosi->update($dataCurrent);

        $this->auditLog->log(
            aktivitas: 'UPDATE_PROMOSI',
            tabelTarget: 'promosi',
            idTarget: $promosi->id_promo,
            dataSebelum: $dataSebelum,
            dataSesudah: $promosi->fresh()->toArray(),
            request: $request
        );

        $additionalCount = 0;
        foreach ($combinations as $combo) {
            $newData = $validated;
            $newData['id_cabang'] = $combo['id_cabang'];
            $newData['id_sales'] = $combo['id_sales'];
            $newPromosi = Promosi::create($newData);

            $this->auditLog->log(
                aktivitas: 'CREATE_PROMOSI',
                tabelTarget: 'promosi',
                idTarget: $newPromosi->id_promo,
                dataSesudah: $newPromosi->toArray(),
                request: $request
            );
            $additionalCount++;
        }

        $msg = 'Promosi berhasil diperbarui.';
        if ($additionalCount > 0) {
            $msg .= " Serta diterapkan ke {$additionalCount} kombinasi tambahan.";
        }

        return redirect()->route('admin.promosi.index')->with('success', $msg);
    }

    public function destroy(Promosi $promosi)
    {
        $dataSebelum = $promosi->toArray();
        $promosi->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_PROMOSI',
            tabelTarget: 'promosi',
            idTarget: $promosi->id_promo,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.promosi.index')->with('success', 'Promosi berhasil dihapus.');
    }
}
