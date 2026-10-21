import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useConfirm } from '../components/Confirm.jsx';

const BATAS = 4 * 1024 * 1024;

export default function GalleryAdmin() {
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState(null); // { err, teks }
  const [edit, setEdit] = useState(null); // null | {} (baru) | baris
  const [nama, setNama] = useState('');
  const [aktif, setAktif] = useState('1');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/gallery').then((r) => setRows(r.data || []))
      .catch((e) => { setRows([]); setStatus({ err: true, teks: e.message }); });
  }, []);
  useEffect(() => { load(); }, [load]);

  // URL pratinjau dari file yang baru dipilih dilepas saat tidak dipakai lagi.
  useEffect(() => {
    if (!file) return undefined;
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  function buka(r) {
    setEdit(r || {});
    setNama(r?.gallery_name || '');
    setAktif(String(r ? Number(r.is_active) : 1));
    setFile(null);
    setPreview(r?.file_url || '');
  }
  function tutup() { setEdit(null); setFile(null); setPreview(''); }

  async function simpan(e) {
    e.preventDefault();
    if (file && file.size > BATAS) return setStatus({ err: true, teks: 'Ukuran foto maksimal 4MB.' });

    const fd = new FormData();
    fd.set('gallery_name', nama);
    fd.set('is_active', aktif);
    if (file) fd.set('photo', file);

    setBusy(true);
    try {
      await api.postForm(edit.gallery_id ? '/admin/gallery/' + edit.gallery_id : '/admin/gallery', fd);
      setStatus({ teks: 'Berhasil disimpan.' });
      tutup(); load();
    } catch (x) { setStatus({ err: true, teks: x.message }); }
    finally { setBusy(false); }
  }

  async function hapus(r) {
    const ok = await confirm('Anda yakin ingin menghapus foto ini?', { title: 'Hapus Foto', okText: 'Ya, Hapus', danger: true });
    if (!ok) return;
    try { await api.del('/admin/gallery/' + r.gallery_id); load(); }
    catch (x) { setStatus({ err: true, teks: x.message }); }
  }

  return (
    <>
      <div className="top-bar">
        <h1>Manajemen Galeri</h1>
        <button className="adm-btn btn-primary" onClick={() => buka(null)}>+ Tambah Foto</button>
      </div>

      <div style={{ marginBottom: 10, fontSize: 14, color: status?.err ? '#c53030' : '#2f855a' }}>{status?.teks}</div>

      <div className="adm-gallery-grid">
        {rows === null && <p className="gallery-empty">Memuat data...</p>}
        {rows && rows.length === 0 && <p className="gallery-empty">Belum ada foto. Klik "+ Tambah Foto" untuk mulai upload.</p>}
        {rows && rows.map((r) => (
          <div className="gallery-card" key={r.gallery_id}>
            <img src={r.file_url} alt={r.gallery_name} />
            <div className="gallery-card-body">
              <div className="gallery-card-title">{r.gallery_name}</div>
              <div className="gallery-card-status">{Number(r.is_active) === 1 ? 'Aktif' : 'Nonaktif'}</div>
              <div className="gallery-card-actions">
                <button className="adm-btn btn-secondary" onClick={() => buka(r)}>Edit</button>
                <button className="adm-btn btn-secondary" onClick={() => hapus(r)}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {edit && (
        <div className="adm-modal" onClick={(e) => { if (e.target === e.currentTarget) tutup(); }}>
          <div className="modal-content">
            <span className="close-modal" onClick={tutup}>&times;</span>
            <h2>{edit.gallery_id ? 'Edit Foto' : 'Tambah Foto'}</h2>
            <form onSubmit={simpan}>
              <div className="form-group">
                <label htmlFor="gallery-name">Judul Foto</label>
                <input type="text" id="gallery-name" required placeholder="mis. Kantor BKPP" value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="gallery-photo">File Foto (JPG/PNG/WEBP/GIF, maks 4MB — JPG/PNG otomatis dikonversi ke WebP)</label>
                <input type="file" id="gallery-photo" accept="image/jpeg,image/png,image/webp,image/gif" required={!edit.gallery_id}
                  onChange={(e) => setFile(e.target.files[0] || null)} />
                {preview && <img className="upload-preview" alt="Preview" src={preview} />}
              </div>
              <div className="form-group">
                <label htmlFor="gallery-status-select">Status</label>
                <select id="gallery-status-select" value={aktif} onChange={(e) => setAktif(e.target.value)}>
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
              <button type="submit" className="adm-btn btn-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>{' '}
              <button type="button" className="adm-btn btn-secondary" onClick={tutup}>Batal</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}