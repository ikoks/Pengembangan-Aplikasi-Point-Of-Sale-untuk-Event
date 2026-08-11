<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\SalesMode;
use App\Http\Requests\Web\StoreCabangRequest;
use App\Http\Requests\Web\UpdateCabangRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class CabangController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'Aktif');
        
        $cabangs = Cabang::with('salesMode')
            ->when($search, function ($query, $search) {
                return $query->where(function($q) use ($search) {
                    $q->where('nama_cabang', 'like', "%{$search}%")
                      ->orWhere('lokasi', 'like', "%{$search}%");
                });
            })
            ->when($status !== 'Semua', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $salesModes = SalesMode::where('status', 'Aktif')->orderBy('nama_mode')->get();

        return view('admin.cabang.index', compact('cabangs', 'search', 'status', 'salesModes'));
    }

    public function create()
    {
        return view('admin.cabang.create');
    }

    public function store(StoreCabangRequest $request)
    {
        $cabang = Cabang::create($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'CREATE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSesudah: $cabang->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil ditambahkan.');
    }

    public function edit(Cabang $cabang)
    {
        return view('admin.cabang.edit', compact('cabang'));
    }

    public function update(UpdateCabangRequest $request, Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->update($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum,
            dataSesudah: $cabang->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil diperbarui.');
    }

    public function destroy(Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_CABANG',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.cabang.index')->with('success', 'Cabang berhasil dihapus.');
    }

    public function toggleStatus(Cabang $cabang)
    {
        $dataSebelum = $cabang->toArray();
        $cabang->status = $cabang->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $cabang->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_CABANG_STATUS',
            tabelTarget: 'cabang',
            idTarget: $cabang->id_cabang,
            dataSebelum: $dataSebelum,
            dataSesudah: $cabang->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status cabang berhasil diubah.');
    }
}
