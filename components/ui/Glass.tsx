"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { useCapability } from "@/lib/capability";

/*
 * Glass — the ONE liquid-glass surface (§6). Two element types only: the nav
 * shell and exhibition/glass cards. Everything glassy on the site is this
 * component.
 *
 * Capability fallback is the point of the whole design: backdrop-filter blur is
 * the most expensive thing on the page, so when the device can't afford it we
 * render a solid translucent surface with no blur. Same shape, same edges — the
 * layout never shifts, only the material downgrades. This is what protects
 * Lighthouse.
 *
 * Layers (bottom → top): fill · specular (tracks the light field) · static
 * noise · edge highlight · content.
 */

// Static, tiled fractal noise (2–4%). Rendered once by the browser; never
// animated. Encoded inline so there's no extra request.
const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export interface GlassProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Blur radius in px (12–24). Ignored on the fallback path. */
  blur?: number;
  /** Corner radius token. */
  radius?: "sm" | "md" | "lg";
  /** Nav shell vs. exhibition card — only affects default padding/edge weight. */
  variant?: "nav" | "card";
  /** Render as a different tag when semantics call for it. */
  as?: "div" | "section" | "article" | "aside" | "header";
}

const radiusVar = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
} as const;

export const Glass = forwardRef<HTMLElement, GlassProps>(function Glass(
  { children, className, style, blur = 16, radius = "md", variant = "card", as = "div" },
  ref,
) {
  const { canBlur, ready } = useCapability();
  const Tag = as as "div";

  // Until capability resolves we render the cheap solid surface — never flash an
  // expensive blur before we know the device can afford it.
  const useBlur = ready && canBlur;

  const surfaceStyle: CSSProperties = {
    position: "relative",
    borderRadius: radiusVar[radius],
    border: `1px solid ${
      variant === "nav" ? "var(--border-strong)" : "var(--border)"
    }`,
    // Edge highlight: a 1px inset white line, low alpha (§6).
    boxShadow: useBlur
      ? "inset 0 1px 0 var(--glass-edge), 0 8px 40px rgba(0,0,0,0.06)"
      : "inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 24px rgba(0,0,0,0.05)",
    isolation: "isolate",
    overflow: "hidden",
    ...(useBlur
      ? {
          backgroundColor: "var(--glass-fill)",
          backdropFilter: `blur(${blur}px) saturate(1.4)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(1.4)`,
        }
      : {
          // Solid translucent fallback: no backdrop-filter at all.
          backgroundColor: "var(--surface-solid)",
        }),
    ...style,
  };

  return (
    <Tag ref={ref as never} className={className} style={surfaceStyle}>
      {/* Specular highlight tracks the light field (§7). Soft-light keeps it
          from ever reading as a hotspot; opacity scales with intensity. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "inherit",
          background:
            "radial-gradient(120% 90% at var(--light-x) var(--light-y), rgba(255,255,255,calc(0.5 * var(--light-intensity))), rgba(255,255,255,0) 60%)",
          mixBlendMode: "soft-light",
          zIndex: 0,
        }}
      />
      {/* Static noise, 2–4%. Never animated. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: "inherit",
          backgroundImage: NOISE_URL,
          backgroundSize: "120px 120px",
          opacity: "var(--glass-noise-opacity)",
          zIndex: 0,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {children}
      </div>
    </Tag>
  );
});
