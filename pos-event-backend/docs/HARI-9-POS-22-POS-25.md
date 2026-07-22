# Hari 9 — POS-22 sampai POS-25

Semua endpoint berikut menggunakan header `Authorization: Bearer {SANCTUM_TOKEN}` dan `Accept: application/json`.

## 1. Konfirmasi draft menjadi Success

Request JSON non-tunai bersifat opsional. Untuk transaksi tunai, body boleh `{}`.

```bash
curl --request POST \
  --url http://localhost:8000/api/v1/checkout/{ID_TRANSAKSI}/confirm \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer {SANCTUM_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{
    "vendor_gateway": "Midtrans",
    "payment_gateway_id": "midtrans-order-20260722-001",
    "reference_number": "REF-20260722-001",
    "va_number": "70001xxxx"
  }'
```

Contoh response `200 OK`:

```json
{
  "success": true,
  "message": "Transaksi berhasil dikonfirmasi (Success).",
  "data": {
    "id_transaksi": "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx",
    "status": "Success",
    "tanggal_transaksi": "2026-07-22",
    "jam_transaksi": "10:15:30",
    "total": 55000,
    "detail_pembayaran_non_tunai": {
      "payment_gateway_id": "midtrans-order-20260722-001",
      "reference_number": "REF-20260722-001",
      "va_number": "70001xxxx",
      "status_api": "SETTLEMENT"
    }
  }
}
```

## 2. Void transaksi

Request:

```bash
curl --request POST \
  --url http://localhost:8000/api/v1/checkout/{ID_TRANSAKSI}/void \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer {SANCTUM_TOKEN}' \
  --header 'Content-Type: application/json' \
  --data '{"alasan_batal":"Pelanggan membatalkan pesanan"}'
```

Contoh response `200 OK`:

```json
{
  "success": true,
  "message": "Transaksi berhasil di-void.",
  "data": {
    "id_transaksi": "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx",
    "status": "Void",
    "alasan_batal": "Pelanggan membatalkan pesanan"
  }
}
```

Jika `alasan_batal` tidak diisi, response `422 Unprocessable Entity`:

```json
{
  "message": "The alasan batal field is required.",
  "errors": {
    "alasan_batal": ["The alasan batal field is required."]
  }
}
```

## 3. List transaksi dengan filter dan pagination

```bash
curl --request GET \
  --url 'http://localhost:8000/api/v1/transaksi?status=Success&tanggal_mulai=2026-07-01&per_page=15' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer {SANCTUM_TOKEN}'
```

Contoh response pagination:

```json
{
  "data": [],
  "links": {
    "first": "http://localhost:8000/api/v1/transaksi?page=1",
    "last": "http://localhost:8000/api/v1/transaksi?page=3",
    "prev": null,
    "next": "http://localhost:8000/api/v1/transaksi?page=2"
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "to": 15,
    "total": 42
  }
}
```

Di Postman, gunakan method dan URL yang sama, pilih `Body > raw > JSON` untuk endpoint confirm/void, lalu simpan token pada environment variable `SANCTUM_TOKEN`.
