"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CharacterSheet from "@/components/CharacterSheet";
import ChoiceButton from "@/components/ChoiceButton";
import CombatPanel from "@/components/CombatPanel";
import InventoryPanel from "@/components/InventoryPanel";
import JournalView from "@/components/JournalView";
import MapView from "@/components/MapView";
import ParagraphView from "@/components/ParagraphView";
import SaveLoadPanel from "@/components/SaveLoadPanel";
import { rollDice } from "@/engine/dice";
import {
  chooseChoice,
  createInitialGameState,
  getAvailableChoices,
  getCurrentParagraph,
  resolveRound,
  runParagraphTest,
  type EngineContext,
  consumeProvision,
} from "@/engine/gameEngine";
import { buildParagraphToNodeIndex, getCurrentMapNodeId } from "@/engine/mapEngine";
import {
  clearGameState,
  hasSavedGame,
  loadGameState,
  loadSettings,
  saveGameState,
  saveSettings,
} from "@/engine/saveSystem";
import type { EnemyDefinition } from "@/types/combat";
import type { GameState, RuleSet } from "@/types/game";
import type { Item } from "@/types/item";
import type { MapNode } from "@/types/map";
import type { Paragraph } from "@/types/paragraph";
import type { NpcProfile, VisualPlanEntry } from "@/types/visual";

interface BookMeta {
  startParagraphId: number;
  titleHe: string;
  assets?: {
    worldMap?: string;
  };
}

interface GameRuntimeProps {
  paragraphs: Paragraph[];
  items: Item[];
  enemies: EnemyDefinition[];
  mapNodes: MapNode[];
  visualPlan: VisualPlanEntry[];
  npcProfiles: NpcProfile[];
  rules: RuleSet;
  bookMeta: BookMeta;
  mode: "new" | "continue" | "auto";
}

interface SceneCharacter {
  id: string;
  nameHe: string;
  summaryHe: string;
  imageSrc: string;
  kind: "enemy" | "npc";
}

interface SceneItem {
  id: string;
  nameHe: string;
  descriptionHe: string;
  effectHe?: string;
  imageSrc: string;
}

interface DraftCharacter {
  name: string;
  skill: number;
  stamina: number;
  luck: number;
  gold: number;
  food: number;
}

const DEFAULT_DRAFT: DraftCharacter = {
  name: "",
  skill: 7,
  stamina: 16,
  luck: 7,
  gold: 10,
  food: 10,
};

