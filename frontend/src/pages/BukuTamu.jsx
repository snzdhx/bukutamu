import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { hariIni } from '../lib/format.js';

const AWAL = {
  nama: '', email: '', no_telepon: '', tanggal_terima_layanan: hariIni(), pendidikan: '', usia: '',
  pekerjaan: '', keperluan: '', asal_rombongan: '', rombongan: false, ketua_rombongan: '', jumlah_rombongan: '',
  menginap_hotel: false, nama_hotel: '', alamat_hotel: '', tanggal_checkin: '', tanggal_checkout: '', disabilitas: [],
};

export default function BukuTamu() {
  const [refs, setRefs] = useState({ pendidikan: [], pekerjaan: [], disabilitas: [] });
  const [f, setF] = useState(AWAL);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/survei/refs').then((r) => setRefs(r.data)).catch((e) => setMsg({ err: true, text: e.message }));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggleDis = (kode) =>
    setF({ ...f, disabilitas: f.disabilitas.includes(kode) ? f.disabilitas.filter((x) => x !== kode) : [...f.disabilitas, kode] });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await api.post('/survei', {
        ...f,
        pendidikan: Number(f.pendidikan), pekerjaan: Number(f.pekerjaan), usia: Number(f.usia),
        jumlah_rombongan: f.rombongan ? Number(f.jumlah_rombongan) : null,
      });
      setMsg({ text: r.message });
      setF({ ...AWAL, tanggal_terima_layanan: hariIni() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMsg({ err: true, text: err.message });
    } finally { setBusy(false); }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Buku Tamu</h1>
      {msg && <div className={'alert ' + (msg.err ? 'err' : 'ok')}>{msg.text}</div>}

      <label>Nama *<input required value={f.nama} onChange={set('nama')} /></label>
      <div className="grid2">
        <label>Email<input type="email" value={f.email} onChange={set('email')} /></label>
        <label>No. Telepon<input value={f.no_telepon} onChange={set('no_telepon')} /></label>
      </div>
      <div className="grid2">
        <label>Tanggal Kunjungan *<input required type="date" value={f.tanggal_terima_layanan} onChange={set('tanggal_terima_layanan')} /></label>
        <label>Usia *<input required type="number" min="1" max="120" value={f.usia} onChange={set('usia')} /></label>
      </div>
      <div className="grid2">
        <label>Pendidikan *
          <select required value={f.pendidikan} onChange={set('pendidikan')}>
            <option value="">— pilih —</option>
            {refs.pendidikan.map((x) => <option key={x.kode} value={x.kode}>{x.label}</option>)}
          </select>
        </label>
        <label>Pekerjaan *
          <select required value={f.pekerjaan} onChange={set('pekerjaan')}>
            <option value="">— pilih —</option>
            {refs.pekerjaan.map((x) => <option key={x.kode} value={x.kode}>{x.label}</option>)}
          </select>
        </label>
      </div>
      <label>Asal / Instansi *<input required value={f.asal_rombongan} onChange={set('asal_rombongan')} /></label>
      <label>Keperluan *<textarea required rows="3" value={f.keperluan} onChange={set('keperluan')} /></label>

      {refs.disabilitas.length > 0 && (
        <fieldset>
          <legend>Disabilitas (jika ada)</legend>
          {refs.disabilitas.map((x) => (
            <label key={x.kode} className="check">
              <input type="checkbox" checked={f.disabilitas.includes(x.kode)} onChange={() => toggleDis(x.kode)} /> {x.label}
            </label>
          ))}
        </fieldset>
      )}

      <label className="check"><input type="checkbox" checked={f.rombongan} onChange={set('rombongan')} /> Datang sebagai rombongan</label>
      {f.rombongan && (
        <div className="grid2">
          <label>Ketua Rombongan *<input required value={f.ketua_rombongan} onChange={set('ketua_rombongan')} /></label>
          <label>Jumlah Anggota *<input required type="number" min="1" value={f.jumlah_rombongan} onChange={set('jumlah_rombongan')} /></label>
        </div>
      )}

      <label className="check"><input type="checkbox" checked={f.menginap_hotel} onChange={set('menginap_hotel')} /> Menginap di hotel</label>
      {f.menginap_hotel && (
        <>
          <div className="grid2">
            <label>Nama Hotel *<input required value={f.nama_hotel} onChange={set('nama_hotel')} /></label>
            <label>Alamat Hotel *<input required value={f.alamat_hotel} onChange={set('alamat_hotel')} /></label>
          </div>
          <div className="grid2">
            <label>Check-in *<input required type="date" value={f.tanggal_checkin} onChange={set('tanggal_checkin')} /></label>
            <label>Check-out *<input required type="date" min={f.tanggal_checkin} value={f.tanggal_checkout} onChange={set('tanggal_checkout')} /></label>
          </div>
        </>
      )}

      <button className="btn primary big" disabled={busy}>{busy ? 'Menyimpan…' : 'Kirim'}</button>
    </form>
  );
}
