// AI-MasterPlan frontend — vanilla JS. Talks only to /api/*.
// Production error beacon (fire-and-forget, no PII).
try {
  const beacon = (msg, stack) => { try { fetch('/api/errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: String(msg || 'error').slice(0, 500), stack: String(stack || '').slice(0, 2000), url: location.pathname.slice(0, 200) }) }); } catch {} };
  window.addEventListener('error', (e) => beacon(e.message, e.error && e.error.stack));
  window.addEventListener('unhandledrejection', (e) => beacon('unhandledrejection: ' + (e.reason && e.reason.message || e.reason), e.reason && e.reason.stack));
} catch {}
const $ = (s) => document.querySelector(s);
// Melrose thin-line icons (Feather-style, 1.5px stroke, currentColor) — no emoji.
const _sw = (inner) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const ICONS = {
  heart: _sw('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
  star: _sw('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  chat: _sw('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  flag: _sw('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>'),
  bookmark: _sw('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  bookmarkFill: _sw('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="currentColor"/>'),
  video: _sw('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
  image: _sw('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  code: _sw('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  terminal: _sw('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
  help: _sw('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'),
  link: _sw('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  target: _sw('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  copy: _sw('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
};
// Theme (light minimal default like Expo app; logo click toggles dark) + offline banner
function paintTheme() {
  const t = localStorage.getItem('amp-theme') || 'light';
  document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light';
  const img = document.querySelector('.brand-logo');
  if (img) img.src = t === 'dark' ? '/logo.jpeg' : '/logo-light.jpeg';
}
function paintOffline() {
  const bar = $('#offlineBar');
  if (bar) bar.classList.toggle('on', !navigator.onLine);
}
function toggleTheme() {
  try {
    localStorage.setItem('amp-theme', (localStorage.getItem('amp-theme') || 'light') === 'dark' ? 'light' : 'dark');
    paintTheme();
  } catch {}
}
function wireThemeToggles() {
  const logo = $('#brandLogo');
  if (logo) {
    logo.addEventListener('click', toggleTheme);
    logo.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); } });
  }
}
try {
  paintTheme();
  paintOffline();
  window.addEventListener('online', paintOffline);
  window.addEventListener('offline', paintOffline);
  window.addEventListener('DOMContentLoaded', wireThemeToggles);
} catch {}
// ---- Tab router: minimal like Expo app — one view at a time, content inside its tab ----
const VIEWS = ['home', 'roadmap', 'onboard', 'tools', 'projects', 'meet', 'community', 'planner', 'assistant', 'progress', 'enroll', 'certs', 'notify', 'account', 'cms'];
function parseRoute() {
  const h = String(location.hash || '');
  let r = '';
  if (h.startsWith('#/')) r = h.slice(2).split('/')[0].split('?')[0].trim();
  else if (h.startsWith('#')) r = h.slice(1).split('/')[0].split('?')[0].trim();
  r = (r || '').toLowerCase();
  if (r === '') return 'home';
  if (r === 'sampleroad') return 'roadmap';
  return VIEWS.includes(r) ? r : 'home';
}
function showView(route) {
  if (!VIEWS.includes(route)) route = 'home';
  try {
    document.querySelectorAll('main.wrap > section[data-view]').forEach((s) => {
      s.classList.toggle('on', s.dataset.view === route);
    });
  } catch {}
  try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch { window.scrollTo(0, 0); }
  paintNavActive(route);
  return true;
}
function paintNavActive(route) {
  try {
    document.querySelectorAll('.nav a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      const match = href === '#/' + route || href === '#' + route;
      a.classList.toggle('active', match);
      if (match) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  } catch {}
}
function handleHash() {
  showView(parseRoute());
}
function wireRouter() {
  document.addEventListener('click', (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[href^="#/"],a[href^="#"]') : null;
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const raw = href.startsWith('#/') ? href.slice(2).split('/')[0].split('?')[0].toLowerCase()
      : href.slice(1).split('/')[0].split('?')[0].toLowerCase();
    const norm = raw === '' ? 'home' : (raw === 'sampleroad' ? 'roadmap' : raw);
    if (!VIEWS.includes(norm) && norm !== 'home') return;
    e.preventDefault();
    if (parseRoute() === norm) showView(norm);
    else location.hash = '#/' + norm;
  });
  window.addEventListener('hashchange', handleHash);
  try { handleHash(); } catch {}
  setTimeout(() => { try { handleHash(); } catch {} }, 400);
}
try {
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', wireRouter);
  else wireRouter();
} catch {}
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { localStorage.setItem(k, JSON.stringify(v)); } };
let CUR = null, DONE = store.get('amp-own-done', []), TOTAL = 111;
let DATES = store.get('amp-own-dates', []);
let GOAL = Number(localStorage.getItem('amp-own-goal') || 5) || 5;
function touchDate() {
  const day = new Date().toISOString().slice(0, 10);
  if (!DATES.some((d) => d.slice(0, 10) === day)) {
    DATES = [...DATES, new Date().toISOString()];
    store.set('amp-own-dates', DATES);
  }
}
function streak() {
  const days = new Set(DATES.map((d) => d.slice(0, 10)));
  let n = 0;
  const c = new Date();
  if (!days.has(c.toISOString().slice(0, 10))) c.setDate(c.getDate() - 1);
  while (days.has(c.toISOString().slice(0, 10)) && n < 365) { n++; c.setDate(c.getDate() - 1); }
  return n;
}
function weekStart() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
function weekDays() {
  const s = weekStart();
  return new Set(DATES.map((d) => d.slice(0, 10)).filter((day) => day >= s)).size;
}

async function jget(p) { const r = await fetch(p); return r.json(); }

function renderJourney(list) {
  $('#journey').innerHTML = list.map((j, i) => `<li>${i + 1}. ${j}</li>`).join('');
}

function renderLevels(levels) {
  const box = $('#levels');
  box.innerHTML = levels.map((lv) => `
    <div class="lvl"><h3>Level ${lv.n}: ${lv.title}</h3><p class="muted">${lv.sum}</p>
    ${lv.tools ? `<p class="muted">Tools: ${lv.tools.join(' • ')}</p>` : ''}
    ${lv.project ? `<p class="muted">PROJECT: ${lv.project}</p>` : ''}
    ${lv.modules.map((m) => `
      <div class="mod"><h4>${m.id} — ${m.title}</h4>
      ${m.lessons.map(([id, t, min]) => `
        <button class="les ${DONE.includes(id) ? 'done' : ''}" data-id="${id}">
          <span class="dot">${DONE.includes(id) ? '✓' : '○'}</span>
          <span><b>${id} — ${t}</b><br><span class="muted">${min} min • tap to open ▶</span></span>
        </button>`).join('')}
      </div>`).join('')}
    </div>`).join('');
  box.querySelectorAll('.les').forEach((b) => b.addEventListener('click', () => openLesson(b.dataset.id)));
}

function copyText(t, btn) {
  const done = () => { if (btn) { const o = btn.innerHTML; btn.textContent = '✓ Copied'; setTimeout(() => { btn.innerHTML = o; }, 1200); } };
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done).catch(() => fallbackCopy(t, done)); }
  else fallbackCopy(t, done);
}
function fallbackCopy(t, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = t; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta); done();
  } catch {}
}
function bmGet() { try { return JSON.parse(localStorage.getItem('amp-bookmarks') || '[]'); } catch { return []; } }
function bmHas(id) { return bmGet().includes(id); }
function bmToggle(id) {
  let b = bmGet();
  b = b.includes(id) ? b.filter((x) => x !== id) : [...b, id];
  localStorage.setItem('amp-bookmarks', JSON.stringify(b));
  return b.includes(id);
}
function paintLessonBookmark(id) {
  let b = $('#lessonBmBtn');
  if (!b) {
    b = document.createElement('button');
    b.id = 'lessonBmBtn';
    b.className = 'ghost'; b.style.fontSize = '13px';
    $('#lessonDoneBtn').after(b);
  }
  b.innerHTML = (bmHas(id) ? ICONS.bookmarkFill : ICONS.bookmark) + (bmHas(id) ? ' Saved' : ' Bookmark');
  b.onclick = () => { const on = bmToggle(id); b.innerHTML = (on ? ICONS.bookmarkFill : ICONS.bookmark) + (on ? ' Saved' : ' Bookmark'); paintExtras(); };
}
function paintExtras() {
  // resume card on roadmap
  const rc = $('#resumeCard');
  if (rc) {
    const last = localStorage.getItem('amp-last-lesson');
    rc.innerHTML = '';
    if (last && lessonExists(last) && !DONE.includes(last)) {
      const btn = document.createElement('button');
      btn.className = 'les'; btn.innerHTML = `<span class="dot">▶</span><span><b>Resume: ${last}</b><br><span class="muted">pick up where you left off</span></span>`;
      btn.addEventListener('click', () => openLesson(last));
      rc.appendChild(btn);
    }
  }
  // bookmarks in progress
  const bl = $('#bookmarkList');
  if (bl) {
    const b = bmGet().filter(lessonExists);
    bl.innerHTML = b.length ? '' : '<p class="muted">No bookmarks yet — open a lesson and tap Bookmark.</p>';
    b.forEach((id) => {
      const btn = document.createElement('button');
      btn.className = 'les'; btn.innerHTML = `<span class="dot">${ICONS.bookmark}</span><span><b>${id}</b></span>`;
      btn.addEventListener('click', () => openLesson(id));
      bl.appendChild(btn);
    });
  }
}
async function openLesson(id) {
  const ov = $('#lessonOverlay'), modal = $('#lessonModal'), body = $('#lessonBody'), title = $('#lessonTitle');
  if (!ov || !modal) return;
  ov.style.display = ''; modal.style.display = '';
  try { localStorage.setItem('amp-last-lesson', id); } catch {}
  paintLessonBookmark(id);
  title.textContent = id + ' — loading…';
  body.innerHTML = '<p class="muted">Loading lesson…</p>';
  $('#lessonDoneBtn').textContent = DONE.includes(id) ? '✓ Completed — tap to uncheck' : '○ Mark complete';
  $('#lessonDoneBtn').onclick = () => toggleLessonDone(id);
  const t = cmsToken();
  try {
    const r = await fetch('/api/curriculum/lesson/' + encodeURIComponent(id), t ? { headers: { Authorization: 'Bearer ' + t } } : {});
    const d = await r.json();
    if (!d.lesson) { body.innerHTML = '<p class="muted">Unavailable: ' + esc(d.error || r.status) + '</p>'; return; }
    const l = d.lesson;
    title.textContent = `${l.id} — ${l.title} (${l.minutes} min)`;
    paintLessonNav(l.id);
    body.innerHTML = '';
    l.blocks.forEach((b) => {
      const dv = document.createElement('div');
      dv.className = 'proj';
      if (b.type === 'heading') dv.innerHTML = `<h3>${esc(b.content || '')}</h3>`;
      else if (b.type === 'text') dv.innerHTML = `<div style="white-space:pre-wrap;">${esc(b.content || '')}</div>`;
      else if (b.type === 'code' || b.type === 'terminal' || b.type === 'prompt') {
        const label = b.type === 'code' ? `${ICONS.code} Code${b.language ? ' (' + esc(b.language) + ')' : ''}` : b.type === 'terminal' ? `${ICONS.terminal} Terminal commands` : `${ICONS.chat} Copyable prompt`;
        dv.innerHTML = `<b>${label}</b><pre class="plan">${esc(b.content || '')}</pre>`;
        const btn = document.createElement('button');
        btn.className = 'ghost'; btn.style.fontSize = '13px'; btn.innerHTML = `${ICONS.copy} Copy`;
        btn.addEventListener('click', () => copyText(b.content || '', btn));
        dv.appendChild(btn);
        if (b.type === 'code') {
          const run = document.createElement('button');
          run.className = 'gold'; run.style.fontSize = '13px'; run.textContent = '▶ Run tests';
          const out = document.createElement('pre');
          out.className = 'plan'; out.style.display = 'none';
          run.addEventListener('click', async () => {
            run.textContent = '… running';
            try {
              const t = cmsToken();
              const r = await fetch('/api/challenges/run', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { Authorization: 'Bearer ' + t } : {}), body: JSON.stringify({ code: b.content || '' }) });
              const j = await r.json();
              out.style.display = '';
              out.textContent = (j.error ? 'Error: ' + j.error + '\n' : '') + (j.output || '(no output — try console.log(...))') + (j.passed === false && !j.error ? '\n✗ checks failed' : j.passed ? '\n✓ passed' : '');
            } catch { out.style.display = ''; out.textContent = 'Network failed — retry.'; }
            run.textContent = '▶ Run tests';
          });
          dv.appendChild(run);
          dv.appendChild(out);
        }
      }
      else if (b.type === 'video') {
        dv.innerHTML = `<b>${ICONS.video} ${esc(b.caption || 'Video walkthrough')}</b><br>`;
        if (b.url && /\.(mp4|webm)(\?|$)/.test(b.url)) {
          const v = document.createElement('video');
          v.controls = true; v.style.maxWidth = '100%'; v.preload = 'metadata';
          v.src = b.url;
          const vkey = 'amp-video-' + l.id + '-' + b.url.length + '-' + (b.url.match(/\/([^/?]+)(\?|$)/) || ['', 'v'])[1];
          v.addEventListener('loadedmetadata', () => {
            try {
              const pos = Number(localStorage.getItem(vkey) || 0);
              if (pos > 5 && pos < (v.duration || Infinity) - 5) v.currentTime = pos;
            } catch {}
          });
          let lastSave = 0;
          v.addEventListener('timeupdate', () => {
            const n = Date.now();
            if (n - lastSave > 5000) { lastSave = n; try { localStorage.setItem(vkey, String(Math.floor(v.currentTime))); } catch {} }
          });
          dv.appendChild(v);
        } else if (b.url) {
          const a = document.createElement('a');
          a.href = b.url; a.target = '_blank'; a.style.color = 'var(--acc)'; a.textContent = '▶ Watch video';
          dv.appendChild(a);
        } else dv.innerHTML += '<p class="muted">Video coming soon.</p>';
      }
      else if (b.type === 'image') {
        dv.innerHTML = `<b>${ICONS.image} ${esc(b.caption || 'Image')}</b><br>`;
        if (b.url) { const img = document.createElement('img'); img.src = b.url; img.alt = b.alt || ''; img.style.maxWidth = '100%'; img.style.borderRadius = '4px'; dv.appendChild(img); }
      }
      else if (b.type === 'download' || b.type === 'link') {
        dv.innerHTML = `${ICONS.link} <a href="${esc(b.url || '#')}" style="color:var(--acc)">${esc(b.label || b.url || 'Open')}</a>`;
      }
      else if (b.type === 'quiz') {
        dv.innerHTML = `<b>${ICONS.help} ${esc(b.question || '')}</b><br>`;
        (b.options || []).forEach((o, i) => {
          const btn = document.createElement('button');
          btn.className = 'ghost'; btn.style.fontSize = '13px'; btn.textContent = o;
          btn.addEventListener('click', () => {
            const ok = i === (b.answer || 0);
            btn.textContent = (ok ? '✅ ' : '❌ ') + o;
          });
          dv.appendChild(btn);
        });
      }
      else if (b.type === 'exercise') {
        dv.innerHTML = `<b>${ICONS.target} ${esc(b.title || 'Exercise')}</b><br><span class="muted">${esc(b.instructions || '')}</span><br><span class="muted">Expected: ${esc(b.expected || '')}</span>`;
      }
      else dv.innerHTML = `<pre class="plan">${esc(b.content || JSON.stringify(b))}</pre>`;
      body.appendChild(dv);
    });
    if (!l.blocks.length) body.innerHTML = '<p class="muted">Written tutorial coming soon for this lesson.</p>';
  } catch { body.innerHTML = '<p class="muted">Network failed — check connection and retry.</p>'; }
}
function closeLesson() { const ov = $('#lessonOverlay'), modal = $('#lessonModal'); if (ov) ov.style.display = 'none'; if (modal) modal.style.display = 'none'; }

// ---- Challenge workspace (instructions | editor | console+tests) ----
let WS = { id: null, lesson: null, seed: '', ranOk: false, ranAt: 0, quizzes: [] };
async function openWorkspace(id) {
  id = id || WS.id;
  if (!id) return;
  const t = cmsToken();
  closeLesson();
  const ov = $('#wsOverlay'), vw = $('#wsView');
  ov.style.display = ''; vw.style.display = '';
  $('#wsTitle').textContent = id + ' — loading…';
  $('#wsCrumb').textContent = '';
  $('#wsInstr').innerHTML = '<p class="muted">Loading challenge…</p>';
  $('#wsConsole').textContent = 'Press “Run the Tests”.';
  $('#wsTests').innerHTML = '';
  try {
    const r = await fetch('/api/curriculum/lesson/' + encodeURIComponent(id), t ? { headers: { Authorization: 'Bearer ' + t } } : {});
    const d = await r.json();
    if (!d.lesson) { $('#wsInstr').innerHTML = '<p class="muted">Unavailable: ' + esc(d.error || r.status) + (t ? '' : ' (sign in to save progress)') + '</p>'; return; }
    const l = d.lesson;
    WS = { id: l.id, lesson: l, seed: '', ranOk: false, ranAt: 0, quizzes: [] };
    $('#wsTitle').textContent = `${l.id} — ${l.title}`;
    $('#wsCrumb').textContent = `${l.levelId} / ${l.moduleId} / ${l.id} • ${l.minutes} min`;
    // instructions pane: everything except raw code (code lives in the editor)
    const instr = $('#wsInstr');
    instr.innerHTML = '';
    const code0 = (l.blocks || []).find((b) => b.type === 'code');
    WS.seed = code0 ? (code0.content || '') : `// ${l.id}: ${l.title}\nconsole.log('hello');\n`;
    (l.blocks || []).forEach((b, bi) => {
      const dv = document.createElement('div');
      dv.className = 'proj';
      if (b.type === 'heading') dv.innerHTML = `<h3>${esc(b.content || '')}</h3>`;
      else if (b.type === 'text' || b.type === 'terminal' || b.type === 'prompt') dv.innerHTML = `<pre class="plan">${esc(b.content || '')}</pre>`;
      else if (b.type === 'code') dv.innerHTML = `<p class="muted">Starter code is loaded in the editor →</p>`;
      else if (b.type === 'video' && b.url) dv.innerHTML = `${ICONS.video} <a href="${esc(b.url)}" target="_blank">Watch walkthrough</a>`;
      else if (b.type === 'image' && b.url) dv.innerHTML = `<img src="${esc(b.url)}" alt="${esc(b.alt || '')}" style="max-width:100%;border-radius:3px;">`;
      else if ((b.type === 'download' || b.type === 'link') && b.url) dv.innerHTML = `${ICONS.link} <a href="${esc(b.url)}">${esc(b.label || b.url)}</a>`;
      else if (b.type === 'quiz') {
        const qi = WS.quizzes.length;
        WS.quizzes.push({ answer: b.answer || 0, picked: null });
        dv.innerHTML = `<b>${ICONS.help} ${esc(b.question || '')}</b>`;
        const wrap = document.createElement('div');
        wrap.className = 'ws-quiz';
        (b.options || []).forEach((o, i) => {
          const lab = document.createElement('label');
          const radio = document.createElement('input');
          radio.type = 'radio'; radio.name = `wsq-${bi}`;
          radio.addEventListener('change', () => {
            WS.quizzes[qi].picked = i;
            wrap.querySelectorAll('label').forEach((el) => el.classList.remove('right', 'wrong'));
            lab.classList.add(i === WS.quizzes[qi].answer ? 'right' : 'wrong');
            paintWsTests();
          });
          lab.appendChild(radio);
          lab.appendChild(document.createTextNode(o));
          wrap.appendChild(lab);
        });
        dv.appendChild(wrap);
      }
      else if (b.type === 'exercise') dv.innerHTML = `<b>${ICONS.target} ${esc(b.title || 'Exercise')}</b><br><span class="muted">${esc(b.instructions || '')}</span>`;
      instr.appendChild(dv);
    });
    $('#wsEditor').value = WS.seed;
    paintWsTests();
    paintWsNav();
  } catch { $('#wsInstr').innerHTML = '<p class="muted">Network failed — check connection and retry.</p>'; }
}
function paintWsTests() {
  const box = $('#wsTests');
  if (!box || !WS.lesson) return;
  let html = '';
  WS.quizzes.forEach((q, i) => {
    const st = q.picked == null ? '<span class="t-no">○ pending</span>' : (q.picked === q.answer ? '<span class="t-ok">✓ passed</span>' : '<span class="t-no">✗ try again</span>');
    html += `<div class="proj">Test ${i + 1} — quiz ${st}</div>`;
  });
  const hasCode = (WS.lesson.blocks || []).some((b) => b.type === 'code');
  if (hasCode) {
    const st = WS.ranAt === 0 ? '<span class="t-no">○ pending</span>' : (WS.ranOk ? '<span class="t-ok">✓ passed</span>' : '<span class="t-no">✗ failed</span>');
    html += `<div class="proj">Code runs without errors ${st}</div>`;
  }
  box.innerHTML = html || '<p class="muted">No tests — submit when ready.</p>';
}
function paintWsNav() {
  const ids = flatLessonIds();
  const i = ids.indexOf(WS.id);
  $('#wsPrevBtn').disabled = !(i > 0);
  $('#wsNextBtn').disabled = !(i >= 0 && i < ids.length - 1);
  $('#wsPrevBtn').onclick = i > 0 ? () => openWorkspace(ids[i - 1]) : null;
  $('#wsNextBtn').onclick = (i >= 0 && i < ids.length - 1) ? () => openWorkspace(ids[i + 1]) : null;
}
async function wsRun() {
  const code = $('#wsEditor').value;
  const out = $('#wsConsole');
  const btn = $('#wsRunBtn');
  btn.textContent = '… running';
  try {
    const t = cmsToken();
    const r = await fetch('/api/challenges/run', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { Authorization: 'Bearer ' + t } : {}), body: JSON.stringify({ code }) });
    const j = await r.json();
    WS.ranOk = !!j.passed;
    WS.ranAt = Date.now();
    out.textContent = (j.error ? 'Error: ' + j.error + '\n' : '') + (j.output || '(no output — try console.log(...))');
    paintWsTests();
  } catch { out.textContent = 'Network failed — retry.'; }
  btn.textContent = '▶ Run the Tests';
}
async function wsSubmit() {
  if (!WS.lesson) return;
  const unanswered = WS.quizzes.filter((q) => q.picked !== q.answer);
  if (unanswered.length) { alert(`Answer all quizzes correctly first (${unanswered.length} left). Hints are in the instructions.`); return; }
  const hasCode = (WS.lesson.blocks || []).some((b) => b.type === 'code');
  if (hasCode && !WS.ranOk) { alert('Run the tests successfully first (▶ Run the Tests).'); return; }
  const id = WS.id;
  if (!DONE.includes(id)) {
    DONE = [...DONE, id];
    touchDate();
    store.set('amp-own-done', DONE);
    if (CUR) renderLevels(CUR.levels);
    renderBar();
    const t = cmsToken();
    if (t) { try { await fetch('/api/lesson-progress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ lessonId: id, completed: true }) }); } catch {} }
  }
  const ids = flatLessonIds();
  const i = ids.indexOf(id);
  if (i >= 0 && i < ids.length - 1) openWorkspace(ids[i + 1]);
  else { closeWorkspace(); alert('Lesson complete!'); }
}
function closeWorkspace() {
  $('#wsOverlay').style.display = 'none';
  $('#wsView').style.display = 'none';
}
function wireWorkspace() {
  const w = $('#lessonWorkspaceBtn');
  if (w) w.addEventListener('click', () => openWorkspace(localStorage.getItem('amp-last-lesson')));
  const c = $('#wsCloseBtn'), o = $('#wsOverlay');
  if (c) c.addEventListener('click', closeWorkspace);
  if (o) o.addEventListener('click', closeWorkspace);
  const r = $('#wsRunBtn');
  if (r) r.addEventListener('click', wsRun);
  const rs = $('#wsResetBtn');
  if (rs) rs.addEventListener('click', () => { $('#wsEditor').value = WS.seed; WS.ranOk = false; WS.ranAt = 0; $('#wsConsole').textContent = 'Code reset. Press “Run the Tests”.'; paintWsTests(); });
  const s = $('#wsSubmitBtn');
  if (s) s.addEventListener('click', wsSubmit);
  const ed = $('#wsEditor');
  if (ed) ed.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); wsRun(); } });
}
function flatLessonIds() {
  if (!CUR) return [];
  const ids = [];
  CUR.levels.forEach((lv) => lv.modules.forEach((m) => m.lessons.forEach(([id]) => ids.push(id))));
  return ids;
}
function paintLessonNav(id) {
  let nav = $('#lessonNav');
  if (!nav) {
    nav = document.createElement('div');
    nav.id = 'lessonNav';
    nav.className = 'cta';
    const modal = $('#lessonModal');
    modal.insertBefore(nav, $('#lessonBody'));
  }
  const ids = flatLessonIds();
  const i = ids.indexOf(id);
  nav.innerHTML = '';
  const mk = (label, target) => {
    const b = document.createElement('button');
    b.className = 'ghost'; b.style.fontSize = '13px'; b.textContent = label;
    if (!target) b.disabled = true;
    else b.addEventListener('click', () => openLesson(target));
    nav.appendChild(b);
  };
  mk('← Prev', i > 0 ? ids[i - 1] : null);
  const pos = document.createElement('span');
  pos.className = 'muted';
  pos.textContent = i >= 0 ? `${i + 1} / ${ids.length}` : '';
  nav.appendChild(pos);
  mk('Next →', i >= 0 && i < ids.length - 1 ? ids[i + 1] : null);
}
async function toggleLessonDone(id) {
  const adding = !DONE.includes(id);
  DONE = adding ? [...DONE, id] : DONE.filter((x) => x !== id);
  if (adding) touchDate();
  store.set('amp-own-done', DONE);
  if (CUR) renderLevels(CUR.levels);
  renderBar();
  $('#lessonDoneBtn').textContent = DONE.includes(id) ? '✓ Completed — tap to uncheck' : '○ Mark complete';
  const t = cmsToken();
  if (t && CUR) {
    try { await fetch('/api/lesson-progress', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ lessonId: id, completed: adding }) }); } catch {}
  }
  if (adding) openLesson(id);
}

