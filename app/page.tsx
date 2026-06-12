"use client";

import { useEffect, useRef, useState } from "react";
import { GROUPS, INSTRUMENTS, MOODS, playLive, renderWav } from "@/lib/engine";
import type { InstrumentKey, LivePlayer, MoodKey } from "@/lib/engine";

const INSTRUMENT_KEYS: InstrumentKey[] = [
  "auto", "pluck", "piano", "musicbox", "bell", "flute", "organ", "strings", "chip",
];

export default function Home() {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [seed, setSeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [instr, setInstr] = useState<InstrumentKey>("auto");
  const playerRef = useRef<LivePlayer | null>(null);

  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e9));
    return () => playerRef.current?.stop();
  }, []);

  const start = (m: MoodKey, s: number, i: InstrumentKey = instr) => {
    playerRef.current?.stop();
    playerRef.current = playLive(m, s, i);
    setMood(m);
    setSeed(s);
    setPlaying(true);
  };

  const pickInstrument = (i: InstrumentKey) => {
    setInstr(i);
    if (mood && playing) start(mood, seed, i); // same piece, new voice
  };

  const stop = () => {
    playerRef.current?.stop();
    playerRef.current = null;
    setPlaying(false);
  };

  const exportWav = async () => {
    if (!mood) return;
    setExporting(true);
    try {
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

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 px-6 py-14">
      <header className="text-center">
        <h1 className="font-mono text-3xl font-bold uppercase tracking-[0.3em]">
          Mood BGM
        </h1>
        <p className="mt-3 max-w-md font-serif text-sm italic opacity-75">
          选一种情绪或一个场景，得到一段永不重复的配乐。情绪藏在结构里
          ——音阶、和弦进行、速度——不在音色里。
        </p>
      </header>

      {/* sticky transport bar */}
      <div className="sticky top-3 z-50 flex flex-col items-center gap-3">
        <div className="select-none rounded-md border-2 border-[#22302c] bg-[#efece3]/95 px-5 py-2 text-center font-mono text-xs shadow-[3px_3px_0_rgba(34,48,44,0.3)]">
          {mood
            ? `${playing ? "▶" : "■"} ${MOODS[mood].cn} ${MOODS[mood].label} · seed ${seed}`
            : "点一张卡开始"}
        </div>
        {mood ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={playing ? stop : () => start(mood, seed)}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#efece3] px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1"
            >
              {playing ? "Stop" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => start(mood, Math.floor(Math.random() * 1e9))}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#efece3] px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1"
            >
              ↻ New
            </button>
            <button
              type="button"
              onClick={exportWav}
              disabled={exporting}
              className="rounded-[4px] border-2 border-[#22302c] bg-[#2e5d66] px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-[#efece3] shadow-[0_4px_0_rgba(34,48,44,0.4)] active:translate-y-1 disabled:opacity-50"
            >
              {exporting ? "Rendering…" : "↓ WAV"}
            </button>
          </div>
        ) : null}
        <div className="flex max-w-xl flex-wrap justify-center gap-1.5">
          {INSTRUMENT_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => pickInstrument(k)}
              className={
                "rounded-full border-2 border-[#22302c] px-3 py-1 font-mono text-[10px] uppercase tracking-wider shadow-[0_2px_0_rgba(34,48,44,0.35)] active:translate-y-0.5 " +
                (instr === k
                  ? "bg-[#22302c] text-[#efece3]"
                  : "bg-[#efece3]/90 text-[#22302c]")
              }
            >
              {k === "auto" ? "自动" : INSTRUMENTS[k].cn}
            </button>
          ))}
        </div>
      </div>

      <div className="flex max-w-3xl flex-col gap-8">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.3em] opacity-70">
              {g.title}
            </h2>
            <div className="flex flex-wrap gap-3">
              {g.keys.map((k) => {
                const active = mood === k && playing;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => start(k, Math.floor(Math.random() * 1e9))}
                    className={
                      "rounded-lg border-[3px] border-[#22302c] px-4 py-3 text-center transition-transform " +
                      (active
                        ? "scale-105 shadow-[5px_5px_0_rgba(34,48,44,0.45)]"
                        : "shadow-[3px_3px_0_rgba(34,48,44,0.3)] hover:scale-105")
                    }
                    style={{ backgroundColor: g.color }}
                  >
                    <div className="font-serif text-base font-semibold text-[#fdfbf4]">
                      {MOODS[k].cn}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#fdfbf4]/80">
                      {MOODS[k].label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="max-w-sm text-center font-serif text-[11px] italic opacity-60">
        每张卡每次点击都是新曲（随机 seed）；↓ WAV 导出的文件与当前 seed
        一一对应，听到什么导出什么。
      </p>
    </main>
  );
}
