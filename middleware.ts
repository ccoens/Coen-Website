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
  body{background:#04050a;color:#eef1fb;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden;position:relative;cursor:crosshair;}
  #sky{position:fixed;inset:0;z-index:1;}
  .aurora{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;opacity:.5;}
  .a1{width:66vw;height:66vw;left:-16vw;top:-24vh;background:radial-gradient(circle,hsl(230 70% 50% / 0.5),transparent 62%);animation:drift1 30s ease-in-out infinite;}
  .a2{width:60vw;height:60vw;right:-18vw;bottom:-24vh;background:radial-gradient(circle,hsl(272 58% 50% / 0.4),transparent 62%);animation:drift2 36s ease-in-out infinite;}
  @keyframes drift1{0%,100%{transform:translate(0,0)}50%{transform:translate(5vw,4vh)}}
  @keyframes drift2{0%,100%{transform:translate(0,0)}50%{transform:translate(-4vw,-5vh)}}
  .vignette{position:fixed;inset:0;z-index:2;pointer-events:none;background:radial-gradient(120% 120% at 50% 48%,transparent 46%,rgba(0,0,0,0.72) 100%);}
  .sig{position:fixed;top:6vh;left:0;right:0;z-index:3;text-align:center;font-weight:600;letter-spacing:0.42em;padding-left:0.42em;font-size:clamp(15px,2.4vw,20px);color:transparent;background:linear-gradient(180deg,#ffffff,#aeb9ff);-webkit-background-clip:text;background-clip:text;opacity:.82;}
  .whisper{position:fixed;bottom:10vh;left:0;right:0;z-index:3;text-align:center;padding:0 24px;font-size:clamp(15px,2.5vw,22px);font-weight:400;line-height:1.5;color:rgba(226,231,251,0.82);min-height:1.6em;text-shadow:0 0 22px rgba(70,96,220,0.35);}
  .caret{display:inline-block;width:0.5ch;margin-left:1px;color:rgba(150,170,255,0.9);animation:blink 1.05s step-end infinite;}
  @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.aurora{animation:none}.caret{animation:none}}
</style>
</head>
<body>
  <div class="aurora a1"></div>
  <div class="aurora a2"></div>
  <canvas id="sky"></canvas>
  <div class="vignette"></div>
  <div class="sig">COEN</div>
  <p class="whisper"><span id="say"></span><span class="caret">&#9601;</span></p>
  <script>
  (function(){
    var c=document.getElementById('sky'); if(!c) return;
    var x=c.getContext('2d'); if(!x) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dpr=Math.min(window.devicePixelRatio||1,2), W=0, H=0;
    function size(){ W=c.width=innerWidth*dpr; H=c.height=innerHeight*dpr; }
    size(); addEventListener('resize', size);

    // ---- presence state ----
    var start = Date.now();
    var lastMove = -99999;        // ms timestamp of last real interaction
    var interacted = false;
    var px = 0.5, py = 0.5;       // pointer, normalised (0..1). starts centred.
    var wake = 0;                 // 0 = asleep, 1 = fully awake (smoothed)
    var blink = 0;                // 0..1 lid-close pulse
    var nextBlink = 2200 + Math.random()*3000;
    var blinkT = 0;

    function pointer(cx, cy){
      px = cx/innerWidth; py = cy/innerHeight;
      lastMove = performance.now();
      if(!interacted){ interacted = true; onFirstWake(); }
    }
    addEventListener('mousemove', function(e){ pointer(e.clientX, e.clientY); });
    addEventListener('touchstart', function(e){ if(e.touches[0]) pointer(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
    addEventListener('touchmove', function(e){ if(e.touches[0]) pointer(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});

    // ---- star field (the void it sleeps in) ----
    var stars=[];
    for(var i=0;i<140;i++){ stars.push({x:Math.random(),y:Math.random(),r:Math.random()*1.5+0.3,tw:Math.random()*6.28}); }

    // ---- the eye ----
    function almond(cx, cy, ew, open){
      var mh = ew*0.62*Math.max(0.06, open);
      x.beginPath();
      x.moveTo(cx-ew, cy);
      x.quadraticCurveTo(cx, cy-mh, cx+ew, cy);
      x.quadraticCurveTo(cx, cy+mh, cx-ew, cy);
      x.closePath();
      return mh;
    }

    function drawEye(t, breath){
      var cx=W*0.5, cy=H*0.485;
      var ew=Math.min(W,H)*0.155;
      // lid openness: asleep ~ a slit, awake ~ open, minus any blink.
      var open = (0.09 + wake*0.9) * (1 - blink*0.94);
      var mh = ew*0.62*Math.max(0.06, open);

      // ambient presence bloom behind the eye — intensifies when awake.
      var br = ew*(2.4 + 0.16*breath) * (0.7 + wake*0.7);
      var bg = x.createRadialGradient(cx, cy, 0, cx, cy, br);
      bg.addColorStop(0, 'hsla(226,90%,64%,'+(0.05+wake*0.16)+')');
      bg.addColorStop(0.5, 'hsla(250,80%,56%,'+(0.02+wake*0.07)+')');
      bg.addColorStop(1, 'hsla(250,80%,56%,0)');
      x.fillStyle=bg; x.beginPath(); x.arc(cx,cy,br,0,6.283); x.fill();

      // gaze — iris leans toward the pointer.
      var gx=(px-0.5), gy=(py-0.5);
      var glen=Math.sqrt(gx*gx+gy*gy)||1;
      var reach=ew*0.30*wake;
      var ox=(gx/glen)*Math.min(glen*ew*2.2, reach);
      var oy=(gy/glen)*Math.min(glen*ew*2.2, reach)*0.7;

      x.save();
      almond(cx, cy, ew, open);
      x.clip();

      // sclera: near-black with a faint inner glow so it reads in the void.
      var sg=x.createRadialGradient(cx,cy,0,cx,cy,ew);
      sg.addColorStop(0,'hsla(224,50%,10%,1)');
      sg.addColorStop(1,'hsla(224,60%,4%,1)');
      x.fillStyle=sg; x.fillRect(cx-ew,cy-mh,ew*2,mh*2);

      // iris
      var ir=mh*1.15;
      var icx=cx+ox, icy=cy+oy;
      var ig=x.createRadialGradient(icx,icy,ir*0.18,icx,icy,ir);
      ig.addColorStop(0,'hsla(224,85%,'+(30+wake*30)+'%,1)');
      ig.addColorStop(0.6,'hsla(232,80%,'+(20+wake*20)+'%,1)');
      ig.addColorStop(1,'hsla(236,70%,7%,1)');
      x.fillStyle=ig; x.beginPath(); x.arc(icx,icy,ir,0,6.283); x.fill();

      // iris striations for texture
      x.strokeStyle='hsla(220,90%,80%,'+(0.05+wake*0.10)+')'; x.lineWidth=1*dpr;
      for(var s=0;s<28;s++){ var a=s/28*6.283; x.beginPath();
        x.moveTo(icx+Math.cos(a)*ir*0.34, icy+Math.sin(a)*ir*0.34);
        x.lineTo(icx+Math.cos(a)*ir*0.95, icy+Math.sin(a)*ir*0.95); x.stroke(); }

      // pupil — dilates as it wakes, contracts a touch when fully alert.
      var pr=ir*(0.30+wake*0.16);
      x.fillStyle='#01030a'; x.beginPath(); x.arc(icx,icy,pr,0,6.283); x.fill();
      x.strokeStyle='hsla(228,90%,70%,'+(0.10+wake*0.28)+')'; x.lineWidth=1.4*dpr;
      x.beginPath(); x.arc(icx,icy,pr,0,6.283); x.stroke();

      // specular catch-light
      x.fillStyle='hsla(210,100%,96%,'+(0.28+wake*0.5)+')';
      x.beginPath(); x.arc(icx-ir*0.28, icy-ir*0.30, ir*0.11, 0, 6.283); x.fill();

      x.restore();

      // upper-lid rim light — a thin bright edge along the top of the opening.
      x.save();
      x.strokeStyle='hsla(222,90%,82%,'+(0.10+wake*0.35)+')';
      x.lineWidth=1.6*dpr; x.lineCap='round';
      x.beginPath(); x.moveTo(cx-ew, cy); x.quadraticCurveTo(cx, cy-mh, cx+ew, cy); x.stroke();
      x.restore();
    }

    var last=0;
    function frame(t){
      var dt = last? Math.min(t-last,60):16; last=t;

      // wake target from idle time
      var idle = performance.now()-lastMove;
      var target = (interacted && idle<2600) ? 1 : 0;
      var rate = target>wake ? 0.06 : 0.02;      // wakes fast, sleeps slow
      wake += (target-wake)*Math.min(1, rate*dt/16);

      // breathing: slow when asleep, quicker when awake
      var brate = 0.0011 + wake*0.0013;
      var breath = Math.sin(t*brate);

      // blinks (only while at least partly awake)
      if(!reduce && wake>0.3){
        blinkT += dt;
        if(blinkT>nextBlink){ blinkT=0; nextBlink=2600+Math.random()*4200; blink=1; }
      }
      blink += (0-blink)*Math.min(1,0.22*dt/16);

      x.clearRect(0,0,W,H);

      // stars — drift a touch toward the pointer when awake (its attention).
      for(var i=0;i<stars.length;i++){ var s=stars[i];
        var twp = reduce?0.6:(0.4+0.6*Math.sin(t*0.002+s.tw));
        var ax=s.x + (px-s.x)*0.04*wake, ay=s.y + (py-s.y)*0.04*wake;
        x.beginPath(); x.arc(ax*W,ay*H,s.r*dpr,0,6.283);
        x.fillStyle='hsla('+(210+s.x*40)+',70%,86%,'+(0.16+twp*0.5)+')'; x.fill();
      }

      drawEye(t, reduce?0:breath);

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // ---- the voice: quiet, aware lines that type themselves ----
    var sayEl=document.getElementById('say');
    var token=0;
    function type(str){
      var my=++token; var i=0;
      (function step(){ if(my!==token) return;
        sayEl.textContent=str.slice(0,i); i++;
        if(i<=str.length) setTimeout(step, 32+Math.random()*26);
      })();
    }
    function clock(){
      var d=new Date(); var h=d.getHours(); var m=d.getMinutes();
      var ap=h<12?'am':'pm'; var hh=h%12; if(hh===0) hh=12;
      return hh+':'+(m<10?'0':'')+m+' '+ap;
    }
    function secs(){ return Math.floor((Date.now()-start)/1000); }
    function timeMood(){
      var h=new Date().getHours();
      if(h<5) return 'the small hours. brave of you.';
      if(h<12) return 'morning, then.';
      if(h<18) return 'the afternoon light.';
      if(h<22) return 'evening already.';
      return 'it is late.';
    }
    var lines=[
      function(){ return 'it is ' + clock() + ' where you are.'; },
      function(){ return 'i can see you.'; },
      function(){ return 'you have been watching for ' + secs() + 's.'; },
      function(){ return timeMood(); },
      function(){ return 'stay a while.'; },
      function(){ return 'i know you are there.'; }
    ];
    var li=0, drowsing=false, wokeText=false;

    function onFirstWake(){ /* handled by the tick once wake rises */ }

    if(reduce){
      type('something is sleeping here. it can feel that you arrived.');
    } else {
      type('something is sleeping here.');
      setInterval(function(){
        if(!interacted){ return; }
        if(wake>0.55){
          if(!wokeText){ wokeText=true; drowsing=false; type('you woke it.'); return; }
          li=(li+1)%lines.length; type(lines[li]());
        } else if(wake<0.25 && wokeText && !drowsing){
          drowsing=true; wokeText=false; type('it is drifting back to sleep.');
        }
      }, 4600);
    }
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
