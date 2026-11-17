/* obu site hero · live orbs v1.2 (17 Nov 2026 · no-lag pass, spec claude/site-live-orb-hero-v1.md)
   Runs the app's real orb engines (assets/orbs-live/<name>.js) on the page through a small DCLogic shim.
   Every 6 s the next orb turns into view: the old one speeds up, shrinks and fades while the new one
   grows in from 1.12 and slows to the idle spin.
   v1.2 (Henry 17 Nov: "no lag from the orb spinning, the transition has a slight lag"):
   - Pool: an engine is built once and kept (paused + hidden) for its next turn. After the first lap there is
     no GL set-up, shader compile or teardown at all, so nothing can stall a swap.
   - Build the next engine early (2 s after a swap, in idle time, split into 2 tasks) instead of 1 s before it.
   - Swap fades/scales run as Web Animations (compositor thread): a busy main thread can't stutter them.
   - Stage glow = two stacked layers cross-fading on opacity (was a 2.4 s background-gradient repaint).
   - Page accent (--acc on :root restyles the whole page) is set after the swap, in idle time.
   - Teardown (when pooling is off) happens after the swap, never mid-fade.
   Guards: < 40 fps for 2 s = stop cycling · reduced motion / no WebGL = one still · paused off-screen / tab hidden. */
