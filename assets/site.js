/* ============================================================
   站点共享交互：平滑滚动 / 整页翻页 · 导航 · 入场 · 光标 · 磁吸 · 逐字高亮 · 时钟
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var Site = window.Site = { reduce: reduce, fine: fine, lenis: null, onScroll: [], onPage: [] };

  // body[data-paged] 且为桌面指针设备时启用整页翻页；手机保持自然滚动
  Site.paged = document.body.hasAttribute('data-paged') && fine && window.innerWidth > 900;
  if (Site.paged) document.documentElement.classList.add('is-paged');

  /* ---------- 平滑滚动（Lenis，非翻页页面） ---------- */
  function raf(t) {
    if (Site.lenis) Site.lenis.raf(t);
    requestAnimationFrame(raf);
  }
  if (!reduce && !Site.paged && window.Lenis) {
    Site.lenis = new window.Lenis({ duration: 0.85, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    requestAnimationFrame(raf);
  }

  Site.scrollTo = function (target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    if (Site.paged && Site.goTo) Site.goTo(el);
    else if (Site.lenis) Site.lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    Site.scrollTo(el);
  });

  /* ---------- 导航：下滑隐藏 / 上滑出现 ---------- */
  var nav = document.querySelector('.nav');
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (nav && !Site.paged) nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6);
    lastY = y;
    for (var i = 0; i < Site.onScroll.length; i++) Site.onScroll[i](y);
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 整页翻页 ---------- */
  if (Site.paged) (function () {
    var pages = Array.prototype.slice.call(document.querySelectorAll('[data-page]'));
    if (!pages.length) return;
    var pager = document.getElementById('pager');
    var busy = false, anim = 0, lastWheel = 0, lastDelta = 0, current = -1;
    var DUR = reduce ? 0 : 950;

    function topOf(el) { return el.getBoundingClientRect().top + window.scrollY; }
    function vh() { return window.innerHeight; }
    function indexAt(y) {
      var i = 0;
      for (var k = 0; k < pages.length; k++) if (topOf(pages[k]) <= y + 2) i = k;
      return i;
    }
    var ease = function (t) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2; };

    function tween(y) {
      var from = window.scrollY, to = Math.max(0, Math.min(y, document.documentElement.scrollHeight - vh()));
      cancelAnimationFrame(anim);
      if (Math.abs(to - from) < 1) return;
      busy = true;
      if (!DUR) { window.scrollTo(0, to); busy = false; return; }
      var t0 = performance.now();
      (function step(t) {
        var k = Math.min(1, (t - t0) / DUR);
        window.scrollTo(0, from + (to - from) * ease(k));
        if (k < 1) anim = requestAnimationFrame(step);
        else setTimeout(function () {
          if (Math.abs(window.scrollY - to) > 1) window.scrollTo(0, to); // 防止布局变化把位置挪走
          busy = false;
        }, 120);
      })(t0);
    }

    // 超过一屏的页：先在页内滚动，到底后再翻页
    function step(dir) {
      var y = window.scrollY, i = indexAt(y), p = pages[i];
      var top = topOf(p), bottom = top + p.offsetHeight;
      if (dir > 0) {
        if (bottom > y + vh() + 2) return tween(Math.min(y + vh() * 0.8, bottom - vh()));
        if (i < pages.length - 1) return tween(topOf(pages[i + 1]));
      } else {
        if (y > top + 2) return tween(Math.max(y - vh() * 0.8, top));
        if (i > 0) {
          var q = pages[i - 1], qt = topOf(q);
          return tween(Math.max(qt, qt + q.offsetHeight - vh()));
        }
      }
    }
    Site.goTo = function (el) {
      var p = el.closest('[data-page]') || el;
      tween(topOf(p));
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; // 触控板缩放
      e.preventDefault();
      var now = performance.now(), d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : 0;
      var ad = Math.abs(d);
      // 吞掉触控板惯性：同一手势内的衰减事件不再触发翻页
      var sameGesture = now - lastWheel < 180 && ad <= lastDelta * 1.2;
      lastWheel = now; lastDelta = ad;
      if (busy || sameGesture || ad < 4) return;
      step(d > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      var k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); if (!busy) step(1); }
      else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); if (!busy) step(-1); }
      else if (k === 'Home') { e.preventDefault(); tween(0); }
      else if (k === 'End') { e.preventDefault(); tween(topOf(pages[pages.length - 1])); }
    });

    window.addEventListener('resize', function () {
      if (busy) return;
      window.scrollTo(0, topOf(pages[indexAt(window.scrollY + vh() * 0.3)]));
    });

    // 页码指示
    if (pager) {
      pager.innerHTML = pages.map(function (p, i) {
        // 编号与区块标题一致：Hero 为 00
        return '<button type="button" class="pager__tick" aria-label="第 ' + (i + 1) + ' 页"><i></i><span>' + (i < 10 ? '0' : '') + i + '</span></button>';
      }).join('');
      Array.prototype.forEach.call(pager.children, function (b, i) {
        b.addEventListener('click', function () { tween(topOf(pages[i])); });
      });
    }

    // 页面进出：内容随位置位移 + 淡出，形成翻页感；记录当前页
    function paint() {
      var h = vh();
      for (var i = 0; i < pages.length; i++) {
        var r = pages[i].getBoundingClientRect();
        var rel = r.top > 0 ? r.top / h : (r.bottom < h ? (r.bottom - h) / h : 0);
        rel = Math.max(-1, Math.min(1, rel));
        pages[i].style.setProperty('--p', rel.toFixed(4));
        pages[i].style.setProperty('--o', (1 - Math.min(1, Math.abs(rel) * 1.25)).toFixed(4));
      }
      var c = indexAt(window.scrollY + h * 0.5);
      if (c !== current) {
        current = c;
        pages.forEach(function (p, i) { p.classList.toggle('is-current', i === c); });
        if (pager) Array.prototype.forEach.call(pager.children, function (b, i) { b.classList.toggle('is-active', i === c); });
        for (var j = 0; j < Site.onPage.length; j++) Site.onPage[j](c, pages[c]);
      }
    }
    Site.onScroll.push(paint);
    window.addEventListener('resize', paint);
    paint();
  })();

  /* ---------- 入场：.reveal / [data-in] 进入视口时加 .is-in ---------- */
  Site.observe = function (root) {
    var els = (root || document).querySelectorAll('.reveal, [data-in]');
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  };

  /* ---------- 按词 / 汉字拆分，滚动时逐个点亮 ---------- */
  Site.scrub = function (el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var words = [];
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      (n.nodeValue.match(/[㐀-鿿　-〿＀-￯]|[^\s㐀-鿿　-〿＀-￯]+|\s+/g) || []).forEach(function (tok) {
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
        var s = document.createElement('span');
        s.className = 'w'; s.textContent = tok;
        frag.appendChild(s); words.push(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    function update() {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
      var n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
    }
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    if (Site.paged) {
      var page = el.closest('[data-page]'), timer = 0;
      var run = function (i, p) {
        clearInterval(timer);
        if (p !== page) return;
        var n = 0;
        timer = setInterval(function () {
          if (n < words.length) words[n++].classList.add('on'); else clearInterval(timer);
        }, Math.max(12, 900 / words.length));
      };
      Site.onPage.push(run);
      if (page && page.classList.contains('is-current')) run(0, page);
      return;
    }
    Site.onScroll.push(update);
    update();
  };

  /* ---------- part 标题：每个单词首字母包一层 .initial（着主题蓝） ---------- */
  Site.capWords = function (root) {
    (root || document).querySelectorAll('.section-head__label:not(.p-hero__title):not(.p-next__title)').forEach(function (h) {
      if (h.querySelector('.initial')) return;
      var walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(function (n) {
        var frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          var c = document.createElement('span');
          c.className = 'initial';
          c.textContent = tok.charAt(0);
          frag.appendChild(c);
          if (tok.length > 1) frag.appendChild(document.createTextNode(tok.slice(1)));
        });
        n.parentNode.replaceChild(frag, n);
      });
    });
  };

  /* ---------- 香港时间 ---------- */
  var clocks = document.querySelectorAll('[data-clock]');
  function tick() {
    var t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Hong_Kong', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clocks.forEach(function (c) { c.textContent = t + ' HKT'; });
  }
  if (clocks.length) { tick(); setInterval(tick, 1000); }

  /* ---------- 自定义光标 + 磁吸 ---------- */
  if (fine && !reduce) {
    document.documentElement.classList.add('has-cursor');
    var cur = document.createElement('div');
    cur.className = 'cursor is-hidden';
    cur.innerHTML = '<div class="cursor__dot"></div><div class="cursor__label"></div>';
    document.body.appendChild(cur);
    var label = cur.querySelector('.cursor__label');
    var mx = -100, my = -100, cx = mx, cy = my;

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      cur.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.add('is-hidden'); });

    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor], a, button');
      var text = t && t.getAttribute('data-cursor');
      cur.classList.toggle('has-label', !!text);
      cur.classList.toggle('is-link', !!t && !text);
      if (text) label.textContent = text;
    });

    (function loop() {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();

    Site.magnet = function (root) {
      (root || document).querySelectorAll('[data-magnet]').forEach(function (el) {
        var k = parseFloat(el.getAttribute('data-magnet')) || 0.3;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          el.style.transform = 'translate(' + dx * k + 'px,' + dy * k + 'px)';
        });
        el.addEventListener('pointerleave', function () {
          el.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
          el.style.transform = '';
          setTimeout(function () { el.style.transition = ''; }, 500);
        });
      });
    };
  } else {
    Site.magnet = function () {};
  }

  /* ---------- 数字滚动 ---------- */
  Site.countUp = function (el, from, to, dur) {
    var dec = (String(to).split('.')[1] || String(from).split('.')[1] || '').length;
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  };

  document.addEventListener('DOMContentLoaded', function () {
    Site.capWords();
    Site.observe();
    Site.magnet();
  });
})();
