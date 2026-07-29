@extends('layouts.admin')
@section('title', 'Edit Admin')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.pegawai.admin.update', $admin->id_user) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Nama Lengkap</label>
            <input type="text" name="nama_user" value="{{ old('nama_user', $admin->nama_user) }}" class="brutal-input" required>
        </div>
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Username</label>
            <input type="text" name="username" value="{{ old('username', $admin->username) }}" class="brutal-input" required>
        </div>
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Password (Kosongkan jika tidak diubah)</label>
            <input type="password" name="password" class="brutal-input">
        </div>

        <div class="mb-6 flex items-center">
            <input type="checkbox" name="status_aktif" id="status_aktif" value="1" {{ old('status_aktif', $admin->status_aktif) ? 'checked' : '' }} class="w-5 h-5 border-2 border-brutal-black rounded-none">
            <label for="status_aktif" class="ml-2 font-extrabold uppercase">Akun Aktif</label>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.pegawai.admin.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection
