/* ============================================================
   首页：加载 → Hero → 作品列表（由 assets/projects.js 渲染）
   ============================================================ */
const Site = window.Site;
const PROJECTS = window.PROJECTS || [];
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const href = p => 'project.html?id=' + encodeURIComponent(p.id);

/* ---------- 作品 ---------- */
function renderWork() {
  document.getElementById('workList').innerHTML = PROJECTS.map(p => `
    <a class="card reveal" href="${href(p)}" data-cursor="View">
      <span class="card__media">
        <video src="${esc(p.cover)}" ${p.poster ? `poster="${esc(p.poster)}"` : ''} muted loop playsinline autoplay preload="metadata"></video>
      </span>
      <span class="card__body">
        <span class="card__title">${esc(p.title)}</span>
        <span class="card__arrow" aria-hidden="true">→</span>
      </span>
      <span class="card__kind mono">${esc(p.kind || '')}${p.year ? ' · ' + esc(p.year) : ''}</span>
    </a>`).join('');
}

/* ---------- Projects：无缝循环滚动（悬停减速、可拖拽） ---------- */
function initMarquee(root) {
  const track = root.querySelector('.marquee__track');
  const set = [...track.children];
  if (!set.length) return;
  set.forEach(c => c.classList.remove('reveal'));
  // 复制整组直到铺满两倍可视宽度，保证首尾无缝
  const fill = () => {
    const w = track.scrollWidth;
    const copies = Math.max(1, Math.ceil((root.clientWidth * 2) / Math.max(1, w)));
    for (let i = 0; i < copies; i++) set.forEach(c => {
      const k = c.cloneNode(true);
      k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1;
      track.appendChild(k);
    });
  };
  fill();
  track.querySelectorAll('video').forEach(v => { v.muted = true; });

  const setWidth = () => set[set.length - 1].offsetLeft + set[set.length - 1].offsetWidth - set[0].offsetLeft
    + parseFloat(getComputedStyle(track).columnGap || 0);
  let W = setWidth();
  window.addEventListener('resize', () => { W = setWidth(); });

  const BASE = Site.reduce ? 0 : 42; // px / s
  let x = 0, speed = BASE, target = BASE, last = performance.now();
  let drag = false, startX = 0, startOff = 0, moved = 0, vel = 0, lastX = 0;

  root.addEventListener('pointerenter', () => { target = BASE * 0.15; });
  root.addEventListener('pointerleave', () => { target = BASE; drag = false; });
  root.addEventListener('pointerdown', e => {
    drag = true; moved = 0; startX = lastX = e.clientX; startOff = x; vel = 0;
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    vel = e.clientX - lastX; lastX = e.clientX;
    x = startOff + (e.clientX - startX);
  });
  window.addEventListener('pointerup', () => { if (drag) { drag = false; speed = -vel * 30; } });
  // 拖拽过就不触发卡片链接
  root.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  root.addEventListener('dragstart', e => e.preventDefault());

  (function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!drag) {
      speed += (target - speed) * Math.min(1, dt * 3);
      x -= speed * dt;
    }
    if (W > 0) { x %= W; if (x > 0) x -= W; }
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    requestAnimationFrame(loop);
  })(last);
}

/* 视频进入视口才播放，离开即暂停 */
function autoplayInView(root) {
  const vids = root.querySelectorAll('video');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting && v.offsetParent !== null) v.play().catch(() => {}); else v.pause();
  }), { threshold: 0.25 });
  vids.forEach(v => io.observe(v));
}

/* ---------- 结尾大字：持续波动，鼠标靠近的字母被推开并变蓝 ---------- */
function initCta(el) {
  if (!el) return;
  const chars = [];
  let n = 0;
  el.querySelectorAll('.split-line > span').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    for (const c of text) {
      if (c === ' ') { line.appendChild(document.createTextNode(' ')); continue; }
      const outer = document.createElement('span');
      outer.className = 'ch';
      outer.style.setProperty('--i', n++);
      const inner = document.createElement('span');
      inner.textContent = c;
      outer.appendChild(inner);
      line.appendChild(outer);
      chars.push(inner);
    }
  });
  // 入场结束后放开裁切，字母才能跑出行框
  setTimeout(() => el.classList.add('is-live'), 1600);
  if (Site.reduce || !Site.fine) return;

  let mx = -1e4, my = -1e4, raf = 0;
  function update() {
    raf = 0;
    for (const c of chars) {
      const r = c.getBoundingClientRect();
      const dx = r.left + r.width / 2 - mx, dy = r.top + r.height / 2 - my;
      const d = Math.hypot(dx, dy), R = 180;
      if (d < R) {
        const k = Math.pow(1 - d / R, 2);
        c.style.transform = `translate(${(dx / (d || 1)) * k * 38}px, ${(dy / (d || 1)) * k * 38}px) rotate(${(dx > 0 ? 1 : -1) * k * 14}deg) scale(${1 + k * 0.12})`;
        c.classList.toggle('is-hot', k > 0.12);
      } else if (c.style.transform) {
        c.style.transform = '';
        c.classList.remove('is-hot');
      }
    }
  }
  el.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(update); });
  el.addEventListener('pointerleave', () => { mx = my = -1e4; if (!raf) raf = requestAnimationFrame(update); });
}

