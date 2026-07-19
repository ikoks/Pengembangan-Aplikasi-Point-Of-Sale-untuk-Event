<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Login Panel Admin — Sistem POS Event Multi-Platform">
    <title>Login Admin — POS Event</title>

    {{-- Tailwind CSS via CDN (Neo-Brutalist Theme) --}}
    <script src="https://cdn.tailwindcss.com"></script>

    {{-- Google Fonts: Space Grotesk untuk kesan tebal dan modern --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <script>
        /**
         * Konfigurasi Tailwind untuk mengaktifkan warna dan kelas kustom
         * yang digunakan dalam tema Neo-Brutalist.
         */
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'grotesk': ['"Space Grotesk"', 'sans-serif'],
                    },
                    boxShadow: {
                        /* Bayangan tegas tanpa blur — ciri khas Neo-Brutalism */
                        'brutal':    '4px 4px 0px 0px #000000',
                        'brutal-lg': '6px 6px 0px 0px #000000',
                        'brutal-xl': '8px 8px 0px 0px #000000',
                    },
                    colors: {
                        'brutal-purple': '#c77dff',
                        'brutal-black':  '#0A0A0A',
                    }
                }
            }
        }
    </script>

    <style>
        body {
            font-family: 'Space Grotesk', sans-serif;
            background-color: #F5F0E8; /* Krem hangat — latar Neo-Brutalist */
            /* Pola grid tipis sebagai background texture */
            background-image:
                linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px);
            background-size: 32px 32px;
        }

        /* Efek geser tombol saat diklik — Neo-Brutalist Interaction */
        .btn-brutal {
            transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .btn-brutal:active {
            transform: translate(4px, 4px);
            box-shadow: 0 0 0 0 #000000 !important;
        }

        /* Animasi muncul untuk card login */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slideUp 0.4s ease-out forwards;
        }

        /* Efek fokus input bergaya Neo-Brutalist */
        .input-brutal:focus {
            outline: none;
            box-shadow: 4px 4px 0px 0px #000000;
            transform: translate(-2px, -2px);
            transition: all 0.15s ease;
        }
        .input-brutal {
            transition: all 0.15s ease;
        }
    </style>
</head>

<body class="min-h-screen flex items-center justify-center p-4">

    {{-- ===================================================================== --}}
    {{-- CONTAINER UTAMA                                                        --}}
    {{-- ===================================================================== --}}
    <div class="w-full max-w-md animate-slide-up">

        {{-- === HEADER BRANDING === --}}
        <div class="mb-8 text-center">
            {{-- Logo / Ikon Sistem --}}
            <div class="inline-flex items-center justify-center w-16 h-16 bg-brutal-purple border-4 border-brutal-black shadow-brutal mb-4 rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>
            <h1 class="text-3xl font-extrabold text-brutal-black tracking-tight uppercase">
                POS <span class="bg-brutal-purple px-1">Event</span>
            </h1>
        </div>

        {{-- === CARD LOGIN UTAMA — Border hitam tebal Neo-Brutalist === --}}
        <div class="bg-white border-4 border-brutal-black shadow-brutal-xl p-8">

            {{-- Judul Card --}}
            <div class="border-b-4 border-brutal-black pb-4 mb-6">
                <h2 class="text-xl text-center font-extrabold text-brutal-black uppercase tracking-tight">
                    Masuk ke Panel Admin
                </h2>
            </div>

            {{-- === FORM LOGIN === --}}
            <form
                id="form-login-admin"
                method="POST"
                action="{{ route('admin.login.submit') }}"
                novalidate
            >
                @csrf

                {{-- INPUT: Username --}}
                <div class="mb-5">
                    <label
                        for="input-username"
                        class="block text-sm font-extrabold text-brutal-black uppercase tracking-wider mb-2"
                    >
                        Username
                    </label>
                    <input
                        id="input-username"
                        type="text"
                        name="username"
                        value="{{ old('username') }}"
                        placeholder="Masukkan username admin"
                        autocomplete="username"
                        required
                        class="input-brutal w-full px-4 py-3 border-4 border-brutal-black bg-white text-brutal-black font-semibold placeholder-gray-400 text-sm @error('username') border-red-500 @enderror"
                    >
                    @error('username')
                        <p class="mt-1 text-xs font-bold text-red-600 uppercase">{{ $message }}</p>
                    @enderror
                </div>

                {{-- INPUT: Password --}}
                <div class="mb-7">
                    <label
                        for="input-password"
                        class="block text-sm font-extrabold text-brutal-black uppercase tracking-wider mb-2"
                    >
                        Password
                    </label>
                    <div class="relative">
                        <input
                            id="input-password"
                            type="password"
                            name="password"
                            placeholder="Masukkan password"
                            autocomplete="current-password"
                            required
                            class="input-brutal w-full px-4 py-3 border-4 border-brutal-black bg-white text-brutal-black font-semibold placeholder-gray-400 text-sm pr-12"
                        >
                        {{-- Tombol Toggle Visibilitas Password --}}
                        <button
                            id="btn-toggle-password"
                            type="button"
                            onclick="togglePassword()"
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brutal-black transition-colors"
                            aria-label="Toggle visibilitas password"
                            title="Tampilkan/Sembunyikan password"
                        >
                            <svg id="icon-eye" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            <svg id="icon-eye-off" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                            </svg>
                        </button>
                    </div>
                    @error('password')
                        <p class="mt-1 text-xs font-bold text-red-600 uppercase">{{ $message }}</p>
                    @enderror

                    {{-- Link Lupa Password --}}
                    <div class="mt-3 text-right">
                        <a href="#" class="text-xs font-bold text-brutal-black hover:text-brutal-purple uppercase tracking-wider underline decoration-2 decoration-brutal-black transition-colors hover:decoration-brutal-purple">
                            Lupa Password?
                        </a>
                    </div>
                </div>

                {{-- TOMBOL SUBMIT — Neo-Brutalist Style --}}
                <button
                    id="btn-submit-login"
                    type="submit"
                    class="btn-brutal w-full py-4 bg-brutal-black text-brutal-purple font-extrabold text-sm uppercase tracking-widest border-4 border-brutal-black shadow-brutal hover:bg-brutal-purple hover:text-brutal-black transition-colors"
                >
                    Masuk
                </button>

            </form>
        </div>

        {{-- === FOOTER === --}}
        <div class="mt-6 text-center">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                ©2026 POS Event System
            </p>
        </div>
    </div>

    {{-- ===================================================================== --}}
    {{-- JAVASCRIPT — Fungsionalitas UI                                         --}}
    {{-- ===================================================================== --}}
    <script>
        /**
         * Toggle visibilitas input password.
         * Mengubah tipe input antara 'password' dan 'text'.
         */
        function togglePassword() {
            const input   = document.getElementById('input-password');
            const iconOn  = document.getElementById('icon-eye');
            const iconOff = document.getElementById('icon-eye-off');

            if (input.type === 'password') {
                input.type  = 'text';
                iconOn.classList.add('hidden');
                iconOff.classList.remove('hidden');
            } else {
                input.type  = 'password';
                iconOn.classList.remove('hidden');
                iconOff.classList.add('hidden');
            }
        }
    </script>

</body>
</html>
