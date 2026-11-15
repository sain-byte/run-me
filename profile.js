// ===== Profil akun: biodata + foto (file terpisah dari logic.js) =====
// Butuh dari logic.js (dipakai saat dipanggil): $, esc, S, api
// Dipanggil dari: logic.js (profileInit, profileLoad, profileReset, avatarPaint), auth.js (profileOpen, avatarHtml)
// Backend: action profile, profileSave, photo, photoSet, photoDel (lihat PANDUAN_PROFIL.md)

const PF = {data: null, photo: '', crop: null, drag: null};
const PF_VIEW = 280;   // sisi kotak pemotong (px)
const PF_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ---------- fungsi murni (gampang dites) ----------
function pfTglIndo(iso) {   // "2002-07-20" -> "20 Juli 2002"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m && +m[2] >= 1 && +m[2] <= 12 ? (+m[3]) + ' ' + PF_BULAN[+m[2] - 1] + ' ' + m[1] : '';
}

function pfToday() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// Geometri pemotong: view = sisi kotak, zoom >= 1, (cx, cy) = titik di foto asli yang ada di tengah kotak.
// Hasil dijepit supaya kotak selalu tertutup foto.
function pfCropGeom(w, h, view, zoom, cx, cy) {
  const s = (view / Math.min(w, h)) * Math.max(1, zoom);   // skala foto asli -> kotak
  const side = view / s;                                    // sisi area foto asli yang terlihat
  return {s: s, side: side, cx: Math.min(Math.max(cx, side / 2), w - side / 2), cy: Math.min(Math.max(cy, side / 2), h - side / 2)};
}

const pfSafe = (v, re) => (typeof v === 'string' && re.test(v) ? v : '');

// Tautan sosial. Dibangun HANYA dari nilai yang lolos pola ketat (jadi tidak mungkin jadi "javascript:...").
function pfLinks(p) {
  p = p || {};
  const wa = pfSafe(p.whatsapp, /^\d{9,15}$/), ig = pfSafe(p.instagram, /^[a-z0-9._]{1,30}$/), tt = pfSafe(p.tiktok, /^[a-z0-9._]{2,24}$/);
  const fb = pfSafe(p.facebook, /^(?:[a-z0-9.]{5,50}|profile\.php\?id=\d{5,20})$/);
  const o = [];
  if (wa) o.push(['WhatsApp', 'https://wa.me/' + wa]);
  if (ig) o.push(['Instagram', 'https://instagram.com/' + ig]);
  if (tt) o.push(['TikTok', 'https://www.tiktok.com/@' + tt]);
  if (fb) o.push(['Facebook', 'https://facebook.com/' + fb]);
  return o;
}

// ---------- avatar ----------
const PF_JPEG = /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/;

function avatarHtml(px, big) {   // big = pakai foto HD kalau sudah dimuat
  const u = (S.user && S.user.username) || '?';
  const src = pfSafe(big && PF.photo, PF_JPEG) || pfSafe(PF.data && PF.data.thumb, PF_JPEG);
  const st = 'width:' + px + 'px;height:' + px + 'px';
  return src
    ? '<img src="' + src + '" alt="" class="rounded-full object-cover shrink-0" style="' + st + '">'
    : '<span class="rounded-full bg-[var(--lime)] text-black font-bold inline-flex items-center justify-center shrink-0" style="' + st + ';font-size:' + Math.round(px * 0.5) + 'px">' + esc(u.charAt(0).toUpperCase()) + '</span>';
}

function avatarPaint() {   // tombol akun di header: avatar kecil + username
  const b = $('acctBtn'); if (!b) return;
  const u = S.user && S.user.username;
  if (!u) { b.textContent = ''; return; }
  b.innerHTML = '<span class="inline-flex items-center gap-1.5 max-w-full min-w-0">' + avatarHtml(20) + '<span class="truncate">' + esc(u) + '</span></span>';
}

async function profileLoad() {
  if (!S.token) return;
  const t = S.token;
  try {
    const j = await api('profile');
    if (t !== S.token) return;   // sudah ganti akun / keluar
    PF.data = j.profile; PF.photo = '';
    avatarPaint();
  } catch (e) { /* avatar tetap huruf awal */ }
}

function profileReset() { pfCropClose(); PF.data = null; PF.photo = ''; const m = $('prM'); if (m) { m.classList.add('hidden'); m.innerHTML = ''; } }

// ---------- tampilan modal ----------
const pfLab = t => '<div class="text-[11px] uppercase tracking-widest opacity-50 font-semibold mb-1">' + t + '</div>';
const pfIn = (id, label, val, extra) => '<div>' + pfLab(label) + '<input id="' + id + '" class="input" value="' + esc(val || '') + '" autocapitalize="none" autocorrect="off" spellcheck="false" ' + (extra || '') + '></div>';

function pfMsg(t, m) {
  const e = $('pfMsg'); if (!e) return;
  e.textContent = m;
  e.className = 'text-[13px] min-h-[18px] ' + (t === 'err' ? 'text-rose-500' : t === 'ok' ? 'text-emerald-500' : 'opacity-70');
}
function pfPhotoMsg(t, m) {
  const e = $('pfPhotoMsg'); if (!e) return;
  e.textContent = m;
  e.className = 'text-[13px] min-h-[16px] ' + (t === 'err' ? 'text-rose-500' : t === 'ok' ? 'text-emerald-500' : 'opacity-70');
}

function pfFormHtml() {
  const p = PF.data || {};
  const links = pfLinks(p).map(l => '<a href="' + l[1] + '" target="_blank" rel="noopener noreferrer" class="btn h-7">' + l[0] + '</a>').join('');
  return '<div class="flex items-center justify-between"><h1 class="text-[20px] font-bold leading-none">Profil</h1><button type="button" class="btn-icon" data-pf="close" title="Tutup">✕</button></div>' +
    '<div class="flex items-center gap-3"><div id="pfAv" class="shrink-0">' + avatarHtml(80, true) + '</div>' +
    '<div class="flex flex-col gap-1.5"><button type="button" class="btn h-8" data-pf="pick">' + (p.hasPhoto ? 'Ganti foto' : 'Pilih foto') + '</button>' +
    (p.hasPhoto ? '<button type="button" class="btn h-8" data-pf="delphoto">Hapus foto</button>' : '') + '</div></div>' +
    '<p id="pfPhotoMsg" class="text-[13px] min-h-[16px]"></p><input id="pfFile" type="file" accept="image/*" class="hidden">' +
    pfIn('pfNama', 'Nama lengkap', p.namaLengkap, 'maxlength="60" autocomplete="name"') +
    '<div>' + pfLab('Tanggal lahir') + '<input id="pfTgl" type="date" class="input" min="1900-01-01" max="' + pfToday() + '" value="' + esc(p.tglLahir || '') + '"><div id="pfTglTxt" class="text-[12px] opacity-60 mt-1 min-h-[16px]">' + esc(pfTglIndo(p.tglLahir)) + '</div></div>' +
    '<div>' + pfLab('Jenis kelamin') + '<select id="pfGender" class="input"><option value="">—</option><option value="pria"' + (p.gender === 'pria' ? ' selected' : '') + '>Pria</option><option value="wanita"' + (p.gender === 'wanita' ? ' selected' : '') + '>Wanita</option></select></div>' +
    pfIn('pfHobi', 'Hobi', p.hobi, 'maxlength="100"') +
    '<div>' + pfLab('Bio singkat') + '<textarea id="pfBio" class="input" rows="3" maxlength="160">' + esc(p.bio || '') + '</textarea><div id="pfBioN" class="text-[12px] opacity-60 mt-1 text-right">' + String(p.bio || '').length + '/160</div></div>' +
    pfIn('pfIg', 'Instagram', p.instagram, 'placeholder="username (tanpa @)"') +
    pfIn('pfTt', 'TikTok', p.tiktok, 'placeholder="username (tanpa @)"') +
    pfIn('pfFb', 'Facebook', p.facebook, 'placeholder="username atau link profil"') +
    pfIn('pfWa', 'WhatsApp', p.whatsapp, 'type="tel" inputmode="tel" placeholder="contoh 0812xxxxxxxx"') +
    (links ? '<div>' + pfLab('Tautan') + '<div class="flex flex-wrap gap-1.5">' + links + '</div></div>' : '') +
    '<p id="pfMsg" class="text-[13px] min-h-[18px]"></p>' +
    '<div class="flex gap-2"><button type="button" class="btn flex-1 h-9" data-pf="close">Tutup</button><button type="button" id="pfSave" class="btn btn-lime flex-1 h-9" data-pf="save">Simpan</button></div>';
}

