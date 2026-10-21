import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { hariIni, tanggalID } from '../lib/format.js';
import '../guestbook.css';
import '../kiosk-icons.css';

const AWAL = {
  nama: '', email: '', no_telepon: '', tanggal_terima_layanan: '', pendidikan: '', usia: '',
  pekerjaan: '', keperluan: '', asal_rombongan: '', rombongan: false, ketua_rombongan: '', jumlah_rombongan: '',
  menginap_hotel: false, nama_hotel: '', alamat_hotel: '', tanggal_checkin: '', tanggal_checkout: '', disabilitas: [],
};

const labelDari = (daftar, kode) => (daftar || []).find((x) => Number(x.kode) === Number(kode))?.label || '-';

export default function BukuTamu() {
  const navigate = useNavigate();
  const [refs, setRefs] = useState({ pendidikan: [], pekerjaan: [], disabilitas: [] });
  const [f, setF] = useState({ ...AWAL, tanggal_terima_layanan: hariIni() });
  const [langkah, setLangkah] = useState(1); // 1 = data diri, 2 = konfirmasi
  const [selesai, setSelesai] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState(null);
  const timer = useRef(null);

  // Tema Jogja dipasang pada <body> hanya selama halaman ini terbuka.
  useEffect(() => {
    document.body.classList.add('jogja', 'gb-body');
    return () => {
      document.body.classList.remove('jogja', 'gb-body');
      clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    api.get('/survei/refs').then((r) => setRefs(r.data)).catch((e) => setPesan('Gagal memuat data dari database: ' + e.message));
  }, []);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setBool = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleDis = (kode) =>
    setF((s) => ({ ...s, disabilitas: s.disabilitas.includes(kode) ? s.disabilitas.filter((x) => x !== kode) : [...s.disabilitas, kode] }));

  const pindah = (n) => { setLangkah(n); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  function lanjut(e) {
    e.preventDefault(); // validasi bawaan browser sudah lolos
    if (f.menginap_hotel && f.tanggal_checkin && f.tanggal_checkout && f.tanggal_checkout < f.tanggal_checkin) {
      setPesan('Tanggal check-out tidak boleh sebelum tanggal check-in.');
      return;
    }
    setPesan(null);
    pindah(2);
  }

  async function simpan() {
    if (busy) return;
    setBusy(true); setPesan(null);
    try {
      await api.post('/survei', {
        nama: f.nama.trim(),
        email: f.email.trim() || null,
        no_telepon: f.no_telepon.trim() || null,
        tanggal_terima_layanan: f.tanggal_terima_layanan,
        pendidikan: Number(f.pendidikan),
        usia: Number(f.usia),
        pekerjaan: Number(f.pekerjaan),
        disabilitas: f.disabilitas.map(Number),
        asal_rombongan: f.asal_rombongan.trim(),
        keperluan: f.keperluan.trim(),
        rombongan: f.rombongan,
        ketua_rombongan: f.rombongan ? f.ketua_rombongan.trim() : null,
        jumlah_rombongan: f.rombongan ? Number(f.jumlah_rombongan) : null,
        menginap_hotel: f.menginap_hotel,
        nama_hotel: f.menginap_hotel ? f.nama_hotel.trim() : null,
        alamat_hotel: f.menginap_hotel ? f.alamat_hotel.trim() : null,
        tanggal_checkin: f.menginap_hotel ? f.tanggal_checkin : null,
        tanggal_checkout: f.menginap_hotel ? f.tanggal_checkout : null,
      });
      setSelesai(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      timer.current = setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setPesan('Data gagal disimpan. ' + err.message);
      setBusy(false);
    }
  }

  const ringkasan = [
    ['Nama', f.nama],
    ['Email', f.email || '-'],
    ['No. Telepon', f.no_telepon || '-'],
    ['Tanggal kunjungan', tanggalID(f.tanggal_terima_layanan)],
    ['Usia', f.usia],
    ['Pendidikan terakhir', labelDari(refs.pendidikan, f.pendidikan)],
    ['Pekerjaan', labelDari(refs.pekerjaan, f.pekerjaan)],
    ['Disabilitas', f.disabilitas.length ? f.disabilitas.map((k) => labelDari(refs.disabilitas, k)).join(', ') : 'Tidak ada'],
    ['Instansi/Lembaga', f.asal_rombongan],
    ['Keperluan kunjungan', f.keperluan],
    ['Berkunjung sebagai rombongan', f.rombongan ? 'Ya' : 'Tidak'],
    ...(f.rombongan ? [['Ketua rombongan', f.ketua_rombongan || '-'], ['Jumlah anggota rombongan', f.jumlah_rombongan || '-']] : []),
    ['Menginap di hotel', f.menginap_hotel ? 'Ya' : 'Tidak'],
    ...(f.menginap_hotel
      ? [['Nama hotel', f.nama_hotel || '-'], ['Alamat hotel', f.alamat_hotel || '-'],
         ['Tanggal check-in', tanggalID(f.tanggal_checkin)], ['Tanggal check-out', tanggalID(f.tanggal_checkout)]]
      : []),
  ];

  return (
    <>
      <div className="container">
        <div className="guestbook-page survey-page">
          {/* Kepala halaman */}
          <header className="jg-head">
            <svg className="jg-head-tugu" viewBox="0 0 46 78" aria-hidden="true">
              <circle cx="23" cy="8" r="5" fill="#f0d79a" />
              <path d="M23 13 L27 21 H19 Z" fill="#f0d79a" />
              <rect x="17" y="21" width="12" height="4" rx="1" fill="#f0d79a" />
              <path d="M18.5 25 h9 l2 36 h-13 Z" fill="#ffffff" opacity=".92" />
              <rect x="13" y="61" width="20" height="5" rx="1.5" fill="#f0d79a" />
              <path d="M10 66 h26 l3 12 H7 Z" fill="#ffffff" opacity=".82" />
            </svg>
            <div className="jg-head-teks">
              <h1>Buku Tamu</h1>
              <p>Isi data diri Anda, lalu periksa kembali sebelum disimpan.</p>
              <span className="jg-head-instansi">
                Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Yogyakarta
              </span>
            </div>
            <Link to="/" className="jg-pulang"><i className="fas fa-arrow-left" /> Beranda</Link>
          </header>

          {!selesai && (
            <div className="jg-langkah">
              <span className={langkah === 1 ? 'jg-aktif' : ''}><b>1</b> Data diri</span>
              <i className="fas fa-chevron-right" />
              <span className={langkah === 2 ? 'jg-aktif' : ''}><b>2</b> Konfirmasi</span>
            </div>
          )}

          {!selesai && (
            <div className="guestbook-content survey-content">
              {pesan && <div className="jg-pesan err" role="alert">{pesan}</div>}

              {/* LANGKAH 1: DATA DIRI */}
              <div className={'survey-step' + (langkah === 1 ? ' active' : '')}>
                <h2>Data diri singkat</h2>
                <p className="progress-text">Data ini hanya dipakai untuk rekap internal, tidak dipublikasikan.</p>

                <form onSubmit={lanjut}>
                  <div className="jg-grup">
                    <div className="form-group">
                      <label htmlFor="nama">Nama <span className="required">*</span></label>
                      <input type="text" id="nama" placeholder="Contoh: Budi Santoso" autoComplete="name" required
                        value={f.nama} onChange={set('nama')} />
                    </div>

                    <div className="jg-baris">
                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="nama@email.com" autoComplete="email"
                          value={f.email} onChange={set('email')} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="no_telepon">No. Handphone <span className="required">*</span></label>
                        <input type="tel" id="no_telepon" placeholder="08xxxxxxxxxx" autoComplete="tel" required
                          value={f.no_telepon} onChange={set('no_telepon')} />
                      </div>
                    </div>

                    <div className="jg-baris">
                      <div className="form-group">
                        <label htmlFor="tanggal_terima_layanan">Tanggal Kunjungan <span className="required">*</span></label>
                        <input type="date" id="tanggal_terima_layanan" required
                          value={f.tanggal_terima_layanan} onChange={set('tanggal_terima_layanan')} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="usia">Usia <span className="required">*</span></label>
                        <input type="number" id="usia" min="1" max="120" inputMode="numeric" placeholder="Contoh: 34" required
                          value={f.usia} onChange={set('usia')} />
                      </div>
                    </div>

                    <div className="jg-baris">
                      <div className="form-group">
                        <label htmlFor="pendidikan">Pendidikan terakhir <span className="required">*</span></label>
                        <select id="pendidikan" required value={f.pendidikan} onChange={set('pendidikan')}>
                          <option value="">Pilih</option>
                          {refs.pendidikan.map((x) => <option key={x.kode} value={x.kode}>{x.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="pekerjaan">Pekerjaan <span className="required">*</span></label>
                        <select id="pekerjaan" required value={f.pekerjaan} onChange={set('pekerjaan')}>
                          <option value="">Pilih</option>
                          {refs.pekerjaan.map((x) => <option key={x.kode} value={x.kode}>{x.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Penyandang disabilitas / pendamping penyandang disabilitas</label>
                      <span className="jg-bantu">Boleh dikosongkan kalau tidak ada. Boleh pilih lebih dari satu.</span>
                      <div className="jg-baris">
                        {refs.disabilitas.map((x) => (
                          <label className="jg-checkbox" key={x.kode}>
                            <input type="checkbox" checked={f.disabilitas.includes(x.kode)} onChange={() => toggleDis(x.kode)} />
                            {x.label}
                          </label>
                        ))}
                      </div>
                      {f.disabilitas.length > 0 && (
                        <div className="jg-bantuan-disabilitas" role="status">
                          <strong>Kami siap membantu.</strong> Silakan sampaikan kepada petugas
                          resepsionis kami untuk dibantu mengisi formulir ini.
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="asal_rombongan">Instansi/Lembaga <span className="required">*</span></label>
                      <input type="text" id="asal_rombongan" required
                        placeholder='Contoh: Pemerintah Kabupaten Sleman (tulis "Pribadi" jika tidak mewakili instansi)'
                        value={f.asal_rombongan} onChange={set('asal_rombongan')} />
                    </div>

                    <div className="form-group">
                      <label htmlFor="keperluan">Keperluan kunjungan <span className="required">*</span></label>
                      <input type="text" id="keperluan" required
                        placeholder="Contoh: Konsultasi kepegawaian, studi tiru, pengajuan cuti, dll"
                        value={f.keperluan} onChange={set('keperluan')} />
                    </div>

                    {/* Rombongan */}
                    <div className="form-group">
                      <label>Apakah Anda berkunjung sebagai rombongan? <span className="required">*</span></label>
                      <div className="jg-baris">
                        <label className="jg-checkbox">
                          <input type="radio" name="rombongan" checked={f.rombongan} onChange={() => setBool('rombongan', true)} />
                          Ya, saya datang berombongan
                        </label>
                        <label className="jg-checkbox">
                          <input type="radio" name="rombongan" checked={!f.rombongan}
                            onChange={() => setF((s) => ({ ...s, rombongan: false, ketua_rombongan: '', jumlah_rombongan: '' }))} />
                          Tidak, saya datang sendiri
                        </label>
                      </div>
                    </div>

                    {f.rombongan && (
                      <div className="jg-subgrup">
                        <div className="jg-baris">
                          <div className="form-group">
                            <label htmlFor="ketua_rombongan">Nama ketua rombongan <span className="required">*</span></label>
                            <input type="text" id="ketua_rombongan" placeholder="Contoh: Budi Santoso" required
                              value={f.ketua_rombongan} onChange={set('ketua_rombongan')} />
                          </div>
                          <div className="form-group">
                            <label htmlFor="jumlah_rombongan">Jumlah anggota rombongan <span className="required">*</span></label>
                            <input type="number" id="jumlah_rombongan" min="1" inputMode="numeric" placeholder="Contoh: 15" required
                              value={f.jumlah_rombongan} onChange={set('jumlah_rombongan')} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Menginap di hotel */}
                    <div className="form-group">
                      <label>Apakah Anda menginap di hotel selama kunjungan ini?</label>
                      <div className="jg-baris">
                        <label className="jg-checkbox">
                          <input type="radio" name="menginap_hotel" checked={f.menginap_hotel} onChange={() => setBool('menginap_hotel', true)} />
                          Ya, saya menginap di hotel
                        </label>
                        <label className="jg-checkbox">
                          <input type="radio" name="menginap_hotel" checked={!f.menginap_hotel}
                            onChange={() => setF((s) => ({ ...s, menginap_hotel: false, nama_hotel: '', alamat_hotel: '', tanggal_checkin: '', tanggal_checkout: '' }))} />
                          Tidak menginap
                        </label>
                      </div>
                    </div>

                    {f.menginap_hotel && (
                      <div className="jg-subgrup">
                        <div className="jg-baris">
                          <div className="form-group">
                            <label htmlFor="nama_hotel">Nama hotel <span className="required">*</span></label>
                            <input type="text" id="nama_hotel" placeholder="Contoh: Hotel Grand Yogyakarta" required
                              value={f.nama_hotel} onChange={set('nama_hotel')} />
                          </div>
                          <div className="form-group">
                            <label htmlFor="alamat_hotel">Alamat hotel <span className="required">*</span></label>
                            <input type="text" id="alamat_hotel" placeholder="Contoh: Jl. Malioboro No. 1, Yogyakarta" required
                              value={f.alamat_hotel} onChange={set('alamat_hotel')} />
                          </div>
                        </div>
                        <div className="jg-baris">
                          <div className="form-group">
                            <label htmlFor="tanggal_checkin">Tanggal check-in <span className="required">*</span></label>
                            <input type="date" id="tanggal_checkin" required value={f.tanggal_checkin} onChange={set('tanggal_checkin')} />
                          </div>
                          <div className="form-group">
                            <label htmlFor="tanggal_checkout">Tanggal check-out <span className="required">*</span></label>
                            <input type="date" id="tanggal_checkout" required min={f.tanggal_checkin || undefined}
                              value={f.tanggal_checkout} onChange={set('tanggal_checkout')} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="jg-aksi">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Kembali</button>
                    <button type="submit" className="btn btn-primary">
                      <span>Lanjut</span>
                      <i className="fas fa-arrow-right" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </div>

              {/* LANGKAH 2: KONFIRMASI */}
              <div className={'survey-step' + (langkah === 2 ? ' active' : '')}>
                <h2>Konfirmasi data diri</h2>
                <p className="progress-text">
                  Mohon periksa kembali data Anda. Jika sudah benar, tekan tombol "Ya, data sudah benar" untuk menyimpan.
                </p>

                <div className="jg-grup">
                  {ringkasan.map(([label, nilai]) => (
                    <div className="jg-ringkasan-item" key={label}>
                      <span>{label}</span>
                      <span>{String(nilai)}</span>
                    </div>
                  ))}
                </div>

                <div className="jg-aksi">
                  <button type="button" className="btn btn-secondary" onClick={() => { setPesan(null); pindah(1); }} disabled={busy}>
                    <i className="fas fa-pen" /> Data belum benar, ubah dulu
                  </button>
                  <button type="button" className="btn btn-primary" onClick={simpan} disabled={busy}>
                    {busy
                      ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
                      : <><i className="fas fa-check" aria-hidden="true" /> <span>Ya, data sudah benar</span></>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selesai && (
            <div className="success-message">
              <span className="jg-cap"><i className="fas fa-check" /></span>
              <p>Data kunjungan berhasil tersimpan</p>
              <p className="jg-sub">Terima kasih sudah berkunjung. Anda akan diarahkan kembali ke beranda.</p>
            </div>
          )}
        </div>
      </div>

      <p className="jg-kaki">
        <strong>BKPSDM Kota Yogyakarta</strong><br />
        Kami tidak menerima gratifikasi dalam bentuk apa pun.
      </p>
    </>
  );
}