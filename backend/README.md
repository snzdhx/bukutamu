# Backend (Laravel) — Buku Tamu

Folder ini adalah **overlay**: berisi file kustom di atas skeleton Laravel resmi.

## Setup

```bash
composer create-project laravel/laravel tmp-skeleton
cp -R backend/. tmp-skeleton/   # timpa skeleton dengan file di folder ini (bootstrap/app.php, routes/api.php, app/, database/)
cd tmp-skeleton
composer require phpoffice/phpspreadsheet
rm database/migrations/0001_01_01_*     # migrasi bawaan tidak dipakai
cp .env.example .env                     # default sudah cocok untuk Laragon (root, tanpa password)
php artisan key:generate
php artisan migrate                      # hanya membuat tabel yang belum ada
php artisan storage:link
php artisan skm:admin admin --nama="Administrator"
php artisan serve
```

Buat database kosong `bukutamu` di Laragon (HeidiSQL/phpMyAdmin) sebelum `php artisan migrate`.
Ekstensi PHP: pdo_mysql, gd (dengan WebP), exif, zip (umumnya sudah aktif di Laragon). Set `upload_max_filesize` dan `post_max_size` > 4MB.

Tabel referensi (pendidikan/pekerjaan/disabilitas) diisi nilai bawaan saat migrate; ubah sesuai kebutuhan.
Data lama dari Supabase: ekspor tiap tabel ke CSV lalu impor ke MySQL (kolom sama).

Catatan: foto galeri lama di Supabase Storage tidak otomatis ikut; salin file ke `storage/app/public/gallery/`.
Hash password lama (bcryptjs) tetap bisa dipakai.
