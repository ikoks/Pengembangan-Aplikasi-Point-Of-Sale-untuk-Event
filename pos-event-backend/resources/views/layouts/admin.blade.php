<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POS Event Admin — @yield('title', 'Dashboard')</title>
    
    <!-- Alpine.js untuk interaksi UI (Sidebar & Dropdown) -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <!-- Hotwire Turbo untuk SPA / Instant Navigation -->
    <script type="module" src="https://cdn.jsdelivr.net/npm/@hotwired/turbo@8.0.4/dist/turbo.es2017-umd.js"></script>
    
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
    <link rel="stylesheet" href="{{ asset('css/admin-brutal.css') }}">
</head>
<body class="text-brutal-black min-h-screen flex flex-col md:flex-row overflow-x-hidden" x-data="{ sidebarOpen: false, confirmModal: false, confirmMessage: '', confirmCallback: null }">

    <!-- Mobile Header -->
    <div class="md:hidden bg-brutal-white brutal-border border-b-2 p-3 flex justify-between items-center sticky top-0 z-20">
        <div class="font-extrabold text-lg tracking-tight">Pos Admin</div>
        <button @click="sidebarOpen = !sidebarOpen" class="brutal-btn brutal-btn-secondary brutal-shadow-sm px-3 py-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
    </div>

    <!-- Sidebar Overlay for Mobile -->
    <div x-show="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/50 z-30 md:hidden" style="display: none;"></div>

    <!-- Sidebar Fixed -->
    <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'" class="fixed inset-y-0 left-0 z-40 w-64 brutal-border bg-brutal-white transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:w-72 flex flex-col h-screen">
        
        <!-- Brand Header -->
        <div class="p-4 border-b-2 border-brutal-black bg-brutal-black text-white flex justify-between items-center">
            <h1 class="text-xl font-extrabold tracking-tight">Pos Admin</h1>
            <button @click="sidebarOpen = false" class="md:hidden text-white hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 overflow-y-auto p-4 space-y-4 font-bold">
            
            <a href="{{ route('admin.dashboard') }}" class="block px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.dashboard') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                Dasbor
            </a>

            <!-- Menu Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/kategori*') || request()->is('admin/sub-kategori*') || request()->is('admin/promosi*') || request()->is('admin/menu*') || request()->is('admin/harga-cabang*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>Menu & Katalog</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="{{ route('admin.kategori.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.kategori.*') ? 'bg-gray-200 font-extrabold' : '' }}">Kategori</a>
                    <a href="{{ route('admin.sub-kategori.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.sub-kategori.*') ? 'bg-gray-200 font-extrabold' : '' }}">Sub-Kategori</a>
                    <a href="{{ route('admin.menu.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.menu.*') ? 'bg-gray-200 font-extrabold' : '' }}">Menu Produk</a>
                    <a href="{{ route('admin.harga-cabang.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.harga-cabang.*') ? 'bg-gray-200 font-extrabold' : '' }}">Harga Produk</a>
                    <a href="{{ route('admin.promosi.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.promosi.*') ? 'bg-gray-200 font-extrabold' : '' }}">Promosi</a>
                </div>
            </div>

            <a href="{{ route('admin.cabang.index') }}" class="block px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.cabang.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                Cabang / Event
            </a>
            
            <a href="{{ route('admin.sales-mode.index') }}" class="block px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.sales-mode.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                Mode Penjualan
            </a>

            <!-- Pegawai Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/pegawai*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>Pegawai</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="{{ route('admin.pegawai.kasir.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.pegawai.kasir.*') ? 'bg-gray-200 font-extrabold' : '' }}">Kasir</a>
                    <a href="{{ route('admin.management.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.management.*') ? 'bg-gray-200 font-extrabold' : '' }}">Admin</a>
                </div>
            </div>

            <a href="{{ route('admin.laporan.index') }}" class="block px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.laporan.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                Laporan Keuangan
            </a>

            <a href="{{ route('admin.otp.index') }}" class="block px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors {{ request()->routeIs('admin.otp.*') ? 'bg-gray-200 brutal-shadow-sm translate-x-1 translate-y-1' : '' }}">
                OTP
            </a>

            <!-- Log Dropdown -->
            <div x-data="{ open: {{ request()->is('admin/log*') ? 'true' : 'false' }} }">
                <button @click="open = !open" class="w-full text-left px-2 py-1 text-sm brutal-border bg-white hover:bg-gray-100 transition-colors flex justify-between items-center">
                    <span>Log & Riwayat</span>
                    <svg :class="open ? 'rotate-180' : ''" class="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div x-show="open" class="pl-4 mt-2 space-y-2" style="display: none;">
                    <a href="{{ route('admin.log.audit.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.log.audit.*') ? 'bg-gray-200 font-extrabold' : '' }}">Audit Log</a>
                    <a href="{{ route('admin.log.shift.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.log.shift.*') ? 'bg-gray-200 font-extrabold' : '' }}">Shift Log</a>
                    <a href="{{ route('admin.log.transaksi.index') }}" class="block px-3 py-1 text-xs border-l-4 border-brutal-black hover:bg-gray-200 {{ request()->routeIs('admin.log.transaksi.*') ? 'bg-gray-200 font-extrabold' : '' }}">Riwayat Transaksi</a>
                </div>
            </div>

        </nav>

        <!-- User & Logout -->
        <div class="p-3 border-t-2 border-brutal-black bg-white">
            <div class="mb-2">
                <p class="text-xs font-bold text-gray-500">Login Sebagai:</p>
                <p class="font-extrabold text-sm truncate">{{ auth()->user()->nama_user ?? 'Admin' }}</p>
            </div>
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit" class="w-full brutal-btn brutal-btn-secondary bg-red-400 hover:bg-red-500 text-brutal-black text-xs text-left">
                    Keluar
                </button>
            </form>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden">
        
        <!-- Top Header for Desktop -->
        <header class="hidden md:flex bg-brutal-white brutal-border border-b-2 border-l-0 p-4 justify-between items-center sticky top-0 z-10">
            <h2 class="text-2xl font-extrabold tracking-tight">@yield('title', 'Dasbor')</h2>
            
            <div class="flex items-center gap-4">
                <span class="font-bold border-2 border-brutal-black px-3 py-1 bg-yellow-300 shadow-[2px_2px_0px_#000]">
                    {{ now()->format('d M Y') }}
                </span>
            </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-4 md:p-8">
            
            <!-- Global Confirmation Modal -->
            <div x-show="confirmModal" style="display: none;" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div @click.outside="confirmModal = false" class="bg-brutal-white p-6 brutal-border max-w-sm w-full mx-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 class="text-xl font-black mb-4">Konfirmasi</h2>
                    <p class="mb-6 font-medium" x-text="confirmMessage"></p>
                    <div class="flex justify-end gap-3">
                        <button @click="confirmModal = false" type="button" class="brutal-btn bg-gray-200 text-sm">Batal</button>
                        <button @click="if(confirmCallback) confirmCallback(); confirmModal = false" type="button" class="brutal-btn bg-red-400 text-sm">Ya, Lanjutkan</button>
                    </div>
                </div>
            </div>

            <!-- Floating Toast Notifications (Auto-hide, fixed position) -->
            <div class="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
                @if (session('success'))
                    <div x-data="{ show: true }" 
                         x-init="setTimeout(() => show = false, 3000)" 
                         x-show="show" 
                         x-transition:enter="transition ease-out duration-200"
                         x-transition:enter-start="opacity-0 -translate-y-4"
                         x-transition:enter-end="opacity-100 translate-y-0"
                         x-transition:leave="transition ease-in duration-200"
                         x-transition:leave-start="opacity-100 translate-y-0"
                         x-transition:leave-end="opacity-0 -translate-y-4"
                         class="pointer-events-auto bg-green-400 text-brutal-black font-extrabold px-5 py-2.5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 text-sm rounded-none">
                        <span>{{ session('success') }}</span>
                        <button @click="show = false" class="ml-2 font-black hover:opacity-75">✕</button>
                    </div>
                @endif

                @if (session('error'))
                    <div x-data="{ show: true }" 
                         x-init="setTimeout(() => show = false, 3000)" 
                         x-show="show" 
                         x-transition:enter="transition ease-out duration-200"
                         x-transition:enter-start="opacity-0 -translate-y-4"
                         x-transition:enter-end="opacity-100 translate-y-0"
                         x-transition:leave="transition ease-in duration-200"
                         x-transition:leave-start="opacity-100 translate-y-0"
                         x-transition:leave-end="opacity-0 -translate-y-4"
                         class="pointer-events-auto bg-red-400 text-brutal-black font-extrabold px-5 py-2.5 brutal-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 text-sm rounded-none">
                        <span>{{ session('error') }}</span>
                        <button @click="show = false" class="ml-2 font-black hover:opacity-75">✕</button>
                    </div>
                @endif
            </div>

            @yield('content')
            
        </div>
    </main>

    {{-- Stack for page-specific scripts (injected via @push('scripts') in child views) --}}
    @stack('scripts')

    {{-- Script Global untuk AJAX Live Filter (Tanpa Refresh) --}}
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('filter-form') || document.getElementById('formLaporan');
            const container = document.getElementById('data-container');

            if (form && container) {
                let debounceTimer;

                // Handle form input changes
                form.addEventListener('input', (e) => {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                        clearTimeout(debounceTimer);
                        debounceTimer = setTimeout(() => fetchResults(), 500); // 500ms debounce
                    }
                });
                
                // Handle form submit (prevent default reload, use AJAX)
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    clearTimeout(debounceTimer);
                    fetchResults();
                });

                // Function to fetch and replace data
                async function fetchResults(url = null) {
                    const fetchUrl = url || form.action + '?' + new URLSearchParams(new FormData(form)).toString();
                    
                    try {
                        container.style.opacity = '0.4';
                        container.style.pointerEvents = 'none';
                        
                        const response = await fetch(fetchUrl, {
                            headers: { 'X-Requested-With': 'XMLHttpRequest' }
                        });
                        
                        const html = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        const newContainer = doc.getElementById('data-container');
                        if (newContainer) {
                            container.innerHTML = newContainer.innerHTML;
                        }
                        
                        container.style.opacity = '1';
                        container.style.pointerEvents = 'auto';
                        
                        attachPaginationEvents();
                        window.history.pushState({}, '', fetchUrl);
                    } catch (error) {
                        console.error('AJAX Filter Error:', error);
                        container.style.opacity = '1';
                        container.style.pointerEvents = 'auto';
                    }
                }

                // Attach AJAX to pagination links
                function attachPaginationEvents() {
                    const links = container.querySelectorAll('nav[role="navigation"] a, .pagination a');
                    links.forEach(a => {
                        a.addEventListener('click', (e) => {
                            e.preventDefault();
                            fetchResults(a.href);
                        });
                    });
                }

                attachPaginationEvents();
            }
        });

        function confirmAndSubmit(event, message) {
            const form = event.target.tagName === 'FORM' ? event.target : event.target.closest('form');
            if (!form) return false;

            if (form.dataset.confirmed === 'true') {
                form.dataset.confirmed = 'false';
                return true;
            }

            event.preventDefault();
            event.stopPropagation();

            const bodyData = Alpine.$data(document.body);
            bodyData.confirmMessage = message;
            bodyData.confirmCallback = () => {
                form.dataset.confirmed = 'true';
                if (typeof form.requestSubmit === 'function') {
                    form.requestSubmit();
                } else {
                    form.submit();
                }
            };
            bodyData.confirmModal = true;
            return false;
        }

        // --- GLOBAL LIVE SEARCH (Instant search on type across all views) ---
        let searchDebounceTimer;
        let activeSearchInputName = null;

        document.addEventListener('input', function(event) {
            if (event.target && (event.target.name === 'search' || (event.target.form && event.target.form.method.toUpperCase() === 'GET' && event.target.type === 'text'))) {
                clearTimeout(searchDebounceTimer);
                const form = event.target.closest('form');
                if (!form) return;

                activeSearchInputName = event.target.name;

                searchDebounceTimer = setTimeout(() => {
                    if (typeof form.requestSubmit === 'function') {
                        form.requestSubmit();
                    } else {
                        form.submit();
                    }
                }, 100);
            }
        });

        function restoreSearchFocus() {
            if (activeSearchInputName) {
                const input = document.querySelector(`input[name="${activeSearchInputName}"]`);
                if (input) {
                    input.focus();
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }
                activeSearchInputName = null;
            }
        }

        document.addEventListener('turbo:render', restoreSearchFocus);
        document.addEventListener('turbo:load', restoreSearchFocus);

        // --- GLOBAL DRAGGABLE MODAL HANDLER ---
        // Allows all pop-up modals to be dragged/moved dynamically across the screen
        document.addEventListener('mousedown', function(e) {
            const modalBox = e.target.closest('.fixed.inset-0 > div, .fixed.inset-0 .bg-white');
            if (!modalBox) return;

            // Don't trigger drag if user clicked inside form inputs, buttons, links, selects, labels
            if (['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA', 'OPTION', 'LABEL'].includes(e.target.tagName)) return;
            if (e.target.closest('button, input, select, textarea, a, label')) return;

            let isDragging = true;
            let startX = e.clientX;
            let startY = e.clientY;

            let matrix = new DOMMatrix(window.getComputedStyle(modalBox).transform);
            let initialX = matrix.m41;
            let initialY = matrix.m42;

            function onMouseMove(moveEvent) {
                if (!isDragging) return;
                moveEvent.preventDefault();
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                modalBox.style.transform = `translate(${initialX + deltaX}px, ${initialY + deltaY}px)`;
            }

            function onMouseUp() {
                isDragging = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });

        // --- GLOBAL TABLE SORTER ---
        // Identify non-sortable columns automatically
        function initializeTableSorting() {
            document.querySelectorAll('th').forEach(th => {
                const text = th.textContent.replace(/↑|↓/g, '').trim().toLowerCase();
                if (text === 'aksi' || text === 'status' || text === 'opsi' || text === '') {
                    th.classList.add('no-sort');
                }
            });
        }
        document.addEventListener('DOMContentLoaded', initializeTableSorting);
        document.addEventListener('turbo:render', initializeTableSorting);

        // Allows sorting any table by clicking its column headers
        document.addEventListener('click', function(e) {
            const th = e.target.closest('th');
            if (!th || th.classList.contains('no-sort')) return;
            
            const table = th.closest('table');
            if (!table) return;

            const tbodies = Array.from(table.querySelectorAll('tbody'));
            if (tbodies.length === 0) return;

            const isMultiTbody = tbodies.length > 1;
            const targetTbody = tbodies[0];
            
            // Get column index
            const tr = th.closest('tr');
            const index = Array.from(tr.children).indexOf(th);
            if (index === -1) return;
            
            // Determine sort direction: default to descending (highest first) on first click
            let desc = th.dataset.sort !== 'desc';
            
            // Reset all headers in the same row
            Array.from(tr.children).forEach(sibling => {
                sibling.dataset.sort = '';
                const indicator = sibling.querySelector('.sort-indicator');
                if (indicator) indicator.remove();
            });

            // Set new sort direction
            th.dataset.sort = desc ? 'desc' : 'asc';
            const asc = !desc;
            
            const indicator = document.createElement('span');
            indicator.className = 'sort-indicator ml-1 text-red-500 font-extrabold';
            indicator.textContent = asc ? ' ↑' : ' ↓';
            th.appendChild(indicator);

            // Determine which elements to sort (multi-tbody for expandable rows, or trs for standard tables)
            const sortElements = isMultiTbody ? tbodies : Array.from(targetTbody.querySelectorAll('tr:not(.no-sort)'));

            sortElements.sort((a, b) => {
                const rowA = isMultiTbody ? a.querySelector('tr') : a;
                const rowB = isMultiTbody ? b.querySelector('tr') : b;
                
                if (!rowA || !rowB) return 0;

                const cellA = rowA.children[index]?.textContent.trim() || '';
                const cellB = rowB.children[index]?.textContent.trim() || '';
                
                // Helper to parse numbers like "Rp 1.500.000", "1,500", "5 item"
                const parseVal = (val) => {
                    if (!val) return '';
                    // Extract numbers, minus signs, and commas/dots
                    const numStr = val.replace(/[^0-9,\.-]+/g, "").trim(); 
                    // Normalize Indonesian format (1.500.000,00) to standard float (1500000.00)
                    // If it has both dots and commas, assume dot is thousand separator and comma is decimal
                    let normalized = numStr;
                    if (normalized.includes('.') && normalized.includes(',')) {
                        normalized = normalized.replace(/\./g, '').replace(',', '.');
                    } else if (normalized.includes(',')) {
                         // if it only has commas, it could be decimal, let's treat it as decimal
                        normalized = normalized.replace(',', '.');
                    } else {
                         // if it only has dots, remove them (e.g. Rp 1.500)
                        normalized = normalized.replace(/\./g, '');
                    }
                    const num = parseFloat(normalized);
                    return isNaN(num) ? val.toLowerCase() : num;
                };

                const valA = parseVal(cellA);
                const valB = parseVal(cellB);

                if (valA < valB) return asc ? -1 : 1;
                if (valA > valB) return asc ? 1 : -1;
                return 0;
            });

            // Re-append sorted elements
            const tfoot = table.querySelector('tfoot');
            if (isMultiTbody) {
                sortElements.forEach(el => {
                    if (tfoot) table.insertBefore(el, tfoot);
                    else table.appendChild(el);
                });
            } else {
                sortElements.forEach(el => targetTbody.appendChild(el));
            }
        });
    </script>
    <style>
        .fixed.inset-0 .bg-white h2, 
        .fixed.inset-0 .bg-white h3, 
        .fixed.inset-0 .bg-white .border-b-2 {
            cursor: grab;
            user-select: none;
        }
        .fixed.inset-0 .bg-white h2:active, 
        .fixed.inset-0 .bg-white h3:active, 
        .fixed.inset-0 .bg-white .border-b-2:active {
            cursor: grabbing;
        }
        /* Make sortable table headers indicate they are clickable */
        th:not(.no-sort) {
            cursor: pointer;
            user-select: none;
            transition: opacity 0.2s;
        }
        th:not(.no-sort):hover {
            opacity: 0.8;
        }
    </style>

</body>
</html>
