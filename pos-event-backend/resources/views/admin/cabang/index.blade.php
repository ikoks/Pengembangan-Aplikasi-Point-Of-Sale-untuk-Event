@extends('layouts.admin')
@section('title', 'Cabang')

@section('content')
{{-- MODAL TAMBAH CABANG --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_cabang') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Cabang Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Tambah Cabang Baru</h2>
   <form action="{{ route('admin.cabang.store') }}" method="POST">
    @csrf
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
     <div>
      <label class="block text-xs font-extrabold mb-1">Nama Cabang <span class="text-red-600">*</span></label>
      <input type="text" name="nama_cabang" value="{{ old('nama_cabang') }}" class="brutal-input" required autofocus>
      @error('nama_cabang') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
     <div>
      <label class="block text-xs font-extrabold mb-1">Lokasi <span class="text-red-600">*</span></label>
      <input type="text" name="lokasi" value="{{ old('lokasi') }}" class="brutal-input" required>
      @error('lokasi') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
     </div>
    </div>

    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">
      Pajak (%) <span class="text-red-600">*</span>
     </label>
     <input type="number" step="0.01" min="0" max="100" name="pajak_persen" value="{{ old('pajak_persen') }}" class="brutal-input" placeholder="0" required>
     <p class="text-[10px] mt-1 font-bold text-gray-500">Isi dengan 0 jika cabang ini tidak menerapkan pajak.</p>
     @error('pajak_persen') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>

    <div class="mb-4">
     <label class="block text-xs font-extrabold mb-1">Mode Penjualan <span class="text-gray-400 font-normal">(Opsional)</span></label>
     <div x-data="{
         openPicker: false, search: '', items: [], loading: false,
         selectedId: '{{ old('id_sales') }}', selectedName: '{{ old('id_sales') ? ($salesModes->where('id_sales', old('id_sales'))->first()->nama_mode ?? '') : '' }}',
         fetchData() {
             this.loading = true;
             fetch('{{ route('admin.ajax.sales-mode') }}?search=' + this.search)
                 .then(res => res.json())
                 .then(data => { this.items = data.data; this.loading = false; });
         },
         selectItem(item) {
             this.selectedId = item.id_sales;
             this.selectedName = item.nama_mode;
             this.openPicker = false;
         },
         clearSelection() {
             this.selectedId = '';
             this.selectedName = '';
             this.openPicker = false;
         }
      }">
       <input type="hidden" name="id_sales" :value="selectedId">
       <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
        <span x-text="selectedName || '-- Pilih Mode Penjualan (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
       </button>

       <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
        <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
         <h3 class="font-extrabold mb-3">Pilih Mode Penjualan</h3>
         <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari mode penjualan...">
         <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
          <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
            -- Kosongkan Pilihan --
          </button>
          <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
          <template x-for="item in items" :key="item.id_sales">
           <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
            <span x-text="item.nama_mode" class="text-brutal-black"></span>
           </button>
          </template>
          <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada data.</div>
         </div>
         <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
        </div>
       </div>
     </div>
     <p class="text-[10px] mt-1 font-bold text-gray-500">Pilih mode penjualan yang akan menjadi menu default untuk cabang ini.</p>
     @error('id_sales') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>



    <p class="text-xs text-gray-500 font-bold mb-4">
     <span class="bg-yellow-100 border border-yellow-400 px-2 py-1 inline-block">ℹ Status default: <strong>Aktif</strong>. Bisa diubah via toggle di tabel.</span>
    </p>

    <div class="flex gap-4 mt-6">
     <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Cabang</button>
     <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary">Batal</button>
    </div>
   </form>
  </div>
 </div>
</div>


{{-- TABEL DAFTAR CABANG --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Cabang</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $cabangs->total() }}</span> cabang terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.cabang.index') }}" class="flex gap-2">
   <select name="status" class="brutal-input text-sm w-32" onchange="this.form.submit()">
    <option value="Aktif" {{ request('status', 'Aktif') == 'Aktif' ? 'selected' : '' }}>Aktif</option>
    <option value="Nonaktif" {{ request('status') == 'Nonaktif' ? 'selected' : '' }}>Nonaktif</option>
    <option value="Semua" {{ request('status') == 'Semua' ? 'selected' : '' }}>Semua</option>
   </select>
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari cabang..."
    class="brutal-input text-sm w-48">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
    Cari
   </button>
  </form>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full text-left border-collapse min-w-max">
   <thead class="bg-black text-white">
    <tr>
     <th class="brutal-table-th text-xs">Nama Cabang</th>
     <th class="brutal-table-th text-xs">Lokasi</th>
     <th class="brutal-table-th text-xs">MODE PENJUALAN</th>
     <th class="brutal-table-th text-xs">PAJAK (%)</th>
     <th class="brutal-table-th text-xs">QR STATIS</th>
     <th class="brutal-table-th text-xs">STATUS</th>
     <th class="brutal-table-th text-xs text-center">Aksi</th>
    </tr>
   </thead>
   <tbody>
    @forelse($cabangs as $cabang)
    <tr class="hover:bg-gray-50 border-b-2 border-brutal-black">
     <td class="brutal-table-td font-bold">{{ $cabang->nama_cabang }}</td>
     <td class="brutal-table-td">{{ $cabang->lokasi }}</td>
     <td class="brutal-table-td">
      @if($cabang->salesMode)
       <span class="bg-blue-100 text-blue-800 border border-blue-400 px-2 py-0.5 text-xs font-bold rounded">{{ $cabang->salesMode->nama_mode }}</span>
      @else
       <span class="text-gray-400 text-xs italic">Belum Diatur</span>
      @endif
     </td>
     <td class="brutal-table-td">
      @if((float)$cabang->pajak_persen > 0)
       <span class="font-bold">{{ (float)$cabang->pajak_persen }}%</span>
      @else
       <span class="text-gray-400 text-xs italic font-bold">0% (Tanpa Pajak)</span>
      @endif
     </td>
      <td class="brutal-table-td text-xs text-center">
       @if($cabang->qr_static_payload)
        <div class="flex flex-col items-center gap-1">
         <a href="{{ route('admin.cabang.download-qr', $cabang->id_cabang) }}" class="brutal-btn brutal-btn-primary bg-green-400 hover:bg-green-500 text-[10px] px-2 py-1 text-brutal-black inline-flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Download
         </a>
         @if($cabang->qr_static_token)
          <span class="font-mono bg-yellow-200 border border-black px-1 text-[10px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" title="Token Manual QR Statis">{{ $cabang->qr_static_token }}</span>
         @endif
        </div>
       @else
        <span class="text-gray-400 italic">—</span>
       @endif
      </td>
     <td class="brutal-table-td">
      <form action="{{ route('admin.cabang.toggle-status', $cabang->id_cabang) }}" method="POST" class="inline-flex flex-col items-center gap-1">
       @csrf
       @method('PATCH')
       <span class="text-[10px] font-black tracking-wider {{ $cabang->status === 'Aktif' ? 'text-green-600' : 'text-gray-500' }}">{{ $cabang->status }}</span>
       <button type="submit" title="{{ $cabang->status }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $cabang->status === 'Aktif' ? 'bg-green-400' : 'bg-gray-300' }}">
        <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $cabang->status === 'Aktif' ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
       </button>
      </form>
     </td>
     <td class="brutal-table-td space-x-1 text-center whitespace-nowrap">

      {{-- Tombol Edit --}}
      <button type="button"
       onclick="openEditCabang({ id_cabang: '{{ $cabang->id_cabang }}', nama_cabang: '{{ addslashes($cabang->nama_cabang) }}', lokasi: '{{ addslashes($cabang->lokasi) }}', id_sales: '{{ $cabang->id_sales }}', nama_sales: '{{ $cabang->salesMode ? addslashes($cabang->salesMode->nama_mode) : '' }}', pajak_persen: {{ (float)$cabang->pajak_persen }}, qr_static_payload: '{{ addslashes($cabang->qr_static_payload) }}', status: '{{ $cabang->status }}' })"
       class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      {{-- Tombol Menu Template --}}
      <button type="button"
       onclick="openMenuTemplateModal('{{ $cabang->id_cabang }}', '{{ addslashes($cabang->nama_cabang) }}', '{{ $cabang->id_sales }}')"
       class="brutal-btn brutal-btn-secondary bg-blue-200 hover:bg-blue-300 text-xs px-2 py-1 text-brutal-black">Menu Template</button>

      {{-- Tombol Hapus --}}
      <form action="{{ route('admin.cabang.destroy', $cabang->id_cabang) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus cabang ini?');">
       @csrf
       @method('DELETE')
       <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
      </form>
     </td>
    </tr>
    @empty
    <tr>
     <td colspan="6" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data cabang.</td>
    </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 @if($cabangs->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $cabangs->links() }}
  </div>
 @endif