/* ---------- 姓名：克制的字重呼吸，鼠标靠近的字母变细 ---------- */
function initName(el) {
  if (!el) return;
  const letters = [];
  el.querySelectorAll('.split-line > span').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'nm';
      s.textContent = c;
      line.appendChild(s);
      letters.push(s);
    }
  });
  if (Site.reduce) return;
  const w = letters.map(() => 500);
  let mx = -1e4, my = -1e4;
  window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  (function loop(t) {
    requestAnimationFrame(loop);
    if (window.scrollY > window.innerHeight * 0.8) return;
    const R = Math.max(240, window.innerWidth * 0.2);
    const rects = letters.map(l => l.getBoundingClientRect());
    letters.forEach((l, i) => {
      const r = rects[i];
      const d = Math.hypot(r.left + r.width / 2 - mx, r.top + r.height / 2 - my);
      const near = Math.max(0, 1 - d / R);
      // 极慢的横向波：500 ± 35；靠近光标时降到约 320
      const wave = Math.sin(t * 0.0009 - i * 0.6) * 35;
      const target = 500 + wave - near * near * 180;
      w[i] += (target - w[i]) * 0.08;
      l.style.setProperty('--w', w[i].toFixed(1));
    });
  })(performance.now());
}

/* ---------- 左下角 3D 坐标轴：随页面与鼠标轻微转动 ---------- */
function initGizmo(root) {
  if (!root || !Site.fine || window.innerWidth <= 900) return;
  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const L = 75, S = 2 * (L + 18), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = cv.height = S * dpr;
  ctx.scale(dpr, dpr);
  const AX = [
    { v: [1, 0, 0], c: '#e9ebf1', l: 'X' },
    { v: [0, 1, 0], c: '#e9ebf1', l: 'Y' },
    { v: [0, 0, 1], c: '#3a5bd0', l: 'Z' }
  ];
  const rad = Math.PI / 180;
  let yaw = -35, pitch = 22, ty = yaw, tp = pitch, mx = 0.5, my = 0.5, lastKey = '';
  window.addEventListener('pointermove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });

  function project(v) {
    const cy = Math.cos(yaw * rad), sy = Math.sin(yaw * rad);
    const cp = Math.cos(pitch * rad), sp = Math.sin(pitch * rad);
    const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
    const y2 = v[1] * cp - z1 * sp, z2 = v[1] * sp + z1 * cp;
    return [x1, -y2, z2];
  }
  // 只画正方向：细轴线 + 末端小圆点 + 轴名
  function draw() {
    ctx.clearRect(0, 0, S, S);
    const ends = AX.map(a => ({ a, p: project(a.v) })).sort((m, n) => m.p[2] - n.p[2]);
    // 以轴（含轴名）的实际外框贴齐画布左下角内边距，保证与页面左、下边距一致
    let minX = 0, maxY = 0;
    ends.forEach(({ p }) => {
      const len = Math.hypot(p[0], p[1]) || 1;
      minX = Math.min(minX, p[0] * L, p[0] * L + (p[0] / len) * 11 - 4);
      maxY = Math.max(maxY, p[1] * L, p[1] * L + (p[1] / len) * 11 + 5);
    });
    const ox = 18 - minX, oy = S - 18 - maxY;
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ends.forEach(({ a, p }) => {
      const x = ox + p[0] * L, y = oy + p[1] * L;
      ctx.globalAlpha = 0.6 + 0.4 * ((p[2] + 1) / 2);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y);
      ctx.strokeStyle = a.c; ctx.lineWidth = 1.25; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = a.c; ctx.fill();
      const len = Math.hypot(p[0], p[1]) || 1;
      ctx.fillText(a.l, x + (p[0] / len) * 11, y + (p[1] / len) * 11);
    });
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(ox, oy, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233,235,241,0.6)'; ctx.fill();
  }
  const foot = document.querySelector('.foot');
  (function loop() {
    requestAnimationFrame(loop);
    const k = window.scrollY / window.innerHeight;
    // 第二页起显示；最后一页（页脚）收起，避免压到版权行
    const on = k > 0.5 && !(foot && foot.getBoundingClientRect().top < innerHeight * 0.5);
    root.classList.toggle('is-on', on);
    if (!on) return;
    ty = -35 + k * 9 + (mx - 0.5) * 34;
    tp = 22 + (my - 0.5) * 22;
    yaw += (ty - yaw) * 0.06;
    pitch += (tp - pitch) * 0.06;
    const key = yaw.toFixed(2) + ',' + pitch.toFixed(2);
    if (key !== lastKey) { lastKey = key; draw(); }
  })();
}

/* ---------- 加载器 ---------- */
const loader = document.getElementById('loader');
const num = document.getElementById('loaderNum');
let shown = 0, goal = 0;
const t0 = performance.now();
let seen = false;
try { seen = sessionStorage.getItem('jm-seen') === '1'; sessionStorage.setItem('jm-seen', '1'); } catch (e) {}
const minTime = Site.reduce || seen ? 0 : 500;

const asciiEl = document.getElementById('loaderBar');
const SPIN = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
const NOISE = '/\\|_-=+<>*#%';
const CELLS = 40;
let frameN = 0;
function asciiBar(k) {
  const fill = Math.round(k * CELLS);
  let tail = '';
  for (let i = fill; i < CELLS; i++) {
    const d = i - fill;
    if (d < 3) tail += '<em>' + '▓▒░'[d] + '</em>';
    else if (d < 8 && Math.random() < 0.35) tail += NOISE[(Math.random() * NOISE.length) | 0];
    else tail += '·';
  }
  const spin = k < 1 ? SPIN[(frameN >> 2) % SPIN.length] : '✓';
  const pct = String(Math.round(k * 100)).padStart(3, '0');
  return `<em>${spin}</em>  <b>[${'█'.repeat(fill)}</b>${tail}<b>]</b>  <b>${pct}%</b>`;
}
function tickLoader() {
  shown += (goal - shown) * 0.2;
  if (goal - shown < 0.004) shown = goal;
  frameN++;
  num.textContent = String(Math.round(shown * 100)).padStart(3, '0');
  asciiEl.innerHTML = asciiBar(shown);
  if (shown < 1 || frameN < 2) requestAnimationFrame(tickLoader);
}
requestAnimationFrame(tickLoader);

function finishLoading() {
  goal = 1;
  const wait = Math.max(0, minTime - (performance.now() - t0));
  setTimeout(() => {
    loader.classList.add('is-done');
    document.getElementById('hero').classList.add('is-in');
    setTimeout(() => loader.remove(), 800);
  }, wait + (seen ? 0 : 120));
}

/* ---------- Hero ---------- */
async function startHero() {
  const canvas = document.getElementById('heroCanvas');
  const nameEl = document.getElementById('styleName');
  const idxEl = document.getElementById('styleIdx');
  const bar = document.getElementById('styleBar');
  try {
    const { initHero } = await import('./hero.js');
    const hero = await initHero({
      canvas,
      onProgress: p => { goal = Math.min(0.96, p); },
      onStyle: (i, name, n) => {
        nameEl.textContent = name;
        idxEl.textContent = pad(i + 1) + '/' + pad(n);
      },
      onCycle: k => { bar.style.transform = 'scaleX(' + Math.min(1, k) + ')'; }
    });
    document.getElementById('styleBtn').addEventListener('click', () => hero.next());
    const s = hero.stats;
    document.getElementById('heroSpec').innerHTML =
      `<span>${s.points.toLocaleString('en-US')} pts</span><span>${s.joints} joints</span><span>GPU skinning</span>`;
  } catch (e) {
    console.warn('[hero]', e);
    document.documentElement.classList.add('no-webgl');
    document.querySelector('.hud-style').style.visibility = 'hidden';
  }
  finishLoading();
}

renderWork();
initMarquee(document.getElementById('marquee'));
['projects'].forEach(id => {
  const el = document.getElementById(id);
  Site.observe(el); Site.magnet(el); autoplayInView(el);
});
initCta(document.getElementById('cta'));
initName(document.querySelector('.hero__name'));
initGizmo(document.getElementById('gizmo'));
Site.scrub(document.getElementById('statement'));

/* 相册 / 微电影：点击直接弹窗浏览；弹窗脚本与照片数据在首次点击时才加载 */
const scripts = {};
const loadScript = src => scripts[src] || (scripts[src] = new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
}));
const FILMS = [{ type: 'video', src: 'media/feet.mp4', title: 'feet', sub: '时·光' }];
function albumItems() {
  const items = [];
  (window.GALLERY_DATA?.chapters || []).forEach(ch => (ch.photos || []).forEach(p => items.push({
    type: 'image',
    src: 'story/' + p.src,
    thumb: 'story/' + p.src.replace(/^images\//, 'thumbs/'),
    title: p.title,
    sub: p.place || '',
    lum: p.lum
  })));
  return items;
}
document.querySelectorAll('[data-lightbox]').forEach(tile => {
  tile.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 允许新标签页打开原页面
    e.preventDefault();
    const kind = tile.dataset.lightbox;
    const deps = kind === 'album' ? [loadScript('story/data.js'), loadScript('story/lightbox.js')] : [loadScript('story/lightbox.js')];
    tile.classList.add('is-loading');
    Promise.all(deps).then(() => {
      tile.classList.remove('is-loading');
      const v = tile.querySelector('video'); if (v) v.pause();
      window.Lightbox.open(kind === 'album' ? albumItems() : FILMS, 0);
    }).catch(() => { location.href = tile.href; });
  });
});

const tileVideo = document.querySelector('.tile video');
if (tileVideo) {
  const tile = tileVideo.closest('.tile');
  tile.addEventListener('pointerenter', () => tileVideo.play().catch(() => {}));
  tile.addEventListener('pointerleave', () => tileVideo.pause());
}

startHero();
