import type { CombatState } from "@/types/combat";

export interface RuleSet {
  titleHe: string;
  sourceEdition: string;
  statsLabels: {
    skill: string;
    stamina: string;
    luck: string;
    gold: string;
    food: string;
  };
  dice: {
    combat: { count: number; sides: number };
    luckTest: { count: number; sides: number };
    skillTest?: { count: number; sides: number };
  };
  combat: {
    attackFormula: "skillPlus2d6" | "custom";
    baseDamageToLoser: number;
    luckMode: "book-defined" | "not-available";
  };
  luck: {
    consumeOnUse: number;
    successComparator: "lte" | "gte";
  };
  staminaFloor: number;
  supportsProvisions: boolean;
  notes: string[];
  requiresSourceVerification: boolean;
}

export interface CharacterStats {
  skill: number;
  stamina: number;
  maxStamina: number;
  luck: number;
  maxLuck: number;
  gold: number;
  food: number;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface CharacterSheetState {
  name: string;
  stats: CharacterStats;
  weapon?: string;
  armor?: string;
  notes: string[];
}

export interface JournalEntry {
  id: string;
  paragraphId: number;
  kind: "event" | "combat" | "loot" | "decision" | "system";
  textHe: string;
  createdAt: string;
}

export interface GameState {
  version: number;
  startedAt: string;
  updatedAt: string;
  currentParagraphId: number;
  previousParagraphId: number | null;
  character: CharacterSheetState;
  inventory: InventoryEntry[];
  visitedParagraphIds: number[];
  defeatedEnemyIds: string[];
  flags: Record<string, string | number | boolean>;
  mapVisitedNodeIds: string[];
  journal: JournalEntry[];
  combat: CombatState | null;
  gameOver: boolean;
  ending: "good" | "bad" | "death" | null;
}
