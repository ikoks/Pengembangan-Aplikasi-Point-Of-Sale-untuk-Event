@extends('layouts.admin')
@section('title', 'Dasbor')

@section('content')
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <!-- Card 1 -->
 <div class="bg-white border-2 border-brutal-black p-4 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
  <h3 class="font-extrabold text-xs text-gray-600 tracking-widest">Total Pendapatan</h3>
  <p class="text-xl font-black mt-1 text-brutal-black">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</p>
 </div>
 
 <!-- Card 2 -->
 <div class="bg-brutal-purple border-2 border-brutal-black p-4 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
  <h3 class="font-extrabold text-xs text-brutal-black tracking-widest">Total Transaksi</h3>
  <p class="text-xl font-black mt-1 text-brutal-black">{{ $totalTransaksi }}</p>
 </div>
 
 <!-- Card 3 -->
 <div class="bg-yellow-300 border-2 border-brutal-black p-4 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
  <h3 class="font-extrabold text-xs text-brutal-black tracking-widest">Cabang Aktif</h3>
  <p class="text-xl font-black mt-1 text-brutal-black">{{ $totalCabang }}</p>
 </div>

 <!-- Card 4 -->
 <div class="bg-cyan-300 border-2 border-brutal-black p-4 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
  <h3 class="font-extrabold text-xs text-brutal-black tracking-widest">Total Menu</h3>
  <p class="text-xl font-black mt-1 text-brutal-black">{{ $totalMenu }}</p>
 </div>
</div>

