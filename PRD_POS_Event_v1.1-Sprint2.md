# Product Requirement Document (PRD)
## Sistem POS Event — v2.0-Sprint5 (Fitur Sorting Tabel Global, Perbaikan Grafik Dashboard Turbo, Security Audit & Tunneling Ngrok Kasir)

**Status dokumen:** baseline aktif dan pembaruan hasil penyelesaian Fitur Sorting Tabel Global, Fix Grafik Dashboard Turbo, Security Audit (SQLi/XSS/CSRF), serta Konfigurasi Tunneling Ngrok POS Kasir  
**Tanggal audit:** 7 Agustus 2026  
**Platform:** Laravel 11 API + Web Admin; React Native 0.86 Android APK; MySQL; SQLite  
**Catatan versi:** `PRD_POS_Event_v1.0.md` dipertahankan sebagai arsip. Dokumen ini adalah baseline aktif yang diperbarui sesuai penyempurnaan fitur sorting tabel, perbaikan visual & grafik, audit keamanan cyber, serta integrasi Ngrok untuk POS Kasir.

## 1. Changelog

| Versi | Tanggal | Ringkasan |
|---|---:|---|
| v2.0-Sprint5 | 7 Agt 2026 | **Fitur Sorting Tabel Global, Fix Grafik Dashboard Turbo, Security Audit & Tunneling Ngrok Kasir**: (1) Implementasi fitur *sorting* kolom tabel global pada `layouts/admin.blade.php` dengan kustomisasi arah default *descending* (terbesar/termahal di klik pertama), penanganan kontras latar *hover*, dan auto-exclude kolom 'Aksi'/'Status'. (2) Fix inisialisasi `Chart.js` pada `dashboard.blade.php` agar kompatibel penuh dengan navigasi instan Hotwire Turbo (`turbo:render`). (3) Audit keamanan backend komprehensif terhadap SQL Injection, XSS, CSRF, dan Mass Assignment. (4) Pembaruan `.env`, `apiClient.ts`, dan `SetupTerminalScreen.tsx` pada aplikasi `PosEventKasir` untuk integrasi tunneling Ngrok. |
| v1.9-Sprint5 | 3 Agt 2026 | **Target-Bound OTP Void, Kustomisasi Struk Cabang, & Blueprint Minimalist Dark Mode UI**: (1) Refaktor total OTP Void agar terikat spesifik (*Target-Bound*) pada 1 Kasir, Cabang, dan Sales Mode. Tambah kolom `id_kasir`, `id_cabang`, `id_sales` pada `otp_codes`, endpoint AJAX `/admin/otp/kasir-by-cabang`, validasi ketat `CheckoutController@voidTransaction`, serta 3 kolom baru di tabel Riwayat OTP. (2) Kustomisasi Struk Belanja pada Master Cabang: Tambah kolom `header_struk` & `footer_struk` (TEXT, nullable) pada tabel `cabang`, form Tambah/Edit Cabang, indikator di tabel cabang, dan payload API Download Katalog (`/api/v1/katalog/download`). (3) Dokumen Spesifikasi UI/UX disempurnakan dengan **Bagian 5 (Minimalist Dark Mode)** mencakup Design Tokens, mapping 1:1 Neo-Brutalism → Minimalist, dan daftar 19 file Blade view target migrasi. |
| v1.8-Sprint5 | 2 Agt 2026 | **Refaktor Grouping Tabel & UI Polish Web Admin**: (1) Grouping data tabel Harga Produk dan Promosi berdasarkan kombinasi Menu/Group ID agar tampilan cabang & mode penjualan digabung dalam satu baris (tidak memenuhi layar saat input multiple). (2) Standardisasi teks UI: Ubah "Sales Mode" → "Mode Penjualan", hapus kata "Master" di seluruh judul halaman, hapus blok "Info Sistem" di Dasbor (grafik *full-width*), hapus simbol `+` pada tombol, serta ubah teks tombol ke Proper Case (Title Case). Penataan tombol "Generate OTP" di posisi tengah. (3) Auto-Pruning OTP: Implementasi `MassPrunable` pada `OtpCode` & scheduler `model:prune` jam 01:00 untuk hapus OTP > 3 hari. (4) Konsolidasi `.env` dengan struktur `.env.production.example`. |
| v1.7-Sprint5 | 31 Jul 2026 | Refaktor Logika & UI Form Input Promosi Dinamis: Menjadikan "Cakupan Promosi" sebagai input pertama mandatori; menyembunyikan field di bawahnya sebelum dipilih. Kondisi dinamis field: Per Transaksi (Nilai/Tipe aktif, Menu sembunyi), Per Item (Nilai/Tipe aktif, Multi-select Menu aktif), Free Item (Nilai/Tipe sembunyi/null, Multi-select Menu aktif). Penambahan kolom `waktu_mulai`, `waktu_selesai`, `hari_aktif` (JSON), serta pembaharuan `syarat_menu` (JSON) menggantikan `id_menu_free`. Multiselect Sales Mode & Cabang pada Form Promosi & Harga Produk. Perbaikan modal pop-up AlpineJS agar tertutup otomatis pasca-simpan berhasil. |
| v1.6-Sprint5 | 30 Jul 2026 | Penyempurnaan UI/UX Web Admin & Validasi: Penataan seluruh aksi edit ke dalam Pop-Up Modals yang seragam dan Draggable (dapat digeser bebas di layar). Implementasi Multiselect Cabang (grid checkbox + toggle "Pilih Semua Cabang") pada Create & Edit Promosi serta Harga Produk. Live Search instan pada seluruh kolom pencarian via Hotwire Turbo. Validasi keunikan data (Kategori, Sub-Kategori, Menu, Mode Penjualan) dengan filter `deleted_at` & pengabaian ID saat edit, serta internasionalisasi pesan validasi 100% Bahasa Indonesia (`lang/id/validation.php`). |
| v1.5-Sprint5 | 30 Jul 2026 | Penyelesaian Sprint 5 (Mobile APK & Final Integration): Integrasi penuh Printer ESC/POS Bluetooth di `ReceiptScreen.tsx` & `bluetoothService.ts` (MOB-07), OTP Void Nota Success, Silent Shift Closing & Switch Operator di `PosMainScreen.tsx` & `ClosingShiftScreen.tsx` (MOB-08), serta Final Optimization, Error Boundaries, SQLite Local Buffer & Signed Release APK config (MOB-09). Seluruh Mobile APK (9/9), Backend API (16/16), Web Admin (8/8), dan Database/Operasional (5/5) mencapai 100% DONE. Total progress proyek: 38/38 fitur aktif DONE (100% Production Ready). |
| v1.4-Sprint4 | 29 Jul 2026 | Penyelesaian Sprint 4 Developer A (Backend API & Web Admin): Implementasi Riwayat Transaksi & Detail Struk Modal (POS-A-13), Laporan Keuangan 8 Filter + Ekspor PDF/Excel (POS-A-14), Audit Log Viewer, Shift Log Viewer & Admin Management dengan Email Mandatori & Kasir Password Null (POS-A-15), serta Health Check Endpoint, Backup Command & Scheduler Cron Hardening (POS-A-16). Seluruh Web Admin (8/8) dan Backend API (16/16) mencapai 100% DONE. Progress total proyek naik menjadi 33/39 DONE (~92%). |
| v1.3-Sprint3 | 29 Jul 2026 | Penyelesaian Sprint 3 Developer A (Backend API & Web Admin): Implementasi Master Admin & Kasir (POS-A-09, kasir tanpa password & tombol aksi 1 baris), Master Katalog & Harga Cabang (POS-A-10, perbaikan `harga_produk` & `id_template`), Master Promosi Event (POS-A-11, penambahan kolom Cabang & validasi tanggal `min`), serta Dashboard Admin (POS-A-12, KPI Cards & perbaikan infinite resize loop Chart.js). Fitur DONE bertambah 3 (WEB-02, WEB-03, WEB-04), total DONE menjadi 27/39 (~80% proyek). |
| v1.2-Sprint2 | 28 Jul 2026 | Audit kode aktual backend & mobile APK: Pembaruan status 39 fitur. API Backend mencapai 14/18 DONE (Auto-close 03.00, OTP Void, Closing Silent, Sanctum Auth, Direct Confirm `nomor_referensi`), Mobile APK 5/9 DONE (POS Split Screen, Payment Cash/Manual Non-Cash, SyncManager, SQLite buffer), Database 4/4 DONE. Total progress fitur DONE naik dari 11 menjadi 24 fitur (~72% total proyek). |
| v1.1-Sprint2 | 27 Jul 2026 | Audit kode awal, sinkronisasi aturan database dan void/shift, penghapusan payment gateway/webhook dari arsitektur target, tracker 39 fitur, rencana Sprint 2–4, QA, dan deployment. |
| v1.0-Sprint1 | Arsip | Baseline requirement dan audit awal. |

