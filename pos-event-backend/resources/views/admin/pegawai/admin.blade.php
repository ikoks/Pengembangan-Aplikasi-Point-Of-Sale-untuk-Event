@extends('layouts.admin')

@section('title', 'Manajemen Admin')

@section('content')
{{-- POS-A-15: Registrasi & Manajemen User Admin --}}

{{-- FORM TAMBAH ADMIN (Accordion) --}}
<div x-data="{ openForm: {{ session('errors') && old('_action') === 'create' ? 'true' : 'false' }} }" class="mb-6">
 <button @click="openForm = true"
  class="w-full brutal-btn brutal-btn-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left flex justify-between items-center">
  <span>Daftarkan Admin Baru</span>
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
   <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M12 4v16m8-8H4"></path>
  </svg>
 </button>

 <div x-show="openForm" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 text-left">
  <div @click.away="openForm = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
   <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Daftarkan Admin Baru</h2>
  <form method="POST" action="{{ route('admin.management.store') }}">
   @csrf
   <input type="hidden" name="_action" value="create">
   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div>
     <label class="block text-xs font-extrabold mb-1">Nama Lengkap <span class="text-red-600">*</span></label>
     <input type="text" name="nama_user" value="{{ old('nama_user') }}"
      class="brutal-input" placeholder="Nama lengkap..." required>
     @error('nama_user')
      <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
     @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Username <span class="text-red-600">*</span></label>
     <input type="text" name="username" value="{{ old('username') }}"
      class="brutal-input font-mono" placeholder="username_unik..." required>
     @error('username')
      <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
     @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Email <span class="text-red-600">*</span></label>
     <input type="email" name="email" value="{{ old('email') }}"
      class="brutal-input" placeholder="email@contoh.com" required>
     @error('email')
      <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
     @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Cabang <span class="text-gray-500 font-normal">(Opsional)</span></label>
     <div x-data="{
         openPicker: false, search: '', items: [], loading: false,
         selectedId: '{{ old('id_cabang') }}', selectedName: '{{ old('id_cabang') ? ($cabangs->where('id_cabang', old('id_cabang'))->first()->nama_cabang ?? '') : '' }}',
         fetchData() {
             this.loading = true;
             fetch('{{ route('admin.ajax.cabang') }}?search=' + this.search)
                 .then(res => res.json())
                 .then(data => { this.items = data.data; this.loading = false; });
         },
         selectItem(item) {
             this.selectedId = item.id_cabang;
             this.selectedName = item.nama_cabang;
             this.openPicker = false;
         },
         clearSelection() {
             this.selectedId = '';
             this.selectedName = '';
             this.openPicker = false;
         }
      }">
       <input type="hidden" name="id_cabang" :value="selectedId">
       <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
        <span x-text="selectedName || '-- Admin Pusat (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
       </button>

       <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60">
        <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
         <h3 class="font-extrabold mb-3">Pilih Cabang</h3>
         <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari cabang...">
         <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
          <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
            -- Admin Pusat --
          </button>
          <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
          <template x-for="item in items" :key="item.id_cabang">
           <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
            <span x-text="item.nama_cabang" class="text-brutal-black"></span>
            <span x-text="item.lokasi" class="text-[10px] text-gray-500"></span>
           </button>
          </template>
          <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada cabang.</div>
         </div>
         <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
        </div>
       </div>
     </div>
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Password <span class="text-red-600">*</span></label>
     <input type="password" name="password"
      class="brutal-input" placeholder="Min. 8 karakter..." required>
     <p class="text-xs text-gray-500 mt-1">Min. 8 karakter, huruf besar, kecil, dan angka.</p>
     @error('password')
      <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p>
     @enderror
    </div>
    <div>
     <label class="block text-xs font-extrabold mb-1">Konfirmasi Password <span class="text-red-600">*</span></label>
     <input type="password" name="password_confirmation"
      class="brutal-input" placeholder="Ulangi password..." required>
    </div>
   </div>
   <div class="flex gap-3">
    <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow">
     Simpan Admin
    </button>
    <button type="button" @click="openForm = false"
     class="brutal-btn brutal-btn-secondary brutal-shadow">
     Batal
    </button>
   </div>
  </form>
 </div>