function renderBar() {
  const total = TOTAL, n = DONE.filter((id) => lessonExists(id)).length, pct = Math.round((n / total) * 100);
  const st = streak(), wd = weekDays(), wpct = Math.min(100, Math.round((wd / GOAL) * 100));
  $('#barFill').style.width = pct + '%';
  $('#barLabel').textContent = `${n}/${total} lessons • ${pct}% • ${n * 50} XP • ${st}d streak`;
  $('#lcount').textContent = `${n}/${total}`;
  $('#progOut').textContent = (n === 0 ? 'Complete lessons above to grow XP.' :
    n >= total ? `All ${total} done — you are an Independent Builder! (${n * 50} XP)` :
    `${n}/${total} lessons, ${n * 50} XP (50/lesson). ~${Math.ceil((total - n) / 2)} days left at 2/day. Next: ${nextId()}.`) +
    ` Weekly goal: ${wd}/${GOAL} active days (${wpct}%)${wd >= GOAL ? ' ✓ met!' : ''}. Streak: ${st} day(s).`;
  const g = $('#goalLine');
  if (g) g.textContent = `Weekly goal: ${wd}/${GOAL} days • ${st}d streak`;
  try { paintExtras(); } catch {}
}

function lessonExists(id) {
  if (!CUR) return true;
  for (const lv of CUR.levels) for (const m of lv.modules) for (const [lid] of m.lessons) if (lid === id) return true;
  return false;
}

