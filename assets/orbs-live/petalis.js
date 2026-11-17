/* obu live orb engine: petalis (from the design canvas OrbSakura.dc.html, 16 Nov 2026). Do not edit here: re-run the build. */
(window.__obuEng=window.__obuEng||{})["petalis"]={tpl:"<div style=\"position: relative; width: 560px; height: 560px\"> <button data-ref=\"setBtn\" aria-hidden=\"true\" tabindex=\"-1\" style=\"position: relative; width: 560px; height: 560px; padding: 0; border: none; background: transparent; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; outline: none; -webkit-user-select: none; user-select: none\"> <canvas data-ref=\"setGl\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block\"></canvas> </button> </div>",make:function(DCLogic){

// Sakura · Path III · Form 14 (Star Nursery, 530 h). sakura-orb-study.md v3.2 → engine v1 (4 Nov):
// a ball of cherry blossom on branches that all meet in one knot of stumps. Kanzan pink (Henry 4 Nov); Yozakura kept as a later variant.
// Drag = spin (orb-spin v2). Tap = local wind: blossoms, petals and branches near the tap blow out and spring back (~2 s).
// Look from Orb master (sakura_*). Transparent: the app's sky shows round it. Real geometry (WebGL 2): hero use; small views use the still.
class Component extends DCLogic {
  SIZE = 560; MKEY = 'sakura';
  PALS = {
    Kanzan:   { tip: '#ffb3cf', base: '#e2588f', cen: '#951e4c', bark: '#8a6046', glowCol: '#ffb8a0', mote: '#ffc0da' },
    Yozakura: { tip: '#ffe6ee', base: '#efa2bf', cen: '#b8335c', bark: '#7a5841', glowCol: '#ffb46e', mote: '#ffe2b8', glow: 0.85, light: 0.4 },
    Sakura:   { tip: '#ffe0ea', base: '#f39ab8', cen: '#c4345e', bark: '#8f664a', glowCol: '#ffc8b4', mote: '#ffd0e2' },
    Yoshino:  { tip: '#fff4f6', base: '#f6c4d4', cen: '#d0566f', bark: '#9a7052', glowCol: '#ffd9c0', mote: '#ffe6f0' }
  };
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
    this._mpOwn = own; this._mpVer = c.ver; this._mpV = v;
    return v;
  }
  num(v, d) { return typeof v === 'number' && !isNaN(v) ? v : d; }
  setGl = (el) => { if (el) this.watchGl(el); this.glCanvas = el; };
  setBtn = (el) => { this.btn = el; };
  watchGl(c) {
    if (!c || c.__obuWatch) return; c.__obuWatch = true;
    c.addEventListener('webglcontextlost', (e) => { e.preventDefault(); c.style.visibility = 'hidden'; if (c === this.glCanvas && !this.dead) this.reviveGl(150); }, false);
  }
  reviveGl(wait) {
    clearTimeout(this.reviveT);
    this.reviveT = setTimeout(() => {
      if (this.dead) return;
      const old = this.glCanvas; if (!old || !old.parentNode || !(this.gl && this.gl.isContextLost())) return;
      if (!this.onScreen || document.hidden) { this.reviveGl(700); return; }
      const now = Date.now(); this.revives = (this.revives || []).filter((t) => now - t < 10000);
      if (this.revives.length >= 3) return; /* too many orbs fighting for contexts: stay hidden, never flash white */
      this.revives.push(now);
      const n = document.createElement('canvas'); n.setAttribute('aria-hidden', 'true'); n.style.cssText = old.style.cssText; n.style.visibility = '';
      old.parentNode.insertBefore(n, old.nextSibling);
      this.glCanvas = n; this.gl = null; this.watchGl(n);
      if (this.io) { try { this.io.disconnect(); this.io.observe(n); } catch (e) {} }
      this.initGl(); this.lastDraw = 0;
    }, wait || 300);
  }
  hx(h) { return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]; }
  // the tree + blossoms: built once per page (seeded, same tree everywhere), GL buffers per canvas
  scene() {
    if (window.__obuSakuraGeo) return window.__obuSakuraGeo;
    let seed = 20261104;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sc = (a, s) => [a[0] * s, a[1] * s, a[2] * s], len = (a) => Math.hypot(a[0], a[1], a[2]);
    const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const rand3 = () => { const z = rnd() * 2 - 1, a = rnd() * 6.2832, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), z, r * Math.sin(a)]; };
    const shell = (d) => 0.80 + 0.07 * Math.sin(3.1 * d[0] + 1.3) * Math.cos(2.3 * d[1] - 0.4) + 0.05 * Math.sin(2.7 * d[2] + 2.1 * d[0]);
    const branches = [];
    const grow = (start, dir, L, rad, depth, lvl) => {
      const n = 8, pts = []; let p = start.slice(), d = nrm(dir);
      for (let i = 0; i <= n; i++) { pts.push({ p: p.slice(), r: rad * (1 - 0.42 * i / n) }); if (i === n) break;
        const out = len(p) > 0.02 ? nrm(p) : d; d = nrm(add(add(d, sc(out, 0.22)), sc(rand3(), 0.32))); p = add(p, sc(d, L / n)); }
      branches.push({ pts, lvl });
      const end = pts[n], R = len(end.p), S = shell(nrm(end.p));
      if (R > S * 0.74 || depth <= 0) return;
      let k = lvl === 0 ? 3 : 2; if (rnd() < 0.35) k++;
      for (let j = 0; j < k; j++) { const cd = nrm(add(add(d, sc(rand3(), 0.85)), sc(nrm(end.p), 0.55))); grow(end.p, cd, L * 0.8, end.r * (0.82 + 0.1 * rnd()), depth - 1, lvl + 1); }
    };
    const LIMBS = 9;
    for (let i = 0; i < LIMBS; i++) { const y = 1 - 2 * (i + 0.5) / LIMBS, r = Math.sqrt(1 - y * y), a = i * 2.39996 + 0.4;
      const d = nrm(add([r * Math.cos(a), y, r * Math.sin(a)], sc(rand3(), 0.25))); grow(sc(d, 0.03), d, 0.30, 0.05, 5, 0); }
    const stubs = [];
    for (let i = 0; i < 7; i++) { const d = rand3(), pts = []; let p = [0, 0, 0], dd = d;
      for (let j = 0; j <= 5; j++) { pts.push({ p: p.slice(), r: 0.085 * (1 - 0.55 * j / 5) }); dd = nrm(add(dd, sc(rand3(), 0.5))); p = add(p, sc(dd, 0.035)); }
      stubs.push({ pts }); }
    const bPos = [], bNor = [], bUV = [], bIdx = [];
    const tube = (pts) => {
      const S = 8, base = bPos.length / 3;
      const t0 = nrm(add(pts[1].p, sc(pts[0].p, -1))), ref = Math.abs(t0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let nn = nrm(cross(ref, t0)), acc = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(i - 1, 0)].p, b = pts[Math.min(i + 1, pts.length - 1)].p, t = nrm(add(b, sc(a, -1)));
        nn = nrm(cross(t, cross(nn, t))); const bb = cross(t, nn);
        if (i > 0) acc += len(add(pts[i].p, sc(pts[i - 1].p, -1)));
        for (let s = 0; s <= S; s++) { const ang = s / S * 6.2832, gn = 1 + 0.13 * Math.sin(ang * 3 + i * 1.7) + 0.06 * Math.sin(ang * 5 - i);
          const N = add(sc(nn, Math.cos(ang)), sc(bb, Math.sin(ang))), P = add(pts[i].p, sc(N, pts[i].r * gn));
          bPos.push(...P); bNor.push(...N); bUV.push(s / S, acc); }
      }
      for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s < S; s++) { const a = base + i * (S + 1) + s, b = a + S + 1; bIdx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    const ball = (c, r, bumpy) => {
      const W = 10, H = 6, base = bPos.length / 3;
      for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) { const th = y / H * Math.PI, ph = x / W * 6.2832;
        const N = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)], k = bumpy ? 1 + 0.18 * Math.sin(ph * 3 + th * 4) * Math.sin(th * 3) : 1;
        bPos.push(...add(c, sc(N, r * k))); bNor.push(...N); bUV.push(x / W, y / H * r * 3); }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = base + y * (W + 1) + x, b = a + W + 1; bIdx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    const CL = [], NC = 78;
    for (let i = 0; i < NC; i++) { const y = 1 - 2 * (i + 0.5) / NC, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const d = nrm(add([r * Math.cos(a), y, r * Math.sin(a)], sc(rand3(), 0.12))); CL.push({ c: sc(d, shell(d) * 1.07 + 0.05 * rnd()), R: 0.14 + 0.08 * rnd() }); }
    { const M = 1500; for (let i = 0; i < M; i++) { const y = 1 - 2 * (i + 0.5) / M, r = Math.sqrt(1 - y * y), a = i * 2.39996, d = [r * Math.cos(a), y, r * Math.sin(a)];
      const p = sc(d, shell(d) * 1.1); let gap = 1e9; for (const k of CL) gap = Math.min(gap, len(add(p, sc(k.c, -1))) - k.R * 0.8);
      if (gap > 0.06) CL.push({ c: sc(d, shell(d) * 1.07 + 0.04 * rnd()), R: 0.1 + 0.04 * rnd() }); } }
    const F = [];
    const flower = (pos, n, size, ao, spd, ph) => { F.push(...pos, ...n, size, rnd() * 6.2832, ao, rnd(), spd, ph); };
    for (const k of CL) {
      const N = Math.floor(k.R * k.R * 5600), kc = nrm(k.c), spd = (0.08 + 0.1 * rnd()) * (rnd() < 0.5 ? 1 : -1), ph = rnd() * 6.2832;
      for (let i = 0; i < N; i++) { const u = rand3(), rr = k.R * Math.pow(rnd(), 0.4); if (dot(u, kc) < -0.5) continue;
        const p = add(k.c, sc(u, rr)), L = len(p); if (L < 0.7) continue;
        const n = nrm(add(add(sc(u, 0.8), sc(nrm(p), 0.6)), sc(rand3(), 0.6))), ao = (0.55 + 0.45 * rr / k.R) * Math.min(1, Math.max(0, (L - 0.6) / 0.4));
        flower(p, n, (rnd() < 0.12 ? 0.6 : 1) * (0.02 + 0.008 * rnd()), ao, spd, ph); }
    }
    for (let i = 0; i < 1300; i++) { const d = rand3(), p = sc(d, shell(d) * (0.98 + 0.38 * rnd()));
      flower(p, nrm(add(d, sc(rand3(), 0.9))), 0.017 + 0.006 * rnd(), 0.95, (0.06 + 0.12 * rnd()) * (rnd() < 0.5 ? 1 : -1), rnd() * 6.2832); }
    ball([0, 0, 0], 0.10, true);
    for (const s of stubs) { tube(s.pts); ball(s.pts[s.pts.length - 1].p, s.pts[s.pts.length - 1].r, false); }
    for (const br of branches) { tube(br.pts); ball(br.pts[0].p, br.pts[0].r * 1.02, false); }
    const PN = 700, P = []; for (let i = 0; i < PN; i++) P.push(0, 0, 0, rnd(), rnd(), rnd(), rnd());
    const MA = []; for (let i = 0; i < 70; i++) MA.push(rnd(), rnd(), rnd(), rnd());
    const grid = (n) => { const v = [], ix = []; for (let y = 0; y <= n; y++) for (let x = 0; x <= n; x++) v.push(x / n * 2 - 1, y / n * 2 - 1);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const a = y * (n + 1) + x, b = a + n + 1; ix.push(a, b, a + 1, a + 1, b, b + 1); } return { v: new Float32Array(v), i: new Uint16Array(ix) }; };
    return (window.__obuSakuraGeo = { bPos: new Float32Array(bPos), bNor: new Float32Array(bNor), bUV: new Float32Array(bUV), bIdx: new Uint32Array(bIdx),
      F: new Float32Array(F), FN: F.length / 12, P: new Float32Array(P), PN, MA: new Float32Array(MA), MN: 70, g2: grid(2) });
  }
  initGl() {
    const c = this.glCanvas; if (!c) return;
    const qq = Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1));
    const px = Math.max(64, Math.min(window.__obuHQ ? 4096 : 448, Math.round(this.SIZE * Math.min(window.devicePixelRatio || 1, 2) * qq)));   /* v3.387 orb-lag-fix: cap 448 */
    c.width = px; c.height = px;
    const gl = c.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { this.noGl = true; return; }
    try { this.setup(gl, px); } catch (e) { console.warn(e); this.noGl = true; return; }
    this.gl = gl; c.style.visibility = '';
  }
  setup(gl, W) {
    const G = this.scene();
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const prog = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); } return { p, u }; };
    const buf = (data, loc, size, div, target) => { const b = gl.createBuffer(); gl.bindBuffer(target || gl.ARRAY_BUFFER, b); gl.bufferData(target || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      if (loc != null) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); if (div) gl.vertexAttribDivisor(loc, div); } return b; };
    const COMMON = `
uniform vec3 uL; uniform vec3 uCam; uniform float uGlow; uniform vec3 uGlowCol; uniform float uTime; uniform float uMyst;
vec3 toLin(vec3 c){return pow(c,vec3(2.2));}
vec3 tone(vec3 x){x*=1.05;vec3 a=(x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14);return pow(clamp(a,0.,1.),vec3(1./2.2));}
float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vnoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float canopy(vec3 w){float d=length(w);vec3 n=w/max(d,1e-3);
 float side=smoothstep(-0.95,0.75,dot(n,normalize(uL)));float depth=smoothstep(0.25,1.0,d);
 return mix(0.13,1.0,side)*mix(0.3,1.0,depth);}
vec3 coreLight(vec3 w,vec3 N){float d=length(w);vec3 toC=-w/max(d,1e-3);
 return uGlow*toLin(uGlowCol)*(0.35+0.65*max(dot(N,toC),0.))*(1.4/(1.0+5.0*d*d));}
`;
    const TAP = `uniform vec3 uTapP,uTapW;uniform float uTapT;
vec3 tapPush(vec3 p){vec3 d=p-uTapP;float f=exp(-dot(d,d)*7.0);float t=uTapT;float k=step(0.,t)*exp(-t*1.4)*sin(t*6.5+0.5);return f*k*0.11*(normalize(d+vec3(1e-4))*0.55+uTapW);}`;
    const br = prog(`#version 300 es
layout(location=0) in vec3 aP;layout(location=1) in vec3 aN;layout(location=2) in vec2 aUV;
uniform mat4 uVP;uniform float uTime,uSway;out vec3 vW,vN;out vec2 vUV;
${TAP}
void main(){vec3 p=aP;float L=length(p);float ph=dot(p,vec3(3.1,2.3,2.7));
 p+=vec3(sin(uTime*1.3+ph),sin(uTime*1.1+ph*1.3)*0.5,cos(uTime*1.2+ph*.8))*uSway*L*L*0.6;
 p+=tapPush(p)*0.55*smoothstep(0.15,0.65,L);
 vW=p;vN=aN;vUV=aUV;gl_Position=uVP*vec4(p,1);}`, `#version 300 es
precision highp float;in vec3 vW,vN;in vec2 vUV;out vec4 o;uniform vec3 uBark;
${COMMON}
void main(){vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);
 float g=vnoise(vec3(vUV.x*7.0,vUV.y*26.0,0.0))*0.6+vnoise(vW*55.)*0.4;
 float ridge=0.55+0.45*smoothstep(0.25,0.75,vnoise(vec3(vUV.x*12.0+g*2.,vUV.y*9.,3.)));
 float dC=length(vW);
 vec3 base=mix(toLin(uBark*0.4),toLin(uBark),smoothstep(0.05,0.6,dC))*(0.7+0.45*g)*ridge;
 base+=toLin(min(uBark*1.35,vec3(1.)))*smoothstep(0.55,0.9,ridge*g)*0.3;
 float patchN=vnoise(vW*7.0+vec3(vUV.x*1.5,0.,0.))*0.7+vnoise(vec3(vUV.x*4.,vUV.y*3.,7.))*0.3;
 base=mix(base,toLin(vec3(0.16,0.10,0.07))*(0.75+0.5*g),smoothstep(0.42,0.62,patchN)*0.85);
 base=mix(base,toLin(vec3(0.13,0.08,0.06)),smoothstep(0.85,0.95,1.0-ridge+0.4)*0.5);
 float dif=max(dot(N,uL),0.)*0.9+0.18*(N.y*.5+.5);
 float rim=pow(1.-max(dot(N,V),0.),3.)*0.25;
 vec3 c=base*(dif*(canopy(vW)*0.55+0.45)*vec3(1.0,0.95,0.9)*1.5+0.1)+base*coreLight(vW,N)*1.6+rim*base*1.5;
 c+=toLin(uGlowCol)*uGlow*1.2*smoothstep(0.24,0.0,dC);
 o=vec4(tone(c),1);}`);
    const fl = prog(`#version 300 es
layout(location=0) in vec2 aUV;layout(location=1) in vec3 iP;layout(location=2) in vec3 iN;layout(location=3) in vec4 iA;layout(location=4) in vec2 iB;
uniform mat4 uVP;uniform float uTime,uSway,uOrb;out vec2 vUV;out vec3 vW,vN;out float vAO,vVar;
${TAP}
void main(){float an=uOrb*0.07+sin(uTime*(0.18+abs(iB.x))+iB.y)*0.06;float ca=cos(an),sa=sin(an);
 vec3 P0=vec3(ca*iP.x+sa*iP.z,iP.y,-sa*iP.x+ca*iP.z);
 P0.y+=sin(uTime*0.55+iB.y)*0.04;P0+=vec3(sin(uTime*0.37+iB.y*3.),0.,cos(uTime*0.31+iB.y*5.))*0.015;P0*=1.0+0.02*sin(uTime*0.42+iB.y*2.0);
 vec3 n=normalize(iN);n=vec3(ca*n.x+sa*n.z,n.y,-sa*n.x+ca*n.z);vec3 up=abs(n.y)<0.95?vec3(0,1,0):vec3(1,0,0);
 vec3 t=normalize(cross(up,n));vec3 b=cross(n,t);
 float rt=iA.y+uTime*0.3*(iA.w-0.5);float s=iA.x,c=cos(rt),sn=sin(rt);vec2 r=vec2(c*aUV.x-sn*aUV.y,sn*aUV.x+c*aUV.y);
 vec3 tb=t*r.x+b*r.y;
 vec3 p=P0+tb*s+n*(s*0.34*dot(aUV,aUV));
 float L=length(P0);float ph=dot(iP,vec3(3.1,2.3,2.7));
 p+=vec3(sin(uTime*1.3+ph),sin(uTime*1.1+ph*1.3)*0.5,cos(uTime*1.2+ph*.8))*uSway*L*L*0.6;
 p+=n*sin(uTime*2.3+ph*3.)*0.002;
 p+=tapPush(p);
 vUV=aUV;vW=p;vN=normalize(n-tb*0.62);vAO=iA.z;vVar=iA.w;gl_Position=uVP*vec4(p,1);}`, `#version 300 es
precision highp float;in vec2 vUV;in vec3 vW,vN;in float vAO,vVar;out vec4 o;uniform vec3 uTip,uBase,uCen;
${COMMON}
void main(){vec2 uv=vUV;float r=length(uv);float a=atan(uv.y,uv.x);
 float sec=1.2566371;float f=mod(a+sec*.5,sec)-sec*.5;vec2 q=vec2(cos(f),sin(f))*r;
 float e=length(vec2((q.x-0.46)/0.54,q.y/0.37));
 float w=fwidth(e)*1.1;float al=smoothstep(1.+w,1.-w,e);
 float nd=length(vec2(q.x-1.0,q.y*1.25));float w2=fwidth(nd);
 al*=smoothstep(0.11-w2,0.11+w2,nd);
 al=max(al,smoothstep(0.22+fwidth(r),0.22-fwidth(r),r));
 if(al<0.03)discard;
 vec3 tip=mix(uTip,vec3(1.),vVar*0.25),bas=uBase;
 vec3 col=mix(bas,tip,smoothstep(0.12,0.8,r));
 col=mix(col,uCen,smoothstep(0.26,0.04,r)*0.55);
 float vein=0.5+0.5*cos(q.y*70.0/(0.3+r));
 col*=1.0-0.07*smoothstep(0.25,0.9,r)*vein;
 float sec2=0.5236;float f2=mod(a+sec2*.5,sec2)-sec2*.5;
 float fil=smoothstep(0.035,0.0,abs(f2)*r)*smoothstep(0.36,0.3,r)*step(0.08,r);
 col=mix(col,mix(col,uCen,0.6),fil*0.5);
 col=mix(col,vec3(1.0,0.86,0.55),smoothstep(0.05,0.0,length(vec2(r-0.33,abs(f2)*r)))*0.5);
 col*=0.9+0.2*vVar;
 vec3 lc=toLin(col);
 vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.)N=-N;
 float dif=max(dot(N,uL),0.);float tr=max(dot(-N,uL),0.)*0.55;
 vec3 amb=mix(vec3(0.42,0.36,0.48),vec3(0.75,0.7,0.82),N.y*.5+.5);
 float sh=canopy(vW);
 vec3 c=lc*(amb*0.3*vAO*mix(0.6,1.,sh)+(dif*1.25+tr*vec3(1.,0.75,0.82))*sh*mix(0.5,1.,vAO));
 c+=lc*coreLight(vW,N)*1.2;
 c+=lc*pow(1.-max(dot(N,V),0.),2.5)*0.18*sh;
 c+=lc*uMyst*(0.04+0.2*pow(1.-max(dot(N,V),0.),2.));
 o=vec4(tone(c),al);}`);
    const pt = prog(`#version 300 es
layout(location=0) in vec2 aUV;layout(location=1) in vec3 iS;layout(location=2) in vec4 iR;
uniform mat4 uVP;uniform float uTime,uDens,uOrb;out vec2 vUV;out vec3 vW,vN;out float vF,vVar;
${TAP}
vec3 rot(vec3 v,vec3 k,float a){float c=cos(a),s=sin(a);return v*c+cross(k,v)*s+k*dot(k,v)*(1.-c);}
void main(){
 vec3 ax=normalize(vec3((iR.x-.5)*1.1,1.0,(iR.z-.5)*1.1));
 vec3 u=normalize(cross(ax,abs(ax.x)<0.9?vec3(1,0,0):vec3(0,0,1)));vec3 v=cross(ax,u);
 float r=0.66+0.5*pow(iR.z,1.3)+0.04*sin(uTime*0.5+iR.x*30.);
 float a=iR.y*6.2832+uOrb*(0.22+0.4*iR.w)*(1.3-0.4*(r-0.66));
 vec3 p=(u*cos(a)+v*sin(a))*r+ax*sin(uTime*0.35+iR.x*40.)*0.12;
 vec3 tax=normalize(vec3(iR.x-.5,iR.y-.4,iR.z-.5)+1e-3);float ang=uTime*(1.2+2.0*iR.w)+iR.x*6.;
 float s=0.02+0.007*iR.z;
 vec3 lp=vec3(aUV.x*s,aUV.y*s*0.62,s*0.3*aUV.y*aUV.y);
 vec3 ln=normalize(vec3(0,-aUV.y*0.6,1));
 p+=tapPush(p)*1.6;
 vec3 w=p+rot(lp,tax,ang);
 vN=rot(ln,tax,ang);vW=w;vUV=aUV;vVar=iR.w;
 float th=fract(iR.x*7.31+iR.z*3.7);
 vF=smoothstep(th-0.06,th,uDens);
 gl_Position=uVP*vec4(w,1);}`, `#version 300 es
precision highp float;in vec2 vUV;in vec3 vW,vN;in float vF,vVar;out vec4 o;uniform vec3 uTip,uBase;
${COMMON}
void main(){vec2 uv=vUV;float x=uv.x*0.5+0.5;
 float wdt=0.12+0.88*sqrt(clamp(x*1.05,0.,1.))*(1.0-0.25*x*x);
 float e=length(vec2(uv.x,uv.y/wdt));
 float w=fwidth(e)*1.1;float al=smoothstep(1.+w,1.-w,e);
 float nd=length(vec2(uv.x-1.0,uv.y*1.2));float w2=fwidth(nd);al*=smoothstep(0.2-w2,0.2+w2,nd);
 al*=vF;if(al<0.03)discard;
 vec3 col=mix(uBase,mix(uTip,vec3(1.),vVar*0.25),smoothstep(-0.9,0.5,uv.x));
 vec3 lc=toLin(col);vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.)N=-N;
 float dif=max(dot(N,uL),0.);float tr=max(dot(-N,uL),0.)*0.6;
 vec3 c=lc*(0.32+dif*1.15+tr*vec3(1.,.75,.82))+lc*coreLight(vW,N)*0.6+lc*uMyst*0.2;
 o=vec4(tone(c),al);}`);
    const mo = prog(`#version 300 es
layout(location=0) in vec4 aM;uniform mat4 uVP;uniform float uTime,uPx;out float vA;
void main(){vec3 d=normalize(aM.xyz-0.5);float r=0.8+0.55*aM.w;float an=uTime*(0.04+0.06*aM.w);
 float c=cos(an),s=sin(an);vec3 p=vec3(c*d.x+s*d.z,d.y,-s*d.x+c*d.z)*r;p.y+=sin(uTime*0.5+aM.w*20.)*0.08;
 gl_Position=uVP*vec4(p,1);gl_PointSize=uPx*(1.0+2.2*fract(aM.w*13.7))/gl_Position.w;
 vA=0.35+0.65*(0.5+0.5*sin(uTime*(0.7+aM.w)+aM.x*30.));}`, `#version 300 es
precision highp float;in float vA;out vec4 o;uniform vec3 uCol;uniform float uMyst;
void main(){vec2 c=gl_PointCoord-0.5;float d=dot(c,c);float a=(exp(-d*40.)+0.5*exp(-d*9.))*vA*uMyst;o=vec4(uCol*a,a);}`);
    const FSV = `#version 300 es
out vec2 v;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);v=p;gl_Position=vec4(p*2.-1.,0,1);}`;
    const dn = prog(FSV, `#version 300 es
precision highp float;in vec2 v;out vec4 o;uniform sampler2D t;uniform vec2 px;uniform float th;
void main(){vec3 c=(texture(t,v+px*vec2(-1,-1)).rgb+texture(t,v+px*vec2(1,-1)).rgb+texture(t,v+px*vec2(-1,1)).rgb+texture(t,v+px*vec2(1,1)).rgb)*0.25;
 if(th>0.){float l=max(c.r,max(c.g,c.b));c*=smoothstep(th,th+0.3,l);}o=vec4(c,1);}`);
    const bl = prog(FSV, `#version 300 es
precision highp float;in vec2 v;out vec4 o;uniform sampler2D t;uniform vec2 dir;
void main(){vec3 c=texture(t,v).rgb*0.227;c+=(texture(t,v+dir*1.3846).rgb+texture(t,v-dir*1.3846).rgb)*0.316;
 c+=(texture(t,v+dir*3.2308).rgb+texture(t,v-dir*3.2308).rgb)*0.07;o=vec4(c,1);}`);
    // composite: the scene is premultiplied over transparent; bloom = screen blend, and its light also lifts alpha so the glow shows on the app's sky
    const co = prog(FSV, `#version 300 es
precision highp float;in vec2 v;out vec4 o;uniform sampler2D t0,t1,t2;uniform float k1,k2;
void main(){vec4 b=texture(t0,v);vec3 g=min(texture(t1,v).rgb*k1+texture(t2,v).rgb*k2,vec3(1.));
 vec3 c=1.-(1.-b.rgb)*(1.-g);float a=max(b.a,max(g.r,max(g.g,g.b)));o=vec4(min(c,vec3(a)),a);}`);
    const mkTex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
    const S = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const ms = gl.createFramebuffer(), cb = gl.createRenderbuffer(), db = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, cb); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, S, gl.RGBA8, W, W);
    gl.bindRenderbuffer(gl.RENDERBUFFER, db); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, S, gl.DEPTH_COMPONENT24, W, W);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ms); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, cb); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, db);
    const h = Math.max(1, W >> 1), q = Math.max(1, W >> 2);
    const RT = { ms, W, H: W, base: mkTex(W, W), h1: mkTex(h, h), h2: mkTex(h, h), q1: mkTex(q, q), q2: mkTex(q, q) };
    const brVAO = gl.createVertexArray(); gl.bindVertexArray(brVAO);
    buf(G.bPos, 0, 3); buf(G.bNor, 1, 3); buf(G.bUV, 2, 2); buf(G.bIdx, null, 0, 0, gl.ELEMENT_ARRAY_BUFFER);
    const flVAO = gl.createVertexArray(); gl.bindVertexArray(flVAO); buf(G.g2.v, 0, 2);
    { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, G.F, gl.STATIC_DRAW);
      [[1, 3, 0], [2, 3, 12], [3, 4, 24], [4, 2, 40]].forEach(([l, s, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 48, o); gl.vertexAttribDivisor(l, 1); }); }
    buf(G.g2.i, null, 0, 0, gl.ELEMENT_ARRAY_BUFFER);
    const ptVAO = gl.createVertexArray(); gl.bindVertexArray(ptVAO); buf(G.g2.v, 0, 2);
    { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, G.P, gl.STATIC_DRAW);
      [[1, 3, 0], [2, 4, 12]].forEach(([l, s, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 28, o); gl.vertexAttribDivisor(l, 1); }); }
    buf(G.g2.i, null, 0, 0, gl.ELEMENT_ARRAY_BUFFER);
    const moVAO = gl.createVertexArray(); gl.bindVertexArray(moVAO); buf(G.MA, 0, 4);
    gl.bindVertexArray(null);
    this.R = { G, br, fl, pt, mo, dn, bl, co, RT, brVAO, flVAO, ptVAO, moVAO };
  }
  // tap: ray from the camera through the finger onto the ball (r 0.95) = where the wind hits
  tapAt(cx, cy) { this._fastUntil = performance.now() + 2500;
    const b = this.btn && this.btn.getBoundingClientRect ? this.btn.getBoundingClientRect() : null, cam = this.cam; if (!b || !cam) return;
    const x = ((cx - b.left) / b.width) * 2 - 1, y = 1 - ((cy - b.top) / b.height) * 2;
    const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot = (a, c) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    const f = nrm([cam.at[0] - cam.eye[0], cam.at[1] - cam.eye[1], cam.at[2] - cam.eye[2]]), rt = nrm([f[1] * 0 - f[2] * 1, f[2] * 0 - f[0] * 0, f[0] * 1 - f[1] * 0]);
    const uu = [rt[1] * f[2] - rt[2] * f[1], rt[2] * f[0] - rt[0] * f[2], rt[0] * f[1] - rt[1] * f[0]], th = Math.tan(cam.fov / 2);
    const d = nrm([f[0] + rt[0] * x * th + uu[0] * y * th, f[1] + rt[1] * x * th + uu[1] * y * th, f[2] + rt[2] * x * th + uu[2] * y * th]);
    const bb = dot(cam.eye, d), c = dot(cam.eye, cam.eye) - 0.95 * 0.95, disc = bb * bb - c, t = disc > 0 ? -bb - Math.sqrt(disc) : -bb;
    this.tapP = [cam.eye[0] + d[0] * t, cam.eye[1] + d[1] * t, cam.eye[2] + d[2] * t]; this.tapT0 = this.time; this.tapW = [rt[0] * 0.5, rt[1] * 0.5, rt[2] * 0.5];
    this.gust = Math.max(this.gust || 0, 0.35);
  }
  press = (e) => { this.sDown(e); this._dn = { x: e.clientX, y: e.clientY }; };
  onHold = () => { if (this._dn) this.tapAt(this._dn.x, this._dn.y); };
  move = (e) => { this.spinA = (this.spinA || 0) + this.sMove(e); };
  release = () => { const r = this.sUp(); if (r === 'tap' && this._dn) this.tapAt(this._dn.x, this._dn.y); this._dn = null; };
  draw() {
    const gl = this.gl, R = this.R; if (!gl || !R) return;
    const p = this.mp(), G = R.G, RT = R.RT, T = this.time;
    const Pl = this.PALS[p.palette] || this.PALS.Kanzan, hx = (h) => this.hx(h);
    const mul = (a, b) => { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
    const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dt3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const yaw = 0.6 - T * 0.12 - (this.spinA || 0),   /* v3.372 spin-same: drag + idle turn right like every orb */ pitch = 0.12, fov = 0.62, dist = 4.5 / Math.max(0.5, this.num(p.size, 1));
    const eye = [Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist], at = [0, -0.04, 0];
    this.cam = { eye, at, fov };
    const z = nrm([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]), xx = nrm(crs([0, 1, 0], z)), yy = crs(z, xx);
    const V = [xx[0], yy[0], z[0], 0, xx[1], yy[1], z[1], 0, xx[2], yy[2], z[2], 0, -dt3(xx, eye), -dt3(yy, eye), -dt3(z, eye), 1];
    const t = 1 / Math.tan(fov / 2), n0 = 0.1, f0 = 30, Pm = [t, 0, 0, 0, 0, t, 0, 0, 0, 0, (f0 + n0) / (n0 - f0), -1, 0, 0, 2 * f0 * n0 / (n0 - f0), 0];
    const VP = mul(Pm, V), L = nrm([Math.sin(yaw - 1.0) * 0.9, 0.75, Math.cos(yaw - 1.0) * 0.9]), lk = Pl.light != null ? Pl.light : 1;
    const myst = this.num(p.mystic, 0.6), glow = (Pl.glow != null ? Pl.glow : this.num(p.glow, 0.6)) * 1.4 * (0.92 + 0.08 * Math.sin(T * 1.7));
    const sway = 0.0035 + (this.gust || 0) * 0.02, tapP = this.tapP || [0, 0, 9], tapW = this.tapW || [0, 0, 0], tapT = T - (this.tapT0 == null ? -99 : this.tapT0);
    const common = (pr) => { const u = pr.u; gl.uniformMatrix4fv(u.uVP, false, VP); u.uL && gl.uniform3fv(u.uL, [L[0] * lk, L[1] * lk, L[2] * lk]); u.uCam && gl.uniform3fv(u.uCam, eye);
      u.uGlow && gl.uniform1f(u.uGlow, glow); u.uGlowCol && gl.uniform3fv(u.uGlowCol, hx(Pl.glowCol)); u.uTime && gl.uniform1f(u.uTime, T); u.uSway && gl.uniform1f(u.uSway, sway);
      u.uMyst && gl.uniform1f(u.uMyst, myst); u.uOrb && gl.uniform1f(u.uOrb, this.orbT); u.uTapP && gl.uniform3fv(u.uTapP, tapP); u.uTapT && gl.uniform1f(u.uTapT, tapT); u.uTapW && gl.uniform3fv(u.uTapW, tapW); };
    gl.bindFramebuffer(gl.FRAMEBUFFER, RT.ms); gl.viewport(0, 0, RT.W, RT.H);
    gl.clearColor(0, 0, 0, 0); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(R.br.p); common(R.br); gl.uniform3fv(R.br.u.uBark, hx(Pl.bark));
    gl.bindVertexArray(R.brVAO); gl.drawElements(gl.TRIANGLES, G.bIdx.length, gl.UNSIGNED_INT, 0);
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.useProgram(R.fl.p); common(R.fl); gl.uniform3fv(R.fl.u.uTip, hx(Pl.tip)); gl.uniform3fv(R.fl.u.uBase, hx(Pl.base)); gl.uniform3fv(R.fl.u.uCen, hx(Pl.cen));
    gl.bindVertexArray(R.flVAO); gl.drawElementsInstanced(gl.TRIANGLES, G.g2.i.length, gl.UNSIGNED_SHORT, 0, G.FN);
    gl.useProgram(R.pt.p); common(R.pt); gl.uniform3fv(R.pt.u.uTip, hx(Pl.tip)); gl.uniform3fv(R.pt.u.uBase, hx(Pl.base));
    gl.uniform1f(R.pt.u.uDens, this.dens); gl.bindVertexArray(R.ptVAO); gl.drawElementsInstanced(gl.TRIANGLES, G.g2.i.length, gl.UNSIGNED_SHORT, 0, G.PN);
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.useProgram(R.mo.p); common(R.mo); gl.uniform1f(R.mo.u.uPx, RT.H * 0.016); gl.uniform3fv(R.mo.u.uCol, hx(Pl.mote)); gl.uniform1f(R.mo.u.uMyst, 0.25 + myst);
    gl.bindVertexArray(R.moVAO); gl.drawArrays(gl.POINTS, 0, G.MN);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, RT.ms); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, RT.base.f);
    gl.blitFramebuffer(0, 0, RT.W, RT.H, 0, 0, RT.W, RT.H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    const pass = (pr, dst, tex, set) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.f : null); gl.viewport(0, 0, dst ? dst.w : RT.W, dst ? dst.h : RT.H); gl.useProgram(pr.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.t); gl.uniform1i(pr.u.t != null ? pr.u.t : pr.u.t0, 0); if (set) set(pr.u); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    pass(R.dn, RT.h1, RT.base, (u) => { gl.uniform2f(u.px, 0.5 / RT.W, 0.5 / RT.H); gl.uniform1f(u.th, 0.66); });
    pass(R.bl, RT.h2, RT.h1, (u) => gl.uniform2f(u.dir, 1 / RT.h1.w, 0));
    pass(R.bl, RT.h1, RT.h2, (u) => gl.uniform2f(u.dir, 0, 1 / RT.h1.h));
    pass(R.dn, RT.q1, RT.h1, (u) => { gl.uniform2f(u.px, 0.5 / RT.h1.w, 0.5 / RT.h1.h); gl.uniform1f(u.th, 0.0); });
    pass(R.bl, RT.q2, RT.q1, (u) => gl.uniform2f(u.dir, 1.6 / RT.q1.w, 0));
    pass(R.bl, RT.q1, RT.q2, (u) => gl.uniform2f(u.dir, 0, 1.6 / RT.q1.h));
    pass(R.co, null, RT.base, (u) => { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, RT.h1.t); gl.uniform1i(u.t1, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, RT.q1.t); gl.uniform1i(u.t2, 2);
      gl.uniform1f(u.k1, 0.12 + 0.3 * myst); gl.uniform1f(u.k2, 0.2 + 0.55 * myst); });
    gl.activeTexture(gl.TEXTURE0);
  }
  componentDidMount() {
    this.time = 3; this.orbT = 3; this.gust = 0; this.dens = 0.45;
    this.initGl(); if (this.noGl) this.forceUpdate();
    this.onUp = () => { this.release(); };
    window.addEventListener('pointerup', this.onUp); window.addEventListener('pointercancel', this.onUp); window.addEventListener('blur', this.onUp);
    this.onScreen = true;
    try { this.io = new IntersectionObserver((es) => { this.onScreen = es[0].isIntersecting; }); if (this.glCanvas) this.io.observe(this.glCanvas); } catch (e) {}
    let reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    const step = (now) => { this.raf = requestAnimationFrame(step);
      const dtm = Math.min(120, now - (this.last || now)); this.last = now;
      this.spinTick(dtm);
      if (!this.onScreen) return;
      if (this.lastDraw && this.glCanvas && this.glCanvas.closest && this.glCanvas.closest('[data-paused="1"]')) return;
      if (this.gl && this.gl.isContextLost()) return;
      if (reduce && this.lastDraw) return; /* Reduce Motion: one still frame */
      const fpsP = parseFloat((this.props || {}).fps) || 60, busy = this.sLive() || now < (this._fastUntil || 0) || this.gust > 0.02;   /* v3.387 orb-lag-fix: 30 fps idle */
      const minMs = 1000 / (busy ? fpsP : Math.min(fpsP, 30)) - 2;
      if (this.lastDraw && now - this.lastDraw < minMs) return;
      const dt = Math.min(0.05, (now - (this.lastDraw || now)) / 1000), p = this.mp(), sp = this.num(p.speed, 1);
      this.time += dt * sp; this.gust = Math.max(0, this.gust - dt * 0.35); this.orbT += dt * sp * (1 + this.gust * 2);
      const tgt = this.num(p.swirl, 0.45); this.dens += (Math.max(tgt, this.gust) - this.dens) * Math.min(1, dt * 3);
      this.lastDraw = now; this.draw(); };
    this.raf = requestAnimationFrame(step);
  }
  componentWillUnmount() {
    this.dead = true; clearTimeout(this.reviveT);
    if (this.glCanvas) this.glCanvas.style.visibility = 'hidden';
    cancelAnimationFrame(this.raf); if (this.io) this.io.disconnect();
    try { const lx = this.gl && this.gl.getExtension('WEBGL_lose_context'); if (lx) lx.loseContext(); } catch (e) {}
    window.removeEventListener('pointerup', this.onUp); window.removeEventListener('pointercancel', this.onUp); window.removeEventListener('blur', this.onUp);
  }
  // ---- orb-spin v2 (shared, orb-spin-v1.md): < 8 pt = tap (on let go) or hold (after 90 ms still) = the orb's own effect; more = spin.
  // 1:1 with the finger, capped at 270°/s; flick = average of the last 80 ms; held still > 100 ms before letting go = no flick; coast half-life 0.6 s.
  sDown(ev, dial) {
    const b = this.btn && this.btn.getBoundingClientRect ? this.btn.getBoundingClientRect() : null, now = performance.now();
    this.sd = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, t: now, t0: now, mv: false, fx: false, h: [], dial: !!dial,
      cx: b ? b.left + b.width / 2 : ev.clientX, cy: b ? b.top + b.height / 2 : ev.clientY, w: (b && b.width) || 560 };
    this.spinVel = 0;
    try { if (ev.currentTarget && ev.currentTarget.setPointerCapture) ev.currentTarget.setPointerCapture(ev.pointerId); } catch (e) {}
  }
  sHeld() { const s = this.sd; if (s && !s.mv && !s.fx && performance.now() - s.t0 > 90) { s.fx = true; if (this.onHold) this.onHold(); } }
  sMove(ev) {
    const s = this.sd; if (!s || !ev || typeof ev.clientX !== 'number') return 0;
    const now = performance.now();
    if (!s.mv && Math.hypot(ev.clientX - s.x, ev.clientY - s.y) > 8) { s.mv = true; if (s.fx) { s.fx = false; this.pressed = false; } }   /* v3.372 spin-same: a drag after a hold still spins (as Pyralis v3.360) */
    let d;
    if (s.dial) { const a0 = Math.atan2(s.ly - s.cy, s.lx - s.cx), a1 = Math.atan2(ev.clientY - s.cy, ev.clientX - s.cx); d = a0 - a1; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; }
    else d = (ev.clientX - s.lx) / s.w * 3.4;
    s.lx = ev.clientX; s.ly = ev.clientY;
    if (!s.mv) { s.t = now; return 0; }
    const dts = Math.max(8, now - s.t), lim = 0.0047124 * dts; d = Math.max(-lim, Math.min(lim, d));
    s.h.push([now, d, dts]); while (s.h.length > 1 && now - s.h[0][0] > 80) s.h.shift();
    let sd = 0, st = 0; for (let i = 0; i < s.h.length; i++) { sd += s.h[i][1]; st += s.h[i][2]; }
    this.spinVel = Math.max(-0.0047124, Math.min(0.0047124, sd / Math.max(16, st)));
    s.t = now; return d;
  }
  sUp() { const s = this.sd; this.sd = null; if (!s) return 'none';
    if (s.mv) { if (performance.now() - s.t > 100) this.spinVel = 0; return 'spin'; }
    return s.fx ? 'hold' : 'tap'; }
  sCoast(ms) { if (this.sd && this.sd.mv) return 0; const d = (this.spinVel || 0) * ms; this.spinVel = (this.spinVel || 0) * Math.exp(-ms * 0.0011552); return d; }
  sLive() { return !!this.sd || Math.abs(this.spinVel || 0) > 0.0002; }
  spinTick(ms) { this.sHeld(); const d = this.sCoast(ms); this.spinA = (this.spinA || 0) + d;
    if (this.tapEnd && performance.now() > this.tapEnd) { this.tapEnd = 0; if (!this.sd) this.pressed = false; } return d; }
  renderVals() {
    return { setGl: this.setGl, setBtn: this.setBtn, press: this.press, move: this.move, release: this.release };
  }
}

;return Component;}};
