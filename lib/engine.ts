// mood-bgm engine — mood → music-parameter matrix → WebAudio synthesis.
// Emotion lives in STRUCTURE (scale, progression, tempo, density), not in
// samples: the same tiny synth renders every mood. Seeded RNG so a piece
// can be regenerated identically and exported to WAV offline.

import { MOODS, type MoodDef, type MoodKey } from "./moods";

export { MOODS, GROUPS } from "./moods";
export type { MoodKey, MoodDef, MoodGroup } from "./moods";

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
        eighth * (mood.noteLen ?? (mood.echo ? 2.4 : 1.5)));
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