function nextId() {
  if (!CUR) return 'L1M1L1';
  for (const lv of CUR.levels) for (const m of lv.modules) for (const [id] of m.lessons) if (!DONE.includes(id)) return id;
  return 'done';
}

function toolLogo(t) {
  if (t.logo) return `<img class="tool-logo" src="${t.logo}" alt="${String(t.name || '').replace(/"/g, '')} logo" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='';"><span style="display:none;">${t.icon || '▦'}</span>`;
  return `${t.icon || ''}`;
}
function extLink(url, label, primary) {
  // External shortcut: https only, new tab, no opener (validated data, defense in depth).
  let safe = '';
  try {
    const u = new URL(url);
    if (u.protocol === 'https:') safe = u.toString();
  } catch {}
  if (!safe) return null;
  const a = document.createElement('a');
  a.href = safe; a.target = '_blank'; a.rel = 'noopener';
  a.className = primary ? 'gold' : 'ghost';
  a.style.fontSize = '13px'; a.textContent = label;
  return a;
}
function renderTools(tools, q, cat) {
  const hay = (t) => (t.name + ' ' + t.cat + ' ' + t.what + ' ' + (t.why || '')).toLowerCase();
  const f = tools.filter((t) => (!q || hay(t).includes(q.toLowerCase())) && (!cat || t.cat === cat));
  const el = $('#toolsList') || $('#tools');
  if (!el) return;
  el.innerHTML = '';
  if (!f.length) { el.innerHTML = '<p class="muted">No tools match — try another search or category.</p>'; return; }
  const count = document.createElement('p');
  count.className = 'muted';
  count.textContent = `${f.length} tool${f.length === 1 ? '' : 's'}${cat ? ` in ${cat}` : ''}${q ? ` matching “${q}”` : ''} — free-first for beginners.`;
  el.appendChild(count);
  f.forEach((t) => {
    const d = document.createElement('div');
    d.className = 'tool';
    const head = document.createElement('div');
    head.innerHTML = `<b>${toolLogo(t)} ${esc(t.name)}</b> `;
    const price = document.createElement('span');
    price.className = 'price'; price.textContent = t.price || '';
    head.appendChild(price);
    d.appendChild(head);
    const cm = document.createElement('p');
    cm.className = 'muted'; cm.textContent = t.cat || '';
    d.appendChild(cm);
    const blocks = [['What is it?', t.what], ['Why do I need it?', t.why], ['How do I install it?', t.install]];
    blocks.forEach(([label, body]) => {
      if (!body) return;
      const h = document.createElement('h4');
      h.textContent = label;
      const p = document.createElement('p');
      p.textContent = body;
      d.appendChild(h); d.appendChild(p);
    });
    if (t.setupSteps && t.setupSteps.length) {
      const h = document.createElement('h4');
      h.textContent = 'Setup walkthrough';
      const ol = document.createElement('ol');
      ol.className = 'steps';
      t.setupSteps.forEach((s) => {
        const li = document.createElement('li');
        li.textContent = s;
        ol.appendChild(li);
      });
      d.appendChild(h); d.appendChild(ol);
    }
    const row = document.createElement('div');
    row.className = 'cta';
    const g = extLink(t.setupUrl, 'Setup guide', true);
    const w = extLink(t.website, 'Official website', false);
    if (g) row.appendChild(g);
    if (w && w.href !== (g && g.href)) row.appendChild(w);
    if (row.children.length) d.appendChild(row);
    if (t.related && t.related.length) {
      const h = document.createElement('h4');
      h.textContent = 'Related tutorials';
      d.appendChild(h);
      t.related.forEach((r) => {
        const b = document.createElement('button');
        b.className = 'les';
        b.innerHTML = `<span class="dot">▶</span>`;
        const sp = document.createElement('span');
        sp.textContent = `${r.id} — ${r.title}`;
        b.appendChild(sp);
        b.addEventListener('click', () => openLesson(r.id));
        d.appendChild(b);
      });
    }
    el.appendChild(d);
  });
}
function toolFilter() { return { q: ($('#q') || {}).value || '', cat: ($('#qCat') || {}).value || '' }; }

// ---- Landing: stats band, live demo, community showcase ----
async function paintLanding() {
  try {
    const ov = await jget('/api/overview');
    const sb = $('#statBand');
    if (sb) {
      const stats = [[ov.lessons, 'lessons'], [ov.levels, 'levels'], [ov.projects, 'projects'], [ov.tools, 'tools']];
      sb.innerHTML = stats.map(([n, l]) => `<div class="stat"><b>${n}</b><span>${l}</span></div>`).join('');
    }
  } catch {}
  const demoDefault = document.getElementById('demoEditor') ? document.getElementById('demoEditor').defaultValue : '';
  const rb = $('#demoRunBtn');
  if (rb) rb.addEventListener('click', async () => {
    const out = $('#demoOut');
    out.textContent = '… running';
    try {
      const t = cmsToken();
      const r = await fetch('/api/challenges/run', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, t ? { Authorization: 'Bearer ' + t } : {}), body: JSON.stringify({ code: $('#demoEditor').value }) });
      const j = await r.json();
      out.textContent = (j.error ? 'Error: ' + j.error + '\n' : '') + (j.output || '(no output — try console.log(...))');
    } catch { out.textContent = 'Offline? Check connection and retry.'; }
  });
  const rs = $('#demoResetBtn');
  if (rs) rs.addEventListener('click', () => { $('#demoEditor').value = demoDefault; $('#demoOut').textContent = 'Output appears here…'; });
  try {
    const c = await jget('/api/community');
    const strip = $('#showcaseStrip');
    if (strip) {
      const wins = c.posts.filter((p) => ['showcase', 'win'].includes(p.kind)).slice(0, 3);
      strip.innerHTML = wins.length ? '' : '<p class="muted">Fresh wins appear here.</p>';
      wins.forEach((p) => {
        const d = document.createElement('div');
        d.className = 'feat-card';
        d.innerHTML = `<p>“${esc(p.body)}”</p><p class="who">— ${esc(p.author)} · ${esc(p.channel)} <span class="muted">· sample post</span></p>`;
        strip.appendChild(d);
      });
    }
  } catch {}
}

function sampleDone() { try { return JSON.parse(localStorage.getItem('amp-sample-done') || '[]'); } catch { return []; } }
async function paintSampleRoad() {
  const box = $('#sampleRoad');
  if (!box) return;
  try {
    const d = await jget('/api/sample-road');
    const done = sampleDone();
    const total = d.days.reduce((n, day) => n + day.items.length, 0);
    const n = d.days.reduce((n2, day) => n2 + day.items.filter((x) => done.includes(x.lessonId)).length, 0);
    $('#sampleCount').textContent = `${n}/${total}`;
    $('#sampleFill').style.width = (total ? Math.round((n / total) * 100) : 0) + '%';
    box.innerHTML = '';
    d.days.forEach((day) => {
      const dv = document.createElement('div');
      dv.className = 'lvl';
      dv.innerHTML = `<h3>Day ${day.day}: ${esc(day.theme)}</h3>`;
      day.items.forEach((x) => {
        const row = document.createElement('div');
        row.className = 'cta';
        const chk = document.createElement('button');
        chk.className = 'les' + (done.includes(x.lessonId) ? ' done' : '');
        chk.innerHTML = `<span class="dot">${done.includes(x.lessonId) ? '✓' : '○'}</span><span><b>${esc(x.lessonId)} — ${esc(x.title)}</b><br><span class="muted">${x.minutes} min • ${esc(x.why)}</span></span>`;
        chk.addEventListener('click', () => {
          let cur = sampleDone();
          cur = cur.includes(x.lessonId) ? cur.filter((y) => y !== x.lessonId) : [...cur, x.lessonId];
          localStorage.setItem('amp-sample-done', JSON.stringify(cur));
          paintSampleRoad();
        });
        const open = document.createElement('button');
        open.className = 'ghost'; open.style.fontSize = '13px'; open.textContent = '⛶ Open';
        open.addEventListener('click', () => openWorkspace(x.lessonId));
        row.appendChild(chk); row.appendChild(open);
        dv.appendChild(row);
      });
      box.appendChild(dv);
    });
  } catch { box.innerHTML = '<p class="muted">Sample road unreachable — check connection.</p>'; }
}

let PW_LIST = [];
function renderProjects(list) {
  PW_LIST = list || [];
  const el = $('#projectsList') || $('#projects');
  if (!el) return;
  el.innerHTML = '';
  PW_LIST.forEach((p) => {
    const n = (p.stages || '').split('→').length || 1;
    const d = document.createElement('div');
    d.className = 'proj pw-card';
    d.innerHTML = `<div class="pw-row"><b>${esc(p.id)} — ${esc(p.title)}</b><span aria-hidden="true">›</span></div>`
      + `<div class="cta" style="gap:6px;margin:8px 0;"><span class="price">Level ${p.level}</span><span class="price">${n} stages</span></div>`
      + `<p class="muted">${esc(p.arch || p.req || '')}</p><p class="muted">Stack: ${esc(p.stack || '')}</p>`;
    const btn = document.createElement('button');
    btn.className = 'ghost'; btn.style.fontSize = '13px'; btn.textContent = 'Open workspace →';
    btn.addEventListener('click', () => openProject(p.id));
    d.appendChild(btn);
    d.addEventListener('click', (e) => { if (e.target === d || e.target.tagName === 'B') openProject(p.id); });
    el.appendChild(d);
  });
  if (!PW_LIST.length) el.innerHTML = '<p class="muted">Projects unreachable — check connection.</p>';
}

// ---- Guided project workspace (Setup/Stages/Prompts/Testing/Deploy) ----
const PW_TABS = ['Setup', 'Stages', 'Prompts', 'Testing', 'Deploy'];
let PW = { id: null, data: null, tab: 'Setup', done: [] };
function pwLocal() { try { return JSON.parse(localStorage.getItem('amp-proj-done') || '{}'); } catch { return {}; } }
function pwLocalSet(id, done) {
  try {
    const all = pwLocal();
    all[id] = done;
    localStorage.setItem('amp-proj-done', JSON.stringify(all));
  } catch {}
}
async function openProject(id) {
  const ov = $('#pwOverlay'), vw = $('#pwView');
  if (!ov || !vw) return;
  ov.style.display = ''; vw.style.display = '';
  $('#pwTitle').textContent = id + ' — loading…';
  $('#pwBody').innerHTML = '<p class="muted">Loading workspace…</p>';
  $('#pwTabs').innerHTML = ''; $('#pwChips').innerHTML = '';
  PW = { id, data: null, tab: 'Setup', done: pwLocal()[id] || [] };
  try {
    const r = await fetch('/api/projects/' + encodeURIComponent(id));
    const j = await r.json();
    if (!j.ok) { $('#pwBody').innerHTML = '<p class="muted">Unavailable: ' + esc(j.error || r.status) + '</p>'; return; }
    PW.data = j.project;
    // merge server progress when signed in
    const t = cmsToken();
    if (t) {
      try {
        const s = await fetch('/api/project-stage?catalogId=' + encodeURIComponent(id), { headers: { Authorization: 'Bearer ' + t } });
        const sj = await s.json();
        if (sj.ok && Array.isArray(sj.done)) {
          const merged = [...new Set([...PW.done, ...sj.done.filter((x) => j.project.stages.includes(x))])];
          PW.done = merged; pwLocalSet(id, merged);
        }
      } catch {}
    }
    paintProject();
  } catch { $('#pwBody').innerHTML = '<p class="muted">Network failed — check connection and retry.</p>'; }
}
function pwPct() {
  if (!PW.data || !PW.data.stages.length) return 0;
  return Math.round((PW.done.length / PW.data.stages.length) * 100);
}
function paintProject() {
  const p = PW.data;
  if (!p) return;
  $('#pwCrumb').textContent = `${p.id} • LEVEL ${p.level} • GUIDED PROJECT`;
  $('#pwTitle').textContent = p.title;
  $('#pwArch').textContent = p.architecture || p.arch || '';
  const pct = pwPct();
  $('#pwChips').innerHTML = '';
  [`Level ${p.level}`, p.handholding || '', pct === 100 ? 'SHIPPED ✓' : pct + '%'].filter(Boolean).forEach((c) => {
    const s = document.createElement('span');
    s.className = 'price'; s.textContent = c;
    $('#pwChips').appendChild(s);
  });
  $('#pwFill').style.width = pct + '%';
  $('#pwPct').textContent = `${PW.done.length}/${p.stages.length} stages • Stack: ${(p.stack || []).join(' • ')}`;
  const tabs = $('#pwTabs');
  tabs.innerHTML = '';
  PW_TABS.forEach((t) => {
    const b = document.createElement('button');
    b.className = PW.tab === t ? 'gold' : 'ghost';
    b.style.fontSize = '13px'; b.textContent = t;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { PW.tab = t; paintProject(); });
    tabs.appendChild(b);
  });
  const body = $('#pwBody');
  body.innerHTML = '';
  const sec = (title, items, prefix) => {
    const h = document.createElement('h4');
    h.textContent = title;
    body.appendChild(h);
    (items || []).forEach((x) => {
      const d = document.createElement('div');
      d.className = 'proj';
      d.textContent = (prefix || '• ') + x;
      body.appendChild(d);
    });
  };
  if (PW.tab === 'Setup') {
    sec('Requirements (definition of done)', p.requirements, '• ');
    sec('Setup (do this first, in order)', (p.setup || []).map((s, i) => `${i + 1}. ${s}`), '');
  } else if (PW.tab === 'Stages') {
    const h = document.createElement('h4');
    h.textContent = 'Build stages — tap to check off';
    body.appendChild(h);
    p.stages.forEach((st, i) => {
      const on = PW.done.includes(st);
      const b = document.createElement('button');
      b.className = 'les' + (on ? ' done' : '');
      b.innerHTML = `<span class="dot">${on ? '✓' : (i + 1)}</span>`;
      const sp = document.createElement('span');
      sp.textContent = st;
      b.appendChild(sp);
      b.addEventListener('click', () => toggleStage(st));
      body.appendChild(b);
    });
    sec('Final checklist (ship criteria)', p.checklist, '☐ ');
  } else if (PW.tab === 'Prompts') {
    const h = document.createElement('h4');
    h.textContent = 'Copy-paste prompts (in order)';
    body.appendChild(h);
    (p.prompts || []).forEach((pr, i) => {
      const d = document.createElement('div');
      d.className = 'proj';
      const m = document.createElement('p');
      m.className = 'muted';
      m.textContent = `PROMPT ${i + 1} OF ${p.prompts.length}`;
      const pre = document.createElement('pre');
      pre.className = 'plan';
      pre.textContent = pr;
      const c = document.createElement('button');
      c.className = 'ghost'; c.style.fontSize = '13px'; c.innerHTML = `${ICONS.copy} Copy`;
      c.addEventListener('click', () => copyText(pr, c));
      d.appendChild(m); d.appendChild(pre); d.appendChild(c);
      body.appendChild(d);
    });
  } else if (PW.tab === 'Testing') {
    sec('Test it like a pro', p.testing, '✓ ');
    sec('If it breaks', p.debugging, '🔧 ');
  } else {
    sec('Ship it', p.deployment, '🚀 ');
  }
  paintPwNav();
}
async function toggleStage(stage) {
  const on = !PW.done.includes(stage);
  PW.done = on ? [...PW.done, stage] : PW.done.filter((x) => x !== stage);
  pwLocalSet(PW.id, PW.done);
  paintProject();
  const t = cmsToken();
  if (t && PW.id) {
    try {
      await fetch('/api/project-stage', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ catalogId: PW.id, stage, done: on }) });
    } catch {}
  }
}
function closeProject() {
  const ov = $('#pwOverlay'), vw = $('#pwView');
  if (ov) ov.style.display = 'none';
  if (vw) vw.style.display = 'none';
}
function paintPwNav() {
  const ids = PW_LIST.map((p) => p.id);
  const i = ids.indexOf(PW.id);
  const prev = $('#pwPrevBtn'), next = $('#pwNextBtn');
  if (prev) { prev.disabled = !(i > 0); prev.onclick = i > 0 ? () => openProject(ids[i - 1]) : null; }
  if (next) { next.disabled = !(i >= 0 && i < ids.length - 1); next.onclick = (i >= 0 && i < ids.length - 1) ? () => openProject(ids[i + 1]) : null; }
}
function wireProject() {
  const c = $('#pwCloseBtn'), o = $('#pwOverlay');
  if (c) c.addEventListener('click', closeProject);
  if (o) o.addEventListener('click', closeProject);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { try { closeProject(); } catch {} }
  });
}

