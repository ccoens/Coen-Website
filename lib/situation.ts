"use client";

/*
 * situation.ts — infers the visitor's *situation* from ambient device + context
 * signals (screen, pointer, hour, orientation, battery, connection). No data is
 * collected or sent; it's read once, on-device, to produce a startlingly
 * specific human sentence for the dossier ("late, on your phone, one-handed").
 */

export interface Situation {
  sentence: string;
  facts: { label: string; value: string }[];
}

function hourPhrase(h: number): string {
  if (h < 5) return "the small hours";
  if (h < 8) return "early morning";
  if (h < 12) return "the morning";
  if (h < 17) return "the afternoon";
  if (h < 21) return "the evening";
  return "late at night";
}

export async function readSituation(): Promise<Situation> {
  const facts: { label: string; value: string }[] = [];
  const h = new Date().getHours();
  const timePhrase = hourPhrase(h);
  facts.push({ label: "Where you are in the day", value: timePhrase });

  const coarse =
    matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  const small = Math.min(window.innerWidth, window.innerHeight) < 640;
  const portrait = matchMedia("(orientation: portrait)").matches;

  let device: string;
  if (coarse && small) device = "on your phone";
  else if (coarse) device = "on a tablet";
  else device = "at a computer";
  facts.push({ label: "Device", value: device });

  const oneHanded = coarse && small && portrait;
  if (oneHanded) facts.push({ label: "Grip", value: "probably one-handed" });

  const scheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  facts.push({ label: "System theme", value: scheme });

  // Connection (where supported).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  let slow = false;
  if (conn?.effectiveType) {
    slow = /2g/.test(conn.effectiveType) || conn.saveData;
    facts.push({ label: "Connection", value: conn.saveData ? "data-saver on" : conn.effectiveType });
  }

  // Battery (where supported).
  let lowBattery = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getBattery = (navigator as any).getBattery;
    if (getBattery) {
      const bat = await getBattery.call(navigator);
      const pct = Math.round(bat.level * 100);
      lowBattery = bat.level < 0.2 && !bat.charging;
      facts.push({
        label: "Battery",
        value: `${pct}%${bat.charging ? ", charging" : ""}`,
      });
    }
  } catch {
    /* unsupported */
  }

  // Compose the read from the most telling facts.
  const bits: string[] = [`It's ${timePhrase} where you are`];
  bits.push(device + (oneHanded ? ", probably one hand on the glass" : ""));
  if (slow) bits.push("riding a patchy connection");
  if (lowBattery) bits.push("battery running low");
  const sentence = bits.join(" — ") + ".";

  return { sentence, facts };
}
