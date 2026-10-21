import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../lib/api.js';
import { tglPendek } from '../lib/tglAdmin.js';
import ChartCanvas from '../components/ChartCanvas.jsx';

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const WARNA = ['#0d5c3a', '#C8952C', '#5D6B59', '#8FA890', '#E0B65C', '#3a6b52', '#B5824A', '#A8B9A5', '#d9c48a', '#7c8f78'];

// Mengelompokkan jumlah tamu per hari / bulan / tahun (rombongan sudah dihitung per anggota oleh backend).
function kelompokkan(rows, mode, tahun, bulan) {
  const bucket = {};
  rows.forEach((r) => {
    const d = new Date(r.tanggal + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return;
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    let key;
    if (mode === 'harian') { if (y !== tahun || m !== bulan) return; key = day; }
    else if (mode === 'bulanan') { if (y !== tahun) return; key = m; }
    else key = y;
    bucket[key] = (bucket[key] || 0) + Number(r.jumlah_tamu);
  });

  const keys = mode === 'harian'
    ? Array.from({ length: new Date(tahun, bulan, 0).getDate() }, (_, i) => i + 1)
    : mode === 'bulanan'
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Object.keys(bucket).map(Number).sort((a, b) => a - b);

  return {
    labels: keys.map((k) => (mode === 'bulanan' ? BULAN[k - 1].slice(0, 3) : String(k))),
    values: keys.map((k) => bucket[k] || 0),
  };
}

const pieConfig = (rows) => {
  const values = rows.map((r) => r.jumlah);
  const total = values.reduce((a, b) => a + b, 0);
  return {
    type: 'pie',
    data: { labels: rows.map((r) => r.label), datasets: [{ data: values, backgroundColor: WARNA }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw} (${total ? (c.raw / total * 100).toFixed(1) : 0}%)` } },
      },
    },
  };
};

export default function Dashboard() {
  const { admin } = useOutletContext();
  const [d, setD] = useState(null);
  const [demo, setDemo] = useState(null);
  const [err, setErr] = useState('');
  const [mode, setMode] = useState('bulanan');
  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth() + 1);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => setD(r.data)).catch((e) => setErr(e.message));
    api.get('/admin/demografi-chart').then((r) => setDemo(r.data)).catch(() => {});
  }, []);

  const tahunTersedia = useMemo(() => {
    const ys = new Set();
    (d?.chart_tamu || []).forEach((r) => { const y = Number(String(r.tanggal).slice(0, 4)); if (y) ys.add(y); });
    if (!ys.size) ys.add(now.getFullYear());
    return [...ys].sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  // Kalau tahun terpilih tidak punya data, pakai tahun terbaru yang ada.
  useEffect(() => { if (d && !tahunTersedia.includes(tahun)) setTahun(tahunTersedia[0]); }, [d, tahunTersedia, tahun]);

  const g = useMemo(() => (d ? kelompokkan(d.chart_tamu || [], mode, tahun, bulan) : { labels: [], values: [] }), [d, mode, tahun, bulan]);
  const total = g.values.reduce((a, b) => a + b, 0);
  const puncak = g.values.reduce((best, v, i) => (v > (g.values[best] ?? -1) ? i : best), 0);

  const tamuCfg = useMemo(() => ({
    type: 'bar',
    data: { labels: g.labels, datasets: [{ label: 'Jumlah Tamu', data: g.values, backgroundColor: '#0d5c3a' }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, ticks: { precision: 0 } } } },
  }), [g]);
  const pendidikanCfg = useMemo(() => pieConfig(demo?.pendidikan || []), [demo]);
  const pekerjaanCfg = useMemo(() => pieConfig(demo?.pekerjaan || []), [demo]);
  const keperluanCfg = useMemo(() => ({
    type: 'bar',
    data: { labels: (demo?.keperluan || []).map((r) => r.label), datasets: [{ label: 'Jumlah Tamu', data: (demo?.keperluan || []).map((r) => r.jumlah), backgroundColor: '#0d5c3a' }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 0, ticks: { precision: 0 } } } },
  }), [demo]);

  const recent = d?.recent || [];

  return (
    <>
      <div className="top-bar">
        <h1>Dashboard</h1>
        <div className="user-info"><span>{admin.nama || 'Administrator'}</span></div>
      </div>

      {err && <div style={{ color: '#c53030', marginBottom: 12 }}>Gagal membaca database: {err}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content"><h3>Total Kunjungan</h3><p className="stat-number">{d?.total_responden ?? 0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧑‍🤝‍🧑</div>
          <div className="stat-content"><h3>Jumlah Tamu</h3><p className="stat-number">{d?.jumlah_tamu ?? 0}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🖼️</div>
          <div className="stat-content"><h3>Galeri Aktif</h3><p className="stat-number">{d?.gallery_aktif ?? 0}</p></div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-container chart-container-full">
          <div className="chart-header">
            <h2>Grafik Jumlah Tamu</h2>
            <div className="chart-controls">
              <div className="chart-period-toggle">
                {[['harian', 'Harian'], ['bulanan', 'Bulanan'], ['tahunan', 'Tahunan']].map(([k, label]) => (
                  <button key={k} type="button" className={'btn-toggle' + (mode === k ? ' active' : '')} onClick={() => setMode(k)}>{label}</button>
                ))}
              </div>
              <div className="chart-filter">
                {mode === 'harian' && (
                  <select className="filter-select-sm" value={bulan} onChange={(e) => setBulan(Number(e.target.value))}>
                    {BULAN.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
                  </select>
                )}
                {mode !== 'tahunan' && (
                  <select className="filter-select-sm" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
                    {tahunTersedia.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
          {total > 0 && (
            <div className="chart-summary">
              <div className="summary-item"><span className="summary-label">Total Tamu (periode ini)</span><span className="summary-value">{total}</span></div>
              <div className="summary-item"><span className="summary-label">Puncak Kunjungan</span><span className="summary-value">{g.labels[puncak]} ({g.values[puncak]})</span></div>
            </div>
          )}
          <div className="chart-canvas-wrap"><ChartCanvas config={tamuCfg} /></div>
        </div>

        <div className="chart-container">
          <div className="chart-header"><h2>Distribusi Pendidikan Tamu</h2></div>
          <div className="chart-canvas-wrap" style={{ height: 260 }}><ChartCanvas config={pendidikanCfg} /></div>
        </div>

        <div className="chart-container">
          <div className="chart-header"><h2>Distribusi Pekerjaan Tamu</h2></div>
          <div className="chart-canvas-wrap" style={{ height: 260 }}><ChartCanvas config={pekerjaanCfg} /></div>
        </div>

        <div className="chart-container chart-container-full">
          <div className="chart-header"><h2>Distribusi Keperluan Kunjungan</h2></div>
          <div className="chart-canvas-wrap"><ChartCanvas config={keperluanCfg} /></div>
        </div>

        <div className="recent-container">
          <h2>Tamu Terbaru</h2>
          <table className="data-table">
            <thead>
              <tr><th>No</th><th>Nama</th><th>Email</th><th>Pendidikan</th><th>Pekerjaan</th><th>Tanggal</th></tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#999' }}>{d ? 'Belum ada data tamu di database.' : 'Belum ada data'}</td></tr>
              )}
              {recent.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td><td>{r.nama || '-'}</td><td>{r.email || '-'}</td>
                  <td>{r.pendidikan || '-'}</td><td>{r.pekerjaan || '-'}</td><td>{tglPendek(r.tanggal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}