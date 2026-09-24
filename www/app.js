(function () {
'use strict';

/* ================= helpers ================= */
const $ = (s) => document.querySelector(s);
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseKey = (k) => { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toMin = (t) => { const p = t.split(':').map(Number); return p[0] * 60 + p[1]; };
const fromMin = (m) => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
const fmt12 = (t) => { const p = t.split(':').map(Number); return (p[0] % 12 || 12) + ':' + pad(p[1]) + ' ' + (p[0] >= 12 ? 'PM' : 'AM'); };
const dur = (min) => (min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + (min % 60) + ' min');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PR = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const ALL = [0, 1, 2, 3, 4, 5, 6];
const dShort = (d) => d.getDate() + ' ' + MONTHS[d.getMonth()];

const ICON = {
  check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  back: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  finger: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 11v3c0 2-.5 4-1.5 6M8 14c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.2 3-.7 4.5M5 12a7 7 0 0114 0c0 1.5-.1 3-.4 4.5M8.5 5.2A7 7 0 0112 4"/></svg>'
};
const glyph = (d, on) => '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (on ? '#000' : '#5A5A5F') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';

const MARKS = [
  { d: 1, n: 'Rookie', g: 'M6 15l6-6 6 6' },
  { d: 3, n: 'Fighter', g: 'M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12' },
  { d: 7, n: 'Warrior', g: 'M5 5l14 14M19 5L5 19' },
  { d: 14, n: 'Knight', g: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z' },
  { d: 30, n: 'Titan', g: 'M3 19l6-10 4 6 3-4 5 8z' },
  { d: 90, n: 'Legend', g: 'M4 17l-1-9 5 4 4-7 4 7 5-4-1 9z' }
];

/* ================= state ================= */
const KEY = 'ascend.v1';
let S;
function defaults() {
  const t = dkey(new Date());
  const h = (id, name, time, days, kind, remind) => ({ id, name, time, days, kind: kind || 'habit', remind: remind || 0, created: t });
  return {
    v: 1, pin: null, created: t, notifOn: true,
    habits: [
      h('college', 'College', '08:00', [1, 2, 3, 4, 5], 'habit', 10),
      h('breakfast', 'Breakfast', '07:30', ALL),
      h('lunch', 'Lunch', '13:00', ALL),
      h('dinner', 'Dinner', '20:30', ALL),
      h('gym', 'Gym', '18:30', [1, 2, 3, 4, 5, 6], 'gym', 10),
      h('quran', 'Quran 15 min', '06:00', ALL),
      h('family', 'Family Time', '21:30', ALL),
      h('sleep', 'Sleep', '23:30', ALL, 'habit', 15),
      h('english', 'English 15 min', '22:00', ALL, 'learn'),
      h('world', 'World Skills', '22:30', ALL, 'learn')
    ],
    prayer: { lat: 33.6844, lng: 73.0479, hanafi: true, off: { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 } },
    log: {}, tasks: [], journal: [],
    gym: { plan: { 0: { title: 'Off', ex: [] }, 1: { title: 'Arms', ex: [] }, 2: { title: 'Chest', ex: [] }, 3: { title: 'Back', ex: [] }, 4: { title: 'Legs', ex: [] }, 5: { title: 'Shoulders', ex: [] }, 6: { title: 'Cardio', ex: [] } }, sets: {} },
    quits: [{ id: 'nofap', name: 'NoFap', start: null, history: [] }, { id: 'smoke', name: 'No Smoking', start: null, history: [] }]
  };
}
function load() {
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || !S.habits) S = defaults();
  if (!S.seed2) {
    if (!S.habits.some((h) => h.id === 'quran')) S.habits.push({ id: 'quran', name: 'Quran 15 min', time: '06:00', days: ALL.slice(), kind: 'habit', remind: 0, created: dkey(new Date()) });
    S.seed2 = true; save();
  }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ } }

const ui = { route: 'today', arg: null, locked: true, form: {}, pinMode: 'unlock', pinBuf: '', pinTmp: '', pinMsg: '', qsel: 0, ins: 'week', gDay: null, jq: '', jcat: 'All' };

/* ================= prayer times (offline) ================= */
const rad = (x) => x * Math.PI / 180, deg = (x) => x * 180 / Math.PI;
const sin = (x) => Math.sin(rad(x)), cos = (x) => Math.cos(rad(x)), tan = (x) => Math.tan(rad(x));
const asin = (x) => deg(Math.asin(x)), acos = (x) => deg(Math.acos(x)), atan2 = (y, x) => deg(Math.atan2(y, x));
const arccot = (x) => deg(Math.atan(1 / x));
const fixA = (a) => { a = a % 360; return a < 0 ? a + 360 : a; };
const fixH = (h) => { h = h % 24; return h < 0 ? h + 24 : h; };
function julian(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPos(jd) {
  const D = jd - 2451545.0;
  const g = fixA(357.529 + 0.98560028 * D), q = fixA(280.459 + 0.98564736 * D);
  const L = fixA(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const RA = fixH(atan2(cos(e) * sin(L), cos(L)) / 15);
  return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
}
const ptCache = {};
function prayerTimes(date) {
  const P = S.prayer, key = dkey(date) + '|' + P.lat + '|' + P.lng + '|' + P.hanafi + '|' + PR.map((n) => P.off[n]).join(',');
  if (ptCache[key]) return ptCache[key];
  const lat = P.lat, lng = P.lng;
  const tz = -date.getTimezoneOffset() / 60;
  const jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate()) - lng / 360;
  const mid = (t) => fixH(12 - sunPos(jd + t).eqt);
  const ang = (a, t, ccw) => {
    const d = sunPos(jd + t).decl;
    const v = (-sin(a) - sin(d) * sin(lat)) / (cos(d) * cos(lat));
    if (v > 1 || v < -1) return NaN;
    const h = acos(v) / 15;
    return mid(t) + (ccw ? -h : h);
  };
  const asr = (f, t) => { const d = sunPos(jd + t).decl; return ang(-arccot(f + tan(Math.abs(lat - d))), t); };
  const shift = tz - lng / 15;
  const raw = { Fajr: ang(18, 5 / 24, true), Dhuhr: mid(12 / 24), Asr: asr(P.hanafi ? 2 : 1, 13 / 24), Maghrib: ang(0.833, 18 / 24), Isha: ang(18, 18 / 24) };
  const out = {};
  PR.forEach((n) => {
    const h = raw[n] + shift;
    out[n] = isNaN(h) ? '00:00' : fromMin(Math.round(h * 60) + (P.off[n] || 0));
  });
  ptCache[key] = out;
  return out;
}

/* ================= schedule data ================= */
const habitById = (id) => S.habits.find((h) => h.id === id);
const isDone = (key, id) => !!(S.log[key] && S.log[key][id]);
function itemsFor(d) {
  const key = dkey(d), wd = d.getDay(), out = [];
  S.habits.forEach((h) => {
    if (h.days.indexOf(wd) >= 0 && key >= (h.created || S.created)) out.push({ id: h.id, name: h.name, time: h.time, type: 'habit', kind: h.kind, remind: h.remind || 0 });
  });
  if (key >= S.created) {
    const t = prayerTimes(d);
    PR.forEach((n) => out.push({ id: 'pray-' + n, name: n, time: t[n], type: 'prayer', kind: 'prayer', remind: 0 }));
  }
  S.tasks.forEach((t) => { if (t.date === key) out.push({ id: 'task-' + t.id, name: t.name, time: t.time, type: 'task', kind: 'task', remind: t.remind || 0, note: t.note }); });
  out.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  return out;
}
function streak(doneFn, dueFn, fromKey) {
  const today = startOfDay(new Date());
  let run = 0, best = 0;
  for (let d = parseKey(fromKey || S.created); d <= today; d = addDays(d, 1)) {
    if (!dueFn(d)) continue;
    if (doneFn(d)) { run++; if (run > best) best = run; }
    else if (dkey(d) !== dkey(today)) run = 0;
  }
  return { cur: run, best: best };
}
const habitStreak = (h) => streak((d) => isDone(dkey(d), h.id), (d) => h.days.indexOf(d.getDay()) >= 0, h.created || S.created);
const prayerStreak = (n) => streak((d) => isDone(dkey(d), 'pray-' + n), () => true);
const allPrayersStreak = () => streak((d) => PR.every((n) => isDone(dkey(d), 'pray-' + n)), () => true);

/* ================= reminders (phone app only) ================= */
const cap = (name) => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name]) || null;
const hashId = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483000; return h + 1; };
async function schedule(askPermission) {
  const LN = cap('LocalNotifications');
  if (!LN) return false;
  try {
    let p = await LN.checkPermissions();
    if (p.display !== 'granted') {
      if (!askPermission && !S.asked) return false;
      p = await LN.requestPermissions(); S.asked = true; save();
      if (p.display !== 'granted') return false;
    }
    const pend = await LN.getPending();
    if (pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications });
    if (!S.notifOn) return true;
    const list = [], now = Date.now(), today = startOfDay(new Date());
    for (let i = 0; i < 8; i++) {
      const d = addDays(today, i), key = dkey(d);
      itemsFor(d).forEach((it) => {
        if (isDone(key, it.id)) return;
        const p2 = it.time.split(':').map(Number);
        const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), p2[0], p2[1] - (it.remind || 0));
        if (at.getTime() < now + 5000) return;
        let body = it.remind ? 'In ' + it.remind + ' min · ' + fmt12(it.time) : 'It is time · ' + fmt12(it.time);
        if (it.type === 'prayer') body = 'Time for ' + it.name + ' prayer';
        if (it.kind === 'gym') { const pl = S.gym.plan[d.getDay()]; if (pl && pl.title) body += ' · ' + pl.title; }
        list.push({ id: hashId(key + it.id), title: it.name, body: body, schedule: { at: at, allowWhileIdle: true } });
      });
    }
    list.sort((a, b) => a.schedule.at - b.schedule.at);
    if (list.length) await LN.schedule({ notifications: list.slice(0, 120) });
    return true;
  } catch (e) { return false; }
}

