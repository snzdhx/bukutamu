import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useConfirm } from '../components/Confirm.jsx';

export default function GalleryAdmin() {
  const confirm = useConfirm();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null); // null | {} (baru) | row
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api.get('/admin/gallery').then((r) => setRows(r.data)).catch((e) => setMsg({ err: true, text: e.message }));
  }, []);
  useEffect(load, [load]);

  async function simpan(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get('photo')?.size) fd.delete('photo');
    fd.set('is_active', e.target.is_active.checked ? '1' : '0');
    try {
      const r = await api.postForm(edit.gallery_id ? '/admin/gallery/' + edit.gallery_id : '/admin/gallery', fd);
      setMsg({ text: r.message }); setEdit(null); load();
    } catch (x) { setMsg({ err: true, text: x.message }); }
  }
  async function hapus(r) {
    if (!(await confirm(`Hapus foto "${r.gallery_name}"?`))) return;
    try { const x = await api.del('/admin/gallery/' + r.gallery_id); setMsg({ text: x.message }); load(); }
    catch (e) { setMsg({ err: true, text: e.message }); }
  }

  return (
    <>
      <div className="row between"><h1>Galeri</h1><button className="btn primary" onClick={() => setEdit({})}>+ Tambah Foto</button></div>
      {msg && <div className={'alert ' + (msg.err ? 'err' : 'ok')}>{msg.text}</div>}
      <div className="gallery-grid">
        {rows.map((r) => (
          <figure key={r.gallery_id} className={r.is_active ? '' : 'off'}>
            <img src={r.file_url} alt={r.gallery_name} loading="lazy" />
            <figcaption>{r.gallery_name}{!r.is_active && ' (nonaktif)'}</figcaption>
            <div className="row">
              <button className="btn ghost" onClick={() => setEdit(r)}>Ubah</button>
              <button className="btn danger" onClick={() => hapus(r)}>Hapus</button>
            </div>
          </figure>
        ))}
      </div>

      {edit && (
        <div className="modal-back" onClick={() => setEdit(null)}>
          <form className="modal form" onClick={(e) => e.stopPropagation()} onSubmit={simpan}>
            <h2>{edit.gallery_id ? 'Ubah Foto' : 'Tambah Foto'}</h2>
            <label>Judul<input name="gallery_name" required defaultValue={edit.gallery_name || ''} /></label>
            <label>Foto (JPG/PNG/WEBP/GIF, maks 4MB){edit.gallery_id && ' — kosongkan jika tidak diganti'}
              <input name="photo" type="file" accept="image/*" required={!edit.gallery_id} />
            </label>
            <label className="check"><input name="is_active" type="checkbox" defaultChecked={edit.is_active !== 0} /> Tampilkan di halaman publik</label>
            <div className="row end">
              <button type="button" className="btn ghost" onClick={() => setEdit(null)}>Batal</button>
              <button className="btn primary">Simpan</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
