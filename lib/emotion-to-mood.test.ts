import { describe, it, expect, beforeEach } from "vitest";
import {
  toScoreMap,
  deriveSymmetric,
  classifyEmotion,
  classifyBlendshapes,
  createMoodStabilizer,
  BS,
  type BlendshapeCategory,
  type MoodRule,
} from "./emotion-to-mood";
import type { MoodKey } from "./moods";

const raw = (o: Record<string, number>): BlendshapeCategory[] =>
  Object.entries(o).map(([categoryName, score]) => ({ categoryName, score }));

// ── 切片 A: 输入归一化 ────────────────────────────────
describe("toScoreMap", () => {
  it("array of categories → record", () => {
    expect(toScoreMap([{ categoryName: "a", score: 0.5 }])).toEqual({ a: 0.5 });
  });
  it("record passthrough", () => {
    expect(toScoreMap({ a: 0.5 })).toEqual({ a: 0.5 });
  });
  it("empty → {}", () => {
    expect(toScoreMap([])).toEqual({});
    expect(toScoreMap({})).toEqual({});
  });
});

// ── 切片 B: 纯映射函数（注入极简规则，不依赖真 blendshape 名）──
describe("classifyEmotion (injected rules)", () => {
  const rule = (
    mood: MoodKey,
    key: string,
    op: "gte" | "lte",
    threshold: number,
    priority = 0,
  ): MoodRule => ({ mood, conditions: [{ key, op, threshold }], priority });

  it("single gte rule met → mood", () => {
    expect(classifyEmotion({ smile: 0.6 }, [rule("happy", "smile", "gte", 0.5)])).toBe("happy");
  });
  it("gte below threshold → null", () => {
    expect(classifyEmotion({ smile: 0.3 }, [rule("happy", "smile", "gte", 0.5)])).toBeNull();
  });
  it("no rule matches → null", () => {
    expect(classifyEmotion({ browDown: 0.9 }, [rule("happy", "smile", "gte", 0.5)])).toBeNull();
  });
  it("higher priority wins on overlap", () => {
    const rules = [
      rule("playful", "smile", "gte", 0.2, 10),
      rule("happy", "smile", "gte", 0.2, 20),
    ];
    expect(classifyEmotion({ smile: 0.5 }, rules)).toBe("happy");
  });
  it("AND conditions: partial → null, full → mood", () => {
    const r: MoodRule = {
      mood: "excited",
      priority: 0,
      conditions: [
        { key: "smile", op: "gte", threshold: 0.5 },
        { key: "jawOpen", op: "gte", threshold: 0.3 },
      ],
    };
    expect(classifyEmotion({ smile: 0.6, jawOpen: 0.1 }, [r])).toBeNull();
    expect(classifyEmotion({ smile: 0.6, jawOpen: 0.4 }, [r])).toBe("excited");
  });
  it("lte rule (neutral detection)", () => {
    expect(classifyEmotion({ smile: 0.05 }, [rule("calm", "smile", "lte", 0.1)])).toBe("calm");
    expect(classifyEmotion({ smile: 0.5 }, [rule("calm", "smile", "lte", 0.1)])).toBeNull();
  });
  it("missing key treated as 0", () => {
    expect(classifyEmotion({}, [rule("happy", "smile", "gte", 0.5)])).toBeNull();
    expect(classifyEmotion({}, [rule("calm", "smile", "lte", 0.1)])).toBe("calm");
  });
});

// ── deriveSymmetric: 合并左右对称项 ───────────────────
describe("deriveSymmetric", () => {
  it("averages left/right smile into 'smile'", () => {
    expect(deriveSymmetric({ [BS.smileLeft]: 0.8, [BS.smileRight]: 0.6 }).smile).toBeCloseTo(0.7);
  });
  it("averages browDown", () => {
    expect(deriveSymmetric({ [BS.browDownLeft]: 0.4, [BS.browDownRight]: 0.6 }).browDown).toBeCloseTo(0.5);
  });
  it("passes through jawOpen / browInnerUp", () => {
    const m = deriveSymmetric({ [BS.jawOpen]: 0.5, [BS.browInnerUp]: 0.3 });
    expect(m.jawOpen).toBe(0.5);
    expect(m.browInnerUp).toBe(0.3);
  });
  it("missing side treated as 0", () => {
    expect(deriveSymmetric({ [BS.smileLeft]: 0.8 }).smile).toBeCloseTo(0.4);
  });
});

