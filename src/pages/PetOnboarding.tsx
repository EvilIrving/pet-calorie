import PetProfileForm, { type PetProfileFormValues } from "../components/PetProfileForm";
import { useCatStore } from "../stores/catStore";

export default function PetOnboarding() {
  const cat = useCatStore((s) => s.cat);
  const update = useCatStore((s) => s.update);

  if (!cat) {
    return <p className="py-10 text-center text-sm text-muted">加载中…</p>;
  }

  const handleSubmit = async (values: PetProfileFormValues) => {
    await update({ ...values, onboardingDone: true });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold text-ink">欢迎</h1>
        <p className="mt-1 text-sm text-muted">先填写宠物信息，用于热量与减肥计算</p>
      </header>
      <PetProfileForm initial={cat} submitLabel="开始使用" onSubmit={handleSubmit} />
    </div>
  );
}
