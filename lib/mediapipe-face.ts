import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { BlendshapeCategory } from "./emotion-to-mood";

// 模型 URL 已在本会话 face-mesh demo 实测可加载。
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
// WASM 版本必须对齐 package.json 里 @mediapipe/tasks-vision 的版本。
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

let landmarker: FaceLandmarker | null = null;
let stream: MediaStream | null = null;
let videoEl: HTMLVideoElement | null = null;
let rafId: number | null = null;
let namesLogged = false;
let consolePatched = false;

/**
 * MediaPipe 的 WASM 把诊断 INFO/WARNING（XNNPACK delegate / gl_context 等）
 * 走 console.error 通道输出，Next.js dev overlay 见到 console.error 就弹窗误报。
 * 一次性过滤这几条已知良性日志（只匹配特定字符串，绝不吞真正的 JS 错误）。
 */
function patchConsoleForMediaPipe() {
  if (consolePatched) return;
  consolePatched = true;
  const orig = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? "");
    if (/Created TensorFlow Lite|XNNPACK delegate|gl_context|FaceBlendshapesGraph|OpenGL error checking/i.test(msg)) {
      console.debug("[mediapipe]", ...args);
      return;
    }
    orig(...args);
  };
}

async function ensureLandmarker(): Promise<FaceLandmarker> {
  if (landmarker) return landmarker;
  patchConsoleForMediaPipe();
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: true,
  });
  return landmarker;
}

/**
 * 开摄像头，每帧把表情 blendshapes 回调出去。
 * 调用方负责在回调里 classify + stabilize + 切歌。
 * 失败（无权限/无摄像头/模型加载失败）会 throw，调用方需 try/catch。
 */
export async function startFaceMood(
  onBlend: (categories: BlendshapeCategory[]) => void,
  previewEl?: HTMLVideoElement,
): Promise<void> {
  const lm = await ensureLandmarker();

  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });
  // 传了预览元素就用它（页面可见自拍），否则用隐藏 video 仅做检测
  videoEl = previewEl ?? document.createElement("video");
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  await videoEl.play();

  let lastVideoTime = -1;
  const loop = () => {
    if (!videoEl || !stream) return; // 已 stop
    const now = performance.now();
    if (videoEl.currentTime !== lastVideoTime) {
      lastVideoTime = videoEl.currentTime;
      const res = lm.detectForVideo(videoEl, now);
      const cats = res.faceBlendshapes?.[0]?.categories;
      if (cats && cats.length) {
        if (process.env.NODE_ENV === "development" && !namesLogged) {
          namesLogged = true;
          // dev-only: 一次性打印真实 blendshape 名，用于核对 BS 占位常量
          // eslint-disable-next-line no-console
          console.log("[face-mood] blendshape names:", cats.map((c) => c.categoryName));
        }
        onBlend(cats.map((c) => ({ categoryName: c.categoryName, score: c.score })));
      }
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

/** 停止检测并释放摄像头。幂等。 */
export function stopFaceMood(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl = null;
  }
  namesLogged = false;
}
