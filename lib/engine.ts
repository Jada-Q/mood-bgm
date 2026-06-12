// mood-bgm engine — mood → music-parameter matrix → WebAudio synthesis.
// Emotion lives in STRUCTURE (scale, progression, tempo, density), not in
// samples: the same tiny synth renders every mood. Seeded RNG so a piece
// can be regenerated identically and exported to WAV offline.

export type MoodKey =
  | "happy"
  | "sad"
  | "calm"
  | "excited"
  | "angry"
  | "mystery";

interface ChordDef {
  root: number; // bass root frequency
  tones: number[]; // lead pool
}

interface MoodDef {
  label: string;
  cn: string;
  bpm: [number, number]; // randomized within range
  progression: ChordDef[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadOctave: number; // multiplier on tone pool
  restChance: number; // melody breathing room
  kickBeats: number[]; // eighth positions in the bar (0..7)
  hatEighths: number[]; // eighth positions for hats
  bassEveryEighth: boolean; // bouncing vs sustained
  echo: boolean; // feedback delay for dreamy moods
  swing: number; // 0 = straight, ~0.12 = lilt
}

// Note frequencies (A440 equal temperament).
const C2 = 65.41, D2 = 73.42, Eb2 = 77.78, E2 = 82.41, F2 = 87.31,
  G2 = 98.0, Ab2 = 103.83, A2 = 110.0, Bb2 = 116.54, B2 = 123.47,
  C3 = 130.81, Db3 = 138.59, Eb3 = 155.56, E3 = 164.81, F3 = 174.61,
  G3 = 196.0, Ab3 = 207.65, A3 = 220.0, Bb3 = 233.08, B3 = 246.94,
  C4 = 261.63, Db4 = 277.18, D4 = 293.66, Eb4 = 311.13, E4 = 329.63,
  F4 = 349.23, G4 = 392.0, Ab4 = 415.3, A4 = 440.0, Bb4 = 466.16,
  B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;

export const MOODS: Record<MoodKey, MoodDef> = {
  happy: {
    label: "Happy", cn: "欢乐",
    bpm: [118, 132],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [B3, D4, G4, B4] },
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [A3, C4, F4, A4] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 2,
    restChance: 0.12, kickBeats: [0, 4], hatEighths: [1, 3, 5, 7],
    bassEveryEighth: true, echo: false, swing: 0.1,
  },
  sad: {
    label: "Sad", cn: "悲伤",
    bpm: [66, 78],
    progression: [
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: C3, tones: [C4, E4, G4] },
      { root: G2, tones: [B3, D4, G4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.45, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0,
  },
  calm: {
    label: "Calm", cn: "平静",
    bpm: [78, 90],
    progression: [
      { root: C3, tones: [C4, E4, G4, B4] }, // Cmaj7
      { root: F2, tones: [A3, C4, E4, F4] }, // Fmaj7
      { root: A2, tones: [A3, C4, E4, G4] }, // Am7
      { root: G2, tones: [B3, D4, F4, G4] }, // G7
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.4, kickBeats: [], hatEighths: [3, 7],
    bassEveryEighth: false, echo: true, swing: 0,
  },
  excited: {
    label: "Excited", cn: "激动",
    bpm: [144, 162],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: F2, tones: [A3, C4, F4, A4] },
      { root: G2, tones: [B3, D4, G4, B4] },
      { root: G2, tones: [B3, D4, G4, D5] },
    ],
    leadWave: "square", bassWave: "square", leadOctave: 2,
    restChance: 0.05, kickBeats: [0, 2, 4, 6], hatEighths: [0, 1, 2, 3, 4, 5, 6, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  angry: {
    label: "Angry", cn: "愤怒",
    bpm: [132, 148],
    progression: [
      // Phrygian riff: i — bII, dark and pounding.
      { root: E2, tones: [E3, G3, B3, E4] },
      { root: E2, tones: [E3, G3, B3, E4] },
      { root: F2, tones: [F3, Ab3, C4, F4] },
      { root: E2, tones: [E3, G3, Bb3, E4] },
    ],
    leadWave: "sawtooth", bassWave: "sawtooth", leadOctave: 1,
    restChance: 0.15, kickBeats: [0, 3, 4, 6], hatEighths: [2, 6],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  mystery: {
    label: "Mystery", cn: "神秘",
    bpm: [84, 96],
    progression: [
      // Harmonic-minor color: i — bVI — bIII — V
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: C3, tones: [C4, Eb4, G4] },
      { root: E2, tones: [Ab3, B3, E4] },
    ],
    leadWave: "sine", bassWave: "triangle", leadOctave: 2,
    restChance: 0.35, kickBeats: [0], hatEighths: [5],
    bassEveryEighth: false, echo: true, swing: 0.08,
  },
};

// Mulberry32 — tiny seedable RNG so a piece can be re-rendered identically.
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Schedule `seconds` of music into any AudioContext (live or offline). */
function schedulePiece(
  ctx: BaseAudioContext,
  out: AudioNode,
  mood: MoodDef,
  seed: number,
  startAt: number,
  seconds: number,
): void {
  const rand = rng(seed);
  const bpm = mood.bpm[0] + rand() * (mood.bpm[1] - mood.bpm[0]);
  const eighth = 60 / bpm / 2;

  // Optional echo bus for dreamy moods.
  let bus: AudioNode = out;
  if (mood.echo) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = eighth * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(out);
    const dry = ctx.createGain();
    dry.connect(out);
    dry.connect(delay);
    bus = dry;
  }

  const tone = (
    type: OscillatorType, freq: number, t: number, vol: number, decay: number,
  ) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  };
  const kick = (t: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    g.gain.setValueAtTime(0.65, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g).connect(out); // drums skip the echo
    osc.start(t);
    osc.stop(t + 0.2);
  };
  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.06), ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const hat = (t: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp).connect(g).connect(out);
    src.start(t);
  };

  const totalEighths = Math.floor(seconds / eighth);
  let melodyIdx = Math.floor(rand() * 3);
  for (let e = 0; e < totalEighths; e++) {
    const swingOffset = e % 2 === 1 ? eighth * mood.swing : 0;
    const t = startAt + e * eighth + swingOffset;
    const bar = Math.floor(e / 8) % mood.progression.length;
    const pos = e % 8;
    const chord = mood.progression[bar];

    // Bass
    if (mood.bassEveryEighth) {
      tone(mood.bassWave, pos % 2 === 0 ? chord.root : chord.root * 2, t, 0.5, eighth * 1.6);
    } else if (pos === 0) {
      tone(mood.bassWave, chord.root, t, 0.5, eighth * 7);
    }
    // Lead: random walk inside the chord pool.
    if (rand() > mood.restChance) {
      const moves = [-1, -1, 1, 1, 2, -2, 0];
      melodyIdx = Math.max(0, Math.min(chord.tones.length - 1,
        melodyIdx + moves[Math.floor(rand() * moves.length)]));
      tone(mood.leadWave, chord.tones[melodyIdx] * mood.leadOctave, t,
        mood.leadWave === "sawtooth" ? 0.14 : mood.leadWave === "square" ? 0.12 : 0.22,
        eighth * (mood.echo ? 2.4 : 1.5));
    }
    if (mood.kickBeats.includes(pos)) kick(t);
    if (mood.hatEighths.includes(pos)) hat(t);
  }
}

