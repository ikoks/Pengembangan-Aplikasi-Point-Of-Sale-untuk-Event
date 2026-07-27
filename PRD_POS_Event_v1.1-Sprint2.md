# Product Requirement Document (PRD)
## Sistem POS Event — v1.1-Sprint2

**Status dokumen:** baseline implementasi dan rencana sampai deployment produksi  
**Tanggal audit:** 27 Juli 2026  
**Platform:** Laravel API + Web Admin; React Native Android APK; MySQL; SQLite  
**Catatan versi:** `PRD_POS_Event_v1.0.md` dipertahankan sebagai arsip. Dokumen ini adalah baseline aktif yang menggantikan klaim payment gateway pada dokumen lama.

## 1. Changelog

| Versi | Tanggal | Ringkasan |
|---|---:|---|
| v1.1-Sprint2 | 27 Jul 2026 | Audit kode aktual, sinkronisasi aturan database dan void/shift, penghapusan payment gateway/webhook dari arsitektur target, tracker 39 fitur, rencana Sprint 2–4, QA, dan deployment. |
| v1.0-Sprint1 | Arsip | Baseline requirement dan audit awal. |

## 2. Keputusan arsitektur dan aturan bisnis

### 2.1 Database

Model bisnis memakai 16 tabel fisik berikut: `role_user`, `user`, `password_reset_tokens`, `cabang`, `kategori`, `sub_kategori`, `menu`, `sales_mode`, `menu_template`, `promosi`, `metode_pembayaran`, `transaksi`, `transaksi_detail`, `shift_session`, `shift_operator_logs`, dan `audit_logs`. Primary key dan foreign key bisnis menggunakan UUID v4 `CHAR(36)`; total relasi FK yang ditargetkan adalah 27.

`password_reset_tokens` adalah tabel pendukung autentikasi, bukan entitas transaksi. Implementasi Laravel saat ini juga memiliki tabel framework `personal_access_tokens`, `sessions`, dan `detail_pembayaran_non_tunai`; ketiganya harus diputuskan dalam migration review agar physical design final tetap konsisten dengan 16 tabel dan 27 FK yang disepakati.

### 2.2 Pembayaran

Sistem tidak memanggil payment gateway dan tidak menerima webhook callback eksternal. Untuk pembayaran non-tunai manual, kasir memilih metode pembayaran lalu mengisi RRN EDC atau bukti transfer pada `transaksi.nomor_referensi`. Nilai ini disimpan bersama transaksi ketika konfirmasi menjadi `Success`.

### 2.3 Draft, void, dan OTP

- `Draft` adalah keranjang aktif. Kasir boleh menghapus atau mengurangi item, atau mengosongkan keranjang, tanpa OTP Admin.
- `Success` adalah nota lunas. Void sebagian item maupun seluruh nota wajib mengirim dan memverifikasi OTP Admin.
- Void yang berhasil wajib berada dalam transaksi database terkunci (`lockForUpdate`) dan menulis actor, alasan, snapshot sebelum/sesudah, serta waktu ke `audit_logs`.
- Endpoint dan dokumentasi lama yang memakai istilah `cancel` untuk Draft harus diarahkan ke operasi keranjang; istilah `void` dipakai untuk nota lunas.

### 2.4 Shift

Shift utama dimiliki `id_user`; operator yang sedang memegang terminal disimpan pada `id_user_aktif`. Switch operator tidak menutup shift utama. Transisi yang valid adalah `OPEN <-> ON_BREAK`, kemudian `CLOSED`.

Saat closing, server menghitung selisih secara silent, mencabut token, dan memberi response yang hanya menyatakan closing berhasil. Mobile langsung kembali ke login tanpa menampilkan nominal selisih. Scheduler server pukul 03.00 menutup shift `OPEN` terbengkalai dan menulis log `auto_closed`.

### 2.5 Proteksi dan pelaporan

