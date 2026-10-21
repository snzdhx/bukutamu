import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';

const KOSONG = { lama: '', baru: '', ulang: '' };

export default function UbahPassword() {
  const { admin } = useOutletContext();
  const [f, setF] = useState(KOSONG);
  const [pesan, setPesan] = useState(null); // { jenis: 'err' | 'ok', teks }
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function ubah() {
    if (!f.lama || !f.baru || !f.ulang) return setPesan({ jenis: 'err', teks: 'Semua kolom wajib diisi.' });
    if (f.baru.length < 8) return setPesan({ jenis: 'err', teks: 'Password baru minimal 8 karakter.' });
    if (f.baru !== f.ulang) return setPesan({ jenis: 'err', teks: 'Password baru dan ulangannya tidak sama.' });

    setBusy(true);
    try {
      await api.post('/auth/change-password', { password_lama: f.lama, password_baru: f.baru });
      setPesan({ jenis: 'ok', teks: 'Password berhasil diganti.' });
      setF(KOSONG);
    } catch (e) {
      setPesan({ jenis: 'err', teks: e.message });
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="top-bar">
        <h1>Ubah Password</h1>
        <div className="user-info"><span>{admin.nama || 'Administrator'}</span></div>
      </div>

      <div className="table-container" style={{ maxWidth: 460, padding: 24 }}>
        {pesan && <div className={'adm-pesan ' + pesan.jenis} role="status">{pesan.teks}</div>}

        <div className="form-group">
          <label htmlFor="password-lama">Password Saat Ini</label>
          <input type="password" id="password-lama" className="search-input" style={{ width: '100%' }}
            autoComplete="current-password" value={f.lama} onChange={set('lama')} />
        </div>
        <div className="form-group">
          <label htmlFor="password-baru">Password Baru</label>
          <input type="password" id="password-baru" className="search-input" style={{ width: '100%' }}
            autoComplete="new-password" minLength={8} value={f.baru} onChange={set('baru')} />
          <small style={{ color: '#777' }}>Minimal 8 karakter.</small>
        </div>
        <div className="form-group">
          <label htmlFor="password-baru-ulang">Ulangi Password Baru</label>
          <input type="password" id="password-baru-ulang" className="search-input" style={{ width: '100%' }}
            autoComplete="new-password" minLength={8} value={f.ulang} onChange={set('ulang')} />
        </div>

        <button className="adm-btn btn-primary" onClick={ubah} disabled={busy}>
          {busy ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </div>
    </>
  );
}