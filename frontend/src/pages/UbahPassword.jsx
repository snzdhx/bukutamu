import { useState } from 'react';
import { api } from '../lib/api.js';

export default function UbahPassword() {
  const [f, setF] = useState({ password_lama: '', password_baru: '', konfirmasi: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (f.password_baru !== f.konfirmasi) return setMsg({ err: true, text: 'Konfirmasi password tidak sama' });
    try {
      const r = await api.post('/auth/change-password', f);
      setMsg({ text: r.message });
      setF({ password_lama: '', password_baru: '', konfirmasi: '' });
    } catch (x) { setMsg({ err: true, text: x.message }); }
  }

  return (
    <form className="card form narrow" onSubmit={submit}>
      <h1>Ubah Password</h1>
      {msg && <div className={'alert ' + (msg.err ? 'err' : 'ok')}>{msg.text}</div>}
      <label>Password Lama<input type="password" required value={f.password_lama} onChange={set('password_lama')} /></label>
      <label>Password Baru (min. 8 karakter)<input type="password" required minLength={8} value={f.password_baru} onChange={set('password_baru')} /></label>
      <label>Konfirmasi<input type="password" required value={f.konfirmasi} onChange={set('konfirmasi')} /></label>
      <button className="btn primary">Simpan</button>
    </form>
  );
}
