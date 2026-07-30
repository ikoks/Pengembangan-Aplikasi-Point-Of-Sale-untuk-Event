<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SubKategori;
use App\Models\Kategori;
use App\Http\Requests\Web\StoreSubKategoriRequest;
use App\Http\Requests\Web\UpdateSubKategoriRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class SubKategoriController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $subKategoris = SubKategori::with('kategori')
            ->when($search, function ($query, $search) {
                return $query->where('nama_sub_kategori', 'like', "%{$search}%")
                             ->orWhereHas('kategori', function ($q) use ($search) {
                                 $q->where('nama_kategori', 'like', "%{$search}%");
                             });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $kategoris = Kategori::orderBy('nama_kategori')->get();

        return view('admin.sub-kategori.index', compact('subKategoris', 'search', 'kategoris'));
    }

    public function create()
    {
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        return view('admin.sub-kategori.create', compact('kategoris'));
    }

    public function store(StoreSubKategoriRequest $request)
    {
        $subKategori = SubKategori::create($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'CREATE_SUBKATEGORI',
            tabelTarget: 'sub_kategori',
            idTarget: $subKategori->id_sub_kategori,
            dataSesudah: $subKategori->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil ditambahkan.');
    }

    public function edit(SubKategori $subKategori)
    {
        $kategoris = Kategori::orderBy('nama_kategori')->get();
        return view('admin.sub-kategori.edit', compact('subKategori', 'kategoris'));
    }

    public function update(UpdateSubKategoriRequest $request, SubKategori $subKategori)
    {
        $dataSebelum = $subKategori->toArray();
        $subKategori->update($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_SUBKATEGORI',
            tabelTarget: 'sub_kategori',
            idTarget: $subKategori->id_sub_kategori,
            dataSebelum: $dataSebelum,
            dataSesudah: $subKategori->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil diperbarui.');
    }

    public function destroy(SubKategori $subKategori)
    {
        $dataSebelum = $subKategori->toArray();
        $subKategori->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_SUBKATEGORI',
            tabelTarget: 'sub_kategori',
            idTarget: $subKategori->id_sub_kategori,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.sub-kategori.index')->with('success', 'Sub-Kategori berhasil dihapus.');
    }
}
