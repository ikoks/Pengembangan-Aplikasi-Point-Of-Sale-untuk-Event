@extends('layouts.admin')
@section('title', 'Master Harga Cabang')

@section('content')
<div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <form action="{{ route('admin.harga-cabang.index') }}" method="GET" class="flex w-full sm:w-auto">
        <input type="text" name="search" value="{{ $search }}" placeholder="Cari menu / cabang..." class="brutal-input flex-1 sm:w-64">
        <button type="submit" class="brutal-btn brutal-btn-primary ml-2">CARI</button>
    </form>
    <a href="{{ route('admin.harga-cabang.create') }}" class="brutal-btn brutal-btn-primary whitespace-nowrap">+ TAMBAH HARGA</a>
</div>

<div class="bg-white brutal-border brutal-shadow overflow-x-auto">
    <table class="w-full text-left border-collapse min-w-max">
        <thead>
            <tr>
                <th class="brutal-table-th">MENU</th>
                <th class="brutal-table-th">CABANG</th>
                <th class="brutal-table-th">SALES MODE</th>
                <th class="brutal-table-th">HARGA (Rp)</th>
                <th class="brutal-table-th w-48 text-center">AKSI</th>
            </tr>
        </thead>
        <tbody>
            @forelse($templates as $tpl)
            <tr class="hover:bg-gray-50">
                <td class="brutal-table-td font-bold">{{ $tpl->menu->nama_menu ?? '-' }}</td>
                <td class="brutal-table-td">{{ $tpl->cabang->nama_cabang ?? '-' }}</td>
                <td class="brutal-table-td">{{ $tpl->salesMode->nama_mode ?? '-' }}</td>
                <td class="brutal-table-td">{{ number_format($tpl->harga_produk, 0, ',', '.') }}</td>
                <td class="brutal-table-td text-center space-x-2">
                    <a href="{{ route('admin.harga-cabang.edit', $tpl->id_template) }}" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">EDIT</a>
                    <form action="{{ route('admin.harga-cabang.destroy', $tpl->id_template) }}" method="POST" class="inline-block" onsubmit="return confirm('Yakin ingin menghapus harga ini?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">HAPUS</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data harga cabang.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>

<div class="mt-6">
    {{ $templates->links() }}
</div>
@endsection
