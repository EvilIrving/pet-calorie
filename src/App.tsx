import { Navigation24Regular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import AboutSheet from "./components/AboutSheet";
import AppSettingsSheet from "./components/AppSettingsSheet";
import BottomTabs, { type AppTab } from "./components/BottomTabs";
import CatInfoBar from "./components/CatInfoBar";
import PetSettingsSheet from "./components/PetSettingsSheet";
import PetSwitcher from "./components/PetSwitcher";
import type { CatProfile } from "./db";
import { resetAllAppData } from "./db";
import { useI18n } from "./i18n";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const resetClicks = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const { t } = useI18n();

  const handleResetClick = useCallback(() => {
    resetClicks.current += 1;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (resetClicks.current >= 3) {
      resetClicks.current = 0;
      const confirmed = window.confirm(t("confirmReset"));
      if (confirmed) {
        void resetAllAppData().then(() => window.location.reload());
      }
    } else {
      resetTimer.current = setTimeout(() => {
        resetClicks.current = 0;
      }, 1000);
    }
  }, []);

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

  const onboardingDone = activePet?.onboardingDone;

  useEffect(() => {
    if (!catLoaded || !foodsLoaded || tabReady) return;
    if (activePet && !onboardingDone) return;
    const feedingMode = (activePet?.feedingMode ?? "dry") as Exclude<FeedingMode, "none">;
    setTab(isFoodConfiguredForMode(feedingMode, foods) ? "diet" : "calc");
    setTabReady(true);
  }, [catLoaded, foodsLoaded, tabReady, activePet?.feedingMode, onboardingDone, foods]);

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
      const confirmed = window.confirm(t("confirmDeletePet"));
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h1
              className="flex min-h-11 min-w-0 items-center text-base font-semibold text-ink select-none"
              onClick={handleResetClick}
              onKeyDown={() => {}}
            >
              {t("appTitle")}
            </h1>
            <button
              type="button"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-surface text-muted touch-manipulation active:bg-line/40"
              aria-label={t("openSettings")}
              onClick={() => setSettingsOpen(true)}
            >
              <Navigation24Regular className="size-6" aria-hidden />
            </button>
          </div>
        </div>
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
          <p className="py-10 text-center text-sm text-muted">{t("loading")}</p>
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

      {settingsOpen ? (
        <AppSettingsSheet
          onClose={() => setSettingsOpen(false)}
          onOpenAbout={() => setAboutOpen(true)}
        />
      ) : null}

      {aboutOpen ? <AboutSheet onClose={() => setAboutOpen(false)} /> : null}
    </div>
  );
}
