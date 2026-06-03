import type { Species } from "../config/nutrition";
import { weightRange } from "../config/nutrition";
import WeightRulerPicker from "./WeightRulerPicker";

export interface DecimalWheelPickerProps {
  species: Species;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
}

export default function DecimalWheelPicker({
  species,
  value,
  onChange,
  "aria-label": ariaLabel,
}: DecimalWheelPickerProps) {
  const range = weightRange[species];
  const clamped = Math.min(range.max, Math.max(range.min, value));

  return (
    <WeightRulerPicker
      species={species}
      value={clamped}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}
