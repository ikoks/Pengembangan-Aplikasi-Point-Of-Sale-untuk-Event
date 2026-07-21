# 📋 Rencana Kerja & Tiket Jira — DEVELOPER A (Backend & Web Admin)
## POS Event System | Sprint 2–4 
> **Acuan Utama**: PRD v1.0-Sprint1 

---

## 🗓️ Sprint 2 — Core Transaction API (Hari 1–10)

> **Goal Sprint**: Melengkapi seluruh API endpoint shift management & checkout flow yang masih BACKLOG, sehingga Mobile (DEV-B) bisa mengintegrasikan fitur inti transaksi.

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 1** | API `POST /shift/close` | Implementasi `ShiftSessionController@close`. Validasi shift aktif milik user, hitung ringkasan penjualan (total tunai, non-tunai, jumlah transaksi), terima input `uang_fisik_akhir`, kalkulasi `selisih_uang`, update `status_shift → CLOSED` + `waktu_selesai`. Gunakan `DB::transaction` atomic. Catat log di `shift_operator_logs`. |
| **Hari 2** | API `POST /shift/break` & `/shift/resume` | Implementasi `ShiftSessionController@break` & `resume`. Validasi status shift = `OPEN` → set `ON_BREAK` (break), atau `ON_BREAK` → set `OPEN` (resume). Catat `waktu_break` di `shift_operator_logs`. Cegah double-break. |
| **Hari 3** | API `POST /shift/switch` | Implementasi `ShiftSessionController@switch`. Validasi kasir pengganti (role=Kasir, status_aktif). Update `id_user_aktif` di `shift_session`. Catat operator lama & baru di `shift_operator_logs`. Sesi shift tetap sama, hanya operator yang berganti. |
| **Hari 4** | API `POST /checkout/{id}/confirm` | Implementasi `CheckoutController@confirmTransaction`. Validasi `status = 'Draft'`, update `status → 'Success'`. Catat `waktu_pembayaran`. Jika metode non-tunai, simpan detail ke `detail_pembayaran_non_tunai`. Gunakan `DB::transaction`. |
| **Hari 5** | API `POST /checkout/{id}/void` | Implementasi `CheckoutController@voidTransaction`. Validasi `status = 'Draft' atau 'Success'`, require field `alasan_batal` (wajib isi). Update `status → 'Void'`, catat `diperbarui_oleh`. Audit log entry. Kembalikan stok jika applicable. |
| **Hari 6** | API `GET /transaksi` (List + Filter) | Implementasi `TransaksiController@index`. Support filter: `id_shift`, `id_cabang`, `status`, `tanggal_mulai`, `tanggal_akhir`, `id_metode_pembayaran`. Pagination (15/page). Eager-load detail items + metode pembayaran. Middleware: `auth:sanctum`. Admin: semua transaksi. Kasir: hanya shift aktifnya. |
| **Hari 7** | API `GET /transaksi/{id}` (Detail) + Laporan Shift | Implementasi `TransaksiController@show` (detail lengkap). Implementasi `GET /shift/{id}/summary` untuk ringkasan penjualan per shift (total, per-metode, per-kategori). |
| **Hari 8** | Route Registration + Middleware Wiring | Daftarkan seluruh route baru di `api.php`. Pastikan middleware `auth:sanctum` dan `admin.only` sesuai RBAC matrix. Route kasir-only: shift/close, break, switch. Route shared: transaksi (dengan scope berbeda). |
| **Hari 9** | Unit & Feature Testing | Tulis test untuk: `ShiftCloseTest`, `ShiftBreakTest`, `ShiftSwitchTest`, `CheckoutConfirmTest`, `CheckoutVoidTest`, `TransaksiListTest`. Minimum 2 test case per endpoint (success + failure). Verifikasi idempotency dan RBAC. |
| **Hari 10** | Postman Collection Update + Bug Fix | Update koleksi Postman di `postman/` dengan seluruh endpoint baru. Environment variables. Dokumentasi request/response body. Fix bug dari hasil testing. |

### Tiket Jira Sprint 2

* **POS-19 (8 SP) | API Closing Shift**: Implementasi endpoint `POST /api/v1/shift/close`. Validasi uang fisik akhir, hitung selisih, update status shift ke CLOSED, catat di `shift_operator_logs`.
* **POS-20 (5 SP) | API Break/Resume Shift**: Implementasi `POST /shift/break` & `resume`. Validasi status OPEN <-> ON_BREAK.
* **POS-21 (5 SP) | API Switch Operator**: Implementasi `POST /shift/switch`. Update operator aktif di `shift_session` tanpa merubah status shift (tetap OPEN).
* **POS-22 (5 SP) | API Konfirmasi Transaksi**: Implementasi `POST /checkout/{id}/confirm`. Ubah status dari Draft -> Success, simpan data pembayaran non-tunai jika ada.
* **POS-23 (5 SP) | API Void Transaksi**: Implementasi `POST /checkout/{id}/void`. Ubah status ke Void dengan syarat wajib menyertakan alasan batal, catat log audit.
* **POS-24 (5 SP) | API List Transaksi**: Implementasi `GET /transaksi` dengan filter cabang, shift, status, tanggal, dan metode. Terapkan pagination dan eager-loading.
* **POS-25 (5 SP) | Route & Testing**: Daftarkan routes, setting Sanctum middlewares, dan buat PHPUnit tests minimal 2 test-cases/endpoint.