## 2. Keputusan arsitektur dan aturan bisnis

### 2.1 Database

Model bisnis memakai 16 tabel fisik inti: `role_user`, `user`, `password_reset_tokens`, `cabang`, `kategori`, `sub_kategori`, `menu`, `sales_mode`, `menu_template`, `promosi`, `metode_pembayaran`, `transaksi`, `transaksi_detail`, `shift_session`, `shift_operator_logs`, dan `audit_logs`. Primary key dan foreign key bisnis menggunakan UUID v4 `CHAR(36)`; total relasi FK yang ditargetkan adalah 27.

Tabel pendukung autentikasi & keamanan sistem mencakup `otp_codes` (verifikasi void OTP Admin), `personal_access_tokens` (Sanctum mobile token), dan `sessions` (Web Admin session). Migrasi telah direkonsiliasi secara bersih tanpa artifak payment gateway.

### 2.2 Pembayaran

Sistem tidak memanggil payment gateway dan tidak menerima webhook callback eksternal. Untuk pembayaran non-tunai manual, kasir memilih metode pembayaran lalu mengisi RRN EDC atau bukti transfer pada `transaksi.nomor_referensi`. Nilai ini disimpan bersama transaksi ketika konfirmasi menjadi `Success`.

### 2.3 Draft, void, dan OTP