function pfCropHtml() {
  return '<div><h1 class="text-[20px] font-bold leading-none">Atur foto</h1><p class="text-[13px] opacity-60 mt-1">Geser foto dan atur zoom. Bagian di dalam lingkaran yang tampil di avatar.</p></div>' +
    '<div class="mx-auto" style="width:' + PF_VIEW + 'px;max-width:100%"><canvas id="pfCv" width="' + PF_VIEW + '" height="' + PF_VIEW + '" class="rounded-[16px]" style="width:100%;height:auto;display:block;touch-action:none"></canvas></div>' +
    '<input id="pfZoom" type="range" min="1" max="3" step="0.01" value="' + PF.crop.zoom + '" class="w-full">' +
    '<p id="pfMsg" class="text-[13px] min-h-[18px]"></p>' +
    '<div class="flex gap-2"><button type="button" class="btn flex-1 h-9" data-pf="cropcancel">Batal</button><button type="button" id="pfUse" class="btn btn-lime flex-1 h-9" data-pf="cropuse">Pakai foto</button></div>';
}

function pfView() {
  const m = $('prM'); if (!m) return;
  m.innerHTML = '<div class="card max-w-[420px] w-full p-5 space-y-3.5 m-auto">' + (PF.crop ? pfCropHtml() : pfFormHtml()) + '</div>';
  if (PF.crop) pfCropDraw();
}

async function profileOpen() {
  if (!S.token) return;
  const m = $('prM'); if (!m) return;
  m.classList.remove('hidden');
  if (!PF.data) {
    m.innerHTML = '<div class="card max-w-[420px] w-full p-5 m-auto"><p class="text-[14px] opacity-70">Memuat profil…</p></div>';
    try { const j = await api('profile'); PF.data = j.profile; avatarPaint(); }
    catch (e) {
      if (e.code === 'UNAUTHORIZED') return;
      m.innerHTML = '<div class="card max-w-[420px] w-full p-5 m-auto space-y-3"><p class="text-[14px] text-rose-500">' + esc(e.message || 'Gagal memuat profil') + '</p><button type="button" class="btn w-full h-9" data-pf="close">Tutup</button></div>';
      return;
    }
  }
  pfView();
  if (PF.data.hasPhoto && !PF.photo) {   // foto HD dimuat belakangan, thumbnail tampil dulu
    const t = S.token;
    try {
      const j = await api('photo');
      if (t === S.token && j.photo) { PF.photo = j.photo; const av = $('pfAv'); if (av && !PF.crop) av.innerHTML = avatarHtml(80, true); }
    } catch (e) { /* tetap thumbnail */ }
  }
}

function profileClose() { pfCropClose(); const m = $('prM'); if (m) { m.classList.add('hidden'); m.innerHTML = ''; } }
function profileBackdrop() { if (!PF.crop) profileClose(); }   // ketuk di luar kartu: jangan buang hasil potongan yang lagi diatur

// ---------- simpan teks ----------
function pfGather() {
  const v = id => String(($(id) || {}).value || '').trim();
  return {namaLengkap: v('pfNama'), tglLahir: v('pfTgl'), gender: v('pfGender'), hobi: v('pfHobi'), bio: v('pfBio'), instagram: v('pfIg'), tiktok: v('pfTt'), facebook: v('pfFb'), whatsapp: v('pfWa')};
}

