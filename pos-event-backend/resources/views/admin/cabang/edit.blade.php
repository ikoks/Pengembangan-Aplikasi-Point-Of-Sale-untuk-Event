@extends('layouts.admin')
@section('title', 'Edit Cabang')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-2xl">
    <form action="{{ route('admin.cabang.update', $cabang->id_cabang) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Nama Cabang</label>
            <input type="text" name="nama_cabang" value="{{ old('nama_cabang', $cabang->nama_cabang) }}" class="brutal-input" required>
        </div>
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Lokasi</label>
            <input type="text" name="lokasi" value="{{ old('lokasi', $cabang->lokasi) }}" class="brutal-input" required>
        </div>
        
        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Pajak (%)</label>
            <input type="number" step="0.01" name="pajak_persen" value="{{ old('pajak_persen', $cabang->pajak_persen) }}" class="brutal-input" required>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.cabang.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection
