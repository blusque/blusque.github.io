/* ============================================================
   Lightbox —— 照片 / 微电影弹窗（首次点击时才加载本文件）
   Lightbox.open(items, index, { onClose })
   item: { type: 'image' | 'video', src, thumb?, title, sub?, lum? }
   · 图片先显示缩略图，原图加载完成后无缝替换
   · 左右键 / 按钮 / 滑动切换；Esc 或点击空白关闭
   ============================================================ */
(function () {
  'use strict';
  if (window.Lightbox) return;

  var CSS = [
    '.lb{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;',
    'background:rgba(6,7,11,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);',
    'opacity:0;visibility:hidden;transition:opacity .35s cubic-bezier(.16,1,.3,1),visibility .35s;',
    'font-family:"Inter Tight","PingFang SC","Noto Sans SC",system-ui,sans-serif;color:#e9ebf1}',
    '.lb.is-open{opacity:1;visibility:visible}',
    '.lb__bar{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;',
    'padding:calc(1.3rem + env(safe-area-inset-top,0px)) clamp(24px,6vw,112px) 1rem;',
    'font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase}',
    '.lb__count{color:rgba(233,235,241,.5)}.lb__count b{font-weight:400;color:#3a5bd0}',
    '.lb__close{border:0;background:none;color:inherit;font:inherit;letter-spacing:inherit;text-transform:inherit;',
    'cursor:pointer;display:inline-flex;gap:.7rem;align-items:center;padding:.4rem 0;margin-left:auto;outline:none;transition:color .2s}',
    '.lb__close:focus-visible{color:#3a5bd0}.lb:focus{outline:none}',
    '.lb__close i{font-style:normal;font-size:1.1rem;line-height:1;transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    '.lb__close:hover{color:#3a5bd0}.lb__close:hover i{transform:rotate(90deg)}',
    '.lb__stage{position:relative;width:100%;height:100%;display:grid;place-items:center}',
    '.lb__fig{grid-area:1/1;position:relative;margin:0;line-height:0;',
    'transition:opacity .45s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1)}',
    '.lb__fig.is-enter{opacity:0;transform:translateX(calc(var(--dir,1) * 48px)) scale(.985)}',
    '.lb__fig.is-leave{opacity:0;transform:translateX(calc(var(--dir,1) * -48px)) scale(.985);pointer-events:none}',
    '.lb__media{display:block;max-width:min(calc(100vw - 2 * clamp(56px,9vw,160px)),1680px);',
    'max-height:calc(100svh - 9rem);width:auto;height:auto;background:#000;box-shadow:0 40px 120px rgba(0,0,0,.6)}',
    'video.lb__media{cursor:pointer;height:calc(100svh - 9rem)}',
    /* 标题：黑底白字粗体，右侧多留约两个字宽；副标题无底色，随画面明暗切换黑 / 白 */
    '.lb__cap{position:absolute;left:clamp(14px,1.6vw,24px);bottom:clamp(14px,1.6vw,24px);display:flex;flex-direction:column;',
    'align-items:flex-start;gap:.55rem;line-height:1;transition:opacity .4s}',
    '.lb__title{background:#08090d;color:#fff;font-size:clamp(1.3rem,2.1vw,1.85rem);font-weight:700;letter-spacing:-.02em;',
    'padding:.5em 2.4em .45em .6em}',
    '.lb__sub{font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:.72rem;letter-spacing:.08em;',
    'color:#08090d;text-shadow:0 0 12px rgba(255,255,255,.35);transition:color .3s}',
    '.lb__sub:empty{display:none}',
    '.lb__fig.is-dark .lb__sub{color:#fff;text-shadow:0 1px 10px rgba(0,0,0,.45)}',
    '.lb__fig.is-playing .lb__cap{opacity:.0}.lb__fig.is-playing:hover .lb__cap{opacity:1}',
    '.lb__progress{position:absolute;left:0;right:0;top:0;height:2px;background:rgba(255,255,255,.12)}',
    '.lb__progress span{display:block;height:100%;width:0;background:#3a5bd0}',
    '.lb__load{position:absolute;right:0;bottom:0;width:0;height:2px;background:#3a5bd0;transition:width .3s,opacity .3s}',
    '.lb__fig.is-loading .lb__load{width:30%;animation:lbLoad 1s cubic-bezier(.65,0,.35,1) infinite}',
    '@keyframes lbLoad{from{right:100%;width:0}50%{width:40%}to{right:0;width:0}}',
    '.lb__nav{position:absolute;top:50%;z-index:2;width:clamp(44px,5vw,64px);height:clamp(44px,5vw,64px);margin-top:calc(clamp(44px,5vw,64px) / -2);',
    'border:1px solid rgba(233,235,241,.24);background:rgba(8,9,13,.4);color:#e9ebf1;cursor:pointer;font-size:1.1rem;',
    'transition:border-color .2s,color .2s,background .2s}',
    '.lb__nav:hover{border-color:#3a5bd0;background:#3a5bd0;color:#fff}',
    '.lb__nav--prev{left:clamp(8px,2.4vw,40px)}.lb__nav--next{right:clamp(8px,2.4vw,40px)}',
    '.lb.is-single .lb__nav,.lb.is-single .lb__count{display:none}',
    '@media (max-width:720px){.lb__nav{top:auto;bottom:calc(1.2rem + env(safe-area-inset-bottom,0px));margin:0}',
    '.lb__media{max-width:100vw;max-height:calc(100svh - 10rem)}}',
    '@media (prefers-reduced-motion:reduce){.lb,.lb__fig{transition:none}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.className = 'lb';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.tabIndex = -1;
  root.innerHTML =
    '<div class="lb__bar"><span class="lb__count"></span>' +
    '<button class="lb__close" type="button">Close <i aria-hidden="true">×</i></button></div>' +
    '<button class="lb__nav lb__nav--prev" type="button" aria-label="上一张">←</button>' +
    '<div class="lb__stage"></div>' +
    '<button class="lb__nav lb__nav--next" type="button" aria-label="下一张">→</button>';
  document.body.appendChild(root);

  var stage = root.querySelector('.lb__stage');
  var count = root.querySelector('.lb__count');
  var items = [], idx = 0, cur = null, opts = {}, lastFocus = null;
  var fullCache = {};

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function loadFull(src) {
    if (!fullCache[src]) {
      fullCache[src] = new Promise(function (res) {
        var im = new Image();
        im.decoding = 'async';
        im.onload = function () { res(src); };
        im.onerror = function () { res(null); };
        im.src = src;
      });
    }
    return fullCache[src];
  }

  /* 画面左下角 35% × 25% 区域的平均亮度（0~255）；取不到像素时返回 null */
  var probe = document.createElement('canvas');
  probe.width = 24; probe.height = 24;
  function cornerLum(el) {
    try {
      var w = el.videoWidth || el.naturalWidth, h = el.videoHeight || el.naturalHeight;
      if (!w || !h) return null;
      var ctx = probe.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(el, 0, h * 0.75, w * 0.35, h * 0.25, 0, 0, 24, 24);
      var d = ctx.getImageData(0, 0, 24, 24).data, sum = 0;
      for (var i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      return sum / (d.length / 4);
    } catch (e) { return null; }
  }

  function build(item) {
    var fig = document.createElement('figure');
    fig.className = 'lb__fig';
    var media;
    if (item.type === 'video') {
      media = document.createElement('video');
      media.src = item.src;
      media.playsInline = true;
      media.autoplay = true;
      media.preload = 'auto';
      if (item.poster) media.poster = item.poster;
      var prog = document.createElement('span');
      prog.className = 'lb__progress';
      prog.innerHTML = '<span></span>';
      var bar = prog.firstChild;
      media.addEventListener('click', function (e) {
        e.stopPropagation();
        if (media.paused) media.play(); else media.pause();
      });
      media.addEventListener('play', function () { fig.classList.add('is-playing'); });
      media.addEventListener('pause', function () { fig.classList.remove('is-playing'); });
      media.addEventListener('timeupdate', function () {
        if (media.duration) bar.style.width = (media.currentTime / media.duration * 100) + '%';
      });
      fig.appendChild(media);
      fig.appendChild(prog);
    } else {
      media = document.createElement('img');
      media.alt = item.title || '';
      media.decoding = 'async';
      media.src = item.thumb || item.src;
      fig.appendChild(media);
      if (item.thumb && item.thumb !== item.src) {
        fig.classList.add('is-loading');
        loadFull(item.src).then(function (ok) {
          fig.classList.remove('is-loading');
          if (ok) media.src = ok;
        });
      }
    }
    media.className = 'lb__media';
    var load = document.createElement('span');
    load.className = 'lb__load';
    fig.appendChild(load);
    var cap = document.createElement('figcaption');
    cap.className = 'lb__cap';
    var t = document.createElement('span'); t.className = 'lb__title'; t.textContent = item.title || '';
    var sb = document.createElement('span'); sb.className = 'lb__sub'; sb.textContent = item.sub || '';
    if (item.title) cap.appendChild(t);
    cap.appendChild(sb);
    fig.appendChild(cap);

    // 标题配色：先用数据里的整体亮度兜底，再按画面左下角（标题所在处）实际亮度修正
    if (typeof item.lum === 'number') fig.classList.toggle('is-dark', item.lum < 122);
    var sample = function () {
      var l = cornerLum(media);
      if (l !== null) fig.classList.toggle('is-dark', l < 128);
    };
    if (item.type === 'video') media.addEventListener('loadeddata', sample, { once: true });
    else if (media.complete && media.naturalWidth) sample();
    else media.addEventListener('load', sample, { once: true });
    fig.addEventListener('click', function (e) { e.stopPropagation(); });
    return fig;
  }

  function show(i, dir) {
    var n = items.length;
    idx = (i + n) % n;
    count.innerHTML = '<b>' + pad(idx + 1) + '</b> / ' + pad(n);

    var old = cur;
    if (old) {
      old.style.setProperty('--dir', dir);
      old.classList.add('is-leave');
      var v = old.querySelector('video'); if (v) v.pause();
      setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 560);
    }
    cur = build(items[idx]);
    cur.style.setProperty('--dir', dir || 1);
    if (dir) cur.classList.add('is-enter');
    stage.appendChild(cur);
    if (dir) { void cur.offsetWidth; cur.classList.remove('is-enter'); }

    // 预取相邻原图
    [idx + 1, idx - 1].forEach(function (j) {
      var it = items[(j + n) % n];
      if (it && it.type !== 'video') loadFull(it.src);
    });
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && items.length > 1) show(idx + 1, 1);
    else if (e.key === 'ArrowLeft' && items.length > 1) show(idx - 1, -1);
    else if (e.key === 'Tab') return;
    else { e.stopPropagation(); return; }
    e.preventDefault();
    e.stopPropagation();
  }

  // 触摸滑动
  var sx = 0, sy = 0;
  root.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  root.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (items.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  }, { passive: true });
  // 弹窗打开时拦截滚轮，避免底层页面翻动
  root.addEventListener('wheel', function (e) { e.preventDefault(); e.stopPropagation(); }, { passive: false });

  root.querySelector('.lb__close').addEventListener('click', close);
  root.querySelector('.lb__nav--prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1, -1); });
  root.querySelector('.lb__nav--next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1, 1); });
  stage.addEventListener('click', close);

  function open(list, i, o) {
    items = list || [];
    if (!items.length) return;
    opts = o || {};
    lastFocus = document.activeElement;
    root.classList.toggle('is-single', items.length < 2);
    stage.innerHTML = '';
    cur = null;
    show(i || 0, 0);
    document.documentElement.style.overflow = 'hidden';
    if (window.Site && window.Site.lenis) window.Site.lenis.stop();
    root.classList.add('is-open');
    window.addEventListener('keydown', onKey, true);
    root.focus({ preventScroll: true });
  }

  function close() {
    if (!root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    window.removeEventListener('keydown', onKey, true);
    document.documentElement.style.overflow = '';
    if (window.Site && window.Site.lenis) window.Site.lenis.start();
    var v = stage.querySelector('video'); if (v) v.pause();
    setTimeout(function () { if (!root.classList.contains('is-open')) { stage.innerHTML = ''; cur = null; } }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (opts.onClose) opts.onClose();
  }

  window.Lightbox = { open: open, close: close };
})();
