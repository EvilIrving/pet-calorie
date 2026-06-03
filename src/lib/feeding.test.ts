import { describe, expect, it } from "vitest";
import {
  calcFeedingKcal,
  deriveFeedingMode,
  isFoodConfiguredForMode,
  summarizeFeeding,
} from "./feeding";

describe("deriveFeedingMode", () => {
  it("supports dry only, wet only, mixed, and unconfigured modes", () => {
    expect(deriveFeedingMode(true, false)).toBe("dry");
    expect(deriveFeedingMode(false, true)).toBe("wet");
    expect(deriveFeedingMode(true, true)).toBe("mixed");
    expect(deriveFeedingMode(false, false)).toBe("none");
  });
});

describe("isFoodConfiguredForMode", () => {
  const dryOnly = [{ foodType: "dry" as const, kcalPerKg: 3500 }];
  const wetOnly = [{ foodType: "wet" as const, kcalPerKg: 900 }];
  const both = [...dryOnly, ...wetOnly];

  it("requires density matching the active feeding mode", () => {
    expect(isFoodConfiguredForMode("dry", dryOnly)).toBe(true);
    expect(isFoodConfiguredForMode("dry", wetOnly)).toBe(false);
    expect(isFoodConfiguredForMode("wet", wetOnly)).toBe(true);
    expect(isFoodConfiguredForMode("mixed", both)).toBe(true);
    expect(isFoodConfiguredForMode("mixed", dryOnly)).toBe(false);
  });

  it("ignores zero or missing densities", () => {
    expect(isFoodConfiguredForMode("dry", [{ foodType: "dry", kcalPerKg: 0 }])).toBe(false);
    expect(isFoodConfiguredForMode("dry", [])).toBe(false);
  });
});

describe("calcFeedingKcal", () => {
  it("sums dry and wet grams by density", () => {
    expect(calcFeedingKcal({ dryGrams: 60, wetGrams: 50 }, 3500, 1000)).toBeCloseTo(260);
  });

  it("treats null / zero grams as no intake", () => {
    expect(calcFeedingKcal({ dryGrams: null, wetGrams: 0 }, 3500, 1000)).toBe(0);
  });

  it("ignores a food type without a valid density", () => {
    expect(calcFeedingKcal({ dryGrams: 100, wetGrams: 100 }, 4000, 0)).toBeCloseTo(400);
  });
});

describe("summarizeFeeding", () => {
  it("returns null when there is no log", () => {
    expect(summarizeFeeding(null, 3500, 1000, 200)).toBeNull();
  });

  it("rounds actual kcal and delta against target", () => {
    expect(summarizeFeeding({ dryGrams: 60, wetGrams: null }, 3500, 1000, 200)).toEqual({
      actualKcal: 210,
      deltaKcal: 10,
    });
  });

  it("reports a negative delta when under target", () => {
    expect(summarizeFeeding({ dryGrams: 50, wetGrams: null }, 3500, 1000, 200)).toEqual({
      actualKcal: 175,
      deltaKcal: -25,
    });
  });
});
