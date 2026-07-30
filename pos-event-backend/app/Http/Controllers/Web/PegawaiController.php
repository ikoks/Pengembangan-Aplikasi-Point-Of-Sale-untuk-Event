<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\UserModel;
use App\Models\RoleUser;
use App\Models\Cabang;
use App\Http\Requests\Web\StorePegawaiRequest;
use App\Http\Requests\Web\UpdatePegawaiRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $kasirs = UserModel::with('cabang')
            ->where('id_role', $idRole)
            ->when($search, function ($query, $search) {
                $query->where('nama_user', 'like', "%{$search}%")
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
        $validated['id_role'] = $this->getRoleId('Kasir');
        $validated['password_hash'] = null;
        $validated['status_aktif'] = true;
        if (isset($validated['password'])) unset($validated['password']);

        $kasir = UserModel::create($validated);
        
        $this->auditLog->log(
            aktivitas: 'CREATE_KASIR',
            tabelTarget: 'user',
            idTarget: $kasir->id_user,
            dataSesudah: $kasir->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Kasir berhasil ditambahkan.');
    }

    public function editKasir($id)
    {
        $kasir = UserModel::findOrFail($id);
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        return view('admin.pegawai.kasir.edit', compact('kasir', 'cabangs'));
    }

    public function updateKasir(UpdatePegawaiRequest $request, $id)
    {
        $kasir = UserModel::findOrFail($id);
        $validated = $request->validated();
        
        $validated['password_hash'] = null;
        if (isset($validated['password'])) unset($validated['password']);

        $dataSebelum = $kasir->toArray();
        $kasir->update($validated);
        
        $this->auditLog->log(
            aktivitas: 'UPDATE_KASIR',
            tabelTarget: 'user',
            idTarget: $kasir->id_user,
            dataSebelum: $dataSebelum,
            dataSesudah: $kasir->fresh()->toArray(),
            request: $request
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Data Kasir berhasil diperbarui.');
    }

    public function destroyKasir($id)
    {
        $kasir = UserModel::findOrFail($id);
        $dataSebelum = $kasir->toArray();
        $kasir->delete();
        
        $this->auditLog->log(
            aktivitas: 'DELETE_KASIR',
            tabelTarget: 'user',
            idTarget: $kasir->id_user,
            dataSebelum: $dataSebelum
        );
        
        return redirect()->route('admin.pegawai.kasir.index')->with('success', 'Kasir berhasil dihapus.');
    }

    public function toggleStatusKasir($id)
    {
        $idRole = $this->getRoleId('Kasir');
        $kasir = UserModel::where('id_role', $idRole)->findOrFail($id);
        
        $dataSebelum = $kasir->toArray();
        $kasir->status_aktif = !$kasir->status_aktif;
        $kasir->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_KASIR_STATUS',
            tabelTarget: 'user',
            idTarget: $kasir->id_user,
            dataSebelum: $dataSebelum,
            dataSesudah: $kasir->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status kasir berhasil diubah.');
    }

    // ==========================================
    // ADMIN
    // ==========================================
    public function indexAdmin(Request $request)
    {
        $search = $request->input('search');
        $idRole = $this->getRoleId('Admin');

        $admins = UserModel::where('id_role', $idRole)
            ->when($search, function ($query, $search) {
                $query->where('nama_user', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return view('admin.pegawai.admin.index', compact('admins', 'search'));
    }

    public function createAdmin()
    {
        return view('admin.pegawai.admin.create');
    }

    public function storeAdmin(StorePegawaiRequest $request)
    {
        $validated = $request->validated();
        $validated['id_role'] = $this->getRoleId('Admin');
        $validated['password_hash'] = Hash::make($validated['password']);
        $validated['status_aktif'] = $request->has('status_aktif');
        $validated['id_cabang'] = null; // Admin pusat tidak terikat cabang
        unset($validated['password']);

        UserModel::create($validated);
        return redirect()->route('admin.pegawai.admin.index')->with('success', 'Admin berhasil ditambahkan.');
    }

    public function editAdmin($id)
    {
        $admin = UserModel::findOrFail($id);
        return view('admin.pegawai.admin.edit', compact('admin'));
    }

    public function updateAdmin(UpdatePegawaiRequest $request, $id)
    {
        $admin = UserModel::findOrFail($id);
        $validated = $request->validated();
        
        if (!empty($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
        }
        $validated['status_aktif'] = $request->has('status_aktif');
        $validated['id_cabang'] = null;
        unset($validated['password']);

        $admin->update($validated);
        return redirect()->route('admin.pegawai.admin.index')->with('success', 'Data Admin berhasil diperbarui.');
    }

    public function destroyAdmin($id)
    {
        $admin = UserModel::findOrFail($id);
        // Prevent deleting yourself
        if (auth()->id() === $admin->id_user) {
            return redirect()->route('admin.pegawai.admin.index')->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }
        $admin->delete();
        return redirect()->route('admin.pegawai.admin.index')->with('success', 'Admin berhasil dihapus.');
    }

    public function resetPasswordAdmin(Request $request, $id)
    {
        $admin = UserModel::findOrFail($id);
        $admin->update(['password_hash' => Hash::make('admin123')]);
        return redirect()->route('admin.pegawai.admin.index')->with('success', 'Password admin direset menjadi: admin123');
    }
}
