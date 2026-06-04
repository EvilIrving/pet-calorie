import { Dismiss24Regular } from "@fluentui/react-icons";
import { useI18n } from "../i18n";
import { useUnit, type WeightUnit } from "../unit";
import LanguageSwitcher from "./LanguageSwitcher";
import SegmentControl from "./SegmentControl";

export interface AppSettingsSheetProps {
  onClose: () => void;
  onOpenAbout: () => void;
}

export default function AppSettingsSheet({ onClose, onOpenAbout }: AppSettingsSheetProps) {
  const { t } = useI18n();
  const { weightUnit, setWeightUnit } = useUnit();

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        aria-label={t("closeSettings")}
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-[min(21rem,88vw)] flex-col bg-[#f5f6f8]/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[-8px_0_32px_rgba(0,0,0,0.12)] backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={t("settings")}
      >
        <header className="flex items-center justify-between pb-2">
          <h2 className="text-base font-semibold text-ink">{t("settings")}</h2>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full touch-manipulation active:bg-surface"
            aria-label={t("closeSettings")}
            onClick={onClose}
          >
            <Dismiss24Regular className="size-6 text-muted" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto py-2">
          <section>
            <p className="mb-2 text-sm text-muted">{t("language")}</p>
            <LanguageSwitcher />
          </section>

          <section>
            <p className="mb-2 text-sm text-muted">{t("displayUnit")}</p>
            <SegmentControl<WeightUnit>
              aria-label={t("displayUnit")}
              options={[
                { value: "kg", label: t("kilogram") },
                { value: "lb", label: t("pound") },
              ]}
              value={weightUnit}
              onChange={setWeightUnit}
            />
          </section>

          <button
            type="button"
            className="min-h-11 w-full rounded-xl bg-card px-3 py-2 text-left text-sm font-medium text-ink shadow-sm touch-manipulation active:bg-surface"
            onClick={() => {
              onClose();
              onOpenAbout();
            }}
          >
            {t("about")}
          </button>
        </div>
      </aside>
    </div>
  );
}
