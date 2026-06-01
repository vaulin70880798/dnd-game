import { resolveCombatRound, type CombatRoundOptions, createCombatState } from "@/engine/combatEngine";
import { evaluateCondition } from "@/engine/conditions";
import { applyEffects, addSystemJournalEntry } from "@/engine/effects";
import { rollDice } from "@/engine/dice";
import { ensureVisitedNode } from "@/engine/mapEngine";
import type { EnemyDefinition } from "@/types/combat";
import type { GameState, RuleSet } from "@/types/game";
import type { Paragraph, Choice } from "@/types/paragraph";

export interface EngineContext {
  paragraphsById: Record<number, Paragraph>;
  enemiesById: Record<string, EnemyDefinition>;
  paragraphToNode: Record<number, string>;
  rules: RuleSet;
}

export interface CharacterInit {
  name: string;
  skill: number;
  stamina: number;
  luck: number;
  gold?: number;
  food?: number;
}

function getParagraphOrThrow(context: EngineContext, paragraphId: number): Paragraph {
  const paragraph = context.paragraphsById[paragraphId];
  if (!paragraph) {
    throw new Error(`פסקה ${paragraphId} לא קיימת ב-paragraphs.json`);
  }
  return paragraph;
}

function updateMeta(state: GameState): GameState {
  state.updatedAt = new Date().toISOString();
  return state;
}

function transitionToParagraph(
  state: GameState,
  paragraphId: number,
  context: EngineContext,
  cause: string,
  depth = 0,
): GameState {
  if (depth > 8) {
    throw new Error("זוהתה לולאת מעבר עמוקה מדי בפסקאות (יותר מ-8 קפיצות רצופות).");
  }

  const paragraph = getParagraphOrThrow(context, paragraphId);
  let next = structuredClone(state);
  next.previousParagraphId = next.currentParagraphId;
  next.currentParagraphId = paragraphId;
  next.gameOver = false;

  if (!next.visitedParagraphIds.includes(paragraphId)) {
    next.visitedParagraphIds.push(paragraphId);
  }

  const nodeId = context.paragraphToNode[paragraphId];
  next.mapVisitedNodeIds = ensureVisitedNode(next.mapVisitedNodeIds, nodeId);

  next = addSystemJournalEntry(next, paragraphId, `מעבר לפסקה ${paragraphId}: ${paragraph.title ?? "ללא כותרת"}.`, "event");

  const effectsResult = applyEffects(next, paragraph.effects, paragraphId);
  next = effectsResult.state;

  if (paragraph.combat && !next.flags[`combat_${paragraph.id}_won`]) {
    next.combat = createCombatState(paragraph.id, paragraph.combat, context.enemiesById);
    next = addSystemJournalEntry(next, paragraphId, "הקרב החל.", "combat");
  } else {
    next.combat = null;
  }

  if (effectsResult.jumpToParagraphId && effectsResult.jumpToParagraphId !== paragraphId) {
    next = transitionToParagraph(next, effectsResult.jumpToParagraphId, context, "effect_jump", depth + 1);
  }

  return updateMeta(next);
}

export function createInitialGameState(
  character: CharacterInit,
  context: EngineContext,
  startParagraphId = 1,
): GameState {
  let state: GameState = {
    version: 1,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentParagraphId: startParagraphId,
    previousParagraphId: null,
    character: {
      name: character.name,
      stats: {
        skill: character.skill,
        stamina: character.stamina,
        maxStamina: character.stamina,
        luck: character.luck,
        maxLuck: character.luck,
        gold: character.gold ?? 0,
        food: character.food ?? 0,
      },
      notes: [],
    },
    inventory: [],
    visitedParagraphIds: [],
    defeatedEnemyIds: [],
    flags: {},
    mapVisitedNodeIds: [],
    journal: [],
    combat: null,
    gameOver: false,
    ending: null,
  };

  state = transitionToParagraph(state, startParagraphId, context, "new_game");
  state.previousParagraphId = null;
  return state;
}

export function getCurrentParagraph(state: GameState, context: EngineContext): Paragraph {
  return getParagraphOrThrow(context, state.currentParagraphId);
}

export function getAvailableChoices(paragraph: Paragraph, state: GameState): Choice[] {
  return paragraph.choices.filter((choice) => evaluateCondition(choice.condition, state));
}

