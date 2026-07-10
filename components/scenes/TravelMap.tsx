"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "framer-motion";
import type { WorldMap } from "@/lib/worldMap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Reveal } from "@/components/ui/Reveal";

/*
 * TravelMap — the interactive layer of the /travel page. Pre-projected SVG path
 * strings arrive from the server (lib/worldMap); this component owns only the
 * hover state, the on-view cascade that lights each visited country in turn,
 * and the linked chip list. No d3 in the client bundle.
 *
 * Accessibility: the SVG is decorative (aria-hidden); the real, readable content
 * is the country list below, and the figure carries a summary label.
 */

interface Props {
  map: WorldMap;
  labels: readonly string[];
  labelToMapName: Record<string, string>;
  stats: { countries: number; continents: number };
}

const UNVISITED = "rgba(0,0,0,0.055)";
const UNVISITED_HOVER = "rgba(0,0,0,0.13)";

export function TravelMap({ map, labels, labelToMapName, stats }: Props) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // Filled by default so the SSR / no-JS / reduced-motion map is complete with
  // no flash. For motion users we "arm" the cascade below — reset to unlit only
  // while the map is still off-screen, so the light-up plays as it scrolls in.
  const [lit, setLit] = useState(true);
  const armed = useRef(false);

  useEffect(() => {
    if (reduced || armed.current) return;
    const el = wrapRef.current;
    if (!el) return;
    const inView = el.getBoundingClientRect().top < window.innerHeight * 0.85;
    if (!inView) {
      armed.current = true;
      setLit(false);
    }
  }, [reduced]);

  // Stagger order: index among the visited set drives each fill's delay.
  const visitedOrder = useMemo(() => {
    const order = new Map<string, number>();
    let i = 0;
    for (const c of map.countries) if (c.visited) order.set(c.name, i++);
    return order;
  }, [map.countries]);

  const nameToLabel = useMemo(() => {
    const inv: Record<string, string> = {};
    for (const [label, mapName] of Object.entries(labelToMapName)) inv[mapName] = label;
    return inv;
  }, [labelToMapName]);

  const friendly = (name: string) => nameToLabel[name] ?? name;
  const isVisited = (name: string) =>
    visitedOrder.has(name) || map.markers.some((mk) => mk.name === name);

  const onMove = (e: React.PointerEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const cascadeMs = reduced ? 0 : 26;

  return (
    <div className="scene-inner" style={{ paddingBottom: "var(--space-9)" }}>
      <style>{keyframes}</style>

      {/* Headline stats */}
      <Reveal>
        <p
          className="type-caption"
          style={{ color: "var(--text-tertiary)", marginBottom: "var(--space-2)" }}
        >
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{stats.countries}</span>
          {" countries"}
          <span aria-hidden style={{ margin: "0 10px", color: "var(--border-strong)" }}>
            /
          </span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{stats.continents}</span>
          {" continents"}
        </p>
      </Reveal>

      {/* Map */}
      <m.div
        ref={wrapRef}
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHovered(null);
          setPos(null);
        }}
        initial={reduced ? false : { opacity: 0 }}
        whileInView={reduced ? undefined : { opacity: 1 }}
        onViewportEnter={() => setLit(true)}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", marginTop: "var(--space-3)" }}
      >
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          width="100%"
          role="presentation"
          aria-hidden
          style={{ display: "block", overflow: "visible" }}
        >
          {/* Ocean / globe outline */}
          <path
            d={map.sphere}
            fill="rgba(0,0,0,0.018)"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={0.8}
          />
          {map.countries.map((c) => {
            const active = hovered === c.name;
            const order = visitedOrder.get(c.name) ?? 0;
            const fill = c.visited
              ? lit
                ? active
                  ? "hsl(var(--accent-h) var(--accent-s) 50%)"
                  : "var(--accent)"
                : UNVISITED
              : active
                ? UNVISITED_HOVER
                : UNVISITED;
            return (
              <path
                key={c.name}
                d={c.d}
                fill={fill}
                stroke="var(--bg)"
                strokeWidth={0.6}
                onPointerEnter={() => setHovered(c.name)}
                style={{
                  transition: `fill 400ms cubic-bezier(0.22,1,0.36,1)`,
                  transitionDelay: c.visited && !active ? `${order * cascadeMs}ms` : "0ms",
                  filter:
                    active && c.visited
                      ? "drop-shadow(0 0 6px var(--accent-glow))"
                      : "none",
                  cursor: "default",
                }}
              />
            );
          })}
          {/* Micro-state markers */}
          {map.markers.map((mk, i) => {
            const active = hovered === mk.name;
            return (
              <g
                key={mk.name}
                transform={`translate(${mk.x} ${mk.y})`}
                onPointerEnter={() => setHovered(mk.name)}
                style={{
                  opacity: lit ? 1 : 0,
                  transition: "opacity 500ms ease",
                  transitionDelay: `${(visitedOrder.size + i) * cascadeMs}ms`,
                  cursor: "default",
                }}
              >
                {!reduced && (
                  <circle
                    r={6}
                    fill="var(--accent)"
                    opacity={0.28}
                    style={{ animation: "travel-pulse 2.6s ease-in-out infinite" }}
                  />
                )}
                <circle
                  r={active ? 4.4 : 3.2}
                  fill="var(--accent)"
                  stroke="var(--bg)"
                  strokeWidth={1}
                  style={{ transition: "r 200ms var(--ease-primary)" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Cursor tooltip */}
        {hovered && pos && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -150%)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              padding: "5px 10px",
              borderRadius: "999px",
              fontSize: "var(--fs-caption)",
              fontWeight: 500,
              color: "var(--text-primary)",
              background: "var(--surface-solid)",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {isVisited(hovered) && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--accent)",
                  flexShrink: 0,
                }}
              />
            )}
            {friendly(hovered)}
          </div>
        )}
      </m.div>

      {/* Legend + linked list */}
      <div style={{ marginTop: "var(--space-4)" }}>
        <Reveal>
          <p
            className="type-caption"
            style={{ color: "var(--text-tertiary)", marginBottom: "var(--space-3)" }}
          >
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 3,
                background: "var(--accent)",
                marginRight: 8,
                verticalAlign: "-1px",
              }}
            />
            Visited — hover a place to find it on the map. England &amp; Wales counted
            within the United Kingdom.
          </p>
        </Reveal>
        <ul
          aria-label={`${stats.countries} countries visited`}
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-1)",
          }}
        >
          {labels.map((label) => {
            const mapName = labelToMapName[label] ?? label;
            const active = hovered === mapName;
            return (
              <li key={label}>
                <span
                  onPointerEnter={() => setHovered(mapName)}
                  onPointerLeave={() => setHovered((h) => (h === mapName ? null : h))}
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 500,
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    background: active ? "var(--accent-soft)" : "rgba(0,0,0,0.04)",
                    border: active
                      ? "1px solid hsl(var(--accent-h) var(--accent-s) 60% / 0.35)"
                      : "1px solid transparent",
                    transition: "all 200ms var(--ease-primary)",
                    cursor: "default",
                  }}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const keyframes = `
@keyframes travel-pulse {
  0%, 100% { transform: scale(1); opacity: 0.28; }
  50% { transform: scale(1.9); opacity: 0; }
}`;
