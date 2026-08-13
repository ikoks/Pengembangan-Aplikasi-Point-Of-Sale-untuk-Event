<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\RoleUser;
use App\Models\Admin;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

// Manajemen User Admin (CRUD & Reset Password)
class AdminManagementController extends Controller
{
    public function __construct(protected AuditLogService $auditLog)
    {
    }

    // Tampilkan daftar admin
    public function index(Request $request)
    {
        $adminRole = RoleUser::where('nama_role', 'Admin')->first();

        $query = Admin::with(['role'])->orderBy('nama_admin');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_admin', 'like', '%' . $request->search . '%')
                  ->orWhere('username', 'like', '%' . $request->search . '%');
            });
        }

        $admins  = $query->paginate(20)->withQueryString();
        $cabangs = Cabang::orderBy('nama_cabang')->get();
        return view('admin.pegawai.admin.index', compact('admins', 'cabangs', 'adminRole'));
    }

    // Simpan admin baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_user'     => 'required|string|max:100',
            'username'      => 'required|string|max:50|unique:admins,username',
            'email'         => 'required|email|max:100|unique:admins,email',
            'password'      => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ], [
            'username.unique'  => 'Username sudah digunakan.',
            'email.unique'     => 'Email sudah digunakan.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $adminRole = RoleUser::where('nama_role', 'Admin')->firstOrFail();

        DB::transaction(function () use ($validated, $adminRole, $request) {
            $admin = Admin::create([
                'id_role'       => $adminRole->id_role,
                'username'      => $validated['username'],
                'password_hash' => Hash::make($validated['password']),
                'nama_admin'    => $validated['nama_user'],
                'email'         => $validated['email'],
                'status_aktif'  => true,
            ]);

            // Catat ke audit log
            $this->auditLog->log(
                aktivitas: 'CREATE_ADMIN',
                tabelTarget: 'admins',
                idTarget: $admin->id_admin,
                dataSesudah: ['username' => $admin->username, 'nama_admin' => $admin->nama_admin],
                request: $request
            );
        });

        return redirect()->route('admin.management.index')
            ->with('success', "Admin '{$validated['nama_user']}' berhasil didaftarkan.");
    }

    // Update data admin
    public function update(Request $request, string $id)
    {
        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'nama_user'  => 'required|string|max:100',
            'username'   => 'required|string|max:50|unique:admins,username,' . $admin->id_admin . ',id_admin',
            'email'      => 'required|email|max:100|unique:admins,email,' . $admin->id_admin . ',id_admin',
        ]);

        $dataBefore = $admin->only(['nama_admin', 'username']);

        $admin->update([
            'nama_admin'  => $validated['nama_user'],
            'username'    => $validated['username'],
            'email'       => $validated['email'],
        ]);

        $this->auditLog->log(
            aktivitas: 'UPDATE_ADMIN',
            tabelTarget: 'admins',
            idTarget: $admin->id_admin,
            dataSebelum: $dataBefore,
            dataSesudah: $admin->only(['nama_admin', 'username']),
            request: $request
        );

        return redirect()->route('admin.management.index')
            ->with('success', "Data admin '{$admin->nama_admin}' berhasil diperbarui.");
    }

    // Hapus/Nonaktifkan admin
    public function destroy(Request $request, string $id)
    {
        $admin = Admin::findOrFail($id);

        if ($admin->id_admin === auth()->id()) {
            return redirect()->route('admin.management.index')
                ->with('error', 'Anda tidak dapat menonaktifkan akun diri sendiri.');
        }

        $admin->delete();

        $this->auditLog->log(
            aktivitas: 'DELETE_ADMIN',
            tabelTarget: 'admins',
            idTarget: $admin->id_admin,
            dataSebelum: ['nama_admin' => $admin->nama_admin, 'username' => $admin->username],
            request: $request
        );

        return redirect()->route('admin.management.index')
            ->with('success', "Admin '{$admin->nama_admin}' berhasil dinonaktifkan.");
    }

    // Reset password admin
    public function resetPassword(Request $request, string $id)
    {
        $admin = Admin::findOrFail($id);

        $request->validate([
            'password_baru'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'password_baru_confirmation' => 'required',
        ]);

        $admin->update([
            'password_hash' => Hash::make($request->password_baru),
        ]);

        // Revoke semua token API yang aktif milik admin ini (jika Admin pakai Sanctum, kita panggil. Tapi karena pakai Web Guard, kita biarkan atau hilangkan delete token jika tak perlu. Karena Admin tidak pakai API Tokens, baris token dihapus)

        // Hapus token reset jika ada
        DB::table('password_reset_tokens')
            ->where('email', $admin->email ?? $admin->username)
            ->delete();

        $this->auditLog->log(
            aktivitas: 'RESET_PASSWORD_ADMIN',
            tabelTarget: 'admins',
            idTarget: $admin->id_admin,
            dataSesudah: ['username' => $admin->username, 'reset_by' => auth()->user()?->nama_admin],
            request: $request
        );

        return redirect()->route('admin.management.index')->with('success', 'Password admin berhasil direset.');
    }

    public function toggleStatus($id)
    {
        $admin = Admin::findOrFail($id);
        
        $dataSebelum = $admin->toArray();
        $admin->status_aktif = !$admin->status_aktif;
        $admin->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_ADMIN_STATUS',
            tabelTarget: 'admins',
            idTarget: $admin->id_admin,
            dataSebelum: $dataSebelum,
            dataSesudah: $admin->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status admin berhasil diubah.');
    }
}
