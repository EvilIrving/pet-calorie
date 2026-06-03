import { describe, expect, it } from "vitest";
import {
  calcDailyGrams,
  calcDietCalorieDeficitRange,
  calcDietDailyKcalRange,
  calcKcalFromMacros,
  calcMacroAnalysis,
  calcMer,
  calcMixedFeedingPlan,
  calcRer,
  calcSafeWeightLossPlan,
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

  it("uses fixed weekly weight loss range for dogs and clamps at ideal weight", () => {
    const plan = calcSafeWeightLossPlan(20, 19.7, 2, "dog");
    expect(plan.rateMin).toBe(0.005);
    expect(plan.rateMax).toBe(0.01);
    expect(plan.targetMinKg).toBeCloseTo(19.7, 2);
    expect(plan.targetMaxKg).toBeCloseTo(19.8, 2);
  });
});

describe("diet target calories", () => {
  it("calculates the daily deficit range from weekly weight loss", () => {
    const range = calcDietCalorieDeficitRange(5.5, 5.445, 5.4725);
    expect(range.min).toBeCloseTo(30.25, 2);
    expect(range.max).toBeCloseTo(60.5, 2);
  });

  it("subtracts the deficit range from MER", () => {
    const range = calcDietDailyKcalRange(300, 5.5, 5.445, 5.4725);
    expect(range.min).toBeCloseTo(239.5, 2);
    expect(range.max).toBeCloseTo(269.75, 2);
  });
});
