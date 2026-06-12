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
}

// Note frequencies (A440 equal temperament).
const C2 = 65.41, D2 = 73.42, E2 = 82.41, F2 = 87.31,
  G2 = 98.0, A2 = 110.0, B2 = 123.47,
  C3 = 130.81, D3 = 146.83, Eb3 = 155.56, E3 = 164.81, F3 = 174.61,
  G3 = 196.0, Ab3 = 207.65, A3 = 220.0, Bb3 = 233.08, B3 = 246.94,
  C4 = 261.63, D4 = 293.66, Eb4 = 311.13, E4 = 329.63,
  F4 = 349.23, G4 = 392.0, Ab4 = 415.3, A4 = 440.0, Bb4 = 466.16,
  B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25;
void D2; void B2; void D3; void Bb4; // reserved for future recipes

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
  | "menu" | "boss" | "village" | "scifi" | "horror" | "ceremony";

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
];
