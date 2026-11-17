/* obu live orb engine: auralith (from the design canvas OrbAuralith.dc.html, 16 Nov 2026). Do not edit here: re-run the build. */
(window.__obuEng=window.__obuEng||{})["auralith"]={tpl:"<div style=\"position: relative; width: 560px; height: 560px\"> <button aria-hidden=\"true\" tabindex=\"-1\" style=\"position: relative; width: 560px; height: 560px; padding: 0; border: none; background: transparent; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; outline: none; -webkit-user-select: none; user-select: none\"> <canvas data-ref=\"setGl\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block\"></canvas> <canvas data-ref=\"setFx\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block; mix-blend-mode: screen\"></canvas> </button> </div>",make:function(DCLogic){

class Component extends DCLogic {
  SIZE = 560;
  FBO = 1024;
  STATES = {
    calm: { glow: 1, spread: 0, sink: 0, sat: 1 },
    drifting: { glow: 0.75, spread: 0.18, sink: 0, sat: 0.7 },
    scattering: { glow: 0.5, spread: 0.45, sink: 0, sat: 0.45 },
    sinking: { glow: 0.32, spread: 0.7, sink: 0.4, sat: 0.3 }
  };

  // Shared: the gentle wobble and the turn, so ribbons and threads move together.
  XF = [
    'vec3 wob(vec3 p, float seed, float t){ return p + 0.05 * vec3(sin(p.y * 3.1 + t * 0.7 + seed * 6.0), sin(p.z * 2.7 + t * 0.6 + seed * 4.0), sin(p.x * 3.3 + t * 0.8 + seed * 5.0)); }',
    'vec3 xf(vec3 p, float seed){',
    '  float c = cos(uRot); float s = sin(uRot);',
    '  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);',
    '  float ct = cos(0.38); float st = sin(0.38);',
    '  p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);',
    '  return p * (1.0 + uSpread * (0.3 + 0.6 * seed));',
    '}'
  ].join('\n');

  // Ribbon pass: wide, soft, see-through strips of smoke that always face the viewer.
  RIB_VERT_BODY = [
    'attribute vec3 aPos;',
    'attribute vec3 aNext;',
    'attribute vec4 aA;',
    'attribute float aKind;',
    'varying vec3 vCol;',
    'varying float vSide;',
    'varying float vGlint;',
    'varying float vDir;',
    'varying float vPunch;',
    'varying float vSpark;',
    'varying float vHi;',
    'void main(){',
    '  float side = aA.x; float s = aA.y; float seed = aA.z; float w = aA.w; float t = uTime;',
    '  vec3 p = xf(wob(aPos, seed, t), seed);',
    '  vec3 n = xf(wob(aNext, seed, t), seed);',
    '  vec2 sp = p.xy / 1.25; vec2 sn = n.xy / 1.25;',
    '  sp.y -= uSink * 0.4; sn.y -= uSink * 0.4;',
    '  vec2 tg = sn - sp; float tl = length(tg);',
    '  tg = tl > 0.00001 ? tg / tl : vec2(1.0, 0.0);',
    '  vec2 nrm = vec2(-tg.y, tg.x);',
    '  float front = p.z / max(length(p), 0.001) * 0.5 + 0.5;',
    '  float depth = 0.3 + 0.7 * front;',
    '  float taper = pow(sin(3.14159 * s), 0.7);',
    '  float width = w * uWidth * taper * (0.75 + 0.5 * front);',
    '  gl_Position = vec4(sp + nrm * side * width / 1.25, 0.0, 1.0);',
    '  vSide = side;',
    '  vec2 toC = -sp; float dc = length(toC);',
    '  vDir = dc > 0.0001 ? sign(dot(nrm, toC / dc)) : 1.0;',
    '  float r = length(aPos);',
    '  float flowp = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(s * 6.0 - t * 0.9 * (0.7 + 0.6 * seed) + seed * 6.28), 2.0);',
    '  float nearC = exp(-r * r / (0.06 + 0.22 * uBlue + 0.18 * uE));',
    '  vec3 vio = mix(vec3(0.36, 0.30, 1.0), vec3(0.56, 0.22, 0.95), uViolet * (0.4 + 0.6 * fract(seed * 7.3)));',
    '  vec3 c = mix(vio, vec3(0.22, 0.52, 1.0), clamp(nearC * 1.4, 0.0, 1.0));',
    '  c = mix(c, vec3(0.80, 0.90, 1.0), nearC * 0.3);',
    '  float shell = step(2.5, aKind);',
    '  float limb = 1.0 - abs(p.z / max(length(p), 0.001));',
    '  c = mix(c, mix(vec3(0.50, 0.26, 1.0), vec3(0.66, 0.36, 1.0), fract(seed * 5.3)), shell * 0.85);',
    '  float shR = smoothstep(0.70, 0.93, r);',
    '  float hotL = pow(limb, 7.0) * shR;',
    '  c = mix(c, vec3(1.0, 0.90, 0.97), shell * min(0.4, hotL * uOuter * 0.55));',
    '  float base = aKind < 0.5 ? 0.045 : (aKind < 1.5 ? 0.10 : (aKind < 2.5 ? 0.12 : 0.24 * uShell * (0.25 + 0.75 * shR) * (0.38 + 1.55 * pow(limb, 2.4))));',
    '  float pk = fract(seed * 13.7);',
    '  float a = uAmt * base * (0.12 + 2.3 * pk * pk);',
    '  vCol = c * a * depth * flowp * (1.0 + 1.6 * nearC) * (1.0 + 0.6 * uE);',
    '  float pickG = step(0.45, fract(seed * 3.1));',
    '  float g = pow(0.5 + 0.5 * sin(s * 11.0 + seed * 30.0 - t * 0.6), 5.0);',
    '  float outerR = smoothstep(0.7, 0.95, r);',
    '  float curv = fract(aKind) / 0.45;',
    '  float pickP = step(0.72, fract(seed * 5.71));',
    '  float rim = 1.0 - abs(p.z / max(length(p), 0.001));',
    '  float vis = smoothstep(0.42, 0.52, front);',
    '  float env = pow(0.5 + 0.5 * sin(s * 3.0 + seed * 20.0 - t * 0.2), 3.0);',
    '  vPunch = 0.0 * uOuter * pickP * outerR * rim * vis * env; /* shell-v2: no white knots; edge light lives in the shell colour */',
    '  vSpark = vPunch * pow(curv, 4.0);',
    '  float pickH = step(1.5, aKind) * step(0.76, fract(seed * 9.17));',
    '  float c0 = 0.2 + 0.6 * fract(seed * 4.31);',
    '  float envH = exp(-pow((s - c0) / 0.065, 2.0)) * (0.75 + 0.25 * sin(t * 0.35 + seed * 11.0));',
    '  float rimH = smoothstep(0.15, 0.55, rim) * (1.0 - smoothstep(0.88, 1.0, rim)) * smoothstep(0.45, 0.6, front) * smoothstep(0.75, 0.95, r);',
    '  vHi = uOuter * pickH * envH * rimH * (0.15 + 1.6 * curv) * 3.2 * (1.0 + 0.5 * uE);',
    '  vGlint = (0.3 + 1.7 * curv) * uGlints * pickG * g * depth * (0.15 + 1.4 * nearC) * (1.0 - step(1.5, aKind)) * (1.0 + 0.8 * uE);',
    '}'
  ].join('\n');

  RIB_FRAG = [
    'precision mediump float;',
    'varying vec3 vCol;',
    'varying float vSide;',
    'varying float vGlint;',
    'varying float vDir;',
    'varying float vPunch;',
    'varying float vSpark;',
    'varying float vHi;',
    'void main(){',
    '  float v = vSide;',
    '  float body = exp(-v * v * 2.4);',
    '  float edge = exp(-pow(v - 0.7 * vDir, 2.0) * 45.0);',
    '  float punch = exp(-pow(v - 0.15 * vDir, 2.0) * 22.0);',
    '  vec3 col = vCol * body + vec3(0.88, 0.94, 1.0) * vGlint * edge * 0.22 + vec3(1.0, 0.95, 0.98) * vPunch * punch * 2.8 + vec3(1.0) * vSpark * exp(-v * v * 4.0) * 2.0;',
    '  float rimLine = exp(-pow(v + 0.55 * vDir, 2.0) * 16.0);',
    '  float rimSoft = exp(-pow(v + 0.2 * vDir, 2.0) * 1.6);',
    '  col += vec3(1.0, 0.93, 0.88) * vHi * (rimLine * 1.4 + rimSoft * 0.55);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // Thread pass: a few fine threads for detail.
  LINE_VERT_BODY = [
    'attribute vec3 aPos;',
    'attribute vec3 aInfo;',
    'varying vec3 vCol;',
    'void main(){',
    '  float s = aInfo.x; float seed = aInfo.y; float t = uTime;',
    '  vec3 p = xf(wob(aPos, seed, t), seed);',
    '  vec2 xy = p.xy / 1.25; xy.y -= uSink * 0.4;',
    '  gl_Position = vec4(xy, 0.0, 1.0);',
    '  float r = length(aPos);',
    '  float depth = 0.3 + 0.7 * (p.z / max(length(p), 0.001) * 0.5 + 0.5);',
    '  float flowp = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(s * 7.0 - t * 1.1 * (0.7 + 0.6 * seed) + seed * 6.28), 3.0);',
    '  float nearC = exp(-r * r / (0.06 + 0.22 * uBlue + 0.18 * uE));',
    '  vec3 c = mix(vec3(0.62, 0.55, 1.0), vec3(0.6, 0.82, 1.0), nearC);',
    '  float pick = fract(seed * 13.7);',
    '  float limb = 1.0 - abs(p.z / max(length(p), 0.001));',
    '  float sh = 1.5 * aInfo.z * uShell * smoothstep(0.70, 0.93, r) * (0.30 + 1.35 * pow(limb, 2.4));',
    '  c = mix(c, vec3(0.70, 0.48, 1.0), aInfo.z);',
    '  vCol = c * 0.05 * (uThreads * (1.0 - aInfo.z) + 1.4 * sh) * (0.2 + 2.0 * pick * pick * pick) * depth * flowp * (1.0 + nearC) * sin(3.14159 * s);',
    '}'
  ].join('\n');

  LINE_FRAG = 'precision mediump float; varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.0); }';

  QUAD_VERT = 'attribute vec2 a; varying vec2 vUv; void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }';

  // Composite: smoke + a soft round glow + the blazing core with circling light streaks.
  QUAD_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform sampler2D uT;',
    'uniform float uTime, uE, uGlow, uSat, uSink, uBloom, uCore, uBlue, uStone;',
    'float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
    'float noise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(mix(hash(i), hash(i + vec3(1.0,0.0,0.0)), f.x), mix(hash(i + vec3(0.0,1.0,0.0)), hash(i + vec3(1.0,1.0,0.0)), f.x), f.y),',
    '             mix(mix(hash(i + vec3(0.0,0.0,1.0)), hash(i + vec3(1.0,0.0,1.0)), f.x), mix(hash(i + vec3(0.0,1.0,1.0)), hash(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }',
    'void main(){',
    '  float t = uTime;',
    '  vec3 base = texture2D(uT, vUv).rgb;',
    '  vec3 b1 = texture2D(uT, vUv, 1.5).rgb;',
    '  vec3 b2 = vec3(0.0); float ws = 0.0;',
    '  for (int i = 0; i < 20; i++) {',
    '    float a = float(i) * 2.39996; float rr = sqrt(float(i) + 0.5) / 4.5;',
    '    vec2 o = vec2(cos(a), sin(a)) * rr * 0.07;',
    '    float wt = exp(-rr * rr * 2.0);',
    '    b2 += texture2D(uT, vUv + o, 3.0).rgb * wt; ws += wt;',
    '  }',
    '  b2 /= ws;',
    '  vec3 col = base * 1.12 + b1 * 0.32 + b2 * 0.55 * uBloom;',
    '  col = max(col - 0.018, 0.0) * 1.08;',
    '  vec2 uv = (vUv - 0.5) * 2.5;',
    '  uv.y += uSink * 0.6;',
    '  float d = length(uv);',
    '  float ang = atan(uv.y, uv.x);',
    '  float flick = 0.85 + 0.3 * noise(vec3(uv * 7.0, t * 0.8));',
    '  float hot = exp(-d * d / 0.0035) * flick;',
    '  float inner = exp(-d * d / (0.02 + 0.02 * uE));',
    '  float halo = exp(-d * d / (0.10 + 0.18 * uBlue + 0.12 * uE));',
    '  float streak = 0.0;',
    '  for (int k = 0; k < 3; k++) {',
    '    float fk = float(k);',
    '    float rad = 0.07 + 0.05 * fk + 0.015 * sin(ang * 3.0 + t * (1.0 + 0.3 * fk));',
    '    float arc = pow(max(0.0, sin(ang + t * (0.7 - 0.45 * fk) + fk * 2.1)), 8.0);',
    '    streak += exp(-pow(d - rad, 2.0) / 0.0007) * arc;',
    '  }',
    '  float pin = exp(-d * d / 0.0009) * flick;',
    '  vec3 hotC = mix(vec3(0.95, 0.98, 1.0), vec3(0.30, 0.62, 1.0), uStone);',
    '  vec3 innerC = mix(vec3(0.45, 0.75, 1.0), vec3(0.08, 0.36, 1.0), uStone);',
    '  vec3 core = vec3(0.95, 0.98, 1.0) * pin * 1.2 + hotC * hot * mix(1.8, 1.3, uStone) + innerC * inner * mix(1.1, 1.4, uStone) + vec3(0.7, 0.88, 1.0) * streak * 0.9 + vec3(0.18, 0.42, 1.0) * halo * 0.28;',
    '  col += core * uCore * (1.0 + 0.9 * uE);',
    '  col += vec3(0.12, 0.38, 1.0) * uE * 0.1 * exp(-pow(d - 1.0, 2.0) / 0.25);',
    '  col *= uGlow;',
    '  float gray = dot(col, vec3(0.299, 0.587, 0.114));',
    '  col = mix(vec3(gray), col, min(1.4, uSat * 1.22));',
    '  col = 1.0 - exp(-col * 1.3);',
    '  float g2 = dot(col, vec3(0.299, 0.587, 0.114));',
    '  col = clamp(mix(vec3(g2), col, 1.0 + 0.6 * uStone * uSat * (inner + 0.5 * hot)), 0.0, 1.0);',
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
  tap = () => { if (this.suppressTap) { this.suppressTap = false; return; } this.boostUntil = performance.now() + 700; if (!this.pulseAt || performance.now() - this.pulseAt > 300) this.pulseAt = performance.now(); };


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
  MKEY = 'auralith';
  num(v, d) { return typeof v === 'number' && !isNaN(v) ? v : d; }
  A(v) { return Math.max(0, Math.min(1, v)).toFixed(3); }

  // ---- Paths traced once along a curl-noise current ----

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

  build() {
    let sd = 29;
    const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const ball = (rMin, rMax) => {
      const u = rnd() * 2 - 1, th = rnd() * 6.2832, rr = Math.sqrt(1 - u * u), d = rMin + (rMax - rMin) * Math.cbrt(rnd());
      return [Math.cos(th) * rr * d, u * d, Math.sin(th) * rr * d];
    };
    const trace = (p, steps, h, rLo, rHi, ax) => {
      const pts = [p];
      for (let i = 0; i < steps; i++) {
        const c = this.curl(p[0], p[1], p[2]);
        let v = [c[0], c[1], c[2]];
        let r = Math.hypot(p[0], p[1], p[2]) || 1;
        if (ax) {
          const sw = [ax[1] * p[2] - ax[2] * p[1], ax[2] * p[0] - ax[0] * p[2], ax[0] * p[1] - ax[1] * p[0]];
          const cm = Math.hypot(c[0], c[1], c[2]) || 1;
          const ws = ax[3] || 2.2, wc = ax[4] || 0.9;
          v = [sw[0] * ws + c[0] / cm * wc, sw[1] * ws + c[1] / cm * wc, sw[2] * ws + c[2] / cm * wc];
          const dot = (v[0] * p[0] + v[1] * p[1] + v[2] * p[2]) / r;
          v = [v[0] - dot * p[0] / r, v[1] - dot * p[1] / r, v[2] - dot * p[2] / r];
        }
        const m = Math.hypot(v[0], v[1], v[2]) || 1;
        p = [p[0] + v[0] / m * h, p[1] + v[1] / m * h, p[2] + v[2] / m * h];
        r = Math.hypot(p[0], p[1], p[2]) || 1;
        if (r > rHi) p = p.map((q) => q * rHi / r);
        if (r < rLo) p = p.map((q) => q * rLo / r);
        const lp = pts[pts.length - 1]; if (Math.hypot(p[0] - lp[0], p[1] - lp[1], p[2] - lp[2]) < h * 0.4) break;   /* shell-v2: stalled at the limit = blob; end the strand */
        pts.push(p);
      }
      return pts;
    };

    // Ribbons: 11 floats per vertex (pos, next, side, s, seed, width, kind), 2 triangles per segment
    const rib = [];
    const addRibbon = (pts, seed, width, kind) => {
      if (pts.length < 4) return;
      const n = pts.length;
      const turn = pts.map((P, i) => {
        if (i === 0 || i === n - 1) return 0;
        const a = pts[i - 1], b = pts[i + 1];
        const d1 = [P[0] - a[0], P[1] - a[1], P[2] - a[2]], d2 = [b[0] - P[0], b[1] - P[1], b[2] - P[2]];
        const m = (Math.hypot(d1[0], d1[1], d1[2]) * Math.hypot(d2[0], d2[1], d2[2])) || 1;
        return Math.acos(Math.max(-1, Math.min(1, (d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2]) / m)));
      });
      const sm = turn.map((v, i) => (turn[Math.max(0, i - 1)] + 2 * v + turn[Math.min(n - 1, i + 1)]) / 4);
      const mx = Math.max(0.0001, ...sm);
      const curv = sm.map((v) => Math.pow(v / mx, 1.5) * Math.min(1, mx / 0.15));
      const V = (i, side) => {
        const P = pts[i];
        let N;
        if (i < n - 1) N = pts[i + 1];
        else { const q = pts[i - 1]; N = [2 * P[0] - q[0], 2 * P[1] - q[1], 2 * P[2] - q[2]]; }
        return [P[0], P[1], P[2], N[0], N[1], N[2], side, i / (n - 1), seed, width * (1 - 0.8 * Math.min(1, sm[i] / 0.5)), kind + Math.min(0.99, curv[i]) * 0.45];
      };
      for (let i = 0; i < n - 1; i++) {
        const a0 = V(i, -1), a1 = V(i, 1), b0 = V(i + 1, -1), b1 = V(i + 1, 1);
        rib.push(...a0, ...a1, ...b0, ...b0, ...a1, ...b1);
      }
    };
    // Inner mist ribbons close to the core (they take the most blue)
    for (let i = 0; i < 140; i++) addRibbon(trace(ball(0.05, 0.45), 30, 0.025, 0.03, 0.55), rnd(), 0.09 + 0.1 * rnd(), 0);
    // Main smoke ribbons through the whole sphere
    for (let i = 0; i < 195; i++) addRibbon(trace(ball(0.2, 1.0), 48, 0.028, 0.15, 1.05), rnd(), 0.035 + 0.085 * rnd(), 1);
    // shell-v2: mid strands between core and shell, so the inside is full (not a ring around a gap)
    for (let i = 0; i < 90; i++) addRibbon(trace(ball(0.35, 0.75), 44, 0.026, 0.32, 0.78), rnd(), 0.03 + 0.06 * rnd(), 1);
    // Long outer wisps that make a ragged edge
    for (let i = 0; i < 40; i++) {
      const r0 = 0.86 + rnd() * 0.1, ax = ball(1, 1), q = ball(1, 1);
      let st = [ax[1] * q[2] - ax[2] * q[1], ax[2] * q[0] - ax[0] * q[2], ax[0] * q[1] - ax[1] * q[0]];
      const sm = Math.hypot(st[0], st[1], st[2]) || 1; st = st.map((v) => v / sm * r0);
      addRibbon(trace(st, 90, 0.024, r0 - 0.15, Math.min(r0 + 0.05, 0.99), ax), rnd(), 0.018 + 0.035 * rnd(), 2);
    }
    // Shell wall: fine strands traced ON the sphere, so the edge reads as a bright tangled shell (Henry's ref)
    const onShell = (r0) => { const ax = ball(1, 1), q = ball(1, 1); let st = [ax[1] * q[2] - ax[2] * q[1], ax[2] * q[0] - ax[0] * q[2], ax[0] * q[1] - ax[1] * q[0]];
      const m = Math.hypot(st[0], st[1], st[2]) || 1; return [st.map((v) => v / m * r0), [ax[0], ax[1], ax[2], 0.7, 1.6]]; };
    for (let i = 0; i < 200; i++) { const r0 = 0.72 + 0.27 * Math.sqrt(rnd()), o = onShell(r0);   /* shell-v2: band .72-.99, denser near the rim */
      addRibbon(trace(o[0], 60 + Math.floor(rnd() * 40), 0.02, Math.max(0.70, r0 - 0.07), Math.min(r0 + 0.05, 0.99), o[1]), rnd(), 0.010 + 0.024 * rnd(), 3); }
    this.ribs = new Float32Array(rib);
    this.ribCount = rib.length / 11;

    // Fine threads: 6 floats per vertex (pos, s, seed, unused)
    const ln = [];
    const addLine = (pts, seed, kind) => {
      const n = pts.length;
      for (let i = 0; i < n - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        ln.push(a[0], a[1], a[2], i / (n - 1), seed, kind || 0, b[0], b[1], b[2], (i + 1) / (n - 1), seed, kind || 0);
      }
    };
    for (let i = 0; i < 600; i++) addLine(trace(ball(0.15, 1.0), 40, 0.02, 0.12, 1.0), rnd());
    for (let i = 0; i < 380; i++) { const r0 = 0.72 + 0.27 * Math.sqrt(rnd()), o = onShell(r0); addLine(trace(o[0], 50, 0.018, Math.max(0.70, r0 - 0.05), Math.min(r0 + 0.04, 0.99), o[1]), rnd(), 1); }
    for (let i = 0; i < 100; i++) addLine(trace(ball(0.35, 0.75), 40, 0.02, 0.32, 0.78), rnd());   /* shell-v2: mid threads */
    this.lines = new Float32Array(ln);
    this.lineCount = ln.length / 6;
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
    this.FBO = window.__obuHQ ? 1024 : (parseFloat((this.props || {}).q) || 1) <= 0.75 ? 512 : 1024; /* cost pass v1: Home orb (q .62) = 512 */
    const c = this.glCanvas;
    if (!c) return;
    const gl = c.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { this.noGl = true; return; }
    this.gl = gl;
    const head = 'uniform float uTime, uRot, uE, uSpread, uSink, uAmt, uWidth, uGlints, uBlue, uViolet, uThreads, uOuter, uShell;\n' + this.XF + '\n';
    this.ribProg = this.program(head + this.RIB_VERT_BODY, this.RIB_FRAG);
    this.lineProg = this.program(head + this.LINE_VERT_BODY, this.LINE_FRAG);
    this.quadProg = this.program(this.QUAD_VERT, this.QUAD_FRAG);
    if (!this.ribProg || !this.lineProg || !this.quadProg) { this.noGl = true; return; }

    this.build();
    this.ribBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.ribs, gl.STATIC_DRAW);
    this.lineBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.lines, gl.STATIC_DRAW);
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

    const names = ['uTime', 'uRot', 'uE', 'uSpread', 'uSink', 'uAmt', 'uWidth', 'uGlints', 'uBlue', 'uViolet', 'uThreads', 'uOuter', 'uShell'];
    this.ru = {}; names.forEach((n) => { this.ru[n] = gl.getUniformLocation(this.ribProg, n); });
    this.lu = {}; names.forEach((n) => { this.lu[n] = gl.getUniformLocation(this.lineProg, n); });
    this.ra = {
      pos: gl.getAttribLocation(this.ribProg, 'aPos'), next: gl.getAttribLocation(this.ribProg, 'aNext'),
      a: gl.getAttribLocation(this.ribProg, 'aA'), kind: gl.getAttribLocation(this.ribProg, 'aKind')
    };
    this.la = { pos: gl.getAttribLocation(this.lineProg, 'aPos'), info: gl.getAttribLocation(this.lineProg, 'aInfo') };
    this.qu = {};
    ['uT', 'uTime', 'uE', 'uGlow', 'uSat', 'uSink', 'uBloom', 'uCore', 'uBlue', 'uStone'].forEach((n) => { this.qu[n] = gl.getUniformLocation(this.quadProg, n); });
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

  setShared(U, p, st, e) {
    const gl = this.gl;
    gl.uniform1f(U.uTime, this.time);
    var _st = window.__obuSteer && this.glCanvas && this.glCanvas.closest && this.glCanvas.closest('[data-gx-you]') ? window.__obuSteer : null;   // 3.57 Galaxy roll
    gl.uniform1f(U.uRot, this.rot + (_st ? _st.yaw : 0));
    gl.uniform1f(U.uE, e);
    gl.uniform1f(U.uSpread, st.spread);
    gl.uniform1f(U.uSink, st.sink);
    gl.uniform1f(U.uAmt, this.num(p.smoke, 1));
    gl.uniform1f(U.uWidth, this.num(p.width, 1));
    gl.uniform1f(U.uGlints, this.num(p.glints, 1));
    gl.uniform1f(U.uBlue, this.num(p.blue, 0.6));
    gl.uniform1f(U.uViolet, this.num(p.violet, 0.7));
    gl.uniform1f(U.uThreads, this.num(p.threads, 0.6));
    gl.uniform1f(U.uOuter, this.num(p.outer, 1.2));
    gl.uniform1f(U.uShell, this.num(p.shell, 1));
  }

  draw(now) {
    const dt = Math.min(60, now - (this.last || now)); this.last = now;
    const target = (this.pressed || now < (this.boostUntil || 0)) ? 1 : 0;
    this.e += (target - this.e) * (target ? 0.045 : 0.022) * (dt / 16.7);
    const e = this.e;
    const p = this.mp();
    const st = this.STATES[p.state || 'calm'] || this.STATES.calm;
    const speed = this.num(p.speed, 0.5);
    this.time += dt * 0.001 * speed * (1 + 0.5 * e);
    this.rot += dt * 0.00012 * speed * (1 + 0.7 * e) + this.coast(dt);

    const gl = this.gl;
    if (gl && this.ribProg) {
      // 1. Smoke ribbons and threads into a texture, added on top of each other
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, this.FBO, this.FBO);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);

      gl.useProgram(this.ribProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ribBuf);
      const R = this.ra;
      gl.enableVertexAttribArray(R.pos); gl.vertexAttribPointer(R.pos, 3, gl.FLOAT, false, 44, 0);
      gl.enableVertexAttribArray(R.next); gl.vertexAttribPointer(R.next, 3, gl.FLOAT, false, 44, 12);
      gl.enableVertexAttribArray(R.a); gl.vertexAttribPointer(R.a, 4, gl.FLOAT, false, 44, 24);
      gl.enableVertexAttribArray(R.kind); gl.vertexAttribPointer(R.kind, 1, gl.FLOAT, false, 44, 40);
      this.setShared(this.ru, p, st, e);
      gl.drawArrays(gl.TRIANGLES, 0, this.ribCount);
      gl.disableVertexAttribArray(R.pos); gl.disableVertexAttribArray(R.next); gl.disableVertexAttribArray(R.a); gl.disableVertexAttribArray(R.kind);

      gl.useProgram(this.lineProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
      gl.enableVertexAttribArray(this.la.pos); gl.vertexAttribPointer(this.la.pos, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(this.la.info); gl.vertexAttribPointer(this.la.info, 3, gl.FLOAT, false, 24, 12);
      this.setShared(this.lu, p, st, e);
      gl.drawArrays(gl.LINES, 0, this.lineCount);
      gl.disableVertexAttribArray(this.la.pos); gl.disableVertexAttribArray(this.la.info);

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
      gl.uniform1f(Q.uCore, this.num(p.core, 1));
      gl.uniform1f(Q.uBlue, this.num(p.blue, 0.6));
      gl.uniform1f(Q.uStone, this.num(p.stone, 0.7));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // The pulse ring, drawn on top
    const f = this.fxCanvas;
    if (!f) return;
    const live = this.pulseAt && (now - this.pulseAt) / 1100 < 1; /* cost pass v1: touch the 2D layer only while a pulse runs */
    if (!live && !this.fxDirty) return;
    this.fxDirty = !!live;
    const S = this.SIZE, dpr = Math.min(window.devicePixelRatio || 1, 2) * Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1));
    if (f.width !== Math.round(S * dpr)) { f.width = Math.round(S * dpr); f.height = Math.round(S * dpr); }
    const ctx = f.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, S, S);
    if (live) {
      const k = (now - this.pulseAt) / 1100;
      if (k < 1) {
        const cx = S / 2, cy = S / 2 + st.sink * S * 0.2, R = S * 0.4 * (1 + st.spread * 0.45);
        ctx.strokeStyle = 'hsla(212,100%,74%,' + this.A(0.45 * (1 - k)) + ')';
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
