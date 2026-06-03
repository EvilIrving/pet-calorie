import { ArrowLeft24Regular } from "@fluentui/react-icons";
import PetProfileForm, { type PetProfileFormValues } from "../components/PetProfileForm";
import { useCatStore } from "../stores/catStore";

export default function PetOnboarding({ onCancel }: { onCancel?: () => void }) {
  const activePet = useCatStore((s) => s.activePet);
  const cats = useCatStore((s) => s.cats);
  const update = useCatStore((s) => s.update);

  if (!activePet) {
    return <p className="py-10 text-center text-sm text-muted">加载中…</p>;
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
            返回
          </button>
        ) : null}
        <h1 className="text-lg font-semibold text-ink">{isNewPet ? "新增宠物" : "欢迎"}</h1>
        <p className="mt-1 text-sm text-muted">
          {isNewPet
            ? "为新宠物填写基本信息，用于热量与减肥计算"
            : "先填写宠物信息，用于热量与减肥计算"}
        </p>
      </header>
      <PetProfileForm initial={activePet} submitLabel="开始使用" onSubmit={handleSubmit} />
    </div>
  );
}
