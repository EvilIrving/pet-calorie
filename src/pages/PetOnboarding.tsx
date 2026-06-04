import { ArrowLeft24Regular } from "@fluentui/react-icons";
import PetProfileForm, { type PetProfileFormValues } from "../components/PetProfileForm";
import { useI18n } from "../i18n";
import { useCatStore } from "../stores/catStore";

export default function PetOnboarding({ onCancel }: { onCancel?: () => void }) {
  const { t } = useI18n();
  const activePet = useCatStore((s) => s.activePet);
  const cats = useCatStore((s) => s.cats);
  const update = useCatStore((s) => s.update);

  if (!activePet) {
    return <p className="py-10 text-center text-sm text-muted">{t("loading")}</p>;
  }

  const isNewPet = cats.length > 1;

  const handleSubmit = async (values: PetProfileFormValues) => {
    await update({ ...values, onboardingDone: true });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-4">
        {isNewPet && onCancel ? (
          <button
            type="button"
            className="mb-2 flex items-center gap-1 text-sm text-muted touch-manipulation min-h-11"
            onClick={onCancel}
          >
            <ArrowLeft24Regular className="size-4" aria-hidden />
            {t("back")}
          </button>
        ) : null}
        <h1 className="text-lg font-semibold text-ink">{isNewPet ? t("newPet") : t("welcome")}</h1>
        <p className="mt-1 text-sm text-muted">
          {isNewPet ? t("newPetSubtitle") : t("onboardingSubtitle")}
        </p>
      </header>
      <PetProfileForm initial={activePet} submitLabel={t("startUsing")} onSubmit={handleSubmit} />
    </div>
  );
}