function pfCheck(f) {   // pengecekan ringan di browser; aturan lengkap tetap di backend
  if (f.namaLengkap.length > 60) return 'Nama lengkap maksimal 60 karakter';
  if (f.tglLahir && f.tglLahir > pfToday()) return 'Tanggal lahir tidak boleh di masa depan';
  if (f.hobi.length > 100) return 'Hobi maksimal 100 karakter';
  if (f.bio.length > 160) return 'Bio maksimal 160 karakter';
  return '';
}

async function pfSave() {
  const f = pfGather(), bad = pfCheck(f);
  if (bad) return pfMsg('err', bad);
  const b = $('pfSave'); if (b) b.disabled = true;
  pfMsg('info', 'Menyimpan…');
  try {
    const j = await api('profileSave', {fields: f});
    PF.data = Object.assign({}, PF.data, j.profile);   // thumbnail dari server ikut diperbarui
    pfView(); pfMsg('ok', 'Profil tersimpan');          // tampilkan nilai yang sudah dirapikan server (@ dibuang, 08xx jadi 62xx, dst)
  } catch (e) {
    if (e.code !== 'UNAUTHORIZED') { pfMsg('err', e.message || 'Gagal menyimpan'); if (b) b.disabled = false; }
  }
}

// ---------- foto ----------
function pfCropClose() {
  if (PF.crop && PF.crop.url && typeof URL !== 'undefined' && URL.revokeObjectURL) URL.revokeObjectURL(PF.crop.url);
  PF.crop = null; PF.drag = null;
}

function pfCropDraw() {
  const cv = $('pfCv'), c = PF.crop; if (!cv || !c) return;
  const g = pfCropGeom(c.w, c.h, PF_VIEW, c.zoom, c.cx, c.cy); c.cx = g.cx; c.cy = g.cy;
  const x = cv.getContext('2d'), V = PF_VIEW;
  x.clearRect(0, 0, V, V);
  x.drawImage(c.img, g.cx - g.side / 2, g.cy - g.side / 2, g.side, g.side, 0, 0, V, V);
  x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.rect(0, 0, V, V); x.arc(V / 2, V / 2, V / 2 - 2, 0, Math.PI * 2, true); x.fill('evenodd');   // gelapkan di luar lingkaran
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 2; x.beginPath(); x.arc(V / 2, V / 2, V / 2 - 2, 0, Math.PI * 2); x.stroke();
}

function pfPtr(e, kind) {
  const c = PF.crop; if (!c || !e.target || e.target.id !== 'pfCv') return;
  if (kind === 'down') {
    PF.drag = {x: e.clientX, y: e.clientY, cx: c.cx, cy: c.cy};
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
  } else if (kind === 'move' && PF.drag) {
    const k = PF_VIEW / ((e.target.getBoundingClientRect().width) || PF_VIEW);   // kotak bisa tampil lebih kecil dari 280px
    const s = pfCropGeom(c.w, c.h, PF_VIEW, c.zoom, c.cx, c.cy).s;
    c.cx = PF.drag.cx - (e.clientX - PF.drag.x) * k / s;
    c.cy = PF.drag.cy - (e.clientY - PF.drag.y) * k / s;
    pfCropDraw();
  } else if (kind === 'up') PF.drag = null;
}

function pfPickFile(file) {
  if (!file) return;
  if (!/^image\//.test(file.type || '')) return pfPhotoMsg('err', 'File harus berupa gambar');
  if (file.size > 25 * 1024 * 1024) return pfPhotoMsg('err', 'Foto terlalu besar (maks 25 MB)');
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (Math.min(w, h) < 64) { URL.revokeObjectURL(url); return pfPhotoMsg('err', 'Foto terlalu kecil (minimal 64 piksel)'); }
    PF.crop = {img: img, url: url, w: w, h: h, zoom: 1, cx: w / 2, cy: h / 2};
    pfView();
  };
  img.onerror = () => { URL.revokeObjectURL(url); pfPhotoMsg('err', 'Foto tidak bisa dibuka. Coba format JPG atau PNG'); };
  img.src = url;
}

