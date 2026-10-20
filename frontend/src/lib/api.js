// Klien API tipis. Semua respons backend berbentuk { status, message, data }.
async function request(path, { method = 'GET', body, form } = {}) {
  const opts = { method, credentials: 'include', headers: { Accept: 'application/json' } };
  if (form) opts.body = form;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch('/api' + path, opts);
  } catch {
    throw Object.assign(new Error('Tidak dapat terhubung ke server.'), { status: 0 });
  }
  let json = null;
  try { json = await res.json(); } catch { /* bukan JSON */ }
  if (!res.ok || (json && json.status === false)) {
    throw Object.assign(new Error(json?.message || 'Terjadi kesalahan pada server.'), { status: res.status });
  }
  return json;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  postForm: (p, form) => request(p, { method: 'POST', form }),
  del: (p) => request(p, { method: 'DELETE' }),
};
