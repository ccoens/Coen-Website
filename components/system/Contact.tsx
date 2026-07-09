"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { profile } from "@/content/profile";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useCapability } from "@/lib/capability";
import { Magnetic } from "@/components/ui/Magnetic";

/*
 * Contact (§13/§17) — the site's single contact surface. Clicking "Contact" in
 * the nav opens this overlay instead of firing a bare mailto (which silently
 * does nothing when no mail client is configured). It offers two reliable
 * actions — copy the address, or open a pre-addressed mail draft — plus any
 * real social links. Placeholder socials (href "#fill…") are filtered out so
 * gaps never render as dead links.
 *
 * State lives in a tiny context so the nav (a sibling in AppShell) can open it
 * and the overlay can portal to <body>, escaping the page-transition transform
 * exactly like ProjectExpansion.
 */

type ContactCtx = { open: () => void; close: () => void; isOpen: boolean };
const Ctx = createContext<ContactCtx | null>(null);

export function useContact(): ContactCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useContact must be used within <ContactProvider>");
  return v;
}

export function ContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Ctx.Provider value={{ open, close, isOpen }}>
      {children}
      <ContactOverlay isOpen={isOpen} onClose={close} />
    </Ctx.Provider>
  );
}

const realSocials = profile.socials.filter(
  (s) => !s.href.startsWith("#fill") && !s.label.startsWith("FILL"),
);

function ContactOverlay({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const { canBlur, ready } = useCapability();
  const useBlur = ready && canBlur;
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalHost(document.body);
  }, []);

  // Scroll-lock, Escape, and focus management while open (§17).
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.classList.add("scroll-locked");
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("scroll-locked");
      window.removeEventListener("keydown", onKey);
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Reset the "Copied" pill each time the panel opens.
  useEffect(() => {
    if (!isOpen) setCopied(false);
  }, [isOpen]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the mailto button still works.
    }
  }, []);

  if (!portalHost) return null;

  const transition = reduced
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 260, damping: 26 };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="Contact Coen"
          data-lenis-prevent
          style={{
            position: "fixed",
            inset: 0,
            zIndex: "var(--z-overlay)" as unknown as number,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            padding: "clamp(16px, 5vh, 64px) var(--margin-mobile)",
          }}
        >
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.15 : 0.4 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(20,20,22,0.32)",
              backdropFilter: useBlur ? "blur(6px)" : undefined,
              WebkitBackdropFilter: useBlur ? "blur(6px)" : undefined,
            }}
          />

          <m.div
            initial={{ opacity: 0, y: reduced ? 0 : 18, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.98 }}
            transition={transition}
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(520px, 100%)",
              height: "fit-content",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.24)",
              background: useBlur ? "var(--surface)" : "var(--surface-solid)",
              backdropFilter: useBlur ? "blur(24px) saturate(1.4)" : undefined,
              WebkitBackdropFilter: useBlur ? "blur(24px) saturate(1.4)" : undefined,
            }}
          >
            {/* Soft accent wash at the top of the card. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(120% 80% at 50% -10%, var(--accent-soft), transparent 60%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", padding: "var(--space-6)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "var(--space-3)",
                }}
              >
                <p
                  className="type-caption"
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  Get in touch
                </p>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close contact"
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: "999px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--surface-solid)",
                    fontSize: 16,
                    lineHeight: 1,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>

              <h2
                className="type-h2"
                style={{ fontSize: "clamp(30px, 5vw, 44px)", marginTop: "var(--space-2)" }}
              >
                Let&rsquo;s talk.
              </h2>
              <p
                className="type-body"
                style={{
                  color: "var(--text-secondary)",
                  maxWidth: "38ch",
                  marginTop: "var(--space-2)",
                }}
              >
                Have an idea, a question, or just want to say hello? The quickest
                way to reach me is email — I read every message.
              </p>

              {/* Address row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-2)",
                  marginTop: "var(--space-5)",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-solid)",
                }}
              >
                <span
                  className="type-body"
                  style={{
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.email}
                </span>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copy email address"
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    borderRadius: "999px",
                    border: "1px solid var(--border-strong)",
                    background: "transparent",
                    fontSize: "var(--fs-caption)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    transition: "color 200ms var(--ease-primary)",
                  }}
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>

              {/* Primary action */}
              <Magnetic strength={0.4} block>
                <a
                  href={`mailto:${profile.email}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: "var(--space-3)",
                    padding: "14px 20px",
                    borderRadius: "999px",
                    background: "var(--accent)",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "var(--fs-body)",
                    boxShadow: "0 10px 30px hsl(var(--accent-h) var(--accent-s) 50% / 0.35)",
                  }}
                >
                  Email me <span aria-hidden>→</span>
                </a>
              </Magnetic>

              {realSocials.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--space-3)",
                    marginTop: "var(--space-5)",
                    paddingTop: "var(--space-4)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {realSocials.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="type-caption"
                      style={{
                        color: "var(--text-secondary)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {s.label} ↗
                    </a>
                  ))}
                </div>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    portalHost,
  );
}
