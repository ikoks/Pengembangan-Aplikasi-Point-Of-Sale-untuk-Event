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
        return view('admin.promosi.index', compact('promosis', 'search', 'cabangs'));
    }

    public function create()
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        return view('admin.promosi.create', compact('cabangs'));
    }

    public function store(StorePromosiRequest $request)
    {
        $validated = $request->validated();
        $cabangIds = (array) $request->id_cabang;
        $createdCount = 0;

        foreach ($cabangIds as $idCabang) {
            $data = $validated;
            $data['id_cabang'] = $idCabang;
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
        
        return redirect()->route('admin.promosi.index')->with('success', "Promosi berhasil ditambahkan ke {$createdCount} cabang.");
    }

    public function edit(Promosi $promosi)
    {
        $cabangs = \App\Models\Cabang::orderBy('nama_cabang')->get();
        return view('admin.promosi.edit', compact('promosi', 'cabangs'));
    }

    public function update(UpdatePromosiRequest $request, Promosi $promosi)
    {
        $validated = $request->validated();
        $cabangIds = (array) $request->id_cabang;
        $dataSebelum = $promosi->toArray();

        $firstCabang = array_shift($cabangIds);
        $dataCurrent = $validated;
        $dataCurrent['id_cabang'] = $firstCabang;
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
        foreach ($cabangIds as $idCabang) {
            $newData = $validated;
            $newData['id_cabang'] = $idCabang;
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
            $msg .= " Serta diterapkan ke {$additionalCount} cabang tambahan.";
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
