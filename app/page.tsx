"use client";

import { useEffect, useRef, useState } from "react";
import { GROUPS, INSTRUMENTS, MOODS, playLive, renderWav } from "@/lib/engine";
import type { InstrumentKey, LivePlayer, MoodKey } from "@/lib/engine";
import { isLoaded, isSampled, loadSampled } from "@/lib/samples";
import { startFaceMood, stopFaceMood } from "@/lib/mediapipe-face";
import { classifyBlendshapes, createMoodStabilizer } from "@/lib/emotion-to-mood";
import { Visualizer, type VizStyle } from "@/components/visualizer";

const INSTRUMENT_KEYS: InstrumentKey[] = [
  "auto",
  // strings
  "violin", "cello", "strings", "harp", "guitar", "pluck",
  // keys & mallets
  "piano", "organ", "accordion", "marimba", "vibraphone", "musicbox", "bell",
  // winds & voice
  "flute", "trumpet", "choir",
  // retro
  "chip",
];

const VIZ_STYLES: { key: VizStyle; label: string }[] = [
  { key: "spectrum", label: "频谱粒子" },
  { key: "fluid", label: "流体染料" },
  { key: "particles", label: "粒子聚形" },
  { key: "tunnel", label: "发光隧道" },
  { key: "glass", label: "玻璃色散" },
];

// Bauhaus 原色循环（mood 卡背景）
const PALETTE = ["#e63327", "#2b5fb0", "#f5c518", "#f2ede4"];

