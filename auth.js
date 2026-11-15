// ===== Layar masuk / daftar / OTP / lupa password + menu akun (file terpisah dari logic.js) =====
// Butuh dari logic.js (dipakai saat dipanggil, bukan pas load): $, esc, S, api, setSess, show, logout
// Dipanggil logic.js: authInit() sekali di awal, authShow(pesan) kapan sesi habis / belum login
// Backend: action register, verify, resend, login, forgot, reset, changePassword (lihat PANDUAN.md)

const A = {view: 'login', email: '', pass: '', ident: '', cd: 0, timer: null};
const RE_USER = /^[a-z0-9_.]{3,20}$/, RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- potongan HTML ----------
const aPass = (id, ph, ac) => `<div class="relative"><input id="${id}" type="password" placeholder="${ph}" autocomplete="${ac}" class="input pr-10"><button type="button" tabindex="-1" data-eye="${id}" class="absolute right-2 top-1/2 -translate-y-1/2 text-[14px] opacity-60" title="Lihat password">👁</button></div>`;
const aHead = (h, p) => `<div><div class="text-[12px] font-bold tracking-widest uppercase opacity-50">Log Run</div><h1 class="text-[22px] font-bold leading-tight mt-1">${h}</h1><p class="text-[13px] opacity-60 mt-1">${p}</p></div>`;
const aLink = (act, t) => `<button type="button" class="text-[13px] underline opacity-70" data-act="${act}">${t}</button>`;
const aMsgBox = '<p id="aMsg" class="text-[13px] min-h-[18px]"></p>';
const aIn = (id, ph, ac, extra) => `<input id="${id}" placeholder="${ph}" autocomplete="${ac}" autocapitalize="none" autocorrect="off" spellcheck="false" class="input"${extra || ''}>`;
const aRsBtn = '<button type="button" id="aRs" data-act="resend" class="text-[13px] underline opacity-70 disabled:opacity-40">Kirim ulang kode</button>';

const AV = {
  login: () => aHead('Masuk', 'Pakai username atau email') +
    aIn('aId', 'Username atau email', 'username') + aPass('aPw', 'Password', 'current-password') + aMsgBox +
    '<button id="aGo" data-act="login" class="btn btn-lime w-full h-9">Masuk →</button>' +
    `<div class="flex justify-between">${aLink('to-forgot', 'Lupa password?')}${aLink('to-register', 'Daftar akun')}</div>`,

  register: () => aHead('Daftar', 'Kode verifikasi akan dikirim ke email kamu') +
    aIn('aUs', 'Username (huruf kecil, angka, _ atau .)', 'username', ' maxlength="20"') +
    aIn('aEm', 'Email', 'email', ' type="email" inputmode="email"') +
    aPass('aPw', 'Password (min. 8 karakter)', 'new-password') + aPass('aPw2', 'Ulangi password', 'new-password') + aMsgBox +
    '<button id="aGo" data-act="register" class="btn btn-lime w-full h-9">Daftar →</button>' +
    `<div class="text-center">${aLink('to-login', 'Sudah punya akun? Masuk')}</div>`,

  verify: () => aHead('Verifikasi email', 'Masukkan 6 digit kode yang dikirim ke email kamu') +
    aIn('aEm', 'Email', 'email', ' type="email" inputmode="email"') +
    aIn('aOtp', 'Kode OTP (6 digit)', 'one-time-code', ' inputmode="numeric" maxlength="6"') + aMsgBox +
    '<button id="aGo" data-act="verify" class="btn btn-lime w-full h-9">Verifikasi →</button>' +
    `<div class="flex justify-between">${aRsBtn}${aLink('to-login', 'Kembali')}</div>`,

  forgot: () => aHead('Lupa password', 'Kode reset akan dikirim ke email yang terdaftar') +
    aIn('aEm', 'Email', 'email', ' type="email" inputmode="email"') + aMsgBox +
    '<button id="aGo" data-act="forgot" class="btn btn-lime w-full h-9">Kirim kode →</button>' +
    `<div class="text-center">${aLink('to-login', 'Kembali')}</div>`,

  reset: () => aHead('Password baru', 'Masukkan kode dari email dan password baru') +
    aIn('aEm', 'Email', 'email', ' type="email" inputmode="email"') +
    aIn('aOtp', 'Kode OTP (6 digit)', 'one-time-code', ' inputmode="numeric" maxlength="6"') +
    aPass('aPw', 'Password baru (min. 8 karakter)', 'new-password') + aPass('aPw2', 'Ulangi password baru', 'new-password') + aMsgBox +
    '<button id="aGo" data-act="reset" class="btn btn-lime w-full h-9">Ubah password →</button>' +
    `<div class="flex justify-between">${aRsBtn}${aLink('to-login', 'Kembali')}</div>`
};

