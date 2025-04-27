# Open Music API

API untuk aplikasi Open Music yang memungkinkan pengelolaan musik, album, dan playlist.

## Fitur Upload Cover Album

Untuk mengunggah cover album, gunakan endpoint berikut:

```bash
curl -X POST \
  'http://localhost:5000/albums/{id}/covers' \
  -H 'Content-Type: multipart/form-data' \
  --form 'cover=@"path/to/your/image.jpg"'
```

Keterangan:
- Method: POST
- Endpoint: `/albums/{id}/covers`
- Content-Type: multipart/form-data
- Payload: file gambar (maksimal 512KB)
- Parameter:
  - `id`: ID album yang akan ditambahkan cover

Ketentuan:
- Tipe konten harus merupakan MIME types dari images
- Ukuran file cover maksimal 512000 Bytes
- Mendukung penyimpanan di File System (lokal) atau S3 Bucket
- Konfigurasi S3 Bucket menggunakan environment variable:
  - `AWS_BUCKET_NAME`: Nama bucket
  - `AWS_REGION`: Region AWS
  - `AWS_ACCESS_KEY_ID`: Access key ID
  - `AWS_SECRET_ACCESS_KEY`: Secret access key

Response (201):
```json
{
    "status": "success",
    "message": "Sampul berhasil diunggah"
}
```

Setelah upload, endpoint GET `/albums/{id}` akan menampilkan properti `coverUrl`:
```json
{
  "status": "success",
  "data": {
    "album": {
      "id": "album-Mk8AnmCp210PwT6B",
      "name": "Viva la Vida",
      "coverUrl": "http://...."
    }
  }
}
```

Catatan:
- URL gambar harus dapat diakses
- Jika album belum memiliki sampul, `coverUrl` bernilai null
- Upload sampul baru akan menggantikan sampul lama

## Fitur Export Playlist

Untuk mengekspor playlist ke dalam format JSON, gunakan endpoint berikut:

```bash
curl -X POST \
  'http://localhost:5000/export/playlists/{playlistId}' \
  -H 'Authorization: Bearer your_access_token' \
  -H 'Content-Type: application/json' \
  -d '{
    "targetEmail": "user@email.com"
  }'
```

Keterangan:
- Method: POST
- Endpoint: `/export/playlists/{playlistId}`
- Autentikasi: Membutuhkan token JWT
- Parameter:
  - `playlistId`: ID playlist yang akan diekspor
- Body Request:
  ```json
  {
      "targetEmail": "string"
  }
  ```

Ketentuan:
- Menggunakan RabbitMQ sebagai message broker
- Konfigurasi menggunakan environment variable:
  - `RABBITMQ_SERVER`: Host server RabbitMQ
  - `SMTP_USER`: Email pengirim
  - `SMTP_PASSWORD`: Password email
  - `SMTP_HOST`: Host server SMTP
  - `SMTP_PORT`: Port server SMTP
- Hanya pemilik playlist yang dapat mengekspor
- Data yang dikirim ke consumer hanya PlaylistId
- Hasil ekspor dalam format JSON
- Pengiriman melalui email menggunakan nodemailer

Response (201):
```json
{
    "status": "success",
    "message": "Permintaan Anda sedang kami proses"
}
```

Format JSON hasil ekspor:
```json
{
  "playlist": {
    "id": "playlist-Mk8AnmCp210PwT6B",
    "name": "My Favorite Coldplay Song",
    "songs": [
      {
        "id": "song-Qbax5Oy7L8WKf74l",
        "title": "Life in Technicolor",
        "performer": "Coldplay"
      },
      {
        "id": "song-poax5Oy7L8WKllqw",
        "title": "Centimeteries of London",
        "performer": "Coldplay"
      },
      {
        "id": "song-Qalokam7L8WKf74l",
        "title": "Lost!",
        "performer": "Coldplay"
      }
    ]
  }
}
```

## Fitur Menyukai Album

API menyediakan endpoint untuk menyukai, batal menyukai, dan melihat jumlah like album:

### Menyukai Album
- Method: POST
- URL: `/albums/{id}/likes`
- Autentikasi: Dibutuhkan
- Response (201):
  ```json
  {
      "status": "success",
      "message": "Berhasil menyukai album"
  }
  ```

### Batal Menyukai Album
- Method: DELETE
- URL: `/albums/{id}/likes`
- Autentikasi: Dibutuhkan
- Response (200):
  ```json
  {
      "status": "success",
      "message": "Berhasil membatalkan like album"
  }
  ```

### Melihat Jumlah Like Album
- Method: GET
- URL: `/albums/{id}/likes`
- Response (200):
  ```json
  {
      "status": "success",
      "data": {
          "likes": 10
      }
  }
  ```

Ketentuan:
- Membutuhkan autentikasi untuk menyukai/batal menyukai
- Pengguna hanya dapat menyukai album yang sama 1 kali
- Response 400 jika mencoba menyukai album yang sama

## Server-Side Cache

Implementasi cache pada endpoint GET `/albums/{id}/likes`:

Ketentuan:
- Cache bertahan selama 30 menit
- Response dari cache memiliki header `X-Data-Source: cache`
- Cache dihapus saat ada perubahan jumlah like pada album
- Menggunakan Redis/Memurai sebagai memory caching engine
- Konfigurasi menggunakan environment variable:
  - `REDIS_SERVER`: Host server Redis