export default function Home() {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [seed, setSeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [instr, setInstr] = useState<InstrumentKey>("auto");
  const [loadingInstr, setLoadingInstr] = useState<InstrumentKey | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facePanel, setFacePanel] = useState<{
    top: { categoryName: string; score: number }[];
    candidate: MoodKey | null;
    confirmed: MoodKey | null;
  } | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [vizStyle, setVizStyle] = useState<VizStyle>("spectrum");
  const playerRef = useRef<LivePlayer | null>(null);
  // Latest state for async sample-load callbacks (avoids stale closures).
  const liveRef = useRef({ mood: null as MoodKey | null, seed: 1, playing: false, instr: "auto" as InstrumentKey });
  liveRef.current = { mood, seed, playing, instr };

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    return () => playerRef.current?.stop();
  }, []);

  const start = (m: MoodKey, s: number, i: InstrumentKey = instr) => {
    playerRef.current?.stop();
    playerRef.current = playLive(m, s, i);
    setAnalyser(playerRef.current.analyser);
    setMood(m);
    setSeed(s);
    setPlaying(true);
  };

  const pickInstrument = (i: InstrumentKey) => {
    setInstr(i);
    if (mood && playing) start(mood, seed, i); // same piece, new voice
    if (isSampled(i) && !isLoaded(i)) {
      setLoadingInstr(i);
      void loadSampled(i).then(() => {
        setLoadingInstr((cur) => (cur === i ? null : cur));
        // restart so the real samples take over immediately, not next chunk
        const s = liveRef.current;
        if (s.instr === i && s.mood && s.playing) start(s.mood, s.seed, i);
      });
    }
  };

  const stop = () => {
    playerRef.current?.stop();
    playerRef.current = null;
    setAnalyser(null);
    setPlaying(false);
  };

  // 表情驱动模式：摄像头读表情 → 防抖 → 自动切 mood（复用 start）
  useEffect(() => {
    if (!cameraMode) return;
    const stabilizer = createMoodStabilizer({ holdMs: 800 });
    let cancelled = false;
    let lastPanel = 0;
    void startFaceMood((cats) => {
      if (cancelled) return;
      const now = performance.now();
      const candidate = classifyBlendshapes(cats);
      const switched = stabilizer.update(candidate, now);
      if (switched) {
        const s = liveRef.current;
        start(switched, Math.floor(Math.random() * 1e9), s.instr);
      }
      // 节流更新面板（~150ms），避免 30fps 狂 render
      if (now - lastPanel > 150) {
        lastPanel = now;
        const top = [...cats].sort((a, b) => b.score - a.score).slice(0, 3);
        setFacePanel({ top, candidate, confirmed: stabilizer.getState().confirmed });
      }
    }, previewRef.current ?? undefined).catch((e: unknown) => {
      if (cancelled) return;
      setCameraError(e instanceof Error ? e.message : String(e));
      setCameraMode(false);
    });
    return () => {
      cancelled = true;
      stopFaceMood();
      setFacePanel(null);
    };
    // start 复用最新 liveRef，无需进依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode]);

  const exportWav = async () => {
    if (!mood) return;
    setExporting(true);
    try {
      if (isSampled(instr)) await loadSampled(instr); // real samples in the file too
      const blob = await renderWav(mood, seed, 32, instr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bgm-${mood}-${instr}-${seed}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const moodColor: [number, number, number] = (() => {
    const g = mood ? GROUPS.find((gr) => gr.keys.includes(mood)) : undefined;
    const hex = g?.color ?? "#a23b5e";
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255,
    ];
  })();

  return (
    <main className="min-h-screen">
      <Visualizer analyser={analyser} style={vizStyle} moodColor={moodColor} />

      {/* nav */}
      <nav className="flex items-center justify-between border-b-4 border-[#1a1a1a] bg-[#f2ede4] px-6 py-4 md:px-10">
        <span className="archivo-black text-lg uppercase tracking-tight">Mood BGM</span>
        <span className="text-[11px] font-bold uppercase tracking-widest md:text-xs">Synth / 1919 → 2026</span>
      </nav>

      {/* geometric hero */}
      <div className="grid grid-cols-1 border-b-4 border-[#1a1a1a] md:grid-cols-[1.4fr_1fr]">
        <div className="bg-[#f2ede4] px-6 py-12 md:border-r-4 md:border-[#1a1a1a] md:px-10 md:py-16">
          <h1 className="archivo-black text-[19vw] uppercase leading-[0.84] tracking-tighter md:text-[clamp(64px,9vw,150px)]">
            MOOD<br /><span className="text-[#e63327]">BGM</span>
          </h1>
          <p className="mt-6 max-w-sm text-sm font-medium leading-relaxed md:text-base">
            选一种情绪，得到一段永不重复的配乐。情绪藏在结构里——音阶、和弦、速度，不在音色里。
          </p>
        </div>
        <div className="relative hidden overflow-hidden bg-[#f2ede4] md:block">
          <div className="absolute left-[55%] top-[-20%] h-[140%] w-1 rotate-[20deg] bg-[#1a1a1a]" />
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-[#2b5fb0]" />
          <div className="absolute bottom-12 left-8 h-28 w-28 bg-[#e63327]" />
          <div className="absolute bottom-0 right-8 h-0 w-0 border-b-[140px] border-l-[80px] border-r-[80px] border-b-[#f5c518] border-l-transparent border-r-transparent" />
        </div>
      </div>

      {/* transport bar — yellow, sticky */}
      <div className="sticky top-0 z-50 flex flex-wrap items-stretch border-b-4 border-[#1a1a1a] bg-[#f5c518]">
        <button
          type="button"
          onClick={() => {
            setCameraError(null);
            setCameraMode((v) => !v);
          }}
          className={
            "border-r-4 border-[#1a1a1a] px-4 py-3 text-[11px] font-bold uppercase tracking-widest " +
            (cameraMode ? "bg-[#e63327] text-[#f2ede4]" : "hover:bg-[#1a1a1a] hover:text-[#f2ede4]")
          }
        >
          {cameraMode ? "● 表情 ON" : "○ 表情驱动"}
        </button>
        <div className="flex items-center gap-2 border-r-4 border-[#1a1a1a] px-4">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Viz</span>
          {VIZ_STYLES.map((vs) => (
            <button
              key={vs.key}
              type="button"
              onClick={() => setVizStyle(vs.key)}
              aria-label={vs.label}
              className={
                "group/btn relative h-3 w-3 rounded-full border-2 border-[#1a1a1a] " +
                (vizStyle === vs.key ? "bg-[#1a1a1a]" : "bg-transparent")
              }
            >
              <span className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1a1a] px-2 py-0.5 text-[9px] text-[#f2ede4] opacity-0 group-hover/btn:opacity-90">
                {vs.label}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center px-5 py-3 text-[11px] font-bold uppercase tracking-wider md:text-xs">
          {mood
            ? `${playing ? "▶" : "■"} ${MOODS[mood].cn} ${MOODS[mood].label} · seed ${seed}`
            : "← 点一张卡开始"}
        </div>
        {mood ? (
          <>
            <button
              type="button"
              onClick={playing ? stop : () => start(mood, seed)}
              className="border-l-4 border-[#1a1a1a] bg-[#e63327] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-[#f2ede4] hover:opacity-90"
            >
              {playing ? "■ Stop" : "▶ Play"}
            </button>
            <button
              type="button"
              onClick={() => start(mood, Math.floor(Math.random() * 1e9))}
              className="border-l-4 border-[#1a1a1a] px-5 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-[#f2ede4]"
            >
              ↻ New
            </button>
            <button
              type="button"
              onClick={exportWav}
              disabled={exporting}
              className="border-l-4 border-[#1a1a1a] bg-[#2b5fb0] px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-[#f2ede4] hover:opacity-90 disabled:opacity-50"
            >
              {exporting ? "…" : "↓ WAV"}
            </button>
          </>
        ) : null}
      </div>

      {cameraError ? (
        <div className="border-b-4 border-[#1a1a1a] bg-[#e63327] px-6 py-2 text-[11px] font-bold text-[#f2ede4] md:px-10">
          摄像头错误：{cameraError}
        </div>
      ) : null}

      {/* camera preview + panel */}
      {cameraMode ? (
        <div className="flex flex-col gap-4 border-b-4 border-[#1a1a1a] bg-[#f2ede4] p-6 sm:flex-row sm:items-start md:px-10">
          <video
            ref={previewRef}
            muted
            playsInline
            className="w-[220px] border-4 border-[#1a1a1a] [transform:scaleX(-1)]"
          />
          <div className="min-w-[200px] border-4 border-[#1a1a1a] bg-white p-3 text-[11px] font-medium">
            <div className="archivo-black mb-2 uppercase tracking-widest">表情检测</div>
            {facePanel ? (
              <>
                {facePanel.top.map((c) => (
                  <div key={c.categoryName} className="flex justify-between gap-4">
                    <span className="opacity-60">{c.categoryName}</span>
                    <span className="font-bold">{c.score.toFixed(2)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t-2 border-[#1a1a1a] pt-2">
                  候选：{facePanel.candidate ? MOODS[facePanel.candidate].cn : "—"}
                </div>
                <div>已切：{facePanel.confirmed ? MOODS[facePanel.confirmed].cn : "—"}</div>
              </>
            ) : (
              <div className="opacity-50">等待摄像头…</div>
            )}
          </div>
        </div>
      ) : null}

      {/* mood grid — primary color blocks */}
      <div className="px-6 py-10 md:px-10">
        {GROUPS.map((g, gi) => (
          <section key={g.title} className="mb-8">
            <h2 className="archivo-black mb-3 text-xs uppercase tracking-[0.3em]">{g.title}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {g.keys.map((k, ki) => {
                const active = mood === k && playing;
                const bg = PALETTE[(gi + ki) % PALETTE.length];
                const dark = bg === "#f5c518" || bg === "#f2ede4";
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => start(k, Math.floor(Math.random() * 1e9))}
                    className={
                      "border-4 border-[#1a1a1a] p-4 text-left transition-transform hover:-translate-y-1 " +
                      (active ? "-translate-y-1 shadow-[6px_6px_0_#1a1a1a]" : "")
                    }
                    style={{ backgroundColor: bg, color: dark ? "#1a1a1a" : "#f2ede4" }}
                  >
                    <div className="archivo-black text-2xl uppercase leading-none">{MOODS[k].cn}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {MOODS[k].label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* instruments */}
      <div className="border-t-4 border-[#1a1a1a] bg-[#f2ede4] px-6 py-6 md:px-10">
        <h2 className="archivo-black mb-3 text-xs uppercase tracking-[0.3em]">乐器 Voice</h2>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickInstrument(k)}
              className={
                "border-2 border-[#1a1a1a] px-3 py-1 text-[10px] font-bold uppercase tracking-wider " +
                (instr === k ? "bg-[#1a1a1a] text-[#f2ede4]" : "hover:bg-[#f5c518]")
              }
            >
              {k === "auto" ? "自动" : INSTRUMENTS[k].cn}
              {loadingInstr === k ? " ⏳" : ""}
            </button>
          ))}
        </div>
      </div>

      {/* footer */}
      <footer className="border-t-4 border-[#1a1a1a] bg-[#1a1a1a] px-6 py-8 text-[#f2ede4] md:px-10">
        <p className="text-[11px] font-bold uppercase tracking-widest">
          每次点击都是新曲 · WAV 与 seed 一一对应 · Emotion lives in structure, not timbre
        </p>
      </footer>
    </main>
  );
}
