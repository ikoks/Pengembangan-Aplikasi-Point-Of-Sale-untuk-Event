# QA dan Panduan Deployment Produksi — v1.1-Sprint2

Dokumen ini adalah panduan pemeriksaan dan peluncuran untuk orang yang belum terbiasa dengan istilah komputer. Saat disebut “server”, maksudnya komputer sewaan di internet yang menyimpan data pusat. Saat disebut “HP kasir”, maksudnya aplikasi Android yang dipakai saat melayani pembeli.

## 1. Test cases wajib

### Alur pengujian paling penting

1. Matikan internet HP, pilih menu, buat pesanan, dan selesaikan pembayaran. Pesanan harus tetap terlihat tersimpan di HP.
2. Nyalakan internet. Tunggu indikator berubah menjadi “Terkirim”, lalu cek Web Admin. Pesanan harus muncul satu kali saja.
3. Untuk pesanan yang masih di keranjang, hapus item dan kosongkan keranjang. Tidak boleh ada permintaan OTP.
4. Untuk nota yang sudah lunas, coba batalkan tanpa OTP atau dengan OTP salah. Pembatalan harus ditolak.
5. Ulangi dengan OTP Admin yang benar. Pembatalan harus berhasil dan tercatat di buku audit.
6. Isi uang fisik saat tutup shift. Setelah tombol Tutup ditekan, aplikasi harus langsung kembali ke layar login dan tidak menampilkan angka selisih kepada kasir.

| ID | Skenario | Langkah utama | Expected result |
|---|---|---|---|
| QA-01 | Offline checkout | Matikan network, buka katalog dari SQLite, buat cart, simpan draft, hidupkan network, jalankan SyncManager. | Draft tetap tersimpan lokal; batch terkirim; server mengembalikan UUID synced. |
| QA-02 | Idempotent retry | Kirim batch yang sama minimal dua kali, termasuk setelah timeout client. | Satu transaksi server; retry kedua ditandai already-synced, tidak menggandakan detail/omzet. |
| QA-03 | Partial sync | Kirim batch berisi satu payload valid dan satu invalid. | Item valid tersimpan, item invalid punya error terisolasi, response partial; retry valid aman. |
| QA-04 | Void Draft | Tambah item pada Draft, kurangi/hapus/clear dari mobile tanpa OTP. | Cart berubah; tidak ada OTP dan tidak ada audit void nota lunas. |
| QA-05 | Void Success tanpa OTP | Konfirmasi nota, panggil full/item void tanpa OTP atau OTP salah. | HTTP 422/403 sesuai kontrak; status tetap Success; tidak ada perubahan audit void berhasil. |
| QA-06 | Void Success dengan OTP | Masukkan OTP Admin benar, alasan valid, void item lalu full note. | Status/item berubah atomik; `audit_logs` berisi actor, alasan, snapshot sebelum/sesudah. |
| QA-07 | Selector lock | Isi cart Draft, coba ganti Cabang/Sales Mode; kosongkan cart lalu coba lagi. | Selector disabled saat item > 0; aktif kembali setelah cart kosong. |
| QA-08 | Closing direct logout | Buka shift, lakukan transaksi, input uang fisik, close dari APK. | Server menyimpan rekonsiliasi; token dicabut; APK langsung login; nominal selisih tidak ditampilkan. |
| QA-09 | Auto-close 03.00 | Seed shift OPEN stale, jalankan command/scheduler pada waktu simulasi. | Shift menjadi CLOSED, `auto_closed` tercatat, command aman dijalankan ulang. |
| QA-10 | Manual non-cash | Pilih EDC/transfer, isi RRN/bukti transfer, confirm. | `transaksi.nomor_referensi` tersimpan; tidak ada request QR, gateway, atau webhook. |

Semua test harus dijalankan pada API integration test dan smoke test APK; QA-05/06 dan QA-08/09 adalah release blockers.

## 2. Deployment Ubuntu 22.04 LTS

### Urutan peluncuran dalam bahasa sederhana