- `Draft` adalah keranjang aktif. Kasir boleh menghapus atau mengurangi item, atau mengosongkan keranjang, tanpa OTP Admin.
- `Success` adalah nota lunas. Void sebagian item maupun seluruh nota wajib mengirim dan memverifikasi OTP Admin (6 digit, TTL 1 menit via `otp_codes`).
- Void yang berhasil wajib berada dalam transaksi database terkunci (`lockForUpdate`) dan menulis actor, alasan, snapshot sebelum/sesudah, serta waktu ke `audit_logs`.
- Endpoint dan dokumentasi lama yang memakai istilah `cancel` untuk Draft telah diarahkan ke operasi keranjang; istilah `void` dipakai untuk nota lunas.

### 2.4 Shift

Shift utama dimiliki `id_user`; operator yang sedang memegang terminal disimpan pada `id_user_aktif`. Switch operator tidak menutup shift utama. Transisi yang valid adalah `OPEN <-> ON_BREAK`, kemudian `CLOSED`.

Saat closing, server menghitung selisih secara silent, mencabut token Sanctum kasir (`tokens()->delete()`), dan memberi response yang hanya menyatakan closing berhasil. Mobile langsung kembali ke login tanpa menampilkan nominal selisih. Artisan command `app:auto-close-stale-shifts` dijadwalkan setiap hari pukul 03:00 untuk menutup shift `OPEN/ON_BREAK` terbengkalai dan menulis log `auto_closed`.

### 2.5 Proteksi dan pelaporan

Selector Cabang dan Sales Mode ter-disabled setelah cart Draft memiliki item (`cart.length > 0`). Dashboard menampilkan “Total Pembayaran / Rekap Volume Penjualan”. Laporan keuangan mendukung filter independen: Produk, Kategori, Sub-Kategori, Metode Bayar, Cabang, Kasir, Sales Mode, dan Promosi, serta export PDF/Excel.

## 3. Arsitektur target

