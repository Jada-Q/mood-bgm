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
  | "strings"
  | "violin"
  | "cello"
  | "harp"
  | "guitar"
  | "marimba"
  | "vibraphone"
  | "trumpet"
  | "accordion"
  | "choir";

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
  violin: {
    label: "Violin", cn: "小提琴",
    play: (ctx, dest, f, t, v, d) => {
      // Single bowed voice: saw through a lowpass, 6Hz vibrato, bow-speed attack.
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const vib = ctx.createOscillator();
      vib.frequency.value = 6;
      const vibGain = ctx.createGain();
      vibGain.gain.value = f * 0.008;
      vib.connect(vibGain).connect(o.frequency);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = Math.min(7000, f * 5);
      lp.Q.value = 1.2; // a hint of body resonance
      const g = env(ctx, t, v * 0.45, d * 1.2, 0.07);
      o.connect(lp).connect(g).connect(dest);
      o.start(t); vib.start(t);
      o.stop(t + d * 1.2 + 0.1); vib.stop(t + d * 1.2 + 0.1);
    },
  },
  cello: {
    label: "Cello", cn: "大提琴",
    play: (ctx, dest, f, t, v, d) => {
      // An octave below the written note, darker filter, slower bow.
      const ff = f / 2;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = ff;
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.5;
      const vibGain = ctx.createGain();
      vibGain.gain.value = ff * 0.007;
      vib.connect(vibGain).connect(o.frequency);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = Math.min(3500, ff * 4);
      lp.Q.value = 1.4;
      const g = env(ctx, t, v * 0.55, d * 1.4, 0.1);
      o.connect(lp).connect(g).connect(dest);
      o.start(t); vib.start(t);
      o.stop(t + d * 1.4 + 0.1); vib.stop(t + d * 1.4 + 0.1);
    },
  },
  harp: {
    label: "Harp", cn: "竖琴",
    play: (ctx, dest, f, t, v, d) => {
      // Bright long-ringing pluck — Karplus-Strong opened wide, slow close.
      const period = Math.max(8, Math.round(ctx.sampleRate / f));
      const buf = ctx.createBuffer(1, period, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(Math.min(12000, f * 14), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2), t + d * 1.6);
      const g = env(ctx, t, v * 0.8, d * 1.6, 0.002);
      src.connect(lp).connect(g).connect(dest);
      src.start(t);
      src.stop(t + d * 1.6 + 0.05);
    },
  },
  guitar: {
    label: "Guitar", cn: "吉他",
    play: (ctx, dest, f, t, v, d) => {
      // Nylon-string voicing: same string physics, warmer start, faster damping.
      const period = Math.max(8, Math.round(ctx.sampleRate / f));
      const buf = ctx.createBuffer(1, period, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(Math.min(5000, f * 5), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 0.9), t + d * 0.8);
      const g = env(ctx, t, v, d * 0.8, 0.003);
      src.connect(lp).connect(g).connect(dest);
      src.start(t);
      src.stop(t + d * 0.8 + 0.05);
    },
  },
  marimba: {
    label: "Marimba", cn: "马林巴",
    play: (ctx, dest, f, t, v, d) => {
      // Wooden bar: strong fundamental, brief 4x partial, very fast die-off.
      const dd = Math.min(d, 0.5);
      osc(ctx, dest, "sine", f, t, v * 0.8, dd, 0.002);
      osc(ctx, dest, "sine", f * 4, t, v * 0.2, 0.08, 0.002);
    },
  },
  vibraphone: {
    label: "Vibraphone", cn: "颤音琴",
    play: (ctx, dest, f, t, v, d) => {
      // Metal bar + rotating fan = tremolo on the gain, long shimmer.
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * 2;
      const trem = ctx.createOscillator();
      trem.frequency.value = 5;
      const tremGain = ctx.createGain();
      tremGain.gain.value = 0.35;
      const mod = ctx.createGain();
      mod.gain.value = 1;
      trem.connect(tremGain).connect(mod.gain);
      const g = env(ctx, t, v * 0.55, d * 1.6, 0.002);
      o.connect(mod).connect(g).connect(dest);
      o.start(t); trem.start(t);
      o.stop(t + d * 1.6 + 0.1); trem.stop(t + d * 1.6 + 0.1);
    },
  },
  trumpet: {
    label: "Trumpet", cn: "小号",
    play: (ctx, dest, f, t, v, d) => {
      // Brass = saw with a bandpass formant and a punchy attack.
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = Math.min(4000, f * 3);
      bp.Q.value = 0.8;
      const g = env(ctx, t, v * 0.6, d, 0.025);
      o.connect(bp).connect(g).connect(dest);
      o.start(t);
      o.stop(t + d + 0.1);
    },
  },
  accordion: {
    label: "Accordion", cn: "手风琴",
    play: (ctx, dest, f, t, v, d) => {
      // Musette tuning: two reeds a dozen cents apart, sustained like bellows.
      for (const det of [-12, 12] as const) {
        const o = ctx.createOscillator();
        o.type = "square";
        o.frequency.value = f;
        o.detune.value = det;
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = Math.min(4500, f * 4);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(v * 0.18, t + 0.04);
        gain.gain.setValueAtTime(v * 0.18, t + d * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(lp).connect(gain).connect(dest);
        o.start(t);
        o.stop(t + d + 0.1);
      }
    },
  },
  choir: {
    label: "Choir", cn: "合唱",
    play: (ctx, dest, f, t, v, d) => {
      // Detuned triangles through an "ah" formant, breathing in slowly.
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 900; // first formant of "ah"
      bp.Q.value = 0.5;
      bp.connect(dest);
      osc(ctx, bp, "triangle", f, t, v * 0.5, d * 1.5, 0.15, -9);
      osc(ctx, bp, "triangle", f, t, v * 0.5, d * 1.5, 0.15, 9);
      osc(ctx, bp, "triangle", f * 2, t, v * 0.18, d * 1.5, 0.15, 4);
    },
  },
};