</div>

{{-- TABEL DAFTAR ADMIN --}}
<div class="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
 <div class="p-5 border-b-4 border-black flex justify-between items-center">
  <div>
   <h3 class="font-extrabold text-xl tracking-tight">Daftar User Admin</h3>
   <p class="text-sm font-bold text-gray-600 mt-1">
    Total: <span class="font-mono font-extrabold">{{ $admins->total() }}</span> admin terdaftar
   </p>
  </div>

  {{-- Search --}}
  <form method="GET" action="{{ route('admin.management.index') }}" class="flex gap-2">
   <input type="text" name="search" value="{{ request('search') }}"
    placeholder="Cari nama / username..."
    class="brutal-input text-sm w-48">
   <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm px-3">
    Cari
   </button>
  </form>
 </div>

 <div class="overflow-x-auto">
  <table class="w-full border-collapse">
   <thead>
    <tr>
     <th class="brutal-table-th text-xs">Nama Admin</th>
     <th class="brutal-table-th text-xs">Username</th>
     <th class="brutal-table-th text-xs">Email</th>
     <th class="brutal-table-th text-xs">Cabang</th>
     <th class="brutal-table-th text-xs text-center">Status</th>
     <th class="brutal-table-th text-xs text-center">Aksi</th>
    </tr>
   </thead>
   <tbody>
    @forelse($admins as $admin)
     <tr class="{{ !$admin->status_aktif ? 'opacity-50 bg-gray-50' : 'hover:bg-yellow-50' }} transition-colors">
      <td class="brutal-table-td">
       <span class="font-bold text-sm">{{ $admin->nama_admin }}</span>
       @if($admin->id_admin === auth()->id())
        <span class="ml-2 text-xs bg-yellow-300 border border-black px-1.5 py-0.5 font-bold">Anda</span>
       @endif
      </td>
      <td class="brutal-table-td font-mono text-sm">{{ $admin->username }}</td>
      <td class="brutal-table-td text-sm">{{ $admin->email ?? '—' }}</td>
      <td class="brutal-table-td text-sm">
       {{ $admin->cabang?->nama_cabang ?? 'Admin Pusat' }}
      </td>
      <td class="brutal-table-td text-center">
       @if($admin->id_admin !== auth()->id())
        <form action="{{ route('admin.management.toggle-status', $admin->id_admin) }}" method="POST" class="inline-flex flex-col items-center gap-1">
         @csrf
         @method('PATCH')
         <span class="text-[10px] font-black tracking-wider {{ $admin->status_aktif ? 'text-green-600' : 'text-gray-500' }}">{{ $admin->status_aktif ? 'Aktif' : 'Nonaktif' }}</span>
         <button type="submit" title="{{ $admin->status_aktif ? 'Aktif' : 'Nonaktif' }}" class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] {{ $admin->status_aktif ? 'bg-green-400' : 'bg-gray-300' }}">
          <span class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {{ $admin->status_aktif ? 'translate-x-5' : 'translate-x-1' }} border-2 border-black"></span>
         </button>
        </form>
       @else
        <span class="border-2 border-black bg-green-400 px-2 py-0.5 text-xs font-extrabold">[AKTIF]</span>
       @endif
      </td>
      <td class="brutal-table-td">
       <div class="flex gap-2 justify-center flex-wrap">

        {{-- Edit Modal --}}
        <div x-data="{ open: {{ $errors->any() && old('id_user') == $admin->id_admin ? 'true' : 'false' }} }" class="inline-block">
         <button @click="open = true" type="button" class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-xs px-2 py-1">Edit</button>

         <div x-show="open" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto font-normal">
          <div @click.away="open = false" class="bg-white brutal-border brutal-shadow p-6 max-w-2xl w-full my-8">
           <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">Edit Admin: {{ $admin->nama_admin }}</h2>
           <form method="POST" action="{{ route('admin.management.update', $admin->id_admin) }}">
            @csrf
            @method('PUT')
            <input type="hidden" name="id_user" value="{{ $admin->id_admin }}">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <div>
              <label class="block text-xs font-extrabold mb-1">Nama Lengkap</label>
              <input type="text" name="nama_user" value="{{ old('id_user') == $admin->id_admin ? old('nama_user') : $admin->nama_admin }}"
               class="brutal-input" required>
             </div>
             <div>
              <label class="block text-xs font-extrabold mb-1">Username</label>
              <input type="text" name="username" value="{{ old('id_user') == $admin->id_admin ? old('username') : $admin->username }}"
               class="brutal-input font-mono" required>
             </div>
             <div>
              <label class="block text-xs font-extrabold mb-1">Email <span class="text-red-600">*</span></label>
              <input type="email" name="email" value="{{ old('id_user') == $admin->id_admin ? old('email') : $admin->email }}"
               class="brutal-input" required>
             </div>
             <div>
              <label class="block text-xs font-extrabold mb-1">Cabang <span class="text-gray-500 font-normal">(Opsional)</span></label>
              <div x-data="{
                  openPicker: false, search: '', items: [], loading: false,
                  selectedId: '{{ old('id_user') == $admin->id_admin ? old('id_cabang') : $admin->id_cabang }}',
                  selectedName: '{{ old('id_user') == $admin->id_admin ? ($cabangs->where('id_cabang', old('id_cabang'))->first()->nama_cabang ?? '') : ($admin->cabang->nama_cabang ?? '') }}',
                  fetchData() {
                      this.loading = true;
                      fetch('{{ route('admin.ajax.cabang') }}?search=' + this.search)
                          .then(res => res.json())
                          .then(data => { this.items = data.data; this.loading = false; });
                  },
                  selectItem(item) {
                      this.selectedId = item.id_cabang;
                      this.selectedName = item.nama_cabang;
                      this.openPicker = false;
                  },
                  clearSelection() {
                      this.selectedId = '';
                      this.selectedName = '';
                      this.openPicker = false;
                  }
               }">
                <input type="hidden" name="id_cabang" :value="selectedId">
                <button type="button" @click="openPicker = true; fetchData()" class="brutal-input flex justify-between items-center text-left bg-white w-full focus:outline-none">
                 <span x-text="selectedName || '-- Admin Pusat (Buka Modal) --'" :class="!selectedName ? 'text-gray-500' : ''"></span>
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </button>

                <div x-show="openPicker" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
                 <div @click.away="openPicker = false" class="bg-white brutal-border p-5 max-w-sm w-full max-h-[80vh] flex flex-col">
                  <h3 class="font-extrabold mb-3">Pilih Cabang</h3>
                  <input type="text" x-model="search" @input.debounce.300ms="fetchData()" class="brutal-input text-sm mb-4" placeholder="Cari cabang...">
                  <div class="overflow-y-auto flex-1 min-h-[150px] border-2 border-brutal-black p-2 bg-gray-50">
                   <button type="button" @click="clearSelection()" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors text-red-600">
                     -- Admin Pusat --
                   </button>
                   <div x-show="loading" class="text-center text-sm py-4 font-bold animate-pulse">Memuat...</div>
                   <template x-for="item in items" :key="item.id_cabang">
                    <button type="button" @click="selectItem(item)" class="w-full text-left p-2 border-b-2 border-transparent hover:border-black font-bold text-sm transition-colors flex flex-col">
                     <span x-text="item.nama_cabang" class="text-brutal-black"></span>
                     <span x-text="item.lokasi" class="text-[10px] text-gray-500"></span>
                    </button>
                   </template>
                   <div x-show="!loading && items.length === 0" class="text-center text-sm py-4 font-bold text-gray-500">Tidak ada cabang.</div>
                  </div>
                  <button type="button" @click="openPicker = false" class="brutal-btn brutal-btn-secondary text-xs mt-4">Tutup Pencarian</button>
                 </div>
                </div>
              </div>
             </div>
            </div>
            
            <div class="flex gap-3 mt-6">
             <button type="submit" class="brutal-btn brutal-btn-primary brutal-shadow-sm text-sm">Simpan Perubahan</button>
             <button type="button" @click="open = false" class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-sm">Batal</button>
            </div>
           </form>
          </div>
         </div>
        </div>

        {{-- Reset Password Modal --}}
        <div x-data="{ openReset: {{ $errors->has('password_baru') && old('id_user') == $admin->id_admin ? 'true' : 'false' }} }" class="inline-block">
         <button @click="openReset = true" type="button" class="brutal-btn brutal-shadow-sm text-xs px-2 py-1 bg-yellow-300 border-2 border-black">
          Reset Password
         </button>

         <div x-show="openReset" style="display: none;" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 text-left overflow-y-auto font-normal">
          <div @click.away="openReset = false" class="bg-white brutal-border brutal-shadow p-6 max-w-xl w-full my-8">
           <h2 class="text-xl font-black mb-4 border-b-2 border-brutal-black pb-2">[RESET PASSWORD] Admin: {{ $admin->nama_admin }}</h2>
           <form method="POST" action="{{ route('admin.management.reset-password', $admin->id_admin) }}" onsubmit="return confirmAndSubmit(event, 'KONFIRMASI: Reset password admin {{ $admin->nama_admin }}? Semua sesi aktif akan diinvalidasi.');">
            @csrf
            <input type="hidden" name="id_user" value="{{ $admin->id_admin }}">
            <div class="mb-4">
             <label class="block text-xs font-extrabold mb-1">Password Baru <span class="text-red-600">*</span></label>
             <input type="password" name="password_baru" class="brutal-input" placeholder="Min. 8 karakter..." required>
             <p class="text-xs text-gray-500 mt-1">Min. 8 karakter, huruf besar, kecil, dan angka.</p>
             @error('password_baru') @if(old('id_user') == $admin->id_admin) <p class="text-red-600 text-xs font-bold mt-1">{{ $message }}</p> @endif @enderror
            </div>
            <div class="mb-6">
             <label class="block text-xs font-extrabold mb-1">Konfirmasi Password Baru <span class="text-red-600">*</span></label>
             <input type="password" name="password_baru_confirmation" class="brutal-input" placeholder="Ulangi password..." required>
            </div>
            <div class="flex gap-3">
             <button type="submit" class="brutal-btn brutal-shadow-sm text-sm bg-yellow-300 border-3 border-black">
              Reset Password
             </button>
             <button type="button" @click="openReset = false" class="brutal-btn brutal-btn-secondary brutal-shadow-sm text-sm">Batal</button>
            </div>
           </form>
          </div>
         </div>
        </div>

        {{-- Delete (tidak bisa hapus diri sendiri) --}}
        @if($admin->id_admin !== auth()->id())
         <form method="POST"
          action="{{ route('admin.management.destroy', $admin->id_admin) }}"
          onsubmit="return confirmAndSubmit(event, 'KONFIRMASI: Nonaktifkan admin {{ $admin->nama_admin }}?');">
          @csrf
          @method('DELETE')
          <button type="submit"
           class="brutal-btn brutal-shadow-sm text-xs px-2 py-1 bg-red-400 border-2 border-black">
           Nonaktifkan
          </button>
         </form>
        @endif
       </div>
      </td>
     </tr>
     @empty
     <tr>
      <td colspan="6" class="brutal-table-td text-center py-12">
       <p class="font-extrabold text-xl text-gray-400">[TIDAK ADA ADMIN]</p>
      </td>
     </tr>
    @endforelse
   </tbody>
  </table>
 </div>

 @if($admins->hasPages())
  <div class="p-5 border-t-4 border-black">
   {{ $admins->links() }}
  </div>
 @endif
</div>

@push('scripts')
@endpush
@endsection