// ── 切片 C: 默认规则表 端到端 (raw blendshapes → mood) ──
describe("classifyBlendshapes (DEFAULT_MOOD_RULES)", () => {
  it("big smile → happy", () => {
    expect(classifyBlendshapes(raw({ [BS.smileLeft]: 0.7, [BS.smileRight]: 0.7 }))).toBe("happy");
  });
  it("smile + jaw open → excited (beats happy)", () => {
    expect(
      classifyBlendshapes(raw({ [BS.smileLeft]: 0.7, [BS.smileRight]: 0.7, [BS.jawOpen]: 0.4 })),
    ).toBe("excited");
  });
  it("medium smile → playful", () => {
    expect(classifyBlendshapes(raw({ [BS.smileLeft]: 0.3, [BS.smileRight]: 0.3 }))).toBe("playful");
  });
  it("brow down → tense", () => {
    expect(classifyBlendshapes(raw({ [BS.browDownLeft]: 0.5, [BS.browDownRight]: 0.5 }))).toBe("tense");
  });
  it("neutral face → calm", () => {
    expect(classifyBlendshapes(raw({ [BS.smileLeft]: 0.02, [BS.smileRight]: 0.02 }))).toBe("calm");
  });
});

// ── 切片 D: 防抖状态机 (时间手动注入) ──────────────────
describe("createMoodStabilizer", () => {
  let s: ReturnType<typeof createMoodStabilizer>;
  beforeEach(() => {
    s = createMoodStabilizer({ holdMs: 800 });
  });

  it("first update starts timing → null", () => {
    expect(s.update("happy", 0)).toBeNull();
  });
  it("same mood < hold → null", () => {
    s.update("happy", 0);
    expect(s.update("happy", 400)).toBeNull();
  });
  it("same mood >= hold → confirm once", () => {
    s.update("happy", 0);
    expect(s.update("happy", 800)).toBe("happy");
  });
  it("no repeat confirm after confirmed", () => {
    s.update("happy", 0);
    s.update("happy", 800);
    expect(s.update("happy", 1200)).toBeNull();
  });
  it("jitter resets timer", () => {
    s.update("happy", 0);
    s.update("sad", 100);
    s.update("happy", 200); // happy 重新从 200 起算
    expect(s.update("happy", 950)).toBeNull(); // 950-200=750 < 800
    expect(s.update("happy", 1000)).toBe("happy"); // 1000-200=800
  });
  it("candidate change resets timer", () => {
    s.update("happy", 0);
    s.update("happy", 700);
    s.update("sad", 750); // sad 从 750 起算
    expect(s.update("sad", 1000)).toBeNull(); // 250 < 800
    expect(s.update("sad", 1550)).toBe("sad"); // 800
  });
  it("candidate → null keeps confirmed (no stop)", () => {
    s.update("happy", 0);
    s.update("happy", 800);
    expect(s.update(null, 2000)).toBeNull();
    expect(s.getState().confirmed).toBe("happy");
  });
  it("custom holdMs", () => {
    const s2 = createMoodStabilizer({ holdMs: 500 });
    s2.update("happy", 0);
    expect(s2.update("happy", 500)).toBe("happy");
  });
  it("reset clears state", () => {
    s.update("happy", 0);
    s.update("happy", 800);
    s.reset();
    expect(s.getState().confirmed).toBeNull();
    s.update("happy", 1000);
    expect(s.update("happy", 1800)).toBe("happy");
  });
});

// ── 切片 E: classify + stabilize 串联冒烟 ──────────────
describe("classify + stabilize integration", () => {
  it("sustained smile produces exactly one mood switch", () => {
    const s = createMoodStabilizer({ holdMs: 800 });
    const smile = raw({ [BS.smileLeft]: 0.7, [BS.smileRight]: 0.7 });
    const results = [0, 200, 400, 600, 800, 1000].map((t) =>
      s.update(classifyBlendshapes(smile), t),
    );
    expect(results.filter((r) => r !== null)).toEqual(["happy"]);
  });
});
