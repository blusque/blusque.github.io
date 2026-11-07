/* ============================================================
   故事 · STORY —— 动态渲染 + 主色调/画幅自适应
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.GALLERY_DATA;
  if (!DATA) return;

  var story = document.getElementById('story');
  var chapterNav = document.getElementById('chapterNav');
  var cover = document.getElementById('cover');
  var coverHandle = document.getElementById('coverHandle');
  var coverHint = document.getElementById('coverHint');
  var scrollProgressBar = document.getElementById('scrollProgressBar');
  var topbar = document.getElementById('topbar');
  var coverUnlocked = false;

  /* ---------------- 颜色工具 ---------------- */
  function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return clamp255(v).toString(16).padStart(2, '0');
    }).join('');
  }

  function mixRgb(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function lumOf(rgb) {
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  /* ---------------- 简易 k-means 取主色 ---------------- */
  function kmeans(points, k, iters) {
    var n = points.length;
    if (!n) return [];
    var centroids = [];
    var step = Math.max(1, Math.floor(n / k));
    for (var i = 0; i < k; i++) centroids.push(points[Math.min(n - 1, i * step)].slice());

    var labels = new Array(n);
    for (var it = 0; it < iters; it++) {
      for (var p = 0; p < n; p++) {
        var pt = points[p], best = 0, bd = Infinity;
        for (var c = 0; c < k; c++) {
          var q = centroids[c];
          var d = (pt[0] - q[0]) * (pt[0] - q[0]) +
                  (pt[1] - q[1]) * (pt[1] - q[1]) +
                  (pt[2] - q[2]) * (pt[2] - q[2]);
          if (d < bd) { bd = d; best = c; }
        }
        labels[p] = best;
      }
      var sums = [];
      for (var s = 0; s < k; s++) sums.push([0, 0, 0, 0]);
      for (var j = 0; j < n; j++) {
        var pp = points[j], cc = labels[j];
        sums[cc][0] += pp[0]; sums[cc][1] += pp[1]; sums[cc][2] += pp[2]; sums[cc][3]++;
      }
      for (var u = 0; u < k; u++) {
        if (sums[u][3] > 0) centroids[u] = [sums[u][0] / sums[u][3], sums[u][1] / sums[u][3], sums[u][2] / sums[u][3]];
      }
    }

    var clusters = [];
    for (var w = 0; w < k; w++) clusters.push({ count: 0, rgb: [0, 0, 0] });
    for (var m = 0; m < n; m++) {
      var mc = labels[m], mp = points[m];
      clusters[mc].count++;
      clusters[mc].rgb[0] += mp[0]; clusters[mc].rgb[1] += mp[1]; clusters[mc].rgb[2] += mp[2];
    }
    for (var v = 0; v < k; v++) {
      if (clusters[v].count) {
        clusters[v].rgb = clusters[v].rgb.map(function (x) { return x / clusters[v].count; });
      }
    }
    return clusters;
  }

  /* 从聚类里挑出一个既有代表性、又带颜色的“主色调” */
  function pickAccent(clusters) {
    var best = null, bestScore = -1;
    for (var i = 0; i < clusters.length; i++) {
      var cl = clusters[i];
      if (!cl.count) continue;
      var r = cl.rgb[0], g = cl.rgb[1], b = cl.rgb[2];
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      var sat = mx === 0 ? 0 : (mx - mn) / mx;
      var lum = lumOf(cl.rgb);
      var weight = cl.count;
      if (lum < 22 || lum > 235 || sat < 0.05) weight *= 0.25; // 太黑/太白/太灰的簇降权
      var score = weight * (0.4 + sat);
      if (score > bestScore) { bestScore = score; best = cl; }
    }
    return best ? { rgb: best.rgb.map(Math.round), lum: lumOf(best.rgb) } : null;
  }

  /* 读图取色（file:// 下可能因跨域被污染而抛错，此时返回 null 走兜底） */
  function extractColor(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        try {
          var max = 56;
          var scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          var cw = Math.max(1, Math.round(img.naturalWidth * scale));
          var ch = Math.max(1, Math.round(img.naturalHeight * scale));
          var cv = document.createElement('canvas');
          cv.width = cw; cv.height = ch;
          var ctx = cv.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, cw, ch);
          var data = ctx.getImageData(0, 0, cw, ch).data;
          var pts = [];
          for (var i = 0; i < data.length; i += 4) pts.push([data[i], data[i + 1], data[i + 2]]);
          var clusters = kmeans(pts, 4, 5);
          var accent = pickAccent(clusters);
          var lsum = 0;
          for (var j = 0; j < pts.length; j++) lsum += lumOf(pts[j]);
          var lum = lsum / pts.length;
          resolve({ accent: accent ? accent.rgb : null, lum: lum });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  /* 依据主色 + 亮度，写入每页背景与文字颜色变量 */
  function applyTone(el, accent, lum) {
    var dark = lum < 122;
    var base = dark ? [8, 8, 10] : [246, 246, 248];
    var tint = mixRgb(base, accent, 0.55);
    el.style.setProperty('--base', rgbToHex(base[0], base[1], base[2]));
    el.style.setProperty('--tint', rgbToHex(tint[0], tint[1], tint[2]));
    el.style.setProperty('--ink', dark ? '#f5f5f6' : '#141416');
    el.style.setProperty('--ink-soft', dark ? 'rgba(245,245,246,0.55)' : 'rgba(20,20,22,0.5)');
    el.setAttribute('data-tone', dark ? 'dark' : 'light');
  }

  /* ---------------- 渲染 ---------------- */
  var totalPhotos = DATA.chapters.reduce(function (s, c) { return s + c.photos.length; }, 0);
  var photoIndex = 0;

  function chapterTone(chapter) {
    // 章节引言页背景 = 本章照片主色的平均；视频章无照片，用中性深色
    if (!chapter.photos || !chapter.photos.length) {
      return { accent: [64, 64, 68], lum: 88 };
    }
    var rs = 0, gs = 0, bs = 0, n = 0;
    chapter.photos.forEach(function (p) {
      var rgb = hexToRgb(p.accent);
      rs += rgb[0]; gs += rgb[1]; bs += rgb[2]; n++;
    });
    var avg = [rs / n, gs / n, bs / n];
    var lum = chapter.photos.reduce(function (s, p) { return s + p.lum; }, 0) / n;
    return { accent: avg, lum: lum };
  }

  function renderChapterIntro(chapter) {
    var sec = document.createElement('section');
    sec.className = 'page chapter-intro';
    sec.id = 'ch-' + chapter.id;
    sec.dataset.chapter = chapter.id;

    sec.innerHTML =
      '<p class="chapter__label reveal">' + escapeHtml(chapter.labelEn) + '</p>' +
      '<span class="chapter__no reveal">' + escapeHtml(chapter.no) + '</span>' +
      '<h2 class="chapter__title reveal">' + escapeHtml(chapter.title) + '</h2>' +
      '<span class="chapter__title-en reveal">' + escapeHtml(chapter.titleEn) + '</span>' +
      '<div class="chapter__rule reveal"></div>' +
      '<p class="chapter__intro reveal">' + escapeHtml(chapter.intro) + '</p>';

    var tone = chapterTone(chapter);
    applyTone(sec, tone.accent, tone.lum);
    story.appendChild(sec);

    var btn = document.createElement('button');
    btn.textContent = chapter.short || chapter.no;
    btn.setAttribute('aria-label', chapter.title);
    btn.addEventListener('click', function () { scrollToEl(sec); });
    chapterNav.appendChild(btn);
    return sec;
  }

  function renderPhoto(chapter, photo) {
    photoIndex++;
    var idx = photoIndex;
    var fig = document.createElement('figure');
    fig.className = 'page photo';
    if (idx % 2 === 0) fig.classList.add('photo--right');
    if (photo.w && photo.h && photo.h > photo.w) fig.classList.add('photo--tall');

    var img = document.createElement('img');
    img.className = 'photo__img reveal-img';
    img.src = photo.src;
    img.alt = photo.title + ' — ' + photo.story;
    img.loading = 'lazy';
    img.decoding = 'async';

    if (photo.w && photo.h) { img.width = photo.w; img.height = photo.h; }

    var media = document.createElement('div');
    media.className = 'photo__media';
    media.appendChild(img);

    var body = document.createElement('div');
    body.className = 'photo__body reveal';
    body.innerHTML =
      '<span class="photo__idx">' + pad(idx) + ' · ' + pad(totalPhotos) + '</span>' +
      '<h3 class="photo__title">' + escapeHtml(photo.title) + '</h3>' +
      '<div class="photo__rule"></div>' +
      '<p class="photo__story">' + escapeHtml(photo.story) + '</p>' +
      '<p class="photo__place">' + escapeHtml(photo.place || '') + '</p>';

    fig.appendChild(media);
    fig.appendChild(body);

    // 先用兜底色即时渲染
    applyTone(fig, hexToRgb(photo.accent), photo.lum);
    story.appendChild(fig);

    // 再异步取真实主色，成功后平滑更新背景
    extractColor(photo.src).then(function (res) {
      if (!res) return;
      var accent = res.accent || hexToRgb(photo.accent);
      applyTone(fig, accent, res.lum);
    });

    return fig;
  }

  function renderVideo(chapter) {
    var v = chapter.video;
    var fig = document.createElement('figure');
    fig.className = 'page video';

    var video = document.createElement('video');
    video.className = 'video__player reveal-img';
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;

    var src = document.createElement('source');
    src.src = v.src;
    src.type = 'video/mp4';
    video.appendChild(src);

    var media = document.createElement('div');
    media.className = 'video__media';
    media.appendChild(video);

    var body = document.createElement('div');
    body.className = 'video__body reveal';
    var html =
      '<span class="video__label">' + escapeHtml(chapter.no) + '</span>' +
      '<h3 class="video__title">' + escapeHtml(v.title || '') + '</h3>';
    if (v.caption) html += '<p class="video__caption">' + escapeHtml(v.caption) + '</p>';
    if (v.place) html += '<p class="video__place">' + escapeHtml(v.place) + '</p>';
    body.innerHTML = html;

    fig.appendChild(media);
    fig.appendChild(body);

    applyTone(fig, [60, 60, 64], 84);
    story.appendChild(fig);
    return fig;
  }

  function renderEnd() {
    var sec = document.createElement('section');
    sec.className = 'page end';
    sec.id = 'end';
    sec.innerHTML =
      '<p class="end__mark reveal">' + escapeHtml(DATA.end.mark) + '</p>' +
      '<p class="end__line reveal">' + escapeHtml(DATA.end.line) + '</p>' +
      '<button class="end__back reveal" id="backToCover">' +
        escapeHtml(DATA.end.back) +
        '<span class="end__back-en">' + escapeHtml(DATA.end.backEn) + '</span>' +
      '</button>';
    applyTone(sec, [10, 10, 12], 60);
    story.appendChild(sec);
    sec.querySelector('#backToCover').addEventListener('click', backToCover);
    return sec;
  }

  function build() {
    var pageEls = [];
    DATA.chapters.forEach(function (chapter) {
      var intro = renderChapterIntro(chapter);
      pageEls.push(intro);
      if (chapter.video) {
        pageEls.push(renderVideo(chapter));
      } else {
        chapter.photos.forEach(function (photo) {
          pageEls.push(renderPhoto(chapter, photo));
        });
      }
    });
    pageEls.push(renderEnd());
    observePages(pageEls);
  }

  /* ---------------- 辅助 ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function scrollToEl(el) { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------------- 视口观察：入场动画 + 章节高亮 + 进度 ---------------- */
  function observePages(pages) {
    var chapterEls = Array.prototype.slice.call(document.querySelectorAll('.chapter-intro'));

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in-view');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
      pages.forEach(function (p) { io.observe(p); });

      var chapterIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActiveChapter(en.target.dataset.chapter);
        });
      }, { threshold: 0.5 });
      chapterEls.forEach(function (c) { chapterIO.observe(c); });

      // 依据顶部的当前页，切换顶栏明暗色
      var toneIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setTopbarInk(en.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -82% 0px' });
      pages.forEach(function (p) { toneIO.observe(p); });
    } else {
      pages.forEach(function (p) { p.classList.add('in-view'); });
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  function setActiveChapter(id) {
    var btns = chapterNav.querySelectorAll('button');
    var i = 0;
    DATA.chapters.forEach(function (c, idx) {
      if (c.id === id) i = idx;
    });
    btns.forEach(function (b, idx) { b.classList.toggle('active', idx === i); });
  }

  /* 让顶栏与进度条的文字颜色跟随当前页明暗（黑/白） */
  function setTopbarInk(pageEl) {
    var ink = pageEl.style.getPropertyValue('--ink') || '#f5f5f6';
    topbar.style.color = ink;
    if (scrollProgressBar.parentElement) scrollProgressBar.parentElement.style.color = ink;
  }

  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    scrollProgressBar.style.width = pct + '%';
  }

  /* ---------------- 封面：上拉解锁 ---------------- */
  function initCover() {
    var dragging = false;
    var startY = 0;
    var curY = 0;

    function threshold() { return Math.min(140, window.innerHeight * 0.28); }

    function unlock() {
      if (coverUnlocked) return;
      coverUnlocked = true;
      cover.classList.remove('dragging');
      cover.style.transform = 'translateY(-101%)'; // 用内联值驱动过渡，避免与拖拽残留冲突
      cover.classList.add('unlocked');
      document.body.classList.remove('locked');
      document.body.classList.add('unlocked');
      coverHint.classList.remove('show');
    }

    function setDrag(y) {
      curY = y;
      cover.style.transform = 'translateY(' + (-curY) + 'px)';
      coverHint.classList.toggle('show', curY > 24);
      if (curY > threshold()) coverHint.textContent = '松开';
      else coverHint.textContent = '继续向上';
    }

    coverHandle.addEventListener('pointerdown', function (e) {
      if (coverUnlocked) return;
      dragging = true;
      startY = e.clientY;
      cover.classList.add('dragging');
      e.preventDefault();
    });

    window.addEventListener('pointermove', function (e) {
      if (!dragging || coverUnlocked) return;
      var dy = e.clientY - startY;
      setDrag(Math.max(0, -dy));
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      cover.classList.remove('dragging');
      if (curY > threshold()) {
        unlock();
      } else {
        cover.style.transform = '';
        coverHint.classList.remove('show');
      }
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // 滚轮向上 / 键盘 / 点击 兜底解锁
    window.addEventListener('wheel', function (e) {
      if (coverUnlocked) return;
      if (e.deltaY < 0) unlock();
    }, { passive: true });

    window.addEventListener('keydown', function (e) {
      if (coverUnlocked) return;
      if (e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        unlock();
      }
    });

    coverHandle.addEventListener('click', function () { if (!coverUnlocked) unlock(); });
    coverHandle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); unlock(); }
    });
  }

  function backToCover() {
    coverUnlocked = false;
    cover.classList.remove('unlocked');
    cover.style.transform = '';
    coverHint.classList.remove('show');
    document.body.classList.add('locked');
    document.body.classList.remove('unlocked');
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 30);
  }

  /* ---------------- 启动 ---------------- */
  build();
  initCover();
})();
