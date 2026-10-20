import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { tanggalID } from '../lib/format.js';
import { useConfirm } from '../components/Confirm.jsx';

export default function Responden() {
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api.get(`/admin/responden?page=${page}&limit=10&search=${encodeURIComponent(q)}`)
      .then((r) => setRes(r.data)).catch((e) => setMsg({ err: true, text: e.message }));
  }, [page, q]);
  useEffect(load, [load]);

  async function lihat(id) {
    try { setDetail((await api.get('/admin/responden/' + id)).data); } catch (e) { setMsg({ err: true, text: e.message }); }
  }
  async function hapus(r) {
    if (!(await confirm(`Hapus data "${r.nama}"?`))) return;
    try { const x = await api.del('/admin/responden/' + r.id); setMsg({ text: x.message }); load(); }
    catch (e) { setMsg({ err: true, text: e.message }); }
  }

  return (
    <>
      <h1>Data Tamu</h1>
      {msg && <div className={'alert ' + (msg.err ? 'err' : 'ok')}>{msg.text}</div>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(search); }}>
        <input placeholder="Cari nama / email / telepon" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn primary">Cari</button>
        <a className="btn ghost" href={`/api/admin/responden/export?search=${encodeURIComponent(q)}`}>Ekspor Excel</a>
      </form>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Nama</th><th>Tanggal</th><th>Kontak</th><th>Keperluan</th><th></th></tr></thead>
          <tbody>
            {res?.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nama}</td><td>{tanggalID(r.tanggal)}</td>
                <td>{r.email}<br />{r.no_telepon}</td><td>{r.keperluan}</td>
                <td className="nowrap">
                  <button className="btn ghost" onClick={() => lihat(r.id)}>Detail</button>{' '}
                  <button className="btn danger" onClick={() => hapus(r)}>Hapus</button>
                </td>
              </tr>
            ))}
            {res && res.rows.length === 0 && <tr><td colSpan="5">Tidak ada data.</td></tr>}
          </tbody>
        </table>
      </div>

      {res && (
        <div className="row">
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          <span>Halaman {res.page} / {res.pages} ({res.total} data)</span>
          <button className="btn ghost" disabled={page >= res.pages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      )}

      {detail && (
        <div className="modal-back" onClick={() => setDetail(null)}>
          <div className="modal wide" onClick={(e) => e.stopPropagation()}>
            <h2>{detail.nama}</h2>
            <dl>
              {[['Email', detail.email], ['Telepon', detail.no_telepon], ['Tanggal', tanggalID(detail.tanggal_terima_layanan)],
                ['Pendidikan', detail.pendidikan], ['Usia', detail.usia], ['Pekerjaan', detail.pekerjaan], ['Asal', detail.asal_rombongan],
                ['Keperluan', detail.keperluan],
                ['Rombongan', detail.rombongan ? `Ya — ketua ${detail.ketua_rombongan}, ${detail.jumlah_rombongan} orang` : 'Tidak'],
                ['Hotel', detail.menginap_hotel ? `${detail.nama_hotel}, ${detail.alamat_hotel} (${tanggalID(detail.tanggal_checkin)} – ${tanggalID(detail.tanggal_checkout)})` : 'Tidak menginap'],
                ['Disabilitas', detail.disabilitas?.map((x) => x.label).join(', ') || '-']].map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v || '-'}</dd></div>
              ))}
            </dl>
            <div className="row end"><button className="btn ghost" onClick={() => setDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}
    </>
  );
}