/* ================= lock ================= */
const hashPin = (p) => { let h = 2166136261; const s = 'asc|' + p; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return String(h >>> 0); };
async function tryBio() {
  const NB = cap('NativeBiometric');
  if (!NB) return;
  try {
    await NB.verifyIdentity({ reason: 'Unlock Ascend', title: 'Ascend', subtitle: '', description: '' });
    unlock();
  } catch (e) { /* cancelled */ }
}
function unlock() { ui.locked = false; ui.route = 'today'; ui.pinBuf = ''; render(); schedule(true); }
function lockNow() { if (!S.pin) return; ui.locked = true; ui.pinMode = 'unlock'; ui.pinBuf = ''; ui.pinMsg = ''; render(); }

function vLock() {
  const m = ui.pinMode;
  const titles = { unlock: 'Enter PIN', setup1: 'Create a 4-digit PIN', setup2: 'Enter the PIN again', chg0: 'Enter current PIN', chg1: 'Enter new PIN', chg2: 'Enter new PIN again' };
  const dots = [0, 1, 2, 3].map((i) => '<i class="' + (i < ui.pinBuf.length ? 'on' : '') + '"></i>').join('');
  const hasBio = !!cap('NativeBiometric') && m === 'unlock';
  let pad9 = '';
  [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((n) => { pad9 += '<button data-a="key" data-k="' + n + '">' + n + '</button>'; });
  pad9 += hasBio ? '<button data-a="bio" aria-label="Use fingerprint">' + ICON.finger + '</button>' : '<button class="ph" disabled></button>';
  pad9 += '<button data-a="key" data-k="0">0</button><button data-a="bs" aria-label="Delete">&#9003;</button>';
  return '<div class="lock"><h1 style="font-size:40px">Ascend</h1><p class="muted" style="margin:14px 0 0">' + titles[m] + '</p><div class="dots">' + dots + '</div><div class="muted small" style="min-height:20px">' + esc(ui.pinMsg) + '</div><div class="pad">' + pad9 + '</div>' +
    (m.indexOf('chg') === 0 ? '<button class="linkm" data-a="cancelPin" style="margin-top:20px">Cancel</button>' : '') + '</div>';
}
function pinEntered() {
  const p = ui.pinBuf, m = ui.pinMode;
  ui.pinBuf = ''; ui.pinMsg = '';
  if (m === 'unlock') { if (hashPin(p) === S.pin) return unlock(); ui.pinMsg = 'Wrong PIN'; }
  else if (m === 'setup1') { ui.pinTmp = p; ui.pinMode = 'setup2'; }
  else if (m === 'setup2') { if (p === ui.pinTmp) { S.pin = hashPin(p); save(); return unlock(); } ui.pinMsg = 'PINs did not match'; ui.pinMode = 'setup1'; }
  else if (m === 'chg0') { if (hashPin(p) === S.pin) ui.pinMode = 'chg1'; else ui.pinMsg = 'Wrong PIN'; }
  else if (m === 'chg1') { ui.pinTmp = p; ui.pinMode = 'chg2'; }
  else if (m === 'chg2') { if (p === ui.pinTmp) { S.pin = hashPin(p); save(); ui.locked = false; ui.route = 'settings'; toast('PIN changed'); return render(); } ui.pinMsg = 'PINs did not match'; ui.pinMode = 'chg1'; }
  render();
}

/* ================= views ================= */
const nav = (a) => '<div class="nav">' + [['today', 'Today'], ['habits', 'Habits'], ['quit', 'Quit'], ['insights', 'Insights']].map((x) => '<button class="' + (x[0] === a ? 'on' : '') + '" data-a="go" data-r="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
const back = (r, t) => '<div class="topbar"><button class="back" data-a="go" data-r="' + r + '" aria-label="Back">' + ICON.back + '</button><h1>' + t + '</h1></div>';
const circ = (done, id, label, cls) => '<button class="circ ' + (cls || '') + (done ? ' on' : '') + '" data-a="toggle" data-id="' + id + '" aria-label="' + esc(label) + '">' + (done ? ICON.check : '') + '</button>';
const chips = (g, opts, sel, multi) => '<div class="chips">' + opts.map((o) => '<button class="chip' + ((multi ? sel.indexOf(o[0]) >= 0 : String(sel) === String(o[0])) ? ' on' : '') + '" data-a="chip" data-g="' + g + '" data-v="' + o[0] + '" data-m="' + (multi ? 1 : 0) + '">' + o[1] + '</button>').join('') + '</div>';
const field = (id, label, val, type, extra) => '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '" ' + (extra || '') + '></div>';
const dayChips = (g, sel) => chips(g, WD.map((w, i) => [i, w]), sel, true);

function vToday() {
  const now = new Date(), key = dkey(now), items = itemsFor(now);
  const nm = now.getHours() * 60 + now.getMinutes();
  const isD = (i) => isDone(key, i.id);
  const doneN = items.filter(isD).length;
  const nxt = items.find((i) => !isD(i) && toMin(i.time) >= nm) || items.find((i) => !isD(i));
  let top;
  if (!items.length) top = '<div class="muted">Nothing planned for today. Tap + Add.</div>';
  else if (!nxt) top = '<div class="card"><div class="muted">All done</div><div class="big">Good work today</div></div>';
  else {
    const diff = toMin(nxt.time) - nm;
    let sub = fmt12(nxt.time);
    if (nxt.kind === 'gym') { const pl = S.gym.plan[now.getDay()]; if (pl && pl.title) sub += ' · ' + esc(pl.title); }
    if (nxt.note) sub += ' · ' + esc(nxt.note);
    top = '<div class="card"><div class="muted">Next · ' + (diff >= 0 ? 'in ' + dur(diff) : dur(-diff) + ' late') + '</div><div class="big">' + esc(nxt.name) + '</div><div class="muted">' + sub + '</div><div class="btns"><button class="btn" data-a="toggle" data-id="' + nxt.id + '">Done</button><button class="btn ghost fit" data-a="open" data-id="' + nxt.id + '">Open</button></div></div>';
  }
  const rows = items.map((i) => {
    const tag = i.type === 'task' ? 'One-time' : '';
    return '<div class="row"><div class="t">' + fmt12(i.time) + '</div><button class="nb" data-a="open" data-id="' + i.id + '">' + esc(i.name) + (tag ? '<small>' + tag + '</small>' : '') + '</button>' + circ(isD(i), i.id, (isD(i) ? 'Done: ' : 'Mark done: ') + i.name) + '</div>';
  }).join('');
  let rev = '';
  if (S.journal.length > 3) {
    const old = S.journal.filter((j) => j.date < dkey(addDays(now, -3)));
    if (old.length) { const j = old[Math.abs(hashId(key)) % old.length]; rev = '<div class="muted small" style="line-height:1.5">Revise: <span style="color:#fff">' + esc(j.title) + '</span>' + (j.details ? ' · ' + esc(j.details) : '') + '</div>'; }
  }
  return '<div class="screen stack"><div class="head"><div><div class="muted small">' + WDL[now.getDay()] + ', ' + now.getDate() + ' ' + MONTHS[now.getMonth()] + '</div><div style="margin-top:6px"><h1>Today</h1></div></div><button class="link" data-a="go" data-r="add">+ Add</button></div>' +
    top + (items.length ? '<div class="muted small" style="margin-top:-8px">' + doneN + ' of ' + items.length + ' done</div>' : '') + '<div class="list" style="margin-top:-12px">' + rows + '</div>' + rev + '</div>' + nav('today');
}

function vAdd() {
  ui.form = { date: 'tomorrow', repeat: 'once', remind: '10', days: [] };
  const dt = addDays(new Date(), 1);
  return '<div class="screen stack"><div class="head"><h1>New task</h1><button class="link" data-a="go" data-r="today">Cancel</button></div>' +
    '<div><div class="lab">Quick add (daily)</div><div class="chips">' + ['Quran 15 min', 'Read a book', 'Walk', 'Study', 'Dhikr'].map((n) => '<button class="chip" data-a="preset" data-n="' + n + '">' + n + '</button>').join('') + '</div></div>' +
    field('f-name', 'What is it?', '', 'text', 'placeholder="e.g. Dawat at Uncle\'s house"') +
    '<div><div class="lab">Date</div>' + chips('date', [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['pick', 'Pick date']], 'tomorrow') + '<div id="f-datewrap" class="hidden" style="margin-top:10px">' + field('f-date', 'Date', dkey(dt), 'date') + '</div></div>' +
    field('f-time', 'Time', '19:00', 'time') +
    '<div><div class="lab">Repeat</div>' + chips('repeat', [['once', 'Only this day'], ['daily', 'Every day'], ['custom', 'Custom days']], 'once') + '<div id="f-days" class="hidden" style="margin-top:10px">' + dayChips('days', []) + '</div></div>' +
    '<div><div class="lab">Remind me</div>' + chips('remind', [['0', 'At the time'], ['10', '10 min before'], ['30', '30 min before']], '10') + '</div>' +
    field('f-note', 'Note (optional)', '', 'text') +
    '<button class="btn" data-a="addSave">Save</button></div>';
}
function addSave() {
  const name = $('#f-name').value.trim(), time = $('#f-time').value;
  if (!name) return toast('Write a name first');
  if (!time) return toast('Choose a time');
  const f = ui.form, note = $('#f-note').value.trim(), remind = +f.remind || 0;
  const todayD = new Date();
  let dateKey = f.date === 'today' ? dkey(todayD) : f.date === 'tomorrow' ? dkey(addDays(todayD, 1)) : $('#f-date').value;
  if (!dateKey) return toast('Pick a date');
  if (f.repeat === 'once') S.tasks.push({ id: uid(), name: name, date: dateKey, time: time, remind: remind, note: note });
  else {
    const days = f.repeat === 'daily' ? ALL.slice() : (f.days || []).map(Number);
    if (!days.length) return toast('Choose at least one day');
    S.habits.push({ id: 'h' + uid(), name: name, time: time, days: days, kind: 'habit', remind: remind, created: dateKey < S.created ? S.created : dateKey });
  }
  save(); schedule(true); ui.route = 'today'; toast('Saved'); render();
}

function vHabits() {
  const rows = S.habits.map((h) => {
    const st = habitStreak(h);
    const dl = h.days.length === 7 ? 'Every day' : h.days.map((d) => WD[d]).join(', ');
    return '<button class="row" data-a="open" data-id="' + h.id + '"><span class="n">' + esc(h.name) + '<small>' + fmt12(h.time) + ' · ' + dl + '</small></span><span class="r">' + st.cur + ' days</span></button>';
  }).join('');
  const ps = allPrayersStreak();
  return '<div class="screen stack"><div class="head"><h1>Habits</h1><button class="link" data-a="go" data-r="journal">Journal</button></div><div class="list">' + rows +
    '<button class="row" data-a="go" data-r="prayers"><span class="n">Prayers<small>5 times a day</small></span><span class="r">' + ps.cur + ' days</span></button></div>' +
    '<button class="btn ghost" data-a="go" data-r="add">+ New habit or task</button><button class="linkm" data-a="go" data-r="settings">Settings and backup</button></div>' + nav('habits');
}

function vHabit(id) {
  const h = habitById(id);
  if (!h) { ui.route = 'habits'; return vHabits(); }
  ui.form = { days: h.days.slice(), remind: String(h.remind || 0) };
  const st = habitStreak(h);
  return '<div class="screen stack">' + back('habits', esc(h.name)) +
    '<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:56px;font-weight:700;line-height:1">' + st.cur + '</span><span class="muted">day streak · Best ' + st.best + '</span></div>' +
    (h.kind === 'gym' ? '<button class="btn" data-a="go" data-r="gym">Open workout plan</button>' : '') +
    field('h-name', 'Name', h.name) + field('h-time', 'Time', h.time, 'time') +
    '<div><div class="lab">Active days</div>' + dayChips('days', h.days) + '<div class="muted small" style="margin-top:10px">On the days you switch off, skipping does not break your streak.</div></div>' +
    '<div><div class="lab">Remind me</div>' + chips('remind', [['0', 'At the time'], ['10', '10 min before'], ['30', '30 min before']], String(h.remind || 0)) + '</div>' +
    '<div class="btns" style="margin-top:0"><button class="btn" data-a="habitSave" data-id="' + h.id + '">Save</button><button class="btn ghost fit" data-a="habitDel" data-id="' + h.id + '">Delete</button></div></div>' + nav('habits');
}

function vGym() {
  const h = habitById('gym'), today = new Date(), tk = dkey(today);
  if (ui.gDay == null) ui.gDay = today.getDay();
  const gd = ui.gDay, plan = S.gym.plan[gd] || (S.gym.plan[gd] = { title: '', ex: [] });
  const st = h ? habitStreak(h) : { cur: 0, best: 0 };
  let week = '';
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i), k = dkey(d), due = h && h.days.indexOf(d.getDay()) >= 0;
    const c = !due ? '<span class="off">Off</span>' : '<span class="circ lg' + (isDone(k, 'gym') ? ' on' : '') + '">' + (isDone(k, 'gym') ? ICON.check : '') + '</span>';
    week += '<div class="d7"><span>' + WD[d.getDay()][0] + '</span>' + c + '</div>';
  }
  const isToday = gd === today.getDay(), setsToday = (S.gym.sets[tk] = S.gym.sets[tk] || {});
  const exs = plan.ex.map((e) => {
    let cs = '';
    for (let j = 0; j < e.sets; j++) {
      const on = isToday && (setsToday[e.id] || 0) > j;
      cs += '<button class="circ sm' + (on ? ' on' : '') + '" ' + (isToday ? 'data-a="gset" data-e="' + e.id + '" data-j="' + j + '"' : 'disabled') + ' aria-label="Set ' + (j + 1) + '">' + (on ? ICON.check.replace('width="18" height="18"', 'width="14" height="14"') : '') + '</button>';
    }
    return '<div class="ex"><div style="min-width:0"><div style="font-size:17px">' + esc(e.name) + '</div><div class="muted small" style="margin-top:2px">' + e.sets + ' × ' + e.reps + (e.kg ? ' · ' + esc(e.kg) + ' kg' : '') + '</div></div><div style="display:flex;align-items:center;gap:6px"><div class="sets">' + cs + '</div><button class="x" data-a="gdel" data-e="' + e.id + '" aria-label="Remove">&times;</button></div></div>';
  }).join('');
  const dayOff = h && h.days.indexOf(gd) < 0;
  return '<div class="screen stack">' + back('habits', 'Gym') +
    '<div class="head"><div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:56px;font-weight:700;line-height:1">' + st.cur + '</span><span class="muted">day streak</span></div><span class="muted">Best ' + st.best + '</span></div>' +
    '<div><div class="days7">' + week + '</div><div class="muted small" style="margin-top:14px">Off days never break your streak.</div><button class="linkm" data-a="go" data-r="habit" data-id="gym" style="justify-content:flex-start;margin-top:4px">Edit gym time and off days</button></div>' +
    '<div><div class="lab">Plan for</div>' + chips('gday', WD.map((w, i) => [i, w]), gd) + '</div>' +
    field('g-title', 'Muscle group / title', plan.title, 'text', 'placeholder="e.g. Arms"') +
    (dayOff ? '<div class="muted">This is an off day for Gym.</div>' : '') +
    '<div><div>' + exs + '</div>' + (isToday && plan.ex.length ? '<div class="muted small" style="margin-top:10px">Tap a circle after each set.</div>' : '') + '</div>' +
    '<div><div class="lab">Add exercise</div>' + field('g-name', 'Exercise', '', 'text', 'placeholder="e.g. Barbell Curl"') +
    '<div class="two" style="margin-top:10px">' + field('g-sets', 'Sets', '4', 'number', 'inputmode="numeric" min="1"') + field('g-reps', 'Reps', '12', 'number', 'inputmode="numeric" min="1"') + field('g-kg', 'Kg', '', 'number', 'inputmode="decimal"') + '</div>' +
    '<button class="btn" style="margin-top:12px;width:100%" data-a="gadd">Add exercise</button></div></div>' + nav('habits');
}

