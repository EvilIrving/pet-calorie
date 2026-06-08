import { describe, expect, it } from "vitest";
import type { CatProfile, SavedFood, WeightLog } from "../db";
import { buildPrintPlanData } from "./printPlan";

const basePet: CatProfile = {
  id: 1,
  species: "cat",
  name: "Mikan",
  weightKg: 6,
  idealWeightKg: 5,
  bcsScore: 7,
  bcsAssessedAt: "2026-06-01T00:00:00.000Z",
  lifeStage: "adult_neutered",
  neutered: true,
  activity: "low",
  feedingMode: "mixed",
  mixedDryRatio: 0.4,
  dietStartDate: "2026-06-01T00:00:00.000Z",
  dietStartWeightKg: 6,
  onboardingDone: true,
  updatedAt: "2026-06-01T00:00:00.000Z",
};

function food(foodType: "dry" | "wet", kcalPerKg: number): SavedFood {
  return {
    id: foodType === "dry" ? 1 : 2,
    petId: 1,
    name: foodType,
    foodType,
    kcalPerKg,
    macros: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  };
}

describe("buildPrintPlanData", () => {
  it("creates daily calendar and weekly paper tracking rows", () => {
    const data = buildPrintPlanData({
      pet: basePet,
      foods: [food("dry", 3500), food("wet", 900)],
      weightLogs: [],
      generatedDate: "2026-06-04",
    });

    expect(data.dailyChecks.length).toBeGreaterThan(14);
    expect(data.dailyChecks[0]).toEqual({ index: 1, date: "2026-06-04" });
    expect(data.dailyChecks[data.dailyChecks.length - 1].date).toBe(data.planEndDate);
    expect(data.weeklyWeights.length).toBeGreaterThanOrEqual(4);
    expect(data.weeklyWeights[0].week).toBe(1);
    expect(data.dryRatioPercent).toBe(40);
    expect(data.wetRatioPercent).toBe(60);
  });

  it("uses the latest weight log as current weight without querying storage", () => {
    const logs: WeightLog[] = [
      { petId: 1, date: "2026-06-04", weightKg: 5.8 },
      { petId: 1, date: "2026-06-02", weightKg: 5.9 },
    ];

    const data = buildPrintPlanData({
      pet: basePet,
      foods: [food("dry", 3500), food("wet", 900)],
      weightLogs: logs,
      generatedDate: "2026-06-04",
    });

    expect(data.currentWeightKg).toBe(5.8);
  });

  it("keeps missing planned food as null instead of zero grams", () => {
    const data = buildPrintPlanData({
      pet: basePet,
      foods: [food("dry", 3500)],
      weightLogs: [],
      generatedDate: "2026-06-04",
    });

    expect(data.dryLine.configured).toBe(true);
    expect(data.dryLine.grams).toBeGreaterThan(0);
    expect(data.wetLine.planned).toBe(true);
    expect(data.wetLine.configured).toBe(false);
    expect(data.wetLine.grams).toBeNull();
  });

  it("falls back to 90% of current weight when idealWeightKg is null", () => {
    const petWithoutTarget = { ...basePet, idealWeightKg: null };
    const data = buildPrintPlanData({
      pet: petWithoutTarget,
      foods: [food("dry", 3500), food("wet", 900)],
      weightLogs: [],
      generatedDate: "2026-06-04",
    });

    expect(data.targetWeightKg).toBe(5.4); // 6 * 0.9 = 5.4
    expect(data.dailyChecks.length).toBeGreaterThan(14);
    expect(data.weeklyWeights.length).toBeGreaterThanOrEqual(4);
  });
});
