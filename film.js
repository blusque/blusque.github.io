/* ============================================================
   微电影页 · 封面解锁 + 主题色 + 点击播放/暂停(收缩/铺开)
   ============================================================ */
(function () {
  'use strict';

  var cover = document.getElementById('cover');
  var coverHandle = document.getElementById('coverHandle');
  var coverHint = document.getElementById('coverHint');
  var film = document.getElementById('film');
  var stage = document.getElementById('filmStage');
  var body = document.body;
  var unlocked = false;

  /* ---------------- 主题色 ---------------- */
  var ACCENT_FALLBACK = [180, 149, 126]; // #B4957E（视频平均色）

  function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { return clamp(v).toString(16).padStart(2, '0'); }).join(''); }

  function applyTone(accent) {
    var base = [8, 8, 10];
    var tint = [
      base[0] + (accent[0] - base[0]) * 0.55,
      base[1] + (accent[1] - base[1]) * 0.55,
      base[2] + (accent[2] - base[2]) * 0.55
    ];
    stage.style.setProperty('--base', hex(base[0], base[1], base[2]));
    stage.style.setProperty('--tint', hex(tint[0], tint[1], tint[2]));
  }

  function extractThemeColor() {
    try {
      var c = document.createElement('canvas');
      c.width = 48; c.height = 48;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(film, 0, 0, 48, 48);
      var d = ctx.getImageData(0, 0, 48, 48).data;
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      applyTone([r / n, g / n, b / n]);
    } catch (e) {
      applyTone(ACCENT_FALLBACK); // file:// 等无法取像素时兜底
    }
  }

  applyTone(ACCENT_FALLBACK);
  film.addEventListener('loadeddata', extractThemeColor);

  /* ---------------- 封面解锁 ---------------- */
  var dragging = false, startY = 0, curY = 0;
  function threshold() { return Math.min(140, window.innerHeight * 0.28); }

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    cover.classList.remove('dragging');
    cover.style.transform = 'translateY(-101%)';
    cover.classList.add('unlocked');
    body.classList.remove('locked');
    body.classList.add('unlocked');
    coverHint.classList.remove('show');
    // 进入页面后自动播放
    var p = film.play();
    if (p && p.then) p.catch(function () { /* 若自动播放被拦截，点击视频仍可播放 */ });
  }

  function setDrag(y) {
    curY = y;
    cover.style.transform = 'translateY(' + (-curY) + 'px)';
    coverHint.classList.toggle('show', curY > 24);
    coverHint.textContent = curY > threshold() ? '松开' : '继续向下';
  }

  coverHandle.addEventListener('pointerdown', function (e) {
    if (unlocked) return;
    dragging = true; startY = e.clientY;
    cover.classList.add('dragging');
    e.preventDefault();
  });
  window.addEventListener('pointermove', function (e) {
    if (!dragging || unlocked) return;
    setDrag(Math.max(0, e.clientY - startY));
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    cover.classList.remove('dragging');
    if (curY > threshold()) unlock();
    else { cover.style.transform = ''; coverHint.classList.remove('show'); }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  window.addEventListener('wheel', function (e) { if (!unlocked && e.deltaY > 0) unlock(); }, { passive: true });
  window.addEventListener('keydown', function (e) {
    if (unlocked) return;
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); unlock(); }
  });
  coverHandle.addEventListener('click', function () { if (!unlocked) unlock(); });

  /* ---------------- 点击暂停/播放 + 收缩/铺开 ---------------- */
  function setPaused(paused) { stage.classList.toggle('paused', paused); }

  film.addEventListener('click', function () {
    if (!unlocked) return;
    if (film.paused) { film.play(); setPaused(false); }
    else { film.pause(); setPaused(true); }
  });
  film.addEventListener('play', function () { setPaused(false); });
  film.addEventListener('pause', function () { if (unlocked) setPaused(true); });
  film.addEventListener('ended', function () { setPaused(true); });
})();
