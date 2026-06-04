import { type Locale, useI18n } from "../i18n";

const options: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className="grid grid-cols-3 rounded-full bg-surface p-0.5"
      role="group"
      aria-label={t("language")}
    >
      {options.map((option) => {
        const selected = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            className={`min-h-9 min-w-16 rounded-full px-2 text-xs font-medium whitespace-nowrap touch-manipulation ${
              selected ? "bg-card text-ink shadow-sm" : "text-muted active:bg-card/60"
            }`}
            onClick={() => setLocale(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
