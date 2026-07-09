"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useCapability } from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { springSettle } from "@/lib/motion";

/*
 * GlassButton — the floating glass button (§11 hero CTA, §13 contact).
 * Microinteraction (§14): compress 8–10% on press, spring rebound. A centre-out
 * light sweep runs under the label on hover. Reduced motion drops the press
 * scale and the sweep, keeping only an opacity/border response.
 *
 * It is a real <a>/<button> for accessibility; the glass material is inlined
 * (rather than wrapping <Glass>) so the interactive element stays the surface.
 */

type CommonProps = {
  children: ReactNode;
  className?: string;
};
type LinkProps = CommonProps & { href: string; onClick?: never; type?: never };
type ButtonProps = CommonProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
};
type GlassButtonProps = LinkProps | ButtonProps;

export function GlassButton(props: GlassButtonProps) {
  const { children, className } = props;
  const { canBlur, ready } = useCapability();
  const reduced = useReducedMotion();
  const useBlur = ready && canBlur;

  const surface = {
    position: "relative" as const,
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-1)",
    padding: "14px 26px",
    borderRadius: "999px",
    border: "1px solid var(--border-strong)",
    color: "var(--text-primary)",
    fontSize: "var(--fs-body)",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    textDecoration: "none",
    overflow: "hidden",
    isolation: "isolate" as const,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.55), 0 8px 30px rgba(0,0,0,0.08), 0 0 0 0 var(--accent-glow)",
    ...(useBlur
      ? {
          backgroundColor: "var(--surface)",
          backdropFilter: "blur(18px) saturate(1.5)",
          WebkitBackdropFilter: "blur(18px) saturate(1.5)",
        }
      : { backgroundColor: "var(--surface-solid)" }),
  };

  const motionProps = reduced
    ? {}
    : {
        whileHover: {
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.6), 0 10px 34px rgba(0,0,0,0.10), 0 0 24px 0 var(--accent-glow)",
        },
        whileTap: { scale: 0.92 }, // 8% compress → spring rebound
        transition: springSettle,
      };

  const inner = (
    <>
      {/* Centre-out light sweep on hover; accent-tinted, subtle (§14). */}
      {!reduced && (
        <m.span
          aria-hidden
          initial={{ opacity: 0, scaleX: 0.2 }}
          whileHover={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            insetInline: "18%",
            bottom: 8,
            height: 1.5,
            transformOrigin: "center",
            background:
              "linear-gradient(90deg, transparent, var(--accent), transparent)",
            zIndex: 0,
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <m.a href={props.href} className={className} style={surface} {...motionProps}>
        {inner}
      </m.a>
    );
  }

  return (
    <m.button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={className}
      style={surface}
      {...motionProps}
    >
      {inner}
    </m.button>
  );
}
