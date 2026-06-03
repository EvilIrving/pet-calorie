import { describe, expect, it } from "vitest";
import {
  calcDailyGrams,
  calcDietDailyKcal,
  calcKcalFromMacros,
  calcMacroAnalysis,
  calcMer,
  calcMixedFeedingPlan,
  calcRer,
  calcSafeWeightLossPlan,
  getDietPhaseKey,
  getDietPhaseRatio,
} from "./calculator";

describe("calcRer", () => {
  it("returns 0 for non-positive weight", () => {
    expect(calcRer(0)).toBe(0);
  });

  it("computes RER for 4.2kg cat", () => {
    const rer = calcRer(4.2);
    expect(rer).toBeCloseTo(70 * 4.2 ** 0.75, 1);
  });
});

describe("calcMer", () => {
  it("applies life and activity factors for cats", () => {
    const mer = calcMer(4.2, "adult_neutered", "low", "cat");
    expect(mer).toBeCloseTo(calcRer(4.2) * 1.2, 1);
  });

  it("applies higher activity multiplier for moderate", () => {
    const mer = calcMer(4.2, "adult_neutered", "moderate", "cat");
    expect(mer).toBeCloseTo(calcRer(4.2) * 1.2 * 1.2, 1);
  });

  it("uses dog-specific life factors", () => {
    const mer = calcMer(12, "adult_neutered", "low", "dog");
    expect(mer).toBeCloseTo(calcRer(12) * 1.6, 1);
  });
});

describe("calcKcalFromMacros", () => {
  it("derives AAFCO modified Atwater kcal per 100g from guaranteed analysis", () => {
    const kcal = calcKcalFromMacros({
      protein: 30,
      fat: 15,
      ash: 8,
      fiber: 4,
      moisture: 10,
    });
    expect(kcal).toBeCloseTo(348, 1);
  });
});

describe("calcMacroAnalysis", () => {
  it("returns NFE and kcal/kg in real time", () => {
    const macros = {
      protein: 30,
      fat: 15,
      ash: 8,
      fiber: 4,
      moisture: 10,
    };
    const analysis = calcMacroAnalysis(macros);
    expect(analysis.dryMatterPercent).toBeCloseTo(90, 1);
    expect(analysis.nfePercentAsFed).toBeCloseTo(33, 1);
    expect(analysis.nfePercentOnDryMatter).toBeCloseTo(36.67, 2);
    expect(analysis.kcalPerKg).toBe(calcKcalFromMacros(macros) * 10);
  });
});

describe("calcDailyGrams", () => {
  it("converts kcal target to grams", () => {
    expect(calcDailyGrams(210, 3500)).toBeCloseTo(60, 0);
  });
});

describe("calcMixedFeedingPlan", () => {
  it("splits mixed feeding by kcal ratio instead of gram ratio", () => {
    const plan = calcMixedFeedingPlan(200, 3500, 900, 0.5);
    expect(plan.dryKcal).toBeCloseTo(100);
    expect(plan.wetKcal).toBeCloseTo(100);
    expect(plan.dryGrams).toBeCloseTo(28.57, 2);
    expect(plan.wetGrams).toBeCloseTo(111.11, 2);
  });

  it("clamps invalid ratios and ignores invalid density", () => {
    const plan = calcMixedFeedingPlan(200, 0, 1000, 1.5);
    expect(plan.dryRatio).toBe(1);
    expect(plan.wetRatio).toBe(0);
    expect(plan.dryGrams).toBe(0);
    expect(plan.wetGrams).toBe(0);
  });
});

describe("calcSafeWeightLossPlan", () => {
  it("uses cat safe weekly weight loss range", () => {
    const plan = calcSafeWeightLossPlan(6, 5, 1, "cat");
    expect(plan.rateMin).toBe(0.005);
    expect(plan.rateMax).toBe(0.01);
    expect(plan.targetMinKg).toBeCloseTo(5.94, 2);
    expect(plan.targetMaxKg).toBeCloseTo(5.97, 2);
    expect(plan.targetWeightKg).toBeCloseTo(plan.targetMaxKg, 2);
  });

  it("uses dog safe weekly weight loss range and clamps at ideal weight", () => {
    const plan = calcSafeWeightLossPlan(20, 19.7, 2, "dog");
    expect(plan.rateMin).toBe(0.01);
    expect(plan.rateMax).toBe(0.02);
    expect(plan.targetMinKg).toBeCloseTo(19.7, 2);
    expect(plan.targetMaxKg).toBeCloseTo(19.7, 2);
  });
});

describe("diet phase", () => {
  it("maps weeks to phases", () => {
    expect(getDietPhaseKey(1)).toBe("transition");
    expect(getDietPhaseKey(4)).toBe("main");
    expect(getDietPhaseKey(8)).toBe("intensive");
  });

  it("uses species-specific diet ratios", () => {
    expect(getDietPhaseRatio(1, "cat")).toBe(1.0);
    expect(getDietPhaseRatio(4, "cat")).toBe(0.85);
    expect(getDietPhaseRatio(8, "cat")).toBe(0.8);
    expect(getDietPhaseRatio(8, "dog")).toBe(0.65);
  });

  it("anchors diet kcal to RER × ratio for cat transition", () => {
    const rer = calcRer(4.2);
    expect(calcDietDailyKcal(4.2, 1, "cat")).toBeCloseTo(rer * 1.0, 1);
  });

  it("uses ideal weight RER when present for weight loss targets", () => {
    const idealRer = calcRer(4.8);
    expect(calcDietDailyKcal(6, 4, "cat", 4.8)).toBeCloseTo(idealRer * 0.85, 1);
  });

  it("applies species min RER floor for dog intensive", () => {
    const rer = calcRer(12);
    const raw = rer * 0.65;
    const floor = rer * 0.6;
    expect(calcDietDailyKcal(12, 8, "dog")).toBeCloseTo(Math.max(raw, floor), 1);
  });
});
