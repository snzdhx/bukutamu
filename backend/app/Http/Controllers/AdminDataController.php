<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AdminDataController extends Controller
{
    private function respondenBase()
    {
        return DB::table('survei_responden as r')
            ->leftJoin('survei_kode_pendidikan as p', 'p.kode', '=', 'r.pendidikan_kode')
            ->leftJoin('survei_kode_pekerjaan as pk', 'pk.kode', '=', 'r.pekerjaan_kode');
    }

    public function dashboard()
    {
        try {
            $totalResponden = (int) DB::table('survei_responden')->count();
            $galleryAktif = (int) DB::table('gallery')->where('is_deleted', 0)->where('is_active', 1)->count();

            // Rombongan dihitung sejumlah anggotanya; kunjungan sendiri dihitung 1 orang.
            $jumlahTamu = (int) DB::table('survei_responden')->selectRaw(
                'COALESCE(SUM(CASE WHEN rombongan = 1 AND jumlah_rombongan > 0 THEN jumlah_rombongan ELSE 1 END), 0) AS n'
            )->value('n');

            $recent = $this->respondenBase()
                ->orderByDesc('r.responden_id')->limit(10)
                ->get(['r.responden_id as id', 'r.nama', 'r.email', 'r.no_telepon',
                    'r.tanggal_terima_layanan as tanggal', 'r.usia', 'p.label as pendidikan', 'pk.label as pekerjaan']);

            $chart = DB::select(
                "SELECT tanggal, SUM(jumlah_orang) AS jumlah_tamu
                 FROM (
                   SELECT tanggal_terima_layanan AS tanggal,
                          CASE WHEN rombongan = 1 AND jumlah_rombongan > 0 THEN jumlah_rombongan ELSE 1 END AS jumlah_orang
                   FROM survei_responden WHERE tanggal_terima_layanan IS NOT NULL
                 ) t GROUP BY tanggal ORDER BY tanggal ASC"
            );
            $chartTamu = array_map(fn ($r) => ['tanggal' => (string) $r->tanggal, 'jumlah_tamu' => (int) $r->jumlah_tamu], $chart);

            return Api::ok('Dashboard berhasil diambil dari database.', [
                'total_responden' => $totalResponden,
                'gallery_aktif' => $galleryAktif,
                'jumlah_tamu' => $jumlahTamu,
                'recent' => $recent,
                'chart_tamu' => $chartTamu,
            ]);
        } catch (Throwable $e) {
            return Api::logFail('mengambil data admin', $e);
        }
    }

    public function responden(Request $request)
    {
        try {
            $search = trim((string) $request->query('search', ''));
            $page = max(1, (int) $request->query('page', 1));
            $limit = min(100, max(5, (int) ($request->query('limit', 10) ?: 10)));

            $apply = function ($q) use ($search) {
                if ($search !== '') {
                    $s = '%' . $search . '%';
                    $q->whereRaw('(r.nama LIKE ? OR r.email LIKE ? OR r.no_telepon LIKE ?)', [$s, $s, $s]);
                }
                return $q;
            };

            $total = (int) $apply(DB::table('survei_responden as r'))->count();

            $rows = $apply($this->respondenBase())
                ->orderByDesc('r.responden_id')
                ->offset(($page - 1) * $limit)->limit($limit)
                ->get(['r.responden_id as id', 'r.nama', 'r.email', 'r.no_telepon', 'r.tanggal_terima_layanan as tanggal',
                    'r.usia', 'r.keperluan', 'r.rombongan', 'r.ketua_rombongan', 'r.jumlah_rombongan', 'r.asal_rombongan',
                    'r.menginap_hotel', 'r.tanggal_checkin', 'r.tanggal_checkout', 'r.nama_hotel', 'r.alamat_hotel',
                    'p.label as pendidikan', 'pk.label as pekerjaan']);

            return Api::ok('Data tamu berhasil diambil dari database.', [
                'rows' => $rows,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => max(1, (int) ceil($total / $limit)),
            ]);
        } catch (Throwable $e) {
            return Api::logFail('mengambil data admin', $e);
        }
    }

    public function respondenDetail(int $id)
    {
        try {
            $row = $this->respondenBase()->where('r.responden_id', $id)
                ->first(['r.*', 'p.label as pendidikan', 'pk.label as pekerjaan']);
            if (!$row) {
                return Api::fail('Data tamu tidak ditemukan.');
            }

            $disabilitas = DB::table('survei_responden_disabilitas as d')
                ->leftJoin('survei_kode_disabilitas as x', 'x.kode', '=', 'd.disabilitas_kode')
                ->where('d.responden_id', $id)->orderBy('d.disabilitas_kode')
                ->get(['d.disabilitas_kode as kode', 'x.label']);

            return Api::ok('Detail tamu berhasil diambil.', array_merge((array) $row, ['disabilitas' => $disabilitas]));
        } catch (Throwable $e) {
            return Api::logFail('mengambil data admin', $e);
        }
    }

    /** Menghapus satu data tamu beserta data disabilitasnya. */
    public function respondenDelete(int $id)
    {
        $row = DB::table('survei_responden')->where('responden_id', $id)->first(['nama']);
        if (!$row) {
            return Api::fail('Data tamu tidak ditemukan atau sudah dihapus sebelumnya.');
        }
        $nama = $row->nama ?: 'tamu ini';

        try {
            DB::transaction(function () use ($id) {
                DB::table('survei_responden_disabilitas')->where('responden_id', $id)->delete();
                if (DB::table('survei_responden')->where('responden_id', $id)->delete() < 1) {
                    throw new \RuntimeException('Data tamu tidak berhasil dihapus.');
                }
            });
        } catch (Throwable $e) {
            return Api::logFail('menghapus data tamu', $e);
        }

        return Api::ok('Data tamu "' . $nama . '" berhasil dihapus.');
    }

    /** Grafik distribusi: Pendidikan, Pekerjaan, Keperluan (8 teratas + "Lainnya"). */
    public function demografiChart()
    {
        try {
            $num = fn (array $rows) => array_map(fn ($r) => ['label' => $r->label, 'jumlah' => (int) $r->jumlah], $rows);

            $pendidikan = $num(DB::select(
                "SELECT COALESCE(p.label, 'Tidak diisi') AS label, COUNT(*) AS jumlah
                 FROM survei_responden r LEFT JOIN survei_kode_pendidikan p ON p.kode = r.pendidikan_kode
                 GROUP BY 1 ORDER BY 2 DESC, 1 ASC"));

            $pekerjaan = $num(DB::select(
                "SELECT COALESCE(pk.label, 'Tidak diisi') AS label, COUNT(*) AS jumlah
                 FROM survei_responden r LEFT JOIN survei_kode_pekerjaan pk ON pk.kode = r.pekerjaan_kode
                 GROUP BY 1 ORDER BY 2 DESC, 1 ASC"));

            $raw = $num(DB::select(
                "SELECT COALESCE(NULLIF(TRIM(keperluan), ''), 'Tidak diisi') AS label, COUNT(*) AS jumlah
                 FROM survei_responden GROUP BY 1 ORDER BY 2 DESC, 1 ASC"));

            $keperluan = array_slice($raw, 0, 8);
            $sisa = array_slice($raw, 8);
            if ($sisa) {
                $keperluan[] = ['label' => 'Lainnya', 'jumlah' => array_sum(array_column($sisa, 'jumlah'))];
            }

            return Api::ok('Grafik distribusi pengunjung berhasil diambil dari database.', [
                'pendidikan' => $pendidikan,
                'pekerjaan' => $pekerjaan,
                'keperluan' => $keperluan,
            ]);
        } catch (Throwable $e) {
            return Api::logFail('mengambil data admin', $e);
        }
    }
}
