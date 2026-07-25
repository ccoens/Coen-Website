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
  body{background:#0b0b0d;color:#e7e7ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;position:relative;cursor:crosshair;}
  #stage{position:fixed;inset:0;z-index:1;}
  .grain{position:fixed;inset:0;z-index:2;pointer-events:none;opacity:.06;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");}
  .vignette{position:fixed;inset:0;z-index:3;pointer-events:none;background:radial-gradient(120% 120% at 44% 42%,transparent 38%,rgba(0,0,0,0.84) 100%);}
  .sig{position:fixed;top:6vh;left:0;right:0;z-index:4;text-align:center;font-weight:600;letter-spacing:0.46em;padding-left:0.46em;font-size:clamp(14px,2.2vw,19px);color:rgba(231,231,234,0.72);}
  .hud{position:fixed;left:5vw;bottom:6vh;z-index:4;font-family:ui-monospace,"SF Mono",Menlo,Consolas,monospace;font-size:11px;line-height:1.9;letter-spacing:0.18em;color:rgba(210,210,216,0.5);text-transform:uppercase;}
  .hud .row{display:flex;gap:14px;}
  .hud .k{width:78px;color:rgba(210,210,216,0.34);}
  .hud .v{color:rgba(224,224,230,0.72);}
  .hud .rule{width:150px;height:1px;background:rgba(210,210,216,0.16);margin:7px 0;}
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
    var px=0.5, py=0.5, aimX=0, aimY=0, wake=0;
    function pointer(cx,cy){ px=cx/innerWidth; py=cy/innerHeight; lastMove=performance.now(); interacted=true; }
    addEventListener('mousemove',function(e){ pointer(e.clientX,e.clientY); });
    addEventListener('touchmove',function(e){ if(e.touches[0]) pointer(e.touches[0].clientX,e.touches[0].clientY); },{passive:true});

    // smooth closed path through points (midpoint-quadratic)
    function smooth(pts){
      x.beginPath();
      var n=pts.length;
      var mx=(pts[n-1][0]+pts[0][0])/2, my=(pts[n-1][1]+pts[0][1])/2;
      x.moveTo(mx,my);
      for(var i=0;i<n;i++){
        var cur=pts[i], nx=pts[(i+1)%n];
        var midx=(cur[0]+nx[0])/2, midy=(cur[1]+nx[1])/2;
        x.quadraticCurveTo(cur[0],cur[1],midx,midy);
      }
      x.closePath();
    }
    // smooth open curve through points
    function smoothOpen(pts){
      x.beginPath(); x.moveTo(pts[0][0],pts[0][1]);
      for(var i=1;i<pts.length-1;i++){
        var midx=(pts[i][0]+pts[i+1][0])/2, midy=(pts[i][1]+pts[i+1][1])/2;
        x.quadraticCurveTo(pts[i][0],pts[i][1],midx,midy);
      }
      x.lineTo(pts[pts.length-1][0],pts[pts.length-1][1]);
    }

    // profile outline, facing left. fractions of head height, centre origin.
    var OUT=[
      [-0.02,-0.50],[-0.20,-0.47],[-0.30,-0.36],
      [-0.335,-0.20],[-0.315,-0.135],[-0.335,-0.05],
      [-0.42,0.05],[-0.34,0.10],[-0.325,0.115],
      [-0.365,0.155],[-0.345,0.19],[-0.36,0.225],
      [-0.30,0.255],[-0.315,0.32],[-0.245,0.39],
      [-0.10,0.435],[0.06,0.435],[0.20,0.40],
      [0.26,0.22],[0.335,0.02],[0.35,-0.18],[0.24,-0.40]
    ];

    // hair: swept-up quiff, faded sides. outer silhouette, then inner
    // hairline back across the forehead and down past the ear.
    var HAIR=[
      [-0.30,-0.33],[-0.345,-0.44],[-0.30,-0.55],
      [-0.12,-0.605],[0.08,-0.60],[0.265,-0.52],
      [0.33,-0.31],[0.305,-0.14],[0.205,-0.05],
      [0.125,-0.18],[-0.02,-0.28],[-0.16,-0.31]
    ];

    function drawFace(t, breath){
      var cx=W*0.5, cy=H*0.455;
      var FH=Math.min(W*0.72, H*0.98)*0.56;

      // soft gallery pool behind
      var pool=x.createRadialGradient(cx-FH*0.1, cy, 0, cx-FH*0.1, cy, FH*1.6);
      pool.addColorStop(0,'rgba(120,122,134,0.14)');
      pool.addColorStop(1,'rgba(120,122,134,0)');
      x.fillStyle=pool; x.fillRect(0,0,W,H);

      var rot=aimX*0.12;
      x.save();
      x.translate(cx, cy+FH*0.5+breath*FH*0.006);
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
        sg.addColorStop(0,'#212226'); sg.addColorStop(0.45,'#63666e'); sg.addColorStop(0.55,'#888b93'); sg.addColorStop(0.7,'#4c4e54'); sg.addColorStop(1,'#191a1d');
        x.fillStyle=sg; rr(-0.12*f, ny, 0.24*f, 0.15*f, 0.03*f); x.fill();
        x.strokeStyle='#34363b'; x.lineWidth=0.02*f; x.lineCap='round';
        x.beginPath(); x.moveTo(-0.07*f, ny+0.13*f); x.lineTo(-0.07*f, ny+0.42*f); x.stroke();
        x.beginPath(); x.moveTo(0.07*f, ny+0.13*f); x.lineTo(0.07*f, ny+0.42*f); x.stroke();
        x.restore();
      })();

      // ---- head fill, lit from the front-left ----
      x.save();
      smooth(pts); x.clip();

      var base=x.createLinearGradient(-0.45*f,0,0.36*f,0);
      base.addColorStop(0,'hsl(30 20% 85%)');
      base.addColorStop(0.28,'hsl(28 17% 66%)');
      base.addColorStop(0.5,'hsl(26 15% 40%)');
      base.addColorStop(0.72,'hsl(25 14% 18%)');
      base.addColorStop(1,'hsl(24 12% 7%)');
      x.fillStyle=base; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // deepen the back of the skull into black (emerges from the dark)
      var backsh=x.createLinearGradient(0.02*f,0,0.34*f,0);
      backsh.addColorStop(0,'rgba(10,7,5,0)');
      backsh.addColorStop(1,'rgba(6,4,3,0.72)');
      x.fillStyle=backsh; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // top light / under shadow
      var tl=x.createLinearGradient(0,-0.5*f,0,0.5*f);
      tl.addColorStop(0,'rgba(255,250,242,0.14)');
      tl.addColorStop(0.5,'rgba(255,250,242,0)');
      tl.addColorStop(1,'rgba(10,7,5,0.4)');
      x.fillStyle=tl; x.fillRect(-0.6*f,-0.6*f,1.2*f,1.2*f);

      // eye socket — a soft crescent of shadow above the closed lid
      soft('rgba(20,13,9,0.7)',0.05*f);
      x.fillStyle='rgba(26,17,12,0.32)';
      blob(-0.245,-0.085,0.075,0.028); off();
      // closed lash line
      x.strokeStyle='rgba(22,14,10,0.7)'; x.lineWidth=0.011*f; x.lineCap='round';
      smoothOpen(L([[-0.30,-0.05],[-0.245,-0.032],[-0.19,-0.045]])); x.stroke();
      // lid highlight
      x.fillStyle='rgba(245,232,214,0.18)'; soft('rgba(245,232,214,0.35)',0.04*f);
      blob(-0.248,-0.062,0.045,0.018); off();
      // brow — a defined ridge above the eye
      x.strokeStyle='rgba(40,26,17,0.62)'; x.lineWidth=0.026*f; x.lineCap='round';
      soft('rgba(30,20,13,0.5)',0.02*f);
      smoothOpen(L([[-0.31,-0.125],[-0.25,-0.135],[-0.185,-0.12]])); x.stroke();
      off(); x.lineCap='butt';

      // nostril + under-nose
      x.fillStyle='rgba(18,12,8,0.55)'; soft('rgba(18,12,8,0.6)',0.03*f);
      blob(-0.335,0.10,0.028,0.018); off();
      x.fillStyle='rgba(20,13,9,0.4)'; soft('rgba(20,13,9,0.5)',0.04*f);
      blob(-0.32,0.125,0.05,0.02); off();

      // mouth crease + lips
      x.strokeStyle='rgba(20,13,10,0.6)'; x.lineWidth=0.010*f;
      smoothOpen(L([[-0.375,0.192],[-0.335,0.20],[-0.29,0.205]])); x.stroke();
      x.fillStyle='rgba(225,180,160,0.22)'; soft('rgba(225,180,160,0.35)',0.03*f);
      blob(-0.345,0.215,0.03,0.018); off();
      x.fillStyle='rgba(20,13,9,0.3)'; soft('rgba(20,13,9,0.45)',0.05*f);
      blob(-0.30,0.265,0.05,0.02); off();

      // stubble — a very soft, faint shadow over the jaw and chin
      x.fillStyle='rgba(28,20,15,0.06)'; soft('rgba(28,20,15,0.1)',0.11*f);
      blob(-0.21,0.31,0.15,0.10);
      off();

      // ear — a subtle curved fold, set back and mostly in shadow
      x.strokeStyle='rgba(18,12,8,0.4)'; x.lineWidth=0.014*f; x.lineCap='round';
      soft('rgba(18,12,8,0.4)',0.03*f);
      smoothOpen(L([[0.06,-0.05],[0.11,-0.02],[0.115,0.035],[0.085,0.075]])); x.stroke();
      off(); x.lineCap='butt';

      x.restore(); // unclip

      // ---- front rim light (gallery key) ----
      x.save();
      smooth(pts); x.clip();
      var rl=x.createLinearGradient(-0.46*f,0,-0.30*f,0);
      rl.addColorStop(0,'rgba(232,238,250,0.55)');
      rl.addColorStop(1,'rgba(232,238,250,0)');
      x.fillStyle=rl; x.fillRect(-0.6*f,-0.6*f,0.32*f,1.2*f);
      x.restore();

      // sculpted contour edge
      x.save();
      smooth(pts);
      x.strokeStyle='rgba(245,248,255,0.10)'; x.lineWidth=0.006*f; x.stroke();
      x.restore();

      // ---- hair: swept-up quiff with faded sides ----
      var hp=HAIR.map(function(p){ return [p[0]*f, p[1]*f]; });
      // shadow the hairline casts onto the forehead (clipped to skin)
      x.save(); smooth(pts); x.clip();
      x.strokeStyle='rgba(16,11,7,0.45)'; x.lineWidth=0.05*f; x.lineCap='round';
      soft('rgba(16,11,7,0.45)',0.04*f);
      smoothOpen(L([[-0.29,-0.30],[-0.16,-0.295],[-0.03,-0.26]])); x.stroke();
      off(); x.lineCap='butt'; x.restore();
      // hair mass
      x.save(); smooth(hp); x.clip();
      var hg=x.createLinearGradient(-0.34*f,0,0.36*f,0);
      hg.addColorStop(0,'hsl(26 30% 31%)');
      hg.addColorStop(0.4,'hsl(25 26% 18%)');
      hg.addColorStop(0.72,'hsl(23 20% 9%)');
      hg.addColorStop(1,'hsl(22 16% 4%)');
      x.fillStyle=hg; x.fillRect(-0.6*f,-0.7*f,1.2*f,1.0*f);
      // top sheen
      var hs=x.createLinearGradient(0,-0.62*f,0,-0.30*f);
      hs.addColorStop(0,'rgba(240,220,190,0.15)');
      hs.addColorStop(1,'rgba(240,220,190,0)');
      x.fillStyle=hs; x.fillRect(-0.6*f,-0.7*f,1.2*f,0.5*f);
      // strand highlights sweeping up and back
      x.strokeStyle='rgba(210,182,142,0.13)'; x.lineWidth=0.008*f; x.lineCap='round';
      var sw=[-0.02,-0.055,-0.09,-0.125];
      for(var si=0;si<sw.length;si++){ var o=sw[si];
        smoothOpen(L([[-0.28,-0.40+o],[-0.12,-0.50+o],[0.08,-0.50+o],[0.24,-0.42+o]])); x.stroke();
      }
      x.lineCap='butt'; x.restore();
      // crisp hair edge
      x.save(); smooth(hp);
      x.strokeStyle='rgba(18,12,8,0.45)'; x.lineWidth=0.006*f; x.stroke(); x.restore();

      x.restore();
    }

    var last=0;
    function frame(t){
      var dt=last?Math.min(t-last,60):16; last=t;
      var idle=performance.now()-lastMove;
      var target=(interacted&&idle<3200)?1:0;
      wake += (target-wake)*Math.min(1,(target>wake?0.05:0.015)*dt/16);
      aimX += ((px-0.5)*wake - aimX)*Math.min(1,0.04*dt/16);
      aimY += ((py-0.5)*wake - aimY)*Math.min(1,0.04*dt/16);
      var breath=Math.sin(t*(0.0011+wake*0.0007));
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
      hState.textContent = wake>0.5 ? 'Aware' : (interacted?'Drowsing':'Dormant');
    }
    tick(); setInterval(tick, 500);
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