// ---------- tampilan ----------
function aMsg(t, m) {
  const e = $('aMsg'); if (!e) return;
  e.textContent = m;
  e.className = 'text-[13px] min-h-[18px] ' + (t === 'err' ? 'text-rose-500' : t === 'ok' ? 'text-emerald-500' : 'opacity-70');
}

function cdPaint() {
  const b = $('aRs'); if (!b) return;
  b.disabled = A.cd > 0;
  b.textContent = A.cd > 0 ? 'Kirim ulang kode (' + A.cd + 's)' : 'Kirim ulang kode';
}
function cdStart(sec) {
  A.cd = sec; cdPaint(); clearInterval(A.timer);
  A.timer = setInterval(() => { A.cd--; cdPaint(); if (A.cd <= 0) clearInterval(A.timer); }, 1000);
}

function authView(name, note) {
  A.view = name; clearInterval(A.timer);
  $('auth').innerHTML = '<div class="card max-w-[360px] w-full p-5 space-y-3.5 m-auto">' + AV[name]() + '</div>';
  if (name === 'login' && A.ident && $('aId')) $('aId').value = A.ident;
  if (name !== 'login' && name !== 'register' && A.email && $('aEm')) $('aEm').value = A.email;
  if (note) aMsg(note.t, note.m);
  if (A.cd > 0 && (name === 'verify' || name === 'reset')) cdStart(A.cd); else cdPaint();
  const f = $('aId') || $('aUs') || $('aOtp') || $('aEm');
  if (f && f.focus) setTimeout(() => f.focus(), 60);
}

function authShow(msg) {
  A.pass = ''; A.cd = 0;
  document.documentElement.classList.add('auth-on');
  $('auth').classList.remove('hidden');
  $('acctMenu').classList.add('hidden'); $('pwM').classList.add('hidden');
  authView('login', msg ? {t: 'info', m: msg} : null);
}

function authHide() {
  clearInterval(A.timer);
  A.pass = ''; A.ident = ''; A.cd = 0;
  $('auth').classList.add('hidden'); $('auth').innerHTML = '';   // kolom password ikut dibuang dari halaman
  document.documentElement.classList.remove('auth-on');
}

// masuk ke dashboard setelah login sukses
function aEnter(j) { setSess(j.token, j.expiresAt, j.user); authHide(); show(); }

// ---------- aksi ----------
const aVal = id => String(($(id) || {}).value || '').trim();
const aRaw = id => String(($(id) || {}).value || '');
function aBusy(on) { const b = $('aGo'); if (b) b.disabled = on; }
async function aRun(fn) { aBusy(true); try { await fn(); } catch (e) { aMsg('err', e.message || 'Gagal'); } aBusy(false); }

