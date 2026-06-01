import type { GameState, JournalEntry } from "@/types/game";
import type { Effect } from "@/types/paragraph";

interface ApplyEffectsResult {
  state: GameState;
  jumpToParagraphId: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createJournalEntry(
  paragraphId: number,
  textHe: string,
  kind: JournalEntry["kind"] = "event",
): JournalEntry {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    paragraphId,
    kind,
    textHe,
    createdAt: new Date().toISOString(),
  };
}

function addInventoryItem(state: GameState, itemId: string, quantity: number): GameState {
  const amount = Math.max(1, quantity);
  const next = structuredClone(state);
  const existing = next.inventory.find((entry) => entry.itemId === itemId);
  if (existing) {
    existing.quantity += amount;
  } else {
    next.inventory.push({ itemId, quantity: amount });
  }
  return next;
}

function removeInventoryItem(state: GameState, itemId: string, quantity: number): GameState {
  const amount = Math.max(1, quantity);
  const next = structuredClone(state);
  const existing = next.inventory.find((entry) => entry.itemId === itemId);
  if (!existing) return next;

  existing.quantity -= amount;
  next.inventory = next.inventory.filter((entry) => entry.quantity > 0);
  return next;
}

function modifyStat(state: GameState, stat: keyof GameState["character"]["stats"], amount: number): GameState {
  const next = structuredClone(state);
  if (stat === "stamina") {
    const maxStamina = next.character.stats.maxStamina;
    next.character.stats.stamina = clamp(next.character.stats.stamina + amount, 0, maxStamina);
  } else if (stat === "luck") {
    const maxLuck = next.character.stats.maxLuck;
    next.character.stats.luck = clamp(next.character.stats.luck + amount, 0, maxLuck);
  } else {
    next.character.stats[stat] = Math.max(0, next.character.stats[stat] + amount);
  }
  return next;
}

function setStat(state: GameState, stat: keyof GameState["character"]["stats"], value: number): GameState {
  const next = structuredClone(state);
  if (stat === "stamina") {
    next.character.stats.stamina = clamp(value, 0, next.character.stats.maxStamina);
  } else if (stat === "luck") {
    next.character.stats.luck = clamp(value, 0, next.character.stats.maxLuck);
  } else {
    next.character.stats[stat] = Math.max(0, value);
  }
  return next;
}

export function applyEffects(
  state: GameState,
  effects: Effect[] | undefined,
  paragraphId: number,
): ApplyEffectsResult {
  if (!effects || effects.length === 0) {
    return { state, jumpToParagraphId: null };
  }

  let nextState = structuredClone(state);
  let jumpToParagraphId: number | null = null;

  for (const effect of effects) {
    switch (effect.type) {
      case "addItem":
        nextState = addInventoryItem(nextState, effect.itemId, effect.quantity ?? 1);
        break;
      case "removeItem":
        nextState = removeInventoryItem(nextState, effect.itemId, effect.quantity ?? 1);
        break;
      case "modifyStat":
        nextState = modifyStat(nextState, effect.stat, effect.amount);
        break;
      case "setStat":
        nextState = setStat(nextState, effect.stat, effect.value);
        break;
      case "setFlag":
        nextState.flags[effect.key] = effect.value;
        break;
      case "clearFlag":
        delete nextState.flags[effect.key];
        break;
      case "addJournal":
        nextState.journal.unshift(
          createJournalEntry(paragraphId, effect.textHe, effect.kind ?? "event"),
        );
        break;
      case "setParagraph":
        jumpToParagraphId = effect.target;
        break;
      case "markEnemyDefeated":
        if (!nextState.defeatedEnemyIds.includes(effect.enemyId)) {
          nextState.defeatedEnemyIds.push(effect.enemyId);
        }
        break;
      case "addStatusNote":
        if (!nextState.character.notes.includes(effect.note)) {
          nextState.character.notes.push(effect.note);
        }
        break;
      case "removeStatusNote":
        nextState.character.notes = nextState.character.notes.filter((note) => note !== effect.note);
        break;
      default:
        break;
    }
  }

  nextState.updatedAt = new Date().toISOString();
  return { state: nextState, jumpToParagraphId };
}

export function addSystemJournalEntry(
  state: GameState,
  paragraphId: number,
  textHe: string,
  kind: JournalEntry["kind"] = "system",
): GameState {
  const next = structuredClone(state);
  next.journal.unshift(createJournalEntry(paragraphId, textHe, kind));
  next.updatedAt = new Date().toISOString();
  return next;
}