function vPrayers() {
  const now = new Date(), key = dkey(now), t = prayerTimes(now);
  const doneN = PR.filter((n) => isDone(key, 'pray-' + n)).length, ps = allPrayersStreak();
  const rows = PR.map((n) => {
    const st = prayerStreak(n), d = isDone(key, 'pray-' + n);
    return '<div class="row" style="min-height:76px"><span class="n"><span style="font-size:20px;font-weight:600">' + n + '</span> <span class="muted" style="font-size:15px;margin-left:8px">' + fmt12(t[n]) + '</span><small>Streak ' + st.cur + ' · Best ' + st.best + '</small></span>' + circ(d, 'pray-' + n, (d ? 'Done: ' : 'Mark done: ') + n, 'lg') + '</div>';
  }).join('');
  return '<div class="screen stack">' + back('habits', 'Prayers') +
    '<div class="sheetnote">' + doneN + ' of 5 today · ' + ps.cur + ' days in a row with all five (best ' + ps.best + ')<br>Times are calculated on your phone, no internet needed.</div>' +
    '<div class="list" style="margin-top:-8px">' + rows + '</div><button class="btn ghost" data-a="go" data-r="prayerset">Adjust prayer times</button></div>' + nav('habits');
}
function vPrayerSet() {
  const P = S.prayer, t = prayerTimes(new Date());
  ui.form = { asr: P.hanafi ? 'h' : 's' };
  return '<div class="screen stack">' + back('prayers', 'Prayer times') +
    '<div class="sheetnote">Compare with your local masjid timetable for a few days. If a time is off, add or remove minutes below.</div>' +
    '<div class="two">' + field('p-lat', 'Latitude', P.lat, 'number', 'step="any"') + field('p-lng', 'Longitude', P.lng, 'number', 'step="any"') + '</div>' +
    '<div><div class="lab">Asr method</div>' + chips('asr', [['h', 'Hanafi'], ['s', 'Standard']], P.hanafi ? 'h' : 's') + '</div>' +
    '<div><div class="lab">Adjust minutes (today: ' + PR.map((n) => n + ' ' + fmt12(t[n])).join(', ') + ')</div><div class="two" style="flex-wrap:wrap">' + PR.map((n) => field('p-' + n, n, P.off[n] || 0, 'number', 'inputmode="numeric"')).join('') + '</div></div>' +
    '<button class="btn" data-a="prayerSave">Save</button></div>' + nav('habits');
}