Selector Cabang dan Sales Mode harus disabled setelah cart Draft memiliki item. Dashboard menampilkan “Total Pembayaran / Rekap Volume Penjualan”. Laporan keuangan mendukung filter independen: Produk, Kategori, Sub-Kategori, Metode Bayar, Cabang, Kasir, Sales Mode, dan Promosi, serta export PDF/Excel.

## 3. Arsitektur target

```text
React Native APK
  ├─ SQLite: menu_replica, transaksi_draft, sync_queue
  ├─ POS, payment manual, printer Bluetooth, shift
  └─ SyncManager → POST /api/v1/checkout/sync
                         │
                         ▼
Laravel API + Web Admin ── MySQL (source of truth)
  ├─ Sanctum API untuk Kasir
  ├─ Session Web + admin.only untuk Admin
  ├─ transaksi.nomor_referensi untuk RRN/bukti transfer
  ├─ audit_logs dan shift_operator_logs
  └─ Scheduler 03:00 auto-close + Supervisor queue
```

Tidak ada komponen Payment Gateway atau Webhook Callback dalam arsitektur target.

### 3.1 Penjelasan singkat untuk pembaca umum

Bayangkan sistem ini sebagai tiga bagian yang bekerja bersama:

1. **Aplikasi HP Kasir** dipakai untuk memilih makanan, memasukkan pesanan, menerima pembayaran, mencetak struk, dan menyimpan transaksi sementara jika internet mati.
2. **Server pusat** menyimpan data resmi semua transaksi, menghitung pajak dan promo, menjaga aturan shift, memeriksa OTP, dan menerima data dari HP ketika internet kembali.
3. **Web Admin** dipakai pemilik atau supervisor untuk mengelola menu dan kasir, melihat penjualan, mencari transaksi, melihat riwayat pembatalan, serta mengunduh laporan.

Alur jualan sederhananya: kasir memilih cabang dan jalur penjualan → memilih menu → keranjang terkunci agar lokasi/harga tidak berubah → kasir menerima uang tunai atau mengetik nomor bukti pembayaran → struk dicetak → data dikirim ke server. Jika internet mati, langkah terakhir ditunda dan dilakukan otomatis ketika koneksi kembali.

**Istilah yang dipakai dalam tiket:** API berarti “pintu komunikasi” antara HP dan server; database berarti “lemari penyimpanan data”; audit log berarti “buku catatan semua tindakan penting”; scheduler/cron berarti “alarm otomatis server”; dan APK berarti “file installer aplikasi Android”.

## 4. Audit status aktual per 27 Juli 2026

Status memakai bukti file kode: DONE berarti alur inti terlihat dan route/controller tersedia; IN PROGRESS berarti sebagian alur tersedia tetapi belum memenuhi acceptance criteria; BACKLOG berarti belum ada implementasi target.

### 4.0 Perbandingan baseline v1.0 → v1.1-Sprint2

| Area | Baseline v1.0/artefak lama | Keputusan v1.1-Sprint2 |
|---|---|---|
| Payment | Midtrans QRIS, status polling, dan webhook masih tercantum | Dihapus dari arsitektur target; non-cash manual memakai `transaksi.nomor_referensi`. |
| Void | Cancel/void belum membedakan Draft dan Success secara tegas | Draft diedit Kasir tanpa OTP; Success wajib OTP Admin dan `audit_logs`. |
| Shift | Closing dan switch sudah ada di sebagian kode | Silent difference, revoke token/direct logout, serta auto-close 03.00 menjadi acceptance criteria wajib. |
| Web Admin | Login/dashboard placeholder; CRUD dan laporan direncanakan | Sprint 3–4 mengerjakan layout, CRUD, KPI, riwayat, 8 filter laporan, export, dan audit viewer. |
| Mobile | Login, opening shift, dan SQLite dasar | Sprint 2–4 membangun POS, manual payment, offline sync, printer, OTP, closing, switch, E2E, dan APK release. |
| Database | Dokumen lama bercampur dengan tabel/support schema implementasi | Target dikunci pada 16 tabel fisik, UUID `CHAR(36)`, dan 27 FK; migration review menjadi gate. |

