// The mood/scene matrix — the soul of the tool. Every entry is pure music
// theory in table form: scale color, chord progression, tempo, waveform,
// drum density. The synth in engine.ts renders them all identically.

export interface ChordDef {
  root: number;
  tones: number[];
}

export interface MoodDef {
  label: string;
  cn: string;
  bpm: [number, number];
  progression: ChordDef[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  leadOctave: number;
  restChance: number;
  kickBeats: number[];
  hatEighths: number[];
  bassEveryEighth: boolean;
  echo: boolean;
  swing: number;
  noteLen?: number; // lead decay in eighths (default 1.5; small = staccato)
  barEighths?: number; // eighths per bar (default 8 = 4/4; 6 = waltz/jig)
}

// Note frequencies (A440 equal temperament).
const C2 = 65.41, D2 = 73.42, E2 = 82.41, F2 = 87.31,
  G2 = 98.0, Ab2 = 103.83, A2 = 110.0, Bb2 = 116.54, B2 = 123.47,
  C3 = 130.81, D3 = 146.83, Eb3 = 155.56, E3 = 164.81, F3 = 174.61,
  G3 = 196.0, Ab3 = 207.65, A3 = 220.0, Bb3 = 233.08, B3 = 246.94,
  C4 = 261.63, Db4 = 277.18, D4 = 293.66, Eb4 = 311.13, E4 = 329.63,
  F4 = 349.23, Gb4 = 369.99, G4 = 392.0, Ab4 = 415.3, A4 = 440.0, Bb4 = 466.16,
  B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;
void D2; // reserved for future recipes

export type MoodKey =
  // 情绪 moods
  | "happy" | "cozy" | "playful"
  | "sad" | "heartbroken" | "nostalgic"
  | "calm" | "meditative"
  | "excited" | "epic" | "victory"
  | "angry" | "tense" | "dark"
  | "mystery" | "dreamy" | "space"
  // 场景 scenes
  | "cafe" | "focus" | "sleep" | "rain"
  | "roadtrip" | "workout" | "party"
  | "menu" | "boss" | "village" | "scifi" | "horror" | "ceremony"
  // 风格 genres
  | "jazz" | "bossa" | "blues" | "rock" | "funk" | "reggae" | "disco"
  | "synthwave" | "lofi" | "waltz" | "march" | "celtic" | "guofeng" | "wafu"
  // 作曲家 composers
  | "bach" | "vivaldi" | "mozart" | "beethoven" | "chopin"
  | "tchaikovsky" | "debussy" | "satie" | "glass" | "hisaishi";

export const MOODS: Record<MoodKey, MoodDef> = {
  // ============================================================ 欢乐系 ==
  happy: {
    label: "Cheerful", cn: "欢快", bpm: [118, 132],
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
  cozy: {
    label: "Cozy", cn: "温馨", bpm: [92, 104],
    progression: [
      // 50s progression: I–vi–IV–V — warm as a blanket.
      { root: C2, tones: [C4, E4, G4] },
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: G2, tones: [B3, D4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.25, kickBeats: [0], hatEighths: [3, 7],
    bassEveryEighth: false, echo: false, swing: 0.16, noteLen: 2,
  },
  playful: {
    label: "Playful", cn: "俏皮", bpm: [128, 142],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: F2, tones: [A3, C4, F4, A4] },
      { root: C2, tones: [C4, E4, G4, E5] },
      { root: G2, tones: [B3, D4, G4, D5] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 2,
    restChance: 0.3, kickBeats: [0, 4], hatEighths: [1, 2, 5, 6],
    bassEveryEighth: true, echo: false, swing: 0.18, noteLen: 0.7,
  },
  // ============================================================ 悲伤系 ==
  sad: {
    label: "Melancholy", cn: "忧郁", bpm: [66, 78],
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
  heartbroken: {
    label: "Heartbroken", cn: "心碎", bpm: [58, 68],
    progression: [
      // Andalusian descent: Am — G — F — E. Each bar one step further down.
      { root: A2, tones: [A3, C4, E4] },
      { root: G2, tones: [G3, B3, D4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: E2, tones: [Ab3, B3, E4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.55, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 3.5,
  },
  nostalgic: {
    label: "Nostalgic", cn: "怀旧", bpm: [76, 88],
    progression: [
      // 王道進行 (royal road): IV — V — iii — vi. Pure J-pop longing.
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: G2, tones: [B3, D4, F4, G4] },
      { root: E2, tones: [G3, B3, E4] },
      { root: A2, tones: [A3, C4, E4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.3, kickBeats: [0], hatEighths: [3, 7],
    bassEveryEighth: false, echo: true, swing: 0.12, noteLen: 2.2,
  },
  // ============================================================ 平静系 ==
  calm: {
    label: "Lazy", cn: "慵懒", bpm: [78, 90],
    progression: [
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.4, kickBeats: [], hatEighths: [3, 7],
    bassEveryEighth: false, echo: true, swing: 0,
  },
  meditative: {
    label: "Meditative", cn: "冥想", bpm: [56, 66],
    progression: [
      // One maj7 chord held like a long breath, then its neighbor.
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: F2, tones: [A3, C4, E4, F4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.62, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 4,
  },
  // ============================================================ 激动系 ==
  excited: {
    label: "Racing", cn: "竞速", bpm: [144, 162],
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
  epic: {
    label: "Epic", cn: "热血", bpm: [140, 155],
    progression: [
      // i — bVI — bIII — bVII: every anime climax ever.
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [A3, C4, F4, A4] },
      { root: C3, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [B3, D4, G4, B4] },
    ],
    leadWave: "square", bassWave: "sawtooth", leadOctave: 2,
    restChance: 0.08, kickBeats: [0, 2, 4, 6], hatEighths: [1, 3, 5, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  victory: {
    label: "Victory", cn: "胜利", bpm: [124, 136],
    progression: [
      // I — IV — V — I: the fanfare loop.
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: F2, tones: [A3, C4, F4, C5] },
      { root: G2, tones: [B3, D4, G4, D5] },
      { root: C2, tones: [C4, E4, G4, E5] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 2,
    restChance: 0.1, kickBeats: [0, 4], hatEighths: [2, 6],
    bassEveryEighth: true, echo: false, swing: 0, noteLen: 1,
  },
  // ============================================================ 黑暗系 ==
  angry: {
    label: "Battle", cn: "战斗", bpm: [132, 148],
    progression: [
      { root: E2, tones: [E3, G3, B3, E4] },
      { root: E2, tones: [E3, G3, B3, E4] },
      { root: F2, tones: [F3, Ab3, C4, F4] },
      { root: E2, tones: [E3, G3, Bb3, E4] },
    ],
    leadWave: "sawtooth", bassWave: "sawtooth", leadOctave: 1,
    restChance: 0.15, kickBeats: [0, 3, 4, 6], hatEighths: [2, 6],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  tense: {
    label: "Tense", cn: "紧张", bpm: [100, 115],
    progression: [
      // Semitone ostinato: Em — F — Em — F. A ticking clock of dread.
      { root: E2, tones: [E3, G3, B3] },
      { root: F2, tones: [F3, Ab3, C4] },
      { root: E2, tones: [E3, G3, B3] },
      { root: F2, tones: [F3, Ab3, C4] },
    ],
    leadWave: "sawtooth", bassWave: "sine", leadOctave: 1,
    restChance: 0.4, kickBeats: [0, 5], hatEighths: [2, 6],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 0.8,
  },
  dark: {
    label: "Dark", cn: "暗黑", bpm: [68, 80],
    progression: [
      { root: E2, tones: [E3, G3, Bb3] },
      { root: E2, tones: [E3, F3, B3] },
      { root: C3, tones: [C4, Eb4, G4] },
      { root: B2, tones: [B3, D4, F4] },
    ],
    leadWave: "sawtooth", bassWave: "sine", leadOctave: 1,
    restChance: 0.5, kickBeats: [0], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 3,
  },
  // ============================================================ 神秘系 ==
  mystery: {
    label: "Suspense", cn: "悬疑", bpm: [84, 96],
    progression: [
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: C3, tones: [C4, Eb4, G4] },
      { root: E2, tones: [Ab3, B3, E4] },
    ],
    leadWave: "sine", bassWave: "triangle", leadOctave: 2,
    restChance: 0.35, kickBeats: [0], hatEighths: [5],
    bassEveryEighth: false, echo: true, swing: 0.08,
  },
  dreamy: {
    label: "Dreamy", cn: "梦幻", bpm: [80, 92],
    progression: [
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: G2, tones: [B3, D4, F4, A4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 2,
    restChance: 0.3, kickBeats: [], hatEighths: [3],
    bassEveryEighth: false, echo: true, swing: 0.1, noteLen: 2.6,
  },
  space: {
    label: "Space", cn: "太空", bpm: [60, 72],
    progression: [
      // Wide open fifths — no third, no gravity.
      { root: C2, tones: [C4, G4, C5] },
      { root: C2, tones: [C4, G4, D5] },
      { root: A2, tones: [A3, E4, A4] },
      { root: F2, tones: [F3, C4, F4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 2,
    restChance: 0.55, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 5,
  },
  // ============================================================ 场景 ==
  cafe: {
    label: "Café", cn: "咖啡店", bpm: [92, 102],
    progression: [
      // ii–V–I–vi jazz turnaround, swung.
      { root: D3, tones: [D4, F4, A4, C5] },
      { root: G2, tones: [B3, D4, F4, A4] },
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: A2, tones: [A3, C4, E4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.32, kickBeats: [0], hatEighths: [2, 5, 7],
    bassEveryEighth: false, echo: false, swing: 0.2, noteLen: 1.2,
  },
  focus: {
    label: "Focus", cn: "学习工作", bpm: [76, 84],
    progression: [
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: F2, tones: [A3, C4, E4] },
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: G2, tones: [B3, D4, G4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.5, kickBeats: [0, 4], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 2.8,
  },
  sleep: {
    label: "Sleep", cn: "睡前", bpm: [52, 60],
    progression: [
      { root: C3, tones: [C4, E4, G4] },
      { root: C3, tones: [C4, E4, G4] },
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.68, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 5,
  },
  rain: {
    label: "Rainy Night", cn: "雨夜", bpm: [70, 80],
    progression: [
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.42, kickBeats: [], hatEighths: [1, 3, 5, 7], // rain ticks
    bassEveryEighth: false, echo: true, swing: 0.06, noteLen: 2.4,
  },
  roadtrip: {
    label: "Road Trip", cn: "公路旅行", bpm: [108, 120],
    progression: [
      { root: C2, tones: [C4, E4, G4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [B3, D4, G4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 2,
    restChance: 0.2, kickBeats: [0, 4], hatEighths: [2, 6],
    bassEveryEighth: true, echo: false, swing: 0.13,
  },
  workout: {
    label: "Workout", cn: "运动健身", bpm: [148, 160],
    progression: [
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: G2, tones: [G3, B3, D4, G4] },
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [F3, A3, C4, F4] },
    ],
    leadWave: "square", bassWave: "square", leadOctave: 2,
    restChance: 0.1, kickBeats: [0, 2, 4, 6], hatEighths: [0, 1, 2, 3, 4, 5, 6, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  party: {
    label: "Party", cn: "派对", bpm: [122, 130],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [A3, C4, F4, A4] },
      { root: G2, tones: [B3, D4, G4, B4] },
    ],
    leadWave: "square", bassWave: "sawtooth", leadOctave: 2,
    restChance: 0.15, kickBeats: [0, 2, 4, 6], hatEighths: [1, 3, 5, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  menu: {
    label: "Game Menu", cn: "游戏菜单", bpm: [112, 124],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [B3, D4, G4] },
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4, A4] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 2,
    restChance: 0.28, kickBeats: [0], hatEighths: [3, 7],
    bassEveryEighth: true, echo: false, swing: 0.14, noteLen: 0.8,
  },
  boss: {
    label: "Boss Fight", cn: "BOSS 战", bpm: [150, 164],
    progression: [
      { root: E2, tones: [E3, G3, B3, E4] },
      { root: F2, tones: [F3, Ab3, C4, F4] },
      { root: E2, tones: [E3, G3, Bb3, E4] },
      { root: G2, tones: [G3, Bb3, D4, G4] },
    ],
    leadWave: "sawtooth", bassWave: "sawtooth", leadOctave: 2,
    restChance: 0.08, kickBeats: [0, 2, 3, 4, 6], hatEighths: [1, 5, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  village: {
    label: "Village", cn: "田园村庄", bpm: [96, 108],
    progression: [
      { root: C2, tones: [C4, E4, G4] },
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: G2, tones: [B3, D4, G4, B4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0.25, kickBeats: [0], hatEighths: [3, 7],
    bassEveryEighth: false, echo: false, swing: 0.16, noteLen: 1.4,
  },
  scifi: {
    label: "Sci-Fi", cn: "科幻", bpm: [72, 84],
    progression: [
      { root: C2, tones: [C4, G4, D5] },
      { root: E2, tones: [E4, B4, E5] },
      { root: A2, tones: [A3, E4, B4] },
      { root: F2, tones: [F3, C4, G4] },
    ],
    leadWave: "square", bassWave: "sine", leadOctave: 1,
    restChance: 0.45, kickBeats: [0, 5], hatEighths: [3],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 2.2,
  },
  horror: {
    label: "Horror", cn: "恐怖", bpm: [58, 68],
    progression: [
      { root: E2, tones: [E3, F3, Bb3] },
      { root: E2, tones: [E3, G3, Bb3] },
      { root: F2, tones: [F3, Ab3, B3] },
      { root: E2, tones: [E3, F3, B3] },
    ],
    leadWave: "sine", bassWave: "sawtooth", leadOctave: 1,
    restChance: 0.6, kickBeats: [0], hatEighths: [6],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 4,
  },
  ceremony: {
    label: "Ceremony", cn: "庆典颁奖", bpm: [100, 112],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: F2, tones: [C4, F4, A4, C5] },
      { root: G2, tones: [D4, G4, B4, D5] },
      { root: C2, tones: [E4, G4, C5, E5] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.18, kickBeats: [0, 4], hatEighths: [],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 2.5,
  },
  // ============================================================ 风格 ==
  jazz: {
    label: "Jazz", cn: "爵士", bpm: [120, 138],
    progression: [
      // Bebop turnaround in 7ths: Dm7 — G7 — Cmaj7 — A7. Heavy swing.
      { root: D3, tones: [D4, F4, A4, C5] },
      { root: G2, tones: [B3, D4, F4, A4] },
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: A2, tones: [A3, Db4, E4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.28, kickBeats: [0, 4], hatEighths: [0, 2, 3, 4, 6, 7],
    bassEveryEighth: false, echo: false, swing: 0.3, noteLen: 0.9,
  },
  bossa: {
    label: "Bossa Nova", cn: "波萨诺瓦", bpm: [104, 116],
    progression: [
      // Cmaj7 — Am7 — Dm7 — G7, straight eighths, syncopated clave-ish hats.
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: D3, tones: [D4, F4, A4, C5] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.3, kickBeats: [0, 3], hatEighths: [0, 3, 6],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 1.6,
  },
  blues: {
    label: "Blues", cn: "蓝调", bpm: [86, 100],
    progression: [
      // Dominant 7ths everywhere: C7 — F7 — C7 — G7, shuffled hard.
      { root: C2, tones: [C4, E4, G4, Bb4] },
      { root: F2, tones: [A3, C4, Eb4, F4] },
      { root: C2, tones: [C4, Eb4, E4, G4, Bb4] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.3, kickBeats: [0, 4], hatEighths: [0, 2, 4, 6],
    bassEveryEighth: false, echo: false, swing: 0.32, noteLen: 1.2,
  },
  rock: {
    label: "Rock", cn: "摇滚", bpm: [126, 142],
    progression: [
      // I — bVII — IV — I power-chord anthem (no thirds in the low end).
      { root: A2, tones: [A3, E4, A4] },
      { root: G2, tones: [G3, D4, G4] },
      { root: D3, tones: [D4, Gb4, A4] },
      { root: A2, tones: [A3, E4, A4, B4] },
    ],
    leadWave: "sawtooth", bassWave: "sawtooth", leadOctave: 1,
    restChance: 0.15, kickBeats: [0, 3, 4, 6], hatEighths: [0, 1, 2, 3, 4, 5, 6, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  funk: {
    label: "Funk", cn: "放克", bpm: [102, 114],
    progression: [
      // One-chord vamp on E9 with a IV detour — the groove IS the song.
      { root: E2, tones: [E4, Ab4, B4, D5] },
      { root: E2, tones: [E4, Ab4, B4, Gb4] },
      { root: A2, tones: [A3, Db4, E4, G4] },
      { root: E2, tones: [E4, Ab4, B4, D5] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 1,
    restChance: 0.42, kickBeats: [0, 3, 6], hatEighths: [0, 1, 2, 3, 4, 5, 6, 7],
    bassEveryEighth: true, echo: false, swing: 0.12, noteLen: 0.5,
  },
  reggae: {
    label: "Reggae", cn: "雷鬼", bpm: [72, 84],
    progression: [
      { root: C2, tones: [C4, E4, G4] },
      { root: F2, tones: [A3, C4, F4] },
      { root: G2, tones: [B3, D4, G4] },
      { root: C2, tones: [C4, E4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    // Everything lands on the offbeat — the skank.
    restChance: 0.38, kickBeats: [2, 6], hatEighths: [2, 6],
    bassEveryEighth: false, echo: false, swing: 0.14, noteLen: 0.8,
  },
  disco: {
    label: "Disco", cn: "迪斯科", bpm: [118, 126],
    progression: [
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: D3, tones: [D4, F4, A4, C5] },
      { root: G2, tones: [G3, B3, D4, F4] },
      { root: C3, tones: [C4, E4, G4, B4] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 2,
    // Four on the floor + open hats between every kick.
    restChance: 0.2, kickBeats: [0, 2, 4, 6], hatEighths: [1, 3, 5, 7],
    bassEveryEighth: true, echo: false, swing: 0,
  },
  synthwave: {
    label: "Synthwave", cn: "合成波", bpm: [96, 108],
    progression: [
      // 80s neon: i — bVI — bIII — bVII with relentless eighth-note bass.
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [F3, A3, C4, F4] },
      { root: C3, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [G3, B3, D4, G4] },
    ],
    leadWave: "sawtooth", bassWave: "sawtooth", leadOctave: 1,
    restChance: 0.25, kickBeats: [0, 4], hatEighths: [2, 6],
    bassEveryEighth: true, echo: true, swing: 0, noteLen: 2,
  },
  lofi: {
    label: "Lo-Fi", cn: "低保真", bpm: [70, 82],
    progression: [
      // Dusty 7th loop, lazy swing, head-nod kick.
      { root: F2, tones: [A3, C4, E4, F4] },
      { root: E2, tones: [G3, B3, D4, E4] },
      { root: A2, tones: [A3, C4, E4, G4] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 1,
    restChance: 0.4, kickBeats: [0, 5], hatEighths: [2, 6],
    bassEveryEighth: false, echo: true, swing: 0.24, noteLen: 1.8,
  },
  waltz: {
    label: "Waltz", cn: "圆舞曲", bpm: [138, 152],
    progression: [
      // 3/4 oom-pah-pah: bass on ONE, chords answering on two-three.
      { root: C2, tones: [C4, E4, G4] },
      { root: G2, tones: [B3, D4, G4] },
      { root: A2, tones: [A3, C4, E4] },
      { root: F2, tones: [A3, C4, F4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 2,
    restChance: 0.22, kickBeats: [0], hatEighths: [2, 4],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 1.8, barEighths: 6,
  },
  march: {
    label: "March", cn: "进行曲", bpm: [112, 122],
    progression: [
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: G2, tones: [B3, D4, G4, B4] },
      { root: C2, tones: [C4, E4, G4, E5] },
    ],
    leadWave: "square", bassWave: "triangle", leadOctave: 1,
    // Left-right-left-right: kick every beat, snare-ish hats between.
    restChance: 0.12, kickBeats: [0, 2, 4, 6], hatEighths: [1, 3, 5, 7],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 0.9,
  },
  celtic: {
    label: "Celtic", cn: "凯尔特", bpm: [150, 168],
    progression: [
      // Dorian jig in 6/8: Am — G — Am — C, dancing triplet feel.
      { root: A2, tones: [A3, C4, D4, E4, G4] },
      { root: G2, tones: [G3, B3, D4, G4] },
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: C3, tones: [C4, D4, E4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0.1, kickBeats: [0, 3], hatEighths: [0, 1, 2, 3, 4, 5],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 0.8, barEighths: 6,
  },
  guofeng: {
    label: "Chinese", cn: "国风", bpm: [84, 96],
    progression: [
      // 宫调式五声 — gong-mode pentatonic, no semitones anywhere.
      { root: C2, tones: [C4, D4, E4, G4, A4] },
      { root: A2, tones: [A3, C4, D4, E4, G4] },
      { root: G2, tones: [G3, A3, C4, D4, E4] },
      { root: C2, tones: [C4, D4, E4, G4, A4, C5] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0.35, kickBeats: [0], hatEighths: [4],
    bassEveryEighth: false, echo: true, swing: 0.08, noteLen: 2.2,
  },
  wafu: {
    label: "Japanese", cn: "和风", bpm: [66, 78],
    progression: [
      // 都節音階 miyako-bushi: E F A B C — the two半音 ARE the mood.
      { root: E2, tones: [E4, F4, A4, B4] },
      { root: A2, tones: [A3, B3, E4, F4] },
      { root: E2, tones: [E4, F4, A4, C5] },
      { root: B2, tones: [B3, C4, E4, F4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.5, kickBeats: [0], hatEighths: [5],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 3,
  },
  // ============================================================ 作曲家 ==
  // "风" = in the style of: each recipe borrows the composer's signature
  // device (progression / meter / texture), not any actual melody.
  bach: {
    label: "Bach", cn: "巴赫风", bpm: [96, 110],
    progression: [
      // Circle of fifths with stepwise tone pools — perpetual-motion counterpoint.
      { root: A2, tones: [A3, B3, C4, D4, E4] },
      { root: D3, tones: [D4, E4, F4, G4, A4] },
      { root: G2, tones: [G3, A3, B3, C4, D4] },
      { root: C3, tones: [C4, D4, E4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.06, kickBeats: [], hatEighths: [],
    bassEveryEighth: true, echo: false, swing: 0, noteLen: 0.9,
  },
  vivaldi: {
    label: "Vivaldi", cn: "维瓦尔第风", bpm: [138, 152],
    progression: [
      // Spring-allegro energy: bright sequences over a driving continuo.
      { root: E2, tones: [E4, G4, A4, B4, E5] },
      { root: C3, tones: [C4, D4, E4, G4] },
      { root: A2, tones: [A3, B3, C4, E4] },
      { root: B2, tones: [B3, Eb4, Gb4, A4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.05, kickBeats: [], hatEighths: [],
    bassEveryEighth: true, echo: false, swing: 0, noteLen: 0.7,
  },
  mozart: {
    label: "Mozart", cn: "莫扎特风", bpm: [116, 128],
    progression: [
      // Galant clarity: I — IV — I — V with an Alberti-style murmuring bass.
      { root: C2, tones: [C4, E4, G4, C5] },
      { root: F2, tones: [A3, C4, F4, A4] },
      { root: C2, tones: [C4, E4, G4, E5] },
      { root: G2, tones: [B3, D4, F4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0.15, kickBeats: [], hatEighths: [],
    bassEveryEighth: true, echo: false, swing: 0, noteLen: 0.8,
  },
  beethoven: {
    label: "Beethoven", cn: "贝多芬风", bpm: [116, 130],
    progression: [
      // C-minor defiance: i — bVI — iv — V, fate knocking in the kick.
      { root: C3, tones: [C4, Eb4, G4, C5] },
      { root: Ab2, tones: [Ab3, C4, Eb4, Ab4] },
      { root: F2, tones: [F3, Ab3, C4, F4] },
      { root: G2, tones: [G3, B3, D4, G4] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.12, kickBeats: [0, 4], hatEighths: [],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 1.1,
  },
  chopin: {
    label: "Chopin", cn: "肖邦风", bpm: [58, 70],
    progression: [
      // Nocturne: minor 7th colors, long singing lines, pedal haze (echo).
      { root: A2, tones: [A3, B3, C4, E4] },
      { root: D3, tones: [D4, F4, A4, C5] },
      { root: E2, tones: [Ab3, B3, D4, E4] },
      { root: A2, tones: [A3, C4, E4, A4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.35, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0.06, noteLen: 3,
  },
  tchaikovsky: {
    label: "Tchaikovsky", cn: "柴可夫斯基风", bpm: [136, 154],
    progression: [
      // Ballet waltz in minor — sweeping, romantic, always dancing.
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: D3, tones: [D4, F4, A4, D5] },
      { root: E2, tones: [Ab3, B3, E4, B4] },
      { root: A2, tones: [A3, C4, E4, C5] },
    ],
    leadWave: "triangle", bassWave: "triangle", leadOctave: 1,
    restChance: 0.18, kickBeats: [0], hatEighths: [2, 4],
    bassEveryEighth: false, echo: false, swing: 0, noteLen: 1.6, barEighths: 6,
  },
  debussy: {
    label: "Debussy", cn: "德彪西风", bpm: [66, 78],
    progression: [
      // Impressionism: parallel maj7 planes drifting with no cadence.
      { root: C3, tones: [C4, E4, G4, B4] },
      { root: Bb2, tones: [Bb3, D4, F4, A4] },
      { root: Ab2, tones: [Ab3, C4, Eb4, G4] },
      { root: Bb2, tones: [Bb3, D4, F4, A4] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 2,
    restChance: 0.38, kickBeats: [], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 2.8,
  },
  satie: {
    label: "Satie", cn: "萨蒂风", bpm: [69, 79],
    progression: [
      // Gymnopédie: two maj7 chords rocking in slow 3/4, furniture music.
      { root: G2, tones: [G3, B3, D4, Gb4] },
      { root: D3, tones: [D4, Gb4, A4, C5] },
      { root: G2, tones: [G3, B3, D4, Gb4] },
      { root: D3, tones: [D4, Gb4, A4, E5] },
    ],
    leadWave: "sine", bassWave: "sine", leadOctave: 1,
    restChance: 0.42, kickBeats: [0], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0, noteLen: 2.6, barEighths: 6,
  },
  glass: {
    label: "Glass", cn: "格拉斯风", bpm: [120, 132],
    progression: [
      // Minimalism: two alternating chords, relentless arpeggio machine.
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: F2, tones: [F3, A3, C4, F4] },
      { root: A2, tones: [A3, C4, E4, A4] },
      { root: G2, tones: [G3, B3, D4, G4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0, kickBeats: [], hatEighths: [],
    bassEveryEighth: true, echo: false, swing: 0, noteLen: 0.6,
  },
  hisaishi: {
    label: "Hisaishi", cn: "久石让风", bpm: [76, 88],
    progression: [
      // Ghibli warmth: royal-road cousins with added 9ths, gentle and vast.
      { root: F2, tones: [F3, A3, C4, E4] },
      { root: G2, tones: [G3, B3, D4] },
      { root: E2, tones: [E4, G4, B4, D5] },
      { root: A2, tones: [A3, B3, C4, E4] },
    ],
    leadWave: "triangle", bassWave: "sine", leadOctave: 2,
    restChance: 0.28, kickBeats: [0], hatEighths: [],
    bassEveryEighth: false, echo: true, swing: 0.05, noteLen: 2,
  },
};

export interface MoodGroup {
  title: string;
  color: string;
  keys: MoodKey[];
}

export const GROUPS: MoodGroup[] = [
  { title: "欢乐系", color: "#e8ab3c", keys: ["happy", "cozy", "playful"] },
  { title: "悲伤系", color: "#5b7d99", keys: ["sad", "heartbroken", "nostalgic"] },
  { title: "平静系", color: "#9fbfa8", keys: ["calm", "meditative"] },
  { title: "激动系", color: "#d2693e", keys: ["excited", "epic", "victory"] },
  { title: "黑暗系", color: "#b2453a", keys: ["angry", "tense", "dark"] },
  { title: "神秘系", color: "#7d6b99", keys: ["mystery", "dreamy", "space"] },
  {
    title: "场景",
    color: "#2e5d66",
    keys: [
      "cafe", "focus", "sleep", "rain", "roadtrip", "workout", "party",
      "menu", "boss", "village", "scifi", "horror", "ceremony",
    ],
  },
  {
    title: "风格",
    color: "#8a6f4d",
    keys: [
      "jazz", "bossa", "blues", "rock", "funk", "reggae", "disco",
      "synthwave", "lofi", "waltz", "march", "celtic", "guofeng", "wafu",
    ],
  },
  {
    title: "作曲家",
    color: "#5d4a6b",
    keys: [
      "bach", "vivaldi", "mozart", "beethoven", "chopin",
      "tchaikovsky", "debussy", "satie", "glass", "hisaishi",
    ],
  },
];
