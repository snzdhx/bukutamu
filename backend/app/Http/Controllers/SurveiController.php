<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class SurveiController extends Controller
{
    /** Pilihan pendidikan, pekerjaan, dan disabilitas untuk form buku tamu. */
    public function refs()
    {
        try {
            return Api::ok('Referensi buku tamu berhasil diambil', [
                'pendidikan' => DB::table('survei_kode_pendidikan')->orderBy('kode')->get(['kode', 'label']),
                'pekerjaan' => DB::table('survei_kode_pekerjaan')->orderBy('kode')->get(['kode', 'label']),
                'disabilitas' => DB::table('survei_kode_disabilitas')->orderBy('kode')->get(['kode', 'label']),
            ]);
        } catch (Throwable $e) {
            return Api::logFail('mengambil referensi', $e);
        }
    }

    /** Menyimpan satu kunjungan tamu. */
    public function store(Request $request)
    {
        $p = $request->json()->all();
        if (!$p) {
            return Api::fail('Format JSON tidak valid');
        }

        foreach (['nama', 'tanggal_terima_layanan', 'pendidikan', 'usia', 'pekerjaan', 'asal_rombongan', 'keperluan'] as $f) {
            if (Api::empty($p[$f] ?? null)) {
                return Api::fail("Field '$f' wajib diisi");
            }
        }

        $rombongan = !empty($p['rombongan']) ? 1 : 0;
        if ($rombongan) {
            foreach (['ketua_rombongan', 'jumlah_rombongan'] as $f) {
                if (Api::empty($p[$f] ?? null)) {
                    return Api::fail("Field '$f' wajib diisi jika datang sebagai rombongan");
                }
            }
        }

        $menginap = !empty($p['menginap_hotel']) ? 1 : 0;
        if ($menginap) {
            foreach (['nama_hotel', 'alamat_hotel', 'tanggal_checkin', 'tanggal_checkout'] as $f) {
                if (empty($p[$f])) {
                    return Api::fail("Field '$f' wajib diisi jika menginap di hotel");
                }
            }
            if ($p['tanggal_checkout'] < $p['tanggal_checkin']) {
                return Api::fail('Tanggal check-out tidak boleh sebelum tanggal check-in');
            }
        }

        $tanggal = Api::clean($p['tanggal_terima_layanan']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            return Api::fail('Format tanggal kunjungan tidak valid');
        }

        $row = [
            'nama' => Api::clean($p['nama']),
            'email' => !empty($p['email']) ? Api::clean($p['email']) : null,
            'no_telepon' => !empty($p['no_telepon']) ? Api::clean($p['no_telepon']) : null,
            'tanggal_terima_layanan' => $tanggal,
            'pendidikan_kode' => (int) $p['pendidikan'],
            'usia' => (int) $p['usia'],
            'pekerjaan_kode' => (int) $p['pekerjaan'],
            'keperluan' => Api::clean($p['keperluan']),
            'rombongan' => $rombongan,
            'ketua_rombongan' => $rombongan ? Api::clean($p['ketua_rombongan']) : null,
            'jumlah_rombongan' => $rombongan ? (int) $p['jumlah_rombongan'] : null,
            'asal_rombongan' => Api::clean($p['asal_rombongan']),
            'menginap_hotel' => $menginap,
            'nama_hotel' => $menginap ? Api::clean($p['nama_hotel']) : null,
            'alamat_hotel' => $menginap ? Api::clean($p['alamat_hotel']) : null,
            'tanggal_checkin' => $menginap ? Api::clean($p['tanggal_checkin']) : null,
            'tanggal_checkout' => $menginap ? Api::clean($p['tanggal_checkout']) : null,
        ];

        try {
            $id = DB::transaction(function () use ($row, $p) {
                $id = DB::table('survei_responden')->insertGetId($row, 'responden_id');

                if (!empty($p['disabilitas']) && is_array($p['disabilitas'])) {
                    foreach (array_unique(array_map('intval', $p['disabilitas'])) as $kode) {
                        DB::table('survei_responden_disabilitas')->insertOrIgnore([
                            'responden_id' => $id,
                            'disabilitas_kode' => $kode,
                        ]);
                    }
                }
                return $id;
            });

            return Api::ok('Data kunjungan berhasil disimpan', ['responden_id' => $id]);
        } catch (Throwable $e) {
            return Api::logFail('menyimpan data kunjungan', $e, 'Gagal menyimpan data kunjungan. Silakan coba lagi.');
        }
    }
}
