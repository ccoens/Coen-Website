"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { visitorLocation, sunElevation, visitorSky } from "@/lib/sky";
import { CANBERRA, haversineKm, bearingDeg, compass8, type LatLng } from "@/lib/geo";
import { useReducedMotion } from "@/lib/useReducedMotion";

/*
 * Connection — the quiet "you and Coen" beat under the Canberra time. It greets
 * the visitor in their own language, tells them how far they are from Coen (with
 * a compass that points toward Canberra), and — when it's night in both places —
 * notes that they're under the same stars. All from the timezone/solar data we
 * already compute; nothing leaves the device. Client-only, so it renders after
 * mount to avoid a hydration mismatch.
 */

const GREETINGS: Record<string, string> = {
  en: "Hello", fr: "Bonjour", es: "Hola", de: "Hallo", it: "Ciao", pt: "Olá",
  nl: "Hallo", sv: "Hej", da: "Hej", no: "Hei", fi: "Moi", pl: "Cześć",
  cs: "Ahoj", sk: "Ahoj", el: "Γεια σου", tr: "Merhaba", ru: "Привет",
  uk: "Привіт", ar: "مرحبا", he: "שלום", hi: "नमस्ते", th: "สวัสดี",
  vi: "Xin chào", id: "Halo", ms: "Helo", ja: "こんにちは", ko: "안녕하세요",
  zh: "你好", ro: "Salut", hu: "Szia", is: "Halló",
};

function greeting(): string {
  try {
    const lang = (navigator.language || "en").toLowerCase().split("-")[0];
    return GREETINGS[lang] ?? "Hello";
  } catch {
    return "Hello";
  }
}

interface ConnData {
  hello: string;
  km: number | null;
  dir: string;
  bearing: number;
  sharedSky: boolean;
}

export function Connection() {
  const reduced = useReducedMotion();
  const [data, setData] = useState<ConnData | null>(null);

  useEffect(() => {
    const now = new Date();
    const loc = visitorLocation(now);
    let km: number | null = null;
    let dir = "";
    let bearing = 0;
    if (loc.known && loc.lat != null) {
      const here: LatLng = { lat: loc.lat, lng: loc.lng };
      km = haversineKm(here, CANBERRA);
      bearing = bearingDeg(here, CANBERRA);
      dir = compass8(bearing);
    }
    const visitorNight = visitorSky(now).night > 0.6;
    const canberraNight = sunElevation(now, CANBERRA.lat, CANBERRA.lng) < -6;
    setData({ hello: greeting(), km, dir, bearing, sharedSky: visitorNight && canberraNight });
  }, []);

  if (!data) return null;

  const kmLabel =
    data.km != null ? (Math.round(data.km / 10) * 10).toLocaleString() : null;

  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      style={{
        marginTop: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <p
        className="type-caption"
        style={{ letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--text-tertiary)" }}
      >
        {data.hello}
      </p>

      {kmLabel && (
        <p
          className="type-body"
          style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--text-secondary)" }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden style={{ flexShrink: 0 }}>
            <circle cx={12} cy={12} r={10} fill="none" stroke="var(--border-strong)" strokeWidth={1.2} />
            <g transform={`rotate(${data.bearing} 12 12)`}>
              <path d="M12 3.5 L9.2 13 L12 11.2 L14.8 13 Z" fill="var(--accent)" />
            </g>
          </svg>
          You&rsquo;re {kmLabel} km from Coen · {data.dir}
        </p>
      )}

      {data.sharedSky && (
        <p className="type-caption" style={{ color: "var(--accent)" }}>
          Right now, you&rsquo;re both under the stars.
        </p>
      )}
    </m.div>
  );
}
