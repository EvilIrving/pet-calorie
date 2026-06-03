import { useMemo, useState } from "react";
import BorderedButtonGroup from "../components/BorderedButtonGroup";
import CatInfoBar from "../components/CatInfoBar";
import MacroStepperForm from "../components/MacroStepperForm";
import PetSettingsSheet from "../components/PetSettingsSheet";
import SegmentControl from "../components/SegmentControl";
import Stepper from "../components/Stepper";
import { defaultDryKcalPerKg, defaultWetKcalPerKg } from "../config/nutrition";
import { calcDailyGrams, calcKcalFromMacros, calcMer, type MacroPercents } from "../lib/calculator";
import { useCatStore } from "../stores/catStore";
import { useFoodStore } from "../stores/foodStore";

type FoodType = "dry" | "wet";
type InputMode = "kcal" | "macros";

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
  const saveFood = useFoodStore((s) => s.save);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [foodType, setFoodType] = useState<FoodType>("dry");
  const [inputMode, setInputMode] = useState<InputMode>("kcal");
  const [kcalPerKg, setKcalPerKg] = useState(defaultDryKcalPerKg);
  const [macros, setMacros] = useState<MacroPercents>(defaultMacros);

  const effectiveKcalPerKg = useMemo(() => {
    if (inputMode === "kcal") return kcalPerKg;
    return calcKcalFromMacros(macros) * 10;
  }, [inputMode, kcalPerKg, macros]);

  const dailyKcal = cat ? calcMer(cat.weightKg, cat.lifeStage, cat.activity, cat.species) : 0;
  const dailyGrams = calcDailyGrams(dailyKcal, effectiveKcalPerKg);
  const tablespoons = dailyGrams > 0 ? (dailyGrams / 15).toFixed(1) : "—";

  const handleFoodTypeChange = (type: FoodType) => {
    setFoodType(type);
    setKcalPerKg(type === "dry" ? defaultDryKcalPerKg : defaultWetKcalPerKg);
  };

  const handleSaveFood = async () => {
    if (!cat) return;
    await saveFood({
      name: `${foodType === "dry" ? "干粮" : "湿粮"} ${Math.round(effectiveKcalPerKg)}`,
      foodType,
      kcalPerKg: effectiveKcalPerKg,
      macros: inputMode === "macros" ? macros : null,
    });
  };

  if (!cat) {
    return <p className="py-12 text-center text-muted">加载中…</p>;
  }

  const savedFoodLabel = cat.species === "dog" ? "狗粮" : "猫粮";

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
        <SegmentControl
          aria-label="食物类型"
          options={[
            { value: "dry", label: "干粮" },
            { value: "wet", label: "湿粮" },
          ]}
          value={foodType}
          onChange={handleFoodTypeChange}
        />
      </section>

      <section className="rounded-card bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm text-muted">热量输入方式</p>
        <BorderedButtonGroup
          aria-label="热量输入方式"
          options={[
            { value: "kcal", label: "kcal/kg" },
            { value: "macros", label: "成分反算" },
          ]}
          value={inputMode}
          onChange={setInputMode}
        />

        <div className="mt-5">
          {inputMode === "kcal" ? (
            <Stepper
              aria-label="热量密度"
              value={kcalPerKg}
              onChange={setKcalPerKg}
              step={50}
              min={500}
              max={6000}
              decimals={0}
              unit="kcal/kg"
              inputMode="numeric"
            />
          ) : (
            <MacroStepperForm macros={macros} onChange={setMacros} />
          )}
        </div>
      </section>

      <section className="rounded-card bg-accent/10 p-6 text-center">
        <p className="text-sm text-muted">每日可喂</p>
        <p className="mt-1 text-4xl font-bold text-ink tabular-nums">{Math.round(dailyGrams)} g</p>
        <p className="mt-1 text-sm text-muted">约合 {tablespoons} 汤匙</p>
        <p className="mt-2 text-xs text-muted">维持热量 {Math.round(dailyKcal)} kcal/天</p>
      </section>

      <button
        type="button"
        className="min-h-11 w-full rounded-2xl border border-accent bg-card px-4 py-3 text-sm font-medium text-accent touch-manipulation active:bg-accent/10"
        onClick={handleSaveFood}
      >
        {`保存为常用${savedFoodLabel}`}
      </button>
    </div>
  );
}
