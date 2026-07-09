"use client";

import { useCapability } from "@/lib/capability";
import { useLightField } from "@/lib/light";
import { useScrollProgress } from "@/lib/useScrollProgress";

/*
 * LightField — mounts the shared light-field loop (§7). Renders no DOM; it only
 * wires device capability + scroll velocity into lib/light's single rAF loop,
 * which writes --light-x/y/intensity. Enabled only when motion is allowed and
 * capability has resolved. On touch the loop follows scroll velocity alone.
 */
export function LightField() {
  const { finePointer, reducedMotion, ready } = useCapability();
  const { scrollVelocityRef } = useScrollProgress();

  useLightField({
    enabled: ready && !reducedMotion,
    finePointer,
    scrollVelocityRef,
  });

  return null;
}