</div>

{{-- ============================================================
     MODAL EDIT CABANG (Global — di luar loop)
     ============================================================ --}}
<div id="editCabangModalEl"
     style="display:none;"
     class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto">
 <div id="editCabangModalBox" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full my-8">
  <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Cabang</h2>
  <form id="editCabangForm" method="POST">
   @csrf
   @method('PUT')
   <input type="hidden" name="id_cabang" id="ec_id_cabang">
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block font-extrabold mb-2 text-xs text-left">Nama Cabang</label>
     <input type="text" name="nama_cabang" id="ec_nama_cabang" class="brutal-input" required>
    </div>
    <div>
     <label class="block font-extrabold mb-2 text-xs text-left">Lokasi</label>
     <input type="text" name="lokasi" id="ec_lokasi" class="brutal-input" required>
    </div>
   </div>
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block font-extrabold mb-2 text-xs text-left">Mode Penjualan</label>
     <div x-data="{
         openPicker: false, search: '', items: [], loading: false,
         selectedId: '', selectedName: '',
         fetchData() {
             this.loading = true;
             fetch('{{ route('admin.ajax.sales-mode') }}?search=' + this.search)
                 .then(res => res.json())
                 .then(data => { this.items = data.data; this.loading = false; });
         },
         selectItem(item) {
             this.selectedId = item.id_sales;
             this.selectedName = item.nama_mode;
             this.openPicker = false;
             document.getElementById('ec_id_sales').value = item.id_sales;
         },
         clearSelection() {
             this.selectedId = '';
             this.selectedName = '';
             this.openPicker = false;
             document.getElementById('ec_id_sales').value = '';
         }
      }" @set-sales-mode.window="selectedId = $event.detail.id; selectedName = $event.detail.name;">
       <input type="hidden" name="id_sales" id="ec_id_sales" :value="selectedId">
       <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
        <span x-text="selectedName || '-- Pilih Mode Penjualan (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
       </button>

       <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60">
        <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
         <h3 class="font-extrabold mb-3">Pilih Mode Penjualan</h3>
         <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari mode penjualan...">
         <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
          <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
            -- Kosongkan Pilihan --
          </button>
          <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
          <template x-for="item in items" :key="item.id_sales">
           <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
            <span x-text="item.nama_mode" class="text-brutal-black"></span>
           </button>
          </template>
          <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada data.</div>
         </div>
         <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
        </div>
       </div>
     </div>
    </div>
    <div>
     <label class="block font-extrabold mb-2 text-xs text-left">Pajak (%) <span class="text-red-600">*</span></label>
     <input type="number" step="0.01" min="0" max="100" name="pajak_persen" id="ec_pajak" class="brutal-input" placeholder="0" required>
    </div>
   </div>

    <div class="flex gap-4 mt-4">
    <button type="submit" class="brutal-btn brutal-btn-primary">Simpan</button>
    <button type="button" onclick="closeEditCabang()" class="brutal-btn brutal-btn-secondary">Batal</button>
   </div>
  </form>
 </div>
