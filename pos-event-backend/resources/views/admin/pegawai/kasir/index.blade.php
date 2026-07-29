@extends('layouts.admin')
@section('title', 'Master Kasir')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.pegawai.kasir.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari kasir..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.pegawai.kasir.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH KASIR</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">NAMA KASIR</th>
                <th class="brutal-table-th">USERNAME</th>
                <th class="brutal-table-th">CABANG</th>
                <th class="brutal-table-th">STATUS</th>
                <th class="brutal-table-th w-48 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($kasirs as $kasir)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $kasir->nama_user }}</td>
                <td class="brutal-table-td">{{ $kasir->username }}</td>
                <td class="brutal-table-td">{{ $kasir->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">
                    @if($kasir->status_aktif)
                        <span class="inline-block px-2 py-1 bg-brutal-black text-white text-xs font-bold">[AKTIF]</span>
                    @else
                        <span class="inline-block px-2 py-1 border-2 border-brutal-black text-xs font-bold">[NONAKTIF]</span>
                    @endif
                </td>
                <td class="brutal-table-td text-center">
                    <div class="flex justify-center items-center gap-2">
                        <a href="{{ route('admin.pegawai.kasir.edit', $kasir->id_user) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                        
                        <form action="{{ route('admin.pegawai.kasir.destroy', $kasir->id_user) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus kasir ini?');">
                            @csrf
                            @method('DELETE')
                            <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                        </form>
                    </div>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data kasir.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $kasirs->links() }}
</div>
@endsection
