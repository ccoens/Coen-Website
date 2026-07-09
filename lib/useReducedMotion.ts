"use client";

import { useEffect, useState } from "react";

/*
 * useReducedMotion — the single hook every animated primitive consults.
 * Returns true when the user has asked the OS for less motion. Starts `true`
 * (the calm default) and resolves on mount, so we never flash big motion before
 * hydration for reduced-motion users. Live-updates if the setting changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
