import { describe, expect, it } from "vitest";
import {
  calcDailyGrams,
  calcDietDailyKcal,
  calcKcalFromMacros,
  calcMacroAnalysis,
  calcMer,
  calcRer,
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
  it("derives kcal per 100g from guaranteed analysis", () => {
    const kcal = calcKcalFromMacros({
      protein: 30,
      fat: 15,
      ash: 8,
      fiber: 4,
      moisture: 10,
    });
    expect(kcal).toBeGreaterThan(0);
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
    expect(analysis.dryMatterPercent).toBeGreaterThan(0);
    expect(analysis.nfePercentOnDryMatter).toBeGreaterThan(0);
    expect(analysis.kcalPerKg).toBe(calcKcalFromMacros(macros) * 10);
  });
});

describe("calcDailyGrams", () => {
  it("converts kcal target to grams", () => {
    expect(calcDailyGrams(210, 3500)).toBeCloseTo(60, 0);
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

  it("applies species min RER floor for dog intensive", () => {
    const rer = calcRer(12);
    const raw = rer * 0.65;
    const floor = rer * 0.6;
    expect(calcDietDailyKcal(12, 8, "dog")).toBeCloseTo(Math.max(raw, floor), 1);
  });
});