<div class="grid grid-cols-1 gap-6">
  
  {{-- Poin 1: Filter Periode & Rentang Tanggal Kustom (Dipindah ke luar kotak) --}}
  <div x-data="{ periode: '{{ $isCustomRange ? 'custom' : $periode }}' }" class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
   <form action="{{ route('admin.dashboard') }}" method="GET" class="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap w-full bg-yellow-200 border-2 border-brutal-black p-3 shadow-brutal">
    <span class="font-black text-sm">Filter Dasbor:</span>
    
    {{-- Selector Periode Preset --}}
    <select name="periode" x-model="periode" @change="if(periode !== 'custom') $event.target.form.submit()" class="brutal-input py-1 px-2 text-sm font-bold" style="width: auto;">
     <option value="hari">Hari Ini</option>
     <option value="minggu">1 Minggu</option>
     <option value="bulan">1 Bulan</option>
     <option value="custom">Kustom</option>
    </select>

    {{-- Filter Rentang Tanggal Kustom --}}
    <div x-show="periode === 'custom'" style="display: none;" class="flex items-center gap-2 flex-wrap ml-0 sm:ml-2 border-t-2 sm:border-t-0 sm:border-l-2 border-brutal-black pt-2 sm:pt-0 pl-0 sm:pl-2">
     <span class="text-sm font-extrabold">Dari:</span>
     <input type="date" name="tanggal_mulai" value="{{ $tanggalMulai }}"
            class="brutal-input py-1 px-2 text-sm" style="width: auto;" max="{{ date('Y-m-d') }}">
     <span class="text-sm font-extrabold">s/d:</span>
     <input type="date" name="tanggal_selesai" value="{{ $tanggalSelesai }}"
            class="brutal-input py-1 px-2 text-sm" style="width: auto;" max="{{ date('Y-m-d') }}">
     <button type="submit" class="brutal-btn brutal-btn-primary text-sm px-4 py-1">Terapkan</button>
     @if($isCustomRange)
      <a href="{{ route('admin.dashboard') }}" class="text-sm font-bold text-red-600 hover:underline px-2 bg-white border-2 border-brutal-black py-1">✕ Reset</a>
     @endif
    </div>
   </form>
  </div>
   {{-- Kotak Grafik Pendapatan --}}
   <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
    <div class="mb-4 border-b-2 border-brutal-black pb-2">
     <h2 class="text-lg font-black">{{ $chartTitle }}</h2>
    </div>
   <div style="position: relative; height: 300px; width: 100%;">
    <canvas id="revenueChart"></canvas>
   </div>
  </div>
 </div>

 <!-- New Row: Top Menu and Payment Methods -->
 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  <!-- Top 5 Menu Terlaris -->
  <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
   <div class="mb-4 border-b-2 border-brutal-black pb-2">
    <h2 class="text-lg font-black">TOP 5 MENU TERLARIS</h2>
   </div>
   <div style="position: relative; height: 300px; width: 100%;">
    <canvas id="topMenuChart"></canvas>
   </div>
  </div>

  <!-- Metode Pembayaran -->
  <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
   <div class="mb-4 border-b-2 border-brutal-black pb-2">
    <h2 class="text-lg font-black">METODE PEMBAYARAN</h2>
   </div>
   <div style="position: relative; height: 300px; width: 100%; display: flex; justify-content: center;">
    <canvas id="paymentChart"></canvas>
   </div>
  </div>
 </div>

 <!-- New Row: Recent Transactions and Active Shifts -->
 <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  <!-- 5 Transaksi Terbaru -->
  <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
   <div class="mb-4 border-b-2 border-brutal-black pb-2 flex justify-between items-center">
    <h2 class="text-lg font-black">5 TRANSAKSI TERBARU</h2>
    <a href="{{ route('admin.transaksi.index') }}" class="text-xs font-bold underline hover:text-brutal-purple">Lihat Semua</a>
   </div>
   <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
     <thead>
      <tr class="bg-gray-100 border-b-2 border-brutal-black text-xs">
       <th class="p-2 border-r-2 border-brutal-black">Waktu</th>
       <th class="p-2 border-r-2 border-brutal-black">Kasir</th>
       <th class="p-2 border-r-2 border-brutal-black">Metode</th>
       <th class="p-2 text-right">Total</th>
      </tr>
     </thead>
     <tbody>
      @forelse($recentTransactions as $trx)
      <tr class="border-b border-brutal-black hover:bg-yellow-100 text-sm">
       <td class="p-2 border-r-2 border-brutal-black">
        <div class="font-black">{{ \Carbon\Carbon::parse($trx->tanggal_transaksi)->format('d-m-Y') }}</div>
        <div class="text-xs">{{ substr($trx->jam_transaksi, 0, 5) }}</div>
       </td>
       <td class="p-2 border-r-2 border-brutal-black">{{ $trx->kasir->nama ?? '-' }}</td>
       <td class="p-2 border-r-2 border-brutal-black">{{ $trx->metodePembayaran->nama_metode ?? '-' }}</td>
       <td class="p-2 text-right font-bold">Rp {{ number_format($trx->total, 0, ',', '.') }}</td>
      </tr>
      @empty
      <tr>
       <td colspan="4" class="p-4 text-center text-gray-500 font-bold">Belum ada transaksi</td>
      </tr>
      @endforelse
     </tbody>
    </table>
   </div>
  </div>

  <!-- Shift Kasir Aktif -->
  <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
   <div class="mb-4 border-b-2 border-brutal-black pb-2 flex justify-between items-center">
    <h2 class="text-lg font-black text-brutal-black">SHIFT KASIR AKTIF</h2>
    <a href="{{ route('admin.log.shift.index') }}" class="text-xs font-bold underline text-brutal-black hover:text-white">Kelola Shift</a>
   </div>
   <div class="flex flex-col gap-3">
    @forelse($activeShifts as $shift)
    <div class="bg-white border-2 border-brutal-black p-3 flex justify-between items-center hover:-translate-y-1 transition-transform">
     <div>
      <p class="font-black text-sm">{{ $shift->user->nama ?? 'Unknown' }}</p>
      <p class="text-xs text-gray-600 font-bold mt-1">Cabang: {{ $shift->cabang->nama_cabang ?? '-' }}</p>
     </div>
     <div class="text-right flex flex-col items-end">
      <span class="inline-block px-2 py-1 text-xs font-black border-2 border-brutal-black {{ $shift->status_shift === 'OPEN' ? 'bg-green-400' : 'bg-yellow-400' }}">
       {{ $shift->status_shift }}
      </span>
      <p class="text-xs font-bold mt-2">{{ \Carbon\Carbon::parse($shift->waktu_mulai)->format('H:i') }}</p>
     </div>
    </div>
    @empty
    <div class="bg-white border-2 border-brutal-black p-4 text-center">
     <p class="font-bold text-gray-500">Tidak ada shift aktif saat ini.</p>
    </div>
    @endforelse
   </div>
  </div>
 </div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
 (function() {
  function initDashboardCharts() {
   // Cek apakah kita ada di halaman dashboard (canvas revenueChart harus ada)
   if (!document.getElementById('revenueChart')) return;

   // Cek apakah Chart.js sudah tersedia, jika belum tunggu 100ms
   if (typeof Chart === 'undefined') {
       console.log('[Dashboard] Chart.js belum sedia, mencoba ulang dalam 100ms...');
       setTimeout(initDashboardCharts, 100);
       return;
   }

   console.log('[Dashboard] Menginisialisasi grafik...');

   // 1. Revenue Chart
   const canvas = document.getElementById('revenueChart');
   if (canvas) {
       if (window.revenueChartInstance) {
           window.revenueChartInstance.destroy();
           window.revenueChartInstance = null;
       }
       const ctx = canvas.getContext('2d');
       const labels = @json($labels);
       const dataPendapatan = @json($dataPendapatan);

       window.revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
         labels: labels,
         datasets: [{
          label: 'Pendapatan (Rp)',
          data: dataPendapatan,
          backgroundColor: '#c77dff',
          borderColor: '#000000',
          borderWidth: 3,
          borderRadius: 0,
         }]
        },
        options: {
         responsive: true,
         maintainAspectRatio: false,
         scales: {
          y: {
           beginAtZero: true,
           grid: { color: '#e5e7eb' },
           ticks: { font: { family: '"Space Grotesk", sans-serif', weight: 'bold' } }
          },
          x: {
           grid: { display: false },
           ticks: { font: { family: '"Space Grotesk", sans-serif', weight: 'bold' } }
          }
         },
         plugins: {
          legend: {
           labels: {
            font: { family: '"Space Grotesk", sans-serif', weight: 'bold' },
            color: '#000'
           }
          }
         }
        }
       });
   }

   // 2. Top Menu Chart
   const canvasTopMenu = document.getElementById('topMenuChart');
   if (canvasTopMenu) {
       if (window.topMenuChartInstance) {
           window.topMenuChartInstance.destroy();
           window.topMenuChartInstance = null;
       }
       const ctxTopMenu = canvasTopMenu.getContext('2d');
       const topMenuLabels = @json($topMenuLabels);
       const topMenuData = @json($topMenuData);
       window.topMenuChartInstance = new Chart(ctxTopMenu, {
           type: 'bar',
           data: {
               labels: topMenuLabels,
               datasets: [{
                   label: 'Terjual (Qty)',
                   data: topMenuData,
                   backgroundColor: '#ffb703',
                   borderColor: '#000000',
                   borderWidth: 3,
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               indexAxis: 'y',
               scales: {
                   x: {
                       beginAtZero: true,
                       grid: { color: '#e5e7eb' },
                       ticks: { font: { family: '"Space Grotesk", sans-serif', weight: 'bold' } }
                   },
                   y: {
                       grid: { display: false },
                       ticks: { font: { family: '"Space Grotesk", sans-serif', weight: 'bold' } }
                   }
               },
               plugins: {
                   legend: { display: false }
               }
           }
       });
   }

   // 3. Payment Methods Chart
   const canvasPayment = document.getElementById('paymentChart');
   if (canvasPayment) {
       if (window.paymentChartInstance) {
           window.paymentChartInstance.destroy();
           window.paymentChartInstance = null;
       }
       const ctxPayment = canvasPayment.getContext('2d');
       const paymentLabels = @json($paymentLabels);
       const paymentData = @json($paymentData);
       window.paymentChartInstance = new Chart(ctxPayment, {
           type: 'doughnut',
           data: {
               labels: paymentLabels,
               datasets: [{
                   data: paymentData,
                   backgroundColor: ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500', '#f15bb5', '#9b5de5'],
                   borderColor: '#000000',
                   borderWidth: 3,
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               plugins: {
                   legend: {
                       position: 'bottom',
                       labels: {
                           font: { family: '"Space Grotesk", sans-serif', weight: 'bold' },
                           color: '#000'
                       }
                   }
               }
           }
       });
   }
  }

  // Jalankan saat halaman pertama kali selesai dimuat (termasuk setelah login redirect)
  if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', initDashboardCharts);
  } else {
   // DOM sudah siap (Turbo cache visit)
   initDashboardCharts();
  }

  // Jalankan saat navigasi Turbo selesai (berpindah halaman antar menu)
  document.addEventListener('turbo:load', initDashboardCharts);

  // Tangani tombol Back/Forward browser (Turbo cache restoration)
  document.addEventListener('turbo:render', initDashboardCharts);

 })();
</script>
@endpush
@endsection

