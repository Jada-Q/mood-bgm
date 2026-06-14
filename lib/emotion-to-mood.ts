import type { MoodKey } from "./moods";

/** MediaPipe FaceLandmarker blendshape: result.faceBlendshapes[0].categories[i] */
export interface BlendshapeCategory {
  categoryName: string;
  score: number;
}

export type ScoreMap = Record<string, number>;

/**
 * blendshape categoryName 占位常量。
 * ⚠️ 步骤1 开摄像头 console.log(result.faceBlendshapes[0].categories) 实测确认真实字符串后替换。
 * 这些是 ARKit 风格命名，MediaPipe 大概率沿用，但未实测前不当事实。
 */
export const BS = {
  smileLeft: "mouthSmileLeft",
  smileRight: "mouthSmileRight",
  browDownLeft: "browDownLeft",
  browDownRight: "browDownRight",
  jawOpen: "jawOpen",
  browInnerUp: "browInnerUp",
} as const;

/** 把 categories 数组或已是 Record 的输入收敛成 ScoreMap。 */
export function toScoreMap(input: BlendshapeCategory[] | ScoreMap): ScoreMap {
  if (Array.isArray(input)) {
    const m: ScoreMap = {};
    for (const c of input) m[c.categoryName] = c.score;
    return m;
  }
  return input;
}

/** 合并左右对称 blendshape，输出语义键 smile/browDown/jawOpen/browInnerUp。 */
export function deriveSymmetric(m: ScoreMap): ScoreMap {
  const g = (k: string) => m[k] ?? 0;
  return {
    smile: (g(BS.smileLeft) + g(BS.smileRight)) / 2,
    browDown: (g(BS.browDownLeft) + g(BS.browDownRight)) / 2,
    jawOpen: g(BS.jawOpen),
    browInnerUp: g(BS.browInnerUp),
  };
}

export interface MoodRule {
  mood: MoodKey;
  conditions: ReadonlyArray<{ key: string; op: "gte" | "lte"; threshold: number }>;
  priority: number;
}

/**
 * 默认映射规则（语义键，由 deriveSymmetric 产出）→ mood 卡。
 * 所有 conditions 为 AND；多规则命中时 priority 大者胜。加卡 = 加一行，零逻辑改动。
 */
export const DEFAULT_MOOD_RULES: ReadonlyArray<MoodRule> = [
  {
    mood: "excited",
    priority: 40,
    conditions: [
      { key: "smile", op: "gte", threshold: 0.6 },
      { key: "jawOpen", op: "gte", threshold: 0.3 },
    ],
  },
  { mood: "happy", priority: 30, conditions: [{ key: "smile", op: "gte", threshold: 0.5 }] },
  { mood: "playful", priority: 20, conditions: [{ key: "smile", op: "gte", threshold: 0.25 }] },
  { mood: "tense", priority: 30, conditions: [{ key: "browDown", op: "gte", threshold: 0.4 }] },
  {
    mood: "calm",
    priority: 10,
    conditions: [
      { key: "smile", op: "lte", threshold: 0.1 },
      { key: "browDown", op: "lte", threshold: 0.2 },
      { key: "jawOpen", op: "lte", threshold: 0.2 },
    ],
  },
];

function meets(
  scoreMap: ScoreMap,
  cond: { key: string; op: "gte" | "lte"; threshold: number },
): boolean {
  const v = scoreMap[cond.key] ?? 0;
  return cond.op === "gte" ? v >= cond.threshold : v <= cond.threshold;
}

/** 纯函数：scoreMap + 规则表 → MoodKey（无明显表情返回 null）。 */
export function classifyEmotion(
  scoreMap: ScoreMap,
  rules: ReadonlyArray<MoodRule> = DEFAULT_MOOD_RULES,
): MoodKey | null {
  let best: MoodRule | null = null;
  for (const r of rules) {
    if (r.conditions.every((c) => meets(scoreMap, c))) {
      if (!best || r.priority > best.priority) best = r;
    }
  }
  return best ? best.mood : null;
}

/** 便捷组合：原始 blendshapes → 归一化 → 派生 → 分类。 */
export function classifyBlendshapes(
  input: BlendshapeCategory[] | ScoreMap,
  rules: ReadonlyArray<MoodRule> = DEFAULT_MOOD_RULES,
): MoodKey | null {
  return classifyEmotion(deriveSymmetric(toScoreMap(input)), rules);
}

export interface DebounceConfig {
  holdMs?: number;
}

export interface DebounceState {
  candidate: MoodKey | null;
  candidateSinceMs: number | null;
  confirmed: MoodKey | null;
}

export interface MoodStabilizer {
  /** 每帧调用。返回需要切歌的 mood，无变化返回 null。时间从 nowMs 注入，内部不取时钟。 */
  update(candidate: MoodKey | null, nowMs: number): MoodKey | null;
  getState(): Readonly<DebounceState>;
  reset(): void;
}

/**
 * 防抖状态机：候选 mood 须稳定持续 holdMs 才 confirm 一次。
 * 时间参数注入（不调 Date.now/performance.now）→ 可纯测。
 */
export function createMoodStabilizer(config: DebounceConfig = {}): MoodStabilizer {
  const holdMs = config.holdMs ?? 800;
  let candidate: MoodKey | null = null;
  let candidateSinceMs: number | null = null;
  let confirmed: MoodKey | null = null;

  return {
    update(next, nowMs) {
      // 候选变化 → 重置计时（切到 null 不清 confirmed，音乐继续）
      if (next !== candidate) {
        candidate = next;
        candidateSinceMs = next === null ? null : nowMs;
        return null;
      }
      if (candidate === null) return null;
      if (candidate === confirmed) return null; // 同 mood 不重复 confirm
      if (candidateSinceMs !== null && nowMs - candidateSinceMs >= holdMs) {
        confirmed = candidate;
        return candidate;
      }
      return null;
    },
    getState() {
      return { candidate, candidateSinceMs, confirmed };
    },
    reset() {
      candidate = null;
      candidateSinceMs = null;
      confirmed = null;
    },
  };
}
