/* =========================================================
   HTV Flash : application de gestion des photos clients
   100 % locale : rien n'est envoyé sur internet.
   ========================================================= */
'use strict';

const APP_VERSION = '1.6.8';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = (n) => (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const hasFS = 'showDirectoryPicker' in window;

/* ---------------------------------------------------------
   Thèmes
   --------------------------------------------------------- */
const THEMES = [
  { id: 'auto', name: 'Automatique', emoji: '📅', bg: '#444', bg2: '#888', text: '#fff' },
  { id: 'classique', name: 'HTV Flash (noir & or)', emoji: '✨', bg: '#0a0a0a', bg2: '#2a2214', text: '#ffffff', fx: ['✨'], fxCount: 8 },
  { id: 'clair', name: 'Clair', emoji: '🤍', bg: '#f5f3ef', bg2: '#e7e2d8', text: '#1d1a17' },
  { id: 'hiver', name: 'Hiver', emoji: '❄️', bg: '#0d1f33', bg2: '#2b4d72', text: '#f0f8ff', fx: ['❄', '❅', '❆', '•'], fxCount: 40 },
  { id: 'printemps', name: 'Printemps', emoji: '🌸', bg: '#fdf6f0', bg2: '#dff3d9', text: '#24361f', fx: ['🌸', '🌼', '🦋', '🌷'], fxCount: 18 },
  { id: 'ete', name: 'Été', emoji: '☀️', bg: '#ffe8b8', bg2: '#5fd0e6', text: '#13323d', fx: ['🫧', '🫧', '🐚', '🌴'], fxCount: 16, rise: true },
  { id: 'automne', name: 'Automne', emoji: '🍂', bg: '#2a1608', bg2: '#7a3a12', text: '#fff3e6', fx: ['🍂', '🍁', '🍂', '🌰'], fxCount: 22 },
  { id: 'halloween', name: 'Halloween', emoji: '🎃', bg: '#0e0a12', bg2: '#3a1a52', text: '#fff4e6', fx: ['🎃', '🦇', '👻', '🕸️'], fxCount: 16 },
  { id: 'noel', name: 'Noël', emoji: '🎄', bg: '#0f2a1a', bg2: '#7d1220', text: '#fffaf0', fx: ['❄', '⭐', '🎁', '❄', '🎄'], fxCount: 30 },
  { id: 'nouvel-an', name: 'Nouvel An', emoji: '🥂', bg: '#05060f', bg2: '#1b1f4a', text: '#fdf8ea', fx: ['✨', '🎆', '🥂', '⭐'], fxCount: 22, rise: true },
  { id: 'saint-valentin', name: 'Saint-Valentin', emoji: '💘', bg: '#3b0a1e', bg2: '#c2185b', text: '#fff0f5', fx: ['❤️', '💕', '💗', '🌹'], fxCount: 22, rise: true },
  { id: 'paques', name: 'Pâques', emoji: '🐣', bg: '#fff9e6', bg2: '#e3d7ff', text: '#2f2550', fx: ['🥚', '🐣', '🌷', '🐰'], fxCount: 16 },
  { id: 'mariage', name: 'Mariage', emoji: '💍', bg: '#fbf8f3', bg2: '#efe3d3', text: '#3d3328', fx: ['🤍', '🕊️', '✨'], fxCount: 14 },
];

// Noms des formules selon le thème (1 photo, 2 photos, 3 photos, 5 photos)
const FORMULA_NAMES = {
  classique: ['✨ Éclat', '🌟 Prestige', '💫 Lumière', '👑 Couronne d\'Or'],
  clair: ['🤍 Pureté', '🕊️ Douceur', '☁️ Nuage', '💎 Signature'],
  hiver: ['❄️ Cristal de Givre', '⛸️ Patinoire', '🏔️ Cime Enneigée', '🌨️ Grand Blanc'],
  printemps: ['🌸 Bourgeon', '🌷 Tulipe', '🦋 Papillon', '💐 Bouquet de Printemps'],
  ete: ['☀️ Rayon de Soleil', '🌊 Vague', '🍹 Tropique', '🌴 Évasion d\'Été'],
  automne: ['🍂 Feuille d\'Or', '🍁 Érable', '🌰 Châtaigne', '🍄 Forêt Enchantée'],
  halloween: ['🎃 Petite Citrouille', '👻 Fantôme', '🦇 Chauve-Souris', '🧙 Grimoire Ensorcelé'],
  noel: ['🎅 Lutinette', '🎁 Étoile de Noël', '⛄ Flocon Magique', '🎄 Sphère Enchantée'],
  'nouvel-an': ['🍾 Bulles', '🎉 Confettis', '✨ Paillettes', '🎆 Feu d\'Artifice'],
  'saint-valentin': ['💌 Mot Doux', '💕 Tendresse', '🌹 Passion', '💘 Coup de Foudre'],
  paques: ['🐣 Petit Poussin', '🐰 Lapin Malin', '🌷 Jardin Fleuri', '🥚 Œuf d\'Or'],
  mariage: ['💍 Alliance', '🥂 Serment', '💐 Bouquet', '👰 Grand Jour'],
};
const currentThemeId = () => (settings.theme === 'auto' ? themeForDate() : settings.theme);
// nom affiché : nom personnalisé pour ce thème, sinon nom du thème, sinon nom saisi
function formulaName(f) {
  const th = currentThemeId();
  if (f.names && f.names[th]) return f.names[th];
  const idx = settings.formulas.indexOf(f);
  if (idx >= 0 && idx < 4 && FORMULA_NAMES[th]) return FORMULA_NAMES[th][idx];
  return f.name;
}

function easterDate(y) { // algorithme de Meeus
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
function themeForDate(d = new Date()) {
  const md = (d.getMonth() + 1) * 100 + d.getDate();
  const easter = easterDate(d.getFullYear());
  const diff = (d - easter) / 86400000;
  if (md >= 1201 && md <= 1226) return 'noel';
  if (md >= 1227 || md <= 106) return 'nouvel-an';
  if (md >= 201 && md <= 214) return 'saint-valentin';
  if (diff >= -10 && diff <= 2) return 'paques';
  if (md >= 1015 && md <= 1031) return 'halloween';
  if (md >= 1221 || md <= 319) return 'hiver';
  if (md <= 620) return 'printemps';
  if (md <= 922) return 'ete';
  return 'automne';
}

/* ---------------------------------------------------------
   Réglages (stockés sur l'appareil)
   --------------------------------------------------------- */
const DEFAULT_SETTINGS = {
  theme: 'classique',
  anim: true,
  sumupLink: '',
  sumupKey: '',
  consentText: "J'autorise HTV Flash à utiliser les photos prises lors de cette séance pour sa communication (site internet, réseaux sociaux, portfolio, salons).\nJe peux retirer mon accord à tout moment par simple e-mail.",
  eventActive: 'none',
  eventPct: { telethon: 50, mariage: 10, 'fete-locale': 10 },
  pinHash: '',
  // price = prix d'origine (avant réduction) ; telethon = montant reversé au Téléthon
  formulas: [
    { id: 'f1', name: '🎅 Lutinette', photos: 1, price: 12, telethon: 2, links: {} },
    { id: 'f2', name: '🎁 Étoile de Noël', photos: 2, price: 20, telethon: 3, links: {} },
    { id: 'f3', name: '⛄ Flocon Magique', photos: 3, price: 28, telethon: 4, links: {} },
    { id: 'f4', name: '🎄 Sphère Enchantée', photos: 5, price: 40, telethon: 5, links: {} },
  ],
};
let settings = loadSettings();
function loadSettings() {
  try {
    const s = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('htv-settings') || '{}') };
    s.eventPct = { ...DEFAULT_SETTINGS.eventPct, ...s.eventPct };
    if (s.formulas.some((f) => f.photos === undefined)) s.formulas = DEFAULT_SETTINGS.formulas;
    const renamed = { '🎁 Duo de Rennes': '🎁 Étoile de Noël', '⛄ Trio Enneigé': '⛄ Flocon Magique', '🎄 Pack Magie de Noël': '🎄 Sphère Enchantée' };
    s.formulas.forEach((f) => {
      if (renamed[f.name]) f.name = renamed[f.name];
      if (!f.links) f.links = {};
      if (f.link) { f.links.none = f.links.none || f.link; delete f.link; }
    });
    return s;
  }
  catch { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings() {
  try { localStorage.setItem('htv-settings', JSON.stringify(settings)); } catch { /* stockage indisponible */ }
}

/* ---------------------------------------------------------
   Réduction pour association et événement
   --------------------------------------------------------- */
const EVENTS = [
  { id: 'telethon', name: 'Téléthon', emoji: '💛', note: 'Réduction + montant reversé au Téléthon selon la formule' },
  { id: 'mariage', name: 'Mariage', emoji: '💍', note: 'Réduction sur les formules' },
  { id: 'fete-locale', name: 'Événement', emoji: '🎉', note: 'Réduction sur les formules' },
];
const activeEvent = () => EVENTS.find((e) => e.id === settings.eventActive) || null;
const eventPct = (id) => Number(settings.eventPct?.[id]) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
// prix après réduction de l'événement (pct = pourcentage de réduction)
const discounted = (price, pct) => round2((Number(price) || 0) * (1 - (Number(pct) || 0) / 100));
const sortedFormulas = () => [...settings.formulas].sort((a, b) => (a.photos || 0) - (b.photos || 0));
// formule correspondant au nombre de photos choisies (la plus petite qui les contient)
function formulaForCount(n) {
  if (!n) return null;
  const list = sortedFormulas();
  return list.find((f) => (f.photos || 0) >= n) || list[list.length - 1] || null;
}
const priceHTML = (f, pct) => (pct
  ? `<s class="old-price">${euro(f.price)}</s> ${euro(discounted(f.price, pct))}`
  : euro(f.price));

/* ---------------------------------------------------------
   Base de données locale (IndexedDB)
   --------------------------------------------------------- */
const db = (() => {
  let p;
  const open = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('htvflash', 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('kv');
      r.result.createObjectStore('clients', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (store, mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    });
  };
  return {
    get: (k) => tx('kv', 'readonly', (s) => s.get(k)),
    set: (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k)),
    clients: () => tx('clients', 'readonly', (s) => s.getAll()),
    client: (id) => tx('clients', 'readonly', (s) => s.get(id)),
    putClient: (c) => tx('clients', 'readwrite', (s) => s.put(c)),
    delClient: (id) => tx('clients', 'readwrite', (s) => s.delete(id)),
  };
})();

/* ---------------------------------------------------------
   Petits utilitaires d'interface
   --------------------------------------------------------- */
let toastTimer;
function toast(msg, ms = 2800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
function busy(on, text = 'Patientez…', pct = null) {
  $('#busy').hidden = !on;
  $('#busy-text').textContent = text;
  $('#busy-bar').parentElement.hidden = pct === null;
  if (pct !== null) $('#busy-bar').style.width = `${Math.round(pct * 100)}%`;
}

/* ---------------------------------------------------------
   Navigation entre écrans (#accueil, #wizard/3, #clients…)
   --------------------------------------------------------- */
let current = 'home';
let routedOnce = false;
function go(screen, step) {
  const hash = screen === 'home' ? '' : screen === 'wizard' ? `#wizard/${step || wiz.step}` : `#${screen}`;
  if (location.hash === hash) { route(); return; }
  if (hash) { location.hash = hash; return; } // l'événement hashchange appelle route()
  history.pushState(null, '', location.pathname + location.search);
  route();
}
function route() {
  const [screen, arg] = location.hash.replace('#', '').split('/');
  const name = screen || 'home';
  if (!$(`#screen-${name}`)) return go('home');
  if (name !== 'settings') settingsUnlocked = false; // on reverrouille en quittant les réglages
  if (name === 'settings' && !settingsUnlocked) {
    const cameFromApp = routedOnce;
    askPin().then((ok) => { if (ok) { settingsUnlocked = true; route(); } else if (cameFromApp) history.back(); else go('home'); });
    return;
  }
  routedOnce = true;
  current = name;
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  $('#btn-home').hidden = name === 'home';
  $('#screen-title').textContent = $(`#screen-${name}`).dataset.title || '';
  if (name === 'wizard') showStep(Number(arg) || 1);
  if (name === 'clients') renderClients();
  if (name === 'client') renderClientDetail(arg);
  if (name === 'payment') mountPay('direct');
  if (name === 'settings') renderSettings();
  if (name === 'home') renderHome();
  window.scrollTo({ top: 0 });
}

/* ---------------------------------------------------------
   Thème + particules
   --------------------------------------------------------- */
function applyTheme() {
  const id = settings.theme === 'auto' ? themeForDate() : settings.theme;
  const th = THEMES.find((t) => t.id === id) || THEMES[1];
  document.documentElement.dataset.theme = th.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = th.bg;
  $('#season-badge').textContent = `${th.emoji} Thème ${th.name}${settings.theme === 'auto' ? ' (automatique)' : ''}`;
  const box = $('#particles');
  box.innerHTML = '';
  if (!settings.anim || !th.fx) return;
  const n = window.innerWidth < 700 ? Math.ceil(th.fxCount / 2) : th.fxCount;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = `particle${th.rise ? ' rise' : ''}`;
    p.textContent = th.fx[i % th.fx.length];
    const size = 12 + Math.random() * 22;
    p.style.cssText = `left:${Math.random() * 100}vw;font-size:${size}px;animation-duration:${10 + Math.random() * 14}s;animation-delay:${-Math.random() * 20}s;--sway:${(Math.random() - .5) * 120}px;opacity:${.4 + Math.random() * .5}`;
    if (th.id === 'hiver' || th.id === 'noel') p.style.color = '#fff';
    box.appendChild(p);
  }
}

/* ---------------------------------------------------------
   Session en cours (photos lues sur la microSD)
   --------------------------------------------------------- */
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
const RAW_EXT = ['cr2', 'cr3', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'raf', 'orf', 'rw2', 'pef', 'dng', 'srw', 'x3f'];
const ext = (n) => (n.split('.').pop() || '').toLowerCase();
const stem = (n) => n.replace(/\.[^.]+$/, '');

const session = { source: '', photos: [], sdDir: null, sdFiles: [] };
// photo = { id, name, file, raw (File|null), thumb (url|null), selected }

async function walkDir(dir, path, out) {
  for await (const [name, h] of dir.entries()) {
    if (name.startsWith('.') || /^(System Volume Information|\$RECYCLE\.BIN|LOST\.DIR|MISC)$/i.test(name)) continue;
    if (h.kind === 'directory') await walkDir(h, `${path}${name}/`, out);
    else {
      const e = ext(name);
      if (IMG_EXT.includes(e) || RAW_EXT.includes(e)) {
        out.push({ path: path + name, name, file: await h.getFile(), parent: dir });
        if (out.length % 25 === 0) busy(true, `Lecture de la carte… ${out.length} fichiers`);
      }
    }
  }
}

function groupFiles(entries) {
  // associe chaque RAW à son JPEG (même nom) pour garder les deux à la copie
  const groups = new Map();
  for (const en of entries) {
    const dir = en.path.slice(0, en.path.length - en.name.length);
    const key = (dir + stem(en.name)).toLowerCase();
    const g = groups.get(key) || { img: null, raw: null };
    if (RAW_EXT.includes(ext(en.name))) g.raw = en.file; else g.img = en.file;
    groups.set(key, g);
  }
  const photos = [];
  let i = 0;
  for (const g of groups.values()) {
    const main = g.img || g.raw;
    photos.push({ id: `p${i++}`, name: main.name, file: main, raw: g.img ? g.raw : null, rawOnly: !g.img, thumb: null, selected: false });
  }
  photos.sort((a, b) => a.file.lastModified - b.file.lastModified || a.name.localeCompare(b.name));
  return photos;
}

/* Carte microSD mémorisée dans les réglages : plus besoin de la choisir à chaque fois */
let sdHandle = null;
async function loadSdHandle() {
  try { sdHandle = (await db.get('sd')) || null; } catch { sdHandle = null; }
  renderSdName();
}
function renderSdName() {
  $$('.sd-name').forEach((el) => { el.textContent = sdHandle ? `💾 ${sdHandle.name}` : 'Aucune carte mémorisée (elle sera demandée à chaque lecture)'; });
  const f = $('#btn-forget-sd'); if (f) f.hidden = !sdHandle;
  const h = $('#sd-hint'); if (h) h.hidden = !sdHandle;
  if (h && sdHandle) h.textContent = `Carte mémorisée : « ${sdHandle.name} ». Touchez le bouton, la lecture est directe.`;
}
async function chooseSD() {
  if (!hasFS) { toast('Utilisez Chrome pour mémoriser la carte.'); return null; }
  try {
    const dir = await window.showDirectoryPicker({ id: 'microsd', mode: 'readwrite' });
    sdHandle = dir;
    await db.set('sd', dir);
    renderSdName();
    toast(`Carte « ${dir.name} » mémorisée`);
    return dir;
  } catch (e) {
    if (e.name !== 'AbortError') toast("Impossible d'ouvrir la carte.");
    return null;
  }
}
async function forgetSD() {
  sdHandle = null;
  try { await db.set('sd', null); } catch {}
  renderSdName();
  toast('Carte oubliée : elle sera demandée à la prochaine lecture.');
}

async function pickSD() {
  if (!hasFS) { $('#input-fallback').click(); return; }
  let dir = null;
  if (sdHandle) {
    // carte mémorisée : Chrome peut redemander l'autorisation d'un simple toucher
    try {
      const opts = { mode: 'readwrite' };
      if ((await sdHandle.queryPermission(opts)) === 'granted' || (await sdHandle.requestPermission(opts)) === 'granted') dir = sdHandle;
      else toast('Autorisation refusée : choisissez la carte.');
    } catch { dir = null; }
  }
  if (!dir) {
    try { dir = await window.showDirectoryPicker({ id: 'microsd', mode: 'readwrite' }); }
    catch (e) { if (e.name !== 'AbortError') toast("Impossible d'ouvrir la carte."); return; }
  }
  busy(true, 'Lecture de la carte…');
  try {
    const entries = [];
    try { await walkDir(dir, '', entries); }
    catch (e) {
      if (dir !== sdHandle) throw e;
      // carte mémorisée absente (retirée, ou carte avec un autre nom) : on propose de choisir la carte
      busy(false);
      toast(`Carte « ${sdHandle.name} » introuvable : choisissez la carte insérée.`, 4500);
      dir = await chooseSD();
      if (!dir) return;
      busy(true, 'Lecture de la carte…');
      entries.length = 0;
      await walkDir(dir, '', entries);
    }
    loadSession(dir.name, groupFiles(entries));
    // fichiers lus sur la carte : effacés à la fin si le photographe le demande
    session.sdDir = dir;
    session.sdFiles = entries.map((e) => ({ parent: e.parent, name: e.name }));
  } catch (e) {
    console.error(e);
    toast('Erreur de lecture : la carte a-t-elle été retirée ?');
  } finally { busy(false); }
}

function loadSession(source, photos, quiet = false) {
  session.photos.forEach((p) => p.thumb && URL.revokeObjectURL(p.thumb));
  session.source = source;
  session.photos = photos;
  session.sdDir = null;
  session.sdFiles = [];
  renderImport();
  if (quiet) return;
  if (!photos.length) toast('Aucune photo trouvée sur cette carte.');
  else toast(`${photos.length} photo(s) importée(s) 👍`);
  updateWizNav();
  // on passe directement au choix des photos
  if (photos.length && location.hash.startsWith('#wizard') && wiz.step === 1) go('wizard', 2);
}

/* ---------- Miniatures (générées à la demande, en petit) ---------- */
const thumbQueue = [];
let thumbRunning = 0;
function requestThumb(photo, img) {
  if (photo.thumb) { img.src = photo.thumb; return; }
  thumbQueue.push({ photo, img });
  pumpThumbs();
}
async function pumpThumbs() {
  while (thumbRunning < 3 && thumbQueue.length) {
    const { photo, img } = thumbQueue.shift();
    if (photo.thumb) { img.src = photo.thumb; continue; }
    thumbRunning++;
    makeThumb(photo, 360).then((url) => {
      photo.thumb = url;
      $$(`img[data-pid="${photo.id}"]`).forEach((el) => { el.src = url; });
    }).catch(() => { photo.thumbFailed = true; img.replaceWith(Object.assign(document.createElement('span'), { className: 'ph-raw', textContent: ext(photo.name).toUpperCase() })); })
      .finally(() => { thumbRunning--; pumpThumbs(); });
  }
}
/* ---------- Aperçu des fichiers RAW (NEF, CR2, CR3, ARW, DNG, RAF…) ----------
   Les appareils enregistrent un aperçu JPEG dans chaque RAW : on prend le plus grand. */
function jpegEnd(b, s) {
  const n = b.length;
  let p = s + 2;
  while (p < n - 3) {
    if (b[p] !== 0xFF) return -1;
    let m = b[p + 1];
    while (m === 0xFF && p < n - 2) { p++; m = b[p + 1]; }
    if (m === 0xD9) return p + 2;
    if ((m >= 0xD0 && m <= 0xD7) || m === 0x01) { p += 2; continue; }
    const len = (b[p + 2] << 8) | b[p + 3];
    if (len < 2) return -1;
    p += 2 + len;
    if (m === 0xDA) { // données compressées : on cherche le marqueur suivant
      while (p < n - 1) {
        if (b[p] === 0xFF && b[p + 1] !== 0 && !(b[p + 1] >= 0xD0 && b[p + 1] <= 0xD7)) break;
        p++;
      }
    }
  }
  return -1;
}
function tiffOrientation(b) {
  const le = b[0] === 0x49 && b[1] === 0x49;
  const be = b[0] === 0x4D && b[1] === 0x4D;
  if (!le && !be) return 1;
  const u16 = (o) => (le ? b[o] | (b[o + 1] << 8) : (b[o] << 8) | b[o + 1]);
  const u32 = (o) => (le ? (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) + b[o + 3] * 16777216 : b[o] * 16777216 + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]));
  const ifd = u32(4);
  if (ifd + 2 > b.length) return 1;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const e = ifd + 2 + i * 12;
    if (u16(e) === 0x0112) return u16(e + 8) || 1;
  }
  return 1;
}
async function rawPreview(file) {
  const b = new Uint8Array(await file.arrayBuffer());
  let best = null;
  for (let i = 0; i < b.length - 3; i++) {
    if (b[i] !== 0xFF || b[i + 1] !== 0xD8 || b[i + 2] !== 0xFF) continue;
    const end = jpegEnd(b, i);
    if (end > i) {
      if (!best || end - i > best[1] - best[0]) best = [i, end];
      i = end - 1; // on saute ce JPEG (et la miniature qu'il contient)
    }
  }
  if (!best || best[1] - best[0] < 10000) throw new Error('Pas d\'aperçu dans ce RAW');
  return { blob: new Blob([b.subarray(best[0], best[1])], { type: 'image/jpeg' }), orientation: tiffOrientation(b) };
}
// image affichable d'une photo (JPEG direct, ou aperçu extrait du RAW) + rotation à appliquer
async function displaySource(photo) {
  if (!photo.rawOnly) return { blob: photo.file, orientation: 1 };
  return rawPreview(photo.file);
}

