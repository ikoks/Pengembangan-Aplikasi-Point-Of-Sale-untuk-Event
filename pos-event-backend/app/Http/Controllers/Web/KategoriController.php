<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use App\Http\Requests\Web\StoreKategoriRequest;
use App\Http\Requests\Web\UpdateKategoriRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class KategoriController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status', 'Aktif');
        
        $kategoris = Kategori::when($search, function ($query, $search) {
                return $query->where('nama_kategori', 'like', "%{$search}%");
            })
            ->when($status !== 'Semua', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.kategori.index', compact('kategoris', 'search', 'status'));
    }

    public function create()
    {
        return view('admin.kategori.create');
    }

    public function store(StoreKategoriRequest $request)
    {
        $kategori = Kategori::create($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'CREATE_KATEGORI',
            tabelTarget: 'kategori',
            idTarget: $kategori->id_kategori,
            dataSesudah: $kategori->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.kategori.index')->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function edit(Kategori $kategori)
    {
        return view('admin.kategori.edit', compact('kategori'));
    }

    public function update(UpdateKategoriRequest $request, Kategori $kategori)
    {
        $dataSebelum = $kategori->toArray();
        $kategori->update($request->validated());
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_KATEGORI',
            tabelTarget: 'kategori',
            idTarget: $kategori->id_kategori,
            dataSebelum: $dataSebelum,
            dataSesudah: $kategori->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.kategori.index')->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Kategori $kategori)
    {
        // Pencegahan relasi child: Tolak jika masih ada sub-kategori
        if ($kategori->subKategoris()->exists()) {
            return redirect()->route('admin.kategori.index')
                ->with('error', 'Gagal menghapus! Kategori ini masih memiliki sub-kategori terkait. Silakan hapus atau pindahkan sub-kategori terlebih dahulu.');
        }

        try {
            $dataSebelum = $kategori->toArray();
            $kategori->delete();
            
            $this->auditLog->log(
                aktivitas: 'DELETE_KATEGORI',
                tabelTarget: 'kategori',
                idTarget: $kategori->id_kategori,
                dataSebelum: $dataSebelum
            );
            
            return redirect()->route('admin.kategori.index')->with('success', 'Kategori berhasil dihapus.');
        } catch (\Illuminate\Database\QueryException $e) {
            return redirect()->route('admin.kategori.index')
                ->with('error', 'Gagal menghapus! Kategori ini masih terkait dengan data lain di sistem.');
        }
    }

    public function toggleStatus(Kategori $kategori)
    {
        $dataSebelum = $kategori->toArray();
        $kategori->status = $kategori->status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        $kategori->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_KATEGORI_STATUS',
            tabelTarget: 'kategori',
            idTarget: $kategori->id_kategori,
            dataSebelum: $dataSebelum,
            dataSesudah: $kategori->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status kategori berhasil diubah.');
    }
}