const ACT = {
  'to-login': () => authView('login'),
  'to-register': () => authView('register'),
  'to-forgot': () => { A.cd = 0; authView('forgot'); },

  async login() {
    const id = aVal('aId').toLowerCase(), pw = aRaw('aPw');
    if (!id || !pw) return aMsg('err', 'Isi username/email dan password');
    await aRun(async () => {
      try {
        aEnter(await api('login', {identity: id, password: pw}));
      } catch (e) {
        if (e.code !== 'NOT_ACTIVE') throw e;
        A.ident = id; A.pass = pw; A.email = id.indexOf('@') > 0 ? id : ''; A.cd = 0;
        authView('verify', {t: 'info', m: 'Akun belum diverifikasi. Masukkan kode dari email, atau kirim ulang kode.'});
      }
    });
  },

  async register() {
    const u = aVal('aUs').toLowerCase(), em = aVal('aEm').toLowerCase(), p1 = aRaw('aPw'), p2 = aRaw('aPw2');
    if (!RE_USER.test(u)) return aMsg('err', 'Username 3-20 karakter: huruf kecil, angka, _ atau .');
    if (!RE_MAIL.test(em)) return aMsg('err', 'Email tidak valid');
    if (p1.length < 8) return aMsg('err', 'Password minimal 8 karakter');
    if (p1 !== p2) return aMsg('err', 'Konfirmasi password tidak sama');
    await aRun(async () => {
      const j = await api('register', {username: u, email: em, password: p1});
      if (!j.needVerify) return aEnter(await api('login', {identity: u, password: p1}));   // verifikasi dimatikan di backend
      A.ident = u; A.email = em; A.pass = p1; A.cd = j.cooldownSec || 60;
      authView('verify', {t: 'ok', m: j.msg || 'Kode verifikasi dikirim ke email kamu'});
    });
  },

  async verify() {
    const em = aVal('aEm').toLowerCase(), otp = aVal('aOtp');
    if (!RE_MAIL.test(em)) return aMsg('err', 'Email tidak valid');
    if (!/^\d{6}$/.test(otp)) return aMsg('err', 'Kode OTP harus 6 digit');
    await aRun(async () => {
      await api('verify', {email: em, otp});
      if (A.pass && A.ident) {
        try { return aEnter(await api('login', {identity: A.ident, password: A.pass})); } catch (e) { /* jatuh ke layar masuk */ }
      }
      A.pass = '';
      authView('login', {t: 'ok', m: 'Email terverifikasi, silakan masuk'});
    });
  },

  async resend() {
    const em = aVal('aEm').toLowerCase();
    if (!RE_MAIL.test(em)) return aMsg('err', 'Isi email dulu');
    A.email = em;
    try {
      await api(A.view === 'reset' ? 'forgot' : 'resend', {email: em});
      cdStart(60); aMsg('ok', 'Kode baru dikirim (kalau email terdaftar)');
    } catch (e) {
      aMsg('err', e.message || 'Gagal');
      if (e.code === 'TOO_FAST') cdStart(60);
    }
  },

  async forgot() {
    const em = aVal('aEm').toLowerCase();
    if (!RE_MAIL.test(em)) return aMsg('err', 'Email tidak valid');
    await aRun(async () => {
      const j = await api('forgot', {email: em});
      A.email = em; A.cd = 60;
      authView('reset', {t: 'info', m: j.msg || 'Jika email terdaftar, kode OTP sudah dikirim'});
    });
  },

  async reset() {
    const em = aVal('aEm').toLowerCase(), otp = aVal('aOtp'), p1 = aRaw('aPw'), p2 = aRaw('aPw2');
    if (!RE_MAIL.test(em)) return aMsg('err', 'Email tidak valid');
    if (!/^\d{6}$/.test(otp)) return aMsg('err', 'Kode OTP harus 6 digit');
    if (p1.length < 8) return aMsg('err', 'Password minimal 8 karakter');
    if (p1 !== p2) return aMsg('err', 'Konfirmasi password tidak sama');
    await aRun(async () => {
      const j = await api('reset', {email: em, otp, password: p1});
      A.ident = em; A.pass = '';
      authView('login', {t: 'ok', m: j.msg || 'Password berhasil diubah, silakan masuk'});
    });
  }
};

// ---------- menu akun (tombol username di header) + ganti password ----------
function acctPlace() { $('acctMenu').style.top = Math.round($('acctBtn').getBoundingClientRect().bottom + 8) + 'px'; }
function acctClose() { $('acctMenu').classList.add('hidden'); }
function acctOpen() {
  const u = S.user || {};
  const nm = (typeof PF !== 'undefined' && PF.data && PF.data.namaLengkap) || '';   // profil (profile.js), boleh belum ada
  const av = typeof avatarHtml === 'function' ? avatarHtml(40) : '';
  $('acctMenu').innerHTML =
    '<div class="flex items-center gap-2.5 mb-1">' + av + '<div class="min-w-0">' +
    `<div class="text-[13px] font-semibold truncate">${esc(nm || u.username)}</div>` +
    (nm ? `<div class="text-[12px] opacity-70 truncate">@${esc(u.username)}</div>` : '') +
    `<div class="text-[12px] opacity-60 truncate">${esc(u.email)}</div></div></div>` +
    '<button class="btn w-full" data-acct="profile">Profil</button>' +
    '<button class="btn w-full" data-acct="pw">Ganti password</button>' +
    '<button class="btn w-full" data-acct="out">Keluar</button>';
  acctPlace(); $('acctMenu').classList.remove('hidden');
}

