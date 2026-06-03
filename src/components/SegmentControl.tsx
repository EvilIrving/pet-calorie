export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
  /** 选项文案较长时使用，缩小字号并收紧内边距 */
  compact?: boolean;
}

export default function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  compact = false,
}: SegmentControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex rounded-xl bg-[#f0f2f5] p-0.5">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`min-h-11 flex-1 rounded-lg py-2 font-medium transition-colors touch-manipulation ${
              compact ? "px-1.5 text-[11px] leading-snug sm:px-2 sm:text-xs" : "px-3 text-sm"
            } ${selected ? "bg-card text-ink shadow-sm" : "text-muted active:bg-card/60"}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
