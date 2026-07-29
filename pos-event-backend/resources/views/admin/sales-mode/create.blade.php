@extends('layouts.admin')
@section('title', 'Tambah Sales Mode')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-xl">
    <form action="{{ route('admin.sales-mode.store') }}" method="POST">
        @csrf
        <div class="mb-6">
            <label class="block font-extrabold mb-2 uppercase">Nama Sales Mode</label>
            <input type="text" name="nama_mode" value="{{ old('nama_mode') }}" class="brutal-input" required>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN DATA</button>
            <a href="{{ route('admin.sales-mode.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection
