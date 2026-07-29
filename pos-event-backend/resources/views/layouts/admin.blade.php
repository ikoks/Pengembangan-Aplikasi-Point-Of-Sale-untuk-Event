<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS Event Admin — @yield('title', 'Dashboard')</title>
    
    <!-- Alpine.js untuk interaksi UI (Sidebar & Dropdown) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Konfigurasi Tailwind untuk Neo-Brutalist -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { 'grotesk': ['"Space Grotesk"', 'sans-serif'] },
                    boxShadow: { 'brutal': '4px 4px 0px 0px #000000' },
                    colors: { 'brutal-bg': '#F5F0E8', 'brutal-black': '#000000', 'brutal-white': '#FFFFFF' }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Space Grotesk', sans-serif; background-color: #F5F0E8; }
        .brutal-border { border: 3px solid #000000; }
        .brutal-shadow { box-shadow: 4px 4px 0px 0px #000000; }
        .brutal-shadow-sm { box-shadow: 2px 2px 0px 0px #000000; }
        .brutal-input { border: 3px solid #000000; padding: 0.5rem 1rem; width: 100%; transition: all 0.2s; }
        .brutal-input:focus { outline: none; box-shadow: 4px 4px 0px 0px #000000; }
        .brutal-btn { border: 3px solid #000000; font-weight: 800; text-transform: uppercase; padding: 0.5rem 1rem; transition: all 0.1s; display: inline-block; text-align: center; }
        .brutal-btn:active { transform: translate(4px, 4px); box-shadow: none !important; }
        .brutal-btn-primary { background-color: #000000; color: #FFFFFF; }
        .brutal-btn-primary:hover { background-color: #333333; }
        .brutal-btn-secondary { background-color: #FFFFFF; color: #000000; box-shadow: 4px 4px 0px 0px #000000; }
        .brutal-btn-secondary:hover { background-color: #f3f4f6; }
        .brutal-table-th { border: 3px solid #000000; background-color: #000000; color: #FFFFFF; font-weight: 700; text-transform: uppercase; padding: 0.75rem; text-align: left; }
        .brutal-table-td { border: 3px solid #000000; background-color: #FFFFFF; padding: 0.75rem; }
    </style>
</head>
<body class="text-brutal-black min-h-screen flex flex-col md:flex-row overflow-x-hidden" x-data="{ sidebarOpen: false }">

    <!-- Mobile Header -->
    <div class="md:hidden bg-brutal-white brutal-border border-b-4 p-4 flex justify-between items-center sticky top-0 z-20">
        <div class="font-extrabold text-xl tracking-tight uppercase">POS ADMIN</div>
        <button @click="sidebarOpen = !sidebarOpen" class="brutal-btn brutal-btn-secondary brutal-shadow-sm px-3 py-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
    </div>

    <!-- Sidebar Overlay for Mobile -->
    <div x-show="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-30 md:hidden" style="display: none;"></div>

    <!-- Sidebar Fixed -->
    <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'" class="fixed inset-y-0 left-0 z-40 w-64 brutal-border bg-brutal-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-72 flex flex-col h-screen">
        
        <!-- Brand Header -->
        <div class="p-6 border-b-4 border-brutal-black bg-brutal-black text-white flex justify-between items-center">
            <h1 class="text-2xl font-extrabold tracking-tight uppercase">POS ADMIN</h1>
            <button @click="sidebarOpen = false" class="md:hidden text-white hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 overflow-y-auto p-4 space-y-2 font-bold">
            
            <a href="{{ route('admin.dashboard') }}" class="block px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.dashboard') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                DASHBOARD
            </a>

            <!-- Menu Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/kategori*') || request()->is('admin/sub-kategori*') || request()->is('admin/promosi*') || request()->is('admin/menu*') || request()->is('admin/harga-cabang*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>MENU & KATALOG</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="{{ route('admin.kategori.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.kategori.*') ? 'bg-gray-200 font-extrabold' : '' }}">KATEGORI</a>
                    <a href="{{ route('admin.sub-kategori.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.sub-kategori.*') ? 'bg-gray-200 font-extrabold' : '' }}">SUB-KATEGORI</a>
                    <a href="{{ route('admin.promosi.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.promosi.*') ? 'bg-gray-200 font-extrabold' : '' }}">PROMOSI</a>
                    <a href="{{ route('admin.menu.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.menu.*') ? 'bg-gray-200 font-extrabold' : '' }}">MENU PRODUK</a>
                    <a href="{{ route('admin.harga-cabang.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.harga-cabang.*') ? 'bg-gray-200 font-extrabold' : '' }}">HARGA CABANG</a>
                </div>
            </div>

            <a href="{{ route('admin.cabang.index') }}" class="block px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.cabang.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                CABANG EVENT
            </a>
            
            <a href="{{ route('admin.sales-mode.index') }}" class="block px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.sales-mode.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                SALES MODE
            </a>

            <!-- Pegawai Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/pegawai*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>PEGAWAI</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="{{ route('admin.pegawai.kasir.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.pegawai.kasir.*') ? 'bg-gray-200 font-extrabold' : '' }}">KASIR</a>
                    <a href="{{ route('admin.pegawai.admin.index') }}" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.pegawai.admin.*') ? 'bg-gray-200 font-extrabold' : '' }}">ADMIN</a>
                </div>
            </div>

            <!-- Log Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/log*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>LOG & RIWAYAT</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="#" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200">AUDIT LOG</a>
                    <a href="#" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200">SHIFT LOG</a>
                    <a href="#" class="block px-4 py-2 border-l-4 border-brutal-black hover:bg-gray-200">RIWAYAT TRANSAKSI</a>
                </div>
            </div>

            <a href="#" class="block px-4 py-3 brutal-border bg-white hover:bg-gray-100 transition-colors">
                LAPORAN KEUANGAN
            </a>

        </nav>

        <!-- User & Logout -->
        <div class="p-4 border-t-4 border-brutal-black bg-white">
            <div class="mb-4">
                <p class="text-sm font-bold text-gray-500 uppercase">Login Sebagai:</p>
                <p class="font-extrabold text-lg truncate">{{ auth()->user()->nama_user ?? 'Admin' }}</p>
            </div>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit" class="w-full brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-brutal-black text-sm text-left">
                    LOGOUT [X]
                </button>
            </form>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden">
        
        <!-- Top Header for Desktop -->
        <header class="hidden md:flex bg-brutal-white brutal-border border-b-4 border-l-0 p-6 justify-between items-center sticky top-0 z-10">
            <h2 class="text-3xl font-extrabold tracking-tight uppercase">@yield('title', 'Dashboard')</h2>
            
            <div class="flex items-center gap-4">
                <span class="font-bold border-2 border-brutal-black px-3 py-1 bg-yellow-300 shadow-[2px_2px_0px_#000]">
                    {{ now()->format('d M Y') }}
                </span>
            </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8">
            
            <!-- Flash Messages -->
            @if (session('success'))
                <div class="mb-6 p-4 brutal-border bg-green-400 font-bold text-brutal-black flex justify-between items-center" x-data="{ show: true }" x-show="show">
                    <span>[SUCCESS] {{ session('success') }}</span>
                    <button @click="show = false" class="font-extrabold">X</button>
                </div>
            @endif

            @if (session('error'))
                <div class="mb-6 p-4 brutal-border bg-red-400 font-bold text-brutal-black flex justify-between items-center" x-data="{ show: true }" x-show="show">
                    <span>[ERROR] {{ session('error') }}</span>
                    <button @click="show = false" class="font-extrabold">X</button>
                </div>
            @endif

            @if ($errors->any())
                <div class="mb-6 p-4 brutal-border bg-red-400 font-bold text-brutal-black" x-data="{ show: true }" x-show="show">
                    <div class="flex justify-between items-center mb-2">
                        <span>[PERHATIAN] Terdapat kesalahan input:</span>
                        <button @click="show = false" class="font-extrabold">X</button>
                    </div>
                    <ul class="list-disc pl-5">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @yield('content')
            
        </div>
    </main>

</body>
</html>