async function boot() {
  try {
    const h = await jget('/api/health');
    $('#health').textContent = `Server OK • port=${h.port}`;
    $('#health').dataset.server = `Server OK • port=${h.port}`;
    $('#sig').textContent = `program=${h.program} port=${h.port} ${new Date().toISOString().slice(0, 10)}`;
  } catch { $('#health').textContent = 'server unreachable'; return; }
  const ov = await jget('/api/overview');
  TOTAL = ov.lessons || TOTAL;
  // drop stale completions from the old 40-lesson shape
  DONE = DONE.filter((id) => { for (const lv of (CUR?.levels || [])) for (const m of lv.modules) for (const [lid] of m.lessons) if (lid === id) return true; return CUR ? false : true; });
  renderJourney(ov.journey);
  CUR = await jget('/api/curriculum');
  DONE = DONE.filter((id) => lessonExists(id));
  store.set('amp-own-done', DONE);
  renderLevels(CUR.levels); renderBar();
  paintLanding();
  const t = await jget('/api/tools');
  const qc = $('#qCat');
  if (qc) {
    const cats = [...new Set(t.tools.map((x) => x.cat))].sort();
    qc.innerHTML = '<option value="">All categories</option>' + cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    qc.addEventListener('change', () => { const f = toolFilter(); renderTools(t.tools, f.q, f.cat); });
  }
  renderTools(t.tools, '', '');
  $('#q').addEventListener('input', () => { const f = toolFilter(); renderTools(t.tools, f.q, f.cat); });
  const pr = await jget('/api/projects');
  renderProjects(pr.projects);
  $('#startBtn').addEventListener('click', () => { try { location.hash = '#/roadmap'; } catch {} try { showView('roadmap'); } catch {} });
  $('#planBtn').addEventListener('click', async () => {
    const idea = $('#idea').value;
    $('#planOut').textContent = 'planning…';
    const p = await jget('/api/plan?idea=' + encodeURIComponent(idea));
    window._lastPlan = { idea, plan: p };
    $('#planOut').textContent = `DEFINITION: ${p.definition}\n\nFEATURES:\n- ${p.features.join('\n- ')}\n\nSTACK: ${p.stack.join(' • ')}\n\nARCHITECTURE: ${p.architecture}\n\nTODOS:\n- ${p.todos.join('\n- ')}\n\nDEPLOY: ${p.deployment}`;
  });
  wirePlans(); wireAsk(); wireMeet(); wireCommunity(); wireCerts(); wireEnroll(); wireNotify(); wireCms(); paintSampleRoad();
  const _lc = $('#lessonCloseBtn'), _lo = $('#lessonOverlay');
  if (_lc) _lc.addEventListener('click', closeLesson);
  if (_lo) _lo.addEventListener('click', closeLesson);
  wireWorkspace();
  wireProject();
  $('#resetBtn').addEventListener('click', () => { DONE = []; store.set('amp-own-done', DONE); renderLevels(CUR.levels); renderBar(); });
  $('#goalDown').addEventListener('click', () => { GOAL = Math.max(1, GOAL - 1); localStorage.setItem('amp-own-goal', String(GOAL)); renderBar(); });
  $('#goalUp').addEventListener('click', () => { GOAL = Math.min(21, GOAL + 1); localStorage.setItem('amp-own-goal', String(GOAL)); renderBar(); });
  wireAuth();
  wireOnboard();
  try { handleHash(); } catch {}
}
function plans() { try { return JSON.parse(localStorage.getItem('amp-plans') || '[]'); } catch { return []; } }function setPlans(p) { localStorage.setItem('amp-plans', JSON.stringify(p)); renderSaved(); }
function renderSaved() {
  const box = $('#savedPlans');
  if (!box) return;
  const ps = plans();
  box.innerHTML = ps.length ? '' : '<p class="muted">No saved plans yet.</p>';
  ps.forEach((r, ri) => {
    const done = r.done.filter(Boolean).length;
    const d = document.createElement('div');
    d.className = 'proj';
    d.innerHTML = `<b>${r.idea.slice(0, 80)}</b> <span class="price">${done}/${r.todos.length}</span><br>` +
      r.todos.map((t, i) => `<button data-p="${ri}" data-t="${i}" class="les ${r.done[i] ? 'done' : ''}"><span class="dot">${r.done[i] ? '✓' : '○'}</span><span>${t}</span></button>`).join('') +
      `<div class="cta"><button data-del="${ri}" class="ghost">Delete</button></div>`;
    box.appendChild(d);
  });
  box.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
    const ps = plans(); const r = ps[+b.dataset.p];
    r.done[+b.dataset.t] = !r.done[+b.dataset.t];
    setPlans(ps);
  }));
  box.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    setPlans(plans().filter((_, i) => i !== +b.dataset.del));
  }));
}
function wirePlans() {
  renderSaved();
  const sb = $('#savePlanBtn');
  if (sb) sb.addEventListener('click', async () => {
    const idea = $('#idea').value;
    const p = (window._lastPlan && window._lastPlan.idea === idea) ? window._lastPlan.plan : await jget('/api/plan?idea=' + encodeURIComponent(idea));
    const ps = plans();
    ps.unshift({ idea, todos: p.todos, done: p.todos.map(() => false) });
    setPlans(ps);
  });
}
const ASK_QS = ['Explain this simply.', 'Why am I getting this error?', 'What should I do next?', 'Explain this code.', 'Help me improve this prompt.', 'Check if I followed the tutorial correctly.'];
let _hintN = 0;
async function doAsk(q) {
  const query = (q || $('#askQ').value).trim();
  if (!query) return;
  $('#askOut').textContent = 'thinking…';
  _hintN = 0;
  const r = await jget(`/api/ask?q=${encodeURIComponent(query)}&lesson=${$('#askLesson').value}&project=${$('#askProj').value}`);
  window._lastAsk = { q: query, a: r.answer };
  $('#askOut').textContent = `TUTOR (lesson ${r.lesson ? r.lesson.id : '—'}):\n${r.answer}`;
}
async function wireAsk() {
  const lc = $('#askLesson'), pc = $('#askProj'), chips = $('#askChips');
  if (!lc || !CUR) return;
  lc.innerHTML = CUR.levels.flatMap((lv) => lv.modules.flatMap((m) => m.lessons.map(([id, t]) => `<option value="${id}">${id} — ${t}</option>`))).join('');
  try {
    const pr = await jget('/api/projects');
    pc.innerHTML = '<option value="">No project</option>' + pr.projects.map((p) => `<option value="${p.id}">${p.id} — ${p.title}</option>`).join('');
  } catch { /* projects optional */ }
  chips.innerHTML = '';
  ASK_QS.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'ghost'; b.textContent = s;
    b.addEventListener('click', () => doAsk(s));
    chips.appendChild(b);
  });
  $('#askBtn').addEventListener('click', () => doAsk(''));
  $('#hintBtn').addEventListener('click', () => {
    _hintN++;
    const base = (window._lastAsk && window._lastAsk.a) || 'Tell me the lesson ID first.';
    const extras = ['Do just the first checklist item. Nothing else.', 'Run exactly the step command, compare with expected.', 'Apply the usual fix from Common errors, then report what changed.'];
    $('#askOut').textContent += `\n\nBIGGER HINT ${_hintN}: ${extras[Math.min(_hintN - 1, extras.length - 1)]}\n(base: ${base.slice(0, 120)}…)`;
  });
}
function mqs() { try { return JSON.parse(localStorage.getItem('amp-meet-q') || '[]'); } catch { return []; } }
function wireMeet() {
  const out = $('#meetOut');
  if (!out) return;
  jget('/api/meet').then((m) => {
    const ms = new Date(m.session.startsAt).getTime() - Date.now();
    const cd = ms <= 0 ? 'Live now — join!' : `${Math.floor(ms / 864e5)}d ${Math.floor(ms / 36e5) % 24}h ${Math.floor(ms / 6e4) % 60}m to go`;
    out.textContent = `${m.session.title}\n${new Date(m.session.startsAt).toLocaleString()} • ${cd}\nHost: ${m.author.name} (${m.author.role})\nFormat:\n- ${m.format.join('\n- ')}\nJoin: ${m.session.url}`;
    $('#meetArch').innerHTML = '<h3>Archive + recordings</h3>' + m.archive.map((a) => `<div class="proj"><b>${a.title}</b><br><span class="muted">${a.recording}</span></div>`).join('');
    // Add-to-calendar (.ics download, works offline)
    if (!$('#meetCalBtn')) {
      const cb = document.createElement('button');
      cb.id = 'meetCalBtn'; cb.className = 'ghost'; cb.textContent = '📅 Add to calendar';
      cb.addEventListener('click', () => {
        const dt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const s = new Date(m.session.startsAt), e = new Date(s.getTime() + 3600e3);
        const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${m.session.id}@aimasterplan`, `DTSTART:${dt(s)}`, `DTEND:${dt(e)}`, `SUMMARY:${m.session.title}`, `DESCRIPTION:Join ${m.session.url}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
        a.download = 'meet-greet.ics'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      });
      $('#meetAttend').after(cb);
    }
  }).catch(() => { out.textContent = 'Meet info unreachable — check connection and retry.'; });
  const paint = () => {
    const qs = mqs().sort((a, b) => b.v - a.v);
    $('#meetQs').innerHTML = qs.length ? '' : '<p class="muted">No questions yet — submit the first.</p>';
    qs.forEach((q, i) => {
      const b = document.createElement('button');
      b.className = 'les'; b.innerHTML = `<span class="dot">▲ ${q.v}</span><span>${q.t}</span>`;
      b.addEventListener('click', () => { const all = mqs(); all[i].v++; localStorage.setItem('amp-meet-q', JSON.stringify(all)); paint(); });
      $('#meetQs').appendChild(b);
    });
  };
  paint();
  $('#meetQBtn').addEventListener('click', () => {
    const t = $('#meetQ').value.trim().slice(0, 280);
    if (!t) return;
    const all = mqs(); all.push({ t, v: 0 });
    localStorage.setItem('amp-meet-q', JSON.stringify(all));
    $('#meetQ').value = '';
    paint();
  });
  $('#meetAttend').addEventListener('click', (e) => {
    localStorage.setItem('amp-meet-attend', '1');
    e.target.textContent = '✓ Attending';
  });
  if (localStorage.getItem('amp-meet-attend')) $('#meetAttend').textContent = '✓ Attending';
}
let _cCh = '', _cData = null;
async function paintCommunity() {
  const box = $('#cFeed');
  if (!box) return;
  if (!_cData) _cData = await jget('/api/community');
  const q = ($('#cQ').value || '').toLowerCase();
  const list = _cData.posts.filter((p) => (!_cCh || p.channel === _cCh) && (!q || (p.body + p.author).toLowerCase().includes(q)) && (p.reports || 0) < 3);
  box.innerHTML = '';
  document.querySelectorAll('#cChannels button').forEach((b) => b.classList.toggle('gold', b.textContent === (_cCh || 'All')));
  list.forEach((p) => {
    const d = document.createElement('div');
    d.className = 'proj';
    d.innerHTML = `<b>${p.author}</b> <span class="price">${p.channel} • ${p.kind}</span><br>${p.body}<br><span class="muted">${p.likes} likes • ${p.reactions['🎉'] || 0} celebrates • ${(p.comments || []).length} comments</span><br><span class="muted">${(p.comments || []).map((c) => `${c.author}: ${c.body}`).join('<br>')}</span>`;
    const row = document.createElement('div');
    row.className = 'cta';
    [{ send: '♥', label: 'like', icon: ICONS.heart }, { send: '🎉', label: 'celebrate', icon: ICONS.star }, { send: '💬', label: 'comment', icon: ICONS.chat }, { send: '⚑', label: 'report', icon: ICONS.flag }].forEach(({ send, label, icon }) => {
      const b = document.createElement('button');
      b.className = 'ghost'; b.style.fontSize = '13px'; b.innerHTML = `${icon} ${label}`;
      b.addEventListener('click', async () => {
        if (send === '💬') {
          const body = prompt('Reply as guest:');
          if (!body) return;
          await post('/api/community/comment', { id: p.id, author: 'Guest', body });
        } else if (send === '⚑') {
          await post('/api/community/report', { id: p.id });
        } else {
          await post('/api/community/react', { id: p.id, emoji: send });
        }
        _cData = await jget('/api/community');
        paintCommunity();
      });
      row.appendChild(b);
    });
    d.appendChild(row);
    box.appendChild(d);
  });
}
function wireCommunity() {
  if (!$('#cFeed')) return;
  jget('/api/community').then((d) => {
    _cData = d;
    $('#cCh').innerHTML = d.channels.map((c) => `<option>${c}</option>`).join('');
    const cc = $('#cChannels');
    cc.innerHTML = '';
    [''].concat(d.channels).forEach((c) => {
      const b = document.createElement('button');
      b.className = 'ghost'; b.textContent = c || 'All';
      b.addEventListener('click', () => { _cCh = c; paintCommunity(); });
      cc.appendChild(b);
    });
    paintCommunity();
  });
  $('#cQ').addEventListener('input', paintCommunity);
  $('#cPost').addEventListener('click', async () => {
    const body = $('#cBody').value.trim();
    if (!body) return;
    await post('/api/community', { channel: $('#cCh').value, kind: $('#cKind').value, author: 'Guest', body });
    $('#cBody').value = '';
    _cData = await jget('/api/community');
    paintCommunity();
  });
}
function wireCerts() {
  const btn = $('#certBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const email = ($('#certEmail').value || 'student').trim();
    const c = await jget('/api/cert?email=' + encodeURIComponent(email));
    $('#certOut').textContent = `FINAL: ${c.program}\nStudent: ${c.student} • Date: ${c.date}\nID: ${c.final.certId}\nVerify: ${c.final.url}\nSignature: ${c.signature}\n(Print this page to PDF to download • copy the link to share.)`;
    let mapHtml = '';
    try {
      const t = cmsToken();
      if (t) {
        const ar = await fetch('/api/analytics/student', { headers: { Authorization: 'Bearer ' + t } });
        const ad = await ar.json();
        if (ad.skills) {
          mapHtml = '<h3>Certification map — your progress per level</h3>' + ad.skills.map((s) => {
            const pct = Math.min(100, s.pct || 0);
            return `<div class="proj"><b>${esc(s.level)} — ${esc(s.skill)}</b> <span class="price">${s.done}/${s.total} ${s.acquired ? '✅' : ''}</span><div class="bar" style="margin-top:8px;"><div class="fill" style="width:${pct}%"></div></div></div>`;
          }).join('');
        }
      }
    } catch {}
    $('#certMods').innerHTML = mapHtml + '<h3>Module certificates (20)</h3>' + c.modules.map((m) => `<div class="proj"><b>${m.moduleId} — ${m.title}</b><br><span class="muted">ID ${m.certId}</span><br><span class="muted">${m.url}</span><br><button class="ghost" style="font-size:13px;margin-top:8px;" data-claim="${m.moduleId}">🎓 Claim (finish module first)</button></div>`).join('')
      + `<div class="proj"><b>FINAL — Independent AI System Builder</b><br><button class="ghost" style="font-size:13px;margin-top:8px;" data-claim-final="1">🎓 Claim final certificate</button></div>`;
    $('#certMods').querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', () => claimCert('module', b.dataset.claim, b)));
    const fin = $('#certMods').querySelector('[data-claim-final]');
    if (fin) fin.addEventListener('click', () => claimCert('final', 'AI-MasterPlan', fin));
  });
}
async function claimCert(kind, refId, btn) {
  const t = cmsToken();
  if (!t) { alert('Sign in first.'); return; }
  if (btn) btn.textContent = '… checking';
  try {
    const r = await fetch('/api/certificates/claim', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ kind, refId }) });
    const j = await r.json();
    if (j.ok) {
      if (btn) btn.textContent = '✅ Claimed: ' + j.certificate.certId;
      alert('Certificate claimed!\nID: ' + j.certificate.certId + '\n' + j.certificate.url);
    } else {
      if (btn) btn.textContent = '🎓 Claim';
      alert(j.error === 'finish required lessons first' ? `Keep going — ${j.missingCount}/${j.total} lessons left in this ${kind}.` : ('Failed: ' + (j.error || r.status)));
    }
  } catch { if (btn) btn.textContent = '🎓 Claim'; alert('Network failed — retry.'); }
}
function wireEnroll() {
  const qb = $('#eQuote');
  if (!qb) return;
  const creds = () => ({ productId: $('#ePlan').value, coupon: $('#eCoupon').value, story: $('#eStory').value, email: $('#eEmail').value.trim() });
  qb.addEventListener('click', async () => {
    const c = creds();
    const q = await post('/api/enroll/quote', { productId: c.productId, coupon: c.coupon, story: c.story });
    $('#eOut').textContent = q.ok ? `Quote: $${(q.quote.subtotal / 100).toFixed(2)} - $${(q.quote.discount / 100).toFixed(2)} = $${(q.quote.total / 100).toFixed(2)}` : `Error: ${q.error}`;
  });
  $('#eBuy').addEventListener('click', async () => {
    const c = creds();
    const r = await post('/api/enroll/purchase', c);
    $('#eOut').textContent = r.ok ? `✓ Enrolled (demo, no charge).\n${r.receipt}` : `Error: ${r.error}`;
    paintBilling();
  });
  paintBilling();
}
async function paintBilling() {
  const box = $('#eHist');
  if (!box) return;
  const email = ($('#eEmail').value || '').trim();
  const d = await jget('/api/billing' + (email ? '?email=' + encodeURIComponent(email) : ''));
  box.innerHTML = d.purchases.length ? '' : '<p class="muted">No purchases yet.</p>';
  d.purchases.forEach((p) => {
    const dv = document.createElement('div');
    dv.className = 'proj';
    dv.innerHTML = `<b>${p.id} — ${p.productId}</b> <span class="price">$${(p.total / 100).toFixed(2)}</span><br><span class="muted">${p.email} • ${String(p.at).slice(0, 10)}</span>`;
    box.appendChild(dv);
  });
}
function wireNotify() {
  const list = $('#nList');
  if (!list) return;
  jget('/api/notify').then((d) => {
    list.innerHTML = '';
    d.triggers.forEach((t) => {
      const dv = document.createElement('div');
      dv.className = 'proj';
      dv.innerHTML = `<b>${t.label}</b><br><span class="muted">${t.hint}</span>`;
      list.appendChild(dv);
    });
  });
  $('#nEnable').addEventListener('click', async () => {
    if (!('Notification' in window)) { alert('Browser notifications unsupported here.'); return; }
    const r = await Notification.requestPermission();
    if (r === 'granted') {
      try { new Notification('AI-MasterPlan', { body: 'Reminders on — resume your next lesson tomorrow.' }); } catch { /* blocked */ }
      localStorage.setItem('amp-notify', '1');
    }
  });
}
async function cmsApi(method, p, body) {
  let auth = null;
  try { auth = (typeof tok === 'function' ? tok() : localStorage.getItem('amp-own-token')) || null; } catch { auth = localStorage.getItem('amp-own-token'); }
  const h = { 'Content-Type': 'application/json' };
  if (auth) h.Authorization = 'Bearer ' + auth;
  const r = await fetch(p, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  try { const j = await r.json(); j.status = r.status; return j; } catch { return { ok: false, error: 'bad json', status: r.status }; }
}
const cmsGet = (p) => cmsApi('GET', p);
const cmsPost = (p, b) => cmsApi('POST', p, b || {});
const cmsPut = (p, b) => cmsApi('PUT', p, b || {});
const cmsDel = (p) => cmsApi('DELETE', p);
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
let CMS = { course: null, meetings: [], students: [], curLesson: null, curIds: {} };

function cmsToken() { try { return localStorage.getItem('amp-own-token') || null; } catch { return null; } }
function cmsNeedAuth(box, listEl) {
  if (cmsToken()) return false;
  const msg = '<p class="muted">Sign in (staff: instructor/author/admin) via Student accounts below to use the CMS. Premium content requires enrollment.</p>';
  if (box) box.innerHTML = msg;
  if (listEl) listEl.innerHTML = msg;
  return true;
}
function wireCms() {
  if (!$('#cms-dashboard')) return;
  // Tabs
  document.querySelectorAll('.cms-tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.cms-tab').forEach((x) => { x.classList.remove('gold'); x.classList.add('ghost'); });
    b.classList.remove('ghost'); b.classList.add('gold');
    const tab = b.dataset.tab;
    document.querySelectorAll('.cms-panel').forEach((p) => { p.style.display = 'none'; });
    const el = $('#cms-' + tab);
    if (el) el.style.display = '';
  }));
  cmsDashboard(); cmsCourse(); cmsLessonEditor(); cmsStudents(); cmsMeetings(); cmsModeration(); cmsAnalytics(); wireMyAnalytics();
}

