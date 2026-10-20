<?php

namespace App\Http\Controllers;

use App\Support\Api;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Throwable;

/** Ekspor data tamu ke .xlsx. Butuh: composer require phpoffice/phpspreadsheet */
class ExportRespondenController extends Controller
{
    public function __invoke(Request $request)
    {
        try {
            $search = trim((string) $request->query('search', ''));
            $q = DB::table('survei_responden as r')
                ->leftJoin('survei_kode_pendidikan as p', 'p.kode', '=', 'r.pendidikan_kode')
                ->leftJoin('survei_kode_pekerjaan as pk', 'pk.kode', '=', 'r.pekerjaan_kode');
            if ($search !== '') {
                $s = '%' . $search . '%';
                $q->whereRaw('(r.nama LIKE ? OR r.email LIKE ? OR r.no_telepon LIKE ?)', [$s, $s, $s]);
            }
            $rows = $q->orderByDesc('r.responden_id')->get([
                'r.nama', 'r.email', 'r.no_telepon', 'r.tanggal_terima_layanan', 'p.label as pendidikan', 'r.usia',
                'pk.label as pekerjaan', 'r.keperluan', 'r.rombongan', 'r.ketua_rombongan', 'r.jumlah_rombongan',
                'r.asal_rombongan', 'r.menginap_hotel', 'r.nama_hotel', 'r.alamat_hotel', 'r.tanggal_checkin', 'r.tanggal_checkout',
            ]);

            $head = ['No', 'Nama', 'Email', 'No. Telepon', 'Tanggal Layanan', 'Pendidikan', 'Usia', 'Pekerjaan', 'Keperluan',
                'Rombongan', 'Ketua Rombongan', 'Jumlah Rombongan', 'Asal', 'Menginap', 'Nama Hotel', 'Alamat Hotel', 'Check-in', 'Check-out'];

            $ss = new Spreadsheet();
            $sheet = $ss->getActiveSheet()->setTitle('Data Tamu');
            $sheet->fromArray($head, null, 'A1');

            $r = 2;
            foreach ($rows as $i => $x) {
                $sheet->fromArray([
                    $i + 1, $x->nama, $x->email, (string) $x->no_telepon, $x->tanggal_terima_layanan, $x->pendidikan, $x->usia,
                    $x->pekerjaan, $x->keperluan, $x->rombongan ? 'Ya' : 'Tidak', $x->ketua_rombongan, $x->jumlah_rombongan,
                    $x->asal_rombongan, $x->menginap_hotel ? 'Ya' : 'Tidak', $x->nama_hotel, $x->alamat_hotel,
                    $x->tanggal_checkin, $x->tanggal_checkout,
                ], null, 'A' . $r++);
            }

            $last = 'R';
            $sheet->getStyle("A1:{$last}1")->getFont()->setBold(true);
            $sheet->getStyle("A1:{$last}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E8EEF7');
            foreach (range('A', $last) as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            $sheet->freezePane('A2');

            $nama = 'data-tamu-' . date('Ymd-His') . '.xlsx';
            return response()->streamDownload(function () use ($ss) {
                (new Xlsx($ss))->save('php://output');
            }, $nama, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        } catch (Throwable $e) {
            return Api::logFail('mengekspor data tamu', $e);
        }
    }
}