async function makeThumb(photoOrFile, width) {
  const photo = photoOrFile instanceof Blob ? { file: photoOrFile, rawOnly: false } : photoOrFile;
  const { blob, orientation } = await displaySource(photo);
  const bmp = await createImageBitmap(blob, { resizeWidth: width, resizeQuality: 'medium', ...(photo.rawOnly ? { imageOrientation: 'none' } : {}) });
  const rot = orientation === 6 || orientation === 8;
  const c = document.createElement('canvas');
  c.width = rot ? bmp.height : bmp.width; c.height = rot ? bmp.width : bmp.height;
  const ctx = c.getContext('2d');
  if (orientation === 6) { ctx.translate(c.width, 0); ctx.rotate(Math.PI / 2); }
  else if (orientation === 8) { ctx.translate(0, c.height); ctx.rotate(-Math.PI / 2); }
  else if (orientation === 3) { ctx.translate(c.width, c.height); ctx.rotate(Math.PI); }
  ctx.drawImage(bmp, 0, 0);
  bmp.close && bmp.close();
  const out = await new Promise((r) => c.toBlob(r, 'image/jpeg', .8));
  return URL.createObjectURL(out);
}
const io = 'IntersectionObserver' in window ? new IntersectionObserver((ents) => {
  for (const en of ents) {
    if (!en.isIntersecting) continue;
    io.unobserve(en.target);
    const { photo } = en.target._ph;
    requestThumb(photo, en.target);
  }
}, { rootMargin: '400px' }) : null;

