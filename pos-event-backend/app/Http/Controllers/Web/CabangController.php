<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
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
        $cabangs = Cabang::when($search, function ($query, $search) {
                return $query->where('nama_cabang', 'like', "%{$search}%")
                             ->orWhere('lokasi', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.cabang.index', compact('cabangs', 'search'));
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
}
