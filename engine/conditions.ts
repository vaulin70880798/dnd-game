import type { GameState } from "@/types/game";
import type { Condition } from "@/types/paragraph";

function hasItem(state: GameState, itemId: string): boolean {
  return state.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0);
}

export function evaluateCondition(condition: Condition | undefined, state: GameState): boolean {
  if (!condition) {
    return true;
  }

  switch (condition.type) {
    case "hasItem":
      return hasItem(state, condition.itemId);
    case "missingItem":
      return !hasItem(state, condition.itemId);
    case "statAtLeast":
      return state.character.stats[condition.stat] >= condition.value;
    case "statAtMost":
      return state.character.stats[condition.stat] <= condition.value;
    case "flagEquals":
      return state.flags[condition.key] === condition.value;
    case "flagExists":
      return Object.prototype.hasOwnProperty.call(state.flags, condition.key);
    case "paragraphVisited":
      return state.visitedParagraphIds.includes(condition.paragraphId);
    case "allOf":
      return condition.conditions.every((nested) => evaluateCondition(nested, state));
    case "anyOf":
      return condition.conditions.some((nested) => evaluateCondition(nested, state));
    case "not":
      return !evaluateCondition(condition.condition, state);
    default:
      return false;
  }
}
