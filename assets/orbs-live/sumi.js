/* obu live orb engine: sumi (from the design canvas OrbSumi.dc.html, 16 Nov 2026). Do not edit here: re-run the build. */
(window.__obuEng=window.__obuEng||{})["sumi"]={tpl:"<div style=\"position: relative; width: 560px; height: 560px\"> <button data-ref=\"setBtn\" aria-hidden=\"true\" tabindex=\"-1\" style=\"position: relative; width: 560px; height: 560px; padding: 0; border: none; background: transparent; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; outline: none; -webkit-user-select: none; user-select: none\"> <canvas data-ref=\"setGl\" aria-hidden=\"true\" style=\"position: absolute; left: 0; top: 0; width: 560px; height: 560px; display: block\"></canvas> </button> </div>",make:function(DCLogic){

// Sumi · Path III · Form 15 (Star Nursery, 630 h). sumi-orb-study.md v10.1 → engine v1 (4 Nov, Henry: White fire · Gyō 行):
// a ball of sumi-ink brush strokes (harai · tome · hane · ten · sōsho · kasure) inside layered white fire that licks upward.
// Tap = paints a new stroke where you touched (paint in 0.45 s → hold 4 s → dries out 1.5 s; max 4 live; the base ink thins a little meanwhile).
// Drag = spin (orb-spin v2). Look from Orb master (sumi_*). Transparent: the fire glows straight onto the app's sky.
class Component extends DCLogic {
  SIZE = 560; MKEY = 'sumi'; NS = 28; NF = 7; NT = 4;
  VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  FS = `precision highp float;
#define NS 28
#define NF 7
uniform vec2 uC; uniform float uR; uniform float uT;
uniform mat3 uRot;
uniform mat3 uF[NS]; uniform vec4 uA[NS]; uniform vec4 uB[NS]; uniform vec4 uP[NS]; uniform vec4 uE[NS];
uniform int uN;
uniform vec4 uFD[NF];
uniform float uSplat, uCore, uAcc, uBg, uSee, uFlame;

float h2(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s/.9375;}
float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
/* shodo stroke vocabulary: 0 harai (sweep) 1 tome (stop) 2 hane (flick) 3 ten (dot) 4 sosho (grass) 5 kasure (dry sweep) */
float g(float x,float m,float w){float u=(x-m)/w;return exp(-u*u);}
float prof(float s,float t){
 if(s<0.) return sqrt(max(0.,1.-s*s/.0036))*(t>3.5&&t<4.5?.3:(t>2.5&&t<3.5?1.:.9));
 if(t<.5) return (.75+.42*g(s,.12,.10))*pow(1.-s,1.6);
 if(t<1.5) return (.85+.25*g(s,.06,.06)+.2*g(s,.86,.05))*(s<.86?1.:sqrt(max(0.,1.-(s-.86)*(s-.86)/.0196)));
 if(t<2.5) return (.82+.32*g(s,.74,.08))*(s<.8?1.:pow(max(0.,1.-(s-.8)/.2),1.3));
 if(t<3.5) return 1.25*pow(max(0.,sin(3.14159*pow(s,.55))),.7);
 if(t<4.5) return (.35+.65*pow(.5+.5*sin(s*19.+1.3),1.6))*pow(1.-s,.5)*smoothstep(0.,.08,s+.02);
 return (.92+.18*g(s,.1,.1))*pow(1.-s,.4);
}
/* one sumi stroke on a unit sphere. returns (ink coverage, dry-edge band) */
vec4 brush(vec3 p, mat3 F, vec4 A, vec4 B, vec4 P, vec4 E){
 vec3 q=p*F;
 float a=atan(q.y,q.x);
 float da=mod(a-A.x,6.28318);
 if(da>6.28318-.25) da-=6.28318;
 float s=da/A.y;
 if(s<-.07||s>1.) return vec4(0.);
 float hook=E.y*pow(max(0.,s-.8)/.2,2.);
 float c=asin(clamp(q.z,-1.,1.))-E.x-B.x*sin(B.y*s*3.14159+B.z)-hook;
 float W=A.z*prof(s,B.w);
 if(W<.002) return vec4(0.);
 float x=c/(.5*W);
 if(abs(x)>1.45) return vec4(0.);
 float L=s*A.y, sd=A.w;
 float rag=(n2(vec2(L*7.+sd,sd*1.7))-.5)*.34+(n2(vec2(L*26.+sd,3.1))-.5)*.08;
 float ex=abs(x)+rag*(.35+abs(x));
 float pw=clamp(2./(uR*W),.015,.2);
 float body=1.-smoothstep(1.-pw,1.,ex);
 float halo=(1.-smoothstep(1.,1.38,ex))*(1.-body);
 float br=n2(vec2(x*5.5+sd+L*.6,L*1.1))*.45+n2(vec2(x*17.+sd*2.,L*3.5))*.3+n2(vec2(x*45.+sd,L*14.))*.25;
 float dry=smoothstep(P.z,1.,s)*P.w+pow(abs(x),3.)*.42+P.y*1.25;
 float cov=body*smoothstep(dry-.045,dry+.035,br);
 float tip=P.x<1.?smoothstep(P.x+.025,P.x,s):1.;
 cov*=tip;
 float dens=mix(.9,1.,smoothstep(.3,.7,br));
 float band=body*tip*smoothstep(dry-.13,dry-.03,br)*(1.-smoothstep(dry+.02,dry+.09,br))*smoothstep(.35,.75,s);
 return vec4(cov*dens,band,abs(x),halo*tip*(1.-P.y));
}

vec3 col; float al;
void over(vec3 c,float a){col=c*a+col*(1.-a); al=a+al*(1.-a);}
void ov(inout vec3 c,inout float a,vec3 nc,float na){c=nc*na+c*(1.-na); a=na+a*(1.-na);}
void main(){
 vec2 p0=(gl_FragCoord.xy-uC)/uR;
 col=vec3(0.); al=0.;
 bool paper=uBg>.5&&uBg<1.5;
 bool fl=uFlame>.5&&uFlame<1.5&&!paper;
 bool wf=uFlame>1.5&&!paper;
 vec2 p=p0;
 if(fl||wf){
  vec2 q=p0*2.6+vec2(0.,-uT*1.3);
  p+=vec2(n2(q)-.5,n2(q+vec2(7.3,2.1))-.5)*.10*(.35+.65*length(p0))
    +vec2(n2(q*2.3+3.)-.5,n2(q*2.3+9.)-.5)*.025;
 }
 float d=length(p);
 vec3 INK=paper?vec3(.035,.033,.03):((fl||wf)?vec3(.012,.011,.01):vec3(.95,.93,.89));
 vec3 FIRE=uAcc>1.5?vec3(1.,.42,.24):(uAcc>.5?vec3(1.,.78,.42):vec3(.96,.92,.86));
 vec3 L=normalize(vec3(-.5,.6,.65)), H=normalize(L+vec3(0.,0.,1.));
 vec3 acc=uAcc<1.5?vec3(.86,.68,.33):vec3(1.,.353,.212);
 float fireA=0.; vec3 fireC=vec3(0.);
 if(wf){
  /* v8 layered white fire: white-hot core -> warm mid -> darker orange-grey outer licks -> smoke wisps */
  float t=uT;
  vec2 rp=p0;
  float hy=max(rp.y+.15,0.);
  vec2 wq=rp*2.1+vec2(0.,-t*1.5);
  vec2 wv=vec2(fbm(wq),fbm(wq+vec2(5.2,1.3)))-.5;
  /* curl: sideways warp + a travelling S-bend that grows with height */
  rp.x+=wv.x*(.10+.30*hy)+sin(rp.y*3.4-t*2.2+wv.y*4.)*.085*hy*hy;
  rp.y+=wv.y*.10;
  /* envelope: round ball below, tapering teardrop above (narrows to a point at ~1.8) */
  float top=smoothstep(-.15,1.6,rp.y);
  float wx=rp.x/(.94*pow(1.-top,.75)+.05);
  float wy=rp.y>0.?rp.y/1.6:rp.y/.98;
  float env=1.-length(vec2(wx,wy));
  /* rising noise, stretched upward so tongues are tall and thin */
  float nf=fbm(vec2(rp.x*5.2,rp.y*1.35-t*2.4));
  float nh=fbm(vec2(rp.x*10.+3.,rp.y*2.3-t*3.6));
  float ero=.16+.62*smoothstep(-.1,1.25,rp.y);
  float Ht=env+(nf-.5)*ero+(nh-.5)*ero*.55;
  /* each layer gets its own wobble so licks of one cut into the next */
  float l1=fbm(vec2(rp.x*4.+7.,rp.y*2.-t*2.9))-.5;
  float l2=fbm(vec2(rp.x*6.+2.,rp.y*2.6-t*3.3))-.5;
  vec3 CH,CM,CO;
  if(uAcc>1.5){CH=vec3(1.,.93,.84);CM=vec3(1.,.5,.27);CO=vec3(.50,.22,.15);}
  else if(uAcc>.5){CH=vec3(1.,.98,.9);CM=vec3(1.,.74,.36);CO=vec3(.55,.34,.19);}
  else {CH=vec3(1.,1.,.98);CM=vec3(1.,.84,.6);CO=vec3(.56,.38,.28);}
  /* wisps: thin ridges that break off above the tips and fade into grey */
  float ws=fbm(vec2(rp.x*7.5+11.,rp.y*2.2-t*3.2));
  float ridge=1.-abs(ws-.55)/.045;
  float wband=smoothstep(.4,.95,rp.y)*(1.-smoothstep(1.3,1.8,rp.y))*smoothstep(.8,.3,abs(rp.x));
  float aW=clamp(ridge,0.,1.)*wband*smoothstep(.0,-.1,Ht)*.24;
  vec3 fc=vec3(0.); float fa=0.;
  ov(fc,fa,mix(CO,vec3(.40,.38,.37),.6),aW);
  /* outer: darker orange-grey licks, semi-transparent, darkest at their edge */
  float hiT=smoothstep(.95,1.6,rp.y);            /* near the tips: needs more heat, goes thin + translucent */
  float aO=smoothstep(hiT*.07,.05+hiT*.13,Ht)*(.66+.22*nh)*(1.-.55*hiT);
  ov(fc,fa,CO*mix(.7,1.2,smoothstep(0.,.2,Ht)),aO);
  /* mid: warm body */
  float Hm=Ht+l1*.16;
  float aM=smoothstep(.20,.26,Hm)*.95;
  ov(fc,fa,CM*mix(.85,1.08,smoothstep(.2,.45,Hm))*(.94+.12*nf),aM);
  /* core: white-hot */
  float Hc=Ht+l2*.16;
  float aC=smoothstep(.44,.52,Hc);
  ov(fc,fa,mix(mix(CM,CH,.6),CH,smoothstep(.48,.75,Hc)),aC);
  fireA=fa; fireC=fa>0.?fc/fa:vec3(0.);
 }
 if(uCore>.5&&d<1.&&!wf){
  float c=exp(-d*d*2.2)*(1.-d*d);
  vec3 cc=paper?vec3(.80,.76,.70):(uAcc>1.5?vec3(1.,.45,.3):vec3(1.,.93,.82));
  over(fl?FIRE*.9:cc,c*(paper?.18:(fl?.55:.16)));
 }
 if(wf&&d>=1.02) over(fireC,fireA*.92);
 if(d<1.02){
  for(int i=0;i<NS;i++){
   if(i>=uN) break;
   float rs=uE[i].w; if(d>=rs) continue;
   float z=sqrt(rs*rs-d*d);
   vec3 n=vec3(p,-z)/rs;
   vec4 k=brush(uRot*n,uF[i],uA[i],uB[i],uP[i],uE[i]);
   if(k.x<.002) continue;
   float lam=dot(-n,L);
   vec3 c=INK*(paper?1.:(.30+.22*smoothstep(-.6,1.,lam)));
   if(wf) c=INK;
   else if(fl) c=INK+FIRE*(smoothstep(.55,.98,k.z)*.22+k.y*.25);
   else if(uAcc>.5) c=mix(c,acc*.6,k.y*.7);
   float depth=.55+.45*(z/rs);
   float a=k.x*mix(.85,.22,uSee)*(uE[i].z>.5?.5:1.)*mix(1.,.75,1.-depth);
   over(c,a);
  }
  if(wf) over(fireC,fireA*.92);
  for(int j=0;j<NS;j++){
   if(NS-1-j>=uN) continue;
   float rs=uE[NS-1-j].w; if(d>=rs) continue;
   float z=sqrt(rs*rs-d*d);
   vec3 n=vec3(p,z)/rs;
   vec4 k=brush(uRot*n,uF[NS-1-j],uA[NS-1-j],uB[NS-1-j],uP[NS-1-j],uE[NS-1-j]);
   if(k.x+k.w<.002) continue;
   float lam=dot(n,L), nh=max(dot(n,H),0.);
   float diff=.30+.70*smoothstep(-.7,1.,lam);
   float rim=pow(1.-z/rs,3.);
   vec3 c;
   if(wf){
    float edge=smoothstep(.6,.98,k.z);
    c=INK+fireC*edge*fireA*.45+vec3(.9,.88,.85)*pow(nh,30.)*.10*(1.-k.y);
    c=mix(c,fireC*.5,k.y*fireA*.6);
   } else if(fl){
    float edge=smoothstep(.5,.97,k.z);
    float lit=.35+.65*smoothstep(-.5,.9,lam);
    c=INK+FIRE*(edge*edge*1.35*lit+k.y*1.1+pow(nh,30.)*.12+rim*.25);
   } else if(paper){
    c=INK+vec3(1.)*pow(nh,40.)*.28*(1.-k.y);
    c=mix(c,vec3(.32,.31,.30),k.y*.5);
   } else {
    c=INK*(.45+.55*diff)+vec3(1.,.97,.92)*pow(nh,30.)*.14*(1.-k.y);
    c+=vec3(.55,.62,.75)*rim*smoothstep(.1,-.5,lam)*.6;
    c=mix(c,INK*diff*.55,k.y*.45);
   }
   if(!fl&&uAcc>.5) c=mix(c,acc*(.8+.4*max(lam,0.))*(.75+.5*n3(n*90.+uT*.4)),k.y*.9);
   if(k.w>.0&&!fl&&!wf) over(paper?vec3(.5):INK*.4,k.w*.12);
   float a=k.x*(uE[NS-1-j].z>.5?.42:1.)*(fl?.72:(wf?.94:1.));
   over(c,a);
  }
 }
 if(uSplat>.5){
  for(int i=0;i<NF;i++){
   vec4 f=uFD[i]; if(f.w<.5) continue;
   float dd=length(p-f.xy);
   over((fl?FIRE*.8:(wf?vec3(.85,.83,.8):INK))*(f.w>1.5?.45:1.),1.-smoothstep(f.z*.7,f.z,dd));
  }
 }
 if(uBg>1.5){ gl_FragColor=vec4(col,al); return; }   /* engine: premultiplied over the app's sky */
 vec3 bg=paper?vec3(.937,.922,.89):vec3(0.);
 if(!paper){
  vec3 g=uAcc>1.5?vec3(1.,.42,.25):vec3(1.,.95,.86);
  bg+=g*(.07*exp(-max(d-.9,0.)*3.)+.03*exp(-max(d-1.,0.)*1.2));
 }
 gl_FragColor=vec4(col+bg*(1.-al),1.);
}`;
  TY = [
 {span:[3.0,5.0],W:[.16,.34],amp:[.05,.18],k:[1,2],  dry:[.40,.80]},  /* harai: press, long pull-out to a point */
 {span:[2.0,3.4],W:[.20,.36],amp:[.03,.10],k:[1,2],  dry:[.20,.92]},  /* tome: firm, rounded pressed stop */
 {span:[2.2,3.6],W:[.18,.30],amp:[.05,.15],k:[1,2],  dry:[.70,.62]},  /* hane: body + quick flick */
 {span:[.35,.75],W:[.24,.42],amp:[0,.04],  k:[1,1],  dry:[.60,.95]},  /* ten: fat teardrop dot */
 {span:[3.6,5.4],W:[.07,.14],amp:[.15,.34],k:[2,4],  dry:[.30,.72]},  /* sosho: thin, wavy, pressure pulses */
 {span:[2.6,4.2],W:[.32,.48],amp:[.04,.12],k:[1,2],  dry:[-.8,.62]}]; /* kasure: wide dry brush, streaky from the start */
/* mix of [harai,tome,hane,ten,sosho,kasure] per script style */
  STY = [[.32,.33,.15,.15,0,.05],[.30,.15,.15,.12,.13,.15],[.25,0,.10,.08,.42,.15]];
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
  nrm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  frameOf(w) { const tmp = Math.abs(w[0]) < .9 ? [1, 0, 0] : [0, 1, 0]; const u = this.nrm(this.crs(w, tmp)); return { u, v: this.crs(w, u), w }; }
  axisRot(k, a) { const c = Math.cos(a), s = Math.sin(a), t = 1 - c, x = k[0], y = k[1], z = k[2];
    return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; }
  // the base strokes: seeded, same ink everywhere (study gen(), Gyō by default)
  gen(style, density, seed) {
    let a = seed * 7919 + 3; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const S = [], fly = [], W0 = this.W0, TY = this.TY, mix = this.STY[style] || this.STY[1];
    const n = Math.min(this.NS - this.NT, Math.round(15 + density * 15));
    const pick = () => { const r = rnd(); let c = 0; for (let i = 0; i < 6; i++) { c += mix[i]; if (r < c) return i; } return 0; };
    for (let j = 0; j < n; j++) {
      const cr = rnd() < .22, w = cr ? this.nrm([rnd() - .5, rnd() - .5, rnd() - .5]) : this.nrm([W0[0] + (rnd() - .5) * .7, W0[1] + (rnd() - .5) * .7, W0[2] + (rnd() - .5) * .7]);
      const t = pick(), T = TY[t], L = (x, y) => x + rnd() * (y - x), tone = rnd() < .22 ? 1 : 0;
      S.push({ f: this.frameOf(w), t, tone, a0: rnd() * 6.283, span: L(...T.span), W: L(...T.W) * (tone ? 1.2 : 1), sd: rnd() * 100,
        amp: L(...T.amp), k: L(...T.k), ph: rnd() * 6.283, lat: cr ? (rnd() - .5) * .8 : -1.15 + 2.3 * (j + .5) / n + (rnd() - .5) * .15,
        hook: t === 2 ? (rnd() < .5 ? -1 : 1) * (.18 + rnd() * .15) : 0, dryS: T.dry[0], dry: T.dry[1] * (tone ? .85 : 1), rs: .80 + rnd() * .20 });
    }
    S.sort((x, y) => y.rs - x.rs);
    const f0 = this.frameOf(W0);
    for (let i = 0; i < this.NF; i++) { const an = rnd() * 6.283, lat = (rnd() - .5) * 1.2, c = Math.cos(lat);
      fly.push({ dir: [0, 1, 2].map((k) => c * (Math.cos(an) * f0.u[k] + Math.sin(an) * f0.v[k]) + Math.sin(lat) * f0.w[k]), rf: rnd(), r: .008 + rnd() * .012 }); }
    this.S = S; this.fly = fly; this.genKey = style + ':' + density + ':' + seed;
  }
  initGl() {
    const c = this.glCanvas; if (!c) return;
    const qq = Math.max(0.2, Math.min(1, parseFloat((this.props || {}).q) || 1));
    const px = Math.max(64, Math.min(window.__obuHQ ? 4096 : 448, Math.round(this.SIZE * Math.min(window.devicePixelRatio || 1, 2) * qq)));   /* v3.387 orb-lag-fix: cap 448 */
    c.width = px; c.height = px;
    const gl = c.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) { this.noGl = true; return; }
    const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; } return o; };
    const v = mk(gl.VERTEX_SHADER, this.VS), f = mk(gl.FRAGMENT_SHADER, this.FS); if (!v || !f) { this.noGl = true; return; }
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'a'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); this.noGl = true; return; }
    gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const U = {}; for (const n of ['uC', 'uR', 'uT', 'uRot', 'uF', 'uA', 'uB', 'uP', 'uE', 'uN', 'uFD', 'uSplat', 'uCore', 'uAcc', 'uBg', 'uSee', 'uFlame'])
      U[n] = gl.getUniformLocation(p, n) || gl.getUniformLocation(p, n + '[0]');
    this.P = p; this.U = U; this.gl = gl; gl.viewport(0, 0, px, px); c.style.visibility = '';
  }
  geo() { const W = this.glCanvas.width, sz = this.num(this.mp().size, 1); return { W, cx: W / 2, cy: W * 0.44, R: W * 0.32 * sz };   /* ball low in the box: the fire licks up to ~0.95 W */ }
  // tap = a new stroke painted where you touched (front of the orb)
  addTap(clientX, clientY, age) { this._fastUntil = performance.now() + 2500;
    const b = this.btn && this.btn.getBoundingClientRect ? this.btn.getBoundingClientRect() : null; if (!b || !this.glCanvas) return false;
    const g = this.geo(), x = (clientX - b.left) / b.width * g.W, y = (1 - (clientY - b.top) / b.height) * g.W;
    const px = (x - g.cx) / g.R, py = (y - g.cy) / g.R, d2 = px * px + py * py;
    this.boost = Math.min(3, (this.boost || 0) + (d2 < 1.96 ? 1.4 : 0));
    if (d2 >= .98) return false;
    const G = this.axisRot(this.AX, this.spin), n = [px, py, Math.sqrt(1 - d2)];
    const tr = (v) => [G[0] * v[0] + G[3] * v[1] + G[6] * v[2], G[1] * v[0] + G[4] * v[1] + G[7] * v[2], G[2] * v[0] + G[5] * v[1] + G[8] * v[2]];
    const m = this.nrm(tr(n)), rnd = Math.random, ang = (rnd() < .5 ? .35 : 2.8) + (rnd() - .5) * .9;
    let ts = [Math.cos(ang), Math.sin(ang), 0]; ts = [ts[0], ts[1], -(ts[0] * n[0] + ts[1] * n[1]) / n[2]]; ts = this.nrm(tr(ts));
    const f = this.frameOf(this.nrm(this.crs(m, ts))), mix = this.STY[this.style] || this.STY[1];
    let r = rnd(), c = 0, t = 0; for (let i = 0; i < 6; i++) { c += mix[i]; if (r < c) { t = i; break; } }
    const T = this.TY[t], L = (a, bb) => a + rnd() * (bb - a), span = Math.min(L(...T.span), 3.2);
    const a0 = Math.atan2(m[0] * f.v[0] + m[1] * f.v[1] + m[2] * f.v[2], m[0] * f.u[0] + m[1] * f.u[1] + m[2] * f.u[2]) - span * .12;
    const now = performance.now() / 1000;
    let taps = this.taps;
    if (taps.length >= this.NT) { const old = taps.reduce((p, q) => (p.born < q.born ? p : q)); old.life = Math.min(old.life, now - old.born); }   /* oldest dries out now */
    taps = taps.filter((tp) => now - tp.born < tp.life + 1.5); if (taps.length >= this.NT) taps.shift();
    taps.unshift({ f, t, tone: 0, a0, span, W: L(...T.W), sd: rnd() * 100, amp: L(...T.amp) * .6, k: L(...T.k), ph: rnd() * 6.283,
      lat: 0, hook: t === 2 ? (rnd() < .5 ? -1 : 1) * .2 : 0, dryS: T.dry[0], dry: T.dry[1], rs: 1, born: now - (age || 0), life: 4 });
    this.taps = taps; return true;
  }
  press = (e) => { this.sDown(e); this._dn = { x: e.clientX, y: e.clientY }; };
  onHold = () => { if (this._dn) { this.addTap(this._dn.x, this._dn.y); this._dn = null; } };
  move = (e) => { this.spinA = (this.spinA || 0) + this.sMove(e); };
  release = () => { const r = this.sUp(); if (r === 'tap' && this._dn) this.addTap(this._dn.x, this._dn.y); this._dn = null; };
  draw() {
    const gl = this.gl, U = this.U; if (!gl || !this.P) return;
    const p = this.mp(), NS = this.NS, style = Math.round(this.num(p.style, 1)), density = this.num(p.strokes, 0.6), seed = Math.round(this.num(p.seed, 11));
    if (this.genKey !== style + ':' + density + ':' + seed) this.gen(style, density, seed);
    this.style = style;
    const spin = this.spin, G = this.axisRot(this.AX, spin), G2 = this.axisRot(this.AX, spin * 1.4 + .6), now = performance.now() / 1000, cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
    this.taps = this.taps.filter((tp) => now - tp.born < tp.life + 1.5);
    /* base-ink yield: follows how much tap ink is alive (each stroke counts less as it dries), eased so it never snaps */
    let tgt = 0; this.taps.forEach((tp) => { const age = now - tp.born; tgt += cl(age / .45) * (1 - cl((age - tp.life) / 1.5)); });
    tgt = Math.min(tgt * .055, .18);
    const dtY = Math.min(.1, Math.max(0, now - (this.tY || now))); this.tY = now;
    this.yieldV += (tgt - this.yieldV) * (1 - Math.exp(-dtY / (tgt > this.yieldV ? .6 : 1.4)));
    const ALL = this.taps.concat(this.S), fF = this.fF, fA = this.fA, fB = this.fB, fP = this.fP, fE = this.fE, dF = this.dF, t0 = this.time;
    ALL.forEach((st, i) => {
      const f = st.f; fF.set([...f.u, ...f.v, ...f.w], i * 9);
      fA.set([st.a0, st.span, st.W, st.sd], i * 4);
      fB.set([st.amp, st.k, st.ph + Math.sin(t0 * .3 + st.sd) * .25, st.t], i * 4);
      let head = 1, fade = 0;
      if (st.born !== undefined) { const age = now - st.born; head = 1 - Math.pow(1 - cl(age / .45), 2.4); fade = cl((age - st.life) / 1.5); }
      else fade = this.yieldV;
      fP.set([head, Math.max(fade, .07), st.dryS, st.dry], i * 4);
      fE.set([st.lat, st.hook, st.tone, st.rs], i * 4);
    });
    this.fly.forEach((f, i) => { const rs = 1.06 + f.rf * .25, d = f.dir;
      const P = [G2[0] * d[0] + G2[1] * d[1] + G2[2] * d[2], G2[3] * d[0] + G2[4] * d[1] + G2[5] * d[2], G2[6] * d[0] + G2[7] * d[1] + G2[8] * d[2]].map((x) => x * rs);
      dF.set([P[0], P[1], f.r, P[2] > 0 || Math.hypot(P[0], P[1]) > 1 ? 1 : 2], i * 4); });
    const g = this.geo();
    gl.viewport(0, 0, g.W, g.W); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uC, g.cx, g.cy); gl.uniform1f(U.uR, g.R); gl.uniform1f(U.uT, t0);
    gl.uniformMatrix3fv(U.uRot, false, new Float32Array(G));
    gl.uniformMatrix3fv(U.uF, false, fF); gl.uniform4fv(U.uA, fA); gl.uniform4fv(U.uB, fB); gl.uniform4fv(U.uP, fP); gl.uniform4fv(U.uE, fE);
    gl.uniform1i(U.uN, Math.min(NS, ALL.length)); gl.uniform4fv(U.uFD, dF);
    gl.uniform1f(U.uSplat, this.num(p.drops, 1) > 0.5 ? 1 : 0); gl.uniform1f(U.uCore, 1); gl.uniform1f(U.uAcc, Math.round(this.num(p.accent, 0)));
    gl.uniform1f(U.uBg, 2); gl.uniform1f(U.uSee, this.num(p.see, 0.55)); gl.uniform1f(U.uFlame, 2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  componentDidMount() {
    this.W0 = this.nrm([.38, .9, .22]); this.AX = [0, 1, 0]; /* v3.374 spin-lr: spin on an upright axis (was W0 = tilted ~25°); strokes still wrap W0 */ this.taps = []; this.yieldV = 0; this.time = 4; this.spin0 = 0.9; this.spin = 0.9; this.boost = 0;
    this.fF = new Float32Array(this.NS * 9); this.fA = new Float32Array(this.NS * 4); this.fB = new Float32Array(this.NS * 4); this.fP = new Float32Array(this.NS * 4); this.fE = new Float32Array(this.NS * 4);
    this.dF = new Float32Array(this.NF * 4);
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
      const fpsP = parseFloat((this.props || {}).fps) || 60, busy = this.sLive() || now < (this._fastUntil || 0) || this.boost > 0.05;   /* v3.387 orb-lag-fix: 30 fps idle */
      const minMs = 1000 / (busy ? fpsP : Math.min(fpsP, 30)) - 2;
      if (this.lastDraw && now - this.lastDraw < minMs) return;
      const dt = Math.min(0.05, (now - (this.lastDraw || now)) / 1000), sp = this.num(this.mp().speed, 0.75);
      this.time += dt * sp; this.boost *= Math.exp(-1.5 * dt); this.spin0 += (.22 * sp + this.boost) * dt; this.spin = this.spin0 + (this.spinA || 0);
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