```text
React Native APK (PosEventKasir)
  ├─ SQLite: menu_replica, transaksi_draft, sync_queue
  ├─ POS Split Screen, Payment Cash/Manual Non-Cash, Printer Bluetooth, Shift
  └─ SyncManager (offlineQueueManager) → POST /api/v1/checkout/sync
                                                 │
                                                 ▼
Laravel 11 API + Web Admin ───────────── MySQL (source of truth)
  ├─ Sanctum API untuk Kasir
  ├─ Session Web + admin.only untuk Admin
  ├─ transaksi.nomor_referensi untuk RRN/bukti transfer
  ├─ audit_logs, otp_codes, dan shift_operator_logs
  └─ Scheduler 03:00 auto-close (AutoCloseStaleShifts)
```

Tidak ada komponen Payment Gateway atau Webhook Callback dalam arsitektur target.

### 3.1 Penjelasan singkat untuk pembaca umum

Bayangkan sistem ini sebagai tiga bagian yang bekerja bersama:

1. **Aplikasi HP Kasir** dipakai untuk memilih makanan, memasukkan pesanan, menerima pembayaran, mencetak struk, dan menyimpan transaksi sementara jika internet mati.
2. **Server pusat** menyimpan data resmi semua transaksi, menghitung pajak dan promo, menjaga aturan shift, memeriksa OTP, dan menerima data dari HP ketika internet kembali.
3. **Web Admin** dipakai pemilik atau supervisor untuk mengelola menu dan kasir, melihat penjualan, mencari transaksi, melihat riwayat pembatalan, serta mengunduh laporan.

Alur jualan sederhananya: kasir memilih cabang dan jalur penjualan → memilih menu → keranjang terkunci agar lokasi/harga tidak berubah → kasir menerima uang tunai atau mengetik nomor bukti pembayaran → struk dicetak → data dikirim ke server. Jika internet mati, langkah terakhir ditunda dan dilakukan otomatis ketika koneksi kembali.

**Istilah yang dipakai dalam tiket:** API berarti “pintu komunikasi” antara HP dan server; database berarti “lemari penyimpanan data”; audit log berarti “buku catatan semua tindakan penting”; scheduler/cron berarti “alarm otomatis server”; dan APK berarti “file installer aplikasi Android”.

## 4. Audit status aktual per 30 Juli 2026

Status memakai bukti file kode: **DONE** berarti alur inti terlihat dan controller/screen/service tersedia serta terintegrasi; **IN PROGRESS** berarti sebagian alur tersedia tetapi belum memenuhi acceptance criteria lengkap/E2E; **BACKLOG** berarti belum ada implementasi target; **DEPRECATE** berarti dihapus dari arsitektur target.

### 4.0 Perbandingan baseline v1.1 → v1.5-Sprint5

| Area | Baseline v1.1-Sprint2 (27 Jul) | Status v1.5-Sprint5 (30 Jul) |
|---|---|---|
| Payment | Payment gateway dihapus | **DONE** (`nomor_referensi` tersimpan di DB & dimuat via `CheckoutController` + `PaymentNonCashScreen`). |
| Void & OTP | Belum ada OTP & memisahkan Draft vs Success | **DONE** (`OtpController`, `CheckoutController@voidTransaction`, OTP 6 digit TTL 1 min + `audit_logs`). |
| Shift & Auto-Close | Auto-close 03:00 BACKLOG | **DONE** (`AutoCloseStaleShifts.php` command + scheduler 03:00 di `routes/console.php` & silent close). |
| Web Admin | Master layout BACKLOG, login DONE | **DONE 100%** (Seluruh 8 fitur Web Admin selesai: Neo-Brutalist Layout, Dashboard KPI + Chart.js, Master Data CRUD, Riwayat Transaksi & Detail Struk Modal, Laporan Keuangan 8 Filter + Ekspor PDF/Excel, Audit & Shift Log Viewer, serta Admin Management). |
| Mobile APK | Sebagian besar BACKLOG | **DONE 100%** (Seluruh 9 fitur Mobile APK selesai: Login & Shift Opening/Closing, POS Split Screen Katalog SQLite, Pembayaran Cash/Manual Non-Cash, Draft Edit tanpa OTP & UI Locking, SQLite Database local-first, SyncManager idempoten, ESC/POS Bluetooth Thermal Printing, OTP Void Nota Success, serta Signed Release APK build configuration). |
| Database & Deployment | In progress migration review | **DONE 100%** (19 file migrasi clean, 16 tabel bisnis + 3 support tables, UUID v4 CHAR(36), HealthCheck `/api/v1/health`, DatabaseBackupCommand, Cron Scheduler `routes/console.php`, `.env.production.example`). |

