@extends('layouts.admin')
@section('title', 'Tambah Cabang')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-2xl">
    <form action="{{ route('admin.cabang.store') }}" method="POST">
        @csrf
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Nama Cabang</label>
            <input type="text" name="nama_cabang" value="{{ old('nama_cabang') }}" class="brutal-input" required>
        </div>
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Lokasi</label>
            <input type="text" name="lokasi" value="{{ old('lokasi') }}" class="brutal-input" required>
        </div>
        
        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Pajak (%)</label>
            <input type="number" step="0.01" name="pajak_persen" value="{{ old('pajak_persen', 0) }}" class="brutal-input" required>
            <p class="text-xs mt-1 font-bold text-gray-500">Gunakan angka desimal jika perlu (contoh: 11.00)</p>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.cabang.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection
