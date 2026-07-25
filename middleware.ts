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
<title>coen.life — dreaming for a moment</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;}
  body{background:#05060c;color:#eef1fb;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;position:relative;}
  #sky{position:fixed;inset:0;z-index:1;}
  .aurora{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
  .a1{width:70vw;height:70vw;left:-12vw;top:-22vh;background:radial-gradient(circle,hsl(232 72% 56% / 0.55),transparent 62%);animation:drift1 26s ease-in-out infinite;}
  .a2{width:62vw;height:62vw;right:-16vw;bottom:-22vh;background:radial-gradient(circle,hsl(284 60% 56% / 0.42),transparent 62%);animation:drift2 32s ease-in-out infinite;}
  .a3{width:52vw;height:52vw;left:30vw;top:40vh;background:radial-gradient(circle,hsl(198 66% 56% / 0.30),transparent 62%);animation:drift1 38s ease-in-out infinite reverse;}
  @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(6vw,4vh)}}
  @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-5vw,-5vh)}}
  .wrap{position:relative;z-index:2;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;}
  .mark{display:flex;gap:0.01em;font-weight:600;letter-spacing:-0.045em;line-height:1;font-size:clamp(58px,15vw,156px);filter:drop-shadow(0 0 34px hsl(232 75% 66% / 0.6));}
  .mark span{display:inline-block;background:linear-gradient(180deg,#ffffff 0%,#c7d1ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;animation:breathe 5s ease-in-out infinite;}
  .mark span:nth-child(2){animation-delay:.35s}
  .mark span:nth-child(3){animation-delay:.7s}
  .mark span:nth-child(4){animation-delay:1.05s}
  @keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
  .line{margin-top:28px;font-size:clamp(18px,2.6vw,27px);font-weight:400;color:rgba(233,236,251,0.94);}
  .sub{margin-top:12px;font-size:14px;line-height:1.65;color:rgba(233,236,251,0.56);max-width:33rem;}
  .live{margin-top:28px;display:inline-flex;align-items:center;gap:9px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:rgba(233,236,251,0.5);}
  .dot{width:7px;height:7px;border-radius:50%;background:hsl(232 74% 66%);box-shadow:0 0 14px hsl(232 74% 66%);animation:pulse 1.8s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1.35)}}
  .vignette{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 120% at 50% 45%,transparent 55%,rgba(0,0,0,0.55) 100%);}
  @media (prefers-reduced-motion: reduce){*{animation:none !important;}}
</style>
</head>
<body>
  <div class="aurora a1"></div>
  <div class="aurora a2"></div>
  <div class="aurora a3"></div>
  <canvas id="sky"></canvas>
  <div class="vignette"></div>
  <div class="wrap">
    <div class="mark"><span>C</span><span>O</span><span>E</span><span>N</span></div>
    <p class="line">Dreaming for a moment.</p>
    <p class="sub">coen.life has slipped into the dark to catch its breath. It'll be back in a few minutes — the stars are still turning.</p>
    <div class="live"><span class="dot"></span> reconnecting</div>
  </div>
  <script>
  (function(){
    var c=document.getElementById('sky'); if(!c) return;
    var x=c.getContext('2d'); if(!x) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr=Math.min(window.devicePixelRatio||1,2), W=0, H=0;
    function size(){ W=c.width=innerWidth*dpr; H=c.height=innerHeight*dpr; }
    size(); addEventListener('resize', size);
    var stars=[];
    for(var i=0;i<130;i++){ stars.push({x:Math.random(),y:Math.random(),r:Math.random()*1.6+0.3,tw:Math.random()*6.28,vx:(Math.random()-0.5)*0.02,vy:(Math.random()-0.5)*0.02}); }
    var meteors=[], last=0;
    function spawn(){ meteors.push({x:Math.random()*W*0.7,y:Math.random()*H*0.32,vx:(0.5+Math.random()*0.45)*W/900,vy:(0.24+Math.random()*0.2)*H/900,life:0,max:900+Math.random()*450}); }
    function frame(t){
      var dt = last? Math.min(t-last,60):16; last=t;
      x.clearRect(0,0,W,H);
      for(var i=0;i<stars.length;i++){ var s=stars[i];
        if(!reduce){ s.x+=s.vx*0.0006; s.y+=s.vy*0.0006; if(s.x<0)s.x+=1; if(s.x>1)s.x-=1; if(s.y<0)s.y+=1; if(s.y>1)s.y-=1; }
        var tw = reduce?0.7:(0.4+0.6*Math.sin(t*0.002+s.tw));
        x.beginPath(); x.arc(s.x*W,s.y*H,s.r*dpr,0,6.283);
        x.fillStyle='hsla('+(204+s.x*46)+',72%,88%,'+(0.22+tw*0.55)+')'; x.fill();
      }
      if(!reduce){
        if(meteors.length<1 && Math.random()<dt*0.001) spawn();
        for(var j=meteors.length-1;j>=0;j--){ var m=meteors[j];
          m.x+=m.vx*dt; m.y+=m.vy*dt; m.life+=dt;
          var k=Math.max(0,1-m.life/m.max), tx=m.x-m.vx*130, ty=m.y-m.vy*130;
          var g=x.createLinearGradient(m.x,m.y,tx,ty);
          g.addColorStop(0,'hsla(210,92%,92%,'+(0.9*k)+')'); g.addColorStop(1,'hsla(210,92%,92%,0)');
          x.strokeStyle=g; x.lineWidth=1.7*dpr; x.lineCap='round';
          x.beginPath(); x.moveTo(m.x,m.y); x.lineTo(tx,ty); x.stroke();
          if(m.life>m.max||m.x>W+240||m.y>H+240) meteors.splice(j,1);
        }
        requestAnimationFrame(frame);
      }
    }
    if(reduce){ frame(0); } else { requestAnimationFrame(frame); }
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