### 4.1 Backend API

| ID | Fitur | Status | Bukti / file kode |
|---|---|---|---|
| API-01 | Login/logout Kasir Sanctum | **DONE** | `ApiAuthController.php` (`loginKasir`, `logoutKasir`), `routes/api.php` line 48-52, 90-91. |
| API-02 | CRUD Cabang | **DONE** | `CabangController.php`, request, resource, `routes/api.php`. |
| API-03 | CRUD User/Kasir | **DONE** | `UserController.php`, request, resource, `routes/api.php`. |
| API-04 | CRUD Kategori/Sub-Kategori | **DONE** | `KategoriController.php`, `SubKategoriController.php`, `routes/api.php`. |
| API-05 | CRUD Menu | **DONE** | `MenuController.php`, `routes/api.php`. |
| API-06 | Harga regional/menu template | **DONE** | `MenuTemplateController.php`, `routes/api.php`. |
| API-07 | Download katalog terpadu | **DONE** | `KatalogController.php@download`, `routes/api.php`. |
| API-08 | Open/break/resume/switch shift | **DONE** | `ShiftSessionController.php` (`open`, `break`, `resume`, `switchOperator`). |
| API-09 | Closing shift silent + revoke token | **DONE** | `ShiftSessionController.php@close`, revoke Sanctum token, silent response. |
| API-10 | Cron auto-close 03.00 | **DONE** | `AutoCloseStaleShifts.php` command + `routes/console.php` `$schedule->command(...)->dailyAt('03:00')`. Log `auto_closed`. |
| API-11 | Draft checkout dan promo/pajak | **DONE** | `CheckoutController.php@storeDraft`, DB transaction atomic. |
| API-12 | Confirm cash/manual non-cash | **DONE** | `CheckoutController.php@confirmTransaction`, simpan `nomor_referensi`. |
| API-13 | Void Draft vs Success + OTP | **DONE** | `CheckoutController.php@voidTransaction`, `OtpController.php@requestVoid`, audit log snapshot. |
| API-14 | Offline sync idempoten | **DONE** | `SyncController.php@syncBatch`, HTTP 207 Multi-Status, deduplikasi UUID. |
| API-15 | Riwayat/detail transaksi | **DONE** | `TransaksiController.php@index/show`, filter & pagination. |
| API-16 | Dashboard/reporting/export | **DONE** | `LaporanController.php`, `ExportService.php`, `LaporanExport.php` (8 kombinasi filter & ekspor PDF/Excel). |
| API-17 | Password reset/admin registration | **DONE** | `AdminManagementController.php` (`resetPassword`, `store`, `update`), `password_reset_tokens`, email mandatori & kasir password null. |
| API-18 | Payment gateway/webhook | **DEPRECATED** | Dihapus total dari arsitektur target & route API. |

### 4.2 Web Admin

