import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

/*
 * og.tsx — the shared Open Graph card generator (next/og + Satori). Every route
 * gets a branded 1200×630 preview so shared links travel well: the COEN mark,
 * an index + title, a soft accent wash seeded from the title, and coen.life.
 *
 * Satori renders a CSS subset — every multi-child box must be display:flex, and
 * fonts must be supplied as raw TTF data (Geist ships .ttf in node_modules).
 */

export const OG_SIZE = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
const geistRegular = readFileSync(join(fontDir, "Geist-Regular.ttf"));
const geistSemiBold = readFileSync(join(fontDir, "Geist-SemiBold.ttf"));
const geistBold = readFileSync(join(fontDir, "Geist-Bold.ttf"));

// Deterministic hue from the title, kept inside the site's muted band (208–292).
function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 208 + (h % 84);
}

export function renderOG(opts: {
  index: string;
  title: string;
  subtitle: string;
  dark?: boolean;
}) {
  const { index, title, subtitle, dark = false } = opts;
  const hue = hueFor(title);

  const bg = dark ? "#0a0a0b" : "#f7f7f5";
  const primary = dark ? "rgba(255,255,255,0.94)" : "rgba(0,0,0,0.88)";
  const secondary = dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const accent = `hsl(${hue} 42% ${dark ? "68%" : "60%"})`;
  const wash = `hsl(${hue} 60% ${dark ? "40%" : "84%"})`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: bg,
          // Two soft accent washes, echoing the site's mesh field.
          backgroundImage: `radial-gradient(60% 70% at 100% 0%, ${wash} 0%, transparent 55%), radial-gradient(50% 60% at 0% 100%, ${wash} 0%, transparent 55%)`,
          fontFamily: "Geist",
        }}
      >
        {/* Top row: wordmark + live dot */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: primary,
            }}
          >
            COEN
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", width: 12, height: 12, borderRadius: 12, backgroundColor: accent }} />
            <div style={{ display: "flex", fontSize: 22, color: secondary }}>coen.life</div>
          </div>
        </div>

        {/* Middle: index + title */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 24,
              letterSpacing: "0.06em",
              color: secondary,
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", color: accent, fontWeight: 600 }}>{index}</div>
            <div style={{ display: "flex", width: 40, height: 2, backgroundColor: accent, opacity: 0.6 }} />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 128,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              color: primary,
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 400,
            color: secondary,
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: geistRegular, weight: 400, style: "normal" },
        { name: "Geist", data: geistSemiBold, weight: 600, style: "normal" },
        { name: "Geist", data: geistBold, weight: 700, style: "normal" },
      ],
    },
  );
}
