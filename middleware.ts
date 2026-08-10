import { NextResponse, type NextRequest } from "next/server";

/*
 * middleware.ts — maintenance mode.
 *
 * HOW TO USE:
 *   • To take the site down: set FORCE_MAINTENANCE = true below and push. Every
 *     route then returns a maintenance page with HTTP 503 (the SEO-safe
 *     "temporarily unavailable" — Google will NOT deindex you for a short outage).
 *   • To bring it back: set FORCE_MAINTENANCE = false and push.
 *   • "Permanently banned" gag screen: set FORCE_BAN = true and push. Every route
 *     returns the ban page with HTTP 403. Set it back to false to lift it. NOTE:
 *     403 is not SEO-safe — leave it on only briefly or Google may deindex you.
 *   • Optional owner bypass while down: set env var  MAINTENANCE_BYPASS = <secret>
 *     then visit https://coen.life/?preview=<secret> once — a cookie is set so YOU
 *     keep seeing the live site while everyone else sees maintenance.
 */

// Ban switch — when true, every route serves the "permanently banned" page
// (HTTP 403). Takes priority over maintenance. Set to false to lift it.
const FORCE_BAN = true;

// Maintenance switch — the SINGLE source of truth. Set to true (and push) to
// force the whole site into the maintenance page; false keeps it live. This is
// intentionally the only control: no environment variable can override it, so
// reactivating the site never depends on Vercel dashboard state.
const FORCE_MAINTENANCE = false;

