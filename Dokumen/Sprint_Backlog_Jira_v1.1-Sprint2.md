# Sprint Backlog dan Tiket Jira — v1.1-Sprint2

Tanggal rencana: 27 Juli 2026. SP adalah angka perkiraan tingkat usaha: semakin besar angkanya, semakin banyak pekerjaan dan pemeriksaan yang diperlukan. Satu tiket Jira adalah satu pekerjaan yang dapat ditugaskan dan diperiksa.

## Cara membaca rencana ini

Developer A membuat “dapur pusat”: tempat penyimpanan data, aturan transaksi, dan halaman Admin. Developer B membuat “meja kasir”: layar HP, keranjang, pembayaran, printer, dan pengiriman data. Keduanya harus sering mencocokkan contoh data agar tombol di HP benar-benar cocok dengan server.

Urutan setiap sprint mudahnya adalah: **Sprint 2 membuat mesin jualan**, **Sprint 3 membuat layar pengelolaan**, lalu **Sprint 4 membuat laporan, pengamanan, pengujian, dan peluncuran**.

## Developer A — Backend API & Web Admin

### Tiket Jira

| Jira | Sprint | Story | SP | Acceptance criteria ringkas |
|---|---|---|---:|---|
| POS-A-01 | S2 | Finalisasi schema 16 tabel/27 FK, UUID, `nomor_referensi` | 8 | Migration clean, FK/PK tervalidasi, payment gateway artefact dipetakan/dihapus. |
| POS-A-02 | S2 | Shift open, break, resume, switch | 5 | Status valid, owner `id_user` tetap, `id_user_aktif` berubah saat switch, audit log. |
| POS-A-03 | S2 | Shift close silent + revoke token | 8 | Hitung selisih server-side, response tanpa nominal, token dicabut, client dapat direct logout. |
| POS-A-04 | S2 | `app:auto-close-stale-shifts` dan schedule 03.00 | 5 | Menutup `OPEN` stale, log `auto_closed`, idempoten, unit test. |
| POS-A-05 | S2 | Draft checkout dan manual non-cash | 8 | Confirm cash/manual, `nomor_referensi`, promo/pajak, transaction lock. |
| POS-A-06 | S2 | Void state machine + OTP Admin | 13 | Draft edit tanpa OTP; Success full/item void wajib OTP, alasan, audit snapshot. |
| POS-A-07 | S2 | Offline sync contract/idempotency test | 5 | Batch retry aman, partial error terisolasi, UUID tidak duplikat. |
| POS-A-08 | S2 | Deprecate payment gateway/webhook | 5 | Tidak ada route/service Midtrans aktif; test route menolak/tidak ditemukan. |
| POS-A-09 | S3 | Neo-Brutalist Blade master layout | 5 | Nav, auth guard, responsive, tanpa inline `style=`. |
| POS-A-10 | S3 | CRUD Cabang, User/Kasir, Kategori, Sub-Kategori | 8 | List/create/edit/delete, validation, pagination, admin authorization. |
| POS-A-11 | S3 | CRUD Menu, Template Harga Regional, Promosi | 8 | Relasi dan uniqueness tervalidasi, UI error state dan soft delete sesuai rule. |
| POS-A-12 | S3 | Dashboard KPI dan Chart.js | 8 | Widget Total Pembayaran/Rekap Volume Penjualan, filter tanggal/cabang, endpoint agregasi. |
| POS-A-13 | S4 | Riwayat transaksi dan detail struk modal | 5 | Filter, pagination, detail nominal/reference, akses berbasis role. |
| POS-A-14 | S4 | Laporan 8 filter + PDF/Excel | 13 | Semua filter dapat dikombinasikan, hasil konsisten, export tidak membocorkan data. |
| POS-A-15 | S4 | Audit viewer, password reset, registrasi Admin | 8 | Audit searchable; `password_reset_tokens`, email token, role/admin validation. |
| POS-A-16 | S4 | Deployment hardening dan observability | 8 | `.env`, cache, queue, scheduler, logs, backup, health check dan rollback note. |

**Total Developer A: 113 SP.**

### Jadwal harian Developer A

| Hari | Fokus | Output / tiket |
|---:|---|---|
| 1 | Freeze contract dan audit migration | A-01 |
| 2 | Mapping 16 tabel dan 27 FK | A-01 |
| 3 | UUID, index, constraints, seed review | A-01 |
| 4 | Shift open/break/resume | A-02 |
| 5 | Switch operator dan audit | A-02 |
| 6 | Closing silent, revoke token | A-03 |
| 7 | Scheduler command auto-close | A-04 |
| 8 | Scheduler test dan log `auto_closed` | A-04 |
| 9 | Draft checkout contract | A-05 |
| 10 | Confirm cash/manual non-cash | A-05 |
| 11 | Pajak, promo, reference validation | A-05 |
| 12 | Void Draft vs Success design | A-06 |
| 13 | OTP Admin verification | A-06 |
| 14 | Void item/full + audit snapshot | A-06 |
| 15 | API feature tests dan handoff Dev B | A-06/A-07 |
| 16 | Sync idempotency/partial retry | A-07 |
| 17 | Remove/deprecate gateway routes | A-08 |
| 18 | Regression route/auth/migration | A-01–A-08 |
| 19 | Blade master layout shell | A-09 |
| 20 | CRUD Cabang/User | A-10 |
| 21 | CRUD Kategori/Sub-Kategori | A-10 |
| 22 | CRUD Menu | A-11 |
| 23 | Template regional dan Promosi | A-11 |
| 24 | Dashboard KPI endpoint/widget | A-12 |
| 25 | Chart.js dan filter dashboard | A-12 |
| 26 | Riwayat transaksi + modal struk | A-13 |
| 27 | Laporan 8 filter | A-14 |
| 28 | Export PDF/Excel + audit viewer | A-14/A-15 |
| 29 | Password reset/registrasi Admin | A-15 |
| 30 | Staging deploy, hardening, handoff production | A-16 |

