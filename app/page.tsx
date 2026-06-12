"use client";

import { useEffect, useRef, useState } from "react";
import {
  MOODS,
  playLive,
  renderWav,
  type LivePlayer,
  type MoodKey,
} from "@/lib/engine";

const MOOD_KEYS = Object.keys(MOODS) as MoodKey[];

const MOOD_COLORS: Record<MoodKey, string> = {
  happy: "#e8ab3c",
  sad: "#5b7d99",
  calm: "#9fbfa8",
  excited: "#d2693e",
  angry: "#b2453a",
  mystery: "#7d6b99",
};

export default function Home() {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [seed, setSeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const playerRef = useRef<LivePlayer | null>(null);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    return () => playerRef.current?.stop();
  }, []);

  const start = (m: MoodKey, s: number) => {
    playerRef.current?.stop();
    playerRef.current = playLive(m, s);
    setMood(m);
    setSeed(s);
    setPlaying(true);
  };

  const stop = () => {
    playerRef.current?.stop();
    playerRef.current = null;
    setPlaying(false);
  };

  const regenerate = () => {
    if (!mood) return;
    start(mood, Math.floor(Math.random() * 1e9));
  };

  const exportWav = async () => {
    if (!mood) return;
    setExporting(true);
    try {
      const blob = await renderWav(mood, seed, 32);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bgm-${mood}-${seed}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="text-center">
        <h1 className="font-mono text-3xl font-bold uppercase tracking-[0.3em]">
          Mood BGM
        </h1>
        <p className="mt-3 max-w-md font-serif text-sm italic opacity-75">
          选一种情绪，得到一段永不重复的配乐。情绪藏在结构里——音阶、和弦
          进行、速度——不在音色里。
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {MOOD_KEYS.map((k) => {
          const active = mood === k && playing;
          return (
            <button
              key={k}
              type="button"
              onClick={() => start(k, Math.floor(Math.random() * 1e9))}
              className={
                "rounded-lg border-[3px] border-[#22302c] px-6 py-5 text-center transition-transform " +
                (active
                  ? "scale-105 shadow-[6px_6px_0_rgba(34,48,44,0.45)]"
                  : "shadow-[4px_4px_0_rgba(34,48,44,0.3)] hover:scale-105")
              }
              style={{ backgroundColor: MOOD_COLORS[k] }}
            >
              <div className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#22302c]">
                {MOODS[k].label}
              </div>
              <div className="mt-1 font-serif text-lg text-[#22302c]">
                {MOODS[k].cn}
              </div>
            </button>
          );
        })}
      </div>

      {mood ? (
        <div className="flex flex-col items-center gap-4">
          <div className="select-none rounded-md border-2 border-[#22302c] bg-[#efece3]/95 px-5 py-2 text-center font-mono text-xs shadow-[3px_3px_0_rgba(34,48,44,0.3)]">
            {playing ? "▶ playing" : "■ stopped"} · {MOODS[mood].cn} · seed{" "}
            {seed}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={playing ? stop : () => start(mood, seed)}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#efece3] px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1"
            >
              {playing ? "Stop" : "Play"}
            </button>
            <button
              type="button"
              onClick={regenerate}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#efece3] px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1"
            >
              ↻ New piece
            </button>
            <button
              type="button"
              onClick={exportWav}
              disabled={exporting}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#2e5d66] px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#efece3] shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1 disabled:opacity-50"
            >
              {exporting ? "Rendering…" : "↓ WAV 32s"}
            </button>
          </div>
          <p className="max-w-sm text-center font-serif text-[11px] italic opacity-60">
            同一情绪每次 New piece 都是新曲；导出的 WAV 与当前 seed
            一一对应，可直接用进你的项目。
          </p>
        </div>
      ) : (
        <p className="font-serif text-sm italic opacity-60">
          点一个情绪开始
        </p>
      )}
    </main>
  );
}
