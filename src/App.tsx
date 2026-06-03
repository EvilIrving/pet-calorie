import { useEffect, useState } from "react";
import BottomTabs, { type AppTab } from "./components/BottomTabs";
import CalcTab from "./pages/CalcTab";
import DietTab from "./pages/DietTab";
import PetOnboarding from "./pages/PetOnboarding";
import { useCatStore } from "./stores/catStore";
import { useFoodStore } from "./stores/foodStore";

export default function App() {
  const [tab, setTab] = useState<AppTab>("calc");
  const loadCat = useCatStore((s) => s.load);
  const loadFoods = useFoodStore((s) => s.load);
  const catLoaded = useCatStore((s) => s.loaded);
  const cat = useCatStore((s) => s.cat);
  const needsOnboarding = catLoaded && cat && !cat.onboardingDone;

  useEffect(() => {
    void loadCat();
    void loadFoods();
  }, [loadCat, loadFoods]);

  if (needsOnboarding) {
    return <PetOnboarding />;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-28">
      <header className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <h1 className="text-lg font-semibold text-ink">宠物热量与减肥</h1>
      </header>

      <main className="px-4 pb-4">
        {!catLoaded ? (
          <p className="py-16 text-center text-muted">加载中…</p>
        ) : tab === "calc" ? (
          <CalcTab />
        ) : (
          <DietTab />
        )}
      </main>

      <BottomTabs active={tab} onChange={setTab} />
    </div>
  );
}
