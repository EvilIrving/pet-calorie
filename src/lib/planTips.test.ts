import { describe, expect, it } from "vitest";
import type { CatProfile, FeedingLog, WeightLog } from "../db";
import { getPlanTips } from "./planTips";

const pet = { bcsScore: null } as Pick<CatProfile, "bcsScore">;

function weight(date: string, weightKg: number): WeightLog {
  return { petId: 1, date, weightKg };
}

function feeding(date: string): FeedingLog {
  return { petId: 1, date, dryGrams: 40, wetGrams: null };
}

describe("getPlanTips", () => {
  it("reports missing feeding and stale weight", () => {
    const tips = getPlanTips({
      pet,
      weightLogs: [weight("2026-05-20", 5)],
      feedingLogs: [],
      targetKcal: 200,
      today: "2026-06-04",
    });

    expect(tips.map((tip) => tip.messageKey)).toContain("feeding.missingToday");
    expect(tips.map((tip) => tip.messageKey)).toContain("weight.stale");
  });

  it("prioritizes high BCS risk", () => {
    const tips = getPlanTips({
      pet: { bcsScore: 8 },
      weightLogs: [],
      feedingLogs: [feeding("2026-06-04")],
      targetKcal: 200,
      today: "2026-06-04",
    });

    expect(tips[0].messageKey).toBe("plan.bcsHigh");
  });

  it("detects two fast consecutive losses", () => {
    const tips = getPlanTips({
      pet: { bcsScore: 5 },
      weightLogs: [weight("2026-06-04", 4.8), weight("2026-05-28", 4.9), weight("2026-05-21", 5)],
      feedingLogs: [feeding("2026-06-04")],
      targetKcal: 200,
      today: "2026-06-04",
    });

    expect(tips.map((tip) => tip.messageKey)).toContain("plan.lossFast");
  });
});
