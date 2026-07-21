# 📋 Rencana Kerja & Tiket Jira — DEVELOPER B (Mobile Kasir APK)
## POS Event System | Sprint 2–4 
> **Acuan Utama**: PRD v1.0-Sprint1 

---

## 🗓️ Sprint 2 — POS Main Screen & Payment (Hari 1–10)

> **Goal Sprint**: Membangun core experience kasir (Katalog, Keranjang, dan Layar Pembayaran) menggunakan arsitektur Offline-First.

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 1** | POS Main Screen Layout | Buat `PosMainScreen.tsx`. Header shift info, split screen 2/3 (katalog) dan 1/3 (cart). Setup state management untuk `cart[]`. |
| **Hari 2** | Grid Katalog & Filter Tabs | Fetch list menu dari SQLite lokal `menu_replica`. Tampilkan grid 2 kolom dengan filter tab horizontal. Handle add to cart. |
| **Hari 3** | Panel Keranjang (Cart) | Render item keranjang. Fitur `+/-` quantity. Realtime kalkulasi total belanja dan pajak PPN (11%). |
| **Hari 4** | Search & Empty State | Kolom pencarian realtime. Tampilan kosong saat produk tak ditemukan. |
| **Hari 5** | Layar Bayar Tunai | `PaymentCashScreen.tsx`. Keypad custom. Fitur Quick Nominal Buttons (10k, 20k, 50k, Uang Pas). Kalkulasi kembalian realtime. |
| **Hari 6** | Layar Bayar Non-Tunai | `PaymentNonCashScreen.tsx`. Dropdown metode (QRIS/EDC). Kolom input nomor Referensi/Approval Code. |
| **Hari 7** | API Integrasi Checkout | Call `POST /checkout/draft` dan `POST /checkout/{id}/confirm` jika status online. |
| **Hari 8** | Offline Queue Manager | Jika offline, simpan checkout flow sebagai status `PendingSync` di tabel `transaksi_draft` SQLite (ID pakai UUID v4). |
| **Hari 9** | Navigation Polish | Navigasi React Navigation: POS_MAIN -> PAYMENT -> RECEIPT. Handle Android Back button intercept agar tidak keluar paksa. |
| **Hari 10** | Testing Sprint 2 | Edge cases testing: checkout tanpa koneksi internet, checkout dengan kembalian mines. Bug fixes. |

### Tiket Jira Sprint 2

* **POS-35 (8 SP) | Grid Katalog Menu**: Implementasi layar utama (katalog menu, filter tab, search) dengan performa FlatList yang baik. Baca dari SQLite.
* **POS-36 (5 SP) | Keranjang Belanja**: Implementasi kalkulasi subtotal cart, perhitungan pajak, dan update jumlah item secara reaktif.
* **POS-37 (5 SP) | Layar Bayar Tunai**: Buat form penerimaan uang fisik, keypad kustom, hitung kembalian dan validasi konfirmasi bayar.
* **POS-38 (5 SP) | Layar Bayar Non-Tunai**: Buat form pencatatan referensi pembayaran metode QRIS / Transfer / EDC.
* **POS-39 (5 SP) | Offline Queue Manager**: Tulis logic penyimpan transaksi ke SQLite apabila network mati, set status = PendingSync.

---

## 🗓️ Sprint 3 — Hardware & Auto-Sync (Hari 11–20)

> **Goal Sprint**: Integrasi cetak struk otomatis (Bluetooth Printer) & mekanisme background sync transaksi dari SQLite lokal ke backend.

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 11** | Bluetooth Device Discovery | Modul pair & connect `PrinterSettingsScreen.tsx` menggunakan lib ESC/POS Bluetooth. |
| **Hari 12** | Format Struk ESC/POS | Buat `ReceiptPrinter.ts`. Bangun layout struk: header event, rincian items pesanan tabular, subtotal, teks footer. |
| **Hari 13** | Auto Print Integrasi | Sambungkan event sukses checkout ke perintah cetak Bluetooth. Handle jika error kertas/putus. |
| **Hari 14** | Auto-Sync Background Service | Buat listener network (NetInfo). Worker mengecek SQLite `PendingSync` saat online. |
| **Hari 15** | Integrasi API Sync Batch | Kirim array of transaksi ke `POST /api/v1/sync/transaksi`. |
| **Hari 16** | Handle Conflict Sync | Update record UUID transaksi jadi `Synced` atau `Failed` berdasarkan Multi-Status response (HTTP 207). |
| **Hari 17** | UI Sinkronisasi Status | Notifikasi/banner UI hijau (Synced) atau merah (Failed) beserta log jumlah pending di Header POS Main. |
| **Hari 18** | Settings Screen | Menu `SettingsScreen.tsx`: status koneksi printer, jumlah sync, menu "Tarik Ulang Katalog Menu". |
| **Hari 19** | Hardware Testing | Live testing print fisik pakai Thermal 58mm/80mm Bluetooth. |
| **Hari 20** | Stabilisasi & Bug Fix | Pastikan bluetooth reconnection robust apabila kasir berpindah tempat. |