function badgesHtml(days) {
  return '<div class="badges">' + MARKS.map((m) => { const on = days >= m.d; return '<div class="badge' + (on ? ' on' : '') + '"><div>' + glyph(m.g, on) + '</div>' + m.n + '</div>'; }).join('') + '</div>';
}
function qBest(q) {
  let b = 0; q.history.forEach((h) => { b = Math.max(b, h.end - h.start); });
  if (q.start) b = Math.max(b, Date.now() - q.start);
  return Math.floor(b / 86400000);
}
function timerHtml(q) {
  const ms = Math.max(0, Date.now() - q.start), D = 86400000, H = 3600000, M = 60000;
  const days = Math.floor(ms / D);
  const nx = MARKS.find((m) => days < m.d);
  let prev = 0; MARKS.forEach((m) => { if (days >= m.d) prev = m.d; });
  let line = 'All badges earned', left = '', pct = 100;
  if (nx) { const rem = nx.d * D - ms; line = 'Next: ' + nx.n + ' at ' + nx.d + ' days'; left = Math.floor(rem / D) + ' d ' + Math.floor((rem % D) / H) + ' h to go'; pct = Math.round((ms - prev * D) / ((nx.d - prev) * D) * 100); }
  return '<div class="timer"><div class="muted small">Clean for</div><div class="days" style="margin-top:4px"><b>' + days + '</b><span>days</span></div><div class="units"><div><b>' + pad(Math.floor((ms % D) / H)) + '</b><span>hr</span></div><div><b>' + pad(Math.floor((ms % H) / M)) + '</b><span>min</span></div><div><b>' + pad(Math.floor((ms % M) / 1000)) + '</b><span>sec</span></div></div></div>' +
    '<div><div class="muted small" style="display:flex;justify-content:space-between;margin-bottom:8px"><span>' + line + '</span><span>' + left + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' + badgesHtml(days);
}
function vQuit() {
  if (ui.qsel >= S.quits.length) ui.qsel = 0;
  const q = S.quits[ui.qsel];
  const tabs = '<div class="chips">' + S.quits.map((x, i) => '<button class="chip' + (i === ui.qsel ? ' on' : '') + '" data-a="qsel" data-i="' + i + '">' + esc(x.name) + '</button>').join('') + '</div>';
  let body;
  if (!q) body = '<div class="muted">Tap + Add to start tracking something you want to quit.</div>';
  else if (!q.start) body = '<div class="card"><div class="big">Not started</div><div class="muted">Start the timer now, or set when it last happened.</div><div class="btns"><button class="btn" data-a="go" data-r="startquit" data-id="' + q.id + '">Start</button></div></div>';
  else body = '<div id="qtimer" class="stack">' + timerHtml(q) + '</div><div class="muted small">Started ' + dShort(new Date(q.start)) + ' · Best ' + qBest(q) + ' days</div>' +
    '<div class="btns" style="margin-top:0"><button class="btn ghost" data-a="go" data-r="relapse" data-id="' + q.id + '">Relapse</button><button class="btn ghost" data-a="go" data-r="history" data-id="' + q.id + '">History</button></div>' +
    '<button class="linkm" data-a="go" data-r="startquit" data-id="' + q.id + '" style="margin-top:-12px">Change start time</button>';
  return '<div class="screen stack"><div class="head"><h1>Quit</h1><button class="link" data-a="go" data-r="startquit" data-id="">+ Add</button></div>' + tabs + body + '</div>' + nav('quit');
}
function vStartQuit(id) {
  const q = S.quits.find((x) => x.id === id), now = new Date();
  ui.form = { when: q && q.start ? 'earlier' : 'now' };
  const ref = q && q.start ? new Date(q.start) : new Date(now.getTime() - 3600000);
  const dv = dkey(ref), tv = pad(ref.getHours()) + ':' + pad(ref.getMinutes());
  return '<div class="screen stack">' + back('quit', q ? 'Change start' : 'Start a streak') +
    field('q-name', 'What do you want to quit?', q ? q.name : '', 'text', 'placeholder="e.g. Sugar, Energy drinks"') +
    '<div><div class="lab">When should the timer start?</div>' + chips('when', [['now', 'Right now'], ['earlier', 'I quit earlier']], ui.form.when) + '</div>' +
    '<div id="q-earlier" class="' + (ui.form.when === 'earlier' ? '' : 'hidden') + '"><div class="lab">Last time it happened</div><div class="two">' + field('q-date', 'Date', dv, 'date') + field('q-time', 'Time', tv, 'time') + '</div></div>' +
    '<div class="card"><div class="muted small">Your timer will start from</div><div class="big" id="q-prev">0 min</div></div>' +
    '<button class="btn" data-a="qsave" data-id="' + (q ? q.id : '') + '">' + (q && q.start ? 'Save' : 'Start timer') + '</button>' +
    (q ? '<button class="linkm" data-a="qdel" data-id="' + q.id + '">Delete this tracker</button>' : '') + '</div>' + nav('quit');
}
function qStartMs() {
  if (ui.form.when !== 'earlier') return Date.now();
  const d = $('#q-date').value, t = $('#q-time').value;
  if (!d || !t) return NaN;
  const p = d.split('-').map(Number), tt = t.split(':').map(Number);
  return new Date(p[0], p[1] - 1, p[2], tt[0], tt[1]).getTime();
}
function updateQPrev() {
  const el = $('#q-prev'); if (!el) return;
  const ms = Date.now() - qStartMs();
  if (isNaN(ms)) { el.textContent = 'Pick date and time'; return; }
  if (ms < 0) { el.textContent = 'That is in the future'; return; }
  const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  el.textContent = d ? d + ' day' + (d > 1 ? 's' : '') + ' ' + h + ' h' : h ? h + ' h ' + m + ' min' : m + ' min';
}
function vRelapse(id) {
  const q = S.quits.find((x) => x.id === id); if (!q || !q.start) { ui.route = 'quit'; return vQuit(); }
  ui.form = { reason: 'Stress' };
  const ms = Date.now() - q.start, d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000);
  return '<div class="screen stack">' + back('quit', 'Reset ' + esc(q.name) + '?') +
    '<div class="sheetnote">You reached ' + d + ' days ' + h + ' hours. This run will be saved to your history and the timer will start again from zero.</div>' +
    '<div><div class="lab">Why did it happen?</div>' + chips('reason', [['Stress', 'Stress'], ['Boredom', 'Boredom'], ['Late night', 'Late night'], ['Social media', 'Social media'], ['Other', 'Other']], 'Stress') + '</div>' +
    field('r-note', 'Note (optional)', '', 'text') +
    '<div class="btns" style="margin-top:0"><button class="btn" data-a="relapseOk" data-id="' + q.id + '">Confirm reset</button><button class="btn ghost fit" data-a="go" data-r="quit">Cancel</button></div>' +
    '<button class="linkm" data-a="go" data-r="quit">I pressed this by mistake</button></div>' + nav('quit');
}
function vHistory(id) {
  const q = S.quits.find((x) => x.id === id); if (!q) { ui.route = 'quit'; return vQuit(); }
  const rows = q.history.slice().reverse().map((h) => {
    const d = Math.floor((h.end - h.start) / 86400000), hh = Math.floor(((h.end - h.start) % 86400000) / 3600000);
    return '<div class="row" style="min-height:72px"><span class="n">' + dShort(new Date(h.start)) + ' to ' + dShort(new Date(h.end)) + '<small>' + d + ' days ' + hh + ' h · ' + esc(h.reason || '') + (h.note ? ' · ' + esc(h.note) : '') + '</small></span></div>';
  }).join('');
  return '<div class="screen stack">' + back('quit', esc(q.name) + ' history') + '<div class="sheetnote">Best streak: ' + qBest(q) + ' days</div>' + (rows ? '<div class="list">' + rows + '</div>' : '<div class="muted">No past streaks yet.</div>') + '</div>' + nav('quit');
}

