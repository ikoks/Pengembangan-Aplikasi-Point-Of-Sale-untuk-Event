@extends('layouts.admin')
@section('title', 'Harga Produk')

@section('content')
{{-- FORM TAMBAH HARGA CABANG (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && !old('id_template') ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = !openForm"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Tambah Harga Produk Baru</span>
  <svg :class="openForm ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path>
  </svg>
 </button>

 <div x-show="openForm" class="bg-white border-4 border-t-0 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6" style="display: none;">
  <form action="{{ route('admin.harga-cabang.store') }}" method="POST">
   @csrf
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block text-xs font-extrabold mb-1">Pilih Menu <span class="text-red-600">*</span></label>
     <select name="id_menu" class="brutal-input bg-white" required>
      <option value="">-- Pilih Menu --</option>
      @foreach($menus as $menu)
       <option value="{{ $menu->id_menu }}" {{ old('id_menu') == $menu->id_menu ? 'selected' : '' }}>
        {{ $menu->nama_menu }}
       </option>
      @endforeach
     </select>
     @error('id_menu') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
    <div class="col-span-1 md:col-span-2" x-data="{ 
     checkAll: false,
     toggleAll() {
      this.checkAll = !this.checkAll;
      document.querySelectorAll('.cabang-harga-cb').forEach(cb => cb.checked = this.checkAll);
     }
    }">
     <div class="flex justify-between items-center mb-1">
      <label class="block text-xs font-extrabold ">Pilih Cabang / Event <span class="text-red-600">*</span></label>
      <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer ">
       [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
      </button>
     </div>
     <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
      @foreach($cabangs as $cabang)
       <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
        <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
         class="cabang-harga-cb brutal-checkbox"
         {{ is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang')) ? 'checked' : '' }}>
        <span>{{ $cabang->nama_cabang }}</span>
       </label>
      @endforeach
     </div>
     @error('id_cabang') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
    </div>
    <div class="col-span-1 md:col-span-2" x-data="{ 
     checkAllSales: false,
     toggleAllSales() {
      this.checkAllSales = !this.checkAllSales;
      document.querySelectorAll('.sales-harga-cb').forEach(cb => cb.checked = this.checkAllSales);
     }
    }">
     <div class="flex justify-between items-center mb-1">
      <label class="block text-xs font-extrabold ">Pilih Mode Penjualan <span class="text-red-600">*</span></label>
      <button type="button" @click="toggleAllSales()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer ">
       [ <span x-text="checkAllSales ? 'Batal Pilih Semua' : 'Pilih Semua Mode Penjualan'"></span> ]
      </button>
     </div>
     <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border-2 border-black p-3 bg-white max-h-40 overflow-y-auto brutal-shadow-sm">
      @foreach($salesModes as $mode)
       <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
        <input type="checkbox" name="id_sales[]" value="{{ $mode->id_sales }}" 
         class="sales-harga-cb brutal-checkbox"
         {{ is_array(old('id_sales')) && in_array($mode->id_sales, old('id_sales')) ? 'checked' : '' }}>
        <span>{{ $mode->nama_mode }}</span>
       </label>
      @endforeach
     </div>
     @error('id_sales') <span class="text-red-500 text-xs font-bold block mt-1">{{ $message }}</span> @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Harga Produk (Rp) <span class="text-red-600">*</span></label>
     <input type="number" step="0.01" name="harga_produk" value="{{ old('harga_produk') }}" class="brutal-input" required>
     @error('harga_produk') <span class="text-red-500 text-xs font-bold">{{ $message }}</span> @enderror
    </div>
   </div>
   <div class="flex gap-3">
    <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">Simpan Harga Produk</button>
    <button type="button" @click="openForm = false" class="brutal-btn brutal-btn-secondary brutal-shadow">Batal</button>
   </div>
  </form>
 </div>
</div>

{{-- TABEL DAFTAR HARGA PRODUK --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar Harga Produk</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $templates->total() }}</span> harga produk terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.harga-cabang.index') }}" class="flex gap-2">
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari menu / cabang..."
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
     <th class="brutal-table-th text-xs">Menu</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs">Mode Penjualan</th>
     <th class="brutal-table-th text-xs">HARGA (Rp)</th>
     <th class="brutal-table-th text-xs w-48 text-center">Aksi</th>
    </tr>
   </thead>
  <tbody>
   @forelse($templates as $tplGroup)
    @php 
        $firstTpl = $tplGroup->first(); 
        $salesIdsInGroup = $tplGroup->pluck('id_sales')->unique()->toArray();
        $cabangIdsInGroup = $tplGroup->pluck('id_cabang')->unique()->toArray();
        $uniqueCabangs = $tplGroup->unique('id_cabang');
        $uniqueSales = $tplGroup->unique('id_sales');
    @endphp
   <tr class="hover:bg-gray-50">
    <td class="brutal-table-td font-bold">{{ $firstTpl->menu->nama_menu ?? '-' }}</td>
    <td class="brutal-table-td">
        <div class="flex flex-wrap gap-1">
            @foreach($uniqueCabangs as $item)
                @if($item->cabang)
                    <span class="inline-block px-2 py-1 text-xs font-black bg-blue-200 border-2 border-black">
                        {{ $item->cabang->nama_cabang }}
                    </span>
                @endif
            @endforeach
        </div>
    </td>
    <td class="brutal-table-td">
        <div class="flex flex-wrap gap-1">
            @foreach($uniqueSales as $item)
                @if($item->salesMode)
                    <span class="inline-block px-2 py-1 text-xs font-black bg-yellow-200 border-2 border-black">
                        {{ $item->salesMode->nama_mode }}
                    </span>
                @endif
            @endforeach
        </div>
    </td>
    <td class="brutal-table-td">{{ number_format($firstTpl->harga_produk, 0, ',', '.') }}</td>
    <td class="brutal-table-td text-center space-x-2">
     <!-- Edit Modal -->
     <div x-data="{ open: {{ $errors->any() && old('id_template') == $firstTpl->id_template ? 'true' : 'false' }} }" class="inline-block">
      <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary text-xs px-2 py-1">Edit</button>

      <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto">
       <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full my-8">
        <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Harga Produk</h2>
        <form action="{{ route('admin.harga-cabang.update', $firstTpl->id_template) }}" method="POST">
         @csrf
         @method('PUT')
         <input type="hidden" name="id_template" value="{{ $firstTpl->id_template }}">
         
         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Pilih Menu</label>
           <select name="id_menu" class="brutal-input bg-white" required>
            @foreach($menus as $menu)
             <option value="{{ $menu->id_menu }}" {{ (old('id_template') == $firstTpl->id_template ? old('id_menu') : $firstTpl->id_menu) == $menu->id_menu ? 'selected' : '' }}>
              {{ $menu->nama_menu }}
             </option>
            @endforeach
           </select>
         </div>

         <div class="mb-4" x-data="{ 
          checkAll: false,
          toggleAll() {
           this.checkAll = !this.checkAll;
           $el.querySelectorAll('.cabang-harga-edit-cb').forEach(cb => cb.checked = this.checkAll);
          }
         }">
          <div class="flex justify-between items-center mb-1">
           <label class="block font-extrabold text-xs text-left">Pilih Cabang / Event <span class="text-red-600">*</span></label>
           <button type="button" @click="toggleAll()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer ">
            [ <span x-text="checkAll ? 'Batal Pilih Semua' : 'Pilih Semua Cabang'"></span> ]
           </button>
          </div>
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
            @foreach($cabangs as $cabang)
             <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
              <input type="checkbox" name="id_cabang[]" value="{{ $cabang->id_cabang }}" 
               class="cabang-harga-edit-cb brutal-checkbox"
               {{ (old('id_template') == $firstTpl->id_template && is_array(old('id_cabang')) && in_array($cabang->id_cabang, old('id_cabang'))) || (!old('id_template') && in_array($cabang->id_cabang, $cabangIdsInGroup)) ? 'checked' : '' }}>
              <span>{{ $cabang->nama_cabang }}</span>
             </label>
            @endforeach
           </div>
         </div>

         <div class="mb-4" x-data="{ 
          checkAllSales: false,
          toggleAllSales() {
           this.checkAllSales = !this.checkAllSales;
           $el.querySelectorAll('.sales-harga-edit-cb').forEach(cb => cb.checked = this.checkAllSales);
          }
         }">
          <div class="flex justify-between items-center mb-1">
           <label class="block font-extrabold text-xs text-left">Pilih Mode Penjualan <span class="text-red-600">*</span></label>
           <button type="button" @click="toggleAllSales()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer ">
            [ <span x-text="checkAllSales ? 'Batal Pilih Semua' : 'Pilih Semua Mode Penjualan'"></span> ]
           </button>
          </div>
           <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border-2 border-black p-3 bg-white max-h-36 overflow-y-auto brutal-shadow-sm text-left">
            @foreach($salesModes as $mode)
             <label class="flex items-center gap-2 text-xs font-bold cursor-pointer p-1.5 border border-black hover:bg-yellow-200">
              <input type="checkbox" name="id_sales[]" value="{{ $mode->id_sales }}" 
               class="sales-harga-edit-cb brutal-checkbox"
               {{ (old('id_template') == $firstTpl->id_template && is_array(old('id_sales')) && in_array($mode->id_sales, old('id_sales'))) || (!old('id_template') && in_array($mode->id_sales, $salesIdsInGroup)) ? 'checked' : '' }}>
              <span>{{ $mode->nama_mode }}</span>
             </label>
            @endforeach
           </div>
           @error('id_sales')
            @if(old('id_template') == $firstTpl->id_template)
             <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
            @endif
           @enderror
         </div>

         <div class="mb-4">
          <label class="block font-extrabold mb-2 text-xs text-left">Harga Produk (Rp)</label>
          <input type="number" step="0.01" name="harga_produk" 
           value="{{ old('id_template') == $firstTpl->id_template ? old('harga_produk') : (float)$firstTpl->harga_produk }}" 
           class="brutal-input" required>
          @error('harga_produk')
           @if(old('id_template') == $firstTpl->id_template)
            <span class="text-red-500 text-xs font-bold block text-left mt-1">{{ $message }}</span>
           @endif
          @enderror
         </div>

         <div class="flex gap-4 mt-6">
          <button type="submit" class="brutal-btn brutal-btn-primary">Simpan Perubahan</button>
          <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary">Batal</button>
         </div>
        </form>
       </div>
      </div>
     </div>
     <form action="{{ route('admin.harga-cabang.destroy', $firstTpl->id_template) }}" method="POST" class="inline-block" onsubmit="return confirmAndSubmit(event, 'Yakin ingin menghapus seluruh kombinasi harga ini?');">
      @csrf
      @method('DELETE')
      <button type="submit" class="brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-xs px-2 py-1 text-brutal-black">Hapus</button>
     </form>
    </td>
   </tr>
   @empty
   <tr>
    <td colspan="5" class="brutal-table-td text-center py-8 text-gray-500 font-bold">Tidak ada data harga produk.</td>
   </tr>
   @endforelse
  </tbody>
 </table>
</div>

@if($templates->hasPages())
 <div class="p-5 border-t-4 border-black">
  {{ $templates->links() }}
 </div>
@endif
</div>
@endsection