function photoTile(photo, { selectable = false, list = [] } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `ph${photo.selected && selectable ? ' sel' : ''}`;
  b.dataset.pid = photo.id;
  if (photo.thumbFailed) {
    b.innerHTML = `<span class="ph-raw">${esc(ext(photo.name).toUpperCase())}</span>`;
  } else {
    const img = document.createElement('img');
    img.alt = '';
    img.dataset.pid = photo.id;
    img._ph = { photo };
    b.appendChild(img);
    if (photo.thumb) img.src = photo.thumb; else if (io) io.observe(img); else requestThumb(photo, img);
  }
  b.insertAdjacentHTML('beforeend', `<span class="ph-name">${esc(photo.name)}${photo.raw ? ' + RAW' : ''}</span>${photo.rawOnly ? '<span class="ph-badge">RAW</span>' : ''}${selectable ? '<span class="ph-check">✓</span>' : ''}`);

  // sélectionnable : un toucher = choisir (pas de plein écran) ; sinon toucher = agrandir
  let timer, long = false;
  b.addEventListener('pointerdown', () => { long = false; if (selectable) return; timer = setTimeout(() => { long = true; openViewer(list, photo, selectable); }, 500); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, () => clearTimeout(timer)));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  b.addEventListener('click', () => {
    if (long) return;
    if (selectable) { photo.selected = !photo.selected; b.classList.toggle('sel', photo.selected); updateSelCount(); }
    else openViewer(list, photo, false);
  });
  return b;
}

function renderImport() {
  const has = session.photos.length > 0;
  $('#import-empty').hidden = has;
  $('#import-result').hidden = !has;
  $('#import-count').textContent = session.photos.length;
  $('#import-source').textContent = session.source || 'la carte';
  const grid = $('#import-grid');
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  session.photos.forEach((p) => frag.appendChild(photoTile(p, { list: session.photos })));
  grid.appendChild(frag);
}

function renderSelection() {
  const grid = $('#form-grid');
  grid.innerHTML = '';
  $('#form-no-photos').hidden = session.photos.length > 0;
  const frag = document.createDocumentFragment();
  session.photos.forEach((p) => frag.appendChild(photoTile(p, { selectable: true, list: session.photos })));
  grid.appendChild(frag);
  updateSelCount();
}
function updateSelCount() {
  $('#sel-count').textContent = session.photos.filter((p) => p.selected).length;
  renderDonation();
  updateWizNav();
}

/* ---------- Visionneuse plein écran ---------- */
const viewer = { list: [], idx: 0, selectable: false, url: null };
function openViewer(list, photo, selectable) {
  viewer.list = list; viewer.idx = list.indexOf(photo); viewer.selectable = selectable;
  $('#viewer').hidden = false;
  showViewer();
}
function showViewer() {
  const p = viewer.list[viewer.idx];
  if (!p) return;
  if (viewer.url) URL.revokeObjectURL(viewer.url);
  viewer.url = null;
  const img = $('#viewer-img');
  img.style.transform = '';
  img.classList.remove('rot');
  img.alt = p.name;
  if (!p.rawOnly) { viewer.url = URL.createObjectURL(p.file); img.src = viewer.url; }
  else {
    img.src = p.thumb || '';
    const token = (viewer.token = (viewer.token || 0) + 1);
    rawPreview(p.file).then(({ blob, orientation }) => {
      if (token !== viewer.token) return;
      viewer.url = URL.createObjectURL(blob);
      img.src = viewer.url;
      const deg = { 3: 180, 6: 90, 8: -90 }[orientation];
      if (deg) { img.style.transform = `rotate(${deg}deg)`; if (deg !== 180) img.classList.add('rot'); }
    }).catch(() => { if (token === viewer.token) toast('Aperçu indisponible pour ce fichier RAW'); });
  }
  $('#viewer-name').textContent = `${viewer.idx + 1} / ${viewer.list.length} · ${p.name}`;
  const tg = $('#viewer-toggle');
  tg.hidden = !viewer.selectable;
  tg.textContent = p.selected ? '✓ Choisie (toucher pour enlever)' : 'Choisir cette photo';
  tg.className = `btn ${p.selected ? 'btn-success' : 'btn-primary'}`;
}
function closeViewer() {
  $('#viewer').hidden = true;
  if (viewer.url) URL.revokeObjectURL(viewer.url);
  viewer.url = null;
  $('#viewer-img').src = '';
  if (current === 'wizard' && wiz.step === 2) renderSelection();
}

/* ---------------------------------------------------------
   Dossier des clients (sur le Chromebook / Google Drive)
   --------------------------------------------------------- */