const CATS = ['English word', 'Life skill', 'Manners', 'General knowledge', 'Other'];
function vLearn() {
  ui.form = { cat: 'English word' };
  const h = habitById(ui.arg);
  return '<div class="screen stack"><div class="head"><h1>What did you learn?</h1></div><div class="sheetnote">' + esc(h ? h.name : '') + ' is marked done. Save what you learned to your journal.</div>' +
    field('l-title', 'Title', '', 'text', 'placeholder="e.g. Resilient"') +
    '<div><div class="lab">Category</div>' + chips('cat', CATS.map((c) => [c, c]), 'English word') + '</div>' +
    field('l-det', 'Details (optional)', '', 'text') +
    '<div class="btns" style="margin-top:0"><button class="btn" data-a="learnSave">Save</button><button class="btn ghost fit" data-a="go" data-r="today">Skip</button></div></div>';
}
function journalList() {
  const q = ui.jq.trim().toLowerCase();
  const list = S.journal.filter((j) => (ui.jcat === 'All' || j.cat === ui.jcat) && (!q || (j.title + ' ' + (j.details || '')).toLowerCase().indexOf(q) >= 0));
  if (!list.length) return '<div class="muted">Nothing here yet.</div>';
  return '<div class="list">' + list.slice().reverse().map((j) => '<div class="row" style="min-height:72px;padding:10px 0"><span class="n">' + esc(j.title) + '<small>' + esc(j.cat) + ' · ' + dShort(parseKey(j.date)) + (j.details ? ' · ' + esc(j.details) : '') + '</small></span><button class="x" data-a="jdel" data-id="' + j.id + '" aria-label="Delete">&times;</button></div>').join('') + '</div>';
}
function vJournal() {
  return '<div class="screen stack">' + back('habits', 'Journal') + field('jq', 'Search', ui.jq, 'text', 'placeholder="Search what you learned"') +
    '<div class="chips">' + ['All'].concat(CATS).map((c) => '<button class="chip' + (ui.jcat === c ? ' on' : '') + '" data-a="jcat" data-v="' + c + '">' + c + '</button>').join('') + '</div><div id="jlist">' + journalList() + '</div></div>' + nav('habits');
}