1. Sewa Cloud VPS Ubuntu 22.04 dan arahkan nama domain ke alamat VPS.
2. Pasang Nginx sebagai penerima lalu lintas web, PHP untuk menjalankan server, dan MySQL sebagai lemari data.
3. Salin aplikasi ke VPS, isi alamat database dan email pada `.env`, lalu jalankan pembuatan tabel dan data awal.
4. Aktifkan HTTPS agar password, OTP, dan transaksi tidak dikirim terbuka.
5. Pasang alarm server yang berjalan setiap menit. Alarm tersebut menjalankan pemeriksaan pukul 03.00 untuk menutup shift yang tertinggal.
6. Pasang pekerja antrean agar pekerjaan email dan proses latar belakang tidak menghambat kasir.
7. Buat APK release yang sudah ditandatangani, pasang di HP kasir, dan lakukan QA sebelum dipakai di event.

Contoh asumsi: domain `pos.example.com`, project `/var/www/pos-event`, user deploy `www-data`. Ganti secret dan path sesuai infrastruktur.

### 2.1 Paket dan service

```bash
sudo apt update
sudo apt install -y nginx mysql-server redis-server supervisor git unzip curl ca-certificates \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-bcmath php8.3-intl composer
sudo systemctl enable --now nginx mysql redis-server php8.3-fpm supervisor
```

Target repository saat audit menyatakan Laravel 13/PHP 8.3, sedangkan backlog meminta Laravel 11. Kunci versi framework sebelum instalasi; jangan deploy campuran dependency. Untuk target actual repository, gunakan PHP 8.3 dan `composer install --no-dev --optimize-autoloader`.

### 2.2 MySQL dan aplikasi

```bash
sudo mysql -e "CREATE DATABASE pos_event CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'pos_event'@'localhost' IDENTIFIED BY 'CHANGE_ME_LONG_SECRET'; GRANT ALL PRIVILEGES ON pos_event.* TO 'pos_event'@'localhost'; FLUSH PRIVILEGES;"
cd /var/www/pos-event
cp .env.example .env
php artisan key:generate --force
php artisan migrate --seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
npm ci
npm run build
```

`.env` minimum: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://pos.example.com`, DB credentials, `SESSION_DRIVER=database`, `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, mail SMTP untuk reset password, dan secret Sanctum. Jangan commit `.env`, seeded password, atau private key.

### 2.3 Nginx dan SSL

```nginx
server {
    listen 80;
    server_name pos.example.com;
    root /var/www/pos-event/public;
    index index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
    location ~ /\. { deny all; }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pos.example.com
sudo certbot renew --dry-run
```

### 2.4 Scheduler auto-close dan queue

Laravel scheduler dijalankan setiap menit; rule command membatasi eksekusi bisnis pada pukul 03.00 zona aplikasi.

```cron
* * * * * cd /var/www/pos-event && php artisan schedule:run >> /dev/null 2>&1
```

`/etc/supervisor/conf.d/pos-event-worker.conf`:

```ini
[program:pos-event-worker]
command=php /var/www/pos-event/artisan queue:work redis --sleep=3 --tries=3 --timeout=120
directory=/var/www/pos-event
user=www-data
numprocs=1
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/www/pos-event/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart pos-event-worker
```

### 2.5 React Native release APK

Pada workstation Android/CI, isi `android/gradle.properties` dan signing secret dari secret manager, lalu:

```powershell
cd PosEventKasir
npm ci
npm test -- --runInBand
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

Artefak yang harus diverifikasi adalah `android/app/build/outputs/apk/release/app-release.apk`; lakukan checksum, install pada perangkat uji, jalankan QA-01 sampai QA-10 yang relevan, lalu distribusikan melalui kanal internal. Jangan memasukkan URL staging atau credential ke APK produksi.

## 3. Backup, monitoring, dan rollback

- Backup MySQL harian terenkripsi, retensi minimal 14 hari, dan uji restore mingguan.
- Monitor `storage/logs`, failed jobs, disk, RAM, MySQL, Redis, SSL expiry, dan scheduler heartbeat.
- Sebelum migration/deploy, tag release dan backup database. Jika smoke test gagal, hentikan queue, rollback artefak ke tag sebelumnya, restore DB hanya bila migration tidak reversible, lalu jalankan smoke test ulang.
- Production gate: `APP_DEBUG=false`, HTTPS aktif, route gateway/webhook tidak tersedia, OTP void dan auto-close lulus, serta APK release memakai API production.
