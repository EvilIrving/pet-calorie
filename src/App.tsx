import { useCallback, useEffect, useState } from "react";
import BottomTabs, { type AppTab } from "./components/BottomTabs";
import CatInfoBar from "./components/CatInfoBar";
import PetSettingsSheet from "./components/PetSettingsSheet";
import PetSwitcher from "./components/PetSwitcher";
import type { CatProfile } from "./db";
import { type FeedingMode, isFoodConfiguredForMode } from "./lib/feeding";
import CalcTab from "./pages/CalcTab";
import DietTab from "./pages/DietTab";
import PetOnboarding from "./pages/PetOnboarding";
import { useCatStore } from "./stores/catStore";
import { useFoodStore } from "./stores/foodStore";

export default function App() {
  const [tab, setTab] = useState<AppTab>("calc");
  const [tabReady, setTabReady] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<CatProfile | null>(null);

  const loadCat = useCatStore((s) => s.load);
  const loadFoods = useFoodStore((s) => s.load);
  const catLoaded = useCatStore((s) => s.loaded);
  const foodsLoaded = useFoodStore((s) => s.loaded);
  const activePet = useCatStore((s) => s.activePet);
  const activePetId = useCatStore((s) => s.activePetId);
  const cats = useCatStore((s) => s.cats);
  const foods = useFoodStore((s) => s.foods);
  const addPet = useCatStore((s) => s.addPet);
  const switchPet = useCatStore((s) => s.switchPet);
  const updatePet = useCatStore((s) => s.updatePet);
  const deletePet = useCatStore((s) => s.deletePet);
  const needsOnboarding = catLoaded && activePet && !activePet.onboardingDone;

  useEffect(() => {
    void loadCat();
  }, [loadCat]);

  useEffect(() => {
    if (activePetId != null) {
      void loadFoods(activePetId);
    }
  }, [loadFoods, activePetId]);

  useEffect(() => {
    if (!catLoaded || !foodsLoaded || tabReady) return;
    const feedingMode = (activePet?.feedingMode ?? "dry") as Exclude<FeedingMode, "none">;
    setTab(isFoodConfiguredForMode(feedingMode, foods) ? "diet" : "calc");
    setTabReady(true);
  }, [catLoaded, foodsLoaded, tabReady, activePet?.feedingMode, foods]);

  useEffect(() => {
    if (activePet && !activePet.onboardingDone && tabReady) {
      setTabReady(false);
    }
  }, [activePet?.onboardingDone, tabReady, activePet]);

  const openEditPet = useCallback((petId: number) => {
    setSwitcherOpen(false);
    const pet = useCatStore.getState().cats.find((c) => c.id === petId);
    if (pet) setEditingPet(pet);
  }, []);

  const handleDeletePet = useCallback(
    (petId: number) => {
      const confirmed = window.confirm(
        "将删除该宠物及其全部数据（常用粮、体重与喂食记录等），且无法恢复。确定继续？",
      );
      if (!confirmed) return;
      void deletePet(petId);
    },
    [deletePet],
  );

  const handleSavePet = useCallback(
    async (values: Partial<Omit<CatProfile, "id" | "updatedAt">>) => {
      if (!editingPet) return;
      await updatePet(editingPet.id, values);
      setEditingPet(null);
    },
    [editingPet, updatePet],
  );

  const handleDeleteEditingPet = useCallback(async () => {
    if (!editingPet) return;
    await deletePet(editingPet.id);
    setEditingPet(null);
  }, [editingPet, deletePet]);

  const cancelAddPet = useCallback(async () => {
    if (activePetId == null) return;
    await deletePet(activePetId);
  }, [activePetId, deletePet]);

  if (needsOnboarding) {
    return <PetOnboarding onCancel={cats.length > 1 ? cancelAddPet : undefined} />;
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <header className="px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1">
        <h1 className="text-base font-semibold text-ink">宠物热量与减肥</h1>
      </header>

      {activePet ? (
        <div className="px-3 pb-2">
          <CatInfoBar
            species={activePet.species}
            name={activePet.name}
            weightKg={activePet.weightKg}
            onClick={() => setSwitcherOpen(true)}
          />
        </div>
      ) : null}

      <main className="px-3 pb-3">
        {!catLoaded || !tabReady ? (
          <p className="py-10 text-center text-sm text-muted">加载中…</p>
        ) : tab === "calc" ? (
          <CalcTab />
        ) : (
          <DietTab />
        )}
      </main>

      {tabReady ? <BottomTabs active={tab} onChange={setTab} /> : null}

      {switcherOpen ? (
        <PetSwitcher
          cats={cats}
          activePetId={activePetId ?? 0}
          onSelect={switchPet}
          onAdd={async () => {
            await addPet();
            setSwitcherOpen(false);
          }}
          onEdit={openEditPet}
          onDelete={handleDeletePet}
          onClose={() => setSwitcherOpen(false)}
        />
      ) : null}

      {editingPet ? (
        <PetSettingsSheet
          cat={editingPet}
          catCount={cats.length}
          onClose={() => setEditingPet(null)}
          onSave={handleSavePet}
          onDelete={handleDeleteEditingPet}
        />
      ) : null}
    </div>
  );
}