function stats(n) {
  const today = startOfDay(new Date()), days = [], per = {}, wd = ALL.map(() => ({ d: 0, t: 0 }));
  let D = 0, T = 0;
  for (let i = n - 1; i >= 0; i--) {
    const d = addDays(today, -i), key = dkey(d), its = itemsFor(d);
    let dn = 0;
    its.forEach((it) => {
      const ok = isDone(key, it.id); if (ok) dn++;
      if (it.type !== 'task') { const p = per[it.name] || (per[it.name] = { d: 0, t: 0, type: it.type }); p.t++; if (ok) p.d++; }
    });
    D += dn; T += its.length; wd[d.getDay()].d += dn; wd[d.getDay()].t += its.length;
    days.push({ key: key, wd: d.getDay(), pct: its.length ? Math.round(dn / its.length * 100) : null });
  }
  return { days: days, per: per, wd: wd, pct: T ? Math.round(D / T * 100) : 0 };
}
function vInsights() {
  const since = Math.floor((startOfDay(new Date()) - parseKey(S.created)) / 86400000) + 1;
  const n = ui.ins === 'week' ? 7 : ui.ins === 'month' ? 30 : Math.max(7, Math.min(365, since));
  const s = stats(n);
  const barDays = s.days.slice(-Math.min(n, 30));
  const bars = '<div class="vb">' + barDays.map((d) => '<div><i style="height:' + (d.pct == null ? 2 : Math.max(2, d.pct)) + 'px"></i>' + (ui.ins === 'week' ? '<span>' + WD[d.wd][0] + '</span>' : '') + '</div>').join('') + '</div>';
  const hb = (name, p) => { const pc = p.t ? Math.round(p.d / p.t * 100) : 0; return '<div class="hb"><span class="l">' + esc(name) + '</span><div class="bar"><i style="width:' + pc + '%"></i></div><span class="p">' + pc + '%</span></div>'; };
  const habitRows = Object.keys(s.per).filter((k) => s.per[k].type === 'habit').map((k) => hb(k, s.per[k])).join('');
  const prayRows = PR.filter((k) => s.per[k]).map((k) => hb(k, s.per[k])).join('');
  const s35 = stats(35).days;
  const shade = (p) => (p == null ? '#111' : p <= 0 ? '#1E1E1E' : p < 40 ? '#3A3A3A' : p < 70 ? '#6A6A6A' : p < 90 ? '#B0B0B0' : '#FFFFFF');
  const heat = '<div class="heat">' + s35.map((d) => '<i style="background:' + shade(d.pct) + '"></i>').join('') + '</div>';
  const notes = [];
  const wa = s.wd.map((x, i) => ({ i: i, p: x.t ? x.d / x.t : null })).filter((x) => x.p != null);
  if (wa.length > 2) { wa.sort((a, b) => b.p - a.p); notes.push('Best day: ' + WDL[wa[0].i] + '. Weakest day: ' + WDL[wa[wa.length - 1].i] + '.'); }
  const weak = Object.keys(s.per).filter((k) => s.per[k].t >= 3).map((k) => ({ k: k, p: Math.round(s.per[k].d / s.per[k].t * 100) })).sort((a, b) => a.p - b.p)[0];
  if (weak) notes.push(weak.k + ' needs attention: ' + weak.p + '%.');
  const learned = S.journal.filter((j) => j.date >= dkey(addDays(new Date(), -30))).length;
  notes.push('You learned ' + learned + ' new thing' + (learned === 1 ? '' : 's') + ' in the last 30 days.');
  const sec = (t, i) => '<div><div class="muted small" style="margin-bottom:12px">' + t + '</div>' + i + '</div>';
  return '<div class="screen stack" style="gap:30px"><h1>Insights</h1>' + chips('ins', [['week', 'Week'], ['month', 'Month'], ['all', 'All time']], ui.ins).replace(/data-a="chip"/g, 'data-a="ins"') +
    '<div><div class="score">' + s.pct + '%</div><div class="muted" style="margin-top:8px">of your tasks completed</div></div>' +
    sec('Each day', bars) + sec('Each habit', habitRows || '<div class="muted">No data yet.</div>') + sec('Each prayer', prayRows || '<div class="muted">No data yet.</div>') +
    sec('Last 5 weeks (lighter = more done)', heat) + sec('Notes', '<div class="stack" style="gap:12px;font-size:16px;line-height:1.4">' + notes.map((x) => '<div>' + esc(x) + '</div>').join('') + '</div>') + '</div>' + nav('insights');
}

