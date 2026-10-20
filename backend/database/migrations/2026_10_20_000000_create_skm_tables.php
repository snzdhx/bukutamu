<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Skema Buku Tamu BKPSDM (MySQL / MariaDB (Laragon)).
 * Setiap tabel hanya dibuat kalau BELUM ada, jadi aman dijalankan di database lama.
 * Tabel referensi (kode_*) diisi nilai bawaan HANYA bila masih kosong; sesuaikan / impor data lama bila perlu.
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('admin_users')) {
            Schema::create('admin_users', function (Blueprint $t) {
                $t->increments('admin_id');
                $t->string('username', 100)->unique();
                $t->string('password_hash');
                $t->string('nama')->nullable();
                $t->smallInteger('is_active')->default(1);
                $t->timestamp('last_login_at')->nullable();
            });
        }

        foreach (['survei_kode_pendidikan', 'survei_kode_pekerjaan', 'survei_kode_disabilitas'] as $nama) {
            if (!Schema::hasTable($nama)) {
                Schema::create($nama, function (Blueprint $t) {
                    $t->smallInteger('kode')->primary();
                    $t->string('label');
                });
            }
        }

        if (!Schema::hasTable('survei_responden')) {
            Schema::create('survei_responden', function (Blueprint $t) {
                $t->increments('responden_id');
                $t->string('nama');
                $t->string('email')->nullable();
                $t->string('no_telepon', 50)->nullable();
                $t->date('tanggal_terima_layanan');
                $t->smallInteger('pendidikan_kode');
                $t->smallInteger('usia');
                $t->smallInteger('pekerjaan_kode');
                $t->text('keperluan');
                $t->smallInteger('rombongan')->default(0);
                $t->string('ketua_rombongan')->nullable();
                $t->integer('jumlah_rombongan')->nullable();
                $t->string('asal_rombongan');
                $t->smallInteger('menginap_hotel')->default(0);
                $t->string('nama_hotel')->nullable();
                $t->text('alamat_hotel')->nullable();
                $t->date('tanggal_checkin')->nullable();
                $t->date('tanggal_checkout')->nullable();
            });
        }

        if (!Schema::hasTable('survei_responden_disabilitas')) {
            Schema::create('survei_responden_disabilitas', function (Blueprint $t) {
                $t->integer('responden_id');
                $t->smallInteger('disabilitas_kode');
                $t->primary(['responden_id', 'disabilitas_kode']);
            });
        }

        if (!Schema::hasTable('gallery')) {
            Schema::create('gallery', function (Blueprint $t) {
                $t->string('gallery_id', 32)->primary();
                $t->string('gallery_name');
                $t->string('file');
                $t->string('created_by')->nullable();
                $t->timestamp('created_at')->nullable();
                $t->string('updated_by')->nullable();
                $t->timestamp('updated_at')->nullable();
                $t->smallInteger('is_active')->default(1);
                $t->smallInteger('is_deleted')->default(0);
                $t->string('deleted_by')->nullable();
                $t->timestamp('deleted_at')->nullable();
            });
        }

        $this->seed();
    }

    private function seed(): void
    {
        $data = [
            'survei_kode_pendidikan' => ['SD / sederajat', 'SMP / sederajat', 'SMA / SMK / sederajat', 'D1 - D3', 'S1 / D4', 'S2', 'S3'],
            'survei_kode_pekerjaan' => ['PNS', 'TNI / Polri', 'Pegawai Swasta', 'Wirausaha', 'Pelajar / Mahasiswa', 'Lainnya'],
            'survei_kode_disabilitas' => ['Disabilitas fisik', 'Disabilitas sensorik (netra)', 'Disabilitas sensorik (rungu)', 'Disabilitas intelektual', 'Disabilitas mental'],
        ];
        foreach ($data as $tabel => $labels) {
            if (DB::table($tabel)->count() === 0) {
                foreach ($labels as $i => $label) {
                    DB::table($tabel)->insert(['kode' => $i + 1, 'label' => $label]);
                }
            }
        }
    }

    public function down(): void
    {
        // Sengaja kosong: jangan menghapus data buku tamu lewat rollback.
    }
};
