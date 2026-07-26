import { NextResponse, type NextRequest } from "next/server";

/*
 * middleware.ts — maintenance mode.
 *
 * HOW TO USE (Vercel):
 *   • To take the site down: set env var  MAINTENANCE = 1  (Project → Settings →
 *     Environment Variables, Production) then redeploy. Every route then returns
 *     a friendly "back soon" page with HTTP 503 (the SEO-safe "temporarily
 *     unavailable" — Google will NOT deindex you for a short outage).
 *   • To bring it back: delete/blank the MAINTENANCE var and set FORCE_MAINTENANCE
 *     to false, then redeploy.
 *   • Optional owner bypass: set  MAINTENANCE_BYPASS = <some-secret>  then visit
 *     https://coen.life/?preview=<some-secret> once — a cookie is set so YOU keep
 *     seeing the live site while everyone else sees maintenance.
 *
 * Locally it's off unless you set MAINTENANCE in .env.local.
 */

// EMERGENCY TAKEDOWN — forced ON. To bring the site back: set this to false
// (or delete these two lines) and push; that redeploys the live site.
const FORCE_MAINTENANCE = true;

const ON = (v?: string) => v === "1" || v === "true" || v === "on";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>coen.life</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{background:#050507;color:#e7e7ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;position:relative;cursor:crosshair;}
  #stage{position:fixed;inset:0;z-index:1;}
  .grain{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
  .vignette{position:fixed;inset:0;z-index:3;pointer-events:none;background:radial-gradient(120% 120% at 50% 46%,transparent 30%,rgba(0,0,0,0.92) 100%);}
  .sig{position:fixed;top:6vh;left:0;right:0;z-index:4;text-align:center;font-weight:600;letter-spacing:0.48em;padding-left:0.48em;font-size:clamp(14px,2.2vw,19px);color:rgba(226,226,230,0.6);}
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
    <div>COEN.LIFE</div>
    <div class="rule"></div>
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

    // smooth closed path through points (midpoint-quadratic)
    function smooth(pts){
      x.beginPath();
      var n=pts.length;
      var mx=(pts[n-1][0]+pts[0][0])/2, my=(pts[n-1][1]+pts[0][1])/2;
      x.moveTo(mx,my);
      for(var i=0;i<n;i++){
        var cur=pts[i], nx=pts[(i+1)%n];
        x.quadraticCurveTo(cur[0],cur[1],(cur[0]+nx[0])/2,(cur[1]+nx[1])/2);
      }
      x.closePath();
    }
    function smoothOpen(pts){
      x.beginPath(); x.moveTo(pts[0][0],pts[0][1]);
      for(var i=1;i<pts.length-1;i++){ x.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2); }
      x.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);
    }

    // bald profile, facing left. fractions of head height, centre origin.
    var OUT=[
      [-0.02,-0.50],[-0.20,-0.47],[-0.30,-0.36],
      [-0.335,-0.20],[-0.315,-0.135],[-0.335,-0.05],
      [-0.42,0.05],[-0.34,0.10],[-0.325,0.115],
      [-0.365,0.155],[-0.345,0.19],[-0.36,0.225],
      [-0.30,0.255],[-0.315,0.32],[-0.245,0.39],
      [-0.10,0.435],[0.06,0.435],[0.20,0.40],
      [0.26,0.22],[0.335,0.02],[0.35,-0.18],[0.24,-0.40]
    ];

    function drawFace(t, breath){
      var FH=Math.min(W*0.72, H*1.02)*0.62;
      var cx=W*0.5 + 0.03*FH, cy=H*0.47;
      var eo=eyeOpenFrom(wake);

      // cold light pool behind — dims slightly as it breathes
      var pr=FH*1.5, pd=0.12+0.04*breath;
      var pool=x.createRadialGradient(cx-FH*0.08, cy-FH*0.05, 0, cx-FH*0.08, cy-FH*0.05, pr);
      pool.addColorStop(0,'rgba(120,126,140,'+pd+')');
      pool.addColorStop(1,'rgba(120,126,140,0)');
      x.fillStyle=pool; x.fillRect(0,0,W,H);

      var rot=aimX*0.18 + twitch;
      x.save();
      x.translate(cx, cy+FH*0.5+breath*FH*0.004);
      x.rotate(rot);
      x.translate(0, -FH*0.5);
      var f=FH;
      var pts=OUT.map(function(p){ return [p[0]*f, p[1]*f]; });
      function L(a){ return a.map(function(p){ return [p[0]*f, p[1]*f]; }); }
      function soft(cl,b){ x.shadowColor=cl; x.shadowBlur=b; }
      function off(){ x.shadowBlur=0; x.shadowColor='transparent'; }
      function blob(cxf,cyf,rx,ry){ x.save(); x.translate(cxf*f,cyf*f); x.scale(1,ry/rx); x.beginPath(); x.arc(0,0,rx*f,0,6.283); x.fill(); x.restore(); }
      function rr(rx,ry,w,h,r){ x.beginPath(); x.moveTo(rx+r,ry); x.arcTo(rx+w,ry,rx+w,ry+h,r); x.arcTo(rx+w,ry+h,rx,ry+h,r); x.arcTo(rx,ry+h,rx,ry,r); x.arcTo(rx,ry,rx+w,ry,r); x.closePath(); }

      // ---- mechanical armature behind ----
      (function(){
        var ny=0.44*f;
        x.save();
        var sg=x.createLinearGradient(-0.14*f,0,0.14*f,0);
        sg.addColorStop(0,'#1c1d21'); sg.addColorStop(0.45,'#54575f'); sg.addColorStop(0.55,'#767981'); sg.addColorStop(0.7,'#42444a'); sg.addColorStop(1,'#141518');
        x.fillStyle=sg; rr(-0.12*f, ny, 0.24*f, 0.15*f, 0.03*f); x.fill();
        x.strokeStyle='#2c2e33'; x.lineWidth=0.02*f; x.lineCap='round';
        x.beginPath(); x.moveTo(-0.07*f, ny+0.13*f); x.lineTo(-0.07*f, ny+0.46*f); x.stroke();
        x.beginPath(); x.moveTo(0.07*f, ny+0.13*f); x.lineTo(0.07*f, ny+0.46*f); x.stroke();
        x.restore();
      })();

      // ---- head fill, harsh raking light from the front-left ----
      x.save();
      smooth(pts); x.clip();

      var base=x.createLinearGradient(-0.42*f,0,0.36*f,0);
      base.addColorStop(0,'hsl(216 11% 82%)');
      base.addColorStop(0.26,'hsl(218 9% 52%)');
      base.addColorStop(0.5,'hsl(220 10% 26%)');
      base.addColorStop(0.72,'hsl(222 12% 11%)');
      base.addColorStop(1,'hsl(224 13% 4%)');
      x.fillStyle=base; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // deep core shadow at the back
      var backsh=x.createLinearGradient(0.0,0,0.34*f,0);
      backsh.addColorStop(0,'rgba(6,6,9,0)');
      backsh.addColorStop(1,'rgba(3,3,5,0.82)');
      x.fillStyle=backsh; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // top light / heavy under-shadow
      var tl=x.createLinearGradient(0,-0.5*f,0,0.5*f);
      tl.addColorStop(0,'rgba(236,240,248,0.12)');
      tl.addColorStop(0.45,'rgba(236,240,248,0)');
      tl.addColorStop(1,'rgba(4,4,6,0.55)');
      x.fillStyle=tl; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // hollow, sunken eye socket
      soft('rgba(4,5,8,0.9)',0.07*f);
      x.fillStyle='rgba(8,9,13,0.5)';
      blob(-0.235,-0.05,0.10,0.06); off();

      // heavy brow ridge, casting down
      x.strokeStyle='rgba(10,10,14,0.7)'; x.lineWidth=0.03*f; x.lineCap='round';
      soft('rgba(8,8,12,0.6)',0.03*f);
      smoothOpen(L([[-0.315,-0.12],[-0.24,-0.135],[-0.17,-0.115]])); x.stroke();
      off(); x.lineCap='butt';

      // ----- the eye: closed when dormant, opens into a dead stare -----
      if(eo < 0.98){
        x.save(); x.globalAlpha = 1 - eo;
        x.strokeStyle='rgba(10,10,14,0.75)'; x.lineWidth=0.011*f; x.lineCap='round';
        smoothOpen(L([[-0.30,-0.05],[-0.243,-0.03],[-0.185,-0.045]])); x.stroke();
        x.fillStyle='rgba(220,224,232,0.12)'; soft('rgba(220,224,232,0.25)',0.04*f);
        blob(-0.246,-0.06,0.045,0.016); off();
        x.restore();
      }
      if(eo > 0.02){
        x.save(); x.globalAlpha = eo;
        var Ecx=-0.238, Ecy=-0.05;
        var F=[-0.305*f,-0.043*f], B=[-0.168*f,-0.056*f];
        var topP=[Ecx*f,(Ecy-0.056*eo)*f], botP=[Ecx*f,(Ecy+0.044*eo)*f];
        // aperture
        x.save();
        x.beginPath(); x.moveTo(F[0],F[1]);
        x.quadraticCurveTo(topP[0],topP[1],B[0],B[1]);
        x.quadraticCurveTo(botP[0],botP[1],F[0],F[1]);
        x.closePath(); x.clip();
        // dead, greyish sclera
        x.fillStyle='hsl(212 6% 62%)'; x.fillRect(-0.32*f,-0.12*f,0.18*f,0.14*f);
        // upper-lid shadow across the sclera
        var lg=x.createLinearGradient(0,(Ecy-0.056)*f,0,(Ecy+0.02)*f);
        lg.addColorStop(0,'rgba(6,7,10,0.85)'); lg.addColorStop(1,'rgba(6,7,10,0)');
        x.fillStyle=lg; x.fillRect(-0.32*f,-0.12*f,0.18*f,0.14*f);
        // faint bloodshot at the front corner
        x.strokeStyle='rgba(150,40,40,0.22)'; x.lineWidth=0.004*f; x.lineCap='round';
        x.beginPath(); x.moveTo(-0.30*f,-0.045*f); x.lineTo(-0.275*f,-0.05*f); x.stroke();
        // iris tracks the pointer
        var isx=clamp((px-0.5)*0.05,-0.028,0.028), isy=clamp((py-0.5)*0.035,-0.016,0.016);
        var Ix=(Ecx-0.006+isx)*f, Iy=(Ecy+isy)*f, ir=0.052*f;
        // milky, dead iris with a pinprick pupil
        var ig=x.createRadialGradient(Ix,Iy,ir*0.2,Ix,Iy,ir);
        ig.addColorStop(0,'hsl(206 11% 61%)'); ig.addColorStop(0.55,'hsl(208 11% 42%)'); ig.addColorStop(1,'hsl(210 15% 19%)');
        x.fillStyle=ig; x.beginPath(); x.arc(Ix,Iy,ir,0,6.283); x.fill();
        x.fillStyle='#010204'; x.beginPath(); x.arc(Ix,Iy,ir*0.36,0,6.283); x.fill();
        x.fillStyle='rgba(228,234,244,0.5)'; x.beginPath(); x.arc(Ix-ir*0.26,Iy-ir*0.3,ir*0.1,0,6.283); x.fill();
        x.restore();
        // upper lash line (heavy)
        x.strokeStyle='rgba(6,6,10,0.85)'; x.lineWidth=0.012*f; x.lineCap='round';
        x.beginPath(); x.moveTo(F[0],F[1]); x.quadraticCurveTo(topP[0],topP[1],B[0],B[1]); x.stroke();
        // lower lid catch
        x.strokeStyle='rgba(230,232,238,0.16)'; x.lineWidth=0.005*f;
        x.beginPath(); x.moveTo(F[0],F[1]); x.quadraticCurveTo(botP[0],botP[1],B[0],B[1]); x.stroke();
        x.restore();
      }

      // nostril + under-nose
      x.fillStyle='rgba(4,5,8,0.6)'; soft('rgba(4,5,8,0.6)',0.03*f);
      blob(-0.335,0.10,0.028,0.018); off();
      x.fillStyle='rgba(6,7,10,0.42)'; soft('rgba(6,7,10,0.5)',0.045*f);
      blob(-0.32,0.125,0.05,0.02); off();

      // gaunt cheek hollow — heavily feathered so it reads as a hollow, not a disc
      x.fillStyle='rgba(6,7,11,0.15)'; soft('rgba(6,7,11,0.26)',0.17*f);
      blob(-0.15,0.10,0.07,0.15); off();

      // mouth crease + thin, colourless lips
      x.strokeStyle='rgba(8,8,12,0.7)'; x.lineWidth=0.011*f; x.lineCap='round';
      smoothOpen(L([[-0.375,0.192],[-0.335,0.202],[-0.29,0.206]])); x.stroke();
      x.lineCap='butt';
      x.fillStyle='rgba(190,190,196,0.14)'; soft('rgba(190,190,196,0.25)',0.03*f);
      blob(-0.345,0.216,0.028,0.014); off();
      x.fillStyle='rgba(5,6,9,0.35)'; soft('rgba(5,6,9,0.45)',0.05*f);
      blob(-0.30,0.268,0.05,0.02); off();

      // ear
      x.strokeStyle='rgba(6,7,10,0.42)'; x.lineWidth=0.014*f; x.lineCap='round';
      soft('rgba(6,7,10,0.4)',0.03*f);
      smoothOpen(L([[0.06,-0.05],[0.11,-0.02],[0.115,0.035],[0.085,0.075]])); x.stroke();
      off(); x.lineCap='butt';

      x.restore(); // unclip

      // ---- cold front rim light ----
      x.save();
      smooth(pts); x.clip();
      var rl=x.createLinearGradient(-0.44*f,0,-0.28*f,0);
      rl.addColorStop(0,'rgba(224,232,248,0.6)');
      rl.addColorStop(1,'rgba(224,232,248,0)');
      x.fillStyle=rl; x.fillRect(-0.6*f,-0.6*f,0.34*f,1.2*f);
      x.restore();

      // sculpted contour edge
      x.save();
      smooth(pts);
      x.strokeStyle='rgba(232,238,250,0.09)'; x.lineWidth=0.006*f; x.stroke();
      x.restore();

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

      // servo twitches while it is awake — a sharp jerk that settles
      if(!reduce && wake>0.45){
        twitchT+=dt;
        if(twitchT>twitchNext){ twitchT=0; twitchNext=1100+Math.random()*3200; twitchV += (Math.random()-0.5)*0.055; }
      }
      twitch += (twitchV-twitch)*Math.min(1,0.35*dt/16);
      twitchV += (0-twitchV)*Math.min(1,0.10*dt/16);
      // faint tremor when fixated
      twitch += reduce?0:(eyeOpenFrom(wake)*0.0035*Math.sin(t*0.02));

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
  if (!FORCE_MAINTENANCE && !ON(process.env.MAINTENANCE)) return NextResponse.next();

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