function vSettings() {
  return '<div class="screen stack">' + back('habits', 'Settings') +
    '<div class="list"><div class="row"><span class="n">Reminders<small>' + (cap('LocalNotifications') ? 'Time-based notifications for your tasks and prayers' : 'Works in the phone app only') + '</small></span><button class="chip' + (S.notifOn ? ' on' : '') + '" data-a="notifToggle">' + (S.notifOn ? 'On' : 'Off') + '</button></div>' +
    '<button class="row" data-a="testNotif"><span class="n">Send a test reminder<small>Arrives in about 10 seconds</small></span></button>' +
    '<button class="row" data-a="pinChange"><span class="n">Change PIN</span></button></div>' +
    '<div class="field"><label for="bk">Backup: copy this text and keep it safe</label><textarea id="bk" readonly>' + esc(JSON.stringify(S)) + '</textarea></div>' +
    '<div class="field"><label for="bk2">Restore: paste a backup here</label><textarea id="bk2" placeholder="Paste backup text"></textarea></div><button class="btn ghost" data-a="restore">Restore backup</button></div>' + nav('habits');
}

function view() {
  if (ui.locked) return vLock();
  switch (ui.route) {
    case 'add': return vAdd();
    case 'habits': return vHabits();
    case 'habit': return vHabit(ui.arg);
    case 'gym': return vGym();
    case 'prayers': return vPrayers();
    case 'prayerset': return vPrayerSet();
    case 'quit': return vQuit();
    case 'startquit': return vStartQuit(ui.arg);
    case 'relapse': return vRelapse(ui.arg);
    case 'history': return vHistory(ui.arg);
    case 'learn': return vLearn();
    case 'journal': return vJournal();
    case 'insights': return vInsights();
    case 'settings': return vSettings();
    default: return vToday();
  }
}
function render() {
  $('#app').innerHTML = view();
  if (ui.route === 'startquit' && !ui.locked) updateQPrev();
}
function go(r, arg) { ui.route = r; ui.arg = arg || null; if (r === 'gym') ui.gDay = null; window.scrollTo(0, 0); render(); }
function toast(m) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