function pwMsg(t, m) {
  const e = $('pMsg'); if (!e) return;
  e.textContent = m;
  e.className = 'text-[13px] min-h-[18px] ' + (t === 'err' ? 'text-rose-500' : 'text-emerald-500');
}
function pwClose() { $('pwM').classList.add('hidden'); $('pwM').innerHTML = ''; }
function pwOpen() {
  $('pwM').innerHTML = '<div class="card max-w-[360px] w-full p-5 space-y-3.5">' +
    '<div><h1 class="text-[20px] font-bold leading-none">Ganti password</h1><p class="text-[13px] opacity-60 mt-1">Perangkat lain akan otomatis keluar</p></div>' +
    aPass('pOld', 'Password lama', 'current-password') + aPass('pNew', 'Password baru (min. 8 karakter)', 'new-password') + aPass('pNew2', 'Ulangi password baru', 'new-password') +
    '<p id="pMsg" class="text-[13px] min-h-[18px]"></p>' +
    '<div class="flex gap-2"><button class="btn flex-1 h-9" data-pw="x">Batal</button><button id="pSave" class="btn btn-lime flex-1 h-9" data-pw="save">Simpan</button></div></div>';
  $('pwM').classList.remove('hidden');
}
async function pwSave() {
  const o = aRaw('pOld'), n = aRaw('pNew'), n2 = aRaw('pNew2');
  if (!o) return pwMsg('err', 'Isi password lama');
  if (n.length < 8) return pwMsg('err', 'Password baru minimal 8 karakter');
  if (n !== n2) return pwMsg('err', 'Konfirmasi password tidak sama');
  if (n === o) return pwMsg('err', 'Password baru harus beda dari yang lama');
  const b = $('pSave'); if (b) b.disabled = true;
  try {
    const j = await api('changePassword', {oldPassword: o, newPassword: n});
    setSess(j.token, j.expiresAt);   // token baru, perangkat ini tetap login
    pwMsg('ok', 'Password berhasil diubah');
    setTimeout(pwClose, 1000);
  } catch (e) {
    if (e.code !== 'UNAUTHORIZED') pwMsg('err', e.message || 'Gagal');
    else pwClose();
  }
  if (b) b.disabled = false;
}

// ---------- pasang event (dipanggil sekali oleh logic.js) ----------
function authInit() {
  const root = $('auth'); if (!root) return;
  root.addEventListener('click', e => {
    const t = e.target;
    const eye = t.closest && t.closest('[data-eye]');
    if (eye) { const i = $(eye.dataset.eye); if (i) i.type = i.type === 'password' ? 'text' : 'password'; return; }
    const b = t.closest && t.closest('[data-act]');
    if (b && ACT[b.dataset.act]) ACT[b.dataset.act]();
  });
  root.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const g = $('aGo'); if (g && !g.disabled && ACT[g.dataset.act]) ACT[g.dataset.act]();
  });

  $('pwM').addEventListener('click', e => {
    const t = e.target;
    const eye = t.closest && t.closest('[data-eye]');
    if (eye) { const i = $(eye.dataset.eye); if (i) i.type = i.type === 'password' ? 'text' : 'password'; return; }
    const b = t.closest && t.closest('[data-pw]'); if (!b) return;
    if (b.dataset.pw === 'save') pwSave(); else pwClose();
  });

  const btn = $('acctBtn'), menu = $('acctMenu');
  if (btn) btn.onclick = e => { e.stopPropagation(); if (menu.classList.contains('hidden')) acctOpen(); else acctClose(); };
  menu.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-acct]'); if (!b) return;
    acctClose();
    if (b.dataset.acct === 'profile') { if (typeof profileOpen === 'function') profileOpen(); }
    else if (b.dataset.acct === 'pw') pwOpen(); else logout();
  });
  document.addEventListener('pointerdown', e => { if (!menu.classList.contains('hidden') && !menu.contains(e.target) && !(btn && btn.contains(e.target))) acctClose(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { acctClose(); if (!$('pwM').classList.contains('hidden')) pwClose(); } });
  window.addEventListener('resize', () => { if (!menu.classList.contains('hidden')) acctPlace(); });
}
