<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Kasir;
use App\Models\RoleUser;
use App\Models\Cabang;
use App\Http\Requests\Web\StorePegawaiRequest;
use App\Http\Requests\Web\UpdatePegawaiRequest;
use Illuminate\Http\Request;
use App\Services\AuditLogService;

class PegawaiController extends Controller
{
    public function __construct(protected AuditLogService $auditLog) {}

    private function getRoleId($namaRole)
    {
        return RoleUser::where('nama_role', $namaRole)->firstOrFail()->id_role;
    }

    // ==========================================
    // KASIR
    // ==========================================
    public function indexKasir(Request $request)
    {
        $search = $request->input('search');
        $idRole = $this->getRoleId('Kasir');

        $kasirs = Kasir::with('cabang')
            ->when($search, function ($query, $search) {
                $query->where('nama_kasir', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $cabangs = Cabang::orderBy('nama_cabang')->get();
        return view('admin.pegawai.kasir.index', compact('kasirs', 'search', 'cabangs'));
    }

    public function createKasir()
    {
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        return view('admin.pegawai.kasir.create', compact('cabangs'));
    }

    public function storeKasir(StorePegawaiRequest $request)
    {
        $validated = $request->validated();
        $validated['id_role']      = $this->getRoleId('Kasir');
        $validated['status_aktif'] = true;
        // Poin 6 & 9: Simpan PIN plain-text (sudah divalidasi 6 digit angka)
        // pin diambil dari $validated, biarkan null jika tidak diisi
        if (isset($validated['password'])) unset($validated['password']);
        
        $validated['nama_kasir'] = $validated['nama_user'] ?? $validated['nama_kasir'];
        unset($validated['nama_user']);

        $kasir = Kasir::create($validated);
        
        $this->auditLog->log(
            aktivitas: 'CREATE_KASIR',
            tabelTarget: 'kasirs',
            idTarget: $kasir->id_kasir,
            dataSesudah: $kasir->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Kasir berhasil ditambahkan.');
    }

    public function editKasir($id)
    {
        $kasir = Kasir::findOrFail($id);
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        return view('admin.pegawai.kasir.edit', compact('kasir', 'cabangs'));
    }

    public function updateKasir(UpdatePegawaiRequest $request, $id)
    {
        $kasir     = Kasir::findOrFail($id);
        $validated = $request->validated();
        
        if (isset($validated['password'])) unset($validated['password']);
        // Poin 6 & 9: PIN boleh diubah atau dikosongkan
        // Jika pin tidak dikirim (tidak ada di form), jangan ubah PIN yang sudah ada
        if (!$request->has('pin')) {
            unset($validated['pin']);
        }
        
        if (isset($validated['nama_user'])) {
            $validated['nama_kasir'] = $validated['nama_user'];
            unset($validated['nama_user']);
        }

        $dataSebelum = $kasir->toArray();
        $kasir->update($validated);
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_KASIR',
            tabelTarget: 'kasirs',
            idTarget: $kasir->id_kasir,
            dataSebelum: $dataSebelum,
            dataSesudah: $kasir->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Data Kasir berhasil diperbarui.');
    }

    public function destroyKasir($id)
    {
        $kasir = Kasir::findOrFail($id);
        $dataSebelum = $kasir->toArray();
        $kasir->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_KASIR',
            tabelTarget: 'kasirs',
            idTarget: $kasir->id_kasir,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Kasir berhasil dihapus.');
    }

    public function toggleStatusKasir($id)
    {
        $kasir = Kasir::findOrFail($id);
        
        $dataSebelum = $kasir->toArray();
        $kasir->status_aktif = !$kasir->status_aktif;
        $kasir->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_KASIR_STATUS',
            tabelTarget: 'kasirs',
            idTarget: $kasir->id_kasir,
            dataSebelum: $dataSebelum,
            dataSesudah: $kasir->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status kasir berhasil diubah.');
    }
}