## Developer B — Mobile APK

### Tiket Jira

| Jira | Sprint | Story | SP | Acceptance criteria ringkas |
|---|---|---|---:|---|
| POS-B-01 | S2 | API client, auth token, environment | 5 | Base URL `/api/v1`, token aman, timeout/retry dan error mapping. |
| POS-B-02 | S2 | POS split screen katalog SQLite | 8 | Grid `menu_replica`, filter tabs, search, loading/empty state. |
| POS-B-03 | S2 | Cart subtotal/pajak/promo | 8 | Kalkulasi server-compatible dan refresh quantity. |
| POS-B-04 | S2 | Lock Cabang/Sales Mode saat cart > 0 | 3 | Selector disabled sampai cart kosong; state tidak dapat dibypass. |
| POS-B-05 | S2 | Draft cart edit tanpa OTP | 5 | Hapus/kurangi item dan clear cart tidak memanggil OTP. |
| POS-B-06 | S2 | Cash payment | 5 | Kalkulator kembalian, validasi uang kurang, confirm. |
| POS-B-07 | S2 | Manual non-cash payment | 5 | Input RRN/bukti transfer dikirim sebagai `nomor_referensi`; tidak ada QR gateway. |
| POS-B-08 | S3 | ESC/POS Bluetooth printer | 8 | Pair/connect/print/retry dan receipt snapshot. |
| POS-B-09 | S3 | SQLite schema/version migration | 5 | UUID text, katalog, draft, sync queue dan migration aman. |
| POS-B-10 | S3 | SyncManager background worker | 13 | NetInfo listener, batch `/sync`, retry/backoff, idempotent local state. |
| POS-B-11 | S3 | Sync status banner + settings | 5 | Synced/Failed/Pending, manual retry, endpoint/terminal settings. |
| POS-B-12 | S4 | OTP modal void Success | 5 | OTP Admin wajib untuk full/item void; Draft tetap tanpa OTP. |
| POS-B-13 | S4 | Closing shift direct logout | 5 | Input uang fisik, call close, clear token, redirect login tanpa selisih. |
| POS-B-14 | S4 | Switch operator lock screen/quick login | 8 | Owner shift tidak berubah, operator aktif berubah, token/session aman. |
| POS-B-15 | S4 | E2E, memory, production APK | 13 | Offline/payment/void/close/print tested; release `app-release.apk` signed. |

**Total Developer B: 101 SP.**

### Jadwal harian Developer B

| Hari | Fokus | Output / tiket |
|---:|---|---|
| 1 | API client dan environment | B-01 |
| 2 | Auth token dan login contract | B-01 |
| 3 | SQLite schema/version | B-09 |
| 4 | Katalog download ke `menu_replica` | B-02/B-09 |
| 5 | POS grid katalog | B-02 |
| 6 | Filter tabs dan search | B-02 |
| 7 | Cart state dan subtotal | B-03 |
| 8 | Pajak cabang dan promo | B-03 |
| 9 | Selector lock | B-04 |
| 10 | Draft edit/clear tanpa OTP | B-05 |
| 11 | Cash payment/kembalian | B-06 |
| 12 | Manual non-cash `nomor_referensi` | B-07 |
| 13 | Confirm flow dan receipt state | B-06/B-07 |
| 14 | Offline draft persistence | B-09 |
| 15 | Sprint 2 integration test | B-01–B-07 |
| 16 | Bluetooth discovery/pairing | B-08 |
| 17 | ESC/POS receipt format | B-08 |
| 18 | Printer retry/error state | B-08 |
| 19 | Sync queue data model | B-10 |
| 20 | NetInfo listener | B-10 |
| 21 | Batch sync/retry/backoff | B-10 |
| 22 | Idempotent acknowledgement | B-10 |
| 23 | Sync banner | B-11 |
| 24 | Settings screen/manual retry | B-11 |
| 25 | Offline/online integration test | B-09–B-11 |
| 26 | OTP void modal | B-12 |
| 27 | Closing shift direct logout | B-13 |
| 28 | Switch operator lock/quick login | B-14 |
| 29 | E2E simulation dan memory profiling | B-15 |
| 30 | Signed production APK dan handoff | B-15 |

## Dependency dan handoff

Developer A harus menyerahkan OpenAPI/request examples untuk auth, confirm, void, close, sync, dan catalog sebelum Hari 15. Developer B tidak boleh meng-hardcode URL staging; semua endpoint memakai environment. QA menggunakan UUID/fixture yang sama dan memeriksa bahwa tidak ada route payment gateway/webhook.
