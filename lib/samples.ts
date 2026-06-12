// Real-instrument samples — FluidR3 General MIDI soundfont by Frank Wen,
// CC-BY 3.0 (attribution in README), rendered to mp3, served from jsDelivr.
// Each instrument lazily loads ~15 notes spaced a
// minor third apart; everything between is pitch-shifted via playbackRate.
// Until samples arrive (or if the CDN is unreachable) the synthesized
// fallback in instruments.ts keeps playing — the music never stops.

const CDN = "https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM";

// instrument key → { GM patch name, octave shift applied to incoming freq }
const GM: Record<string, { patch: string; freqScale: number }> = {
  violin: { patch: "violin", freqScale: 1 },
  cello: { patch: "cello", freqScale: 0.5 }, // an octave below the written note
  piano: { patch: "acoustic_grand_piano", freqScale: 1 },
  guitar: { patch: "acoustic_guitar_nylon", freqScale: 1 },
  harp: { patch: "orchestral_harp", freqScale: 1 },
  flute: { patch: "flute", freqScale: 1 },
  trumpet: { patch: "trumpet", freqScale: 1 },
  accordion: { patch: "accordion", freqScale: 1 },
  choir: { patch: "choir_aahs", freqScale: 1 },
  organ: { patch: "church_organ", freqScale: 1 },
  marimba: { patch: "marimba", freqScale: 1 },
  vibraphone: { patch: "vibraphone", freqScale: 1 },
  musicbox: { patch: "music_box", freqScale: 1 },
  strings: { patch: "string_ensemble_1", freqScale: 1 },
};

export function isSampled(key: string): boolean {
  return key in GM;
}

// MIDI 45 (A2) … 87 (D#6) every 3 semitones — covers every recipe's range.
const MIDI_SET: number[] = [];
for (let m = 45; m <= 87; m += 3) MIDI_SET.push(m);

const NOTE_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const midiToName = (m: number) => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

const banks = new Map<string, Map<number, AudioBuffer>>();
const loading = new Map<string, Promise<void>>();
// Decode at the WAV-export rate; buffers carry their own sampleRate and the
// graph resamples automatically wherever they play.
let decoder: OfflineAudioContext | null = null;

export function isLoaded(key: string): boolean {
  return (banks.get(key)?.size ?? 0) > 0;
}

/** Fetch + decode an instrument's note set. Idempotent; safe to re-call. */
export function loadSampled(key: string): Promise<void> {
  if (!GM[key] || isLoaded(key)) return Promise.resolve();
  const inflight = loading.get(key);
  if (inflight) return inflight;
  decoder ??= new OfflineAudioContext(1, 1, 44100);
  const bank = new Map<number, AudioBuffer>();
  const p = Promise.allSettled(
    MIDI_SET.map(async (m) => {
      const res = await fetch(`${CDN}/${GM[key].patch}-mp3/${midiToName(m)}.mp3`);
      if (!res.ok) throw new Error(`${res.status}`);
      const buf = await decoder!.decodeAudioData(await res.arrayBuffer());
      bank.set(m, buf);
    }),
  ).then(() => {
    if (bank.size > 0) banks.set(key, bank); // partial bank is still useful
    loading.delete(key);
  });
  loading.set(key, p);
  return p;
}

/** Play one note from the sample bank. Returns false if not loaded yet. */
export function playSample(
  ctx: BaseAudioContext, dest: AudioNode, key: string,
  freq: number, t: number, vol: number, decay: number,
): boolean {
  const bank = banks.get(key);
  if (!bank || bank.size === 0) return false;
  const f = freq * GM[key].freqScale;
  const midi = 69 + 12 * Math.log2(f / 440);
  let best = -1, bestDist = Infinity;
  for (const m of bank.keys()) {
    const d = Math.abs(m - midi);
    if (d < bestDist) { bestDist = d; best = m; }
  }
  const src = ctx.createBufferSource();
  src.buffer = bank.get(best)!;
  src.playbackRate.value = f / midiToFreq(best);
  const g = ctx.createGain();
  // Samples carry their own natural attack — just guard against clicks,
  // then gate the natural tail with the note's release.
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.setValueAtTime(vol, t + Math.max(0.01, decay * 0.7));
  g.gain.exponentialRampToValueAtTime(0.001, t + decay * 1.3);
  src.connect(g).connect(dest);
  src.start(t);
  src.stop(t + decay * 1.3 + 0.1);
  return true;
}