export interface LivePlayer {
  stop(): void;
}

/** Play a mood live, looping until stopped. */
export function playLive(moodKey: MoodKey, seed: number): LivePlayer {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  const CHUNK = 16; // schedule 16s at a time
  let offset = ctx.currentTime + 0.08;
  let chunkNo = 0;
  const queue = () => {
    schedulePiece(ctx, master, MOODS[moodKey], seed + chunkNo, offset, CHUNK);
    offset += CHUNK;
    chunkNo++;
  };
  queue();
  const tick = setInterval(() => {
    if (offset - ctx.currentTime < 4) queue();
  }, 1000);
  return {
    stop() {
      clearInterval(tick);
      void ctx.close();
    },
  };
}

/** Render `seconds` of a piece offline and return a WAV blob. */
export async function renderWav(
  moodKey: MoodKey, seed: number, seconds: number,
): Promise<Blob> {
  const rate = 44100;
  const ctx = new OfflineAudioContext(2, rate * seconds, rate);
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  schedulePiece(ctx, master, MOODS[moodKey], seed, 0, seconds - 1.5);
  const buf = await ctx.startRendering();
  return encodeWav(buf);
}

function encodeWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels;
  const len = buf.length * ch * 2;
  const ab = new ArrayBuffer(44 + len);
  const v = new DataView(ab);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + len, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, len, true);
  let off = 44;
  for (let i = 0; i < buf.length; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, buf.getChannelData(c)[i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      off += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