</div>

{{-- ============================================================
     MODAL MENU TEMPLATE (Global — di luar loop)
     ============================================================ --}}
<div id="menuTemplateModalEl"
     style="display:none;"
     class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
 <div id="menuTemplateModalBox" class="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 max-w-xl w-full max-h-[90vh] flex flex-col">

  {{-- Header --}}
  <div class="flex justify-between items-center mb-4 border-b-2 border-black pb-3">
   <div>
    <h2 class="text-xl font-black">Menu Template</h2>
    <p class="text-xs text-gray-500 font-bold mt-0.5">Cabang: <span id="mt_cabang_name"></span></p>
   </div>
   <button onclick="closeMenuTemplateModal()" type="button" class="text-2xl font-black hover:text-red-600 leading-none">&times;</button>
  </div>

  {{-- Pilih Mode Penjualan (disembunyikan karena sudah diatur per cabang) --}}
  <div class="mb-4" style="display:none;">
   <select id="mt_sales_select" class="brutal-input bg-white">
    <!-- value diset via JS -->
   </select>
  </div>

  {{-- Daftar Menu --}}
  <div class="flex-1 overflow-y-auto border-2 border-black bg-gray-50 min-h-[180px] max-h-64">
   <div id="mt_placeholder" class="p-6 text-center text-sm text-gray-400 font-bold">Pilih mode penjualan untuk melihat menu</div>
   <div id="mt_loading" style="display:none;" class="p-6 text-center text-sm font-bold animate-pulse">Memuat menu...</div>
   <div id="mt_empty" style="display:none;" class="p-6 text-center text-sm text-gray-400 font-bold">Belum ada menu di mode ini</div>
   <table id="mt_table" style="display:none;" class="w-full text-sm">
    <thead class="bg-black text-white">
     <tr>
      <th class="px-3 py-2 text-left text-xs font-black">#</th>
      <th class="px-3 py-2 text-left text-xs font-black">Menu</th>
      <th class="px-3 py-2 text-right text-xs font-black">Harga</th>
     </tr>
    </thead>
    <tbody id="mt_tbody"></tbody>
   </table>
  </div>

  {{-- Footer --}}
  <div class="flex justify-between items-center mt-4 pt-3 border-t-2 border-black">
   <span id="mt_count" class="text-xs text-gray-500 font-bold" style="display:none;"></span>
   <span id="mt_count_empty"></span>
   <div class="flex gap-2">
    <a id="mt_edit_btn" href="#"
     style="display:none;"
     class="brutal-btn brutal-btn-primary text-xs px-3 py-1">Edit Harga</a>
    <button onclick="closeMenuTemplateModal()" type="button" class="brutal-btn brutal-btn-secondary text-xs px-3 py-1">Tutup</button>
   </div>
  </div>

 </div>
