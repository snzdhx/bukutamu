import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { tanggalID } from '../lib/format.js';
import ChartCanvas from '../components/ChartCanvas.jsx';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [demo, setDemo] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setD(r.data)).catch((e) => setErr(e.message));
    api.get('/admin/demografi-chart').then((r) => setDemo(r.data)).catch(() => {});
  }, []);

  if (err) return <div className="alert err">{err}</div>;
  if (!d) return <p>Memuat…</p>;

  const pick = (rows) => ({ labels: rows.map((x) => x.label), data: rows.map((x) => x.jumlah) });

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat"><b>{d.total_responden}</b><span>Kunjungan</span></div>
        <div className="stat"><b>{d.jumlah_tamu}</b><span>Total Tamu</span></div>
        <div className="stat"><b>{d.gallery_aktif}</b><span>Foto Aktif</span></div>
      </div>

      <div className="card">
        <h2>Tamu per Hari</h2>
        <ChartCanvas type="line" label="Tamu" labels={d.chart_tamu.map((x) => tanggalID(x.tanggal))} data={d.chart_tamu.map((x) => x.jumlah_tamu)} />
      </div>

      {demo && (
        <div className="grid2">
          {[['Pendidikan', 'pendidikan', 'doughnut'], ['Pekerjaan', 'pekerjaan', 'doughnut'], ['Keperluan', 'keperluan', 'bar']].map(([t, k, type]) => {
            const c = pick(demo[k] || []);
            return <div className="card" key={k}><h2>{t}</h2><ChartCanvas type={type} label={t} labels={c.labels} data={c.data} /></div>;
          })}
        </div>
      )}

      <div className="card">
        <h2>Kunjungan Terbaru</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Tanggal</th><th>Pendidikan</th><th>Pekerjaan</th></tr></thead>
            <tbody>
              {d.recent.map((r) => (
                <tr key={r.id}><td>{r.nama}</td><td>{tanggalID(r.tanggal)}</td><td>{r.pendidikan}</td><td>{r.pekerjaan}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