---

## 🗓️ Sprint 3 — Web Admin Dashboard & UI Kelola (Hari 11–20)

> **Goal Sprint**: Membangun Web Admin Dashboard yang fungsional dan UI CRUD Kelola Menu serta Kelola Kasir menggunakan desain Neo-Brutalist.

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 11** | Layout Master Template (Blade) | Buat `layouts/admin.blade.php`. Styling Neo-Brutalist: font Space Grotesk, BG `#F5F0E8`, border tebal, hard shadows. Responsive sidebar navigation. |
| **Hari 12** | Dashboard Utama — Widget Statistik | Implementasi widget statistik live (Total Penjualan, Transaksi, Shift Aktif, Kasir Online) dari `DashboardController`. |
| **Hari 13** | Dashboard Utama — Grafik & Chart | Integrasi Chart.js (Line chart 7 hari, pie chart bayar, bar top menu) pakai endpoint AJAX. |
| **Hari 14** | UI Kelola Menu — CRUD Table | Buat view tabel `admin/menus/index.blade.php`. Implementasi list menu dengan pagination dan filter kategori. |
| **Hari 15** | UI Kelola Menu — Form CRUD | Modal Add/Edit Menu. Form validasi & AJAX submit ke API. Tab harga regional (per cabang). Soft delete. |
| **Hari 16** | UI Kelola Kasir — CRUD Table | View tabel user `admin/users/index.blade.php`. List admin & kasir beserta status aktif dan role. |
| **Hari 17** | UI Kelola Kasir — Form Role | Modal Add/Edit Kasir. Input nama, username, password, select cabang. Fitur toggle aktif/nonaktif user. |
| **Hari 18** | Web Route + Controller | Daftarkan semua route WEB untuk admin. Set up controller untuk consume internal API atau direct DB query. |
| **Hari 19** | Responsive Testing | Uji coba multi-device viewports. Audit UI/UX. |
| **Hari 20** | Polish & Bug Fix | Rapihkan micro-interactions (hover effect neo-brutalist), siapkan demo sprint review. |

### Tiket Jira Sprint 3

* **POS-26 (5 SP) | Layout Admin Template**: Buat kerangka master view `.blade.php` dengan desain Neo-Brutalist.
* **POS-27 (8 SP) | Dashboard Widgets Real-time**: Buat dashboard analytics dengan Chart.js dan KPI widgets.
* **POS-28 (8 SP) | UI Kelola Menu & Harga**: Buat fitur CRUD table dan form AJAX untuk manajemen menu & setting harga regional (cabang).
* **POS-29 (5 SP) | UI Kelola User (Kasir/Admin)**: Buat fitur CRUD data pengguna sistem, penugasan role, dan manajemen cabang.

---

## 🗓️ Sprint 4 — Reporting, Audit & Auth Flows (Hari 21–30)

> **Goal Sprint**: Melengkapi fitur Report Laporan Keuangan, Audit Log, History, dan otentikasi admin (Lupa Password/Register).

### Jadwal Kerja Terperinci

| Hari | Tugas Utama | Detail Teknis |
|------|-------------|---------------|
| **Hari 21** | UI Riwayat Transaksi | View `admin/transaksi/index.blade.php`. Tabel transaksi lengkap. |
| **Hari 22** | UI Detail & Void Action | Modal detail struk per transaksi. Tombol Admin Force-Void Transaksi dari list beserta dialog alasan. |
| **Hari 23** | API Laporan Keuangan | Endpoint `GET /api/v1/reports/daily-summary` & `shift-summary`. |
| **Hari 24** | UI Laporan Dashboard | View `admin/reports/index.blade.php`. Widget laporan filterable per cabang/tanggal. Export CSV. |
| **Hari 25** | UI Audit Log Viewer | Tabel read-only untuk memantau semua akses dan operasi data penting. |
| **Hari 26** | Fitur Lupa Password | Flow form forgot-password web admin, token generation, link reset. |
| **Hari 27** | Fitur Registrasi Admin | Form pendaftaran admin baru (default: butuh approval). |
| **Hari 28** | Final Web Routes | Middleware checks untuk seluruh endpoint web admin (Guest vs Admin). |
| **Hari 29** | End-to-End Testing | Testing manual & otomatis (Dusk/Feature) untuk keseluruhan alur web dashboard admin. |
| **Hari 30** | Handoff & Release Prep | Code freeze, persiapan deployment staging untuk UAT/Dry Run. |

### Tiket Jira Sprint 4

* **POS-30 (8 SP) | UI Riwayat Transaksi**: Buat view tabel riwayat transaksi, modal detail, dan trigger action Cancel/Void dari web.
* **POS-31 (8 SP) | Laporan Keuangan (API+UI)**: Generate report ringkasan penjualan, breakdown metode bayar, dan export to CSV.
* **POS-32 (5 SP) | UI Audit Log Viewer**: Buat antarmuka pengawasan log aktivitas user (Security Audit).
* **POS-33 (5 SP) | Fitur Lupa Password Admin**: Auth scaffolding untuk fitur forgot & reset password.
* **POS-34 (3 SP) | Fitur Register Admin**: Auth form pendaftaran admin baru di web portal.

---
### 📊 Ringkasan SP DEV-A (Sprint 2–4)
Total Titik Fokus: Backend API & UI Admin
Total Tiket: **16 Tiket** | Total SP: **93 SP**
