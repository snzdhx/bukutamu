<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Galeri foto. File disimpan di disk "public" (storage/app/public/gallery),
 * diakses lewat /storage/gallery/<nama-file> (jalankan: php artisan storage:link).
 */
class GalleryController extends Controller
{
    private const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    private const MAX_SIZE = 4 * 1024 * 1024;
    private const MAX_DIMENSI = 1600;
    private const WEBP_QUALITY = 82;
    private const MAX_PIKSEL_PROSES = 36_000_000; // lindungi memori saat decode

    private function disk()
    {
        return Storage::disk('public');
    }

    private function withUrl(object $row): array
    {
        return array_merge((array) $row, ['file_url' => '/storage/gallery/' . $row->file]);
    }

    /* ---------------- Baca ---------------- */

    /** Untuk halaman publik: hanya foto aktif. */
    public function publicList()
    {
        $rows = DB::table('gallery')->where('is_deleted', 0)->where('is_active', 1)
            ->orderByDesc('created_at')->get();
        return Api::ok('Data berhasil diambil', $rows->map(fn ($r) => $this->withUrl($r))->all());
    }

    /** Untuk admin: semua foto yang belum dihapus. */
    public function adminList()
    {
        $rows = DB::table('gallery')->where('is_deleted', 0)->orderByDesc('created_at')->get();
        return Api::ok('Data berhasil diambil', $rows->map(fn ($r) => $this->withUrl($r))->all());
    }

    public function show(string $id)
    {
        $row = DB::table('gallery')->where('gallery_id', $id)->where('is_deleted', 0)->first();
        if (!$row) {
            return Api::fail('Data tidak ditemukan');
        }
        return Api::ok('Data berhasil diambil', $this->withUrl($row));
    }

    /* ---------------- Tulis ---------------- */

    public function store(Request $request)
    {
        $admin = $request->attributes->get('admin');
        $nama = Api::clean($request->input('gallery_name', ''));
        if ($nama === '') {
            return Api::fail('Nama/judul foto tidak boleh kosong');
        }

        $upload = $this->handleUploadedFile($request->file('photo'));
        if (isset($upload['error'])) {
            return Api::fail($upload['error']);
        }

        $galleryId = bin2hex(random_bytes(16));
        try {
            DB::table('gallery')->insert([
                'gallery_id' => $galleryId,
                'gallery_name' => $nama,
                'file' => $upload['filename'],
                'created_by' => $admin['nama'] ?? 'Admin',
                'created_at' => Api::nowWib(),
                'is_active' => 1,
            ]);
        } catch (Throwable $e) {
            $this->disk()->delete('gallery/' . $upload['filename']); // bersihkan file yang sudah terunggah
            return Api::logFail('menyimpan data galeri', $e);
        }

        return Api::ok('Foto berhasil ditambahkan', [
            'id' => $galleryId,
            'file_url' => '/storage/gallery/' . $upload['filename'],
        ]);
    }

    public function update(Request $request, string $id)
    {
        $admin = $request->attributes->get('admin');
        $nama = Api::clean($request->input('gallery_name', ''));
        $isActive = $request->has('is_active') ? ((int) $request->input('is_active') ?: 0) : 1;
        if ($id === '' || $nama === '') {
            return Api::fail('ID dan Nama tidak boleh kosong');
        }

        $old = DB::table('gallery')->where('gallery_id', $id)->where('is_deleted', 0)->first(['file']);
        if (!$old) {
            return Api::fail('Data tidak ditemukan');
        }

        $values = [
            'gallery_name' => $nama,
            'is_active' => $isActive,
            'updated_by' => $admin['nama'] ?? 'Admin',
            'updated_at' => Api::nowWib(),
        ];

        try {
            $newFile = null;
            if ($request->hasFile('photo')) {
                $upload = $this->handleUploadedFile($request->file('photo'));
                if (isset($upload['error'])) {
                    return Api::fail($upload['error']);
                }
                $newFile = $upload['filename'];
                $values['file'] = $newFile;
            }

            DB::table('gallery')->where('gallery_id', $id)->where('is_deleted', 0)->update($values);

            if ($newFile && $old->file) {
                $this->disk()->delete('gallery/' . $old->file); // hapus foto lama
            }
        } catch (Throwable $e) {
            return Api::logFail('mengubah data galeri', $e);
        }

        return Api::ok('Data berhasil diubah');
    }

    /** Soft delete: baris ditandai terhapus, file tidak dihapus. */
    public function destroy(Request $request, string $id)
    {
        $admin = $request->attributes->get('admin');
        try {
            DB::table('gallery')->where('gallery_id', $id)->update([
                'is_deleted' => 1,
                'deleted_by' => $admin['nama'] ?? 'Admin',
                'deleted_at' => Api::nowWib(),
            ]);
        } catch (Throwable $e) {
            return Api::logFail('menghapus data galeri', $e);
        }
        return Api::ok('Foto berhasil dihapus');
    }

