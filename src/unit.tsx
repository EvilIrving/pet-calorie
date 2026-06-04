import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type WeightUnit = "kg" | "lb";

interface UnitContextValue {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  unitLabel: string;
  toDisplayWeight: (kg: number) => number;
  fromDisplayWeight: (value: number) => number;
  formatWeight: (kg: number, decimals?: number) => string;
}

const UNIT_KEY = "react-cat:weightUnit";
const KG_TO_LB = 2.2046226218;

const UnitContext = createContext<UnitContextValue | null>(null);

function detectWeightUnit(): WeightUnit {
  try {
    const stored = localStorage.getItem(UNIT_KEY);
    if (stored === "kg" || stored === "lb") return stored;
  } catch {
    // ignore
  }
  return "kg";
}

export function UnitProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(detectWeightUnit);

  useEffect(() => {
    localStorage.setItem(UNIT_KEY, weightUnit);
  }, [weightUnit]);

  const value = useMemo<UnitContextValue>(() => {
    const unitLabel = weightUnit;
    const toDisplayWeight = (kg: number) => (weightUnit === "lb" ? kg * KG_TO_LB : kg);
    const fromDisplayWeight = (displayValue: number) =>
      weightUnit === "lb" ? displayValue / KG_TO_LB : displayValue;

    return {
      weightUnit,
      setWeightUnit,
      unitLabel,
      toDisplayWeight,
      fromDisplayWeight,
      formatWeight: (kg, decimals = 1) => `${toDisplayWeight(kg).toFixed(decimals)} ${unitLabel}`,
    };
  }, [weightUnit]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit(): UnitContextValue {
  const value = useContext(UnitContext);
  if (!value) throw new Error("useUnit must be used inside UnitProvider");
  return value;
}
