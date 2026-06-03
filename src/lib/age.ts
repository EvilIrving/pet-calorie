import { type AgeBand, type LifeStage, petAgeConfig, type Species } from "../config/nutrition";

export function clampAgeMonths(species: Species, months: number): number {
  const { minMonths, maxMonths } = petAgeConfig[species];
  return Math.min(maxMonths, Math.max(minMonths, Math.round(months)));
}

export function monthsToAgeBand(species: Species, months: number): AgeBand {
  const { kittenEndMonths, seniorStartMonths } = petAgeConfig[species];
  const m = clampAgeMonths(species, months);
  if (m < kittenEndMonths) return "kitten";
  if (m >= seniorStartMonths) return "senior";
  return "adult";
}

export function monthsToLifeStage(species: Species, months: number, neutered: boolean): LifeStage {
  const band = monthsToAgeBand(species, months);
  if (band === "kitten") return "kitten";
  if (band === "senior") return "senior";
  return neutered ? "adult_neutered" : "adult_intact";
}

export function lifeStageToMonths(species: Species, lifeStage: LifeStage): number {
  const cfg = petAgeConfig[species];
  switch (lifeStage) {
    case "kitten":
      return Math.round(cfg.kittenEndMonths / 2);
    case "senior":
      return cfg.seniorStartMonths + 24;
    default:
      return Math.round((cfg.kittenEndMonths + cfg.seniorStartMonths) / 2);
  }
}

export function getAgeBandSegmentWeights(species: Species): [number, number, number] {
  const { minMonths, maxMonths, kittenEndMonths, seniorStartMonths } = petAgeConfig[species];
  const span = maxMonths - minMonths;
  const kitten = kittenEndMonths - minMonths;
  const adult = seniorStartMonths - kittenEndMonths;
  const senior = maxMonths - seniorStartMonths;
  return [kitten / span, adult / span, senior / span];
}

export function monthsToProgress(species: Species, months: number): number {
  const { minMonths, maxMonths } = petAgeConfig[species];
  const m = clampAgeMonths(species, months);
  return (m - minMonths) / (maxMonths - minMonths);
}

export function progressToMonths(species: Species, progress: number): number {
  const { minMonths, maxMonths } = petAgeConfig[species];
  const p = Math.min(1, Math.max(0, progress));
  return clampAgeMonths(species, minMonths + p * (maxMonths - minMonths));
}

export function formatPetAge(months: number): string {
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} 岁`;
  return `${years} 岁 ${rem} 个月`;
}
