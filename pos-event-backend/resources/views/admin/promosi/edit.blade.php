@extends('layouts.admin')
@section('title', 'Edit Promosi')

@section('content')
<div class="bg-white brutal-border brutal-shadow p-6 max-w-2xl">
    <form action="{{ route('admin.promosi.update', $promosi->id_promo) }}" method="POST">
        @csrf
        @method('PUT')
        
        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Cabang</label>
            <select name="id_cabang" class="brutal-input bg-white" required>
                <option value="">-- Pilih Cabang --</option>
                @foreach($cabangs as $cabang)
                    <option value="{{ $cabang->id_cabang }}" {{ old('id_cabang', $promosi->id_cabang) == $cabang->id_cabang ? 'selected' : '' }}>
                        {{ $cabang->nama_cabang }}
                    </option>
                @endforeach
            </select>
        </div>

        <div class="mb-4">
            <label class="block font-extrabold mb-2 uppercase">Nama Promosi</label>
            <input type="text" name="nama_promo" value="{{ old('nama_promo', $promosi->nama_promo) }}" class="brutal-input" required>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block font-extrabold mb-2 uppercase">Tipe Promosi</label>
                <div class="relative">
                    <select name="tipe_promo" class="brutal-input appearance-none bg-white" required>
                        <option value="Nominal" {{ old('tipe_promo', $promosi->tipe_promo) == 'Nominal' ? 'selected' : '' }}>Nominal (Rp)</option>
                        <option value="Persen" {{ old('tipe_promo', $promosi->tipe_promo) == 'Persen' ? 'selected' : '' }}>Persen (%)</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
            <div>
                <label class="block font-extrabold mb-2 uppercase">Cakupan Promosi</label>
                <div class="relative">
                    <select name="cakupan_promo" class="brutal-input appearance-none bg-white" required>
                        <option value="Per Transaksi" {{ old('cakupan_promo', $promosi->cakupan_promo) == 'Per Transaksi' ? 'selected' : '' }}>Per Transaksi</option>
                        <option value="Per Item" {{ old('cakupan_promo', $promosi->cakupan_promo) == 'Per Item' ? 'selected' : '' }}>Per Item</option>
                        <option value="Free Item" {{ old('cakupan_promo', $promosi->cakupan_promo) == 'Free Item' ? 'selected' : '' }}>Free Item</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                        <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
                <label class="block font-extrabold mb-2 uppercase">Nilai Promosi</label>
                <input type="number" step="0.01" name="nilai_promo" value="{{ old('nilai_promo', $promosi->nilai_promo) }}" class="brutal-input">
                <p class="text-xs mt-1 text-gray-500 font-bold">Kosongkan jika free item.</p>
            </div>
            <div>
                <label class="block font-extrabold mb-2 uppercase">Min. Pembelian (Rp)</label>
                <input type="number" step="0.01" name="min_pembelian" value="{{ old('min_pembelian', $promosi->min_pembelian) }}" class="brutal-input">
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
                <label class="block font-extrabold mb-2 uppercase">Tanggal Mulai</label>
                <input type="date" name="tanggal_mulai" value="{{ old('tanggal_mulai', $promosi->tanggal_mulai ? $promosi->tanggal_mulai->format('Y-m-d') : '') }}" class="brutal-input" min="{{ date('Y-m-d') }}">
            </div>
            <div>
                <label class="block font-extrabold mb-2 uppercase">Tanggal Selesai</label>
                <input type="date" name="tanggal_selesai" value="{{ old('tanggal_selesai', $promosi->tanggal_selesai ? $promosi->tanggal_selesai->format('Y-m-d') : '') }}" class="brutal-input" min="{{ date('Y-m-d') }}">
            </div>
        </div>

        <div class="flex gap-4">
            <button type="submit" class="brutal-btn brutal-btn-primary">SIMPAN PERUBAHAN</button>
            <a href="{{ route('admin.promosi.index') }}" class="brutal-btn brutal-btn-secondary">BATAL</a>
        </div>
    </form>
</div>
@endsection