const BAN_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Access denied</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{background:#08080a;color:#f4f4f6;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;min-height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:28px;overflow:hidden;position:relative;}
  .glow{position:fixed;inset:0;pointer-events:none;background:radial-gradient(60% 55% at 50% 42%,rgba(220,42,42,0.22),transparent 62%);animation:breathe 4.5s ease-in-out infinite;}
  .scan{position:fixed;inset:0;pointer-events:none;opacity:.5;mix-blend-mode:overlay;background:repeating-linear-gradient(180deg,rgba(255,255,255,0.035) 0 1px,transparent 1px 3px);}
  .wrap{position:relative;max-width:62rem;z-index:2;}
  .tag{font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:12px;letter-spacing:0.42em;text-transform:uppercase;color:rgba(255,92,92,0.92);margin-bottom:26px;display:inline-flex;align-items:center;gap:10px;}
  .dot{width:8px;height:8px;border-radius:50%;background:#ff3b3b;box-shadow:0 0 16px #ff3b3b;animation:pulse 1.6s ease-in-out infinite;}
  h1{font-size:clamp(30px,7.4vw,88px);font-weight:700;letter-spacing:-0.03em;line-height:1.05;}
  h1 .red{color:#ff4646;text-shadow:0 0 44px rgba(255,60,60,0.55);}
  p{margin-top:24px;color:rgba(244,244,246,0.5);font-size:clamp(14px,2vw,18px);line-height:1.6;}
  .foot{position:fixed;bottom:6vh;left:0;right:0;z-index:2;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(244,244,246,0.32);}
  @keyframes pulse{0%,100%{opacity:.5;transform:scale(.8)}50%{opacity:1;transform:scale(1.3)}}
  @keyframes breathe{0%,100%{opacity:.72}50%{opacity:1}}
  @media (prefers-reduced-motion: reduce){.glow,.dot{animation:none}}
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="scan"></div>
  <div class="wrap">
    <div class="tag"><span class="dot"></span> Access denied &middot; 403</div>
    <h1>You've been <span class="red">permanently banned</span> from my website.</h1>
    <p>This decision is final. There is no appeal.</p>
  </div>
  <div class="foot">COEN.LIFE &nbsp;//&nbsp; Connection terminated</div>
</body>
</html>`;


const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>coen.life</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{background:#050507;color:#e7e7ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;position:relative;cursor:crosshair;}
  #stage{position:fixed;inset:0;z-index:1;}
  .grain{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
  .vignette{position:fixed;inset:0;z-index:3;pointer-events:none;background:radial-gradient(120% 120% at 50% 44%,transparent 28%,rgba(0,0,0,0.94) 100%);}
  .sig{position:fixed;top:6vh;left:0;right:0;z-index:4;text-align:center;font-weight:600;letter-spacing:0.48em;padding-left:0.48em;font-size:clamp(14px,2.2vw,19px);color:rgba(226,226,230,0.55);}
  .hud{position:fixed;left:5vw;bottom:6vh;z-index:4;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;line-height:1.9;letter-spacing:0.18em;color:rgba(206,206,214,0.46);text-transform:uppercase;}
  .hud .row{display:flex;gap:14px;}
  .hud .k{width:78px;color:rgba(206,206,214,0.3);}
  .hud .v{color:rgba(224,224,230,0.68);}
  .hud .rule{width:150px;height:1px;background:rgba(206,206,214,0.14);margin:7px 0;}
  @media (prefers-reduced-motion: reduce){.grain{display:none}}
</style>
</head>
<body>
  <canvas id="stage"></canvas>
  <div class="grain"></div>
  <div class="vignette"></div>
  <div class="sig">COEN</div>
  <div class="hud">
    <div>COEN.LIFE</div><div class="rule"></div>
    <div class="row"><span class="k">State</span><span class="v" id="hState">Dormant</span></div>
    <div class="row"><span class="k">Local</span><span class="v" id="hLocal">--:--</span></div>
    <div class="row"><span class="k">Observed</span><span class="v" id="hObs">0s</span></div>
    <div class="row"><span class="k">Status</span><span class="v">Offline &middot; Back shortly</span></div>
  </div>
  <script>
  (function(){
    var c=document.getElementById('stage'); if(!c) return;
    var x=c.getContext('2d'); if(!x) return;
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr=Math.min(window.devicePixelRatio||1,2), W=0,H=0;
    function size(){ W=c.width=innerWidth*dpr; H=c.height=innerHeight*dpr; }
    size(); addEventListener('resize', size);

    var start=Date.now(), lastMove=-99999, interacted=false;
    var px=0.5, py=0.5, aimX=0, aimY=0, wake=0, twitch=0, twitchV=0, twitchT=0, twitchNext=1400;
    function pointer(cx,cy){ px=cx/innerWidth; py=cy/innerHeight; lastMove=performance.now(); interacted=true; }
    addEventListener('mousemove',function(e){ pointer(e.clientX,e.clientY); });
    addEventListener('touchmove',function(e){ if(e.touches[0]) pointer(e.touches[0].clientX,e.touches[0].clientY); },{passive:true});
    function clamp(v,a,bb){ return v<a?a:(v>bb?bb:v); }
    function eyeOpenFrom(w){ return clamp((w-0.30)/0.5,0,1); }

    function smooth(pts){
      x.beginPath(); var n=pts.length;
      x.moveTo((pts[n-1][0]+pts[0][0])/2,(pts[n-1][1]+pts[0][1])/2);
      for(var i=0;i<n;i++){ var cur=pts[i], nx=pts[(i+1)%n];
        x.quadraticCurveTo(cur[0],cur[1],(cur[0]+nx[0])/2,(cur[1]+nx[1])/2); }
      x.closePath();
    }

    // frontal head silhouette (symmetric). fractions of head height, centre origin.
    var OUT=[
      [0,-0.50],[0.20,-0.475],[0.315,-0.34],[0.365,-0.10],
      [0.345,0.14],[0.255,0.33],[0.135,0.44],[0,0.475],
      [-0.135,0.44],[-0.255,0.33],[-0.345,0.14],[-0.365,-0.10],
      [-0.315,-0.34],[-0.20,-0.475]
    ];

    function drawFace(t, breath){
      var FH=Math.min(W*0.62, H*0.98)*0.62;
      var cx=W*0.5, cy=H*0.46;
      var eo=eyeOpenFrom(wake);

      var pr=FH*1.5, pd=0.12+0.04*breath;
      var pool=x.createRadialGradient(cx, cy-FH*0.05, 0, cx, cy-FH*0.05, pr);
      pool.addColorStop(0,'rgba(120,126,140,'+pd+')'); pool.addColorStop(1,'rgba(120,126,140,0)');
      x.fillStyle=pool; x.fillRect(0,0,W,H);

      // subtle head tilt toward the cursor (kept small for a frontal face)
      var rot=aimX*0.05 + twitch*0.5;
      x.save();
      x.translate(cx, cy+breath*FH*0.004);
      x.rotate(rot);
      var f=FH;
      var pts=OUT.map(function(p){ return [p[0]*f, p[1]*f]; });
      function L(a){ return a.map(function(p){ return [p[0]*f, p[1]*f]; }); }
      function soft(cl,b){ x.shadowColor=cl; x.shadowBlur=b; }
      function off(){ x.shadowBlur=0; x.shadowColor='transparent'; }
      function blob(cxf,cyf,rx,ry){ x.save(); x.translate(cxf*f,cyf*f); x.scale(1,ry/rx); x.beginPath(); x.arc(0,0,rx*f,0,6.283); x.fill(); x.restore(); }
      function rr(rx,ry,w,h,r){ x.beginPath(); x.moveTo(rx+r,ry); x.arcTo(rx+w,ry,rx+w,ry+h,r); x.arcTo(rx+w,ry+h,rx,ry+h,r); x.arcTo(rx,ry+h,rx,ry,r); x.arcTo(rx,ry,rx+w,ry,r); x.closePath(); }

      // ---- neck + mechanical mount behind ----
      (function(){
        x.save();
        var ng=x.createLinearGradient(-0.16*f,0,0.16*f,0);
        ng.addColorStop(0,'hsl(220 10% 10%)'); ng.addColorStop(0.5,'hsl(219 9% 22%)'); ng.addColorStop(1,'hsl(220 10% 8%)');
        x.fillStyle=ng; x.beginPath();
        x.moveTo(-0.14*f,0.36*f); x.lineTo(0.14*f,0.36*f); x.lineTo(0.11*f,0.62*f); x.lineTo(-0.11*f,0.62*f); x.closePath(); x.fill();
        var sg=x.createLinearGradient(-0.14*f,0,0.14*f,0);
        sg.addColorStop(0,'#1c1d21'); sg.addColorStop(0.45,'#54575f'); sg.addColorStop(0.55,'#767981'); sg.addColorStop(0.7,'#42444a'); sg.addColorStop(1,'#141518');
        x.fillStyle=sg; rr(-0.13*f, 0.6*f, 0.26*f, 0.14*f, 0.03*f); x.fill();
        x.restore();
      })();

      // ---- head fill: emerges from black, harsh cold key ----
      x.save();
      smooth(pts); x.clip();
      var base=x.createRadialGradient(-0.06*f,-0.10*f,0.04*f, 0,-0.02*f,0.62*f);
      base.addColorStop(0,'hsl(216 11% 74%)');
      base.addColorStop(0.42,'hsl(218 10% 44%)');
      base.addColorStop(0.72,'hsl(221 11% 18%)');
      base.addColorStop(1,'hsl(224 13% 5%)');
      x.fillStyle=base; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.3*f);
      // key from upper-left, shadow lower-right
      var kg=x.createLinearGradient(-0.2*f,-0.3*f,0.28*f,0.4*f);
      kg.addColorStop(0,'rgba(240,244,252,0.12)'); kg.addColorStop(0.5,'rgba(240,244,252,0)'); kg.addColorStop(1,'rgba(4,4,7,0.5)');
      x.fillStyle=kg; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.3*f);
      // deep jaw/lower shadow
      var jg=x.createLinearGradient(0,0.1*f,0,0.5*f);
      jg.addColorStop(0,'rgba(4,4,7,0)'); jg.addColorStop(1,'rgba(3,3,6,0.7)');
      x.fillStyle=jg; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.3*f);

      // temples / eye-socket shadow band
      x.fillStyle='rgba(6,7,11,0.26)'; soft('rgba(6,7,11,0.4)',0.13*f);
      blob(-0.17,-0.05,0.13,0.08); blob(0.17,-0.05,0.13,0.08); off();

      // brows — slight inward scowl
      x.strokeStyle='rgba(9,9,13,0.72)'; x.lineWidth=0.028*f; x.lineCap='round';
      soft('rgba(8,8,12,0.5)',0.02*f);
      x.beginPath(); var lb=L([[-0.275,-0.145],[-0.17,-0.16],[-0.075,-0.12]]);
      x.moveTo(lb[0][0],lb[0][1]); x.quadraticCurveTo(lb[1][0],lb[1][1],lb[2][0],lb[2][1]); x.stroke();
      x.beginPath(); var rb=L([[0.275,-0.145],[0.17,-0.16],[0.075,-0.12]]);
      x.moveTo(rb[0][0],rb[0][1]); x.quadraticCurveTo(rb[1][0],rb[1][1],rb[2][0],rb[2][1]); x.stroke();
      off(); x.lineCap='butt';

      // ---- the two eyes ----
      function eye(sx){
        var Ecx=0.155*sx, Ey=-0.045, hw=0.105;
        var Fo=[(Ecx+hw*sx)*f, (Ey+0.006)*f];  // outer corner
        var Fi=[(Ecx-hw*sx)*f, (Ey+0.012)*f];  // inner corner (toward nose, a touch lower)
        // closed lid
        if(eo<0.98){
          x.save(); x.globalAlpha=1-eo;
          x.strokeStyle='rgba(9,9,13,0.78)'; x.lineWidth=0.011*f; x.lineCap='round';
          x.beginPath(); x.moveTo(Fi[0],Fi[1]);
          x.quadraticCurveTo(Ecx*f,(Ey+0.03)*f, Fo[0],Fo[1]); x.stroke();
          x.fillStyle='rgba(220,224,232,0.10)'; soft('rgba(220,224,232,0.2)',0.035*f);
          blob(Ecx,Ey-0.012,0.075,0.02); off();
          x.restore();
        }
        if(eo>0.02){
          x.save(); x.globalAlpha=eo;
          var topP=[Ecx*f,(Ey-0.05*eo)*f], botP=[Ecx*f,(Ey+0.042*eo)*f];
          x.save();
          x.beginPath(); x.moveTo(Fi[0],Fi[1]);
          x.quadraticCurveTo(topP[0],topP[1],Fo[0],Fo[1]);
          x.quadraticCurveTo(botP[0],botP[1],Fi[0],Fi[1]);
          x.closePath(); x.clip();
          x.fillStyle='hsl(212 6% 60%)'; x.fillRect((Ecx-0.14)*f,(Ey-0.1)*f,0.28*f,0.18*f);
          var lg=x.createLinearGradient(0,(Ey-0.05)*f,0,(Ey+0.02)*f);
          lg.addColorStop(0,'rgba(6,7,10,0.9)'); lg.addColorStop(1,'rgba(6,7,10,0)');
          x.fillStyle=lg; x.fillRect((Ecx-0.14)*f,(Ey-0.1)*f,0.28*f,0.18*f);
          // iris/pupil tracks the cursor (both eyes look the same way)
          var isx=clamp((px-0.5)*0.06,-0.04,0.04), isy=clamp((py-0.5)*0.04,-0.02,0.02);
          var Ix=(Ecx+isx)*f, Iy=(Ey+0.004+isy)*f, ir=0.05*f;
          var ig=x.createRadialGradient(Ix,Iy,ir*0.2,Ix,Iy,ir);
          ig.addColorStop(0,'hsl(206 11% 61%)'); ig.addColorStop(0.55,'hsl(208 11% 41%)'); ig.addColorStop(1,'hsl(210 15% 18%)');
          x.fillStyle=ig; x.beginPath(); x.arc(Ix,Iy,ir,0,6.283); x.fill();
          x.fillStyle='#010204'; x.beginPath(); x.arc(Ix,Iy,ir*0.36,0,6.283); x.fill();
          x.fillStyle='rgba(228,234,244,0.5)'; x.beginPath(); x.arc(Ix-ir*0.26,Iy-ir*0.3,ir*0.1,0,6.283); x.fill();
          x.restore();
          // heavy upper lash
          x.strokeStyle='rgba(5,5,9,0.85)'; x.lineWidth=0.012*f; x.lineCap='round';
          x.beginPath(); x.moveTo(Fi[0],Fi[1]); x.quadraticCurveTo(topP[0],topP[1],Fo[0],Fo[1]); x.stroke();
          x.strokeStyle='rgba(228,230,238,0.14)'; x.lineWidth=0.005*f;
          x.beginPath(); x.moveTo(Fi[0],Fi[1]); x.quadraticCurveTo(botP[0],botP[1],Fo[0],Fo[1]); x.stroke();
          x.restore();
        }
      }
      eye(-1); eye(1);

      // ---- nose ----
      // ridge highlight (catches the front light)
      x.fillStyle='rgba(232,236,244,0.10)'; soft('rgba(232,236,244,0.18)',0.045*f);
      blob(-0.012,0.01,0.028,0.11); off();
      // right-side shadow of the nose
      x.fillStyle='rgba(5,6,10,0.28)'; soft('rgba(5,6,10,0.4)',0.08*f);
      blob(0.052,0.05,0.032,0.12); off();
      // tip
      x.fillStyle='rgba(228,232,240,0.10)'; soft('rgba(228,232,240,0.2)',0.035*f);
      blob(-0.005,0.13,0.045,0.035); off();
      // nostrils + under-nose shadow
      x.fillStyle='rgba(3,4,7,0.6)'; soft('rgba(3,4,7,0.6)',0.025*f);
      blob(-0.052,0.15,0.028,0.018); blob(0.052,0.15,0.028,0.018); off();
      x.fillStyle='rgba(5,6,9,0.4)'; soft('rgba(5,6,9,0.5)',0.045*f);
      blob(0,0.175,0.09,0.022); off();

      // ---- cheek hollows (gaunt), heavily feathered ----
      x.fillStyle='rgba(5,6,10,0.1)'; soft('rgba(5,6,10,0.19)',0.2*f);
      blob(-0.235,0.15,0.075,0.14); blob(0.235,0.15,0.075,0.14); off();

      // ---- mouth: a single colourless, grim seam ----
      x.fillStyle='rgba(4,5,8,0.2)'; soft('rgba(4,5,8,0.3)',0.11*f);
      blob(0,0.33,0.14,0.06); off();
      x.strokeStyle='rgba(6,6,11,0.82)'; x.lineWidth=0.015*f; x.lineCap='round';
      x.beginPath(); var mp=L([[-0.10,0.278],[0,0.29],[0.10,0.278]]);
      x.moveTo(mp[0][0],mp[0][1]); x.quadraticCurveTo(mp[1][0],mp[1][1],mp[2][0],mp[2][1]); x.stroke();
      x.lineCap='butt';
      x.fillStyle='rgba(198,200,206,0.06)'; soft('rgba(198,200,206,0.13)',0.05*f);
      blob(0,0.305,0.055,0.014); off();
      // chin highlight
      x.fillStyle='rgba(224,228,236,0.07)'; soft('rgba(224,228,236,0.13)',0.055*f);
      blob(-0.01,0.405,0.08,0.035); off();

      x.restore(); // unclip

      // rim light on both sides (cold)
      x.save(); smooth(pts); x.clip();
      var rlL=x.createLinearGradient(-0.38*f,0,-0.24*f,0);
      rlL.addColorStop(0,'rgba(220,228,244,0.4)'); rlL.addColorStop(1,'rgba(220,228,244,0)');
      x.fillStyle=rlL; x.fillRect(-0.5*f,-0.6*f,0.2*f,1.3*f);
      var rlR=x.createLinearGradient(0.38*f,0,0.24*f,0);
      rlR.addColorStop(0,'rgba(150,160,185,0.18)'); rlR.addColorStop(1,'rgba(150,160,185,0)');
      x.fillStyle=rlR; x.fillRect(0.30*f,-0.6*f,0.2*f,1.3*f);
      x.restore();
      // contour
      x.save(); smooth(pts); x.strokeStyle='rgba(232,238,250,0.08)'; x.lineWidth=0.006*f; x.stroke(); x.restore();

      x.restore();
    }

    var last=0;
    function frame(t){
      var dt=last?Math.min(t-last,60):16; last=t;
      var idle=performance.now()-lastMove;
      var target=(interacted&&idle<3600)?1:0;
      wake += (target-wake)*Math.min(1,(target>wake?0.05:0.012)*dt/16);
      aimX += ((px-0.5)*wake - aimX)*Math.min(1,0.045*dt/16);
      aimY += ((py-0.5)*wake - aimY)*Math.min(1,0.045*dt/16);
      if(!reduce && wake>0.45){ twitchT+=dt;
        if(twitchT>twitchNext){ twitchT=0; twitchNext=1100+Math.random()*3200; twitchV += (Math.random()-0.5)*0.04; } }
      twitch += (twitchV-twitch)*Math.min(1,0.35*dt/16);
      twitchV += (0-twitchV)*Math.min(1,0.10*dt/16);
      twitch += reduce?0:(eyeOpenFrom(wake)*0.002*Math.sin(t*0.02));
      var breath=Math.sin(t*(0.0010+wake*0.0006));
      x.clearRect(0,0,W,H);
      drawFace(t, reduce?0:breath);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    var hState=document.getElementById('hState'), hLocal=document.getElementById('hLocal'), hObs=document.getElementById('hObs');
    function tick(){
      var d=new Date();
      hLocal.textContent=(d.getHours()<10?'0':'')+d.getHours()+':'+(d.getMinutes()<10?'0':'')+d.getMinutes();
      hObs.textContent=Math.floor((Date.now()-start)/1000)+'s';
      var eo=eyeOpenFrom(wake);
      hState.textContent = !interacted ? 'Dormant' : (eo>0.75 ? 'Fixated' : (wake>0.4 ? 'Waking' : 'Drowsing'));
    }
    tick(); setInterval(tick, 400);
  })();
  </script>
</body>
</html>`;

export function middleware(req: NextRequest) {
  if (FORCE_BAN) {
    return new NextResponse(BAN_PAGE, {
      status: 403,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  if (!FORCE_MAINTENANCE) return NextResponse.next();

  // Owner bypass: ?preview=<secret> sets a cookie; a matching cookie lets you through.
  const secret = process.env.MAINTENANCE_BYPASS;
  if (secret) {
    const url = new URL(req.url);
    const viaQuery = url.searchParams.get("preview") === secret;
    const viaCookie = req.cookies.get("maint_bypass")?.value === secret;
    if (viaQuery || viaCookie) {
      const res = NextResponse.next();
      if (viaQuery) res.cookies.set("maint_bypass", secret, { path: "/", httpOnly: true, maxAge: 60 * 60 });
      return res;
    }
  }

  return new NextResponse(PAGE, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "Retry-After": "600",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// Run on everything except Next internals and the favicon/icon, so the
// self-contained page always renders cleanly.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