</div>

@endsection

@push('scripts')
<script>
// ─── MENU TEMPLATE MODAL ──────────────────────────────────────
const MT_AJAX_URL  = '{{ route('admin.ajax.menus-by-sales-mode') }}';
const MT_EDIT_BASE = '{{ route('admin.harga-cabang.index') }}';

function openMenuTemplateModal(idCabang, cabangName, idSales) {
    document.getElementById('mt_cabang_name').textContent = cabangName;
    document.getElementById('mt_sales_select').value = idSales;
    resetMtContent();
    document.getElementById('menuTemplateModalEl').style.display = 'flex';
    
    if (idSales) {
        onSalesModeChange(idSales);
    } else {
        document.getElementById('mt_placeholder').innerHTML = '<span class="text-red-500">Cabang ini belum memiliki Mode Penjualan default. Silakan atur pada menu Edit Cabang.</span>';
    }
}

function closeMenuTemplateModal() {
    document.getElementById('menuTemplateModalEl').style.display = 'none';
}

function resetMtContent() {
    document.getElementById('mt_placeholder').style.display = 'block';
    document.getElementById('mt_loading').style.display     = 'none';
    document.getElementById('mt_empty').style.display       = 'none';
    document.getElementById('mt_table').style.display       = 'none';
    document.getElementById('mt_count').style.display       = 'none';
    document.getElementById('mt_edit_btn').style.display    = 'none';
    document.getElementById('mt_tbody').innerHTML           = '';
}