export default function GameRuntime({
  paragraphs,
  items,
  enemies,
  mapNodes,
  visualPlan,
  npcProfiles,
  rules,
  bookMeta,
  mode,
}: GameRuntimeProps) {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    const saved = loadGameState();
    if (mode === "continue") {
      return saved;
    }
    if (mode === "auto") {
      return saved;
    }
    return null;
  });
  const [draft, setDraft] = useState<DraftCharacter>(DEFAULT_DRAFT);
  const [uiError, setUiError] = useState<string>(() => {
    if (mode !== "continue") return "";
    return loadGameState() ? "" : "לא נמצאה שמירה מקומית. אפשר להתחיל משחק חדש.";
  });
  const [showInventory, setShowInventory] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showParagraphId, setShowParagraphId] = useState(() => loadSettings().showParagraphId);
  const hasSave = hasSavedGame();

  const paragraphsById = useMemo(
    () => Object.fromEntries(paragraphs.map((paragraph) => [paragraph.id, paragraph])) as Record<number, Paragraph>,
    [paragraphs],
  );
  const enemiesById = useMemo(
    () => Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>,
    [enemies],
  );
  const itemsById = useMemo(() => Object.fromEntries(items.map((item) => [item.id, item])) as Record<string, Item>, [items]);
  const visualPlanByParagraphId = useMemo(
    () => Object.fromEntries(visualPlan.map((entry) => [entry.paragraphId, entry])) as Record<number, VisualPlanEntry>,
    [visualPlan],
  );
  const npcProfilesById = useMemo(
    () => Object.fromEntries(npcProfiles.map((profile) => [profile.id, profile])) as Record<string, NpcProfile>,
    [npcProfiles],
  );

  const paragraphToNode = useMemo(() => buildParagraphToNodeIndex(mapNodes), [mapNodes]);

  const context: EngineContext = useMemo(
    () => ({
      paragraphsById,
      enemiesById,
      paragraphToNode,
      rules,
    }),
    [enemiesById, paragraphToNode, paragraphsById, rules],
  );

  useEffect(() => {
    if (!gameState) return;
    saveGameState(gameState);
  }, [gameState]);

  const currentParagraph = useMemo(() => {
    if (!gameState) return null;
    return getCurrentParagraph(gameState, context);
  }, [context, gameState]);

  const availableChoices = useMemo(() => {
    if (!gameState || !currentParagraph) return [];
    return getAvailableChoices(currentParagraph, gameState);
  }, [currentParagraph, gameState]);

  const currentNodeId = useMemo(() => {
    if (!gameState) return undefined;
    return getCurrentMapNodeId(gameState.currentParagraphId, paragraphToNode);
  }, [gameState, paragraphToNode]);

  const currentVisualPlan = useMemo(() => {
    if (!gameState) return undefined;
    return visualPlanByParagraphId[gameState.currentParagraphId];
  }, [gameState, visualPlanByParagraphId]);

  const currentSceneCharacters = useMemo((): SceneCharacter[] => {
    if (!currentVisualPlan) return [];
    const sceneCharacters: SceneCharacter[] = [];

    for (const enemyId of currentVisualPlan.enemyIds) {
      const enemy = enemiesById[enemyId];
      if (!enemy?.imageSrc) continue;
      sceneCharacters.push({
        id: enemy.id,
        nameHe: enemy.nameHe,
        summaryHe: enemy.summaryHe ?? enemy.specialRules[0] ?? "אויב מסוכן בעיר המלכודות.",
        imageSrc: enemy.imageSrc,
        kind: "enemy",
      });
    }

    for (const npcId of currentVisualPlan.npcIds) {
      const npc = npcProfilesById[npcId];
      if (!npc) continue;
      sceneCharacters.push({
        id: npc.id,
        nameHe: npc.labelHe,
        summaryHe: npc.summaryHe,
        imageSrc: npc.imageSrc,
        kind: "npc",
      });
    }

    return sceneCharacters;
  }, [currentVisualPlan, enemiesById, npcProfilesById]);

  const currentSceneItems = useMemo((): SceneItem[] => {
    if (!currentVisualPlan) return [];
    return currentVisualPlan.itemIds
      .map((itemId) => itemsById[itemId])
      .filter((item): item is Item => Boolean(item && item.imageSrc))
      .map((item) => ({
        id: item.id,
        nameHe: item.nameHe,
        descriptionHe: item.descriptionHe,
        effectHe: item.effectHe,
        imageSrc: item.imageSrc as string,
      }));
  }, [currentVisualPlan, itemsById]);

  const rollDefaultStats = () => {
    const skill = rollDice(1, 6).total + 6;
    const stamina = rollDice(2, 6).total + 12;
    const luck = rollDice(1, 6).total + 6;

    setDraft((prev) => ({
      ...prev,
      skill,
      stamina,
      luck,
    }));
  };

  const startGame = () => {
    try {
      if (!draft.name.trim()) {
        setUiError("יש להזין שם דמות.");
        return;
      }

      const initial = createInitialGameState(
        {
          name: draft.name.trim(),
          skill: draft.skill,
          stamina: draft.stamina,
          luck: draft.luck,
          gold: draft.gold,
          food: draft.food,
        },
        context,
        bookMeta.startParagraphId,
      );
      setGameState(initial);
      setUiError("");
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "שגיאה בהתחלת משחק.");
    }
  };

  const applyChoice = (choiceId: string) => {
    if (!gameState) return;
    try {
      const next = chooseChoice(gameState, choiceId, context);
      setGameState(next);
      setUiError("");
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "שגיאה במעבר פסקה.");
    }
  };

  const rollCombat = (options?: { useLuck?: boolean; luckIntent?: "attack" | "defense" }) => {
    if (!gameState) return;
    try {
      const next = resolveRound(gameState, context, options);
      setGameState(next);
      setUiError("");
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "שגיאה בסיבוב קרב.");
    }
  };

  const runTest = () => {
    if (!gameState) return;
    try {
      const next = runParagraphTest(gameState, context);
      setGameState(next);
      setUiError("");
    } catch (error) {
      setUiError(error instanceof Error ? error.message : "שגיאה בבדיקת פסקה.");
    }
  };

  const useItem = (itemId: string) => {
    if (!gameState) return;
    const item = itemsById[itemId];
    if (!item) return;

    const entry = gameState.inventory.find((inv) => inv.itemId === itemId);
    if (!entry || entry.quantity <= 0) return;

    const next = structuredClone(gameState);

    if (item.oneTimeUse) {
      next.inventory = next.inventory
        .map((inv) => (inv.itemId === itemId ? { ...inv, quantity: inv.quantity - 1 } : inv))
        .filter((inv) => inv.quantity > 0);
    }

    next.journal.unshift({
      id: `${Date.now()}_${item.id}`,
      paragraphId: next.currentParagraphId,
      kind: "loot",
      textHe: item.oneTimeUse
        ? `השתמשת ב-${item.nameHe}. החפץ הוסר מהמלאי.`
        : `בדקת את ${item.nameHe}.`,
      createdAt: new Date().toISOString(),
    });

    next.updatedAt = new Date().toISOString();
    setGameState(next);
  };

  const saveNow = () => {
    if (!gameState) return;
    saveGameState(gameState);
  };

  const loadNow = () => {
    const saved = loadGameState();
    if (!saved) {
      setUiError("לא נמצאה שמירה לטעינה.");
      return;
    }
    setGameState(saved);
    setUiError("");
  };

  const clearNow = () => {
    clearGameState();
  };

  const useFood = () => {
    if (!gameState) return;
    const next = consumeProvision(gameState, context);
    setGameState(next);
  };

  const handleShowParagraphId = (enabled: boolean) => {
    setShowParagraphId(enabled);
    saveSettings({ showParagraphId: enabled });
  };

  if (!gameState) {
    return (
      <section className="mx-auto w-full max-w-[460px]">
        <div className="ornate-card p-4">
          <header className="mb-3 border-b border-amber-300/20 pb-3">
            <h1 className="text-2xl font-semibold text-amber-100">יצירת דמות</h1>
            <p className="mt-1 text-sm text-amber-50/80">הכן את ההרפתקן לפני הכניסה לעיר המלכודות.</p>
          </header>

          <div className="mb-4 overflow-hidden rounded-xl border border-amber-300/30">
            <Image
              src="/assets/generated/hero-character-sheet.png"
              alt="דמות הרפתקן"
              width={1024}
              height={1024}
              priority
              loading="eager"
              className="h-40 w-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-amber-50">
              שם דמות
              <input
                value={draft.name}
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50 outline-none focus:border-amber-200/70"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-amber-50">
                {rules.statsLabels.skill}
                <input
                  type="number"
                  value={draft.skill}
                  onChange={(event) => setDraft((prev) => ({ ...prev, skill: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
                />
              </label>
              <label className="text-sm text-amber-50">
                {rules.statsLabels.stamina}
                <input
                  type="number"
                  value={draft.stamina}
                  onChange={(event) => setDraft((prev) => ({ ...prev, stamina: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
                />
              </label>
              <label className="text-sm text-amber-50">
                {rules.statsLabels.luck}
                <input
                  type="number"
                  value={draft.luck}
                  onChange={(event) => setDraft((prev) => ({ ...prev, luck: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
                />
              </label>
              <label className="text-sm text-amber-50">
                {rules.statsLabels.gold}
                <input
                  type="number"
                  value={draft.gold}
                  onChange={(event) => setDraft((prev) => ({ ...prev, gold: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
                />
              </label>
              <label className="col-span-2 text-sm text-amber-50">
                {rules.statsLabels.food}
                <input
                  type="number"
                  value={draft.food}
                  onChange={(event) => setDraft((prev) => ({ ...prev, food: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
                />
              </label>
            </div>

            <div className="grid gap-2">
              <button type="button" onClick={rollDefaultStats} className="btn-iron px-4 py-2 text-sm">
                גלגל סטטיסטיקות התחלה
              </button>
              <button type="button" onClick={startGame} className="btn-gold px-4 py-2 text-sm font-semibold">
                המשך להרפתקה
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-amber-300/20 pt-3">
              <Link href="/" className="text-sm text-amber-200/80 hover:text-amber-100">
                חזרה
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!hasSavedGame()) return;
                  const saved = loadGameState();
                  if (saved) setGameState(saved);
                }}
                className="text-sm text-amber-200/80 hover:text-amber-100"
              >
                טען שמירה
              </button>
            </div>
          </div>

          {uiError && <p className="mt-4 text-sm text-red-300">{uiError}</p>}
        </div>
      </section>
    );
  }

  if (!currentParagraph) {
    return <p className="text-red-300">שגיאה: לא נמצאה פסקה נוכחית.</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <header className="ornate-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/20 pb-3">
          <div>
            <h1 className="text-xl font-semibold text-amber-100">{bookMeta.titleHe}</h1>
            <p className="mt-1 text-xs text-amber-200/80">
              פסקה {currentParagraph.id} • אזור {currentNodeId ?? "לא ידוע"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowInventory((prev) => !prev)}
              className={`px-3 py-1.5 text-sm ${showInventory ? "btn-gold" : "btn-iron"}`}
            >
              מלאי
            </button>
            <button
              type="button"
              onClick={() => setShowMap((prev) => !prev)}
              className={`px-3 py-1.5 text-sm ${showMap ? "btn-gold" : "btn-iron"}`}
            >
              מפה
            </button>
            <button
              type="button"
              onClick={() => setShowJournal((prev) => !prev)}
              className={`px-3 py-1.5 text-sm ${showJournal ? "btn-gold" : "btn-iron"}`}
            >
              יומן
            </button>
            <button
              type="button"
              onClick={useFood}
              className="btn-iron px-3 py-1.5 text-sm"
            >
              השתמש במזון
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <main className="space-y-4">
          <ParagraphView
            paragraph={currentParagraph}
            showParagraphId={showParagraphId}
            sceneCharacters={currentSceneCharacters}
            sceneItems={currentSceneItems}
          />

          {gameState.combat ? (
            <CombatPanel combat={gameState.combat} onRollRound={rollCombat} />
          ) : currentParagraph.test ? (
            <button
              type="button"
              onClick={runTest}
              className="btn-gold w-full px-4 py-3 text-sm"
            >
              בצע בדיקה: {currentParagraph.test.id}
            </button>
          ) : (
            <section className="space-y-2">
              {availableChoices.map((choice) => (
                <ChoiceButton key={choice.id} choice={choice} onChoose={applyChoice} />
              ))}
            </section>
          )}

          {gameState.gameOver && (
            <div className="rounded-xl border border-red-300/35 bg-red-950/45 p-4 text-red-100">
              המשחק הסתיים. ניתן לחזור למסך הפתיחה ולהתחיל מחדש.
            </div>
          )}

          {uiError && <p className="text-sm text-red-300">{uiError}</p>}
        </main>

        <div className="hidden space-y-4 xl:block">
          <CharacterSheet character={gameState.character} rules={rules} />
          <SaveLoadPanel onSave={saveNow} onLoad={loadNow} onClear={clearNow} hasSave={hasSave} />

          <label className="ornate-card flex items-center gap-2 p-3 text-sm text-amber-50">
            <input
              type="checkbox"
              checked={showParagraphId}
              onChange={(event) => handleShowParagraphId(event.target.checked)}
            />
            הצג מספר פסקה
          </label>
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        <CharacterSheet character={gameState.character} rules={rules} />
        <SaveLoadPanel onSave={saveNow} onLoad={loadNow} onClear={clearNow} hasSave={hasSave} />
        <label className="ornate-card flex items-center gap-2 p-3 text-sm text-amber-50">
          <input
            type="checkbox"
            checked={showParagraphId}
            onChange={(event) => handleShowParagraphId(event.target.checked)}
          />
          הצג מספר פסקה
        </label>
      </div>

      <nav className="mobile-bottom-nav grid grid-cols-3 gap-1 p-2 xl:hidden">
        <button
          type="button"
          onClick={() => {
            setShowInventory((prev) => !prev);
            setShowMap(false);
            setShowJournal(false);
          }}
          className={showInventory ? "active rounded-md bg-amber-200/10 py-2" : "rounded-md py-2"}
        >
          מלאי
        </button>
        <button
          type="button"
          onClick={() => {
            setShowMap((prev) => !prev);
            setShowInventory(false);
            setShowJournal(false);
          }}
          className={showMap ? "active rounded-md bg-amber-200/10 py-2" : "rounded-md py-2"}
        >
          מפה
        </button>
        <button
          type="button"
          onClick={() => {
            setShowJournal((prev) => !prev);
            setShowInventory(false);
            setShowMap(false);
          }}
          className={showJournal ? "active rounded-md bg-amber-200/10 py-2" : "rounded-md py-2"}
        >
          יומן
        </button>
      </nav>

      {showInventory && <InventoryPanel inventory={gameState.inventory} itemsById={itemsById} onUseItem={useItem} />}
      {showMap && (
        <MapView
          nodes={mapNodes}
          visitedNodeIds={gameState.mapVisitedNodeIds}
          currentNodeId={currentNodeId}
          mapImageSrc={bookMeta.assets?.worldMap}
        />
      )}
      {showJournal && <JournalView entries={gameState.journal} />}
    </div>
  );
}
