"use client";

/*
 * liquid.ts — a tiny WebGL renderer for liquid displacement transitions between
 * photographs (used by PhotoViewer). Two textures are cross-warped by procedural
 * noise whose displacement peaks mid-transition, so one image melts into the
 * next. No 3D library, no external assets.
 *
 * `createLiquid` returns a controller; if WebGL is unavailable it returns
 * { ok:false } and the caller uses a plain crossfade instead.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos*0.5 + 0.5; gl_Position = vec4(aPos,0.0,1.0); }
`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uCurr;
uniform sampler2D uNext;
uniform float uProgress;
uniform float uCanvasA;
uniform float uCurrA;
uniform float uNextA;

float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.; a*=.5; } return v; }

// Contain-fit: return sample uv for an image of aspect imgA within canvas aspect
// canvasA. Coordinates outside [0,1] mean letterbox (drawn as background).
vec2 containUV(vec2 uv, float imgA){
  vec2 s = uCanvasA > imgA ? vec2(uCanvasA/imgA, 1.0) : vec2(1.0, imgA/uCanvasA);
  return (uv - 0.5) * s + 0.5;
}
vec3 sampleContained(sampler2D tex, vec2 uv, float imgA){
  vec2 s = containUV(uv, imgA);
  float inside = step(0.0,s.x)*step(s.x,1.0)*step(0.0,s.y)*step(s.y,1.0);
  return texture2D(tex, clamp(s,0.0,1.0)).rgb * inside;
}

void main(){
  vec2 uv = vUv;
  // Displacement peaks in the middle of the transition, settling at both ends.
  float wave = sin(uProgress*3.14159265);
  float d = (fbm(uv*4.0 + uProgress*1.5) - 0.5);
  vec2 disp = vec2(d) * 0.28 * wave;

  vec3 a = sampleContained(uCurr, uv + disp, uCurrA);
  vec3 b = sampleContained(uNext, uv - disp, uNextA);

  // Noise-thresholded reveal so the swap feels organic, not a flat fade.
  float edge = smoothstep(uProgress-0.35, uProgress+0.35, fbm(uv*3.0)*0.5 + uProgress*0.5);
  vec3 col = mix(a, b, edge);
  gl_FragColor = vec4(col, 1.0);
}
`;

interface TexEntry {
  tex: WebGLTexture;
  aspect: number;
}

export interface LiquidController {
  ok: boolean;
  prepare(src: string): Promise<void>;
  show(src: string): Promise<void>;
  transitionTo(src: string, durationMs?: number): Promise<void>;
  resize(): void;
  destroy(): void;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
  return s;
}

export function createLiquid(canvas: HTMLCanvasElement): LiquidController {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
  if (!gl) return noopController();

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return noopController();
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return noopController();
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {
    curr: gl.getUniformLocation(prog, "uCurr"),
    next: gl.getUniformLocation(prog, "uNext"),
    progress: gl.getUniformLocation(prog, "uProgress"),
    canvasA: gl.getUniformLocation(prog, "uCanvasA"),
    currA: gl.getUniformLocation(prog, "uCurrA"),
    nextA: gl.getUniformLocation(prog, "uNextA"),
  };
  gl.uniform1i(U.curr, 0);
  gl.uniform1i(U.next, 1);

  const cache = new Map<string, TexEntry>();
  let curr: TexEntry | null = null;
  let next: TexEntry | null = null;
  let raf = 0;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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

  const draw = (progress: number) => {
    if (!curr) return;
    const c = curr;
    const n = next ?? curr;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, c.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, n.tex);
    gl.uniform1f(U.progress, progress);
    gl.uniform1f(U.canvasA, canvas.width / canvas.height);
    gl.uniform1f(U.currA, c.aspect);
    gl.uniform1f(U.nextA, n.aspect);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const prepare = (src: string) =>
    new Promise<void>((resolve) => {
      if (cache.has(src)) return resolve();
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        cache.set(src, { tex, aspect: (img.naturalWidth || 1) / (img.naturalHeight || 1) });
        resolve();
      };
      img.onerror = () => resolve();
      img.src = src;
    });

  const show = async (src: string) => {
    await prepare(src);
    curr = cache.get(src) ?? curr;
    next = null;
    resize();
    draw(0);
  };

  const transitionTo = async (src: string, durationMs = 900) => {
    await prepare(src);
    const target = cache.get(src);
    if (!target || !curr) {
      if (target) curr = target;
      draw(0);
      return;
    }
    next = target;
    cancelAnimationFrame(raf);
    return new Promise<void>((resolve) => {
      const start = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
      const step = (now: number) => {
        const t = Math.min((now - start) / durationMs, 1);
        draw(ease(t));
        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          curr = target;
          next = null;
          draw(0);
          resolve();
        }
      };
      raf = requestAnimationFrame(step);
    });
  };

  const destroy = () => {
    cancelAnimationFrame(raf);
    cache.forEach((e) => gl.deleteTexture(e.tex));
    cache.clear();
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteBuffer(buf);
  };

  return { ok: true, prepare, show, transitionTo, resize, destroy };
}

function noopController(): LiquidController {
  return {
    ok: false,
    prepare: async () => {},
    show: async () => {},
    transitionTo: async () => {},
    resize: () => {},
    destroy: () => {},
  };
}
