import type { Species } from "../config/nutrition";
import { weightRange } from "../config/nutrition";
import WheelPicker from "./WheelPicker";

export interface DecimalWheelPickerProps {
  species: Species;
  value: number;
  onChange: (value: number) => void;
  "aria-label": string;
}

function splitWeight(value: number, max: number) {
  const clamped = Math.min(max, Math.max(0, value));
  const intPart = Math.floor(clamped);
  const decPart = Math.round((clamped - intPart) * 10);
  return { intPart, decPart };
}

export default function DecimalWheelPicker({
  species,
  value,
  onChange,
  "aria-label": ariaLabel,
}: DecimalWheelPickerProps) {
  const { min, max } = weightRange[species];
  const maxInt = Math.floor(max);
  const { intPart, decPart } = splitWeight(value, max);

  const handleInt = (int: number) => {
    const next = Math.min(max, int + decPart / 10);
    onChange(Math.round(next * 10) / 10);
  };

  const handleDec = (dec: number) => {
    const next = Math.min(max, intPart + dec / 10);
    onChange(Math.round(next * 10) / 10);
  };

  return (
    <div
      className="relative flex items-stretch justify-center gap-2.5"
      role="group"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-accent/10"
        aria-hidden
      />
      <WheelPicker
        min={min}
        max={maxInt}
        value={intPart}
        onChange={handleInt}
        showSelectionBand={false}
        aria-label={`${ariaLabel}整数位`}
      />
      <span className="self-center text-[22px] font-bold text-ink">.</span>
      <WheelPicker
        min={0}
        max={9}
        value={decPart}
        onChange={handleDec}
        showSelectionBand={false}
        aria-label={`${ariaLabel}小数位`}
      />
      <span className="self-center text-[15px] font-medium text-muted">kg</span>
    </div>
  );
}
