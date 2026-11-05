/* ============================================================
   项目详情页：按 ?id= 从 assets/projects.js 渲染
   ============================================================ */
(function () {
  'use strict';
  var Site = window.Site;
  var list = window.PROJECTS || [];
  var id = new URLSearchParams(location.search).get('id');
  var idx = list.findIndex(function (p) { return p.id === id; });
  if (idx < 0) { location.replace('index.html#work'); return; }
  var p = list[idx];
  var next = list[(idx + 1) % list.length];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // 正文允许 <strong>/<b>，其余转义
  function rich(s) { return esc(s).replace(/&lt;(\/?)(strong|b)&gt;/g, '<$1$2>'); }
  function isVideo(src) { return /\.(mp4|webm|mov)(#.*)?$/i.test(src); }
  function media(src, poster) {
    return isVideo(src)
      ? '<video src="' + esc(src) + '"' + (poster ? ' poster="' + esc(poster) + '"' : '') + ' muted loop playsinline autoplay preload="metadata"></video>'
      : '<img src="' + esc(src) + '" alt="" loading="lazy" />';
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function body(b) {
    if (b.type === 'text') {
      return b.paras.map(function (t) { return '<p class="p-text">' + rich(t) + '</p>'; }).join('');
    }
    if (b.type === 'steps') {
      return '<ol class="p-steps">' + b.items.map(function (it) {
        return '<li><div><h4>' + esc(it.h) + '</h4><p>' + rich(it.p) + '</p></div></li>';
      }).join('') + '</ol>';
    }
    if (b.type === 'metrics') {
      return '<div class="metrics">' + b.items.map(function (m) {
        var ratio = m.from ? Math.max(0, Math.min(1, m.to / m.from)) : 0;
        return '<div class="metric" data-metric data-from="' + m.from + '" data-to="' + m.to + '" data-ratio="' + ratio + '">' +
          '<span class="metric__label mono">' + esc(m.label) + '</span>' +
          '<div class="metric__nums"><span class="metric__from">' + m.from + esc(m.unit) + '</span>' +
          '<span class="metric__to"><span data-num>' + m.from + '</span><small>' + esc(m.unit) + '</small></span></div>' +
          '<div class="metric__bar"><i></i></div>' +
          (m.note ? '<p class="metric__note">' + rich(m.note) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }
    if (b.type === 'figure') {
      return '<figure class="p-figure">' + media(b.src) + (b.caption ? '<figcaption class="mono">' + esc(b.caption) + '</figcaption>' : '') + '</figure>';
    }
    if (b.type === 'compare') {
      return '<div class="compare" data-compare data-cursor="Drag">' + media(b.before) +
        '<div class="compare__after">' + media(b.after) + '</div>' +
        '<span class="compare__handle"></span>' +
        '<span class="compare__tag compare__tag--l mono">' + esc(b.beforeLabel || 'Before') + '</span>' +
        '<span class="compare__tag compare__tag--r mono">' + esc(b.afterLabel || 'After') + '</span></div>';
    }
    return '';
  }

  // 与首页相同的结构：(编号) + 标题，正文对齐到标题所在栏
  var secNo = 0;
  function block(b) {
    if (b.type === 'lead') {
      return '<section class="p-sec reveal"><p class="p-lead indent">' + rich(b.text) + '</p></section>';
    }
    secNo++;
    return '<section class="p-sec">' +
      '<div class="section-head section-head--sm mono"><span class="section-head__no">(' + pad(secNo) + ')</span>' +
      '<h2 class="section-head__label split-line" data-in><span>' + esc(b.title) + '</span></h2></div>' +
      '<div class="indent reveal">' + body(b) + '</div></section>';
  }

  document.title = p.title + ' — Jidong Mei';
  var root = document.getElementById('project');
  root.innerHTML =
    '<section class="p-hero">' +
      '<a class="p-hero__back mono ulink" href="index.html#work">← Work</a>' +
      '<div class="section-head mono">' +
        '<span class="section-head__no">(' + pad(idx + 1) + '/' + pad(list.length) + ')</span>' +
        '<h1 class="section-head__label p-hero__title split-line" data-in><span>' + esc(p.title) + '</span></h1>' +
      '</div>' +
      '<div class="indent">' +
        '<p class="p-hero__sub reveal">' + esc(p.summary) + '</p>' +
        (p.live ? '<div class="p-hero__actions reveal"><a class="btn btn--solid" href="' + esc(p.live.href) + '" data-magnet="0.25">' + esc(p.live.label) + ' <span class="btn__arrow">→</span></a></div>' : '') +
        (p.meta ? '<dl class="p-meta">' + p.meta.map(function (m) {
          return '<div class="reveal"><dt class="mono">' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>';
        }).join('') + '</dl>' : '') +
      '</div>' +
    '</section>' +
    '<div class="p-media indent" data-in data-cursor="Pause">' + media(p.cover, p.poster) +
      '<div class="p-media__ctl mono"><span data-state>Playing</span><span class="p-media__time"><i></i></span></div></div>' +
    '<div class="p-body">' + (p.blocks || []).map(block).join('') + '</div>' +
    (next && next !== p ? '<a class="p-next" href="project.html?id=' + encodeURIComponent(next.id) + '" data-cursor="Next">' +
      '<div class="section-head mono"><span class="section-head__no">Next</span>' +
      '<h2 class="section-head__label p-next__title">' + esc(next.title) + '</h2></div>' +
      '<video src="' + esc(next.cover) + '" muted loop playsinline preload="none"></video></a>' : '');

  /* 主视频：点击暂停 / 播放，底部进度 */
  var box = root.querySelector('.p-media');
  var v = box.querySelector('video');
  if (v) {
    var state = box.querySelector('[data-state]'), bar = box.querySelector('.p-media__time i');
    box.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', function () { state.textContent = 'Playing'; box.setAttribute('data-cursor', 'Pause'); });
    v.addEventListener('pause', function () { state.textContent = 'Paused'; box.setAttribute('data-cursor', 'Play'); });
    (function loop() {
      if (v.duration) bar.style.transform = 'scaleX(' + (v.currentTime / v.duration) + ')';
      requestAnimationFrame(loop);
    })();
  } else {
    box.querySelector('.p-media__ctl').remove();
  }

  /* 下一个项目：悬停播放 */
  var nx = root.querySelector('.p-next');
  if (nx) {
    var nv = nx.querySelector('video');
    nx.addEventListener('pointerenter', function () { nv.play().catch(function () {}); });
    nx.addEventListener('pointerleave', function () { nv.pause(); });
  }

  /* 指标：进入视口后数字滚动 + 条形收缩 */
  var metrics = root.querySelectorAll('[data-metric]');
  if (metrics.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var m = en.target;
        io.unobserve(m);
        Site.countUp(m.querySelector('[data-num]'), parseFloat(m.dataset.from), parseFloat(m.dataset.to), 1000);
        // 灰轨 = 优化前，橙条从满格收缩到优化后的比例
        var bar = m.querySelector('.metric__bar i');
        bar.style.transition = 'none';
        bar.style.width = '100%';
        bar.getBoundingClientRect();
        bar.style.transition = '';
        bar.style.width = (parseFloat(m.dataset.ratio) * 100) + '%';
      });
    }, { threshold: 0.4 });
    metrics.forEach(function (m) { io.observe(m); });
  }

  /* 对比滑块 */
  root.querySelectorAll('[data-compare]').forEach(function (c) {
    var vids = c.querySelectorAll('video');
    function set(x) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--x', Math.max(0, Math.min(100, (x - r.left) / r.width * 100)) + '%');
    }
    var down = false;
    c.addEventListener('pointerdown', function (e) { down = true; c.setPointerCapture(e.pointerId); set(e.clientX); });
    c.addEventListener('pointermove', function (e) { if (down || e.pointerType === 'mouse') set(e.clientX); });
    c.addEventListener('pointerup', function () { down = false; });
    if (vids.length === 2) vids[1].addEventListener('timeupdate', function () {
      if (Math.abs(vids[0].currentTime - vids[1].currentTime) > 0.08) vids[0].currentTime = vids[1].currentTime;
    });
  });
})();