/* ================= actions ================= */
function toggle(id) {
  const key = dkey(new Date()), was = isDone(key, id);
  S.log[key] = S.log[key] || {};
  if (was) delete S.log[key][id]; else S.log[key][id] = 1;
  save(); schedule(false);
  const h = habitById(id);
  if (!was && h && h.kind === 'learn') return go('learn', id);
  render();
}
function open(id) {
  if (id.indexOf('pray-') === 0) return go('prayers');
  if (id.indexOf('task-') === 0) {
    const t = S.tasks.find((x) => 'task-' + x.id === id);
    if (t && window.confirm('Delete "' + t.name + '"?')) { S.tasks = S.tasks.filter((x) => x !== t); save(); schedule(false); render(); }
    return;
  }
  const h = habitById(id);
  if (h && h.kind === 'gym') return go('gym');
  go('habit', id);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const a = el.dataset.a, D = el.dataset;
  switch (a) {
    case 'go': return go(D.r, D.id);
    case 'toggle': return toggle(D.id);
    case 'open': return open(D.id);
    case 'key': if (ui.pinBuf.length < 4) { ui.pinBuf += D.k; render(); if (ui.pinBuf.length === 4) setTimeout(pinEntered, 120); } return;
    case 'bs': ui.pinBuf = ui.pinBuf.slice(0, -1); return render();
    case 'bio': return tryBio();
    case 'cancelPin': ui.locked = false; ui.route = 'settings'; return render();
    case 'chip': {
      const g = D.g, multi = D.m === '1';
      if (multi) el.classList.toggle('on'); else { el.parentNode.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); el.classList.add('on'); }
      if (multi) ui.form[g] = Array.prototype.map.call(el.parentNode.querySelectorAll('.chip.on'), (c) => c.dataset.v); else ui.form[g] = D.v;
      if (g === 'date') $('#f-datewrap').classList.toggle('hidden', D.v !== 'pick');
      if (g === 'repeat') $('#f-days').classList.toggle('hidden', D.v !== 'custom');
      if (g === 'when') { $('#q-earlier').classList.toggle('hidden', D.v !== 'earlier'); updateQPrev(); }
      if (g === 'gday') { ui.gDay = +D.v; render(); }
      return;
    }
    case 'preset': { $('#f-name').value = D.n; const c = document.querySelector('[data-g="repeat"][data-v="daily"]'); if (c) c.click(); return; }
    case 'addSave': return addSave();
    case 'habitSave': {
      const h = habitById(D.id), name = $('#h-name').value.trim();
      if (!name) return toast('Write a name');
      const days = (ui.form.days || []).map(Number); if (!days.length) return toast('Choose at least one day');
      h.name = name; h.time = $('#h-time').value || h.time; h.days = days; h.remind = +ui.form.remind || 0;
      save(); schedule(true); toast('Saved'); return go('habits');
    }
    case 'habitDel': if (window.confirm('Delete this habit and its streak?')) { S.habits = S.habits.filter((x) => x.id !== D.id); save(); schedule(false); go('habits'); } return;
    case 'gset': {
      const tk = dkey(new Date()), sets = (S.gym.sets[tk] = S.gym.sets[tk] || {}), j = +D.j, cur = sets[D.e] || 0;
      sets[D.e] = cur === j + 1 ? j : j + 1;
      const plan = S.gym.plan[new Date().getDay()], all = plan.ex.length && plan.ex.every((x) => (sets[x.id] || 0) >= x.sets);
      S.log[tk] = S.log[tk] || {};
      if (all && habitById('gym')) S.log[tk].gym = 1;
      save(); return render();
    }
    case 'gadd': {
      const name = $('#g-name').value.trim(); if (!name) return toast('Write the exercise name');
      const plan = S.gym.plan[ui.gDay];
      plan.ex.push({ id: uid(), name: name, sets: Math.max(1, +$('#g-sets').value || 3), reps: Math.max(1, +$('#g-reps').value || 10), kg: $('#g-kg').value.trim() });
      save(); return render();
    }
    case 'gdel': { const plan = S.gym.plan[ui.gDay]; plan.ex = plan.ex.filter((x) => x.id !== D.e); save(); return render(); }
    case 'prayerSave': {
      const P = S.prayer, lat = parseFloat($('#p-lat').value), lng = parseFloat($('#p-lng').value);
      if (isNaN(lat) || isNaN(lng)) return toast('Enter latitude and longitude');
      P.lat = lat; P.lng = lng; P.hanafi = ui.form.asr !== 's';
      PR.forEach((n) => { P.off[n] = parseInt($('#p-' + n).value, 10) || 0; });
      save(); schedule(true); toast('Saved'); return go('prayers');
    }
    case 'qsel': ui.qsel = +D.i; return render();
    case 'qsave': {
      const name = $('#q-name').value.trim(); if (!name) return toast('Write a name');
      const ms = qStartMs(); if (isNaN(ms)) return toast('Pick date and time'); if (ms > Date.now()) return toast('That time is in the future');
      let q = S.quits.find((x) => x.id === D.id);
      if (!q) { q = { id: 'q' + uid(), name: name, start: null, history: [] }; S.quits.push(q); }
      q.name = name; q.start = ms; ui.qsel = S.quits.indexOf(q);
      save(); return go('quit');
    }
    case 'qdel': if (window.confirm('Delete this tracker and its history?')) { S.quits = S.quits.filter((x) => x.id !== D.id); ui.qsel = 0; save(); go('quit'); } return;
    case 'relapseOk': {
      const q = S.quits.find((x) => x.id === D.id), now = Date.now();
      q.history.push({ start: q.start, end: now, reason: ui.form.reason, note: $('#r-note').value.trim() });
      q.start = now; save(); toast('Timer reset'); return go('quit');
    }
    case 'learnSave': {
      const title = $('#l-title').value.trim(); if (!title) return toast('Write a title or tap Skip');
      S.journal.push({ id: uid(), date: dkey(new Date()), title: title, cat: ui.form.cat, details: $('#l-det').value.trim() });
      save(); toast('Saved to journal'); return go('today');
    }
    case 'jcat': ui.jcat = D.v; return render();
    case 'jdel': if (window.confirm('Delete this entry?')) { S.journal = S.journal.filter((x) => x.id !== D.id); save(); $('#jlist').innerHTML = journalList(); } return;
    case 'ins': ui.ins = D.v; return render();
    case 'notifToggle': S.notifOn = !S.notifOn; save(); schedule(true); return render();
    case 'testNotif': {
      const LN = cap('LocalNotifications'); if (!LN) return toast('Reminders work in the phone app only');
      LN.checkPermissions().then((p) => (p.display === 'granted' ? p : LN.requestPermissions())).then((p) => {
        if (p.display !== 'granted') return toast('Notification permission is off');
        return LN.schedule({ notifications: [{ id: 999999, title: 'Ascend', body: 'Test reminder', schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true } }] }).then(() => toast('Test reminder in 10 seconds'));
      }).catch(() => toast('Could not schedule'));
      return;
    }
    case 'pinChange': ui.locked = true; ui.pinMode = 'chg0'; ui.pinBuf = ''; ui.pinMsg = ''; return render();
    case 'restore': {
      try {
        const o = JSON.parse($('#bk2').value);
        if (!o || !o.habits || !o.log) throw new Error('bad');
        S = o; save(); toast('Backup restored'); ui.locked = !!S.pin; ui.pinMode = S.pin ? 'unlock' : 'setup1'; ui.route = 'today'; render();
      } catch (err) { toast('That backup text is not valid'); }
      return;
    }
  }
});
document.addEventListener('input', (e) => {
  const id = e.target.id;
  if (id === 'jq') { ui.jq = e.target.value; $('#jlist').innerHTML = journalList(); }
  else if (id === 'q-date' || id === 'q-time') updateQPrev();
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'g-title') { const plan = S.gym.plan[ui.gDay]; if (plan) { plan.title = e.target.value.trim(); save(); } }
  else if (e.target.id === 'q-date' || e.target.id === 'q-time') updateQPrev();
});

/* ================= boot ================= */
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (S.pin && hiddenAt && Date.now() - hiddenAt > 3000 && !ui.locked) { lockNow(); tryBio(); }
  else if (!document.hidden) { schedule(false); if (!ui.locked) render(); }
});
setInterval(() => {
  if (ui.locked) return;
  if (ui.route === 'quit') {
    const q = S.quits[ui.qsel], el = $('#qtimer');
    if (q && q.start && el) el.innerHTML = timerHtml(q);
  } else if (ui.route === 'today' && new Date().getSeconds() < 1) render();
}, 1000);

load();
if (!S.pin) { ui.pinMode = 'setup1'; }
ui.locked = true;
render();
if (S.pin) tryBio();
})();