let rootHandle = null;
async function loadRoot() {
  try { rootHandle = (await db.get('root')) || null; } catch { rootHandle = null; }
  renderFolderNames();
}
function renderFolderNames() {
  $$('.folder-name').forEach((el) => { el.textContent = rootHandle ? `📁 ${rootHandle.name}` : 'Aucun dossier choisi'; });
}
async function chooseRoot() {
  if (!hasFS) { toast("Ce navigateur ne permet pas d'écrire dans un dossier. Utilisez Chrome."); return false; }
  try {
    rootHandle = await window.showDirectoryPicker({ id: 'clients', mode: 'readwrite', startIn: 'documents' });
    await db.set('root', rootHandle);
    renderFolderNames();
    toast(`Dossier « ${rootHandle.name} » enregistré`);
    return true;
  } catch (e) {
    if (e.name !== 'AbortError') toast('Impossible de choisir ce dossier.');
    return false;
  }
}
async function ensureRoot() {
  if (!rootHandle && !(await chooseRoot())) return null;
  const opts = { mode: 'readwrite' };
  if ((await rootHandle.queryPermission(opts)) === 'granted') return rootHandle;
  if ((await rootHandle.requestPermission(opts)) === 'granted') return rootHandle;
  toast("Autorisation refusée pour le dossier des clients.");
  return null;
}
const safeName = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-');
const today = () => new Date().toISOString().slice(0, 10);

async function uniqueDir(parent, base) {
  let name = base, n = 2;
  for (;;) {
    try { await parent.getDirectoryHandle(name); name = `${base}_${n++}`; }
    catch { return parent.getDirectoryHandle(name, { create: true }); }
  }
}
async function copyFile(dir, file, name = file.name) {
  let target = name, n = 2;
  for (;;) {
    try { await dir.getFileHandle(target); target = `${stem(name)}_${n++}.${ext(name)}`; }
    catch { break; }
  }
  const fh = await dir.getFileHandle(target, { create: true });
  const w = await fh.createWritable();
  await file.stream().pipeTo(w);
  return target;
}
async function writeText(dir, name, text) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(text);
  await w.close();
}
function ficheText(c) {
  return [
    'FICHE CLIENT : HTV FLASH',
    '========================',
    `Date            : ${new Date(c.createdAt).toLocaleString('fr-FR')}`,
    `Nom             : ${c.nom}`,
    `Prénom          : ${c.prenom}`,
    `E-mail          : ${c.email}`,
    `Portable        : ${c.tel}`,
    `Photos choisies : ${c.photos.length}`,
    `Droit à l'image : ${c.consent ? 'ACCEPTÉ' : 'REFUSÉ'}`,
    c.consent ? `Texte accepté   : ${settings.consentText.replace(/\n/g, ' ')}` : '',
    `Paiement        : ${c.paid ? `PAYÉ (${c.payMethod === 'cash' ? 'espèces' : 'carte SumUp'}) ${euro(c.amount)}${c.formula ? ` · ${c.formula}` : ''}` : 'en attente'}`,
    c.event ? `Événement       : ${c.eventName}${c.eventPct ? ` (réduction ${c.eventPct} %)` : ''}` : '',
    c.event === 'telethon' ? `Reversé Téléthon: ${euro(c.donation)}` : '',
    `Retouche        : ${c.retouched ? 'terminée' : 'à faire'}`,
    '',
    'Liste des photos :',
    ...c.photos.map((p) => `  - ${p}`),
  ].filter((l) => l !== '').join('\n');
}
async function writeClientFiles(c, dir) {
  await writeText(dir, 'fiche-client.txt', ficheText(c));
  const { thumbData, ...data } = c;
  await writeText(dir, 'client.json', JSON.stringify(data, null, 2));
}
async function clientDir(c, ask = false) {
  if (!rootHandle) return null;
  const opts = { mode: 'readwrite' };
  let perm = await rootHandle.queryPermission(opts);
  if (perm !== 'granted' && ask) perm = await rootHandle.requestPermission(opts);
  if (perm !== 'granted') return null;
  try { return await rootHandle.getDirectoryHandle(c.folder); } catch { return null; }
}
async function syncClientFile(c) {
  try { const dir = await clientDir(c); if (dir) await writeClientFiles(c, dir); } catch (e) { console.warn(e); }
}

async function copyPhotosTo(dir, photos, label) {
  const todo = await dir.getDirectoryHandle('1-A-retoucher', { create: true });
  await dir.getDirectoryHandle('2-Retouchees', { create: true });
  const names = [];
  const total = photos.reduce((n, p) => n + 1 + (p.raw ? 1 : 0), 0);
  let done = 0;
  for (const p of photos) {
    busy(true, `${label} ${done + 1} / ${total}`, done / total);
    names.push(await copyFile(todo, p.file));
    done++;
    if (p.raw) { busy(true, `${label} ${done + 1} / ${total}`, done / total); await copyFile(todo, p.raw); done++; }
  }
  return names;
}

async function thumbDataFor(photo) {
  if (!photo) return '';
  try {
    const url = await makeThumb(photo, 180);
    const blob = await (await fetch(url)).blob();
    URL.revokeObjectURL(url);
    return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  } catch { return ''; }
}

/* ---------------------------------------------------------
   Parcours guidé
   --------------------------------------------------------- */
const STEPS = ['Carte microSD', 'Photos', 'Coordonnées', "Droit à l'image", 'Enregistrer', 'Paiement'];
const wiz = { step: 1, consent: null, savedId: null };

function renderStepper() {
  $('#stepper').innerHTML = STEPS.map((s, i) => {
    const n = i + 1;
    const cls = n < wiz.step ? 'done' : n === wiz.step ? 'current' : '';
    return `<li class="${cls}"><span class="dot">${n < wiz.step ? '✓' : n}</span><span class="lbl">${esc(s)}</span></li>`;
  }).join('');
}
function showStep(n) {
  if (wiz.savedId && n < 5) n = 5; // fiche déjà enregistrée : on ne revient plus en arrière
  wiz.step = Math.min(Math.max(n, 1), 7);
  $$('.wiz-step').forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === wiz.step));
  $('#screen-title').textContent = wiz.step <= 6 ? `Étape ${wiz.step} sur 6` : 'Terminé';
  $('#stepper').hidden = wiz.step === 7;
  renderStepper();
  // étape 1 : on repart toujours d'une carte à lire (jamais les photos d'une carte précédente)
  if (wiz.step === 1) { if (session.photos.length) loadSession('', [], true); else renderImport(); }
  if (wiz.step === 2) renderSelection();
  if (wiz.step === 3) { renderDonation(); setTimeout(() => { const f = $$('#client-form input').find((i) => !i.value); if (f) f.focus(); }, 250); }
  if (wiz.step === 4) renderConsent();
  if (wiz.step === 5) renderRecap();
  if (wiz.step === 6) mountPay('wizard');
  if (wiz.step === 7) renderDone();
  updateWizNav();
  window.scrollTo({ top: 0 });
}
function formData() {
  const f = $('#client-form');
  return {
    nom: f.nom.value.trim().toUpperCase(),
    prenom: f.prenom.value.trim().toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, c) => sep + c.toUpperCase()),
    email: f.email.value.trim().toLowerCase(),
    tel: f.tel.value.trim(),
  };
}
function formErrors(mark = false) {
  const f = $('#client-form');
  const d = formData();
  const bad = [];
  if (!d.nom) bad.push(['nom', 'le nom']);
  if (!d.prenom) bad.push(['prenom', 'le prénom']);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) bad.push(['email', "l'e-mail"]);
  if (d.tel.replace(/\D/g, '').length < 10) bad.push(['tel', 'le n° de portable']);
  if (mark) {
    $$('input', f).forEach((i) => i.classList.remove('invalid'));
    bad.forEach(([n]) => f[n].classList.add('invalid'));
    if (bad[0]) f[bad[0][0]].focus();
  }
  return bad.map((b) => b[1]);
}
function stepProblem(n) {
  if (n === 1 && !session.photos.length) return "Lisez d'abord la carte microSD";
  if (n === 2 && !session.photos.some((p) => p.selected)) return 'Choisissez au moins une photo';
  if (n === 3) { const e = formErrors(); if (e.length) return `Complétez ${e.join(', ')}`; }
  if (n === 4 && wiz.consent === null) return 'Touchez « J\'accepte » ou « Je refuse »';
  return '';
}
function updateWizNav() {
  if (current !== 'wizard') return;
  const s = wiz.step;
  const prev = $('#wiz-prev'), next = $('#wiz-next'), hint = $('#wiz-hint');
  $('.wiz-nav').hidden = s === 7;
  prev.style.visibility = s === 1 || (wiz.savedId && s === 5) ? 'hidden' : 'visible';
  const problem = stepProblem(s);
  hint.textContent = problem;
  next.classList.toggle('btn-success', false);
  if (s === 5) next.textContent = wiz.savedId ? 'Passer au paiement →' : '💾 Enregistrer';
  else if (s === 6) next.textContent = 'Terminer';
  else next.textContent = 'Suivant →';
  next.style.opacity = problem ? .5 : 1;
}
async function wizNext() {
  const s = wiz.step;
  const problem = stepProblem(s);
  if (problem) { if (s === 3) formErrors(true); toast(problem); return; }
  if (s === 5 && !wiz.savedId) { await saveClient(); return; }
  if (s === 6) {
    const c = wiz.savedId && (await db.client(wiz.savedId));
    if (c && !c.paid) toast('Paiement à faire plus tard : retrouvez-le dans « Photos à retoucher ».', 3500);
  }
  go('wizard', s + 1);
}
function wizPrev() { if (wiz.step > 1) go('wizard', wiz.step - 1); }

function newSession({ keepPhotos = false } = {}) {
  $('#client-form').reset();
  $$('#client-form input').forEach((i) => i.classList.remove('invalid'));
  wiz.consent = null;
  wiz.savedId = null;
  payState.clientId = '';
  payState.formula = null;
  payState.amount = '';
  if (!keepPhotos) loadSession('', [], true);
  else session.photos.forEach((p) => { p.selected = false; });
}

