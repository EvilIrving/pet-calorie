import { describe, expect, it } from "vitest";
import { formatPetAge, lifeStageToMonths, monthsToAgeBand, monthsToLifeStage } from "./age";

describe("monthsToAgeBand", () => {
  it("maps cat months to three bands", () => {
    expect(monthsToAgeBand("cat", 6)).toBe("kitten");
    expect(monthsToAgeBand("cat", 24)).toBe("adult");
    expect(monthsToAgeBand("cat", 100)).toBe("senior");
  });
});

describe("monthsToLifeStage", () => {
  it("uses neutered flag only in adult band", () => {
    expect(monthsToLifeStage("cat", 6, true)).toBe("kitten");
    expect(monthsToLifeStage("cat", 36, true)).toBe("adult_neutered");
    expect(monthsToLifeStage("cat", 36, false)).toBe("adult_intact");
    expect(monthsToLifeStage("cat", 100, false)).toBe("senior");
  });
});

describe("lifeStageToMonths", () => {
  it("round-trips through band mapping", () => {
    const months = lifeStageToMonths("dog", "adult_neutered");
    expect(monthsToAgeBand("dog", months)).toBe("adult");
  });
});

describe("formatPetAge", () => {
  it("formats months and years", () => {
    expect(formatPetAge(8)).toBe("8 个月");
    expect(formatPetAge(24)).toBe("2 岁");
    expect(formatPetAge(27)).toBe("2 岁 3 个月");
  });
});
