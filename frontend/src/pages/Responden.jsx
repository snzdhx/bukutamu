import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { tglPendek } from '../lib/tglAdmin.js';
import { useConfirm } from '../components/Confirm.jsx';

export default function Responden() {
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState(null);
  const [galat, setGalat] = useState('');
  const [detail, setDetail] = useState(null);
  const [pesan, setPesan] = useState(null);
  const [hapusId, setHapusId] = useState(null);
  const [ekspor, setEkspor] = useState(false);
  const pertama = useRef(true);

  // Pencarian langsung (jeda 350 ms setelah berhenti mengetik).
  useEffect(() => {
    if (pertama.current) { pertama.current = false; return undefined; }
    const t = setTimeout(() => { setPage(1); setQ(search.trim()); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setGalat('');
    return api.get(`/admin/responden?page=${page}&limit=10&search=${encodeURIComponent(q)}`)
      .then((r) => setRes(r.data)).catch((e) => setGalat(e.message));
  }, [page, q]);
  useEffect(() => { load(); }, [load]);

  async function lihat(id) {
    try { setDetail((await api.get('/admin/responden/' + id)).data); }
    catch (e) { setPesan({ jenis: 'err', teks: e.message }); }
  }

  async function hapus(r) {
    const ok = await confirm(`Yakin ingin menghapus data "${r.nama || 'tamu ini'}"? Data ini TIDAK BISA dikembalikan.`,
      { title: 'Hapus Data Tamu', okText: 'Ya, Hapus', danger: true });
    if (!ok) return;
    setHapusId(r.id);
    try {
      await api.del('/admin/responden/' + r.id);
      // Kalau baris terakhir di halaman ini terhapus, mundur satu halaman.
      if (res.rows.length <= 1 && page > 1) setPage(page - 1); else await load();
    } catch (e) { setPesan({ jenis: 'err', teks: e.message }); }
    finally { setHapusId(null); }
  }

  function exportExcel() {
    const a = document.createElement('a');
    a.href = `/api/admin/responden/export${q ? '?search=' + encodeURIComponent(q) : ''}`;
    a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setEkspor(true);
    setTimeout(() => setEkspor(false), 2500); // cegah klik ganda selama unduhan berjalan
  }

  const kolom = 11;
  const ya = (teks) => <span className="badge-status badge-ya">{teks}</span>;
  const tidak = <span className="badge-status badge-tidak">Tidak</span>;
  const isi = (nilai) => nilai || '-';

  return (
    <>
      <div className="top-bar"><h1>Data Tamu</h1></div>

      {pesan && <div className={'adm-pesan ' + pesan.jenis} role="status">{pesan.teks}</div>}

      <div className="filter-section">
        <input type="text" placeholder="Cari nama..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="adm-btn btn-danger" onClick={exportExcel} disabled={ekspor}>
          {ekspor ? 'Menyiapkan berkas...' : '📊 Export Laporan Excel'}
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>No</th><th>Nama</th><th>Email</th><th>Pendidikan</th><th>Pekerjaan</th><th>Keperluan</th>
              <th>Jumlah Rombongan</th><th>Instansi/Lembaga</th><th>Hotel</th><th>Tanggal</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {!res && !galat && <tr><td colSpan={kolom} style={{ textAlign: 'center' }}>Memuat data dari database...</td></tr>}
            {galat && <tr><td colSpan={kolom} style={{ textAlign: 'center', color: '#c53030' }}>{galat}</td></tr>}
            {res && !galat && res.rows.length === 0 && (
              <tr><td colSpan={kolom} style={{ textAlign: 'center', color: '#999' }}>Tidak ada data di database.</td></tr>
            )}
            {res && !galat && res.rows.map((x, i) => (
              <tr key={x.id}>
                <td>{(res.page - 1) * res.limit + i + 1}</td>
                <td>{isi(x.nama)}</td><td>{isi(x.email)}</td><td>{isi(x.pendidikan)}</td><td>{isi(x.pekerjaan)}</td><td>{isi(x.keperluan)}</td>
                <td>{Number(x.rombongan) ? ya(`Ya (${x.jumlah_rombongan ?? '-'} orang)`) : tidak}</td>
                <td>{isi(x.asal_rombongan)}</td>
                <td>{Number(x.menginap_hotel) ? ya(x.nama_hotel || 'Ya') : tidak}</td>
                <td>{tglPendek(x.tanggal)}</td>
                <td className="aksi-responden-cell">
                  <button className="adm-btn btn-secondary btn-detail-responden" onClick={() => lihat(x.id)}>Detail</button>{' '}
                  <button className="adm-btn btn-hapus" disabled={hapusId === x.id} onClick={() => hapus(x)}>
                    {hapusId === x.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button className="adm-btn btn-secondary" disabled={!res || res.page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button>
        <span id="page-info">{res ? `Halaman ${res.page} dari ${res.pages} (${res.total} tamu)` : 'Halaman 1'}</span>
        <button className="adm-btn btn-secondary" disabled={!res || res.page >= res.pages} onClick={() => setPage(page + 1)}>Berikutnya</button>
      </div>

      {detail && (
        <div className="adm-modal" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal-content" style={{ maxWidth: 1000, maxHeight: '90vh', overflow: 'auto' }}>
            <span className="close-modal" onClick={() => setDetail(null)}>&times;</span>
            <h2>Detail Tamu</h2>
            <div className="laporan-grid">
              <div className="laporan-box">
                <p><strong>Nama:</strong> <span>{isi(detail.nama)}</span></p>
                <p><strong>Email:</strong> <span>{isi(detail.email)}</span></p>
                <p><strong>No. Telepon:</strong> <span>{isi(detail.no_telepon)}</span></p>
                <p><strong>Tanggal:</strong> <span>{tglPendek(detail.tanggal_terima_layanan)}</span></p>
                <p><strong>Usia:</strong> <span>{isi(detail.usia)}</span></p>
                <p><strong>Instansi/Lembaga:</strong> <span>{isi(detail.asal_rombongan)}</span></p>
                <p><strong>Keperluan:</strong> <span>{isi(detail.keperluan)}</span></p>
              </div>
              <div className="laporan-box">
                <p><strong>Pendidikan:</strong> <span>{isi(detail.pendidikan)}</span></p>
                <p><strong>Pekerjaan:</strong> <span>{isi(detail.pekerjaan)}</span></p>
                <p><strong>Disabilitas:</strong> <span>{(detail.disabilitas || []).map((x) => x.label).join(', ') || 'Tidak ada'}</span></p>
              </div>
              <div className="laporan-box">
                <p><strong>Rombongan:</strong> <span>{Number(detail.rombongan) ? 'Ya' : 'Tidak'}</span></p>
                <p><strong>Ketua Rombongan:</strong> <span>{isi(detail.ketua_rombongan)}</span></p>
                <p><strong>Jumlah Rombongan:</strong> <span>{detail.jumlah_rombongan ?? '-'}</span></p>
              </div>
              <div className="laporan-box">
                <p><strong>Menginap Hotel:</strong> <span>{Number(detail.menginap_hotel) ? 'Ya' : 'Tidak'}</span></p>
                <p><strong>Tanggal Check-in:</strong> <span>{tglPendek(detail.tanggal_checkin)}</span></p>
                <p><strong>Tanggal Check-out:</strong> <span>{tglPendek(detail.tanggal_checkout)}</span></p>
                <p><strong>Nama Hotel:</strong> <span>{isi(detail.nama_hotel)}</span></p>
                <p><strong>Alamat Hotel:</strong> <span>{isi(detail.alamat_hotel)}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}