### Tiket Jira Sprint 3

* **POS-40 (8 SP) | Printer Bluetooth ESC/POS**: Pair, connect, format layout cetakan text alignment (ESC/POS), dan auto-print.
* **POS-41 (8 SP) | Auto-Sync Background Worker**: Worker listener NetInfo yang push batch transaksi tertunda ke cloud dengan penanganan conflict.
* **POS-42 (3 SP) | Settings Screen**: Halaman kendali konfigurasi printer, paksa sinkronisasi manual, dan download ulang menu SQLite.

---

## 🗓️ Sprint 4 — Closing Shift, Switch & End-to-End (Hari 21–30)

> **Goal Sprint**: Penutupan sesi shift kasir, oper alih tugas operator (Switch), serta fase E2E testing dan kompilasi APK.

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 21** | Closing Shift Screen (UI) | `ClosingShiftScreen.tsx`. UI Form tutup laci. Ringkasan total transaksi dan kalkulasi penerimaan tunai dari DB lokal. |
| **Hari 22** | Closing Shift Screen (Logic) | Force push/sync all sebelum close. Tembak API `/shift/close`. Arahkan app kembali ke Halaman Login. |
| **Hari 23** | Switch Operator Screen | Form serah terima shift tanpa logout. Tembak `/shift/switch`. Bersihkan keranjang. |
| **Hari 24** | Riwayat Transaksi Lokal UI | List ringkasan UUID transaksi hari itu. Tap melihat rincian barang belanjaan (lokal SQLite read). |
| **Hari 25** | Cetak Ulang (Reprint) | Modifikasi Detail Transaksi Lokal, beri opsi Reprint Struk & Lihat Struk Digital. |
| **Hari 26** | Nav Refactoring & Polish | Handle edge-cases seperti expired API tokens, re-mount cart dari cache saat app force-closed. |
| **Hari 27** | E2E Full Day Simulation | Simulasi peran: Buka toko, transaksi online & offline, serah terima, print, tutup toko. |
| **Hari 28** | App Performance Tuning | Optimasi render re-paint di FlatList. Hindari stutter di screen scroll jika items > 200+. |
| **Hari 29** | APK Release Build | Compile production `.apk`. Uji di berbagai device pabrikan HP berbeda (Xiaomi, Samsung, dsb). |
| **Hari 30** | Release & Handoff | Sign release, susun instruksi instalasi APK manual untuk UAT tim operasional event. |

### Tiket Jira Sprint 4

* **POS-43 (8 SP) | Screen Closing Shift**: Kalkulator input uang laci, auto-kalkulasi selisih penjualan vs fisik kasir. Force sync constraint.
* **POS-44 (5 SP) | Screen Switch Operator**: Form oper alih sesi kasir ke user pengganti tanpa menutup status Shift (Shift Session Handover).
* **POS-45 (5 SP) | Riwayat Lokal & Reprint**: Baca ulang history penjualan lokal, cetak ulang struk pesanan sebelumnya jika diminta.
* **POS-46 (5 SP) | E2E Test & APK Build**: Stabilisasi memori, compile APK Production, Uji multi-device physical.

---
### 📊 Ringkasan SP DEV-B (Sprint 2–4)
Total Titik Fokus: Arsitektur Offline, UI/UX Kasir, Bluetooth Hardware
Total Tiket: **12 Tiket** | Total SP: **70 SP**