function onSalesModeChange(idSales) {
    if (!idSales) { resetMtContent(); return; }

    document.getElementById('mt_placeholder').style.display = 'none';
    document.getElementById('mt_loading').style.display     = 'block';
    document.getElementById('mt_empty').style.display       = 'none';
    document.getElementById('mt_table').style.display       = 'none';
    document.getElementById('mt_count').style.display       = 'none';
    document.getElementById('mt_edit_btn').style.display    = 'none';

    fetch(MT_AJAX_URL + '?id_sales=' + idSales)
        .then(r => r.json())
        .then(data => {
            document.getElementById('mt_loading').style.display = 'none';
            const menus = data.data || [];

            if (menus.length === 0) {
                document.getElementById('mt_empty').style.display = 'block';
            } else {
                const tbody = document.getElementById('mt_tbody');
                tbody.innerHTML = menus.map((m, i) =>
                    `<tr class="border-b border-gray-200 hover:bg-yellow-50">
                        <td class="px-3 py-2 text-gray-400 text-xs font-mono">${i + 1}</td>
                        <td class="px-3 py-2 font-bold">${m.nama_menu}</td>
                        <td class="px-3 py-2 text-right font-mono font-bold">${m.harga_fmt}</td>
                    </tr>`
                ).join('');
                document.getElementById('mt_table').style.display = 'table';

                const countEl = document.getElementById('mt_count');
                countEl.textContent = menus.length + ' menu terdaftar';
                countEl.style.display = 'inline';
            }

            // Selalu tampilkan tombol Edit Harga jika mode dipilih
            const editBtn = document.getElementById('mt_edit_btn');
            editBtn.href = MT_EDIT_BASE + '?id_sales=' + idSales;
            editBtn.style.display = 'inline-block';
        })
        .catch(() => {
            document.getElementById('mt_loading').style.display = 'none';
            document.getElementById('mt_empty').style.display   = 'block';
        });
}

// Tutup modal saat klik di luar
document.getElementById('menuTemplateModalEl').addEventListener('click', function(e) {
    if (e.target === this) closeMenuTemplateModal();
});

// ─── EDIT CABANG MODAL ────────────────────────────────────────
function openEditCabang(data) {
    document.getElementById('ec_id_cabang').value  = data.id_cabang;
    document.getElementById('ec_nama_cabang').value = data.nama_cabang;
    document.getElementById('ec_lokasi').value     = data.lokasi;
    
    // Set value directly for the hidden input
    document.getElementById('ec_id_sales').value   = data.id_sales || '';
    // Dispatch event to update AlpineJS state
    window.dispatchEvent(new CustomEvent('set-sales-mode', { detail: { id: data.id_sales || '', name: data.nama_sales || '' } }));
    
    document.getElementById('ec_pajak').value      = data.pajak_persen;

    const baseUrl = '{{ url('admin/cabang') }}';
    document.getElementById('editCabangForm').action = baseUrl + '/' + data.id_cabang;

    document.getElementById('editCabangModalEl').style.display = 'flex';
}

function closeEditCabang() {
    document.getElementById('editCabangModalEl').style.display = 'none';
}

// Tutup modal saat klik di luar
document.getElementById('editCabangModalEl').addEventListener('click', function(e) {
    if (e.target === this) closeEditCabang();
});
</script>
@endpush