// ---- Admin Analytics ----
async function cmsAnalytics() {
  const out = $('#cmsAnalyticsOut');
  if (!out) return;
  const detail = $('#cmsAnalyticsDetail');
  const load = async () => {
    if (cmsNeedAuth(out, detail)) return;
    const days = ($('#cmsAnalyticsDays') || {}).value || 30;
    out.textContent = 'Loading analytics…';
    const d = await cmsGet('/api/analytics/admin?days=' + encodeURIComponent(days));
    if (!d.ok && !d.registered && d.error) { out.textContent = 'Analytics failed: ' + d.error; return; }
    out.innerHTML = `<b>Registered</b> ${d.registered} • <b>Active (${d.activeWindowDays}d)</b> ${d.active} • <b>Enrolled</b> ${d.enrolled}<br>`
      + `Course completion <b>${d.course.pct}%</b> (${d.course.completed}/${d.enrolled || d.registered}) • Avg lesson <b>${d.avgLessonCompletionPct}%</b> • Modules avg <b>${d.modules.avgPct}%</b><br>`
      + `Retention D7 <b>${d.retention.d7.pct == null ? 'n/a' : d.retention.d7.pct + '%'}</b> (n=${d.retention.d7.n}) • D30 <b>${d.retention.d30.pct == null ? 'n/a' : d.retention.d30.pct + '%'}</b> (n=${d.retention.d30.n})<br>`
      + `Projects <b>${d.projects.completed}/${d.projects.total}</b> (${d.projects.pct}%) • Tasks ${d.projects.tasksDone}/${d.projects.tasksTotal} • Meetings avg <b>${d.meetings.avgRatePct}%</b>`;
    detail.innerHTML = ''
      + '<h3>Most watched lessons</h3>' + (d.mostWatched.map((m) => `<div class="proj"><b>${esc(m.lessonId)} — ${esc(m.title)}</b> <span class="price">${m.completions} completions</span></div>`).join('') || '<p class="muted">No data.</p>')
      + '<h3>Drop-off lessons (least + biggest sequential drops)</h3>' + (d.dropOff.least.slice(0, 5).map((m) => `<div class="proj"><b>${esc(m.lessonId)} — ${esc(m.title)}</b> <span class="price">${m.completions}</span></div>`).join(''))
      + (d.dropOff.biggestDrops.slice(0, 5).map((x) => `<div class="proj"><span class="muted">Drop ${x.drop}: ${esc(x.from)} (${x.prev}) → ${esc(x.to)} (${x.cur})</span></div>`).join(''))
      + '<h3>Module completion</h3>' + (d.modules.breakdown.map((m) => `<div class="proj"><b>${esc(m.moduleId)} — ${esc(m.title)}</b> <span class="price">${m.pct}% (${m.completed})</span></div>`).join(''))
      + '<h3>Meeting attendance</h3>' + (d.meetings.perMeeting.map((m) => `<div class="proj"><b>${esc(m.title)}</b> <span class="price">${m.rate}% (${m.present}/${m.invited})</span><br><span class="muted">${esc(String(m.startsAt || '').slice(0, 16))}</span></div>`).join('') || '<p class="muted">No meetings.</p>');
  };
  const btn = $('#cmsAnalyticsReload');
  if (btn) btn.onclick = load;
  const days = $('#cmsAnalyticsDays');
  if (days) days.onchange = load;
  load();
}

