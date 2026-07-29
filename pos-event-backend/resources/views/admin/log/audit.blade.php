@extends('layouts.admin')

@section('title', 'Audit Log')

@section('content')
{{-- POS-A-15: Searchable Audit Log Viewer --}}

{{-- FILTER PANEL --}}
<form method="GET" action="{{ route('admin.log.audit.index') }}" class="mb-6">
    <div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 class="font-extrabold text-lg uppercase mb-4 border-b-4 border-black pb-2 tracking-tight">
            [FILTER] PENCARIAN AUDIT LOG
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            {{-- Aktivitas --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Aktivitas / Aksi</label>
                <input type="text" name="aktivitas" value="{{ request('aktivitas') }}"
                    placeholder="VOID_TRANSACTION, CREATE_ADMIN..."
                    class="brutal-input font-mono text-sm">
            </div>

            {{-- Actor --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Actor (Nama User)</label>
                <input type="text" name="actor" value="{{ request('actor') }}"
                    placeholder="Nama user..."
                    class="brutal-input">
            </div>

            {{-- Tabel Target --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tabel Target</label>
                <select name="tabel_target" class="brutal-input bg-white">
                    <option value="">-- Semua Tabel --</option>
                    @foreach($tabelList as $tabel)
                        <option value="{{ $tabel }}" {{ request('tabel_target') === $tabel ? 'selected' : '' }}>
                            {{ $tabel }}
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- IP Address --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">IP Address</label>
                <input type="text" name="ip_address" value="{{ request('ip_address') }}"
                    placeholder="192.168.x.x..."
                    class="brutal-input font-mono text-sm">
            </div>

            {{-- Tanggal Mulai --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Mulai</label>
                <input type="date" name="tanggal_mulai" value="{{ request('tanggal_mulai') }}"
                    class="brutal-input">
            </div>

            {{-- Tanggal Akhir --}}
            <div>
                <label class="block text-xs font-extrabold uppercase mb-1">Tanggal Akhir</label>
                <input type="date" name="tanggal_akhir" value="{{ request('tanggal_akhir') }}"
                    class="brutal-input">
            </div>
        </div>

        <div class="flex gap-3">
            <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
                CARI LOG
            </button>
            <a href="{{ route('admin.log.audit.index') }}" class="brutal-btn brutal-btn-secondary brutal-shadow">
                RESET FILTER
            </a>
        </div>
    </div>
</form>

{{-- TABEL AUDIT LOG --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div class="p-5 border-b-4 border-black flex justify-between items-center">
        <div>
            <h3 class="font-extrabold text-xl uppercase tracking-tight">AUDIT LOG VIEWER</h3>
            <p class="text-sm font-bold text-gray-600 mt-1">
                Total: <span class="font-mono font-extrabold">{{ $logs->total() }}</span> entri log
            </p>
        </div>
        <div class="text-xs font-bold text-gray-500 uppercase border-2 border-dashed border-gray-400 px-3 py-2">
            [APPEND-ONLY / IMMUTABLE]
        </div>
    </div>

    <div class="overflow-x-auto">
        <table class="w-full border-collapse">
            <thead>
                <tr>
                    <th class="brutal-table-th text-xs">TIMESTAMP</th>
                    <th class="brutal-table-th text-xs">AKTIVITAS</th>
                    <th class="brutal-table-th text-xs">ACTOR</th>
                    <th class="brutal-table-th text-xs">TABEL TARGET</th>
                    <th class="brutal-table-th text-xs">ID TARGET</th>
                    <th class="brutal-table-th text-xs">IP ADDRESS</th>
                    <th class="brutal-table-th text-xs text-center">DETAIL</th>
                </tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                    @php
                        $isVoid   = str_contains($log->aktivitas, 'VOID');
                        $isDelete = str_contains($log->aktivitas, 'DELETE');
                        $isCreate = str_contains($log->aktivitas, 'CREATE');
                        $rowBg    = $isVoid || $isDelete ? 'bg-red-50' : ($isCreate ? 'bg-green-50' : 'hover:bg-gray-50');
                    @endphp
                    <tr class="{{ $rowBg }} transition-colors">
                        {{-- Timestamp --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-xs font-bold">
                                {{ $log->waktu_kejadian?->format('d/m/Y') }}
                            </span>
                            <span class="block font-mono text-xs text-gray-500">
                                {{ $log->waktu_kejadian?->format('H:i:s') }}
                            </span>
                        </td>

                        {{-- Aktivitas Badge --}}
                        <td class="brutal-table-td">
                            @php
                                $actBg = match(true) {
                                    str_contains($log->aktivitas, 'VOID')   => 'bg-red-400 border-dashed border-red-700',
                                    str_contains($log->aktivitas, 'DELETE') => 'bg-orange-300 border-black',
                                    str_contains($log->aktivitas, 'CREATE') => 'bg-green-300 border-black',
                                    str_contains($log->aktivitas, 'UPDATE') => 'bg-blue-200 border-black',
                                    str_contains($log->aktivitas, 'RESET')  => 'bg-yellow-300 border-black',
                                    default                                 => 'bg-gray-200 border-black',
                                };
                            @endphp
                            <span class="inline-block border-2 px-2 py-0.5 text-xs font-extrabold font-mono {{ $actBg }}">
                                {{ $log->aktivitas }}
                            </span>
                        </td>

                        {{-- Actor --}}
                        <td class="brutal-table-td">
                            @if($log->user)
                                <span class="font-bold text-sm">{{ $log->user->nama_user }}</span>
                                <span class="block text-xs text-gray-400 font-mono">{{ $log->user->username }}</span>
                            @else
                                <span class="text-gray-400 text-xs font-mono">[SISTEM / TIDAK DIKETAHUI]</span>
                            @endif
                        </td>

                        {{-- Tabel Target --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-xs bg-gray-100 border border-black px-2 py-0.5">
                                {{ $log->tabel_target ?? '-' }}
                            </span>
                        </td>

                        {{-- ID Target --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-xs text-gray-600">
                                {{ $log->id_target ? substr($log->id_target, 0, 12) . '...' : '-' }}
                            </span>
                        </td>

                        {{-- IP Address --}}
                        <td class="brutal-table-td">
                            <span class="font-mono text-xs font-bold">{{ $log->ip_address ?? '-' }}</span>
                        </td>

                        {{-- Detail (Toggle) --}}
                        <td class="brutal-table-td text-center">
                            @if($log->data_sebelum || $log->data_sesudah)
                                <button
                                    type="button"
                                    onclick="toggleDetail('detail-{{ $log->id_audit }}')"
                                    class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-3 py-1">
                                    LIHAT
                                </button>
                            @else
                                <span class="text-gray-300 text-xs">—</span>
                            @endif
                        </td>
                    </tr>

                    {{-- Detail Row (hidden by default) --}}
                    @if($log->data_sebelum || $log->data_sesudah)
                        <tr id="detail-{{ $log->id_audit }}" class="hidden bg-gray-50">
                            <td colspan="7" class="border-4 border-dashed border-gray-400 p-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    @if($log->data_sebelum)
                                        <div>
                                            <p class="text-xs font-extrabold uppercase text-red-600 mb-2">DATA SEBELUM:</p>
                                            <pre class="bg-white border-2 border-dashed border-red-400 p-3 text-xs font-mono overflow-x-auto">{{ json_encode($log->data_sebelum, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
                                        </div>
                                    @endif
                                    @if($log->data_sesudah)
                                        <div>
                                            <p class="text-xs font-extrabold uppercase text-green-600 mb-2">DATA SESUDAH:</p>
                                            <pre class="bg-white border-2 border-dashed border-green-400 p-3 text-xs font-mono overflow-x-auto">{{ json_encode($log->data_sesudah, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
                                        </div>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @endif
                @empty
                    <tr>
                        <td colspan="7" class="brutal-table-td text-center py-12">
                            <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA LOG]</p>
                            <p class="text-sm text-gray-400 mt-1">Belum ada aktivitas yang tercatat.</p>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($logs->hasPages())
        <div class="p-5 border-t-4 border-black">
            {{ $logs->links() }}
        </div>
    @endif
</div>

@push('scripts')
<script>
    function toggleDetail(id) {
        const row = document.getElementById(id);
        if (row) {
            row.classList.toggle('hidden');
        }
    }
</script>
@endpush
@endsection
