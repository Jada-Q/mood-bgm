"use client";

import { useEffect, useRef } from "react";

export type VizStyle = "spectrum" | "fluid" | "particles" | "tunnel" | "glass";

// 频谱粒子云：32 bins → 粒子按 x 取对应 bin，频率驱动纵向抬升 + 大小 + 亮度。
const VERT = `
attribute vec2 a_rand;
uniform float u_freq[32];
uniform float u_time;
varying float v_i;
void main() {
  int bin = int(min(a_rand.x * 32.0, 31.0));
  float f = u_freq[bin];
  float x = a_rand.x * 2.0 - 1.0;
  float baseY = (a_rand.y * 2.0 - 1.0) * 0.85;
  float lift = f * 1.1 * (1.0 - abs(baseY));
  float drift = sin(u_time * 0.5 + a_rand.x * 25.0) * 0.04;
  gl_Position = vec4(x, baseY + lift + drift, 0.0, 1.0);
  gl_PointSize = 3.0 + f * 13.0;
  v_i = f;
}`;

const FRAG = `
precision mediump float;
uniform vec3 u_color;
varying float v_i;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = (1.0 - d * 2.0) * (0.22 + v_i * 0.7);
  vec3 col = mix(u_color, u_color + 0.25, v_i);
  gl_FragColor = vec4(col, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("shader compile failed: " + log);
  }
  return sh;
}

interface Props {
  analyser: AnalyserNode | null;
  style: VizStyle;
  moodColor: [number, number, number];
}

export function Visualizer({ analyser, style, moodColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 颜色走 ref：换 mood 时平滑更新，不重建整个 WebGL context
  const colorRef = useRef(moodColor);
  colorRef.current = moodColor;

  useEffect(() => {
    // 阶段 A 只实现 spectrum，其余风格留到阶段 B
    if (style !== "spectrum" || !analyser) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      window.removeEventListener("resize", resize);
      return;
    }
    gl.useProgram(prog);

    const N = 2200;
    const data = new Float32Array(N * 2);
    for (let i = 0; i < N * 2; i++) data[i] = Math.random();
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const aRand = gl.getAttribLocation(prog, "a_rand");
    gl.enableVertexAttribArray(aRand);
    gl.vertexAttribPointer(aRand, 2, gl.FLOAT, false, 0, 0);

    const uFreq = gl.getUniformLocation(prog, "u_freq");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uColor = gl.getUniformLocation(prog, "u_color");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const bins = new Uint8Array(analyser.frequencyBinCount); // 32
    const freq = new Float32Array(32);
    const t0 = performance.now();
    let raf = 0;
    const loop = () => {
      analyser.getByteFrequencyData(bins);
      for (let i = 0; i < 32; i++) freq[i] = (bins[i] ?? 0) / 255;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1fv(uFreq, freq);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      const c = colorRef.current;
      gl.uniform3f(uColor, c[0], c[1], c[2]);
      gl.drawArrays(gl.POINTS, 0, N);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [analyser, style]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