// ---- Student analytics (own) ----
function wireMyAnalytics() {
  const btn = $('#myAnalyticsBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const out = $('#myAnalyticsOut');
    out.style.display = '';
    const t = cmsToken();
    if (!t) { out.textContent = 'Sign in to see your analytics.'; return; }
    out.textContent = 'Loading…';
    const r = await fetch('/api/analytics/student', { headers: { Authorization: 'Bearer ' + t } });
    const d = await r.json();
    if (!d.email) { out.textContent = 'Failed: ' + (d.error || r.status); return; }
    out.innerHTML = `<b>${esc(d.name)}</b> • ${d.currentStreakDays}d streak • ⏱ ${d.learningHours}h • ✅ ${d.completedLessons}/${d.totalLessons} (${d.pct}%)<br>`
      + `Projects built <b>${d.projects.built}</b> (done ${d.projects.completed}, tasks ${d.projects.tasksDone}/${d.projects.tasksTotal})<br>`
      + `Skills:<br>` + d.skills.map((s) => `• ${esc(s.skill)} (${s.level}): ${s.done}/${s.total} ${s.acquired ? '✅' : ''}`).join('<br>')
      + `<br><br><b>Activity</b><br>` + heatmap(d.activity || {})
      + `<br><b>Timeline</b><br>` + ((d.recent || []).map((x) => `<span class="muted">✓ ${esc(x.lessonId)} — ${esc(String(x.completedAt || '').slice(0, 10))}</span>`).join('<br>') || '<span class="muted">No completions yet — your history appears here.</span>');
  });
}
function heatmap(activity) {
  // freeCodeCamp-style streak calendar: last 15 weeks x 7 days
  const cells = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (14 * 7 + today.getDay()));
  for (let i = 0; i < 105; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const n = activity[key] || 0;
    const lvl = n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3;
    const light = (document.documentElement.dataset.theme === 'light');
    const bg = light ? ['#ebedf0', '#9be9a8', '#40c463', '#216e39'][lvl] : ['#2a2a40', '#0e4429', '#006d32', '#acd157'][lvl];
    cells.push(`<span title="${key}: ${n}" style="display:inline-block;width:11px;height:11px;margin:1.5px;border-radius:2px;background:${bg};border:1px solid #3b3b4f;"></span>`);
    if ((i + 1) % 7 === 0) cells.push('<br>');
  }
  return cells.join('');
}

// ---- Dashboard (staff only; sign in required) ----
async function cmsDashboard() {
  const box = $('#cmsStats');
  if (!box) return;
  if (cmsNeedAuth(box, $('#cmsModQueue'))) return;
  try {
    const d = await cmsGet('/api/cms');
    if (!d.dashboard) {
      box.innerHTML = `<p class="muted">CMS dashboard requires staff sign-in (instructor/author/admin). ${esc(d.error || '')} — sign in via Student accounts below, then reload CMS.</p>`;
      const mq = $('#cmsModQueue');
      if (mq) mq.innerHTML = '';
      return;
    }
    const b = d.dashboard;
    const crs = d.course || {};
    box.innerHTML = `<b>${esc(crs.title || 'AI-MasterPlan')}</b> <span class="pill">${esc(crs.id || '')}</span><br>`
      + `<span class="muted">${esc(crs.tagline || '')}</span><br><br>`
      + `Levels <b>${b.levels}</b> • Lessons <b>${b.lessons}</b> • Tools <b>${b.tools}</b> • Projects <b>${b.projects}</b><br>`
      + `Purchases <b>${b.purchases}</b> • Pending reports <b>${b.pendingReports}</b><br>`
      + `<span class="muted">Checklist: Dashboard ✓ • Course mgmt → Course Builder tab • Lesson editor → Lesson Editor tab • Students → Students tab • Meetings → Meetings tab • Moderation → Moderation tab</span>`;
    const mq = $('#cmsModQueue');
    if (mq) mq.innerHTML = (d.moderation && d.moderation.length ? '<h3>Reports needing review</h3>' + d.moderation.map((m) => `<div class="proj"><b>${esc(m.id)}</b> by ${esc(m.author)} — ${m.reports} reports</div>`).join('') : '<p class="muted">Moderation queue clear.</p>');
  } catch { box.textContent = 'CMS unreachable.'; }
}

