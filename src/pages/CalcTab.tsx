import { useEffect, useMemo, useState } from "react";
import CatInfoBar from "../components/CatInfoBar";
import FoodDensitySection from "../components/FoodDensitySection";
import MixedRatioControl from "../components/MixedRatioControl";
import PetSettingsSheet from "../components/PetSettingsSheet";
import SegmentControl from "../components/SegmentControl";
import { defaultDryKcalPerKg, defaultWetKcalPerKg } from "../config/nutrition";
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
  const cat = useCatStore((s) => s.cat);
  const updateCat = useCatStore((s) => s.update);
  const foods = useFoodStore((s) => s.foods);
  const saveFood = useFoodStore((s) => s.save);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [foodType, setFoodType] = useState<FoodType>("dry");
  const [inputMode, setInputMode] = useState<InputMode>("kcal");
  const [dryKcalPerKg, setDryKcalPerKg] = useState(defaultDryKcalPerKg);
  const [wetKcalPerKg, setWetKcalPerKg] = useState(defaultWetKcalPerKg);
  const [macros, setMacros] = useState<MacroPercents>(defaultMacros);
  const [saveFoodStatus, setSaveFoodStatus] = useState<SaveFoodStatus>("idle");

  const feedingMode: FeedingPlanMode =
    cat?.feedingMode === "mixed" ? "mixed" : cat?.feedingMode === "wet" ? "wet" : "dry";

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

  const dailyKcal = cat ? calcMer(cat.weightKg, cat.lifeStage, cat.activity, cat.species) : 0;
  const dailyGrams = calcDailyGrams(dailyKcal, effectiveKcalPerKg);
  const mixedDryRatio = cat?.mixedDryRatio ?? 0.5;
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
    if (!cat) return;
    setSaveFoodStatus("saving");
    try {
      if (feedingMode === "mixed") {
        await saveFood({
          name: `干粮 ${Math.round(dryKcalPerKg)}`,
          foodType: "dry",
          kcalPerKg: dryKcalPerKg,
          macros: null,
        });
        await saveFood({
          name: `湿粮 ${Math.round(wetKcalPerKg)}`,
          foodType: "wet",
          kcalPerKg: wetKcalPerKg,
          macros: null,
        });
        setSaveFoodStatus("saved");
        return;
      }
      await saveFood({
        name: `${foodType === "dry" ? "干粮" : "湿粮"} ${Math.round(effectiveKcalPerKg)}`,
        foodType,
        kcalPerKg: effectiveKcalPerKg,
        macros: inputMode === "macros" ? macros : null,
      });
      setSaveFoodStatus("saved");
    } catch {
      setSaveFoodStatus("error");
    }
  };

  if (!cat) {
    return <p className="py-12 text-center text-muted">加载中…</p>;
  }

  const savedFoodLabel = cat.species === "dog" ? "狗粮" : "猫粮";
  const saveButtonLabel =
    saveFoodStatus === "saving"
      ? "保存中…"
      : saveFoodStatus === "saved"
        ? "已保存"
        : saveFoodStatus === "error"
          ? "保存失败，请重试"
          : feedingMode === "mixed"
            ? "保存干湿配置"
            : `保存为常用${savedFoodLabel}`;

  return (
    <div className="flex flex-col gap-4">
      <CatInfoBar
        species={cat.species}
        name={cat.name}
        weightKg={cat.weightKg}
        onSettings={() => setSettingsOpen(true)}
      />

      {settingsOpen ? (
        <PetSettingsSheet
          cat={cat}
          onClose={() => setSettingsOpen(false)}
          onSave={(values) => updateCat(values)}
        />
      ) : null}

      <section className="rounded-card bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm text-muted">喂食模式</p>
        <SegmentControl
          aria-label="喂食模式"
          options={[
            { value: "dry", label: "干粮" },
            { value: "wet", label: "湿粮" },
            { value: "mixed", label: "干湿混合" },
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

      <section className="rounded-card bg-accent/10 p-6 text-center">
        <p className="text-sm text-muted">每日可喂</p>
        {feedingMode === "mixed" ? (
          <div className="mt-2 flex flex-col gap-1 text-left">
            <p className="flex justify-between text-base text-ink">
              <span className="text-muted">干粮</span>
              <span className="font-semibold tabular-nums">{Math.round(mixedPlan.dryGrams)} g</span>
            </p>
            <p className="flex justify-between text-base text-ink">
              <span className="text-muted">湿粮</span>
              <span className="font-semibold tabular-nums">{Math.round(mixedPlan.wetGrams)} g</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              热量分配 {Math.round(mixedPlan.dryKcal)} kcal / {Math.round(mixedPlan.wetKcal)} kcal
            </p>
          </div>
        ) : (
          <p className="mt-1 text-4xl font-bold text-ink tabular-nums">
            {Math.round(dailyGrams)} g
          </p>
        )}
        <p className="mt-2 text-xs text-muted">维持热量 {Math.round(dailyKcal)} kcal/天</p>
      </section>

      <button
        type="button"
        className="min-h-11 w-full rounded-2xl border border-accent bg-card px-4 py-3 text-sm font-medium text-accent touch-manipulation active:bg-accent/10"
        onClick={handleSaveFood}
        disabled={saveFoodStatus === "saving"}
        aria-live="polite"
      >
        {saveButtonLabel}
      </button>
    </div>
  );
}
