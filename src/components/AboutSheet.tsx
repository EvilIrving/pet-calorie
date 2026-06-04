import { useI18n } from "../i18n";
import Sheet from "./Sheet";

export interface AboutSheetProps {
  onClose: () => void;
}

const links = [
  ["sourcePna", "https://petnutritionalliance.org/resources/calorie-calculator/"],
  [
    "sourceAaha",
    "https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/",
  ],
  ["sourceAafco", "https://www.aafco.org/resources/startups/calorie-content/"],
  ["sourceApop", "https://www.petobesityprevention.org/veterinary-der-calculator-1"],
] as const;

export default function AboutSheet({ onClose }: AboutSheetProps) {
  const { t } = useI18n();

  return (
    <Sheet title={t("aboutTitle")} ariaLabel={t("aboutTitle")} onClose={onClose}>
      <div className="max-h-[72dvh] overflow-y-auto pr-1">
        {[
          ["aboutPrivacyTitle", "aboutPrivacyBody"],
          ["aboutSourcesTitle", "aboutSourcesBody"],
          ["aboutCalcTitle", "aboutCalcBody"],
          ["aboutLimitsTitle", "aboutLimitsBody"],
        ].map(([titleKey, bodyKey]) => (
          <details
            key={titleKey}
            className="border-b border-line/60 py-3"
            open={titleKey === "aboutPrivacyTitle"}
          >
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              {t(titleKey)}
            </summary>
            <p className="mt-2 text-sm leading-6 text-muted">{t(bodyKey)}</p>
          </details>
        ))}
        <div className="mt-3 flex flex-col gap-2">
          {links.map(([labelKey, href]) => (
            <a
              key={labelKey}
              className="text-sm font-medium text-accent underline-offset-4 active:underline"
              href={href}
              target="_blank"
              rel="noreferrer"
            >
              {t(labelKey)}
            </a>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