// Potong persegi -> JPEG 640 (maks) + thumbnail 128. Kualitas diturunkan bertahap kalau kegedean.
function pfCropExport() {
  const c = PF.crop, g = pfCropGeom(c.w, c.h, PF_VIEW, c.zoom, c.cx, c.cy);
  const out = Math.max(64, Math.min(640, Math.floor(g.side)));
  const th = Math.max(32, Math.min(128, out));
  const mk = (size, q) => {
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(c.img, g.cx - g.side / 2, g.cy - g.side / 2, g.side, g.side, 0, 0, size, size);
    return cv.toDataURL('image/jpeg', q);
  };
  let q = 0.88, photo = mk(out, q);
  while (photo.length > 280000 && q > 0.5) { q -= 0.1; photo = mk(out, q); }
  let tq = 0.8, thumb = mk(th, tq);
  while (thumb.length > 20000 && tq > 0.4) { tq -= 0.1; thumb = mk(th, tq); }
  return {photo: photo, thumb: thumb, out: out, th: th};
}

async function pfUpload(photo, thumb) {
  const j = await api('photoSet', {photo: photo, thumb: thumb});
  PF.data = Object.assign({}, PF.data || {}, {thumb: j.thumb, hasPhoto: true});
  PF.photo = photo;
  avatarPaint();
}

async function pfCropUse() {
  const b = $('pfUse'); if (b) b.disabled = true;
  pfMsg('info', 'Mengunggah foto…');
  try {
    const o = pfCropExport();
    if (!/^data:image\/jpeg/.test(o.photo)) throw new Error('Browser ini tidak bisa membuat JPEG');
    await pfUpload(o.photo, o.thumb);
    pfCropClose(); pfView(); pfPhotoMsg('ok', 'Foto tersimpan');
  } catch (e) {
    if (e.code === 'UNAUTHORIZED') return;
    pfMsg('err', e.message || 'Gagal mengunggah foto');
    if (b) b.disabled = false;
  }
}

async function pfDelPhoto() {
  if (!confirm('Hapus foto profil?')) return;
  try {
    await api('photoDel');
    PF.data = Object.assign({}, PF.data, {thumb: '', hasPhoto: false}); PF.photo = '';
    avatarPaint(); pfView(); pfPhotoMsg('ok', 'Foto dihapus');
  } catch (e) { if (e.code !== 'UNAUTHORIZED') pfPhotoMsg('err', e.message || 'Gagal menghapus foto'); }
}

const PFACT = {
  close: profileClose,
  save: pfSave,
  pick: () => { const f = $('pfFile'); if (f) f.click(); },
  delphoto: pfDelPhoto,
  cropcancel: () => { pfCropClose(); pfView(); },
  cropuse: pfCropUse
};

// ---------- pasang event (dipanggil sekali oleh logic.js) ----------
function profileInit() {
  const m = $('prM'); if (!m || m.dataset.ready) return;
  m.dataset.ready = '1';
  m.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pf]'); if (!b) return;
    const a = PFACT[b.dataset.pf]; if (a) a();
  });
  m.addEventListener('input', e => {
    const id = e.target && e.target.id;
    if (id === 'pfBio') { const n = $('pfBioN'); if (n) n.textContent = String(e.target.value).length + '/160'; }
    else if (id === 'pfTgl') { const t = $('pfTglTxt'); if (t) t.textContent = pfTglIndo(e.target.value); }
    else if (id === 'pfZoom' && PF.crop) { PF.crop.zoom = +e.target.value; pfCropDraw(); }
  });
  m.addEventListener('change', e => {
    if (e.target && e.target.id === 'pfFile') { const f = e.target.files && e.target.files[0]; e.target.value = ''; pfPickFile(f); }
  });
  m.addEventListener('pointerdown', e => pfPtr(e, 'down'));
  m.addEventListener('pointermove', e => pfPtr(e, 'move'));
  m.addEventListener('pointerup', e => pfPtr(e, 'up'));
  m.addEventListener('pointercancel', e => pfPtr(e, 'up'));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || m.classList.contains('hidden')) return;
    if (PF.crop) { pfCropClose(); pfView(); } else profileClose();
  });
}
