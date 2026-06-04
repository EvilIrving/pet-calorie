import { useEffect, useMemo, useState } from "react";
import FoodDensitySection from "../components/FoodDensitySection";
import MixedRatioControl from "../components/MixedRatioControl";
import SegmentControl from "../components/SegmentControl";
import { defaultDryKcalPerKg, defaultWetKcalPerKg } from "../config/nutrition";
import { useI18n } from "../i18n";
import {
  calcDailyGrams,
  calcKcalFromMacros,
  calcMer,
  calcMixedFeedingPlan,
  type MacroPercents,
} from "../lib/calculator";
import type { FeedingMode } from "../lib/feeding";
import { useCatStore } from "../stores/catStore";
import { useFoodStore } from "../stores/foodStore";

type FoodType = "dry" | "wet";
type InputMode = "kcal" | "macros";
type FeedingPlanMode = Exclude<FeedingMode, "none">;
type SaveFoodStatus = "idle" | "saving" | "saved" | "error";

const defaultMacros: MacroPercents = {
  protein: 30,
  fat: 15,
  ash: 8,
  fiber: 4,
  moisture: 10,
};

export default function CalcTab() {
  const { t } = useI18n();
  const activePet = useCatStore((s) => s.activePet);
  const updateCat = useCatStore((s) => s.update);
  const foods = useFoodStore((s) => s.foods);
  const saveFood = useFoodStore((s) => s.save);

  const [foodType, setFoodType] = useState<FoodType>("dry");
  const [inputMode, setInputMode] = useState<InputMode>("kcal");
  const [dryKcalPerKg, setDryKcalPerKg] = useState(defaultDryKcalPerKg);
  const [wetKcalPerKg, setWetKcalPerKg] = useState(defaultWetKcalPerKg);
  const [macros, setMacros] = useState<MacroPercents>(defaultMacros);
  const [saveFoodStatus, setSaveFoodStatus] = useState<SaveFoodStatus>("idle");

  const feedingMode: FeedingPlanMode =
    activePet?.feedingMode === "mixed" ? "mixed" : activePet?.feedingMode === "wet" ? "wet" : "dry";

  useEffect(() => {
    if (saveFoodStatus !== "saved" && saveFoodStatus !== "error") return;
    const timer = window.setTimeout(() => setSaveFoodStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [saveFoodStatus]);

  useEffect(() => {
    if (feedingMode === "dry" || feedingMode === "wet") {
      setFoodType(feedingMode);
    }
  }, [feedingMode]);

  useEffect(() => {
    const dryFood = foods.find((food) => food.foodType === "dry" && food.kcalPerKg > 0);
    const wetFood = foods.find((food) => food.foodType === "wet" && food.kcalPerKg > 0);
    if (dryFood) setDryKcalPerKg(dryFood.kcalPerKg);
    if (wetFood) setWetKcalPerKg(wetFood.kcalPerKg);
  }, [foods]);

  const kcalPerKg = foodType === "dry" ? dryKcalPerKg : wetKcalPerKg;
  const effectiveKcalPerKg = useMemo(() => {
    if (inputMode === "kcal") return kcalPerKg;
    return calcKcalFromMacros(macros) * 10;
  }, [inputMode, kcalPerKg, macros]);

  const dailyKcal = activePet
    ? calcMer(activePet.weightKg, activePet.lifeStage, activePet.activity, activePet.species)
    : 0;
  const dailyGrams = calcDailyGrams(dailyKcal, effectiveKcalPerKg);
  const mixedDryRatio = activePet?.mixedDryRatio ?? 0.5;
  const mixedPlan = calcMixedFeedingPlan(dailyKcal, dryKcalPerKg, wetKcalPerKg, mixedDryRatio);

  const handleFoodTypeChange = (type: FoodType) => {
    setFoodType(type);
  };

  const handleFeedingModeChange = (mode: FeedingPlanMode) => {
    void updateCat({ feedingMode: mode });
    if (mode === "dry" || mode === "wet") {
      handleFoodTypeChange(mode);
    }
  };

  const handleSaveFood = async () => {
    if (!activePet) return;
    setSaveFoodStatus("saving");
    try {
      if (feedingMode === "mixed") {
        await saveFood(activePet.id, {
          name: `${t("dryFood")} ${Math.round(dryKcalPerKg)}`,
          foodType: "dry",
          kcalPerKg: dryKcalPerKg,
          macros: null,
        });
        await saveFood(activePet.id, {
          name: `${t("wetFood")} ${Math.round(wetKcalPerKg)}`,
          foodType: "wet",
          kcalPerKg: wetKcalPerKg,
          macros: null,
        });
        setSaveFoodStatus("saved");
        return;
      }
      await saveFood(activePet.id, {
        name: `${foodType === "dry" ? t("dryFood") : t("wetFood")} ${Math.round(effectiveKcalPerKg)}`,
        foodType,
        kcalPerKg: effectiveKcalPerKg,
        macros: inputMode === "macros" ? macros : null,
      });
      setSaveFoodStatus("saved");
    } catch {
      setSaveFoodStatus("error");
    }
  };

  if (!activePet) {
    return <p className="py-8 text-center text-sm text-muted">{t("loading")}</p>;
  }

  const savedFoodLabel = activePet.species === "dog" ? t("dogFood") : t("catFood");
  const saveButtonLabel =
    saveFoodStatus === "saving"
      ? t("saving")
      : saveFoodStatus === "saved"
        ? t("saved")
        : saveFoodStatus === "error"
          ? t("saveFailed")
          : feedingMode === "mixed"
            ? t("saveMixedConfig")
            : t("saveCommonFood", { food: savedFoodLabel });

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-card bg-card p-4 shadow-sm">
        <p className="mb-2 text-sm text-muted">{t("feedingMode")}</p>
        <SegmentControl
          aria-label={t("feedingMode")}
          options={[
            { value: "dry", label: t("dry") },
            { value: "wet", label: t("wet") },
            { value: "mixed", label: t("mixed") },
          ]}
          value={feedingMode}
          onChange={handleFeedingModeChange}
        />
      </section>

      <FoodDensitySection
        feedingMode={feedingMode}
        foodType={foodType}
        inputMode={inputMode}
        kcalPerKg={kcalPerKg}
        dryKcalPerKg={dryKcalPerKg}
        wetKcalPerKg={wetKcalPerKg}
        macros={macros}
        onInputModeChange={setInputMode}
        onDryKcalPerKgChange={setDryKcalPerKg}
        onWetKcalPerKgChange={setWetKcalPerKg}
        onMacrosChange={setMacros}
      />

      {feedingMode === "mixed" ? (
        <MixedRatioControl
          dryRatio={mixedDryRatio}
          onChange={(dryRatio) => void updateCat({ mixedDryRatio: dryRatio })}
        />
      ) : null}

      <section className="rounded-card bg-accent/10 p-4 text-center">
        <p className="text-sm text-muted">{t("dailyAllowance")}</p>
        {feedingMode === "mixed" ? (
          <div className="mt-1.5 flex flex-col gap-0.5 text-left">
            <p className="flex justify-between text-base text-ink">
              <span className="text-muted">{t("dryFood")}</span>
              <span className="font-semibold tabular-nums">{Math.round(mixedPlan.dryGrams)} g</span>
            </p>
            <p className="flex justify-between text-base text-ink">
              <span className="text-muted">{t("wetFood")}</span>
              <span className="font-semibold tabular-nums">{Math.round(mixedPlan.wetGrams)} g</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("calorieSplit", {
                dry: Math.round(mixedPlan.dryKcal),
                wet: Math.round(mixedPlan.wetKcal),
              })}
            </p>
          </div>
        ) : (
          <p className="mt-0.5 text-3xl font-bold text-ink tabular-nums">
            {Math.round(dailyGrams)} g
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted">
          {t("maintenanceKcal", { kcal: Math.round(dailyKcal) })}
        </p>
      </section>

      <button
        type="button"
        className="min-h-11 w-full rounded-xl border border-accent bg-card px-3 py-2 text-sm font-medium text-accent touch-manipulation active:bg-accent/10"
        onClick={handleSaveFood}
        disabled={saveFoodStatus === "saving"}
        aria-live="polite"
      >
        {saveButtonLabel}
      </button>
    </div>
  );
}