// ---- Course Builder ----
async function cmsCourse() {
  const list = $('#cmsLevelList');
  if (!list) return;
  if (cmsNeedAuth(null, list)) return;
  const paint = async () => {
    const d = await cmsGet('/api/cms/course');
    if (!d.ok) { list.innerHTML = `<p class="muted">Course load failed: ${esc(d.error || 'unknown')} (sign in${d.status === 402 ? ' + enroll' : ''} to view premium content).</p>`; return; }
    CMS.course = d.course;
    list.innerHTML = '';
    // Course header edit
    const head = document.createElement('div');
    head.className = 'proj';
    head.innerHTML = `<b>Course: ${esc(d.course.title)}</b> <span class="price">${esc(d.course.id)}</span><br><span class="muted">${esc(d.course.tagline)}</span><br><span class="muted">Updated ${esc(String(d.course.updatedAt || '').slice(0, 16))}</span>`;
    const hrow = document.createElement('div'); hrow.className = 'cta';
    const editBtn = document.createElement('button'); editBtn.className = 'ghost'; editBtn.textContent = '✏️ Edit course';
    editBtn.addEventListener('click', async () => {
      const t = prompt('Course title', d.course.title); if (t === null) return;
      const tag = prompt('Tagline', d.course.tagline); if (tag === null) return;
      await cmsPut('/api/cms/course', { title: t, tagline: tag });
      paint(); cmsDashboard();
    });
    hrow.appendChild(editBtn); head.appendChild(hrow); list.appendChild(head);

    d.course.levels.forEach((lv, li) => {
      const lvDiv = document.createElement('div'); lvDiv.className = 'lvl';
      lvDiv.innerHTML = `<h3>[${li + 1}] ${esc(lv.id)}: ${esc(lv.title)}</h3><p class="muted">${esc(lv.sum || '')} • ${lv.modules.length} modules</p>`;
      const lr = document.createElement('div'); lr.className = 'cta'; lr.style.flexWrap = 'wrap';
      const mkBtn = (t, fn) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = t; b.addEventListener('click', fn); lr.appendChild(b); return b; };
      mkBtn('✏️ Edit', async () => {
        const t = prompt('Level title', lv.title); if (t === null) return;
        const s = prompt('Summary', lv.sum || ''); if (s === null) return;
        await cmsPut('/api/cms/level/' + encodeURIComponent(lv.id), { title: t, sum: s });
        paint();
      });
      mkBtn('🗑 Delete', async () => { if (!confirm('Delete ' + lv.id + '?')) return; await cmsDel('/api/cms/level/' + encodeURIComponent(lv.id)); paint(); });
      mkBtn('↑ Up', async () => {
        const ids = d.course.levels.map((x) => x.id); if (li === 0) return;
        [ids[li - 1], ids[li]] = [ids[li], ids[li - 1]];
        await cmsPost('/api/cms/reorder', { type: 'level', order: ids }); paint();
      });
      mkBtn('↓ Down', async () => {
        const ids = d.course.levels.map((x) => x.id); if (li >= ids.length - 1) return;
        [ids[li + 1], ids[li]] = [ids[li], ids[li + 1]];
        await cmsPost('/api/cms/reorder', { type: 'level', order: ids }); paint();
      });
      mkBtn('+ Module', async () => {
        const t = prompt('Module title', 'New module'); if (!t) return;
        await cmsPost('/api/cms/level/' + encodeURIComponent(lv.id) + '/module', { title: t }); paint();
      });
      lvDiv.appendChild(lr);
      lv.modules.forEach((m, mi) => {
        const mDiv = document.createElement('div'); mDiv.className = 'mod';
        mDiv.innerHTML = `<h4>${esc(m.id)} — ${esc(m.title)} <span class="price">${m.lessons.length} lessons</span></h4>`;
        const mr = document.createElement('div'); mr.className = 'cta'; mr.style.flexWrap = 'wrap';
        const mk2 = (t, fn) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = t; b.style.fontSize = '13px'; b.addEventListener('click', fn); mr.appendChild(b); };
        mk2('✏️ Edit module', async () => {
          const t = prompt('Module title', m.title); if (t === null) return;
          await cmsPut(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}`, { title: t }); paint();
        });
        mk2('🗑 Del module', async () => { if (!confirm('Delete ' + m.id + '?')) return; await cmsDel(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}`); paint(); });
        mk2('↑', async () => {
          const ids = lv.modules.map((x) => x.id); if (mi === 0) return;
          [ids[mi - 1], ids[mi]] = [ids[mi], ids[mi - 1]];
          await cmsPost('/api/cms/reorder', { type: 'module', levelId: lv.id, order: ids }); paint();
        });
        mk2('↓', async () => {
          const ids = lv.modules.map((x) => x.id); if (mi >= ids.length - 1) return;
          [ids[mi + 1], ids[mi]] = [ids[mi], ids[mi + 1]];
          await cmsPost('/api/cms/reorder', { type: 'module', levelId: lv.id, order: ids }); paint();
        });
        mk2('+ Lesson', async () => {
          const t = prompt('Lesson title', 'New lesson'); if (!t) return;
          const mins = Number(prompt('Minutes', '15') || 15);
          await cmsPost(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}/lesson`, { title: t, minutes: mins }); paint();
        });
        mDiv.appendChild(mr);
        m.lessons.forEach((l, lxi) => {
          const lrow = document.createElement('div'); lrow.className = 'les' + (l.status === 'published' ? ' done' : '');
          lrow.innerHTML = `<span class="dot">${l.status === 'published' ? '●' : '○'}</span><span><b>${esc(l.id)} — ${esc(l.title)}</b><br><span class="muted">${l.minutes} min • ${esc(l.status || 'draft')}</span></span>`;
          const acts = document.createElement('div'); acts.className = 'cta'; acts.style.flexWrap = 'wrap';
          const mk3 = (t, fn) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = t; b.style.fontSize = '12px'; b.style.padding = '8px 10px'; b.addEventListener('click', async (e) => { e.stopPropagation(); await fn(); }); acts.appendChild(b); };
          mk3(l.status === 'published' ? '📄 To draft' : '📢 Publish', async () => {
            await cmsPut(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}/lesson/${encodeURIComponent(l.id)}/status`, { status: l.status === 'published' ? 'draft' : 'published' }); paint();
          });
          mk3('✏️ Rename', async () => {
            const t = prompt('Lesson title', l.title); if (t === null) return;
            await cmsPut(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}/lesson/${encodeURIComponent(l.id)}`, { title: t }); paint();
          });
          mk3('↑', async () => {
            const ids = m.lessons.map((x) => x.id); if (lxi === 0) return;
            [ids[lxi - 1], ids[lxi]] = [ids[lxi], ids[lxi - 1]];
            await cmsPost('/api/cms/reorder', { type: 'lesson', levelId: lv.id, moduleId: m.id, order: ids }); paint();
          });
          mk3('↓', async () => {
            const ids = m.lessons.map((x) => x.id); if (lxi >= ids.length - 1) return;
            [ids[lxi + 1], ids[lxi]] = [ids[lxi], ids[lxi + 1]];
            await cmsPost('/api/cms/reorder', { type: 'lesson', levelId: lv.id, moduleId: m.id, order: ids }); paint();
          });
          mk3('🗑', async () => { if (!confirm('Delete ' + l.id + '?')) return; await cmsDel(`/api/cms/level/${encodeURIComponent(lv.id)}/module/${encodeURIComponent(m.id)}/lesson/${encodeURIComponent(l.id)}`); paint(); });
          mk3('📝 Edit content →', async () => {
            document.querySelector('[data-tab="lessons"]').click();
            setTimeout(() => cmsSelectLesson(lv.id, m.id, l.id), 100);
          });
          mDiv.appendChild(lrow); mDiv.appendChild(acts);
        });
        lvDiv.appendChild(mDiv);
      });
      list.appendChild(lvDiv);
    });
  };
  const addBtn = $('#cmsAddLevel');
  if (addBtn) addBtn.onclick = async () => {
    const t = prompt('Level title', 'New level'); if (!t) return;
    await cmsPost('/api/cms/level', { title: t, sum: '' }); paint(); cmsDashboard();
  };
  paint();
}

// ---- Lesson Editor ----
function blankBlock(type) {
  const base = { type };
  if (type === 'text' || type === 'heading' || type === 'terminal' || type === 'prompt') return { ...base, content: '' };
  if (type === 'code') return { ...base, language: 'javascript', content: '' };
  if (type === 'video') return { ...base, url: '', caption: '' };
  if (type === 'image') return { ...base, url: '', caption: '', alt: '' };
  if (type === 'download') return { ...base, url: '', label: 'Download file' };
  if (type === 'link') return { ...base, url: '', label: 'Open link' };
  if (type === 'quiz') return { ...base, question: '', options: ['Option A', 'Option B'], answer: 0 };
  if (type === 'exercise') return { ...base, title: '', instructions: '', expected: '' };
  return { ...base, content: '' };
}
async function cmsSelectLesson(levelId, moduleId, lessonId) {
  const d = await cmsGet('/api/cms/course');
  if (!d.ok) return;
  CMS.course = d.course;
  const lv = d.course.levels.find((x) => x.id === levelId) || d.course.levels[0];
  const m = (lv && lv.modules.find((x) => x.id === moduleId)) || (lv && lv.modules[0]);
  const l = (m && m.lessons.find((x) => x.id === lessonId)) || (m && m.lessons[0]);
  if (!lv || !m || !l) return;
  CMS.curIds = { levelId: lv.id, moduleId: m.id, lessonId: l.id };
  CMS.curLesson = JSON.parse(JSON.stringify(l));
  if (!CMS.curLesson.content || !Array.isArray(CMS.curLesson.content.blocks)) CMS.curLesson.content = { blocks: [] };
  $('#cmsLessonLevel').value = lv.id; $('#cmsLessonModule').value = m.id; $('#cmsLessonSelect').value = l.id;
  paintLessonEditor();
}
function paintLessonEditor() {
  const l = CMS.curLesson;
  if (!l) return;
  $('#cmsLessonEditor').style.display = '';
  $('#cmsLessonTitle').textContent = `${l.id} — ${l.title} (${l.status || 'draft'}, ${l.minutes} min)`;
  const box = $('#cmsLessonBlocks'); box.innerHTML = '';
  if (!l.content.blocks.length) box.innerHTML = '<p class="muted">No blocks yet — add one above.</p>';
  l.content.blocks.forEach((b, i) => {
    const d = document.createElement('div'); d.className = 'proj';
    let fields = `<b>#${i + 1} ${esc(b.type)}</b> <span class="price">${esc(l.id)}</span><br>`;
    const fid = `blk-${i}-`;
    if (b.type === 'text' || b.type === 'heading' || b.type === 'terminal' || b.type === 'prompt') {
      fields += `<textarea id="${fid}content" rows="4" style="width:100%;background:var(--card);color:#fff;border:1px solid var(--line);border-radius:4px;padding:8px;">${esc(b.content || '')}</textarea>`;
      if (b.type === 'text') fields += `<br><span class="muted">Rich text — plain paragraphs, line breaks preserved. Use heading block for titles.</span>`;
      if (b.type === 'terminal') fields += `<br><span class="muted">Terminal commands — one per line, e.g. npm install, node server.js</span>`;
      if (b.type === 'prompt') fields += `<br><span class="muted">Prompt — GOAL + CONTEXT + CONSTRAINTS + EXAMPLE</span>`;
    } else if (b.type === 'code') {
      fields += `Language: <input id="${fid}lang" class="search" style="max-width:160px;display:inline-block;" value="${esc(b.language || 'javascript')}"><br><textarea id="${fid}content" rows="6" style="width:100%;font-family:monospace;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:10px;">${esc(b.content || '')}</textarea>`;
    } else if (b.type === 'video' || b.type === 'image') {
      fields += `URL: <input id="${fid}url" class="search" value="${esc(b.url || '')}" placeholder="https://…"><br>Caption: <input id="${fid}cap" class="search" value="${esc(b.caption || '')}" placeholder="Caption">`;
      if (b.type === 'image') fields += `<br>Alt: <input id="${fid}alt" class="search" value="${esc(b.alt || '')}" placeholder="Alt text">`;
      if (b.url) fields += `<br>${b.type === 'video' ? `<a href="${esc(b.url)}" target="_blank" style="color:var(--acc)">▶ Preview video link</a>` : `<img src="${esc(b.url)}" alt="${esc(b.alt || '')}" style="max-width:100%;border-radius:4px;margin-top:8px;" onerror="this.style.display='none'">`}`;
    } else if (b.type === 'download' || b.type === 'link') {
      fields += `URL: <input id="${fid}url" class="search" value="${esc(b.url || '')}" placeholder="https://…"><br>Label: <input id="${fid}label" class="search" value="${esc(b.label || '')}" placeholder="Label">`;
    } else if (b.type === 'quiz') {
      fields += `Question: <input id="${fid}q" class="search" value="${esc(b.question || '')}"><br>Options (one per line):<br><textarea id="${fid}opts" rows="3" style="width:100%;background:var(--card);color:#fff;border:1px solid var(--line);border-radius:4px;padding:8px;">${esc((b.options || []).join('\n'))}</textarea><br>Correct index (0-based): <input id="${fid}ans" class="search" style="max-width:80px;display:inline-block;" value="${b.answer || 0}">`;
    } else if (b.type === 'exercise') {
      fields += `Title: <input id="${fid}title" class="search" value="${esc(b.title || '')}"><br>Instructions:<br><textarea id="${fid}inst" rows="3" style="width:100%;background:var(--card);color:#fff;border:1px solid var(--line);border-radius:4px;padding:8px;">${esc(b.instructions || '')}</textarea><br>Expected:<br><textarea id="${fid}exp" rows="2" style="width:100%;background:var(--card);color:#fff;border:1px solid var(--line);border-radius:4px;padding:8px;">${esc(b.expected || '')}</textarea>`;
    }
    d.innerHTML = fields;
    const row = document.createElement('div'); row.className = 'cta'; row.style.flexWrap = 'wrap';
    const mk = (t, fn) => { const btn = document.createElement('button'); btn.className = 'ghost'; btn.textContent = t; btn.style.fontSize = '12px'; btn.addEventListener('click', fn); row.appendChild(btn); };
    mk('↑', () => { if (i === 0) return; const bs = CMS.curLesson.content.blocks; [bs[i - 1], bs[i]] = [bs[i], bs[i - 1]]; syncBlockInputs(); paintLessonEditor(); });
    mk('↓', () => { const bs = CMS.curLesson.content.blocks; if (i >= bs.length - 1) return; [bs[i + 1], bs[i]] = [bs[i], bs[i + 1]]; syncBlockInputs(); paintLessonEditor(); });
    mk('🗑 Delete', () => { CMS.curLesson.content.blocks.splice(i, 1); paintLessonEditor(); });
    mk('💾 Sync field', () => { syncBlockInputs(); });
    d.appendChild(row); box.appendChild(d);
  });
}
function syncBlockInputs() {
  const l = CMS.curLesson; if (!l) return;
  l.content.blocks.forEach((b, i) => {
    const g = (id) => document.getElementById(`blk-${i}-${id}`);
    if (b.type === 'text' || b.type === 'heading' || b.type === 'terminal' || b.type === 'prompt') { if (g('content')) b.content = g('content').value; }
    else if (b.type === 'code') { if (g('lang')) b.language = g('lang').value; if (g('content')) b.content = g('content').value; }
    else if (b.type === 'video' || b.type === 'image') { if (g('url')) b.url = g('url').value; if (g('cap')) b.caption = g('cap').value; if (g('alt')) b.alt = g('alt').value; }
    else if (b.type === 'download' || b.type === 'link') { if (g('url')) b.url = g('url').value; if (g('label')) b.label = g('label').value; }
    else if (b.type === 'quiz') { if (g('q')) b.question = g('q').value; if (g('opts')) b.options = g('opts').value.split('\n').map((s) => s.trim()).filter(Boolean); if (g('ans')) b.answer = Number(g('ans').value) || 0; }
    else if (b.type === 'exercise') { if (g('title')) b.title = g('title').value; if (g('inst')) b.instructions = g('inst').value; if (g('exp')) b.expected = g('exp').value; }
  });
}
async function cmsLessonEditor() {
  if (!$('#cmsLessonLevel')) return;
  if (!cmsToken()) { $('#cmsLessonEditor').style.display = 'none'; return; }
  const d = await cmsGet('/api/cms/course');
  if (!d.ok) return;
  CMS.course = d.course;
  const lvSel = $('#cmsLessonLevel'), mSel = $('#cmsLessonModule'), lSel = $('#cmsLessonSelect');
  lvSel.innerHTML = d.course.levels.map((lv) => `<option value="${esc(lv.id)}">${esc(lv.id)} — ${esc(lv.title)}</option>`).join('');
  const fillModules = () => {
    const lv = d.course.levels.find((x) => x.id === lvSel.value) || d.course.levels[0];
    mSel.innerHTML = lv.modules.map((m) => `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.title)}</option>`).join('');
    fillLessons();
  };
  const fillLessons = () => {
    const lv = d.course.levels.find((x) => x.id === lvSel.value) || d.course.levels[0];
    const m = lv.modules.find((x) => x.id === mSel.value) || lv.modules[0];
    if (!m) { lSel.innerHTML = ''; return; }
    lSel.innerHTML = m.lessons.map((l) => `<option value="${esc(l.id)}">${esc(l.id)} — ${esc(l.title)} [${esc(l.status || 'draft')}]</option>`).join('');
  };
  lvSel.onchange = fillModules; mSel.onchange = fillLessons;
  lSel.onchange = () => cmsSelectLesson(lvSel.value, mSel.value, lSel.value);
  fillModules();
  if (d.course.levels[0] && d.course.levels[0].modules[0] && d.course.levels[0].modules[0].lessons[0]) {
    await cmsSelectLesson(d.course.levels[0].id, d.course.levels[0].modules[0].id, d.course.levels[0].modules[0].lessons[0].id);
  }
  document.querySelectorAll('.block-btn').forEach((b) => b.onclick = () => {
    if (!CMS.curLesson) { alert('Select a lesson first'); return; }
    syncBlockInputs();
    CMS.curLesson.content.blocks.push(blankBlock(b.dataset.type));
    paintLessonEditor();
  });
  $('#cmsLessonSave').onclick = async () => {
    if (!CMS.curLesson) return;
    syncBlockInputs();
    const { levelId, moduleId, lessonId } = CMS.curIds;
    const r = await cmsPut(`/api/cms/level/${encodeURIComponent(levelId)}/module/${encodeURIComponent(moduleId)}/lesson/${encodeURIComponent(lessonId)}`, { content: CMS.curLesson.content, title: CMS.curLesson.title, minutes: CMS.curLesson.minutes });
    alert(r.ok ? 'Saved ✓' : 'Save failed: ' + (r.error || 'unknown'));
  };
  $('#cmsLessonPublish').onclick = async () => {
    const { levelId, moduleId, lessonId } = CMS.curIds;
    await cmsPut(`/api/cms/level/${encodeURIComponent(levelId)}/module/${encodeURIComponent(moduleId)}/lesson/${encodeURIComponent(lessonId)}/status`, { status: 'published' });
    CMS.curLesson.status = 'published'; paintLessonEditor(); cmsDashboard();
  };
  $('#cmsLessonDraft').onclick = async () => {
    const { levelId, moduleId, lessonId } = CMS.curIds;
    await cmsPut(`/api/cms/level/${encodeURIComponent(levelId)}/module/${encodeURIComponent(moduleId)}/lesson/${encodeURIComponent(lessonId)}/status`, { status: 'draft' });
    CMS.curLesson.status = 'draft'; paintLessonEditor(); cmsDashboard();
  };
  $('#cmsLessonPreview').onclick = () => {
    if (!CMS.curLesson) return;
    syncBlockInputs();
    const w = window.open('', '_blank');
    const html = CMS.curLesson.content.blocks.map((b) => {
      if (b.type === 'heading') return `<h2>${esc(b.content)}</h2>`;
      if (b.type === 'text' || b.type === 'prompt' || b.type === 'terminal') return `<pre style="white-space:pre-wrap;background:var(--surface);padding:14px;border-radius:12px;border:1px solid var(--line);">${esc(b.content)}</pre>`;
      if (b.type === 'code') return `<pre style="background:#0a0a23;color:#fff;padding:14px;border-radius:3px;border:1px solid var(--line);"><code>[${esc(b.language)}]\n${esc(b.content)}</code></pre>`;
      if (b.type === 'video') return `<p>${ICONS.video} <a href="${esc(b.url)}">${esc(b.caption || b.url)}</a></p>`;
      if (b.type === 'image') return `<p>${ICONS.image} <img src="${esc(b.url)}" style="max-width:100%"><br>${esc(b.caption || '')}</p>`;
      if (b.type === 'download' || b.type === 'link') return `<p>${ICONS.link} <a href="${esc(b.url)}">${esc(b.label || b.url)}</a></p>`;
      if (b.type === 'quiz') return `<p>${ICONS.help} ${esc(b.question)}<br>${(b.options || []).map((o, i) => `${i === b.answer ? '✅' : '○'} ${esc(o)}`).join('<br>')}</p>`;
      if (b.type === 'exercise') return `<p>${ICONS.target} <b>${esc(b.title)}</b><br>${esc(b.instructions)}<br><i>Expected: ${esc(b.expected)}</i></p>`;
      return `<p>${esc(JSON.stringify(b))}</p>`;
    }).join('');
    w.document.write(`<title>Preview ${esc(CMS.curLesson.id)}</title><body style="font-family:sans-serif;max-width:700px;margin:20px auto;">${html}</body>`);
  };
}

// ---- Students ----
async function cmsStudents() {
  const list = $('#cmsStudentList');
  if (!list) return;
  if (cmsNeedAuth(null, list)) return;
  const paint = async (q) => {
    const d = await cmsGet('/api/cms/students');
    if (!d.ok) { list.innerHTML = 'Failed'; return; }
    CMS.students = d.students;
    const f = d.students.filter((s) => !q || (s.email + s.name).toLowerCase().includes(q.toLowerCase()));
    list.innerHTML = f.length ? '' : '<p class="muted">No students yet — register an account below (Student accounts section).</p>';
    f.forEach((s) => {
      const dv = document.createElement('div'); dv.className = 'proj';
      dv.innerHTML = `<b>${esc(s.name)}</b> <span class="price">${esc(s.enrollmentStatus)} • ${esc(s.role)}</span><br><span class="muted">${esc(s.email)} • L${s.currentLevel} • verified=${s.emailVerified} • enrolled=${esc(s.enrollment.status)} • Joined ${esc(String(s.createdAt || '').slice(0, 10))}</span>`;
      const row = document.createElement('div'); row.className = 'cta';
      const view = document.createElement('button'); view.className = 'ghost'; view.textContent = '👁 View progress / projects / attendance';
      view.addEventListener('click', async () => {
        const det = await cmsGet('/api/cms/students/' + encodeURIComponent(s.email));
        if (!det.ok) { alert('Load failed'); return; }
        const st = det.student;
        alert(`STUDENT: ${st.name} <${st.email}>\nEnrollment: ${st.enrollmentStatus} (${st.enrollment.status})\nProgress: ${st.stats.doneCount}/${st.stats.totalLessons} (${st.stats.pct}%)\nPurchases: ${st.purchases.map((p) => p.id + ':' + p.productId).join(', ') || 'none'}\nAttendance:\n${st.attendance.map((a) => `- ${a.title} ${String(a.startsAt).slice(0, 10)} present=${a.present}`).join('\n') || 'no meetings'}`);
      });
      const enr = document.createElement('button'); enr.className = 'ghost'; enr.textContent = '✏️ Enrollment';
      enr.addEventListener('click', async () => {
        const ns = prompt('Enrollment status (pending/active/completed/suspended)', s.enrollmentStatus);
        if (ns === null) return;
        const nl = prompt('Current level 1-10', String(s.currentLevel));
        if (nl === null) return;
        await cmsPut('/api/cms/students/' + encodeURIComponent(s.email), { enrollmentStatus: ns, currentLevel: Number(nl) });
        paint($('#cmsStudentSearch').value);
      });
      row.appendChild(view); row.appendChild(enr); dv.appendChild(row); list.appendChild(dv);
    });
  };
  $('#cmsStudentSearch').addEventListener('input', (e) => paint(e.target.value));
  paint('');
}

// ---- Meetings ----
async function cmsMeetings() {
  const list = $('#cmsMeetingList');
  if (!list) return;
  if (cmsNeedAuth(null, list)) return;
  let editingId = null;
  const paint = async () => {
    const d = await cmsGet('/api/cms/meetings');
    CMS.meetings = d.ok ? d.meetings : [];
    list.innerHTML = CMS.meetings.length ? '' : '<p class="muted">No meetings yet — create the weekly meet.</p>';
    CMS.meetings.forEach((m) => {
      const dv = document.createElement('div'); dv.className = 'proj';
      dv.innerHTML = `<b>${esc(m.title)}</b> <span class="price">${esc(m.recurring)} • ${m.duration}min</span><br><span class="muted">${esc(String(m.startsAt).slice(0, 16))} • <a href="${esc(m.url)}" style="color:var(--acc)">${esc(m.url || 'no URL')}</a></span><br><span class="muted">${esc(m.description || '')}</span><br><span class="muted">Recording: ${esc(m.recordingUrl || 'none')} • ${((m.attendees || []).length)} attending • ${((m.announcements || []).length)} announcements</span>`;
      const row = document.createElement('div'); row.className = 'cta'; row.style.flexWrap = 'wrap';
      const mk = (t, fn) => { const b = document.createElement('button'); b.className = 'ghost'; b.textContent = t; b.style.fontSize = '12px'; b.addEventListener('click', fn); row.appendChild(b); };
      mk('✏️ Edit', () => openForm(m));
      mk('🗑 Delete', async () => { if (!confirm('Delete meeting?')) return; await cmsDel('/api/cms/meetings/' + encodeURIComponent(m.id)); paint(); });
      mk('📢 Announce', async () => {
        const msg = prompt('Announcement for ' + m.title); if (!msg) return;
        await cmsPost('/api/cms/meetings/' + encodeURIComponent(m.id) + '/announce', { message: msg }); paint();
      });
      mk('Set recording', async () => {
        const url = prompt('Recording URL', m.recordingUrl || ''); if (url === null) return;
        await cmsPut('/api/cms/meetings/' + encodeURIComponent(m.id), { recordingUrl: url }); paint();
      });
      mk('👥 + attendance', async () => {
        const em = prompt('Student email to mark attending'); if (!em) return;
        await cmsPost('/api/cms/meetings/' + encodeURIComponent(m.id) + '/attend', { email: em }); paint();
      });
      dv.appendChild(row); list.appendChild(dv);
    });
  };
  const openForm = (m) => {
    editingId = m ? m.id : null;
    $('#cmsMeetingFormTitle').textContent = m ? 'Edit Meeting' : 'Create Meeting';
    $('#mtTitle').value = m ? m.title : '';
    $('#mtDesc').value = m ? (m.description || '') : '';
    $('#mtStart').value = m ? String(m.startsAt).slice(0, 16) : '';
    $('#mtDuration').value = m ? m.duration : 60;
    $('#mtRecurring').value = m ? m.recurring : 'weekly';
    $('#mtUrl').value = m ? (m.url || '') : 'https://meet.aimasterplan.app/weekly';
    $('#mtRecording').value = m ? (m.recordingUrl || '') : '';
    $('#cmsMeetingForm').style.display = ''; $('#cmsMeetingOverlay').style.display = '';
  };
  const closeForm = () => { $('#cmsMeetingForm').style.display = 'none'; $('#cmsMeetingOverlay').style.display = 'none'; editingId = null; };
  $('#cmsAddMeeting').onclick = () => openForm(null);
  $('#mtCancel').onclick = closeForm; $('#cmsMeetingOverlay').onclick = closeForm;
  $('#mtSave').onclick = async () => {
    const body = { title: $('#mtTitle').value, description: $('#mtDesc').value, startsAt: $('#mtStart').value ? new Date($('#mtStart').value).toISOString() : new Date().toISOString(), duration: Number($('#mtDuration').value) || 60, recurring: $('#mtRecurring').value, url: $('#mtUrl').value, recordingUrl: $('#mtRecording').value };
    if (editingId) await cmsPut('/api/cms/meetings/' + encodeURIComponent(editingId), body);
    else await cmsPost('/api/cms/meetings', body);
    closeForm(); paint();
  };
  paint();
}

// ---- Moderation ----
async function cmsModeration() {
  const list = $('#cmsModList');
  if (!list) return;
  if (cmsNeedAuth(null, list)) return;
  const paint = async () => {
    const d = await cmsGet('/api/cms/moderation');
    const reps = d.ok ? d.reports : [];
    list.innerHTML = reps.length ? '' : '<p class="muted">No reports — queue clear. Announcements post to #Announcements channel.</p>';
    reps.forEach((p) => {
      const dv = document.createElement('div'); dv.className = 'proj';
      dv.innerHTML = `<b>${esc(p.author)}</b> <span class="price">${esc(p.channel)} • ${p.reports} reports</span><br>${esc(p.body)}<br><span class="muted">${esc(p.id)} • ${(p.comments || []).length} comments</span>`;
      const row = document.createElement('div'); row.className = 'cta';
      const dis = document.createElement('button'); dis.className = 'ghost'; dis.textContent = '✅ Dismiss';
      dis.addEventListener('click', async () => { await cmsPost('/api/cms/moderation/' + encodeURIComponent(p.id) + '/dismiss', {}); paint(); cmsDashboard(); });
      const rem = document.createElement('button'); rem.className = 'ghost'; rem.textContent = '🗑 Remove';
      rem.addEventListener('click', async () => { if (!confirm('Remove post?')) return; await cmsPost('/api/cms/moderation/' + encodeURIComponent(p.id) + '/remove', {}); paint(); cmsDashboard(); });
      row.appendChild(dis); row.appendChild(rem); dv.appendChild(row); list.appendChild(dv);
    });
  };
  $('#cmsAnnounceSend').onclick = async () => {
    const msg = $('#cmsAnnounceMsg').value.trim(); if (!msg) { alert('Type announcement first'); return; }
    const r = await cmsPost('/api/cms/announcement', { body: msg, author: 'Author' });
    if (r.ok) { $('#cmsAnnounceMsg').value = ''; alert('Announcement posted ✓'); }
    else alert('Failed');
  };
  paint();
}
const EXPLAIN_SHORT = [  ['Vibe Coding', 'Describe in words; AI writes code. You direct, check, fix.'],
  ['AI-assisted dev', 'Loop: prompt → generate → run → fix. Small loops win.'],
  ['Prompts', 'GOAL + CONTEXT + CONSTRAINTS + EXAMPLE of done.'],
  ['Frontend/backend', 'Menu+tables vs kitchen+pantry. They talk over network.'],
  ['APIs', 'Menus for software: request → JSON response. Keys server-side.'],
  ['Databases', 'Remember rows: create/read/update/delete/query.'],
  ['Deployment', 'Publish to a real link: test → internal → production.'],
  ['AI models', 'Next-word prediction; needs clear instructions + guardrails.'],
];
async function wireOnboard() {
  const btn = $('#oBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const coded = $('#oCoded').value, ai = $('#oAI').value, goal = $('#oGoal').value;
    $('#oExp').textContent = EXPLAIN_SHORT.map((e, i) => `${i + 1}. ${e[0]}: ${e[1]}`).join('\n');
    $('#oOut').textContent = 'recommending…';
    const r = await jget(`/api/onboard?coded=${coded}&ai=${ai}&goal=${goal}`);
    $('#oOut').textContent = `${r.headline}\nStart: ${r.startLessonId} (${r.fastTrack ? 'fast-track' : 'full guidance'})\nProject: ${r.focusProjectId} — ${r.focusProjectTitle}\n\nFirst week:\n- ${r.firstWeek.join('\n- ')}`;
    try { store.set('amp-onboard', { coded, ai, goal, at: new Date().toISOString(), headline: r.headline, startLessonId: r.startLessonId }); } catch {}
  });
  try {
    const saved = store.get('amp-onboard', null);
    if (saved && saved.headline) $('#oOut').textContent = `Saved recommendation (${String(saved.at || '').slice(0, 10)}):\n${saved.headline}\nStart: ${saved.startLessonId}`;
  } catch {}
}
async function post(p, body, token) {
  const r = await fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body || {}) });
  return r.json();
}
function tok() { return localStorage.getItem('amp-own-token'); }
function say(t) { $('#authOut').textContent = t; }
async function refreshMe() {
  const t = tok();
  if (!t) {
    $('#meOut').textContent = 'Signed out.';
    const hh0 = $('#health');
    if (hh0 && hh0.dataset.server) hh0.textContent = hh0.dataset.server;
    return null;
  }
  const r = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + t } });
  const j = await r.json();
  if (!j.ok) { $('#meOut').textContent = 'Signed out (session expired).'; localStorage.removeItem('amp-own-token'); const hh1 = $('#health'); if (hh1 && hh1.dataset.server) hh1.textContent = hh1.dataset.server; return null; }
  const u = j.user;
  $('#meOut').textContent = `Signed in: ${u.name} <${u.email}> • ${u.role} • verified=${u.emailVerified} • enrollment=${u.enrollmentStatus} • level ${u.currentLevel} • goals=[${u.learningGoals.join(', ') || '—'}]`;
  const hh = $('#health');
  if (hh && hh.dataset.server) hh.textContent = `Welcome back, ${u.name}! • ` + hh.dataset.server;
  $('#pName').value = u.name || '';
  $('#pAvatar').value = u.avatarUrl || '';
  $('#pRole').value = u.role || 'student';
  return u;
}
function wireAuth() {
  const creds = () => ({ email: $('#aEmail').value.trim(), password: $('#aPass').value });
  $('#regBtn').addEventListener('click', async () => {
    const { email, password } = creds();
    const j = await post('/api/auth/register', { email, password });
    say(JSON.stringify(j, null, 2));
    if (j.ok) { localStorage.setItem('amp-own-token', j.token); await refreshMe(); }
  });
  $('#loginBtn').addEventListener('click', async () => {
    const { email, password } = creds();
    const j = await post('/api/auth/login', { email, password });
    say(JSON.stringify(j, null, 2));
    if (j.ok) { localStorage.setItem('amp-own-token', j.token); await refreshMe(); }
  });
  $('#googleBtn').addEventListener('click', async () => {
    const email = $('#aEmail').value.trim() || 'google.student@example.com';
    const j = await post('/api/auth/google', { email, name: 'Google Student' });
    say(JSON.stringify(j, null, 2));
    if (j.ok) { localStorage.setItem('amp-own-token', j.token); await refreshMe(); }
  });
  $('#appleBtn').addEventListener('click', async () => {
    const email = $('#aEmail').value.trim() || 'apple.student@privaterelay.apple.com';
    const j = await post('/api/auth/apple', { email, name: 'Apple Student' });
    say(JSON.stringify(j, null, 2));
    if (j.ok) { localStorage.setItem('amp-own-token', j.token); await refreshMe(); }
  });
  $('#verifyBtn').addEventListener('click', async () => {
    const j = await post('/api/auth/verify', { email: $('#aEmail').value.trim(), code: $('#aCode').value.trim() });
    say(JSON.stringify(j, null, 2));
    await refreshMe();
  });
  $('#recBtn').addEventListener('click', async () => {
    const j = await post('/api/auth/recover', { email: $('#aEmail').value.trim() });
    say(JSON.stringify(j, null, 2));
  });
  $('#resetBtn2').addEventListener('click', async () => {
    const j = await post('/api/auth/reset', { email: $('#aEmail').value.trim(), code: $('#aCode').value.trim(), newPassword: $('#aNew').value });
    say(JSON.stringify(j, null, 2));
  });
  $('#logoutBtn').addEventListener('click', async () => { localStorage.removeItem('amp-own-token'); say('Signed out.'); await refreshMe(); });
  $('#saveProfile').addEventListener('click', async () => {
    const t = tok();
    if (!t) { say('Sign in first.'); return; }
    const r = await fetch('/api/me', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t }, body: JSON.stringify({ name: $('#pName').value, avatarUrl: $('#pAvatar').value, role: $('#pRole').value }) });
    const j = await r.json();
    say(JSON.stringify(j, null, 2));
    await refreshMe();
  });
  refreshMe();
}
boot();