    /* ---------------- Proses gambar ---------------- */

    /** Validasi + simpan ke disk. Return ['filename' => ...] atau ['error' => ...]. */
    private function handleUploadedFile(?UploadedFile $file): array
    {
        if (!$file) {
            return ['error' => 'Foto belum dipilih'];
        }
        if (!$file->isValid()) {
            // Biasanya karena upload_max_filesize / post_max_size di php.ini terlalu kecil
            return ['error' => 'Ukuran foto maksimal 4MB'];
        }
        if ($file->getSize() > self::MAX_SIZE) {
            return ['error' => 'Ukuran foto maksimal 4MB'];
        }

        $ext = strtolower($file->getClientOriginalExtension());
        if (!in_array($ext, self::ALLOWED_EXT, true)) {
            return ['error' => 'Format foto harus JPG, PNG, WEBP, atau GIF'];
        }

        $hasil = $this->prosesGambar((string) file_get_contents($file->getRealPath()), $ext);
        if (!$hasil) {
            return ['error' => 'File yang diunggah bukan gambar yang valid.'];
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $hasil['ext'];
        if (!$this->disk()->put('gallery/' . $filename, $hasil['buffer'])) {
            Log::error('[SKM] Gagal menyimpan file galeri ke disk public');
            return ['error' => 'Gagal menyimpan file ke server'];
        }
        return ['filename' => $filename];
    }

    /**
     * Pastikan isi file benar-benar gambar sesuai ekstensinya, perbaiki orientasi EXIF,
     * perkecil (sisi terpanjang 1600px), dan ubah JPG/PNG/WEBP menjadi WebP.
     * GIF hanya divalidasi. Return ['buffer', 'ext'] atau null kalau bukan gambar valid.
     */
    private function prosesGambar(string $bin, string $ext): ?array
    {
        $info = @getimagesizefromstring($bin);
        if (!$info) {
            return null;
        }
        $tipe = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp', IMAGETYPE_GIF => 'gif'][$info[2]] ?? null;
        $diminta = $ext === 'jpeg' ? 'jpg' : $ext;
        if ($tipe === null || $tipe !== $diminta) {
            return null;
        }
        if ($tipe === 'gif') {
            return ['buffer' => $bin, 'ext' => 'gif'];
        }

        $lebar = (int) $info[0];
        $tinggi = (int) $info[1];
        if ($lebar * $tinggi > self::MAX_PIKSEL_PROSES) {
            return ['buffer' => $bin, 'ext' => $tipe]; // terlalu besar untuk diproses -> pakai file asli
        }

        try {
            $img = @imagecreatefromstring($bin);
            if (!$img) {
                return ['buffer' => $bin, 'ext' => $tipe];
            }

            $diubah = false;

            // Ikuti orientasi EXIF (hanya JPEG)
            if ($tipe === 'jpg' && function_exists('exif_read_data')) {
                $stream = fopen('php://memory', 'r+');
                fwrite($stream, $bin);
                rewind($stream);
                $exif = @exif_read_data($stream);
                fclose($stream);
                $orientasi = (int) ($exif['Orientation'] ?? 1);
                $sudut = [3 => 180, 6 => -90, 8 => 90][$orientasi] ?? 0;
                if ($sudut !== 0) {
                    $rot = imagerotate($img, $sudut, 0);
                    if ($rot) {
                        $img = $rot;
                        $diubah = true;
                    }
                }
            }

            $w = imagesx($img);
            $h = imagesy($img);
            $sisi = max($w, $h);
            if ($sisi > self::MAX_DIMENSI) {
                $skala = self::MAX_DIMENSI / $sisi;
                $kecil = imagescale($img, (int) round($w * $skala), (int) round($h * $skala), IMG_BICUBIC);
                if ($kecil) {
                    $img = $kecil;
                    $diubah = true;
                }
            }

            imagepalettetotruecolor($img);
            imagealphablending($img, false);
            imagesavealpha($img, true);

            ob_start();
            imagewebp($img, null, self::WEBP_QUALITY);
            $webp = (string) ob_get_clean();

            if ($webp !== '' && ($diubah || strlen($webp) < strlen($bin))) {
                return ['buffer' => $webp, 'ext' => 'webp'];
            }
            return ['buffer' => $bin, 'ext' => $tipe]; // WebP tidak lebih hemat -> pakai file asli
        } catch (Throwable $e) {
            return ['buffer' => $bin, 'ext' => $tipe]; // gagal diproses -> jangan gagalkan upload
        }
    }
}
