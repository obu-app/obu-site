/* obu live orb engine: rasenith (from the design canvas OrbRasenith.dc.html, 16 Nov 2026). Do not edit here: re-run the build. */
(window.__obuEng=window.__obuEng||{})["rasenith"]={tpl:"<div style=\"position: relative; width: 560px; height: 560px\"> <button aria-hidden=\"true\" tabindex=\"-1\" style=\"position: relative; width: 560px; height: 560px; padding: 0; border: none; background: transparent; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; outline: none; -webkit-user-select: none; user-select: none\"> <canvas data-ref=\"setGl\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block\"></canvas> <canvas data-ref=\"setFx\" aria-hidden=\"true\" style=\"position: absolute; left: 0px; top: 0px; width: 560px; height: 560px; display: block; mix-blend-mode: screen\"></canvas> </button> </div>",make:function(DCLogic){

class Component extends DCLogic {
  SIZE = 560;
  FBO = 1024;
  STATES = {
    calm: { glow: 1, spread: 0, sink: 0, sat: 1 },
    drifting: { glow: 0.75, spread: 0.18, sink: 0, sat: 0.7 },
    scattering: { glow: 0.5, spread: 0.45, sink: 0, sat: 0.45 },
    sinking: { glow: 0.32, spread: 0.7, sink: 0.4, sat: 0.3 }
  };

  // Strand pass: every thread is a line strip, drawn additively.
  LINE_VERT = [
    'attribute vec3 aPos;',
    'attribute vec3 aInfo;',
    'uniform float uTime, uRot, uE, uGlow, uSpread, uSink, uDensity, uViolet, uEdges, uBeat, uWind, uWindN, uFade;',
    'varying vec3 vCol;',
    'mat3 rotY(float a){ float c = cos(a); float s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }',
    'mat3 rotX(float a){ float c = cos(a); float s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }',
    'void main(){',
    '  float s = aInfo.x; float seed = aInfo.y; float kind = aInfo.z; float t = uTime;',
    '  vec3 p = aPos;',
    '  p += 0.05 * vec3(sin(p.y * 3.1 + t * 0.7 + seed * 6.0), sin(p.z * 2.7 + t * 0.6 + seed * 4.0), sin(p.x * 3.3 + t * 0.8 + seed * 5.0));',
    '  float r = length(p);',
    '  float ang = uRot + uWind * (0.084 * max(0.0, 1.0 - r) + 0.03 * (1.2 - r));',
    '  p = rotX(0.38) * rotY(ang) * p;',
    '  p *= 1.0 + uSpread * (0.3 + 0.6 * seed);',
    '  vec2 xy = p.xy * (1.0 + uBeat) / 1.25;',
    '  xy.y -= uSink * 0.4;',
    '  gl_Position = vec4(xy, 0.0, 1.0);',
    '  float depth = 0.4 + 0.6 * (p.z / max(length(p), 0.001) * 0.5 + 0.5);',
    '  float flowp = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(s * 7.0 - t * 1.1 * (0.7 + 0.6 * seed) + seed * 6.28), 3.0);',
    '  float L = 0.7 + 0.45 / (1.0 + 5.0 * r * r);',
    '  float vio = smoothstep(0.25, 0.75, fract(seed * 7.3)) * uViolet;',
    '  vec3 c = mix(vec3(0.22, 0.42, 1.0), vec3(0.55, 0.24, 1.0), vio);',
    '  c = mix(vec3(0.35, 0.72, 1.0), c, uWindN);',
    '  c = mix(c, vec3(0.62, 0.85, 1.0), 0.5 * exp(-r * r / 0.12));',
    '  c = mix(c, vec3(0.25, 0.6, 1.0), uE * 0.6);',
    '  float a;',
    '  float pick = fract(seed * 13.7); float bright = 0.25 + 2.2 * pick * pick * pick;',
    '  if (kind < 0.5) { a = 0.08 * uDensity * L * bright; }',
    '  else if (kind < 1.5) { c = mix(c, vec3(0.88, 0.9, 1.0), 0.65); float limb = clamp(length(p.xy) / 1.05, 0.0, 1.0); float glint = pow(0.5 + 0.5 * sin(s * 9.0 + seed * 40.0 + t * 0.4), 6.0); a = 1.3 * uEdges * (0.08 + 0.92 * pow(limb, 4.0)) * (0.3 + 0.5 * flowp + 4.0 * glint) * sin(3.14159 * s); }',
    '  else { a = 0.05 * uDensity * (0.04 + 1.0 * uE); }',
    '  vCol = c * a * depth * flowp * uGlow * (1.0 + 0.5 * uE) * uFade;',
    '}'
  ].join('\n');

  LINE_FRAG = 'precision mediump float; varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.0); }';

  QUAD_VERT = 'attribute vec2 a; varying vec2 vUv; void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }';

  // Composite: threads + soft glow (from blurrier mip levels) + core, stone and press halo.
  QUAD_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uT;',
    'uniform float uTime, uE, uGlow, uSat, uSink, uBloom, uBeat, uCenter, uWindN, uFade;',
    'float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(hash(i), hash(i + vec3(1.0,0.0,0.0)), f.x), mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),',
    '             mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x), mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }',
    'void main(){',
    '  float t = uTime;',
    '  vec3 base = texture2D(uT, vUv).rgb;',
    '  vec3 b1 = texture2D(uT, vUv, 2.0).rgb;',
    '  vec3 b2 = texture2D(uT, vUv, 4.5).rgb;',
    '  vec3 col = base + (b1 * 0.6 + b2 * (0.9 + 1.0 * uE)) * uBloom;',
    '  vec2 uv = (vUv - 0.5) * 2.5 / (1.0 + uBeat);',
    '  uv.y += uSink * 0.6;',
    '  float d = length(uv);',
    '  vec2 sc = uv - vec2(0.03, 0.015);',
    '  float sr = length(sc);',
    '  float a2 = atan(sc.y, sc.x);',
    '  float rotS = t * 0.1;',
    '  float rbd = 0.085 * (0.75 + 0.55 * noise(vec3(cos(a2 + rotS) * 1.6 + 3.0, sin(a2 + rotS) * 1.6, 1.7))) * (1.0 - 0.12 * abs(sin((a2 + rotS) * 3.5)));',
    '  float sd = sr - rbd;',
    '  float inside = smoothstep(0.006, -0.006, sd);',
    '  float fa = floor(mod(a2 + rotS + 3.14159, 6.28318) / 6.28318 * 7.0);',
    '  float fb = hash(vec3(fa, step(0.55, sr / max(rbd, 0.001)), 3.0));',
    '  float shine = pow(max(0.0, sin((a2 + rotS) * 2.0 + t * 0.8)), 8.0);',
    '  vec3 stone = mix(vec3(0.45, 0.70, 1.0), vec3(0.95, 1.0, 1.0), fb * 0.7 + shine * 0.3) * (1.5 + 0.8 * uE);',
    '  float rim = exp(-sd * sd / 0.00008) * (0.4 + 0.6 * shine + 0.4 * fb);',
    '  vec2 w = uv + 0.35 * vec2(noise(vec3(uv * 1.6, t * 0.12)), noise(vec3(uv * 1.6 + 5.2, t * 0.12 + 3.0))) - 0.17;',
    '  float n = 0.6 * noise(vec3(w * 2.4, t * 0.09)) + 0.4 * noise(vec3(w * 5.1 + 2.0, t * 0.14));',
    '  float cloud = smoothstep(0.38, 0.85, n) * exp(-d * d / (0.30 + 0.25 * uE));',
    '  vec3 cloudC = mix(vec3(0.20, 0.42, 1.0), vec3(0.50, 0.22, 1.0), smoothstep(0.3, 0.7, noise(vec3(w * 1.3 + 9.0, t * 0.05))));',
    '  cloudC = mix(vec3(0.30, 0.65, 1.0), cloudC, uWindN);',
    '  col += cloudC * cloud * (0.55 + 0.25 * uE) * uGlow * uFade;',
    '  float flick = 0.85 + 0.3 * noise(vec3(uv * 6.0, t * 0.6));',
    '  float ca = t * 0.15; vec2 ce = mat2(cos(ca), sin(ca), -sin(ca), cos(ca)) * uv;',
    '  float hot = exp(-(ce.x * ce.x / 0.02 + ce.y * ce.y / 0.006)) * flick;',
    '  float ang = atan(uv.y, uv.x);',
    '  float streak = exp(-pow(d - 0.14 - 0.03 * sin(ang * 3.0 + t), 2.0) / 0.0012) * pow(max(0.0, sin(ang + t * 0.7)), 6.0);',
    '  float wide = exp(-d * d / 0.12);',
    '  vec3 core = vec3(0.45, 0.75, 1.0) * hot * 0.8 + vec3(0.6, 0.88, 1.0) * streak * 0.8 + vec3(0.30, 0.45, 1.0) * wide * 0.2;',
    '  col += core * uGlow * (1.0 + 0.9 * uE) * uCenter;',
    '  col = mix(col, stone * uGlow, inside * 0.6) + vec3(0.75, 0.92, 1.0) * rim * 0.45 * uGlow;',
    '  col += vec3(0.12, 0.38, 1.0) * uE * 0.14 * exp(-pow(d - 1.05, 2.0) / 0.25);',
    '  col *= 1.0 + 3.0 * uBeat;',
    '  float gray = dot(col, vec3(0.299, 0.587, 0.114));',
    '  col = mix(vec3(gray), col, uSat);',
    '  col = 1.0 - exp(-col * 1.3);',
    '  float eg = smoothstep(0.5, 0.30, length(vUv - 0.5)); vec3 cc = max(col - 0.03, 0.0) * eg; float aa = max(cc.r, max(cc.g, cc.b)); gl_FragColor = vec4(cc, aa);',
    '}'
  ].join('\n');

  setGl = (el) => { if (el) this.watchGl(el); this.glCanvas = el; };

  // A WebGL canvas whose context is lost paints as a white square in Chromium. Browsers cap live contexts
  // (~16 per page) and drop the oldest when a new orb or the reveal cloud starts. So the canvas hides the
  // moment its context goes, and the orb comes back on a fresh canvas once it is on screen again.
  watchGl(c) {
    if (!c || c.__obuWatch) return; c.__obuWatch = true;
    c.addEventListener('webglcontextlost', (e) => { e.preventDefault(); c.style.visibility = 'hidden'; if (c === this.glCanvas && !this.dead) this.reviveGl(150); }, false);
  }
  reviveGl(wait) {
    clearTimeout(this.reviveT);
    this.reviveT = setTimeout(() => {
      if (this.dead) return;
      const old = this.glCanvas; if (!old || !old.parentNode || !(this.gl && this.gl.isContextLost())) return;
      if (!this.onScreen || document.hidden) { this.reviveGl(700); return; } /* wait until it can be seen */
      const now = Date.now(); this.revives = (this.revives || []).filter((t) => now - t < 10000);
      if (this.revives.length >= 3) return; /* too many orbs fighting for contexts: stay hidden, never flash white */
      this.revives.push(now);
      const n = document.createElement('canvas'); n.setAttribute('aria-hidden', 'true'); n.style.cssText = old.style.cssText; n.style.visibility = '';
      old.parentNode.insertBefore(n, old.nextSibling);
      this.glCanvas = n; this.gl = null; this.watchGl(n);
      if (this.io) { try { this.io.disconnect(); this.io.observe(n); } catch (e) {} }
      this.initGl(); this.lastDraw = 0; /* draws one frame even when paused */
    }, wait || 300);
  }

  setFx = (el) => { this.fxCanvas = el; };
  press = (ev) => { this.dragDown(ev); this.pressed = true; };   /* v3.372 spin-same: pulse only on tap */
  move = (ev) => { const d = this.dragMove(ev); if (d) this.rot += d; };
  onDragStart = () => { this.pressed = false; };
  release = () => { this.pressed = false; this.dragUp(); };
  tap = () => { if (this.suppressTap) { this.suppressTap = false; return; } this.vel = Math.min(6, (this.vel || 0) + 1); this.beatAt = performance.now(); this.pulseAt = performance.now(); };

  ssJ(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // obu · ORB MASTER READER (v1): every look value comes from OrbMaster.dc.html, so a tweak there
  // reaches App v3, onboarding and this board. Read like the runtime reads siblings; re-read every 4 s; one read per page.
  obuM() {
    const w = window, c = w.__obuOM || (w.__obuOM = { at: 0, v: {}, ver: 0, busy: false, raw: '' });
    const now = Date.now();
    if (!c.busy && now - c.at > 4000 && !(document.hidden && c.ver)) {
      c.busy = true; c.at = now;
      const url = './OrbMaster.dc.html', B = w.__resourceBlobs, R = w.__resources;
      const blob = B && B[url] instanceof Blob ? B[url] : null;
      const src = R && typeof R[url] === 'string' && R[url] ? R[url] : url;
      (blob ? blob.text() : fetch(src, { cache: 'no-store' }).then((r) => (r.ok ? r.text() : ''))).then((t) => {
        c.busy = false;
        const m = /data-props\s*=\s*'([^']*)'/.exec(t || '') || /data-props\s*=\s*"([^"]*)"/.exec(t || '');
        if (!m || m[1] === c.raw) return;
        const j = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
        const v = {}; for (const k in j) if (j[k] && typeof j[k] === 'object' && j[k].default !== undefined) v[j[k].key || k] = j[k].default; /* readable tweak names: machine key in .key */
        c.raw = m[1]; c.v = v; c.ver++;
      }).catch(() => { c.busy = false; });
    }
    return c;
  }
  // this form's values from the master (prefix stripped), under anything passed in directly
  mp() {
    const c = this.obuM(), own = this.props || {};
    if (this._mpOwn === own && this._mpVer === c.ver) return this._mpV;
    const pre = this.MKEY + '_', v = {};
    for (const k in c.v) if (k.indexOf(pre) === 0) v[k.slice(pre.length)] = c.v[k];
    for (const k in own) if (own[k] !== undefined) v[k] = own[k];
    const first = this._mpVer !== c.ver && this._mpV;
    this._mpOwn = own; this._mpVer = c.ver; this._mpV = v;
    if (first && this.onMaster) try { this.onMaster(v); } catch (e) {}
    return v;
  }
  MKEY = 'rasenith';
  num(v, d) { return typeof v === 'number' && !isNaN(v) ? v : d; }
  A(v) { return Math.max(0, Math.min(1, v)).toFixed(3); }

  // ---- Threads: traced once along a curl-noise current, animated on the GPU ----

  hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }

  noise3(x, y, z) {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    let fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const h = (a, b, c) => this.hash3(ix + a, iy + b, iz + c);
    const l = (a, b, k) => a + (b - a) * k;
    return l(l(l(h(0, 0, 0), h(1, 0, 0), fx), l(h(0, 1, 0), h(1, 1, 0), fx), fy),
             l(l(h(0, 0, 1), h(1, 0, 1), fx), l(h(0, 1, 1), h(1, 1, 1), fx), fy), fz);
  }

  curl(x, y, z) {
    const e = 0.02, f = 1.35;
    const N = (a, b, c) => this.noise3(a, b, c) + 0.45 * this.noise3(a * 2.3 + 9.1, b * 2.3 + 4.4, c * 2.3 + 1.2);
    const n1 = (a, b, c) => N(a * f, b * f, c * f);
    const n2 = (a, b, c) => N(a * f + 31.4, b * f + 7.1, c * f + 2.9);
    const n3 = (a, b, c) => N(a * f + 5.3, b * f + 19.7, c * f + 41.1);
    const d = (fn, ax) => {
      if (ax === 0) return (fn(x + e, y, z) - fn(x - e, y, z)) / (2 * e);
      if (ax === 1) return (fn(x, y + e, z) - fn(x, y - e, z)) / (2 * e);
      return (fn(x, y, z + e) - fn(x, y, z - e)) / (2 * e);
    };
    return [d(n3, 1) - d(n2, 2), d(n1, 2) - d(n3, 0), d(n2, 0) - d(n1, 1)];
  }

  buildThreads() {
    let sd = 11;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const data = [];
    const add = (pts, seed, kind) => {
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        data.push(a[0], a[1], a[2], i / (n - 1), seed, kind, b[0], b[1], b[2], (i + 1) / (n - 1), seed, kind);
      }
    };
    const ball = (rMin, rMax) => {
      const u = rnd() * 2 - 1, th = rnd() * 6.2832, rr = Math.sqrt(1 - u * u), d = rMin + (rMax - rMin) * Math.cbrt(rnd());
      return [Math.cos(th) * rr * d, u * d, Math.sin(th) * rr * d];
    };
    const trace = (p, steps, h, kind, rLo, rHi, ax) => {
      const pts = [p];
      for (let i = 0; i < steps; i++) {
        const c = this.curl(p[0], p[1], p[2]);
        let v = [c[0] - p[2] * 0.35, c[1], c[2] + p[0] * 0.35];
        if (ax) { const sw = [ax[1] * p[2] - ax[2] * p[1], ax[2] * p[0] - ax[0] * p[2], ax[0] * p[1] - ax[1] * p[0]]; const cm = Math.hypot(c[0], c[1], c[2]) || 1; v = [sw[0] * 2.2 + c[0] / cm * 0.9, sw[1] * 2.2 + c[1] / cm * 0.9, sw[2] * 2.2 + c[2] / cm * 0.9]; }
        let r = Math.hypot(p[0], p[1], p[2]) || 1;
        if (kind === 1) {
          const dot = (v[0] * p[0] + v[1] * p[1] + v[2] * p[2]) / r;
          v = [v[0] - dot * p[0] / r, v[1] - dot * p[1] / r, v[2] - dot * p[2] / r];
        }
        const m = Math.hypot(v[0], v[1], v[2]) || 1;
        p = [p[0] + v[0] / m * h, p[1] + v[1] / m * h, p[2] + v[2] / m * h];
        r = Math.hypot(p[0], p[1], p[2]) || 1;
        if (r > rHi) p = p.map((q) => q * rHi / r);
        if (r < rLo) p = p.map((q) => q * rLo / r);
        pts.push(p);
      }
      return pts;
    };
    // Inner gas: denser toward the middle
    for (let i = 0; i < 3000; i++) { const k = rnd(); add(trace(ball(0.15, 0.3 + 0.67 * k), 40, 0.02, 0, 0.14, 0.97), rnd(), 0); }
    // Edge wisps: few, long, hugging an uneven shell
    for (let i = 0; i < 24; i++) {
      const r0 = 0.92 + rnd() * 0.2, ax = ball(1, 1), q = ball(1, 1);
      let st = [ax[1] * q[2] - ax[2] * q[1], ax[2] * q[0] - ax[0] * q[2], ax[0] * q[1] - ax[1] * q[0]];
      const sm = Math.hypot(st[0], st[1], st[2]) || 1; st = st.map((v) => v / sm * r0);
      add(trace(st, 130, 0.024, 1, r0 - 0.12, r0 + 0.12, ax), rnd(), 1);
    }
    // Outer haze threads, shown when pressed
    for (let i = 0; i < 500; i++) add(trace(ball(1.05, 1.45), 30, 0.025, 2, 1.0, 1.48), rnd(), 2);
    this.threads = new Float32Array(data);
    this.vcount = data.length / 6;
  }

  program(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) this.glError = (this.glError || '') + gl.getShaderInfoLog(s);
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { this.glError = (this.glError || '') + gl.getProgramInfoLog(p); return null; }
    return p;
  }

  initGl() {
    // in the app the orb is shown small: a 512 buffer looks the same and costs a quarter
    this.FBO = (parseFloat((this.props || {}).q) || 1) <= 0.6 ? 512 : 1024;
    const c = this.glCanvas;
    if (!c) return;
    const gl = c.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { this.noGl = true; return; }
    this.gl = gl;
    this.lineProg = this.program(this.LINE_VERT, this.LINE_FRAG);
    this.quadProg = this.program(this.QUAD_VERT, this.QUAD_FRAG);
    if (!this.lineProg || !this.quadProg) { this.noGl = true; return; }

    this.buildThreads();
    this.lineBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.threads, gl.STATIC_DRAW);
    this.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.FBO, this.FBO, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    this.fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.lu = {};
    ['uTime', 'uRot', 'uE', 'uGlow', 'uSpread', 'uSink', 'uDensity', 'uViolet', 'uEdges', 'uBeat', 'uWind', 'uWindN', 'uFade'].forEach((n) => { this.lu[n] = gl.getUniformLocation(this.lineProg, n); });
    this.la = { pos: gl.getAttribLocation(this.lineProg, 'aPos'), info: gl.getAttribLocation(this.lineProg, 'aInfo') };
    this.qu = {};
    ['uT', 'uTime', 'uE', 'uGlow', 'uSat', 'uSink', 'uBloom', 'uBeat', 'uCenter', 'uWindN', 'uFade'].forEach((n) => { this.qu[n] = gl.getUniformLocation(this.quadProg, n); });
    this.qa = gl.getAttribLocation(this.quadProg, 'a');
  }

  componentDidMount() {
    this.e = 0; this.rot = 0; this.time = 0;
    this.initGl();
    if (this.noGl) this.forceUpdate();
    // Let go wherever the pointer is released, so a press can never get stuck on
    this.onUp = () => { this.pressed = false; this.dragUp(); };
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('blur', this.onUp);
    cancelAnimationFrame(this.raf);
    // only draw when on screen, and at the frame rate asked for (side orbs run slower)
    this.onScreen = true;
    try { this.io = new IntersectionObserver((es) => { this.onScreen = es[0].isIntersecting; }); if (this.glCanvas) this.io.observe(this.glCanvas); } catch (e) {}
    const step = (now) => { this.raf = requestAnimationFrame(step);
      if (!this.onScreen) { this.last = now; return; }
      if (this.lastDraw && this.glCanvas && this.glCanvas.closest && this.glCanvas.closest('[data-paused="1"]')) { this.last = now; return; } /* frozen on its last frame */
      const fps = parseFloat((this.props || {}).fps) || 60;
      if (fps < 58 && now - (this.lastDraw || 0) < 1000 / fps - 4) return;
      if (this.gl && this.gl.isContextLost()) { this.last = now; return; }
      this.lastDraw = now; this.draw(now); };
    this.raf = requestAnimationFrame(step);
  }

  componentWillUnmount() {
    this.dead = true; clearTimeout(this.reviveT);
    if (this.glCanvas) this.glCanvas.style.visibility = 'hidden'; /* never show a freed canvas */
    cancelAnimationFrame(this.raf);
    if (this.io) this.io.disconnect();
    // free the GPU context right away instead of waiting for garbage collection
    try { const lx = this.gl && this.gl.getExtension('WEBGL_lose_context'); if (lx) lx.loseContext(); } catch (e) {}
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('blur', this.onUp);
  }

  draw(now) {
    const dt = Math.min(60, now - (this.last || now)); this.last = now;
    const target = (this.pressed || now < (this.boostUntil || 0)) ? 1 : 0;
    this.e += (target - this.e) * (target ? 0.045 : 0.022) * (dt / 16.7);
    const e = this.e;
    const p = this.mp();
    const st = this.STATES[p.state || 'calm'] || this.STATES.calm;
    const speed = this.num(p.speed, 1);
    // Holding winds it up fast; letting go returns to the normal pace
    this.time += dt * 0.0005 * speed * (1 + 0.5 * e);
    this.rot += dt * 0.00006 * speed + this.coast(dt);
    // Wind-up cycle: winds to the full vortex, holds, unwinds back to the start, repeats.
    // Holding and tapping wind it faster.
    const sec = dt / 1000;
    const wMax = this.num(p.vortex, 60), bT = this.num(p.buildTime, 8), hT = this.num(p.holdTime, 10), uT = this.num(p.unwindTime, 3);
    if (!this.wPhase) { this.wPhase = 'build'; this.wind = 0; }
    const boost = 1 + 4 * e + 3 * (this.vel || 0);
    if (this.wPhase === 'build') {
      this.wind += wMax / bT * sec * boost;
      if (this.wind >= wMax) { this.wind = wMax; this.wPhase = 'hold'; this.holdLeft = hT; }
    } else if (this.wPhase === 'hold') {
      if (!this.pressed) this.holdLeft -= sec;
      if (this.holdLeft <= 0) { this.wPhase = 'dissolve'; this.dis = 0; }
    } else {
      // dissolve: the vortex fades and drifts apart, quietly resets, then the original shape fades back in
      this.dis += sec / uT;
      if (this.dis >= 1) { this.dis = 0; this.wind = 0; this.wPhase = 'build'; }
    }
    this.windN = Math.min(1, this.wind / Math.max(1, wMax));
    if (this.wPhase === 'dissolve') {
      const d = this.dis;
      // the vortex stops and drifts apart while the calm, unwound smoke forms in its place (never goes dark)
      this.fadeA = 1 - this.ssJ(0, 1, d);
      this.fadeB = this.ssJ(0, 1, d);
      this.puff = 0.3 * this.ssJ(0, 1, d);
    } else { this.fadeA = 1; this.fadeB = 0; this.puff = 0; }
    this.fade = 1;
    // At full vortex it spins as a whole; holding the orb keeps it there and spins it faster
    const spinT = this.wPhase === 'hold' ? 1 : 0;
    this.spinK = (this.spinK || 0) + (spinT - (this.spinK || 0)) * (1 - Math.exp(-sec / (spinT ? 0.6 : 0.4)));
    this.rot += sec * this.num(p.vortexSpin, 1.5) * this.spinK * (1 + 1.5 * e);
    // Each tap pushes the swirl further along, as if it were spinning faster, then eases off
    const v = this.vel || 0;
    if (v > 0.001) this.vel = v * Math.exp(-dt / 500);
    // Heartbeat: a quick double thump (lub-dub) after each tap
    let beat = 0;
    if (this.beatAt) { const a = (now - this.beatAt) / 1000; if (a < 0.8) beat = 0.05 * Math.exp(-Math.pow(a / 0.07, 2)) + 0.035 * Math.exp(-Math.pow((a - 0.24) / 0.07, 2)); }
    this.beat = beat;

    const gl = this.gl;
    if (gl && this.lineProg) {
      // 1. Threads into the offscreen texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, this.FBO, this.FBO);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(this.lineProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.enableVertexAttribArray(this.la.pos);
      gl.vertexAttribPointer(this.la.pos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(this.la.info);
      gl.vertexAttribPointer(this.la.info, 3, gl.FLOAT, false, 24, 12);
      const L = this.lu;
      gl.uniform1f(L.uTime, this.time);
      var _st = window.__obuSteer && this.glCanvas && this.glCanvas.closest && this.glCanvas.closest('[data-gx-you]') ? window.__obuSteer : null;   // 3.57 Galaxy roll
      gl.uniform1f(L.uRot, this.rot + (_st ? _st.yaw : 0));
      gl.uniform1f(L.uE, e);
      gl.uniform1f(L.uGlow, st.glow);
      gl.uniform1f(L.uSpread, st.spread + (this.puff || 0));
      gl.uniform1f(L.uSink, st.sink);
      gl.uniform1f(L.uDensity, this.num(p.density, 1));
      gl.uniform1f(L.uViolet, this.num(p.violet, 0.7));
      gl.uniform1f(L.uEdges, this.num(p.edges, 1));
      gl.uniform1f(L.uBeat, this.beat || 0);
      gl.uniform1f(L.uWind, this.wind || 0);
      gl.uniform1f(L.uWindN, this.windN || 0);
      gl.uniform1f(L.uFade, this.fadeA === undefined ? 1 : this.fadeA);
      gl.drawArrays(gl.LINES, 0, this.vcount);
      if ((this.fadeB || 0) > 0.001) {
        gl.uniform1f(L.uWind, 0);
        gl.uniform1f(L.uWindN, 0);
        gl.uniform1f(L.uSpread, st.spread);
        gl.uniform1f(L.uFade, this.fadeB);
        gl.drawArrays(gl.LINES, 0, this.vcount);
      }
      gl.disableVertexAttribArray(this.la.info);
      gl.disable(gl.BLEND);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.generateMipmap(gl.TEXTURE_2D);

      // 2. Composite to the screen
      const c = this.glCanvas;
      const qq = Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1)); const px = Math.round(this.SIZE * Math.min(window.devicePixelRatio || 1, 2) * qq);
      if (c.width !== px) { c.width = px; c.height = px; }
      gl.viewport(0, 0, px, px);
      gl.useProgram(this.quadProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      gl.enableVertexAttribArray(this.qa);
      gl.vertexAttribPointer(this.qa, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      const Q = this.qu;
      gl.uniform1i(Q.uT, 0);
      gl.uniform1f(Q.uTime, this.time);
      gl.uniform1f(Q.uE, e);
      gl.uniform1f(Q.uGlow, st.glow);
      gl.uniform1f(Q.uSat, st.sat);
      gl.uniform1f(Q.uSink, st.sink);
      gl.uniform1f(Q.uBloom, this.num(p.glow, 1));
      gl.uniform1f(Q.uCenter, this.num(p.center, 1));
      gl.uniform1f(Q.uWindN, this.windN || 0);
      gl.uniform1f(Q.uFade, this.fade === undefined ? 1 : this.fade);
      gl.uniform1f(Q.uBeat, this.beat || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // The pulse ring, drawn on top
    const f = this.fxCanvas;
    if (!f) return;
    const S = this.SIZE, dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1)); /* site lag fix: pulse layer follows q like the GL canvas */
    if (f.width !== Math.round(S * dpr)) { f.width = Math.round(S * dpr); f.height = Math.round(S * dpr); }
    const ctx = f.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    if (this.pulseAt) {
      const k = (now - this.pulseAt) / 1100;
      if (k < 1) {
        const cx = S / 2, cy = S / 2 + st.sink * S * 0.2, R = S * 0.4 * (1 + st.spread * 0.45);
        ctx.strokeStyle = 'hsla(205,100%,75%,' + this.A(0.45 * (1 - k)) + ')';
        ctx.lineWidth = 2 + 6 * (1 - k);
        ctx.beginPath(); ctx.arc(cx, cy, R * (0.4 + 1.15 * k), 0, 6.2832); ctx.stroke();
      }
    }
  }

  // ---- Drag sideways to spin, with momentum (shared by every orb)
  dragDown(ev) {
    const x = ev && typeof ev.clientX === 'number' ? ev.clientX : null;
    this.dragX0 = x; this.dragLX = x; this.dragging = false; this.suppressTap = false;
    this.dragT = performance.now(); this.spinVel = 0; this.dragH = [];   // orb-spin v1
    try { if (ev && ev.currentTarget && ev.currentTarget.setPointerCapture) ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
  }
  // How far to turn for this pointer move (0 until the finger has moved sideways a little)
  dragMove(ev) {
    if (this.dragX0 === null || this.dragX0 === undefined || !ev || typeof ev.clientX !== 'number') return 0;
    const now = performance.now();
    if (!this.dragging && Math.abs(ev.clientX - this.dragX0) > 8) { this.dragging = true; if (this.onDragStart) this.onDragStart(); }   // orb-spin v1: < 8 pt = tap
    const dx = ev.clientX - this.dragLX; this.dragLX = ev.clientX;
    if (!this.dragging) return 0;
    const el = this.glCanvas;
    const w = (el && el.getBoundingClientRect && el.getBoundingClientRect().width) || this.SIZE;
    // orb-spin v1: 1:1 with the finger, capped at 270°/s; flick speed = average of the last 80 ms (no single-frame spikes)
    const dts = Math.max(8, now - this.dragT), lim = 0.0047124 * dts, d = Math.max(-lim, Math.min(lim, dx / w * 3.4));
    const H = this.dragH || (this.dragH = []); H.push([now, d, dts]); while (H.length > 1 && now - H[0][0] > 80) H.shift();
    let sd = 0, st = 0; for (let i = 0; i < H.length; i++) { sd += H[i][1]; st += H[i][2]; }
    this.spinVel = Math.max(-0.0047124, Math.min(0.0047124, sd / Math.max(16, st)));
    this.dragT = now;
    return d;
  }
  dragUp() {
    if (this.dragX0 === null || this.dragX0 === undefined) return;
    if (this.dragging) { this.suppressTap = true; if (performance.now() - this.dragT > 100) this.spinVel = 0; }   // held still before letting go = no flick
    this.dragX0 = null; this.dragging = false;
  }
  // Momentum left over after a flick, eased out over about a second
  coast(dt) {
    if (this.dragX0 !== null && this.dragX0 !== undefined) return 0;
    const d = (this.spinVel || 0) * dt;
    this.spinVel = (this.spinVel || 0) * Math.exp(-dt * 0.0011552);   // orb-spin v1: half-life 0.6 s
    return d;
  }

  renderVals() {
    return {
      setGl: this.setGl, setFx: this.setFx, press: this.press, move: this.move, release: this.release, tap: this.tap,
      hint: this.noGl ? 'This browser has WebGL turned off, so the orb can’t be drawn here.' : 'Press and hold the orb'
    };
  }
}

;return Component;}};
