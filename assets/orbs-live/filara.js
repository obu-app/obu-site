/* obu live orb engine: filara (from the design canvas OrbThread.dc.html, 16 Nov 2026). Do not edit here: re-run the build. */
(window.__obuEng=window.__obuEng||{})["filara"]={tpl:"<div style=\"position: relative; width: 560px; height: 560px\"> <button data-ref=\"setBtn\" aria-hidden=\"true\" tabindex=\"-1\" style=\"position: relative; width: 560px; height: 560px; padding: 0; border: none; background: transparent; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; outline: none; -webkit-user-select: none; user-select: none\"> <canvas data-ref=\"setGl\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block\"></canvas> </button> </div>",make:function(DCLogic){

// Thread · threads of light swim through a violet gas vortex around obu's 4-point star (thread-orb-study.md v4).
// Look comes from Orb master (thread_*). The threads light up with today's light (state); drag to turn; tap and the threads part.
class Component extends DCLogic {
  SIZE = 560; ORB_R = 0.76; K = 0.88;
  DAY = { calm: 1, drifting: 0.75, scattering: 0.5, sinking: 0.3 };
  PROJ = 'uniform vec2 uAsp; uniform float uMin,uK;\nconst float CAM=3.4, F=2.8;\nvec2 proj(vec3 q){ return q.xy*F/(CAM-q.z)*uK; }\n';
  SVS() { return 'precision highp float;\n' +
    'attribute vec2 aTS; attribute vec4 aA; attribute vec4 aB; attribute vec4 aC; attribute vec4 aCol;\n' +
    'uniform float uT,uCurl,uFlow,uKick,uWave,uW,uPx,uDay,uBr,uPart; uniform vec3 uTapO; uniform mat3 uM;\n' +
    'varying float vS,vT,vPh; varying vec3 vC;\n' + this.PROJ +
    'vec3 curve(float t){\n' +
    '  float ph=aB.w;\n' +
    '  float cp=cos(aB.x),sp=sin(aB.x),ct=cos(aB.y),st=sin(aB.y);\n' +
    '  vec3 e3=vec3(st*cp,st*sp,ct);\n' +
    '  vec3 h=abs(e3.z)<.9?vec3(0.,0.,1.):vec3(1.,0.,0.);\n' +
    '  vec3 e1=normalize(cross(h,e3)), e2=cross(e3,e1);\n' +
    '  float cr=cos(aB.z),sr=sin(aB.z); vec3 f1=cr*e1+sr*e2, f2=-sr*e1+cr*e2;\n' +
    '  float fl=uT*uFlow*aC.w;\n' +
    '  vec3 p;\n' +
    '  if(aA.w<.5){\n' +
    '    float a=aA.x+t*aA.y+fl*.22;\n' +
    '    vec3 rad=cos(a)*f1+sin(a)*f2, tn=-sin(a)*f1+cos(a)*f2;\n' +
    '    float w=sin(t*aC.z+ph+uT*.15)*.35;\n' +
    '    p=aA.z*normalize(rad+e3*w);\n' +
    '    float L=t*aC.x*6.2832+ph+fl*1.2;\n' +
    '    p+=(cos(L)*tn+sin(L)*e3)*aC.y*uCurl;\n' +
    '  } else {\n' +
    '    float rr=.03+.92*pow(t,.85);\n' +
    '    float a=aA.x+aA.y*t+fl*.12;\n' +
    '    vec3 rad=cos(a)*f1+sin(a)*f2, tn=-sin(a)*f1+cos(a)*f2;\n' +
    '    float lift=sin(t*aC.z+ph)*.32*t;\n' +
    '    p=rr*normalize(rad+e3*lift);\n' +
    '    float L=t*aC.x*6.2832+ph+fl;\n' +
    '    p+=(cos(L)*tn+sin(L)*e3)*aC.y*uCurl*t;\n' +
    '  }\n' +
    '  float l=length(p); if(l>.97) p*=.97/l;\n' +
    '  vec3 dv=p-uTapO*l; float dd=length(dv);\n' +
    '  p+=dv/max(dd,1e-3)*uPart*.28*exp(-dd*dd*9.);\n' +
    '  return uM*(p*(1.+uKick)*uBr);\n' +
    '}\n' +
    'void main(){\n' +
    '  float t=aTS.x, e=.006;\n' +
    '  vec3 q0=curve(t), q1=curve(min(t+e,1.)), qm=curve(max(t-e,0.));\n' +
    '  vec2 u0=proj(q0), d=(proj(q1)-proj(qm))*uMin*.5;\n' +
    '  vec2 n=normalize(vec2(-d.y,d.x)+1e-6);\n' +
    '  vec2 u=u0+n*aTS.y*uW*uPx/(uMin*.5);\n' +
    '  gl_Position=vec4(u*uAsp,0.,1.);\n' +
    '  vS=aTS.y; vT=t*(aA.w<.5?aA.y:abs(aA.y)); vPh=aB.w*3.+aA.x;\n' +
    '  float r=length(q0);\n' +
    '  float tap=aA.w<.5?pow(sin(3.1416*t),.7):smoothstep(1.,.72,t)*smoothstep(0.,.03,t);\n' +
    '  float depth=.38+.62*(q0.z*.5+.5);\n' +
    '  float core=1.+1.8*exp(-r*r*9.);\n' +
    '  float wave=1.+2.2*uWave*exp(-pow(r-(1.-uWave)*1.1,2.)*40.);\n' +
    '  vec3 cc=aCol.rgb*aCol.a;\n' +
    '  float rank=fract(sin(aB.x*12.9898+aB.y*78.233+aB.z*37.719)*43758.5453);\n' +
    '  float lit=smoothstep(rank-.04,rank+.04,uDay);\n' +
    '  cc=mix(vec3(dot(cc,vec3(.3,.4,.3)))*vec3(.8,.85,1.)*.16,cc,lit);\n' +
    '  vC=cc*tap*depth*mix(1.,core,lit)*wave;\n' +
    '}'; }
  SFS = 'precision highp float;\n' +
    'varying float vS,vT,vPh; varying vec3 vC; uniform float uGain,uSharp,uT,uHot,uGlint;\n' +
    'void main(){\n' +
    '  float a=exp(-vS*vS*uSharp), core=exp(-vS*vS*uSharp*4.);\n' +
    '  float m=max(vC.r,max(vC.g,vC.b));\n' +
    '  vec3 c=vC*a+(vC*.6+vec3(m)*.25)*core*uHot;\n' +
    '  float g=pow(.5+.5*sin(vT*9.-uT*1.6+vPh),70.);\n' +
    '  c+=(vC*1.4+vec3(m*.5))*g*core*uGlint;\n' +
    '  c*=uGain; gl_FragColor=vec4(c,min(1.,max(c.r,max(c.g,c.b))));\n' +
    '}';
  BVS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  BFS = 'precision highp float;\n' +
    'uniform vec2 uRes; uniform float uT,uCore,uGlow,uFlash,uKick,uRefl,uGas,uBreath,uK; uniform mat3 uM;\n' +
    'float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n' +
    'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);\n' +
    '  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}\n' +
    'float h31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n' +
    'float vn3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);\n' +
    '  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),\n' +
    '             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}\n' +
    'vec3 gas(vec2 uv,float K){\n' +
    '  vec3 ro=vec3(0.,0.,3.4), rd=normalize(vec3(uv,-2.8));\n' +
    '  float b=dot(ro,rd), c=dot(ro,ro)-K*K, h=b*b-c;\n' +
    '  if(h<=0.) return vec3(0.);\n' +
    '  float sq=sqrt(h), t1=-b-sq, t2=-b+sq, dt=(t2-t1)/22.;\n' +
    '  vec3 acc=vec3(0.);\n' +
    '  float j=h31(vec3(gl_FragCoord.xy,uT))*dt;\n' +
    '  for(int i=0;i<22;i++){\n' +
    '    vec3 p=ro+rd*(t1+j+dt*float(i));\n' +
    '    vec3 o=p*uM/K; float l=length(o);\n' +
    '    float a=uT*.12+(1.-l)*2.2;\n' +
    '    float ca=cos(a),sa=sin(a); o.xz=mat2(ca,-sa,sa,ca)*o.xz;\n' +
    '    float n=vn3(o*2.1+vec3(0.,uT*.06,0.))*.55+vn3(o*4.3-vec3(uT*.05,0.,0.))*.3+vn3(o*8.7)*.15;\n' +
    '    float d=smoothstep(.34,.72,n)*(1.-l*l)*(1.+uFlash*1.5+uBreath*.15);\n' +
    '    vec3 cc=mix(vec3(1.,.55,.22),vec3(.72,.24,.78),smoothstep(.1,.5,l));\n' +
    '    cc=mix(cc,vec3(.16,.26,.85),smoothstep(.5,.95,l));\n' +
    '    acc+=cc*d*(.35+.9/(.25+l*l*6.))*dt;\n' +
    '  }\n' +
    '  return acc;\n' +
    '}\n' +
    'void main(){\n' +
    '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y)*2./uK;\n' +
    '  float r=length(uv), R=.8617*(1.+uKick), e=r-R;\n' +
    '  vec3 col=gas(uv,1.+uKick)*1.9*uGas*(1.+uBreath*.22);\n' +
    '  col+=vec3(.78,.86,.96)*exp(-e*e/1.4e-5)*.20;\n' +
    '  col+=vec3(.55,.66,.85)*exp(-max(e,0.)*12.)*.045*uGlow;\n' +
    '  if(e<0.){\n' +
    '    vec2 b=uv/R; float x=min(length(b),1.), z=sqrt(1.-x*x);\n' +
    '    vec3 nn=vec3(b,z);\n' +
    '    col+=vec3(.45,.55,.75)*pow(1.-z,5.)*.10;\n' +
    '    float ang=atan(b.y,b.x);\n' +
    '    float arc=exp(-pow((x-.83)/.07,2.))*exp(-pow((ang-2.25)/.42,2.));\n' +
    '    col+=vec3(.85,.92,1.)*arc*.20*uRefl;\n' +
    '    col+=vec3(1.)*pow(max(dot(nn,normalize(vec3(-.45,.55,.7))),0.),180.)*.55*uRefl;\n' +
    '    float arc2=exp(-pow((x-.92)/.05,2.))*exp(-pow((ang+.75)/.6,2.));\n' +
    '    col+=vec3(1.,.66,.34)*arc2*.16*uRefl*uCore;\n' +
    '    float h1=vn(b*2.2+vec2(uT*.05,0.)), h2=vn(b*2.6+vec2(9.,uT*.04));\n' +
    '    col+=(vec3(.75,.85,.25)*smoothstep(.55,.95,h1)+vec3(.85,.25,.55)*smoothstep(.6,.95,h2))*.06*(1.-x*.5)*uGlow;\n' +
    '  }\n' +
    '  float rc=r/(1.+uFlash*.6+uBreath*.08);\n' +
    '  float sa=uT*.08, cs=cos(sa), sn=sin(sa);\n' +
    '  vec2 sv=mat2(cs,-sn,sn,cs)*uv*(1.-uFlash*.25);\n' +
    '  float st=exp(-abs(sv.x)*95.)*exp(-abs(sv.y)*7.5)+exp(-abs(sv.y)*95.)*exp(-abs(sv.x)*7.5);\n' +
    '  vec2 dv2=mat2(.7071,-.7071,.7071,.7071)*sv;\n' +
    '  st+=(exp(-abs(dv2.x)*140.)*exp(-abs(dv2.y)*18.)+exp(-abs(dv2.y)*140.)*exp(-abs(dv2.x)*18.))*.35;\n' +
    '  col+=vec3(1.,.95,.82)*st*1.4*uCore*(1.+uFlash*1.2+uBreath*.25);\n' +
    '  vec2 dir=uv/max(r,1e-4);\n' +
    '  float n=vn(dir*5.+vec2(uT*.25,-uT*.18))*.6+vn(dir*13.+vec2(-uT*.3,uT*.2)+7.)*.4;\n' +
    '  col+=vec3(1.,.94,.72)*pow(n,6.)*exp(-rc*10.)*.6*uCore;\n' +
    '  col+=vec3(1.,.98,.88)*exp(-rc*rc*900.)*1.3*uCore*(1.+uFlash*1.6);\n' +
    '  col+=vec3(1.,.84,.42)*exp(-rc*rc*28.)*.32*uCore*(1.+uFlash);\n' +
    '  col+=vec3(.85,.95,.55)*exp(-rc*5.)*.05*uCore*uGlow;\n' +
    '  col=max(col,0.); gl_FragColor=vec4(col,min(1.,max(col.r,max(col.g,col.b))));\n' +
    '}';
  PVS() { return 'precision highp float;\n' +
    'attribute vec3 aP; attribute vec4 aD; attribute vec3 aK;\n' +
    'uniform float uT,uPx,uKick; uniform mat3 uM; varying vec3 vK; varying float vStar;\n' + this.PROJ +
    'void main(){\n' +
    '  vec3 q=uM*(aP*(1.+uKick));\n' +
    '  gl_Position=vec4(proj(q)*uAsp,0.,1.);\n' +
    '  float tw=.25+.75*pow(.5+.5*sin(uT*aD.y+aD.z),3.);\n' +
    '  gl_PointSize=aD.x*uPx*(.7+.5*(q.z*.5+.5));\n' +
    '  vK=aK*tw*(.45+.55*(q.z*.5+.5)); vStar=aD.w;\n' +
    '}'; }
  PFS = 'precision highp float; varying vec3 vK; varying float vStar; uniform float uGain;\n' +
    'void main(){\n' +
    '  vec2 c=gl_PointCoord-.5; float d=length(c)*2.;\n' +
    '  float v=exp(-d*d*5.);\n' +
    '  if(vStar>.5){ v=exp(-d*d*70.)*1.6+(exp(-abs(c.x)*90.)*exp(-abs(c.y)*7.)+exp(-abs(c.y)*90.)*exp(-abs(c.x)*7.))*.9; }\n' +
    '  vec3 o=(vK+vec3(.25)*vStar)*v*uGain; gl_FragColor=vec4(o,min(1.,max(o.r,max(o.g,o.b))));\n' +
    '}';
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
  MKEY = 'thread';
  num(v, d) { return typeof v === 'number' && !isNaN(v) ? v : d; }
  hex(h, d) { const n = parseInt(String(h || '').replace('#', ''), 16); return isNaN(n) ? d : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
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
  ctx(kind) {
    const c = this.glCanvas; if (!c) return null;
    const qq = Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1));
    const want = Math.round(this.SIZE * Math.min(window.devicePixelRatio || 1, 2) * qq);
    const px = Math.min(want, window.__obuHQ ? 2048 : want >= 1000 ? 640 : 512); /* cost pass v1: render ≤ 512, CSS scales it up */
    c.width = px; c.height = px;
    const gl = c.getContext(kind, { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { this.noGl = true; return null; }
    return gl;
  }
  prog(gl, vs, fs) {
    const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
    const v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs); if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    const U = {}, A = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const k = gl.getActiveUniform(p, i).name; U[k] = gl.getUniformLocation(p, k); }
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const k = gl.getActiveAttrib(p, i).name; A[k] = gl.getAttribLocation(p, k); }
    return { p, U, A };
  }
  // strands + sparks: one seeded set (same as the study), shared by every Thread on the page
  data() {
    if (window.__obuThread) return window.__obuThread;
    const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const R = rng(11), rr = (a, b) => a + (b - a) * R();
    const PAL = { cyan: [.58, .84, .98], teal: [.36, .58, .86], amber: [.94, .56, .24], yellow: [.93, .76, .25], lime: [.80, .88, .30], magenta: [.88, .27, .48], red: [.85, .22, .23], green: [.30, .91, .48] };
    const pick = (w) => { let s = 0; for (const k in w) s += w[k]; let x = R() * s; for (const k in w) { x -= w[k]; if (x <= 0) return PAL[k]; } return PAL.cyan; };
    const SHELL = { cyan: 30, teal: 8, amber: 20, yellow: 13, lime: 5, magenta: 15, red: 9 }, SWEEP = { yellow: 30, amber: 28, magenta: 22, cyan: 8, red: 12 };
    const MAX = 700, SEG = 80, VPS = 2 * SEG + 2, FL = 18, bundles = [];
    const tint = (c) => c.map((v) => Math.min(1, v * rr(.85, 1.12)));
    for (let total = 0; total < MAX;) {
      const B4 = [rr(0, 6.283), Math.acos(rr(-1, 1)), rr(0, 6.283), rr(0, 6.283)], sweep = R() < .2, out = [];
      if (sweep) {
        const a0 = rr(0, 6.283), sp = rr(2, 3.4) * (R() < .5 ? -1 : 1), col = pick(SWEEP), k = Math.floor(rr(3, 6));
        const C = [rr(.6, 2), rr(.02, .06), rr(2, 5), rr(.6, 1.1) * (R() < .5 ? -1 : 1)];
        for (let j = 0; j < k; j++) { const da = rr(-.05, .05), dp = rr(-.15, .15), br = rr(.6, 1.25), c = tint(col);
          for (const o of [0, Math.PI]) out.push({ A: [a0 + o + da, sp * rr(.97, 1.03), 0, 1], B: [B4[0], B4[1], B4[2], B4[3] + dp], C: [C[0], C[1] * rr(.8, 1.2), C[2], C[3]], col: c, br }); }
      } else {
        const r = Math.pow(rr(.55, .97), .55), a0 = rr(0, 6.283), span = rr(1.5, 3.6), col = pick(SHELL), k = Math.floor(rr(5, 13)), curly = R() < .45;
        const C = [curly ? rr(3, 8) : rr(.8, 2.5), curly ? rr(.05, .12) : rr(.02, .06), rr(1, 4), rr(.5, 1.2) * (R() < .5 ? -1 : 1)];
        for (let j = 0; j < k; j++) out.push({ A: [a0 + rr(-.07, .07), span * rr(.95, 1.05), r * rr(.975, 1.02), 0], B: [B4[0], B4[1], B4[2], B4[3] + rr(-.3, .3)], C: [C[0], C[1] * rr(.8, 1.2), C[2], C[3]], col: tint(col), br: rr(.35, 1) });
      }
      bundles.push(out); total += out.length;
    }
    for (let i = bundles.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = bundles[i]; bundles[i] = bundles[j]; bundles[j] = t; }
    const strands = [].concat.apply([], bundles).slice(0, MAX), sd = new Float32Array(MAX * VPS * FL);
    let o = 0;
    for (const s of strands) {
      const put = (t, side) => { sd.set([t, side].concat(s.A, s.B, s.C, s.col, [s.br]), o); o += FL; };
      put(0, -1); for (let i = 0; i < SEG; i++) { const t = i / (SEG - 1); put(t, -1); put(t, 1); } put(1, 1);
    }
    const NP = 520, pd = new Float32Array(NP * 10);
    for (let i = 0; i < NP; i++) {
      let x, y, z; do { x = rr(-1, 1); y = rr(-1, 1); z = rr(-1, 1); } while (x * x + y * y + z * z > .95);
      if (R() < .35) { const l = Math.hypot(x, y, z) || 1, rad = rr(.9, .985); x *= rad / l; y *= rad / l; z *= rad / l; }
      const k = pick({ green: 24, cyan: 18, amber: 22, yellow: 16, magenta: 12, red: 8 }), star = R() < .07, w = star ? 1 : (R() < .2 ? .9 : .45);
      pd.set([x, y, z, star ? rr(11, 17) : rr(1.2, 3.2), rr(.4, 2.6), rr(0, 6.283), star ? 1 : 0, k[0] * w, k[1] * w, k[2] * w], i * 10);
    }
    window.__obuThread = { sd, pd, MAX, VPS, FL, NP };
    return window.__obuThread;
  }
  initGl() {
    const gl = this.ctx('webgl'); if (!gl) return;
    this.S = this.prog(gl, this.SVS(), this.SFS); this.B = this.prog(gl, this.BVS, this.BFS); this.Pp = this.prog(gl, this.PVS(), this.PFS);
    if (!this.S || !this.B || !this.Pp) { this.noGl = true; return; }
    const D = this.data();
    this.sBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.sBuf); gl.bufferData(gl.ARRAY_BUFFER, D.sd, gl.STATIC_DRAW);
    this.pBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf); gl.bufferData(gl.ARRAY_BUFFER, D.pd, gl.STATIC_DRAW);
    this.qBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.qBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.clearColor(0, 0, 0, 0);
    if (this.yaw == null) { this.yaw = 0.3; this.pitch = 0.2; this.vy = 0; this.vp = 0; this.tapT = -99; this.tapO = [0, 0, 1]; }
    this.gl = gl; this.glCanvas.style.visibility = '';
  }
  bind(P, buf, layout, stride) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
    let off = 0; for (const L of layout) { const l = P.A[L[0]]; if (l !== undefined && l >= 0) { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, L[1], gl.FLOAT, false, stride * 4, off * 4); } off += L[1]; }
  }
  rot(yw, pt) { const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt); return [[cy, 0, sy], [sp * sy, cp, -sp * cy], [-cp * sy, sp, cp * cy]]; }
  mat(yw, pt) { const m = this.rot(yw, pt); return [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]]; }
  // drag turns it (glides to a slow drift); a tap parts the threads around your finger
  // orb-spin v2: shared feel (8 pt, 1:1 capped at 270°/s, 80 ms flick, 0.6 s half-life); tilt follows the finger, no tilt flick
  press = (e) => { this.pressed = true; this.sDown(e); this._py = e.clientY; this.vy = 0; this.vp = 0; };
  move = (e) => { const s = this.sd; if (!s) return; const d = this.sMove(e);
    if (s.mv) { this.yaw += d; } this._py = e.clientY; };   /* v3.374 spin-lr: left/right only, view tilt stays 0.2 */
  release = (e) => { const rr = this.sUp(); if (rr === 'none') return;
    if ((rr === 'tap' || rr === 'hold') && this.btn && e && typeof e.clientX === 'number') {
      const r = this.btn.getBoundingClientRect(), s = Math.min(r.width, r.height);
      const ux = (e.clientX - r.left - r.width / 2) / s * 2 / this.K, uy = (e.clientY - r.top - r.height / 2) / s * 2 / this.K;
      if (Math.hypot(ux, uy) < .95) {
        const l = Math.hypot(ux, -uy, 2.8), d = [ux / l, -uy / l, -2.8 / l], b = 3.4 * d[2], h = b * b - (3.4 * 3.4 - 1);
        if (h > 0) { const t = -b - Math.sqrt(h), w = [d[0] * t, d[1] * t, 3.4 + d[2] * t], m = this.rot(this.yaw, this.pitch);
          this.tapO = [0, 1, 2].map((i) => m[0][i] * w[0] + m[1][i] * w[1] + m[2][i] * w[2]); }
        this.tapT = this.time;
      }
    }
    this.pressed = false;
  };
  leave = () => { this.sUp(); this.pressed = false; };
  draw(now) {
    const dts = Math.min(60, now - (this.last || now)) / 1000; this.last = now;
    const gl = this.gl; if (!gl || !this.S) return;
    const p = this.mp(), W = this.glCanvas.width, D = this.data();
    const day = Math.max(0, Math.min(1, this.num(p.day, 0.85) * (this.DAY[p.state || 'calm'] || 1)));
    this.time += dts * this.num(p.speed, 1);
    const t = this.time;
    this.yaw += this.spinTick(dts * 1000) + (this.sd && this.sd.mv ? 0 : .072 * Math.min(dts, 0.1));   /* v3.372 spin-same: idle per second (was per frame) */   // orb-spin v2: coast, then the slow drift
    const dt = t - this.tapT;
    const kick = dt > 0 && dt < 3 ? .07 * Math.exp(-dt * 2.6) * Math.sin(dt * 9) : 0;
    const flash = dt > 0 && dt < 3 ? Math.exp(-dt * 3) : 0;
    const wave = dt > 0 && dt < 1.6 ? 1 - dt / 1.6 : 0;
    const part = dt > 0 && dt < 4 ? (1 - Math.exp(-dt * 9)) * Math.exp(-dt * 1.1) : 0;
    const breath = Math.sin(t * Math.PI * 2 / 10);
    const M = this.mat(this.yaw, this.pitch), px = W / 560;
    gl.viewport(0, 0, W, W);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const B = this.B; gl.useProgram(B.p); this.bind(B, this.qBuf, [['p', 2]], 2);
    gl.uniform2f(B.U.uRes, W, W); gl.uniform1f(B.U.uT, t); gl.uniform1f(B.U.uCore, this.num(p.core, 1)); gl.uniform1f(B.U.uGlow, this.num(p.glow, 1));
    gl.uniform1f(B.U.uFlash, flash); gl.uniform1f(B.U.uBreath, breath); gl.uniform1f(B.U.uRefl, this.num(p.refl, 1)); gl.uniform1f(B.U.uGas, this.num(p.gas, 1));
    gl.uniformMatrix3fv(B.U.uM, false, M); gl.uniform1f(B.U.uKick, kick); gl.uniform1f(B.U.uK, this.K);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const S = this.S; gl.useProgram(S.p);
    this.bind(S, this.sBuf, [['aTS', 2], ['aA', 4], ['aB', 4], ['aC', 4], ['aCol', 4]], D.FL);
    gl.uniform2f(S.U.uAsp, 1, 1); gl.uniform1f(S.U.uMin, W); gl.uniform1f(S.U.uPx, px); gl.uniform1f(S.U.uK, this.K);
    gl.uniform1f(S.U.uT, t); gl.uniform1f(S.U.uCurl, this.num(p.curl, 1)); gl.uniform1f(S.U.uFlow, this.num(p.flow, 0.6));
    gl.uniform1f(S.U.uKick, kick); gl.uniform1f(S.U.uDay, day); gl.uniform1f(S.U.uBr, 1 + breath * .012); gl.uniform1f(S.U.uPart, part);
    gl.uniform3fv(S.U.uTapO, this.tapO); gl.uniform1f(S.U.uWave, wave); gl.uniformMatrix3fv(S.U.uM, false, M);
    const n = Math.min(Math.round(this.num(p.count, 340)), D.MAX) * D.VPS, wd = this.num(p.width, 1), gw = this.num(p.glow, 1), sk = this.num(p.spark, 1);
    gl.uniform1f(S.U.uHot, 0); gl.uniform1f(S.U.uGlint, 0);
    gl.uniform1f(S.U.uW, 6.5 * wd); gl.uniform1f(S.U.uGain, .05 * gw); gl.uniform1f(S.U.uSharp, 2.2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.uniform1f(S.U.uHot, .5); gl.uniform1f(S.U.uGlint, 1.6 * sk);
    gl.uniform1f(S.U.uW, 1.3 * wd); gl.uniform1f(S.U.uGain, .24);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    const Pp = this.Pp; gl.useProgram(Pp.p); this.bind(Pp, this.pBuf, [['aP', 3], ['aD', 4], ['aK', 3]], 10);
    gl.uniform2f(Pp.U.uAsp, 1, 1); gl.uniform1f(Pp.U.uMin, W); gl.uniform1f(Pp.U.uPx, px); gl.uniform1f(Pp.U.uK, this.K);
    gl.uniform1f(Pp.U.uT, t); gl.uniform1f(Pp.U.uKick, kick); gl.uniform1f(Pp.U.uGain, 1.3 * sk); gl.uniformMatrix3fv(Pp.U.uM, false, M);
    gl.drawArrays(gl.POINTS, 0, D.NP);
  }

  componentDidMount() {
    this.time = 0; this.kick = 0;
    this.initGl(); if (this.noGl) this.forceUpdate();
    this.onUp = () => { this.leave(); };
    window.addEventListener('pointerup', this.onUp); window.addEventListener('pointercancel', this.onUp); window.addEventListener('blur', this.onUp);
    this.onScreen = true;
    try { this.io = new IntersectionObserver((es) => { this.onScreen = es[0].isIntersecting; }); if (this.glCanvas) this.io.observe(this.glCanvas); } catch (e) {}
    const step = (now) => { this.raf = requestAnimationFrame(step);
      if (!this.onScreen) { this.last = now; return; }
      if (this.lastDraw && this.glCanvas && this.glCanvas.closest && this.glCanvas.closest('[data-paused="1"]')) { this.last = now; return; }
      const fps = parseFloat((this.props || {}).fps) || 60;
      if (fps < 58 && !this.pressed && !this.sLive() && now - (this.lastDraw || 0) < 1000 / fps - 4) return;
      if (this.gl && this.gl.isContextLost()) { this.last = now; return; }
      this.lastDraw = now; this.draw(now); };
    this.raf = requestAnimationFrame(step);
  }
  componentWillUnmount() {
    this.dead = true; clearTimeout(this.reviveT);
    if (this.glCanvas) this.glCanvas.style.visibility = 'hidden';
    cancelAnimationFrame(this.raf); if (this.io) this.io.disconnect();
    try { const lx = this.gl && this.gl.getExtension('WEBGL_lose_context'); if (lx) lx.loseContext(); } catch (e) {}
    window.removeEventListener('pointerup', this.onUp); window.removeEventListener('pointercancel', this.onUp); window.removeEventListener('blur', this.onUp);
  }
  // pointer → orb units (rim ≈ 1), y up
  rel(e) {
    const el = this.btn; if (!el) return [0, 0];
    const b = el.getBoundingClientRect();
    return [((e.clientX - b.left) / b.width * 2 - 1) / this.ORB_R, -((e.clientY - b.top) / b.height * 2 - 1) / this.ORB_R];
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
    return { setGl: this.setGl, setBtn: this.setBtn, press: this.press, move: this.move, release: this.release, leave: this.leave };
  }
}

;return Component;}};
