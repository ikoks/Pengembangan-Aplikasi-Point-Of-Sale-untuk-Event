# Bab V Kebutuhan Data

Bab ini mendefinisikan kebutuhan data untuk Sistem POS Event, yang mencakup data input yang dimasukkan oleh pengguna, sumber input, peran penginput, serta matriks hak akses CRUD (Create, Read, Update, Delete) untuk masing-masing entitas data.

## V.1 Input

Data input adalah seluruh informasi yang dimasukkan ke dalam sistem oleh pengguna (Kasir dan Admin) maupun melalui sistem otomatis (Payment Gateway). Setiap entitas memiliki atribut utama yang harus dikelola sesuai dengan hak akses masing-masing peran.

Untuk menyelaraskan dokumen SRS ini dengan rancangan fisik basis data, penamaan entitas telah disesuaikan dengan menghilangkan prefix `tbl_` dan menyamakan nama kolom atribut utama.

### Tabel 5.1 - Daftar Entitas Input dan Sumber Data

| Nama Entitas | Atribut Utama | Sumber Input | Peran Penginput |
| :--- | :--- | :--- | :--- |
| **role_user** | id_role, nama_role | Web Admin (Sistem) | Admin |
| **user** | id_user, id_role, id_cabang, username, password_hash, nama_user, status_aktif | Form Registrasi Admin & Kelola Kasir | Admin |
| **cabang** | id_cabang, pajak_persen, nama_cabang, lokasi | Form Manajemen Cabang | Admin |
| **shift_session** | id_shift, id_user, id_user_aktif, id_cabang, id_sales, waktu_mulai, waktu_selesai, modal_awal, uang_fisik_akhir, status_shift, selisih_uang | Form Shift (Opening & Closing) di APK | Kasir |
| **transaksi** | id_transaksi, id_sales, id_cabang, id_user, id_metode, id_shift, id_promo, tanggal_transaksi, jam_transaksi, nama_pelanggan, tax, total, status, alasan_batal, diperbaharui_oleh, catatan_koreksi, nominal_promo | Menu Checkout APK & Koreksi Web Admin | Kasir & Admin |
| **transaksi_detail** | id_transaksi_detail, id_transaksi, id_produk, harga_produk, quantity, id_promo, nominal_promo, subtotal_item, status_item, alasan_batal_item | Halaman Keranjang Belanja APK Mobile | Kasir |
| **metode_pembayaran** | id_metode, nama_metode, kategori_metode, vendor_gateway | Form Pengaturan Pembayaran | Admin |
| **detail_pembayaran_non_tunai** | id_detail_bayar, id_transaksi, payment_gateway_id, reference_number, qr_string_data, va_number, status_api, waktu_kedaluwarsa, raw_callback_payload | API / Callback Webhook Payment Gateway | Sistem (Payment Gateway) |
| **sales_mode** | id_sales, nama_mode | Form Pengaturan Jalur Penjualan | Admin |
| **menu_template** | id_template, id_menu, id_cabang, id_sales, harga_produk | Form Sinkronisasi Harga per Cabang | Admin |
| **kategori** | id_kategori, nama_kategori | Form Manajemen Kategori Produk | Admin |
| **sub_kategori** | id_sub_kategori, id_kategori, nama_sub_kategori | Form Manajemen Sub Kategori Produk | Admin |
| **menu** | id_menu, id_sub_kategori, nama_menu | Form Kelola Master Data Produk | Admin |
| **promosi** | id_promo, id_cabang, nama_promo, tipe_promo, cakupan_promo, nilai_promo, id_menu_free | Form Input Program Diskon & Promo | Admin |

---

## Matriks Akses CRUD

Matriks ini mendefinisikan hak akses masing-masing aktor (Kasir, Admin, dan Sistem/Payment Gateway) terhadap entitas data di dalam sistem.

* **C** (*Create*): Pengguna dapat membuat data baru.
* **R** (*Read*): Pengguna dapat melihat atau membaca data.
* **U** (*Update*): Pengguna dapat mengubah atau memperbarui data.
* **D** (*Delete*): Pengguna dapat menghapus data.

### Tabel 5.2 - Matriks Hak Akses CRUD Entitas

| Nama Entitas | Kasir | Admin | Sistem (Payment Gateway) |
| :--- | :---: | :---: | :---: |
| **role_user** | - | CRUD | - |
| **user** | R | CRUD | - |
| **cabang** | R | CRUD | - |
| **shift_session** | CRU | R | - |
| **transaksi** | CRU | RU | RU |
| **transaksi_detail** | CRU | R | - |
| **metode_pembayaran** | R | CRUD | - |
| **detail_pembayaran_non_tunai** | R | R | CRU |
| **sales_mode** | R | CRUD | - |
| **menu_template** | R | CRUD | - |
| **kategori** | R | CRUD | - |
| **sub_kategori** | R | CRUD | - |
| **menu** | R | CRUD | - |
| **promosi** | R | CRUD | - |

---

## V.2 Output

Output adalah informasi yang dihasilkan oleh sistem untuk disajikan kepada pengguna maupun diintegrasikan ke perangkat lain. Berikut adalah daftar output utama Sistem POS Event:

1. **Struk Nota Belanja Fisik (Struk Thermal)**:
   * **Penerima**: Pelanggan & Kasir.
   * **Deskripsi**: Hasil cetakan thermal dari printer Bluetooth (kertas 58mm/80mm) yang memuat Nama Event, ID Transaksi (UUID), Nama Kasir, Kanal Jual, Waktu Transaksi, Daftar Menu & Qty, Nominal Diskon/Promo, PPN/Tax, Jenis Pembayaran, dan Total Bersih Akhir.
   * **Sumber Data**: `transaksi`, `transaksi_detail`, `cabang`, `user`, `sales_mode`, `metode_pembayaran`.

2. **Tampilan QR Code Pembayaran (Layar POS)**:
   * **Penerima**: Pelanggan (untuk dipindai).
   * **Deskripsi**: Gambar QRIS dinamis yang di-render di layar HP kasir berdasarkan data string QR dari payment gateway.
   * **Sumber Data**: `detail_pembayaran_non_tunai.qr_string_data`.

3. **Laporan Statistik Keuangan & Audit Finansial (Dashboard Web)**:
   * **Penerima**: Admin Web & Supervisor Event.
   * **Deskripsi**: Rekapitulasi omzet periodik/event, grafik kontribusi metode pembayaran, menu terlaris, serta tabel log audit transaksi void/cancelled lengkap dengan nama kasir dan teks alasannya.
   * **Sumber Data**: Agregasi `transaksi`, `transaksi_detail`, `shift_session`, `cabang`.

4. **Rekap Shift & Laporan Selisih (Slip Closing)**:
   * **Penerima**: Kasir & Admin.
   * **Deskripsi**: Cetakan slip atau tampilan ringkasan penutupan shift kasir yang menampilkan total modal awal, total omzet digital (tunai & nontunai) selama shift, input uang fisik asli kasir, dan hasil selisih uang sistem vs uang laci.
   * **Sumber Data**: `shift_session`, `transaksi`.