### 4.1 Backend API

| ID | Fitur | Status | Bukti / gap |
|---|---|---|---|
| API-01 | Login/logout Kasir Sanctum | IN PROGRESS | Controller dan route ada, tetapi mobile memakai URL/payload yang tidak cocok dengan `/api/v1`. |
| API-02 | CRUD Cabang | DONE | Controller, request, resource, route admin write. |
| API-03 | CRUD User/Kasir | DONE | Controller, request, resource, route admin write. |
| API-04 | CRUD Kategori/Sub-Kategori | DONE | Controller, request, resource, route. |
| API-05 | CRUD Menu | DONE | Controller, request, resource, route. |
| API-06 | Harga regional/menu template | DONE | Controller, unique migration, route. |
| API-07 | Download katalog terpadu | DONE | `KatalogController@download`. |
| API-08 | Open/break/resume/switch shift | DONE | `ShiftSessionController` dan lima route shift tersedia. |
| API-09 | Closing shift silent + revoke token | IN PROGRESS | Closing dan selisih dihitung; response/controller belum memenuhi kontrak silent logout end-to-end. |
| API-10 | Cron auto-close 03.00 | BACKLOG | Belum ada command/schedule/log `auto_closed`. |
| API-11 | Draft checkout dan promo/pajak | DONE | `CheckoutController@storeDraft`, transaksi atomik. |
| API-12 | Confirm cash/manual non-cash | IN PROGRESS | Confirm ada, tetapi request/kode lama masih memakai detail payment gateway; perlu `nomor_referensi`. |
| API-13 | Void Draft vs Success + OTP | BACKLOG | Void/cancel ada tanpa OTP dan belum memisahkan aturan Draft/Success. |
| API-14 | Offline sync idempoten | DONE | `SyncController@syncBatch`, UUID deduplikasi dan partial result. |
| API-15 | Riwayat/detail transaksi | DONE | `TransaksiController@index/show` dengan filter/pagination. |
| API-16 | Dashboard/reporting/export | BACKLOG | Belum ada API agregasi/filter/export. |
| API-17 | Password reset/admin registration | BACKLOG | Konfigurasi reset token ada; flow UI/API belum ada. |
| API-18 | Payment gateway/webhook | DEPRECATE | Masih ada `PaymentController`, Midtrans service, dan route webhook; harus dihapus/nonaktifkan dari target. |

### 4.2 Web Admin

| ID | Fitur | Status | Bukti / gap |
|---|---|---|---|
| WEB-01 | Login Admin Neo-Brutalist | DONE | `WebAuthController` dan Blade login. |
| WEB-02 | Layout master Blade | BACKLOG | Baru view login/dashboard sederhana. |
| WEB-03 | Dashboard KPI + Chart.js | BACKLOG | Dashboard masih placeholder. |
| WEB-04 | CRUD master data | BACKLOG | API tersedia, Blade CRUD belum ada. |
| WEB-05 | Riwayat transaksi + detail struk | BACKLOG | Belum ada route/view/modal. |
| WEB-06 | Laporan 8 filter + export | BACKLOG | Belum ada controller/view/export. |
| WEB-07 | Audit log viewer | BACKLOG | Model/table ada, viewer belum ada. |
| WEB-08 | Lupa password + registrasi Admin | BACKLOG | Belum ada route/view/notification flow. |

### 4.3 Mobile APK