| ID | Fitur | Status | Bukti / file kode |
|---|---|---|---|
| WEB-01 | Login Admin Neo-Brutalist | **DONE** | `WebAuthController.php`, `resources/views/auth/login.blade.php`. |
| WEB-02 | Layout master Blade Neo-Brutalist | **DONE** | `layouts/admin.blade.php`, Sidebar, styling Neo-Brutalist, Floating Toast Notification (5 detik auto-hide), Konfirmasi Hapus Modal, Instant Live Search (Hotwire Turbo), dan Global Draggable Modal Handler (Pop-Up Modal dapat digeser posisi kotaknya di layar). |
| WEB-03 | Dashboard KPI + Chart.js | **DONE** | `DashboardController.php`, `resources/views/admin/dashboard.blade.php` (4 KPI cards, Chart.js 7 hari dengan relatif wrapper fix). |
| WEB-04 | CRUD master data | **DONE** | Blade CRUD (9 View Master): `PegawaiController` (Kasir), `AdminManagementController` (Admin), `KategoriController`, `SubKategoriController`, `MenuController`, `HargaCabangController`, `PromosiController`, `CabangController`, `SalesModeController`. Pop-Up Edit Modals 100% Draggable, Multiselect Cabang & Sales Mode pada Promosi & Harga Produk (Create/Edit), Form Promosi Dinamis (Cakupan step-by-step, Jam/Hari Aktif, Syarat Menu Multi-select Per Item & Free Item), validasi keunikan data (`deleted_at`), & kamus Bahasa Indonesia (`lang/id/validation.php`). |
| WEB-05 | Riwayat transaksi + detail struk | **DONE** | `TransaksiController.php`, `resources/views/admin/log/transaksi.blade.php` (8 filter query & modal detail struk AJAX). |
| WEB-06 | Laporan 8 filter + export | **DONE** | `LaporanController.php`, `resources/views/admin/laporan/index.blade.php`, `pdf.blade.php`, `ExportService.php` (8 kombinasi filter & ekspor PDF DomPDF / Excel Maatwebsite). |
| WEB-07 | Audit log viewer | **DONE** | `AuditLogController.php`, `ShiftLogController.php`, `resources/views/admin/log/audit.blade.php`, `resources/views/admin/log/shift.blade.php` (JSON diff viewer, shift timeline, auto-close warning). |
| WEB-08 | Lupa password + registrasi Admin | **DONE** | `AdminManagementController.php`, `resources/views/admin/pegawai/admin.blade.php` (Form registrasi, pop-up edit modal draggable, reset password via token, email mandatori & kasir password null). |

### 4.3 Mobile APK (PosEventKasir)

| ID | Fitur | Status | Bukti / file kode |
|---|---|---|---|
| MOB-01 | Login dan opening shift | **DONE** | `LoginScreen.tsx`, `OpeningShiftScreen.tsx`, `apiClient.ts` token storage. |
| MOB-02 | POS split screen katalog SQLite | **DONE** | `PosMainScreen.tsx` (catalog grid, tabs filter, search, empty/loading states). |
| MOB-03 | Pembayaran cash/manual non-cash | **DONE** | `PaymentCashScreen.tsx`, `PaymentNonCashScreen.tsx`, `ReceiptScreen.tsx` (input `nomor_referensi`, kembalian). |
| MOB-04 | Draft cart edit tanpa OTP + UI lock | **DONE** | `PosMainScreen.tsx`, `cartService.ts` (selector Cabang/Sales Mode locked bila cart > 0). |
| MOB-05 | SQLite katalog/draft | **DONE** | `src/database/sqlite.ts` (`menu_replica`, `transaksi_draft`, `sync_queue`). |
| MOB-06 | SyncManager + banner status | **DONE** | `src/database/offlineQueueManager.ts`, `checkoutService.ts` (offline queue retry). |
| MOB-07 | Printer ESC/POS Bluetooth | **DONE** | `ReceiptScreen.tsx` & `bluetoothService.ts` (ESC/POS thermal command builder, auto-reconnect, ESC/POS printing socket & modal picker). |
| MOB-08 | OTP void Success, close, switch operator | **DONE** | `PosMainScreen.tsx`, `OpeningShiftScreen.tsx`, `ClosingShiftScreen.tsx` (OTP Admin modal confirmation, silent close shift & operator session handling). |
| MOB-09 | E2E, memory optimization, release APK | **DONE** | Signed release APK configuration, `useAndroidBackIntercept.ts`, SQLite local queue optimization & E2E handling. |

### 4.4 Database dan operasional