function renderDonation() {
  const ev = activeEvent();
  const box = $('#donation-box');
  box.hidden = !ev;
  if (!ev) return;
  const n = session.photos.filter((p) => p.selected).length;
  const f = formulaForCount(n);
  const pct = eventPct(ev.id);
  $('#donation-icon').innerHTML = ev.id === 'telethon' ? '<img src="icons/telethon.svg" alt="Téléthon">' : ev.emoji;
  const formulaLine = f ? `${formulaName(f)} (${f.photos} photo${f.photos > 1 ? 's' : ''}) : ${priceHTML(f, pct)}` : "Choisissez vos photos à l'étape 2";
  if (ev.id === 'telethon') {
    $('#donation-title').textContent = 'Montant reversé au Téléthon';
    $('#donation-detail').innerHTML = `${formulaLine}${pct ? ` <span class="pill-mini">−${pct} %</span>` : ''}`;
    $('#donation-amount').textContent = euro(f ? f.telethon : 0);
  } else {
    $('#donation-title').textContent = `Réduction ${ev.name}`;
    $('#donation-detail').innerHTML = formulaLine;
    $('#donation-amount').textContent = `−${pct} %`;
  }
}

function renderConsent() {
  $('#consent-text').textContent = settings.consentText;
  $$('[data-consent]').forEach((b) => b.classList.toggle('on', wiz.consent === b.dataset.consent));
}

function renderRecap() {
  const d = formData();
  const sel = session.photos.filter((p) => p.selected);
  const saved = Boolean(wiz.savedId);
  $('#recap').hidden = saved;
  $('#saved-ok').hidden = !saved;
  if (saved) return;
  $('#recap').innerHTML = `
    <dt>Nom</dt><dd>${esc(d.nom)} ${esc(d.prenom)}</dd>
    <dt>E-mail</dt><dd>${esc(d.email)}</dd>
    <dt>Portable</dt><dd>${esc(d.tel)}</dd>
    <dt>Droit à l'image</dt><dd>${wiz.consent === 'yes' ? '👍 Accepté' : '🙅 Refusé'}</dd>
    <dt>Photos</dt><dd>${sel.length} photo(s)${sel.some((p) => p.raw) ? ' (+ fichiers RAW)' : ''}</dd>
    ${(() => {
      const ev = activeEvent(); const f = formulaForCount(sel.length);
      if (!f) return '';
      const pct = ev ? eventPct(ev.id) : 0;
      return `<dt>Formule</dt><dd>${esc(formulaName(f))} : ${priceHTML(f, pct)}</dd>${ev ? `<dt>${esc(ev.name)}</dt><dd>${pct ? `−${pct} %` : ''}${ev.id === 'telethon' ? ` · ${euro(f.telethon)} reversés au Téléthon` : ''}</dd>` : ''}`;
    })()}
    <div class="thumbs">${sel.slice(0, 24).map((p) => (p.thumb ? `<img src="${p.thumb}" alt="">` : '')).join('')}${sel.length > 24 ? `<span class="muted">+${sel.length - 24}</span>` : ''}</div>`;
  renderFolderNames();
}

async function saveClient() {
  const root = await ensureRoot();
  if (!root) return;
  const d = formData();
  const sel = session.photos.filter((p) => p.selected);
  const base = safeName(`${today()}_${d.nom}_${d.prenom}`) || `client-${Date.now()}`;
  busy(true, 'Création du dossier…', 0);
  try {
    const dir = await uniqueDir(root, base);
    const names = await copyPhotosTo(dir, sel, 'Copie de la photo');
    const c = {
      id: `c${Date.now()}`,
      ...d,
      consent: wiz.consent === 'yes',
      consentText: wiz.consent === 'yes' ? settings.consentText : '',
      photos: names,
      folder: dir.name,
      createdAt: new Date().toISOString(),
      retouched: false,
      paid: false,
      amount: 0,
      formula: '',
      payMethod: '',
      thumbData: await thumbDataFor(sel[0]),
      event: activeEvent() ? activeEvent().id : '',
      eventName: activeEvent() ? activeEvent().name : '',
      eventPct: activeEvent() ? eventPct(activeEvent().id) : 0,
      formulaId: formulaForCount(sel.length)?.id || '',
      donation: activeEvent()?.id === 'telethon' ? (formulaForCount(sel.length)?.telethon || 0) : 0,
    };
    await writeClientFiles(c, dir);
    await db.putClient(c);
    wiz.savedId = c.id;
    payState.clientId = c.id;
    $('#saved-detail').textContent = `${names.length} fichier(s) copiés dans « ${root.name} / ${dir.name} / 1-A-retoucher ».`;
    busy(false);
    renderRecap();
    updateWizNav();
    toast('Fiche et photos enregistrées ✅');
  } catch (e) {
    console.error(e);
    busy(false);
    toast(`Erreur pendant l'enregistrement : ${e.message || e}`, 5000);
  }
}

async function renderDone() {
  const c = wiz.savedId && (await db.client(wiz.savedId));
  const d = c || formData();
  $('#done-name').textContent = d.prenom || '';
  $('#done-email').textContent = d.email || '';
}

/* ---------------------------------------------------------
   Paiement SumUp
   --------------------------------------------------------- */
const payState = { clientId: '', formula: null, amount: '' };
let payNode = null;

function mountPay(where) {
  if (!payNode) {
    payNode = $('#tpl-pay').content.firstElementChild.cloneNode(true);
    bindPay(payNode);
  }
  const mount = $(`[data-pay-mount="${where}"]`);
  if (payNode.parentElement !== mount) mount.appendChild(payNode);
  if (where === 'wizard' && wiz.savedId) payState.clientId = wiz.savedId;
  renderPay(where, true);
}
async function renderPay(where = current === 'wizard' ? 'wizard' : 'direct', preselect = false) {
  const sel = $('#pay-client', payNode);
  const clients = (await db.clients()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  sel.innerHTML = '<option value="">— Sans fiche client —</option>' + clients.map((c) => `<option value="${c.id}">${esc(c.prenom)} ${esc(c.nom)} · ${new Date(c.createdAt).toLocaleDateString('fr-FR')}${c.paid ? ' · payé' : ''}</option>`).join('');
  sel.value = payState.clientId || '';
  sel.disabled = where === 'wizard' && Boolean(wiz.savedId);

  const c = clients.find((x) => x.id === payState.clientId);
  payClientCache = c || null;
  // formule proposée d'après le nombre de photos du client
  if (preselect && c && !c.paid && !payState.formula && c.formulaId && settings.formulas.some((f) => f.id === c.formulaId)) {
    payState.formula = c.formulaId;
    payState.amount = String(discounted(currentFormula().price, payPct()));
  }
  const pct = payPct();
  // dès qu'un client est choisi (parcours ou accueil), la formule découle de ses photos :
  // les autres formules sont grisées et le montant n'est pas modifiable
  let lockId = '';
  if (c) {
    lockId = settings.formulas.some((f) => f.id === c.formulaId) ? c.formulaId : (formulaForCount((c.photos || []).length || 1)?.id || '');
  }
  const locked = Boolean(lockId);
  if (locked && (payState.formula !== lockId || where !== 'wizard')) {
    payState.formula = lockId;
    payState.amount = c.paid && c.amount ? String(c.amount) : String(discounted(currentFormula().price, pct));
  }
  payNode.classList.toggle('pay-locked', locked);
  $('#pay-amount', payNode).readOnly = locked;
  $('#pay-formulas', payNode).innerHTML = sortedFormulas().map((f) => `
    <button type="button" class="formula${payState.formula === f.id ? ' on' : ''}${locked && f.id !== lockId ? ' off' : ''}" data-fid="${f.id}"${locked && f.id !== lockId ? ' disabled' : ''}><b>${esc(formulaName(f))}</b><small>${f.photos} photo${f.photos > 1 ? 's' : ''}</small><span>${priceHTML(f, pct)}</span></button>`).join('')
    + (payEvent()?.ev?.id === 'telethon' ? '<div class="telethon-tile"><img src="icons/telethon.svg" alt="Téléthon"><span id="tt-amount"></span></div>' : '');
  $('#pay-amount', payNode).value = payState.amount;
  $('#pay-state', payNode).textContent = c && c.paid ? `✅ Déjà payé : ${euro(c.amount)} (${c.payMethod === 'cash' ? 'espèces' : 'carte'})` : '';
  refreshPayOutputs();
}
let payClientCache = null;
function payEvent() {
  // un client garde l'événement actif au moment de sa fiche ; sans fiche, on prend l'événement actif
  const c = payClientCache;
  if (c) return c.event ? { ev: EVENTS.find((e) => e.id === c.event), pct: c.eventPct || 0 } : null;
  const ev = activeEvent();
  return ev ? { ev, pct: eventPct(ev.id) } : null;
}
const payPct = () => payEvent()?.pct || 0;
function payDonationAmount() {
  const pe = payEvent();
  if (!pe || !pe.ev || pe.ev.id !== 'telethon') return 0;
  const f = currentFormula();
  return f ? Number(f.telethon) || 0 : (payClientCache?.donation || 0);
}
function showPayDonation() {
  const el = $('#pay-donation', payNode);
  const pe = payEvent();
  el.hidden = !pe || !pe.ev;
  if (el.hidden) return;
  const parts = [];
  if (pe.pct) parts.push(`Réduction ${pe.ev.name} −${pe.pct} %`);
  if (pe.ev.id === 'telethon') {
    parts.push(`dont ${euro(payDonationAmount())} reversés au Téléthon`);
    const tt = $('#tt-amount', payNode);
    if (tt) tt.textContent = currentFormula() || payClientCache ? `${euro(payDonationAmount())} reversés` : 'Merci pour votre soutien';
  }
  el.textContent = `${pe.ev.emoji} ${parts.join(' · ')}`;
}
// lien SumUp de la formule pour le mode en cours (sans réduction, Téléthon, Mariage, Événement)
const linkMode = (evId) => evId || 'none';
const formulaLink = (f, evId) => (f && f.links && f.links[linkMode(evId)]) || '';
function payLink() {
  const f = currentFormula();
  return formulaLink(f, payEvent()?.ev?.id) || settings.sumupLink;
}
function currentFormula() { return settings.formulas.find((f) => f.id === payState.formula) || null; }
function refreshPayOutputs() {
  const amt = Number(String(payState.amount).replace(',', '.')) || 0;
  $('#pay-total', payNode).textContent = euro(amt);
  showPayDonation();
  const f = currentFormula();
  const link = payLink();
  const qrWrap = $('#pay-qr-wrap', payNode);
  qrWrap.hidden = !link;
  if (link) {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(link);
      qr.make();
      $('#pay-qr', payNode).innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch { $('#pay-qr', payNode).textContent = 'QR code impossible'; }
  }
  $('#pay-sumup-app', payNode).hidden = !settings.sumupKey;
  $('#pay-sumup-app', payNode).disabled = amt <= 0;
  $('#pay-no-config', payNode).hidden = Boolean(link || settings.sumupKey);
}
function bindPay(node) {
  $('#pay-client', node).addEventListener('change', (e) => { payState.clientId = e.target.value; renderPay(); });
  $('#pay-formulas', node).addEventListener('click', (e) => {
    const b = e.target.closest('[data-fid]');
    if (!b || b.disabled) return;
    payState.formula = b.dataset.fid;
    payState.amount = String(discounted(currentFormula().price, payPct()));
    $$('.formula', node).forEach((x) => x.classList.toggle('on', x === b));
    $('#pay-amount', node).value = payState.amount;
    refreshPayOutputs();
  });
  $('#pay-amount', node).addEventListener('input', (e) => { if (e.target.readOnly) return; payState.amount = e.target.value; refreshPayOutputs(); });
  $('#pay-open-link', node).addEventListener('click', () => {
    const link = payLink();
    if (link) window.open(link, '_blank', 'noopener');
  });
  $('#pay-sumup-app', node).addEventListener('click', openSumUpApp);
  $('#pay-mark-card', node).addEventListener('click', () => markPaid('card'));
  $('#pay-mark-cash', node).addEventListener('click', () => markPaid('cash'));
}
function openSumUpApp() {
  // API « SumUp URL scheme » : ouvre l'app SumUp avec le montant pré-rempli
  const amt = (Number(String(payState.amount).replace(',', '.')) || 0).toFixed(2);
  const f = currentFormula();
  const back = `${location.origin}${location.pathname}`;
  try { localStorage.setItem('htv-pending-pay', JSON.stringify({ ...payState, at: Date.now(), from: current, step: wiz.step, savedId: wiz.savedId })); } catch { /* ignore */ }
  const params = new URLSearchParams({
    'affiliate-key': settings.sumupKey,
    amount: amt,
    currency: 'EUR',
    title: `HTV Flash${f ? ` - ${formulaName(f)}` : ''}`,
    'foreign-tx-id': `htv-${Date.now()}`,
    callbacksuccess: `${back}?sumup=success`,
    callbackfail: `${back}?sumup=fail`,
  });
  location.href = `sumupmerchant://pay/1.0?${params}`;
}
async function markPaid(method) {
  const amt = Number(String(payState.amount).replace(',', '.')) || 0;
  if (amt <= 0) { toast('Indiquez le montant payé.'); return; }
  const f = currentFormula();
  if (payState.clientId) {
    const c = await db.client(payState.clientId);
    if (c) {
      Object.assign(c, { paid: true, payMethod: method, amount: amt, formula: f ? formulaName(f) : '', paidAt: new Date().toISOString() });
      if (c.event === 'telethon') { c.donation = payDonationAmount(); }
      if (f) c.formulaId = f.id;
      await db.putClient(c);
      syncClientFile(c);
    }
  }
  toast(`Paiement de ${euro(amt)} enregistré ✅`);
  if (current === 'wizard') go('wizard', 7);
  else renderPay();
}
async function handleSumUpReturn() {
  const q = new URLSearchParams(location.search);
  const status = q.get('sumup') || q.get('smp-status');
  if (!status) return;
  history.replaceState(null, '', location.pathname + location.hash);
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem('htv-pending-pay') || 'null'); localStorage.removeItem('htv-pending-pay'); } catch { /* ignore */ }
  if (!pending) return;
  Object.assign(payState, { clientId: pending.clientId, formula: pending.formula, amount: pending.amount });
  if (pending.savedId) wiz.savedId = pending.savedId;
  if (status === 'success') await markPaid('card');
  else toast('Paiement SumUp annulé ou refusé.', 4000);
}

