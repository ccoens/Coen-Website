"use client";

import { useEffect, useRef } from "react";
import { useCapability } from "@/lib/capability";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { canberraNow } from "@/lib/time";

/*
 * ShaderHero — the futuristic landing hero (raw WebGL, no 3D library, so it adds
 * ~0KB of dependencies). A domain-warped fbm field flows slowly and warps toward
 * the cursor, tinted by the live accent hue so it stays in the site's palette.
 * It reads as liquid glass light, not a demo.
 *
 * Strictly gated: only mounts on capable, fine-pointer, motion-allowed devices.
 * Everywhere else it renders nothing and the CSS mesh Background shows through —
 * same field, cheaper. Pauses when the hero scrolls off-screen or the tab hides.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// WebGL1 fragment shader — domain-warped fractal noise, mapped to pale
// accent-tinted washes over the warm off-white field.
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;   // normalised 0..1, y-down
uniform float uHue;    // degrees
uniform float uDaylight; // 0 = Canberra deep night, 1 = midday
uniform float uEnergy;   // 0 = idle/settled, 1 = fully awake (recent movement)

float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i); float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0)); float d = hash(i+vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
vec3 hsl2rgb(float h, float s, float l){
  h = mod(h,360.0)/360.0;
  vec3 rgb = clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
  float c = (1.0-abs(2.0*l-1.0))*s;
  return l + c*(rgb-0.5);
}
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec2 p = uv; p.x *= uRes.x/uRes.y;
  float t = uTime*0.045;

  // Cursor warps the field locally. The warp (and later the light lift) fade as
  // the field settles into its idle state, so it visibly relaxes when untouched.
  vec2 m = uMouse; m.x *= uRes.x/uRes.y;
  float md = distance(p, m);
  vec2 warp = (p - m) * exp(-md*3.0) * 0.25 * uEnergy;

  vec2 q = vec2(fbm(p + t + warp), fbm(p + vec2(5.2,1.3) - t));
  vec2 r = vec2(fbm(p + 3.5*q + vec2(1.7,9.2) + 0.15*t),
                fbm(p + 3.5*q + vec2(8.3,2.8) - 0.12*t));
  float f = fbm(p + 3.0*r);

  // Palette shifts with Canberra's time of day: warmer + lighter by day, cooler
  // + a touch deeper and more present at night. Subtle — it reads as mood.
  float hueShift = mix(26.0, -24.0, uDaylight);  // night → cool, day → warm
  float sat = mix(0.42, 0.30, uDaylight);        // night slightly more saturated
  float lite = mix(0.86, 0.92, uDaylight);       // night slightly deeper
  vec3 base = mix(vec3(0.945,0.951,0.965), vec3(0.972,0.968,0.958), uDaylight);
  vec3 c1 = hsl2rgb(uHue + hueShift,        sat,      lite);
  vec3 c2 = hsl2rgb(uHue + hueShift + 42.0, sat*0.9,  lite - 0.02);
  vec3 col = base;
  col = mix(col, c1, clamp(f*f*mix(1.7,1.3,uDaylight), 0.0, 1.0));
  col = mix(col, c2, clamp(length(r)*0.5, 0.0, 0.6));

  // Soft light lift near the cursor — brightest when awake, gone when idle.
  col += hsl2rgb(uHue + hueShift, 0.4, 0.7) * exp(-md*2.6) * 0.13 * uEnergy;

  // Gentle vignette so edges settle into the page.
  float vig = smoothstep(1.25, 0.35, length(uv-0.5));
  col = mix(base, col, 0.55 + 0.45*vig);

  // When idle the whole field dims a hair and eases toward its base wash — a
  // slow exhale. Barely perceptible frame to frame, clearly felt over seconds.
  col = mix(mix(base, col, 0.92), col, uEnergy);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function ShaderHero() {
  const { finePointer, canBlur, ready } = useCapability();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // canBlur already encodes "fine pointer + adequate memory/cores + motion ok".
  const eligible = ready && finePointer && canBlur && !reduced;

  useEffect(() => {
    if (!eligible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return; // no WebGL → CSS mesh shows through

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uHue = gl.getUniformLocation(prog, "uHue");
    const uDaylight = gl.getUniformLocation(prog, "uDaylight");
    const uEnergy = gl.getUniformLocation(prog, "uEnergy");

    // Cap DPR — this is a soft background, not crisp UI.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Smoothed mouse; hue sampled occasionally (getComputedStyle is not cheap).
    let mx = 0.5,
      my = 0.4,
      tmx = 0.5,
      tmy = 0.4;
    // Awake/idle state: every pointer move refreshes lastMove; after a few
    // seconds of stillness `energy` eases down and the field slows + settles.
    let lastMove = performance.now();
    let energy = 1;
    const onMove = (e: PointerEvent) => {
      tmx = e.clientX / window.innerWidth;
      tmy = e.clientY / window.innerHeight;
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let hue = 232;
    let daylight = 0.6;
    const sample = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent-h");
      const n = parseFloat(v);
      if (!Number.isNaN(n)) hue = n;
      daylight = canberraNow().daylight;
    };
    sample();

    // Pause when the hero is off-screen (it only covers the first viewport).
    let onScreen = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && raf === 0) raf = requestAnimationFrame(loop);
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    let raf = 0;
    let frame = 0;
    // Flow time is accumulated (not wall-clock) so it can be slowed by `energy`
    // and never jumps when the loop pauses off-screen / on a hidden tab.
    let tAcc = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      if (document.hidden || !onScreen) {
        raf = 0;
        prev = performance.now(); // avoid a dt spike when it resumes
        return; // IO / visibility change will restart it
      }
      if (frame % 90 === 0) sample();
      frame++;
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      // Ease energy toward awake (1) or settled (~0.28) by time since last move.
      const idle = now - lastMove;
      energy += ((idle > 3500 ? 0.28 : 1) - energy) * 0.02;
      // Flow slows as it settles but keeps a slow idle drift (never fully stops).
      tAcc += dt * (0.4 + 0.6 * energy);

      // Ease the cursor influence.
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, tAcc);
      gl.uniform2f(uMouse, mx, 1 - my); // flip to gl y-up
      gl.uniform1f(uHue, hue);
      gl.uniform1f(uDaylight, daylight);
      gl.uniform1f(uEnergy, energy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (!document.hidden && onScreen && raf === 0) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [eligible]);

  if (!eligible) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        // Sits above the fixed mesh Background but below the hero content.
        zIndex: 0,
        // Purely decorative — must never intercept clicks on the CTA or nav.
        pointerEvents: "none",
      }}
    />
  );
}
