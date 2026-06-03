import PetProfileForm, { type PetProfileFormValues } from "../components/PetProfileForm";
import { useCatStore } from "../stores/catStore";

export default function PetOnboarding() {
  const cat = useCatStore((s) => s.cat);
  const update = useCatStore((s) => s.update);

  if (!cat) {
    return <p className="py-16 text-center text-muted">加载中…</p>;
  }

  const handleSubmit = async (values: PetProfileFormValues) => {
    await update({ ...values, onboardingDone: true });
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-ink">欢迎</h1>
        <p className="mt-2 text-sm text-muted">先填写宠物信息，用于热量与减肥计算</p>
      </header>
      <PetProfileForm initial={cat} submitLabel="开始使用" onSubmit={handleSubmit} />
    </div>
  );
}