/* ---------------------------------------------------------
   Liste des clients (photos à retoucher)
   --------------------------------------------------------- */
let clientFilter = 'all';
async function renderClients() {
  renderFolderNames();
  const q = $('#client-search').value.trim().toLowerCase();
  let list = (await db.clients()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (clientFilter === 'todo') list = list.filter((c) => !c.retouched);
  if (clientFilter === 'unpaid') list = list.filter((c) => !c.paid);
  if (q) list = list.filter((c) => `${c.nom} ${c.prenom} ${c.email} ${c.tel}`.toLowerCase().includes(q));
  $('#clients-empty').hidden = list.length > 0;
  $('#client-list').innerHTML = list.map((c) => `
    <button class="client-item" data-cid="${c.id}">
      <span class="client-thumb">${c.thumbData ? `<img src="${c.thumbData}" alt="">` : '👤'}</span>
      <span class="client-info">
        <b>${esc(c.prenom)} ${esc(c.nom)}</b>
        <span class="muted small">${new Date(c.createdAt).toLocaleDateString('fr-FR')} · ${c.photos.length} photo(s)</span>
        <span class="badges">${badges(c)}</span>
      </span>
    </button>`).join('');
}
function badges(c) {
  return [
    c.retouched ? '<span class="badge ok">✓ Retouché</span>' : '<span class="badge warn">À retoucher</span>',
    c.paid ? `<span class="badge ok">Payé ${euro(c.amount)}</span>` : '<span class="badge no">Non payé</span>',
    c.consent ? '<span class="badge ok">Droit image ✓</span>' : '<span class="badge">Droit image ✗</span>',
    c.event ? `<span class="badge">${esc(c.eventName)}${c.event === 'telethon' ? ` ${euro(c.donation)}` : ''}</span>` : '',
  ].join('');
}

let detailId = null;
let detailPhotos = [];
async function renderClientDetail(id) {
  detailId = id;
  const c = await db.client(id);
  if (!c) { go('clients'); return; }
  $('#screen-title').textContent = `${c.prenom} ${c.nom}`;
  $('#cd-name').textContent = `${c.prenom} ${c.nom}`;
  $('#cd-contact').innerHTML = `${esc(c.email)} · ${esc(c.tel)}`;
  $('#cd-badges').innerHTML = badges(c);
  $('#cd-retouch').textContent = c.retouched ? '↩ Remettre « à retoucher »' : '✓ Retouche terminée';
  $('#cd-folder').textContent = rootHandle ? `Dossier : ${rootHandle.name} / ${c.folder}` : `Dossier : ${c.folder}`;
  const n = session.photos.filter((p) => p.selected).length;
  $('#cd-add').textContent = `+ Ajouter les photos choisies de l'import en cours (${n})`;
  $('#cd-add').disabled = n === 0;
  await loadDetailPhotos(c, false);
}
let detailToken = 0;
async function loadDetailPhotos(c, ask) {
  const token = ++detailToken;
  const grid = $('#cd-grid');
  const empty = $('#cd-empty');
  grid.innerHTML = '';
  detailPhotos.forEach((p) => p.thumb && URL.revokeObjectURL(p.thumb));
  detailPhotos = [];
  let dir = null;
  try { dir = await clientDir(c, ask); } catch { dir = null; }
  if (token !== detailToken) return;
  if (!dir) {
    empty.hidden = false;
    empty.innerHTML = rootHandle
      ? `Touchez pour afficher les photos du dossier.<br><button class="btn btn-primary" id="cd-unlock">Afficher les photos</button>`
      : 'Aucun dossier des clients choisi sur cet appareil.';
    const u = $('#cd-unlock');
    if (u) u.onclick = () => loadDetailPhotos(c, true);
    return;
  }
  empty.hidden = true;
  const entries = [];
  for (const sub of ['1-A-retoucher', '2-Retouchees']) {
    try {
      const d = await dir.getDirectoryHandle(sub);
      for await (const [name, h] of d.entries()) {
        if (h.kind === 'file' && (IMG_EXT.includes(ext(name)) || RAW_EXT.includes(ext(name)))) entries.push({ name: sub === '2-Retouchees' ? `✨ ${name}` : name, file: await h.getFile() });
      }
    } catch { /* sous-dossier absent */ }
  }
  if (token !== detailToken) return; // un autre affichage a démarré entre-temps
  // un RAW accompagné de son JPEG n'est pas affiché deux fois
  const jpegStems = new Set(entries.filter((e) => IMG_EXT.includes(ext(e.name))).map((e) => stem(e.name).toLowerCase()));
  const shown = entries.filter((e) => IMG_EXT.includes(ext(e.name)) || !jpegStems.has(stem(e.name).toLowerCase()));
  detailPhotos = shown.map((e, i) => ({ id: `d${i}`, name: e.name, file: e.file, raw: null, rawOnly: RAW_EXT.includes(ext(e.name)), thumb: null, selected: false }));
  if (!detailPhotos.length) { empty.hidden = false; empty.textContent = 'Aucune photo dans ce dossier.'; }
  const frag = document.createDocumentFragment();
  detailPhotos.forEach((p) => frag.appendChild(photoTile(p, { list: detailPhotos })));
  grid.appendChild(frag);
}

/* ---------------------------------------------------------
   Réglages
   --------------------------------------------------------- */
function renderSettings() {
  $('#theme-grid').innerHTML = THEMES.map((t) => `
    <button class="theme-opt${settings.theme === t.id ? ' on' : ''}" data-theme-id="${t.id}"
      style="--sw-bg:${t.id === 'auto' ? 'conic-gradient(#0d1f33,#dff3d9,#5fd0e6,#7a3a12,#0d1f33)' : t.bg};--sw-bg2:${t.bg2};--sw-text:${t.text}">
      <span>${t.emoji}</span>${esc(t.name)}${t.id === 'auto' ? `<small>(${esc(THEMES.find((x) => x.id === themeForDate()).name)})</small>` : ''}
    </button>`).join('');
  $$('.theme-opt').forEach((b) => { if (b.dataset.themeId === 'auto') b.style.background = 'linear-gradient(135deg,#0d1f33 0%,#2b4d72 25%,#ec6f9e 50%,#ff9a2e 75%,#d42a3a 100%)'; });
  $('#set-anim').checked = settings.anim;
  $('#set-sumup-link').value = settings.sumupLink;
  $('#set-sumup-key').value = settings.sumupKey;
  $('#set-consent').value = settings.consentText;
  renderFormulaList();
  renderEvents();
  renderFolderNames();
  $('#app-version').textContent = `HTV Flash v${APP_VERSION} · ${hasFS ? 'accès aux dossiers OK' : 'accès aux dossiers indisponible sur ce navigateur'}`;
}
function renderEvents() {
  $('#event-grid').innerHTML = EVENTS.map((e) => `
    <div class="event-row${settings.eventActive === e.id ? ' on' : ''}">
      <span class="ev-emoji">${e.emoji}</span>
      <span class="ev-text"><b>${esc(e.name)}</b><small>${esc(e.note)}</small></span>
      <label class="event-pct">−<input type="number" inputmode="numeric" min="0" max="100" step="1" data-pct="${e.id}" value="${eventPct(e.id)}"> %</label>
      <input type="checkbox" class="switch" data-ev="${e.id}" ${settings.eventActive === e.id ? 'checked' : ''} aria-label="Activer ${esc(e.name)}">
    </div>`).join('');
}
function renderFormulaList() {
  const th = THEMES.find((t) => t.id === currentThemeId());
  const ev = activeEvent();
  const pct = ev ? eventPct(ev.id) : 0;
  const isTel = ev?.id === 'telethon';
  $('#formula-title').textContent = ev ? `Formules · prix ${ev.name}` : 'Formules · prix normal';
  // colonnes : nom, photos, prix d'origine, [prix réduit], [reversé Téléthon], lien, supprimer
  const cols = ['1.5fr', '.55fr', '.75fr', ...(ev ? ['.8fr'] : []), ...(isTel ? ['.75fr'] : []), '1.6fr', 'auto'].join(' ');
  const style = `style="grid-template-columns:${cols}"`;
  $('#formula-list').innerHTML = `<p class="link-mode">${ev
    ? `${ev.emoji} <b>${esc(ev.name)} activé : prix réduits de ${pct} %.</b> Les liens SumUp ci-dessous sont ceux des prix ${esc(ev.name)}.`
    : '<b>Aucune réduction : prix normaux.</b> Les liens SumUp ci-dessous sont ceux des prix normaux.'} Cochez une autre réduction plus haut pour voir ses prix et ses liens.</p>
    <p class="muted small">Les noms suivent le thème choisi (actuellement : ${esc(th ? `${th.emoji} ${th.name}` : '')}). Un nom modifié ici ne change que pour ce thème.</p>
    <div class="formula-row head" ${style}><span>Nom</span><span>Photos</span><span>Prix d'origine</span>${ev ? `<span>Prix ${esc(ev.name)}</span>` : ''}${isTel ? '<span>Reversé Téléthon</span>' : ''}<span>Lien SumUp${ev ? ` · ${esc(ev.name)}` : ' · prix normal'}</span><span></span></div>` +
    settings.formulas.map((f, i) => `
    <div class="formula-row" data-i="${i}" ${style}>
      <input data-k="name" value="${esc(formulaName(f))}" placeholder="Nom de la formule">
      <input data-k="photos" type="number" inputmode="numeric" min="1" step="1" value="${esc(f.photos ?? 1)}" aria-label="Nombre de photos">
      <input data-k="price" type="number" inputmode="decimal" step="0.5" min="0" value="${esc(f.price)}" aria-label="Prix d'origine en euros">
      ${ev ? `<span class="reduced-price">${euro(discounted(f.price, pct))}</span>` : ''}
      ${isTel ? `<input data-k="telethon" type="number" inputmode="decimal" step="0.5" min="0" value="${esc(f.telethon ?? 0)}" aria-label="Montant reversé au Téléthon">` : ''}
      <input data-k="link" type="url" value="${esc(formulaLink(f, ev?.id))}" placeholder="Lien SumUp à ${euro(ev ? discounted(f.price, pct) : f.price)}">
      <button class="icon-btn" data-del="${i}" aria-label="Supprimer">🗑</button>
    </div>`).join('');
}

function exportCSV(clients) {
  const cols = ['createdAt', 'nom', 'prenom', 'email', 'tel', 'consent', 'photos', 'paid', 'amount', 'payMethod', 'formula', 'eventName', 'donation', 'retouched', 'folder'];
  const head = ['Date', 'Nom', 'Prénom', 'E-mail', 'Portable', "Droit à l'image", 'Nb photos', 'Payé', 'Montant', 'Moyen', 'Formule', 'Événement', 'Montant reversé', 'Retouché', 'Dossier'];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = clients.map((c) => cols.map((k) => {
    if (k === 'photos') return c.photos.length;
    if (typeof c[k] === 'boolean') return c[k] ? 'oui' : 'non';
    if (k === 'createdAt') return new Date(c[k]).toLocaleString('fr-FR');
    return c[k];
  }).map(cell).join(';'));
  const blob = new Blob(['﻿' + [head.map(cell).join(';'), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `clients-htvflash-${today()}.csv` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function renderHome() {
  $('#steps-preview').innerHTML = STEPS.map((s, i) => `<span>${i + 1}. ${esc(s)}</span>`).join('');
}

/* ---------------------------------------------------------
   Code à 4 chiffres des réglages
   --------------------------------------------------------- */
let settingsUnlocked = false;
async function hashPin(pin) {
  const data = new TextEncoder().encode(`htvflash:${pin}`);
  if (crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `plain:${pin}`;
}
let pinResolve = null;
const pinState = { mode: 'check', entry: '', first: '' };
function askPin(mode = settings.pinHash ? 'check' : 'create') {
  if (pinResolve) pinResolve(false);
  Object.assign(pinState, { mode, entry: '', first: '' });
  updatePinUI();
  $('#pin').hidden = false;
  return new Promise((res) => { pinResolve = res; });
}
function updatePinUI() {
  const titles = {
    check: ['Code des réglages', 'Entrez votre code à 4 chiffres'],
    create: ['Créer un code', 'Choisissez un code à 4 chiffres pour protéger les réglages'],
    confirm: ['Confirmer le code', 'Entrez le même code une deuxième fois'],
  };
  const [t, sub] = titles[pinState.mode];
  $('#pin-title').textContent = t;
  $('#pin-sub').textContent = sub;
  $$('#pin-dots span').forEach((d, i) => d.classList.toggle('on', i < pinState.entry.length));
}
function closePin(ok) {
  $('#pin').hidden = true;
  const r = pinResolve; pinResolve = null;
  if (r) r(ok);
}
function pinShake(msg) {
  const d = $('#pin-dots');
  d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
  if (msg) toast(msg);
  pinState.entry = '';
  setTimeout(updatePinUI, 250);
}
async function pinKey(k) {
  if (k === 'cancel') { closePin(false); return; }
  if (k === 'back') { pinState.entry = pinState.entry.slice(0, -1); updatePinUI(); return; }
  if (pinState.entry.length >= 4) return;
  pinState.entry += k;
  updatePinUI();
  if (pinState.entry.length < 4) return;
  const entry = pinState.entry;
  if (pinState.mode === 'check') {
    if ((await hashPin(entry)) === settings.pinHash) closePin(true);
    else pinShake('Code incorrect');
  } else if (pinState.mode === 'create') {
    Object.assign(pinState, { first: entry, entry: '', mode: 'confirm' });
    setTimeout(updatePinUI, 150);
  } else if (pinState.mode === 'confirm') {
    if (entry !== pinState.first) { pinState.mode = 'create'; pinShake('Les deux codes sont différents, recommencez'); return; }
    settings.pinHash = await hashPin(entry);
    saveSettings();
    toast('Code enregistré 🔒');
    closePin(true);
  }
}

/* ---------------------------------------------------------
   Événements
   --------------------------------------------------------- */
function bind() {
  window.addEventListener('hashchange', route);
  $('#btn-home').addEventListener('click', () => go('home'));
  $('#btn-settings').addEventListener('click', () => go('settings'));

  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const w = e.target.closest('[data-wiz]');
    if (w) { e.preventDefault(); if (wiz.savedId) newSession(); go('wizard', Number(w.dataset.wiz)); return; }
    if (e.target.closest('.choose-root')) { chooseRoot(); }
  });

  $('#btn-start').addEventListener('click', () => {
    // nouvelle séance : la carte est toujours relue
    newSession();
    go('wizard', 1);
  });

  // Étape 1
  $('#btn-pick-sd').addEventListener('click', pickSD);
  $('#btn-import-again').addEventListener('click', pickSD);
  $('#btn-choose-sd').addEventListener('click', chooseSD);
  $('#btn-forget-sd').addEventListener('click', forgetSD);
  if (!hasFS) $('#fallback-pick').hidden = false;
  $('#input-fallback').addEventListener('change', (e) => {
    const files = [...e.target.files].map((f) => ({ path: f.webkitRelativePath || f.name, name: f.name, file: f }));
    loadSession('photos choisies', groupFiles(files));
    e.target.value = '';
  });

  // Étape 2
  $('#client-form').addEventListener('input', (e) => { e.target.classList.remove('invalid'); updateWizNav(); });
  $('#client-form').addEventListener('submit', (e) => { e.preventDefault(); wizNext(); });
  $('#client-form').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const inputs = $$('#client-form input');
    const i = inputs.indexOf(e.target);
    if (i >= 0 && i < inputs.length - 1) inputs[i + 1].focus(); else wizNext();
  });

  // Étape 3
  $('#btn-sel-all').addEventListener('click', () => { session.photos.forEach((p) => { p.selected = true; }); renderSelection(); });
  $('#btn-sel-none').addEventListener('click', () => { session.photos.forEach((p) => { p.selected = false; }); renderSelection(); });

  // Étape 4
  $$('[data-consent]').forEach((b) => b.addEventListener('click', () => { wiz.consent = b.dataset.consent; renderConsent(); updateWizNav(); setTimeout(wizNext, 350); }));

  // Navigation du parcours
  $('#wiz-next').addEventListener('click', wizNext);
  $('#wiz-prev').addEventListener('click', wizPrev);
  $('#btn-new-session').addEventListener('click', () => { newSession(); go('wizard', 1); });
  $('#btn-done-home').addEventListener('click', () => askWipeCard());
  $('#wipe-cancel').addEventListener('click', () => { $('#wipe').hidden = true; });
  $('#wipe-ok').addEventListener('click', () => wipeCard());

  // Visionneuse
  $('#viewer-close').addEventListener('click', closeViewer);
  $('#viewer-prev').addEventListener('click', () => { viewer.idx = (viewer.idx - 1 + viewer.list.length) % viewer.list.length; showViewer(); });
  $('#viewer-next').addEventListener('click', () => { viewer.idx = (viewer.idx + 1) % viewer.list.length; showViewer(); });
  $('#viewer-toggle').addEventListener('click', () => { const p = viewer.list[viewer.idx]; p.selected = !p.selected; showViewer(); updateSelCount(); });
  let sx = null;
  $('#viewer').addEventListener('pointerdown', (e) => { sx = e.clientX; });
  $('#viewer').addEventListener('pointerup', (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 60) $(dx < 0 ? '#viewer-next' : '#viewer-prev').click();
  });
  document.addEventListener('keydown', (e) => {
    if ($('#viewer').hidden) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight') $('#viewer-next').click();
    if (e.key === 'ArrowLeft') $('#viewer-prev').click();
  });

  // Clients
  $('#client-search').addEventListener('input', renderClients);
  $('#client-filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    clientFilter = b.dataset.f;
    $$('#client-filter button').forEach((x) => x.classList.toggle('on', x === b));
    renderClients();
  });
  $('#client-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cid]');
    if (b) go(`client/${b.dataset.cid}`);
  });
  $('#cd-retouch').addEventListener('click', async () => {
    const c = await db.client(detailId);
    c.retouched = !c.retouched;
    await db.putClient(c);
    syncClientFile(c);
    toast(c.retouched ? 'Marqué comme retouché ✓' : 'Remis « à retoucher »');
    renderClientDetail(detailId);
  });
  $('#cd-pay').addEventListener('click', () => { payState.clientId = detailId; payState.formula = null; payState.amount = ''; go('payment'); });
  $('#cd-delete').addEventListener('click', async () => {
    const b = $('#cd-delete');
    if (!b.dataset.confirm) { b.dataset.confirm = '1'; b.textContent = 'Toucher encore pour confirmer'; setTimeout(() => { delete b.dataset.confirm; b.textContent = 'Retirer de la liste'; }, 4000); return; }
    delete b.dataset.confirm;
    b.textContent = 'Retirer de la liste';
    await db.delClient(detailId);
    toast('Client retiré de la liste (son dossier et ses photos sont conservés).', 4000);
    go('clients');
  });
  $('#cd-add').addEventListener('click', async () => {
    const c = await db.client(detailId);
    const sel = session.photos.filter((p) => p.selected);
    if (!sel.length) return;
    const root = await ensureRoot();
    if (!root) return;
    try {
      const dir = await root.getDirectoryHandle(c.folder, { create: true });
      const names = await copyPhotosTo(dir, sel, 'Copie de la photo');
      c.photos.push(...names);
      await writeClientFiles(c, dir);
      await db.putClient(c);
      toast(`${names.length} fichier(s) ajouté(s) ✅`);
    } catch (e) { toast(`Erreur : ${e.message || e}`, 5000); }
    busy(false);
    renderClientDetail(detailId);
  });

  // Réglages
  $('#theme-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-theme-id]');
    if (!b) return;
    settings.theme = b.dataset.themeId;
    saveSettings(); applyTheme(); renderSettings();
  });
  $('#set-anim').addEventListener('change', (e) => { settings.anim = e.target.checked; saveSettings(); applyTheme(); });
  $('#set-sumup-link').addEventListener('change', (e) => { settings.sumupLink = e.target.value.trim(); saveSettings(); toast('Lien SumUp enregistré'); });
  $('#set-sumup-key').addEventListener('change', (e) => { settings.sumupKey = e.target.value.trim(); saveSettings(); toast('Clé SumUp enregistrée'); });
  $('#set-consent').addEventListener('change', (e) => { settings.consentText = e.target.value.trim() || DEFAULT_SETTINGS.consentText; saveSettings(); toast('Texte enregistré'); });
  $('#formula-list').addEventListener('change', (e) => {
    const row = e.target.closest('[data-i]');
    if (!row || !e.target.dataset.k) return;
    const f = settings.formulas[Number(row.dataset.i)];
    const k = e.target.dataset.k;
    if (k === 'name') {
      // un nom modifié ne s'applique qu'au thème en cours
      const v = e.target.value.trim();
      f.names = { ...(f.names || {}), [currentThemeId()]: v };
      if (!v) delete f.names[currentThemeId()];
      saveSettings(); renderFormulaList();
      return;
    }
    if (k === 'link') {
      f.links = { ...(f.links || {}), [linkMode(activeEvent()?.id)]: e.target.value.trim() };
      saveSettings();
      toast(`Lien SumUp enregistré (${activeEvent() ? activeEvent().name : 'sans réduction'})`);
      return;
    }
    f[k] = ['price', 'photos', 'telethon'].includes(k) ? Number(e.target.value) || 0 : e.target.value.trim();
    if (k === 'price') { saveSettings(); renderFormulaList(); return; }
    saveSettings();
  });
  $('#formula-list').addEventListener('click', (e) => {
    const d = e.target.closest('[data-del]');
    if (!d) return;
    settings.formulas.splice(Number(d.dataset.del), 1);
    saveSettings(); renderFormulaList();
  });
  $('#btn-add-formula').addEventListener('click', () => {
    settings.formulas.push({ id: `f${Date.now()}`, name: 'Nouvelle formule', photos: 1, price: 0, telethon: 0, links: {} });
    saveSettings(); renderFormulaList();
    const inputs = $$('#formula-list input[data-k="name"]');
    inputs[inputs.length - 1].select();
  });
  $('#pin-pad').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) pinKey(b.dataset.k); });
  document.addEventListener('keydown', (e) => {
    if ($('#pin').hidden) return;
    if (/^[0-9]$/.test(e.key)) pinKey(e.key);
    else if (e.key === 'Backspace') pinKey('back');
    else if (e.key === 'Escape') pinKey('cancel');
  });
  $('#btn-change-pin').addEventListener('click', async () => {
    const old = settings.pinHash;
    if (!(await askPin('create'))) { settings.pinHash = old; }
  });
  $('#btn-lock').addEventListener('click', () => { settingsUnlocked = false; go('home'); });
  $('#event-grid').addEventListener('change', (e) => {
    const id = e.target.dataset.ev;
    if (!id) return;
    settings.eventActive = e.target.checked ? id : 'none'; // un seul événement actif à la fois
    saveSettings(); renderEvents(); renderFormulaList();
    const ev = activeEvent();
    toast(ev ? `${ev.name} activé (−${eventPct(ev.id)} %)` : 'Aucune réduction active');
  });
  $('#event-grid').addEventListener('change', (e) => {
    const id = e.target.dataset.pct;
    if (!id) return;
    const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
    e.target.value = v;
    settings.eventPct = { ...settings.eventPct, [id]: v };
    saveSettings();
    toast(`Réduction enregistrée : −${v} %`);
    renderFormulaList();
  });
  $('#btn-export-csv').addEventListener('click', async () => exportCSV(await db.clients()));
  $('#btn-clear-session').addEventListener('click', () => { newSession(); toast('Import vidé'); });

  // changement de jour : le thème automatique suit la date
  setInterval(() => { if (settings.theme === 'auto') applyTheme(); }, 60 * 60 * 1000);
}