export function chooseChoice(
  state: GameState,
  choiceId: string,
  context: EngineContext,
): GameState {
  const paragraph = getCurrentParagraph(state, context);
  const choice = paragraph.choices.find((entry) => entry.id === choiceId);

  if (!choice) {
    throw new Error(`בחירה '${choiceId}' לא קיימת בפסקה ${paragraph.id}.`);
  }

  if (!evaluateCondition(choice.condition, state)) {
    throw new Error(`הבחירה '${choiceId}' חסומה לפי תנאי המשחק.`);
  }

  let next = structuredClone(state);
  next = addSystemJournalEntry(next, paragraph.id, `בחירה: ${choice.label}`, "decision");

  const effectsResult = applyEffects(next, choice.effects, paragraph.id);
  next = effectsResult.state;

  const targetParagraphId = effectsResult.jumpToParagraphId ?? choice.target;
  next = transitionToParagraph(next, targetParagraphId, context, "choice");
  return updateMeta(next);
}

export function runParagraphTest(
  state: GameState,
  context: EngineContext,
  rng?: () => number,
): GameState {
  const paragraph = getCurrentParagraph(state, context);
  if (!paragraph.test) {
    return state;
  }

  const test = paragraph.test;
  const roll = rollDice(test.dice.count, test.dice.sides, rng);
  const next = structuredClone(state);

  let referenceValue = test.targetValue ?? 0;
  if (test.successIf === "lteStat" || test.successIf === "gteStat") {
    if (!test.stat) {
      throw new Error(`בדיקה '${test.id}' דורשת stat אבל לא הוגדר.`);
    }
    referenceValue = next.character.stats[test.stat];
  }

  const success =
    test.successIf === "lteStat"
      ? roll.total <= referenceValue
      : test.successIf === "gteStat"
        ? roll.total >= referenceValue
        : roll.total === referenceValue;

  if (test.type === "luck" && test.consumeLuckOnUse) {
    next.character.stats.luck = Math.max(0, next.character.stats.luck - context.rules.luck.consumeOnUse);
  }

  const outcomeText = success
    ? `בדיקה '${test.id}' הצליחה (${roll.total} מול ${referenceValue}).`
    : `בדיקה '${test.id}' נכשלה (${roll.total} מול ${referenceValue}).`;

  const withJournal = addSystemJournalEntry(next, paragraph.id, outcomeText, "event");
  const target = success ? test.onSuccess : test.onFailure;

  return transitionToParagraph(withJournal, target, context, "test");
}

export function resolveRound(
  state: GameState,
  context: EngineContext,
  options: CombatRoundOptions = {},
): GameState {
  if (!state.combat) {
    return state;
  }

  const currentCombat = state.combat;
  const next = structuredClone(state);
  const result = resolveCombatRound(currentCombat, next.character.stats, context.rules, options);
  next.combat = result.combat;
  next.character.stats = result.updatedStats;

  let withJournal = addSystemJournalEntry(next, result.combat.paragraphId, result.roundLog.textHe, "combat");

  if (result.combat.ended) {
    if (result.combat.winner === "player") {
      for (const enemy of result.combat.enemies) {
        if (!withJournal.defeatedEnemyIds.includes(enemy.enemyId)) {
          withJournal.defeatedEnemyIds.push(enemy.enemyId);
        }
      }
      withJournal.flags[`combat_${result.combat.paragraphId}_won`] = true;
      const winTarget = result.combat.onWin;
      withJournal.combat = null;
      withJournal = addSystemJournalEntry(withJournal, result.combat.paragraphId, "ניצחת בקרב.", "combat");
      return transitionToParagraph(withJournal, winTarget, context, "combat_win");
    }

    withJournal.combat = null;
    withJournal.gameOver = true;
    withJournal.ending = "death";
    withJournal = addSystemJournalEntry(withJournal, result.combat.paragraphId, "הקרב הוכרע לרעתך.", "combat");

    if (result.combat.onLose === "death") {
      return updateMeta(withJournal);
    }

    return transitionToParagraph(withJournal, result.combat.onLose, context, "combat_lose");
  }

  if (withJournal.character.stats.stamina <= context.rules.staminaFloor) {
    withJournal.gameOver = true;
    withJournal.ending = "death";
  }

  return updateMeta(withJournal);
}

export function consumeProvision(state: GameState, context: EngineContext): GameState {
  if (!context.rules.supportsProvisions) {
    return state;
  }

  if (state.character.stats.food <= 0) {
    return state;
  }

  let next = structuredClone(state);
  next.character.stats.food -= 1;
  next.character.stats.stamina = Math.min(next.character.stats.maxStamina, next.character.stats.stamina + 4);
  next = addSystemJournalEntry(next, next.currentParagraphId, "השתמשת במנת מזון (+4 סיבולת).", "loot");
  return updateMeta(next);
}

export function restartFromBeginning(state: GameState, context: EngineContext, startParagraphId = 1): GameState {
  return createInitialGameState(
    {
      name: state.character.name,
      skill: state.character.stats.skill,
      stamina: state.character.stats.maxStamina,
      luck: state.character.stats.maxLuck,
      gold: 0,
      food: 0,
    },
    context,
    startParagraphId,
  );
}
