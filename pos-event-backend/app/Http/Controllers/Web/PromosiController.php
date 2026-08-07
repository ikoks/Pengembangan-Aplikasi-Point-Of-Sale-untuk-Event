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
        $query = Promosi::with(['cabang', 'salesMode'])
            ->when($search, function ($q, $search) {
                return $q->where('nama_promo', 'like', "%{$search}%");
            })
            ->orderByDesc('nama_promo');
            
        $allPromosis = $query->get();
        
        $grouped = $allPromosis->groupBy(function($item) {
            return $item->nama_promo;
        })->values();
        
        $page = \Illuminate\Pagination\Paginator::resolveCurrentPage() ?: 1;
        $perPage = 15;
        $promosis = new \Illuminate\Pagination\LengthAwarePaginator(
            $grouped->forPage($page, $perPage),
            $grouped->count(),
            $perPage,
            $page,
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(), 'query' => $request->query()]
        );

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
        
        $oldNamaPromo = $promosi->nama_promo;

        $oldPromos = Promosi::where('nama_promo', $oldNamaPromo)->get();

        foreach ($oldPromos as $oldPrm) {
            $dataSebelum = $oldPrm->toArray();
            $oldPrm->delete();

            $this->auditLog->log(
                aktivitas: 'DELETE_PROMOSI_REPLACE',
                tabelTarget: 'promosi',
                idTarget: $oldPrm->id_promo,
                dataSebelum: $dataSebelum
            );
        }

        $createdCount = 0;
        foreach ($cabangIds as $cId) {
            foreach ($salesIds as $sId) {
                $existing = Promosi::where('nama_promo', $validated['nama_promo'])
                            ->where('id_cabang', $cId)
                            ->where('id_sales', $sId)
                            ->first();

                $newData = $validated;
                $newData['id_cabang'] = $cId;
                $newData['id_sales'] = $sId;

                if ($existing) {
                    $dataSebelum = $existing->toArray();
                    $existing->update($newData);

                    $this->auditLog->log(
                        aktivitas: 'UPDATE_PROMOSI_OVERWRITE',
                        tabelTarget: 'promosi',
                        idTarget: $existing->id_promo,
                        dataSebelum: $dataSebelum,
                        dataSesudah: $existing->toArray(),
                        request: $request
                    );
                } else {
                    $newPromosi = Promosi::create($newData);

                    $this->auditLog->log(
                        aktivitas: 'UPDATE_PROMOSI',
                        tabelTarget: 'promosi',
                        idTarget: $newPromosi->id_promo,
                        dataSesudah: $newPromosi->toArray(),
                        request: $request
                    );
                }
                
                $createdCount++;
            }
        }

        $msg = "Promosi berhasil diperbarui ({$createdCount} kombinasi tersimpan).";
        return redirect()->route('admin.promosi.index')->with('success', $msg);
    }

    public function destroy(Promosi $promosi)
    {
        $oldNamaPromo = $promosi->nama_promo;
        
        $oldPromos = Promosi::where('nama_promo', $oldNamaPromo)->get();

        $count = 0;
        foreach ($oldPromos as $oldPrm) {
            $dataSebelum = $oldPrm->toArray();
            $oldPrm->delete();
            
            $this->auditLog->log(
                aktivitas: 'DELETE_PROMOSI',
                tabelTarget: 'promosi',
                idTarget: $oldPrm->id_promo,
                dataSebelum: $dataSebelum
            );
            $count++;
        }
        
        return redirect()->route('admin.promosi.index')->with('success', "{$count} kombinasi promosi berhasil dihapus.");
    }
}