/* ---------------------------------------------------------
   Démarrage
   --------------------------------------------------------- */
(async function init() {
  applyTheme();
  bind();
  await loadRoot();
  await loadSdHandle();
  route();
  await handleSumUpReturn();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
})();

/* ---------- Fin : vider la carte microSD et revenir à l'accueil ---------- */
function askWipeCard() {
  const n = session.sdFiles.length;
  if (!n || !session.sdDir || !wiz.savedId) { newSession(); go('home'); return; }
  $('#wipe-sub').textContent = `${n} fichier(s) vont être supprimés de la carte « ${session.source} ». Les photos choisies sont déjà copiées dans le dossier du client ; les autres seront perdues.`;
  $('#wipe').hidden = false;
}
async function wipeCard() {
  $('#wipe').hidden = true;
  const dir = session.sdDir;
  try {
    if ((await dir.queryPermission({ mode: 'readwrite' })) !== 'granted' &&
        (await dir.requestPermission({ mode: 'readwrite' })) !== 'granted') {
      toast("La carte n'a pas été vidée : autorisation de modification refusée.", 4000);
      return;
    }
  } catch (e) { toast("La carte n'a pas été vidée : la carte a-t-elle été retirée ?", 4000); return; }
  const files = session.sdFiles;
  let done = 0, failed = 0;
  busy(true, 'Effacement de la carte…', 0);
  for (const f of files) {
    try { await f.parent.removeEntry(f.name); done++; } catch (e) { console.error(e); failed++; }
    busy(true, 'Effacement de la carte…', (done + failed) / files.length);
  }
  busy(false);
  if (failed) toast(`${done} fichier(s) supprimé(s), ${failed} n'ont pas pu l'être.`, 4500);
  else toast(`Carte vidée : ${done} fichier(s) supprimé(s). Vous pouvez la remettre dans l'appareil 📸`, 4500);
  newSession();
  go('home');
}
