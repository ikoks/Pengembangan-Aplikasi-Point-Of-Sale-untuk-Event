@extends('layouts.admin')
@section('title', 'Dashboard')

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
 <div class="bg-white border-2 border-brutal-black shadow-brutal p-4">
  <div class="flex flex-col sm:flex-row justify-between items-center mb-4 border-b-2 border-brutal-black pb-2">
   <h2 class="text-lg font-black ">{{ $chartTitle }}</h2>
   <form action="{{ route('admin.dashboard') }}" method="GET" class="mt-2 sm:mt-0">
    <select name="periode" onchange="this.form.submit()" class="brutal-input py-1 px-2 text-xs" style="width: auto;">
     <option value="hari" {{ $periode == 'hari' ? 'selected' : '' }}>1 Hari</option>
     <option value="minggu" {{ $periode == 'minggu' ? 'selected' : '' }}>1 Minggu</option>
     <option value="bulan" {{ $periode == 'bulan' ? 'selected' : '' }}>1 Bulan</option>
    </select>
   </form>
  </div>
  <div style="position: relative; height: 300px; width: 100%;">
   <canvas id="revenueChart"></canvas>
  </div>
 </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
 document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  const labels = @json($labels);
  const dataPendapatan = @json($dataPendapatan);

  new Chart(ctx, {
   type: 'bar',
   data: {
    labels: labels,
    datasets: [{
     label: 'Pendapatan (Rp)',
     data: dataPendapatan,
     backgroundColor: '#c77dff',
     borderColor: '#000000',
     borderWidth: 3,
     borderRadius: 0, // Brutalist style
    }]
   },
   options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
     y: {
      beginAtZero: true,
      grid: { color: '#e5e7eb' },
      ticks: {
       font: { family: '"Space Grotesk", sans-serif', weight: 'bold' }
      }
     },
     x: {
      grid: { display: false },
      ticks: {
       font: { family: '"Space Grotesk", sans-serif', weight: 'bold' }
      }
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
 });
</script>
@endsection