| ID | Fitur | Status | Bukti / gap |
|---|---|---|---|
| MOB-01 | Login dan opening shift | IN PROGRESS | Screen ada, URL/payload masih placeholder dan belum tokenized. |
| MOB-02 | POS split screen katalog/cart | BACKLOG | `App.tsx` masih merender “POS MAIN SCREEN”. |
| MOB-03 | Pembayaran cash/manual non-cash | BACKLOG | Belum ada screen dan input `nomor_referensi`. |
| MOB-04 | Draft cart edit tanpa OTP + UI lock | BACKLOG | Belum ada cart state. |
| MOB-05 | SQLite katalog/draft | IN PROGRESS | Dua tabel dasar dibuat, schema masih integer dan belum sync queue lengkap. |
| MOB-06 | SyncManager + banner status | BACKLOG | Belum ada worker/listener. |
| MOB-07 | Printer ESC/POS Bluetooth | BACKLOG | Dependency ada, integrasi belum ada. |
| MOB-08 | OTP void Success, close, switch operator | BACKLOG | State screen belum dibuat. |
| MOB-09 | E2E, memory optimization, release APK | BACKLOG | Belum ada build release tervalidasi. |

### 4.4 Database dan operasional

| ID | Fitur | Status | Bukti / gap |
|---|---|---|---|
| DB-01 | UUID v4 CHAR(36) dan model relations | IN PROGRESS | Trait/model tersedia; migration juga memiliki schema lama/support table yang perlu direkonsiliasi. |
| DB-02 | 16 tabel fisik dan 27 FK | IN PROGRESS | Migration bisnis tersedia, namun audit repository menemukan tambahan tabel dan definisi FK perlu dihitung ulang terhadap baseline final. |
| DB-03 | `nomor_referensi` di `transaksi` | BACKLOG | Belum menjadi kontrak confirm/manual non-cash yang konsisten. |
| DB-04 | Audit log void/shift/auto-close | IN PROGRESS | Audit service dan tabel ada; OTP dan auto-close belum lengkap. |

**Ringkasan:** dari 39 fitur tracker, 11 DONE, 8 IN PROGRESS, 19 BACKLOG, dan 1 DEPRECATE. Angka ini adalah status code aktual; bukan persentase kesiapan produksi. Gate produksi belum lulus karena OTP, manual non-cash, auto-close, Web Admin, Mobile POS, dan test integrasi belum selesai.

## 5. Risk Assessment Matrix

| ID | Risiko | Dampak | Mitigasi v1.1-Sprint2 | Status |
|---|---|---|---|---|
| R-01 | Internet event putus | Transaksi hilang/duplikat | SQLite local-first, UUID v4, queue retry, endpoint sync idempoten, test retry. | Terbuka |
| R-02 | Harga/pajak katalog kedaluwarsa | Total salah | Download katalog saat opening, version/hash katalog, blokir transaksi bila katalog invalid. | Terbuka |
| R-03 | Fraud void | Revenue dan audit tidak valid | Draft hanya edit cart tanpa OTP; Success wajib OTP Admin, alasan, lock, snapshot, dan `audit_logs`. | Mitigasi direncanakan |
| R-04 | Akses admin tidak sah | Data master/report bocor | Sanctum, Web Guard, `admin.only`, least privilege, audit akses, SSL. | Terbuka |
| R-05 | Selisih kas atau shift terbengkalai | Laci dan laporan tidak rekonsiliasi | Silent calculation di server, revoke token + direct logout, cron 03.00 dengan log `auto_closed`, alert internal. | Mitigasi direncanakan |
| R-06 | Payment gateway tersisa di implementasi | Alur dan compliance salah | Hapus/nonaktifkan controller/service/route Midtrans dan migrasi detailnya; gunakan `nomor_referensi`. | Terbuka |

## 6. Definition of Done rilis

Rilis hanya boleh diberi label production-ready setelah migration final 16/27 tervalidasi, acceptance test QA pada dokumen deployment lulus, OTP void dan auto-close teruji, Web Admin dan APK release terhubung ke URL produksi, queue/scheduler/backup/SSL aktif, dan tidak ada route payment gateway/webhook.

Rincian tiket, pembagian Hari 1–30, test case, dan deployment berada pada:

- [Sprint Backlog dan Tiket Jira](Dokumen/Sprint_Backlog_Jira_v1.1-Sprint2.md)
- [QA dan Panduan Deployment](Dokumen/QA_Deployment_Production_v1.1-Sprint2.md)