| ID | Fitur | Status | Bukti / file kode |
|---|---|---|---|
| DB-01 | UUID v4 CHAR(36) dan model relations | **DONE** | Trait `HasUuid` & definisi migration `char('...', 36)` pada semua model & FK. |
| DB-02 | 16 tabel fisik (+ 3 support tables) & 27 FK | **DONE** | 19 file migrasi di `database/migrations` tervalidasi bersih. |
| DB-03 | `nomor_referensi` di `transaksi` | **DONE** | Kolom `nomor_referensi` di migrasi `transaksi` & controller `confirmTransaction`. |
| DB-04 | Audit log void/shift/auto-close | **DONE** | `AuditLogService.php`, model `AuditLog`, penulisan log saat void & auto-close. |
| DB-05 | Deployment hardening & observability | **DONE** | `HealthCheckController.php` (`/api/v1/health`), `DatabaseBackupCommand.php` (`app:database-backup`), `.env.production.example`, `routes/console.php` cron schedule. |

**Ringkasan Tracker Fitur:**
- **Total Fitur:** 39
- **DONE:** 38 fitur (Backend API: 16, Web Admin: 8, Mobile APK: 9, Database & Operasional: 5)
- **IN PROGRESS:** 0 fitur
- **BACKLOG:** 0 fitur
- **DEPRECATED:** 1 fitur (API-18)

**Estimasi Progress Proyek Total:** 100% DONE (Backend API 100%, Web Admin 100%, Mobile APK 100%, Database & Deployment Hardening 100% — Full Production Ready).

## 5. Risk Assessment Matrix

| ID | Risiko | Dampak | Mitigasi v1.5-Sprint5 | Status |
|---|---|---|---|---|
| R-01 | Internet event putus | Transaksi hilang/duplikat | SQLite local-first (`sqlite.ts`), UUID v4, `offlineQueueManager`, endpoint sync batch idempoten (`SyncController`). | **Tergantikan & Teruji** |
| R-02 | Harga/pajak katalog kedaluwarsa | Total salah | Download katalog saat opening (`KatalogController`), simpan ke `menu_replica`, blokir transaksi bila katalog invalid. | **Mitigasi Terintegrasi** |
| R-03 | Fraud void | Revenue dan audit tidak valid | Draft hanya edit cart tanpa OTP; Success wajib OTP Admin 6 digit (`OtpController`), alasan, lock, snapshot, dan `audit_logs`. | **Mitigasi Terintegrasi** |
| R-04 | Akses admin tidak sah | Data master/report bocor | Sanctum token auth, Web Session Guard, middleware `admin.only`, least privilege, audit akses. | **Mitigasi Terintegrasi** |
| R-05 | Selisih kas atau shift terbengkalai | Laci dan laporan tidak rekonsiliasi | Silent calculation di server (`ShiftSessionController@close`), revoke token Sanctum, cron 03.00 (`AutoCloseStaleShifts`) dengan log `auto_closed`. | **Mitigasi Terintegrasi** |
| R-06 | Payment gateway tersisa di implementasi | Alur dan compliance salah | Menghapus controller/service/route Midtrans; gunakan `nomor_referensi` manual EDC/transfer. | **Terselesaikan** |

## 6. Definition of Done rilis

Rilis telah memenuhi seluruh standar kriteria production-ready:
1. `[PASSED]` Migration final 16 tabel bisnis + 3 support tables dengan 27 FK tervalidasi `php artisan migrate:fresh --seed`.
2. `[PASSED]` Acceptance test QA pada dokumen deployment lulus 100%.
3. `[PASSED]` OTP void dan artisan scheduler auto-close 03:00 teruji.
4. `[PASSED]` Web Admin (Sprint 3–4 UI & reporting) dan APK release signed terhubung ke URL produksi.
5. `[PASSED]` Queue, scheduler (`crontab`), backup, dan SSL HTTPS active.
6. `[PASSED]` Tidak ada route payment gateway/webhook.

Rincian tiket, pembagian Hari 1–30, test case, dan deployment berada pada:

- [Sprint Backlog dan Tiket Jira](Dokumen/Sprint_Backlog_Jira_v1.1-Sprint2.md)
- [QA dan Panduan Deployment](Dokumen/QA_Deployment_Production_v1.1-Sprint2.md)
