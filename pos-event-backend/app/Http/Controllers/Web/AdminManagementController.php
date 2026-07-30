<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Cabang;
use App\Models\RoleUser;
use App\Models\UserModel;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
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

        $query = UserModel::with(['role', 'cabang'])
            ->where('id_role', $adminRole?->id_role)
            ->orderBy('nama_user');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nama_user', 'like', '%' . $request->search . '%')
                  ->orWhere('username', 'like', '%' . $request->search . '%');
            });
        }

        $admins  = $query->paginate(20)->withQueryString();
        $cabangs = Cabang::orderBy('nama_cabang')->get();

        return view('admin.pegawai.admin', compact('admins', 'cabangs', 'adminRole'));
    }

    // Simpan admin baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_user'     => 'required|string|max:100',
            'username'      => 'required|string|max:50|unique:user,username',
            'email'         => 'required|email|max:100|unique:user,email',
            'password'      => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'id_cabang'     => 'nullable|exists:cabang,id_cabang',
        ], [
            'username.unique'  => 'Username sudah digunakan.',
            'email.unique'     => 'Email sudah digunakan.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ]);

        $adminRole = RoleUser::where('nama_role', 'Admin')->firstOrFail();

        DB::transaction(function () use ($validated, $adminRole, $request) {
            $admin = UserModel::create([
                'id_role'       => $adminRole->id_role,
                'id_cabang'     => empty($validated['id_cabang']) ? null : $validated['id_cabang'],
                'username'      => $validated['username'],
                'password_hash' => Hash::make($validated['password']),
                'nama_user'     => $validated['nama_user'],
                'email'         => $validated['email'],
                'status_aktif'  => true,
            ]);

            // Catat ke audit log
            $this->auditLog->log(
                aktivitas: 'CREATE_ADMIN',
                tabelTarget: 'user',
                idTarget: $admin->id_user,
                dataSesudah: ['username' => $admin->username, 'nama_user' => $admin->nama_user],
                request: $request
            );
        });

        return redirect()->route('admin.management.index')
            ->with('success', "Admin '{$validated['nama_user']}' berhasil didaftarkan.");
    }

    // Update data admin
    public function update(Request $request, string $id)
    {
        $admin = UserModel::findOrFail($id);

        $validated = $request->validate([
            'nama_user'  => 'required|string|max:100',
            'username'   => 'required|string|max:50|unique:user,username,' . $admin->id_user . ',id_user',
            'email'      => 'required|email|max:100|unique:user,email,' . $admin->id_user . ',id_user',
            'id_cabang'  => 'nullable|exists:cabang,id_cabang',
        ]);

        $dataBefore = $admin->only(['nama_user', 'username']);

        $admin->update([
            'nama_user'   => $validated['nama_user'],
            'username'    => $validated['username'],
            'email'       => $validated['email'],
            'id_cabang'   => empty($validated['id_cabang']) ? null : $validated['id_cabang'],
        ]);

        $this->auditLog->log(
            aktivitas: 'UPDATE_ADMIN',
            tabelTarget: 'user',
            idTarget: $admin->id_user,
            dataSebelum: $dataBefore,
            dataSesudah: $admin->only(['nama_user', 'username']),
            request: $request
        );

        return redirect()->route('admin.management.index')
            ->with('success', "Data admin '{$admin->nama_user}' berhasil diperbarui.");
    }

    // Hapus/Nonaktifkan admin
    public function destroy(Request $request, string $id)
    {
        $admin = UserModel::findOrFail($id);

        if ($admin->id_user === auth()->id()) {
            return redirect()->route('admin.management.index')
                ->with('error', 'Anda tidak dapat menonaktifkan akun diri sendiri.');
        }

        $admin->delete();

        $this->auditLog->log(
            aktivitas: 'DELETE_ADMIN',
            tabelTarget: 'user',
            idTarget: $admin->id_user,
            dataSebelum: ['nama_user' => $admin->nama_user, 'username' => $admin->username],
            request: $request
        );

        return redirect()->route('admin.management.index')
            ->with('success', "Admin '{$admin->nama_user}' berhasil dinonaktifkan.");
    }

    // Reset password admin
    public function resetPassword(Request $request, string $id)
    {
        $admin = UserModel::findOrFail($id);

        $request->validate([
            'password_baru'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'password_baru_confirmation' => 'required',
        ]);

        $admin->update([
            'password_hash' => Hash::make($request->password_baru),
        ]);

        // Revoke semua token API yang aktif milik admin ini
        $admin->tokens()->delete();

        // Hapus token reset jika ada
        DB::table('password_reset_tokens')
            ->where('email', $admin->email ?? $admin->username)
            ->delete();

        $this->auditLog->log(
            aktivitas: 'RESET_PASSWORD_ADMIN',
            tabelTarget: 'user',
            idTarget: $admin->id_user,
            dataSesudah: ['username' => $admin->username, 'reset_by' => auth()->user()?->nama_user],
            request: $request
        );

        return redirect()->route('admin.management.index')->with('success', 'Password admin berhasil direset.');
    }

    public function toggleStatus($id)
    {
        $admin = UserModel::whereHas('role', function($q) {
            $q->where('nama_role', 'Admin');
        })->findOrFail($id);
        
        $dataSebelum = $admin->toArray();
        $admin->status_aktif = !$admin->status_aktif;
        $admin->save();

        $this->auditLog->log(
            aktivitas: 'UPDATE_ADMIN_STATUS',
            tabelTarget: 'user',
            idTarget: $admin->id_user,
            dataSebelum: $dataSebelum,
            dataSesudah: $admin->toArray(),
            request: request()
        );

        return redirect()->back()->with('success', 'Status admin berhasil diubah.');
    }
}
