@extends('layouts.admin')
@section('title', 'Dashboard')

@section('content')
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Card 1 -->
    <div class="bg-white border-4 border-brutal-black p-6 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <h3 class="font-extrabold text-sm text-gray-600 uppercase tracking-widest">TOTAL PENDAPATAN</h3>
        <p class="text-3xl font-black mt-2 text-brutal-black">Rp {{ number_format($totalPendapatan, 0, ',', '.') }}</p>
    </div>
    
    <!-- Card 2 -->
    <div class="bg-brutal-purple border-4 border-brutal-black p-6 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <h3 class="font-extrabold text-sm text-brutal-black uppercase tracking-widest">TOTAL TRANSAKSI</h3>
        <p class="text-3xl font-black mt-2 text-brutal-black">{{ $totalTransaksi }}</p>
    </div>
    
    <!-- Card 3 -->
    <div class="bg-yellow-300 border-4 border-brutal-black p-6 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <h3 class="font-extrabold text-sm text-brutal-black uppercase tracking-widest">CABANG AKTIF</h3>
        <p class="text-3xl font-black mt-2 text-brutal-black">{{ $totalCabang }}</p>
    </div>

    <!-- Card 4 -->
    <div class="bg-cyan-300 border-4 border-brutal-black p-6 shadow-brutal flex flex-col justify-between hover:-translate-y-1 transition-transform">
        <h3 class="font-extrabold text-sm text-brutal-black uppercase tracking-widest">TOTAL MENU</h3>
        <p class="text-3xl font-black mt-2 text-brutal-black">{{ $totalMenu }}</p>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2 bg-white border-4 border-brutal-black shadow-brutal p-6">
        <h2 class="text-xl font-black uppercase mb-4 border-b-4 border-brutal-black pb-2">GRAFIK PENDAPATAN (7 HARI TERAKHIR)</h2>
        <div style="position: relative; height: 300px; width: 100%;">
            <canvas id="revenueChart"></canvas>
        </div>
    </div>

    <div class="bg-white border-4 border-brutal-black shadow-brutal p-6">
        <h2 class="text-xl font-black uppercase mb-4 border-b-4 border-brutal-black pb-2">INFO SISTEM</h2>
        <div class="space-y-4">
            <div class="p-4 bg-gray-100 border-2 border-brutal-black">
                <p class="font-extrabold text-sm uppercase">Versi POS Event</p>
                <p class="text-lg font-bold">1.0.0 (Sprint 3)</p>
            </div>
            <div class="p-4 bg-gray-100 border-2 border-brutal-black">
                <p class="font-extrabold text-sm uppercase">Login Sebagai</p>
                <p class="text-lg font-bold">{{ auth()->user()->nama_user }}</p>
            </div>
            <a href="{{ route('admin.menu.index') }}" class="block text-center w-full bg-brutal-black text-white font-extrabold uppercase py-3 border-2 border-brutal-black hover:bg-white hover:text-brutal-black transition-colors">
                KELOLA MENU
            </a>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const ctx = document.getElementById('revenueChart').getContext('2d');
        const rawData = @json($chartData);
        
        // Generate last 7 days labels
        const labels = [];
        const dataPendapatan = [];
        const dataJumlah = [];
        
        let d = new Date();
        d.setDate(d.getDate() - 6);
        for(let i=0; i<7; i++) {
            const dateStr = d.toISOString().split('T')[0];
            labels.push(dateStr);
            
            const match = rawData.find(item => item.tanggal === dateStr);
            dataPendapatan.push(match ? match.pendapatan : 0);
            dataJumlah.push(match ? match.jumlah : 0);
            
            d.setDate(d.getDate() + 1);
        }

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
