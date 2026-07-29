@extends('layouts.admin')
@section('title', 'Master Cabang')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.cabang.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari cabang atau lokasi..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.cabang.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH CABANG</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA CABANG</th>
                <th class="brutal-table-th">LOKASI</th>
                <th class="brutal-table-th">PAJAK (%)</th>
                <th class="brutal-table-th">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($cabangs as $cabang)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $cabang->nama_cabang }}</td>
                <td class="brutal-table-td">{{ $cabang->lokasi }}</td>
                <td class="brutal-table-td">{{ $cabang->pajak_persen }}%</td>
                <td class="brutal-table-td space-x-2">
                    <a href="{{ route('admin.cabang.edit', $cabang->id_cabang) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                    <form action="{{ route('admin.cabang.destroy', $cabang->id_cabang) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus cabang ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="4" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data cabang.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $cabangs->links() }}
</div>
@endsection