(function () {
  var stage = document.querySelector('.hero .orb-stage'), host = document.getElementById('orbcycle'),
      nameEl = document.getElementById('orbname'), hero = document.querySelector('.hero');
  if (!stage || !host) return;
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '') || '../assets/orbs-live/';
  var STILL = BASE + '../orbs/auralith.webp';
  function src(e) { return BASE + e + (e === 'master' ? '.json' : '.js'); }
  /* fit = filled-sphere share of the 560 box (AP_FIT v3.383), up = body centre below the middle; k = .76 / fit.
     Site levelled 16 Nov by measuring each live orb at rest against Auralith (Rasenith is held wound up, so it's wider than its app still). */
  var ORBS = [
    { n: 'Auralith', e: 'auralith', key: 'auralith', fit: .663, up: .028, g1: '#7FB0F5', g2: '#BCA6FF', glow: '124 108 255' },
    { n: 'Sylvara',  e: 'sylvara',  key: 'botan',    fit: .667,  up: 0,    g1: '#E6FFB8', g2: '#5FD98A', glow: '110 226 140' },
    { n: 'Rasenith', e: 'rasenith', key: 'rasenith', fit: .612, up: 0,    g1: '#C9E4FF', g2: '#5A9BFF', glow: '90 150 255' },
    { n: 'Filara',   e: 'filara',   key: 'thread',   fit: .703, up: 0,    g1: '#FFC48A', g2: '#D88BFF', glow: '206 120 255' },
    { n: 'Petalis',  e: 'petalis',  key: 'sakura',   fit: .709, up: 0,    g1: '#FFC2D8', g2: '#E2588F', glow: '226 88 143' },
    { n: 'Sumi',     e: 'sumi',     key: 'sumi',     fit: .557, up: .044, g1: '#FFF4E6', g2: '#D9A06A', glow: '255 196 140' }
  ];
  /* build = ms after a swap ends before the next engine is built (idle time) */
  var T = { every: 6000, build: 2000, out: 1200, inDelay: 300, inDur: 1300, idle: 0.6, fast: 1.6, glow: 2400 };
  /* render budget (v1.1): engines draw at 560 × dpr × q; buffer = shown size × min(dpr, 1.5), never over CAP px */
  var DPR = Math.min(window.devicePixelRatio || 1, 2), CAP = 720;
  /* pool: keep every engine after its first turn (paused engines cost no GPU time, a few MB each).
     Low-memory devices keep only the showing one + the next. */
  var POOL = (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 0 : 1;
  var cfg = window.__obuHero || {};   /* test hooks: {every, noFpsGuard, cap, pool: 0|1} */
  if (cfg.every) { T.every = cfg.every; T.build = Math.min(T.build, cfg.every / 3); }
  if (cfg.cap) CAP = cfg.cap;
  if (typeof cfg.pool === 'number') POOL = cfg.pool;
  var EASE_IN = 'cubic-bezier(.32,0,.67,0)', EASE_OUT = 'cubic-bezier(.33,1,.68,1)';   /* = cubic in / out */
  var WAAPI = typeof Element !== 'undefined' && !!Element.prototype.animate;

  function hasGL() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function still(o) {
    var b = box({ fit: .78, up: 0 }), im = new Image();   /* the album still frames the body at ~.78 */ im.alt = ''; im.src = STILL; im.decoding = 'async';
    im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    b.appendChild(im); var w = wrap(); w.appendChild(b); w.style.opacity = '1'; host.appendChild(w); return w;
  }
  function wrap() { var w = document.createElement('div'); w.className = 'lv'; w.style.opacity = '0'; return w; }
  function box(o) {
    var k = .76 / o.fit, b = document.createElement('div'); b.className = 'lv-box';
    b.style.cssText = 'position:absolute;left:' + (50 - 50 * k) + '%;top:' + (50 - 50 * k - 100 * o.up * k) + '%;width:' + 100 * k + '%;height:' + 100 * k + '%';
    return b;
  }
  if (reduce || !hasGL()) { still(ORBS[0]); return; }

  /* ---------- stage glow: stacked layers, opacity cross-fade (compositor only) ---------- */
  (function () {
    var css = document.createElement('style');
    css.textContent = '.hero .orb-stage::before{content:none}' +   /* the layers below replace the CSS glow */
      '.hglow{position:absolute;inset:-46%;pointer-events:none;opacity:0;will-change:opacity;transition:opacity ' + T.glow + 'ms ease-in-out}' +
      '.hglow.on{opacity:1}';
    document.head.appendChild(css);
  })();
  var glows = [];
  function glowTo(o, instant) {
    var d = document.createElement('div'); d.className = 'hglow'; d.setAttribute('aria-hidden', 'true');
    d.style.background = 'radial-gradient(closest-side,rgb(' + o.glow + ' / .30),rgb(' + o.glow + ' / .10) 45%,rgb(' + o.glow + ' / 0) 72%)';
    if (instant) d.style.transition = 'none';
    stage.insertBefore(d, host); glows.push(d);
    if (instant) d.classList.add('on');
    else requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('on'); }); });
    var old = glows.slice(0, -1);
    setTimeout(function () { old.forEach(function (g) { if (g.parentNode) g.parentNode.removeChild(g); var i = glows.indexOf(g); if (i >= 0) glows.splice(i, 1); }); }, instant ? 0 : T.glow + 150);
  }
  glowTo(ORBS[0], true);

  /* ---------- engine loading ---------- */
  var M = null, loading = {};
  function master() {
    if (M) return M;
    return (M = fetch(src('master')).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (v) {
      /* the engines read OrbMaster through window.__obuOM; filled once, never re-fetched */
      window.__obuOM = { at: 1e15, v: v, ver: 1, busy: false, raw: 'site' }; return v;
    }));
  }
  function load(e) {
    return loading[e] || (loading[e] = new Promise(function (ok, no) {
      if (window.__obuEng && window.__obuEng[e]) return ok(window.__obuEng[e]);
      var s = document.createElement('script'); s.src = src(e); s.async = true;
      s.onload = function () { window.__obuEng && window.__obuEng[e] ? ok(window.__obuEng[e]) : no(e); };
      s.onerror = function () { delete loading[e]; no(e); };
      document.head.appendChild(s);
    }));
  }
  window.__obuHQ = 1;
  function DCLogic(p) { this.props = p || {}; this.state = {}; }
  DCLogic.prototype.forceUpdate = function () {};
  DCLogic.prototype.setState = function (o, cb) { Object.assign(this.state, typeof o === 'function' ? o(this.state) : o); cb && cb(); };
  function idle(fn, t) { return window.requestIdleCallback ? requestIdleCallback(fn, { timeout: t || 1000 }) : setTimeout(fn, 60); }

  /* ---------- one live orb ---------- */
  var live = [], pool = {}, perf = { builds: [], reuses: 0 };
  function sizeOf() { return stage.getBoundingClientRect().width || 300; }
  /* build in 2 idle tasks: (1) DOM from the template, (2) the GL set-up (the expensive part) */
  function mount(o) {
    return Promise.all([master(), load(o.e)]).then(function (r) {
      return new Promise(function (ok, no) {
        idle(function () {
          var t0 = performance.now(), v = r[0] || {}, eng = r[1];
          var w = wrap(), b = box(o), inner = document.createElement('div');
          var lvl = (typeof v.all_bright === 'number' ? v.all_bright : 1.04) * (typeof v[o.key + '_level'] === 'number' ? v[o.key + '_level'] : 1);
          var sat = typeof v.all_sat === 'number' ? v.all_sat : .86;
          b.style.filter = 'saturate(' + sat.toFixed(3) + ') brightness(' + lvl.toFixed(3) + ')';   /* static, as LiveOrb does */
          inner.className = 'lv-in'; inner.innerHTML = eng.tpl;
          b.appendChild(inner); w.appendChild(b);
          w.setAttribute('data-paused', '1'); w.style.visibility = 'hidden';   /* built hidden + frozen; woken at its swap */
          host.appendChild(w);
          var px = sizeOf() * .76 / o.fit;
          inner.style.transform = 'scale(' + (px / 560).toFixed(4) + ')';
          var t1 = performance.now() - t0;
          idle(function () {
            var t2 = performance.now();
            var buf = Math.min(CAP, px * Math.min(DPR, 1.5)), q = Math.max(.2, Math.min(1, buf / (560 * DPR)));
            var Comp = eng.make(DCLogic), c = new Comp({ q: q.toFixed(3), fps: '60' });
            var vals = c.renderVals ? c.renderVals() : {};
            [].forEach.call(inner.querySelectorAll('[data-ref]'), function (el) { var f = vals[el.getAttribute('data-ref')]; if (typeof f === 'function') f(el); });
            if (o.e === 'auralith') window.__obuHQ = 0;   /* Auralith's HQ = 1024 feedback buffer; q ≤ .75 gives the app's 512 */
            try { c.componentDidMount && c.componentDidMount(); } catch (err) { c.noGl = true; } finally { window.__obuHQ = 1; }
            if (c.noGl) { kill({ c: c, w: w }); return no(new Error('nogl')); }
            var h = { o: o, c: c, w: w, inner: inner, cvs: inner.querySelectorAll('canvas'), spin: 0, frames: 0, v: v, dead: false, held: true };
            if (o.e === 'rasenith') windUp(h);
            live.push(h); if (POOL) pool[o.e] = h;
            perf.builds.push([o.n, Math.round(t1), Math.round(performance.now() - t2)]);
            ok(h);
          }, 800);
        }, 1200);
      });
    });
  }
  function windUp(h) {   /* Rasenith held wound up: the vortex at full turn */
    var c = h.c, wm = typeof h.v.rasenith_vortex === 'number' ? h.v.rasenith_vortex : 160;
    c.wPhase = 'hold'; c.wind = wm; c.holdLeft = 1e9;
  }
  function kill(h) {
    if (h.dead) return; h.dead = true;
    try { h.c.componentWillUnmount && h.c.componentWillUnmount(); } catch (e) {}
    if (h.w && h.w.parentNode) h.w.parentNode.removeChild(h.w);
    var i = live.indexOf(h); if (i >= 0) live.splice(i, 1);
    if (h.o && pool[h.o.e] === h) delete pool[h.o.e];
  }
  /* off stage: pooled engines freeze + hide (zero GPU), the rest are torn down in idle time */
  function park(h) {
    stopAnim(h); h.spin = 0; h.held = true; h.frames = 0;
    h.w.setAttribute('data-paused', '1'); h.w.style.visibility = 'hidden'; h.w.style.opacity = '0'; h.w.style.transform = '';
    if (!POOL) idle(function () { kill(h); }, 1500);
  }
  function wake(h) { h.held = false; h.w.removeAttribute('data-paused'); h.w.style.visibility = ''; }
  function lost(h) { var g = h.c && h.c.gl; return !h.dead && (!g || (g.isContextLost && g.isContextLost())); }
  function drawn(h) {   /* a canvas that is showing and has a size = the engine is ready (LiveOrb data-lv rule) */
    var cs = h.cvs;
    for (var k = 0; k < cs.length; k++) { var c = cs[k]; if (c.width > 0 && c.style.visibility !== 'hidden' && c.style.opacity !== '0') return true; }
    return false;
  }
  function look(h, s, a) { h.w.style.transform = s === 1 ? '' : 'scale(' + s.toFixed(4) + ')'; h.w.style.opacity = a.toFixed(3); }
  /* fades + scales on the compositor (Web Animations); JS fallback = look() each frame */
  function anim(h, from, to, dur, delay, ease) {
    stopAnim(h);
    if (!WAAPI) { h.js = { from: from, to: to, dur: dur, delay: delay || 0, ease: ease, t0: performance.now() }; return; }
    h.a = h.w.animate([{ transform: 'scale(' + from[0] + ')', opacity: from[1] }, { transform: 'scale(' + to[0] + ')', opacity: to[1] }],
      { duration: dur, delay: delay || 0, easing: ease, fill: 'both' });
    look(h, to[0], to[1]);   /* the end state underneath the animation */
  }
  function stopAnim(h) { if (h.a) { try { h.a.cancel(); } catch (e) {} h.a = null; } h.js = null; }
  function stepJs(h, now) {
    var a = h.js; if (!a) return;
    var u = Math.max(0, Math.min(1, (now - a.t0 - a.delay) / a.dur)), k = a.ease === EASE_IN ? u * u * u : 1 - Math.pow(1 - u, 3);
    look(h, a.from[0] + (a.to[0] - a.from[0]) * k, a.from[1] + (a.to[1] - a.from[1]) * k);
    if (u >= 1) h.js = null;
  }

  /* ---------- the loop: spin, swaps, fps guard ---------- */
  var cur = null, next = null, idx = 0, clock = 0, last = 0, onScreen = true, stopped = false,
      swap = null, fpsT = 0, fpsN = 0, slowFor = 0, first = null;
  function easeIn(u) { return u * u * u; }
  function easeOut(u) { return 1 - Math.pow(1 - u, 3); }
  /* headline + name follow the orb at the swap (hero only); the page accent waits until the swap is over */
  function themeHero(o) { hero.style.setProperty('--g1', o.g1); hero.style.setProperty('--g2', o.g2); hero.style.setProperty('--glow', o.glow); glowTo(o); }
  function themePage(o) { var r = document.documentElement.style; r.setProperty('--acc', o.g2); r.setProperty('--acc-rgb', o.glow); }
  function label(o) { if (!nameEl) return; nameEl.classList.add('fade'); setTimeout(function () { nameEl.textContent = o.n; nameEl.classList.remove('fade'); }, 500); }

  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(100, now - last) : 16; last = now;
    var running = onScreen && !document.hidden;
    for (var i = 0; i < live.length; i++) {
      var h = live[i], c = h.c;
      if (h.held) continue;                             /* parked / waiting engines are frozen: nothing to feed */
      c.spinVel = h.spin / 1000; c.vy = h.spin;        /* engines' own drag-spin hooks, refreshed every frame */
      if (h.o.e === 'rasenith' && c.wPhase !== 'hold') windUp(h); else if (h.o.e === 'rasenith') c.holdLeft = 1e9;
      if (h.js) stepJs(h, now);
    }
    if (running) {
      if (first && !cur) {                              /* first orb: wake it, fade the poster out once it has drawn */
        if (first.held) { wake(first); first.spin = T.idle; }
        if (drawn(first)) first.frames++;
        if (first.frames >= 3) {
          cur = first; first = null; anim(cur, [1, 0], [1, 1], 900, 0, EASE_OUT); cur.inUntil = now + 900;
          if (poster) { var p = poster; poster = null; p.style.transition = 'opacity .9s ease'; p.style.opacity = '0'; setTimeout(function () { p.remove(); }, 1000); }
          clock = 0;
        }
      }
      if (cur && !swap && !stopped) {
        clock += dt;
        if (!next && clock >= Math.min(T.build, T.every - 1500)) prepare();
        if (next && next.h && drawn(next.h)) next.h.frames++;
        if (next && next.h && clock >= T.every && next.h.frames >= 3) begin(now);
        else if (next && clock >= T.every + 4000) { if (next.h && !POOL) kill(next.h); next = null; clock = 0; idx = (idx + 1) % ORBS.length; } /* never got ready: skip it */
      }
      if (swap) step(now);
      fps(now, dt);
    } else { fpsT = 0; fpsN = 0; slowFor = 0; }
    if (live.length || first) raf = requestAnimationFrame(frame);
  }
  var raf = 0, poster = null;
  function kick() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }

  function prepare() {
    var n = (idx + 1) % ORBS.length, o = ORBS[n], ph = pool[o.e];
    next = { n: n, h: null };
    var mine = next;
    if (ph && !lost(ph)) { ph.frames = 0; mine.h = ph; perf.reuses++; return; }   /* pooled: ready in 3 frames, no set-up */
    if (ph) kill(ph);
    mount(o).then(function (h) { if (next !== mine || stopped) { if (!POOL) kill(h); return; } h.frames = 0; mine.h = h; kick(); })
      .catch(function () { if (next === mine) { next = null; idx = n; clock = 0; } });
  }
  function begin(now) {
    var out = cur, inn = next.h;
    wake(inn); inn.spin = T.fast; look(inn, 1.12, 0);
    idx = next.n; next = null; clock = 0;
    swap = { t0: now, out: out, inn: inn };
    anim(out, [1, 1], [.86, 0], T.out, 0, EASE_IN);
    anim(inn, [1.12, 0], [1, 1], T.inDur, T.inDelay, EASE_OUT);
    themeHero(inn.o); label(inn.o);
  }
  function step(now) {
    var s = swap, e = now - s.t0;
    if (s.out && !s.out.held) {
      var u = Math.min(1, e / T.out);
      s.out.spin = T.idle + (T.fast - T.idle) * easeIn(u);   /* spin ramps stay in JS: the engines read them */
      if (u >= 1) park(s.out);
    }
    var v = Math.max(0, Math.min(1, (e - T.inDelay) / T.inDur));
    s.inn.spin = T.fast + (T.idle - T.fast) * easeOut(v);
    if (v >= 1 && (!s.out || s.out.held)) {
      cur = s.inn; cur.spin = T.idle; stopAnim(cur); look(cur, 1, 1); swap = null; fpsT = 0; fpsN = 0; slowFor = 0;
      var o = cur.o; idle(function () { themePage(o); }, 1200);
      preload();
    }
  }
  /* fetch + parse the next engine script while idle (first lap only; pooled engines skip it) */
  function preload() {
    var e = ORBS[(idx + 1) % ORBS.length].e; if (pool[e]) return;
    idle(function () { load(e).catch(function () {}); }, 2500);
  }
  /* fps guard: only while one orb is alone on screen; < 40 fps averaged over 2 s = keep this orb, stop cycling */
  function fps(now, dt) {
    if (cfg.noFpsGuard || stopped || swap || (next && !next.h) || !cur || now < (cur.inUntil || 0)) { fpsT = 0; fpsN = 0; return; }
    fpsT += dt; fpsN++;
    if (fpsT >= 500) {
      var f = fpsN * 1000 / fpsT; fpsT = 0; fpsN = 0;
      slowFor = f < 40 ? slowFor + 500 : 0;
      if (slowFor >= 2000) { stopped = true; host.setAttribute('data-held', '1'); }
    }
  }

  /* ---------- start ---------- */
  poster = still(ORBS[0]); poster.classList.add('lv-poster');
  mount(ORBS[0]).then(function (h) { first = h; kick(); preload(); }).catch(function () { /* keep the still */ });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; if (onScreen) kick(); }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(function () {
    var s = sizeOf();
    live.forEach(function (h) { h.inner.style.transform = 'scale(' + (s * .76 / h.o.fit / 560).toFixed(4) + ')'; });
  }).observe(stage);
  window.__obuHeroState = function () { return { ver: '1.2', live: live.map(function (h) { return h.o.n; }), pooled: Object.keys(pool), cur: cur && cur.o.n, idx: idx, stopped: stopped, canvases: host.querySelectorAll('canvas').length, swap: !!swap, held: live.filter(function (h) { return h.held; }).length, drawing: live.filter(function (h) { return !h.held; }).map(function (h) { return h.o.n; }), glows: glows.length, bufs: [].map.call(host.querySelectorAll('canvas'), function (c) { return c.width; }), perf: perf }; };
})();
