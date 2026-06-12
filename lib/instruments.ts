// Instrument bank — every voice is SYNTHESIZED (no samples): classic
// waveforms, additive stacks (organ, piano-ish), inharmonic partials
// (bell, music box) and Karplus-Strong plucked string (a looped single
// period of noise through a darkening lowpass — physics in 15 lines).

export type InstrumentKey =
  | "auto"
  | "chip"
  | "flute"
  | "pluck"
  | "piano"
  | "musicbox"
  | "bell"
  | "organ"
  | "strings";

export interface Instrument {
  label: string;
  cn: string;
  play(
    ctx: BaseAudioContext,
    dest: AudioNode,
    freq: number,
    t: number,
    vol: number,
    decay: number,
  ): void;
}

function env(ctx: BaseAudioContext, t: number, vol: number, decay: number, attack = 0.005) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + decay);
  return g;
}

function osc(
  ctx: BaseAudioContext, dest: AudioNode, type: OscillatorType,
  freq: number, t: number, vol: number, decay: number, attack = 0.005, detune = 0,
) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  const g = env(ctx, t, vol, decay, attack);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + decay + 0.1);
}

export const INSTRUMENTS: Record<Exclude<InstrumentKey, "auto">, Instrument> = {
  chip: {
    label: "Chiptune", cn: "8位机",
    play: (ctx, dest, f, t, v, d) => osc(ctx, dest, "square", f, t, v * 0.55, d),
  },
  flute: {
    label: "Flute", cn: "长笛",
    play: (ctx, dest, f, t, v, d) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const vib = ctx.createOscillator();
      vib.frequency.value = 5.5;
      const vibGain = ctx.createGain();
      vibGain.gain.value = f * 0.006;
      vib.connect(vibGain).connect(o.frequency);
      const g = env(ctx, t, v, d, 0.06); // soft breathy attack
      o.connect(g).connect(dest);
      o.start(t); vib.start(t);
      o.stop(t + d + 0.1); vib.stop(t + d + 0.1);
    },
  },
  pluck: {
    label: "Pluck", cn: "拨弦",
    play: (ctx, dest, f, t, v, d) => {
      // Karplus-Strong: one period of noise, looped, through a lowpass
      // that closes over time — a string losing its brightness.
      const period = Math.max(8, Math.round(ctx.sampleRate / f));
      const buf = ctx.createBuffer(1, period, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.2), t + d);
      const g = env(ctx, t, v * 0.9, d, 0.002);
      src.connect(lp).connect(g).connect(dest);
      src.start(t);
      src.stop(t + d + 0.05);
    },
  },
  piano: {
    label: "Piano-ish", cn: "钢琴",
    play: (ctx, dest, f, t, v, d) => {
      osc(ctx, dest, "triangle", f, t, v * 0.7, d);
      osc(ctx, dest, "sine", f * 2, t, v * 0.25, d * 0.6);
      osc(ctx, dest, "sine", f * 3, t, v * 0.12, d * 0.35);
    },
  },
  musicbox: {
    label: "Music Box", cn: "八音盒",
    play: (ctx, dest, f, t, v, d) => {
      osc(ctx, dest, "sine", f * 2, t, v * 0.6, Math.min(d, 1.2), 0.002);
      osc(ctx, dest, "sine", f * 8, t, v * 0.12, 0.25, 0.002);
    },
  },
  bell: {
    label: "Bell", cn: "钟铃",
    play: (ctx, dest, f, t, v, d) => {
      // Inharmonic partials — what makes a bell a bell.
      osc(ctx, dest, "sine", f, t, v * 0.5, d * 1.4, 0.002);
      osc(ctx, dest, "sine", f * 2.4, t, v * 0.25, d, 0.002);
      osc(ctx, dest, "sine", f * 5.95, t, v * 0.1, d * 0.5, 0.002);
    },
  },
  organ: {
    label: "Organ", cn: "风琴",
    play: (ctx, dest, f, t, v, d) => {
      // Additive drawbars, sustained then released.
      for (const [mult, g] of [[1, 0.4], [2, 0.25], [3, 0.12]] as const) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f * mult;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(v * g, t + 0.03);
        gain.gain.setValueAtTime(v * g, t + d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(gain).connect(dest);
        o.start(t);
        o.stop(t + d + 0.1);
      }
    },
  },
  strings: {
    label: "Strings", cn: "弦乐",
    play: (ctx, dest, f, t, v, d) => {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = Math.min(6000, f * 6);
      lp.connect(dest);
      osc(ctx, lp, "sawtooth", f, t, v * 0.3, d * 1.3, d * 0.25, -7);
      osc(ctx, lp, "sawtooth", f, t, v * 0.3, d * 1.3, d * 0.25, 7);
    },
  },
};
