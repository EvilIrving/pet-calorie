export const atwater = {
  protein: 3.5,
  fat: 8.5,
  nfe: 3.5,
} as const;

export type Species = "cat" | "dog";

export const lifeFactor = {
  cat: {
    kitten: 2.0,
    adult_neutered: 1.2,
    adult_intact: 1.4,
    senior: 1.1,
  },
  dog: {
    kitten: 2.0,
    adult_neutered: 1.6,
    adult_intact: 1.8,
    senior: 1.4,
  },
} as const;

export type LifeStage = keyof (typeof lifeFactor)["cat"];

export const lifeStageLabels: Record<Species, Record<LifeStage, string>> = {
  cat: {
    kitten: "幼猫",
    adult_neutered: "成年·已绝育",
    adult_intact: "成年·未绝育",
    senior: "老年",
  },
  dog: {
    kitten: "幼犬",
    adult_neutered: "成年·已绝育",
    adult_intact: "成年·未绝育",
    senior: "老年",
  },
};

export const speciesLabels: Record<Species, string> = {
  cat: "猫",
  dog: "狗",
};

/** 年龄段（进度条三区） */
export type AgeBand = "kitten" | "adult" | "senior";

/** 宠物年龄进度条配置（月龄边界，按物种） */
export const petAgeConfig = {
  cat: {
    minMonths: 2,
    maxMonths: 240,
    kittenEndMonths: 12,
    seniorStartMonths: 84,
    bandLabels: {
      kitten: "幼年",
      adult: "成年",
      senior: "老年",
    } as const,
  },
  dog: {
    minMonths: 2,
    maxMonths: 180,
    kittenEndMonths: 12,
    seniorStartMonths: 96,
    bandLabels: {
      kitten: "幼年",
      adult: "成年",
      senior: "老年",
    } as const,
  },
} as const;

export const weightRange = {
  cat: { min: 1, max: 20, defaultKg: 4.2 },
  dog: { min: 1, max: 80, defaultKg: 12 },
} as const;

export const defaultPetName: Record<Species, string> = {
  cat: "小橘",
  dog: "旺财",
};

export type ActivityLevel = "low" | "moderate" | "high";

/** 活动系数（× RER），狗 high 段上调以覆盖运动犬/工作犬 */
export const activityMultiplier = {
  low: 1.0,
  moderate: 1.2,
  high: 1.4,
} as const;

/**
 * 活动量按钮文案（括号内为日常活动参考，非 MER 公式本身）。
 * 猫：AAHA 建议每日 2–3 次、每次 10–15 分钟互动玩耍（https://www.aaha.org/resources/how-often-should-you-play-with-your-cat/）；
 *     AAHA/AAFP 2021 猫生命阶段指南引用研究：每日 3 次×10–15 分钟有助控重。
 * 狗：AAHA 减重指南建议健康犬每日散步至少 30 分钟，并按品种/体能调整（https://www.aaha.org/resources/slim-down-with-your-hound-how-to-help-your-dog-lose-weight/）；
 *     2019 AAHA 犬生命阶段指南强调运动量需按年龄、品种、性情个体化。
 */
export const activityLabelsBySpecies: Record<Species, Record<ActivityLevel, string>> = {
  cat: {
    low: "低（<15 min）",
    moderate: "中（约 20–30 min）",
    high: "高（约 30–45 min）",
  },
  dog: {
    low: "低（<30 min）",
    moderate: "中（约 30–60 min）",
    high: "高（60+ min）",
  },
};

/** 减肥目标 = RER × ratio（按物种与阶段） */
export const dietPhases = {
  cat: {
    transition: { weeks: [1, 2] as const, ratio: 1.0 },
    main: { weeks: [3, 6] as const, ratio: 0.85 },
    intensive: { weeks: [7, Number.POSITIVE_INFINITY] as const, ratio: 0.8 },
  },
  dog: {
    transition: { weeks: [1, 2] as const, ratio: 1.0 },
    main: { weeks: [3, 6] as const, ratio: 0.8 },
    intensive: { weeks: [7, Number.POSITIVE_INFINITY] as const, ratio: 0.65 },
  },
} as const;

export type DietPhaseKey = keyof (typeof dietPhases)["cat"];

/** RER 下限保护（防限饲过度，按物种） */
export const minRerRatio: Record<Species, number> = {
  cat: 0.8,
  dog: 0.6,
};

/** 干粮默认热量密度 kcal/kg */
export const defaultDryKcalPerKg = 3500;

/** 湿粮默认热量密度 kcal/kg */
export const defaultWetKcalPerKg = 900;
