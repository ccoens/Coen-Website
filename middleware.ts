import { NextResponse, type NextRequest } from "next/server";

/*
 * middleware.ts — maintenance mode.
 *
 * HOW TO USE (Vercel):
 *   • To take the site down: set env var  MAINTENANCE = 1  (Project → Settings →
 *     Environment Variables, Production) then redeploy. Every route then returns
 *     a friendly "back soon" page with HTTP 503 (the SEO-safe "temporarily
 *     unavailable" — Google will NOT deindex you for a short outage).
 *   • To bring it back: delete/blank the MAINTENANCE var and redeploy.
 *   • Optional owner bypass: set  MAINTENANCE_BYPASS = <some-secret>  then visit
 *     https://coen.life/?preview=<some-secret> once — a cookie is set so YOU keep
 *     seeing the live site while everyone else sees maintenance.
 *
 * Locally it's off unless you set MAINTENANCE in .env.local.
 */

const ON = (v?: string) => v === "1" || v === "true" || v === "on";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>coen.life — back shortly</title>
<style>
  :root { --bg:#f7f7f5; --ink:rgba(0,0,0,0.85); --sub:rgba(0,0,0,0.55); --accent:hsl(232 38% 62%); }
  * { box-sizing:border-box; }
  html,body { height:100%; margin:0; }
  body {
    background: radial-gradient(120% 100% at 50% 0%, #fbfbf9 0%, var(--bg) 55%, #f2f2ee 100%);
    color: var(--ink);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display:flex; align-items:center; justify-content:center; text-align:center;
    padding: 24px;
  }
  .wrap { max-width: 34rem; }
  .mark { font-size: clamp(40px, 10vw, 84px); font-weight:600; letter-spacing:-0.04em; line-height:1; }
  .live { display:inline-flex; align-items:center; gap:8px; margin-top:22px; font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:var(--sub); }
  .dot { width:7px; height:7px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 0 var(--accent); animation:pulse 2.4s ease-out infinite; }
  h1 { font-size: clamp(20px, 3vw, 26px); font-weight:500; margin:18px 0 8px; }
  p { color:var(--sub); line-height:1.6; margin:0; }
  @keyframes pulse { 0%{box-shadow:0 0 0 0 hsl(232 38% 62% / 0.5);} 70%{box-shadow:0 0 0 12px hsl(232 38% 62% / 0);} 100%{box-shadow:0 0 0 0 hsl(232 38% 62% / 0);} }
  @media (prefers-reduced-motion: reduce) { .dot { animation:none; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="mark">COEN</div>
    <div class="live"><span class="dot"></span> Back shortly</div>
    <h1>The site is taking a short breath.</h1>
    <p>coen.life is briefly resting for a quick update. Please check back in a few minutes.</p>
  </div>
</body>
</html>`;

// EMERGENCY TAKEDOWN — forced ON. To bring the site back: set this to false
// (or delete these two lines) and push; that redeploys the live site.
const FORCE_MAINTENANCE = true;

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
