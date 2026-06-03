export interface BorderedButtonGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
}

export default function BorderedButtonGroup<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: BorderedButtonGroupProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-2 overflow-hidden rounded-xl border border-line"
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`min-h-11 px-3 py-2 text-sm font-medium transition-colors touch-manipulation ${
              i > 0 ? "border-l border-line" : ""
            } ${selected ? "bg-accent/10 text-accent" : "bg-card text-muted active:bg-surface"}`}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
