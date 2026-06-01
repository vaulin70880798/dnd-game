export type Condition =
  | { type: "hasItem"; itemId: string }
  | { type: "missingItem"; itemId: string }
  | { type: "statAtLeast"; stat: "skill" | "stamina" | "luck" | "gold" | "food"; value: number }
  | { type: "statAtMost"; stat: "skill" | "stamina" | "luck" | "gold" | "food"; value: number }
  | { type: "flagEquals"; key: string; value: string | number | boolean }
  | { type: "flagExists"; key: string }
  | { type: "paragraphVisited"; paragraphId: number }
  | { type: "allOf"; conditions: Condition[] }
  | { type: "anyOf"; conditions: Condition[] }
  | { type: "not"; condition: Condition };

export type Effect =
  | { type: "addItem"; itemId: string; quantity?: number }
  | { type: "removeItem"; itemId: string; quantity?: number }
  | { type: "modifyStat"; stat: "skill" | "stamina" | "luck" | "gold" | "food"; amount: number }
  | { type: "setStat"; stat: "skill" | "stamina" | "luck" | "gold" | "food"; value: number }
  | { type: "setFlag"; key: string; value: string | number | boolean }
  | { type: "clearFlag"; key: string }
  | { type: "addJournal"; textHe: string; kind?: "event" | "combat" | "loot" | "decision" }
  | { type: "setParagraph"; target: number }
  | { type: "markEnemyDefeated"; enemyId: string }
  | { type: "addStatusNote"; note: string }
  | { type: "removeStatusNote"; note: string };

export interface Choice {
  id: string;
  label: string;
  target: number;
  condition?: Condition;
  effects?: Effect[];
  hiddenWhenLocked?: boolean;
  notes?: string;
}

export interface CombatTrigger {
  enemies: string[];
  onWin: number;
  onLose: number | "death";
  canTestLuck?: boolean;
}

export interface TestDefinition {
  id: string;
  type: "luck" | "skill" | "stamina" | "custom";
  dice: { count: number; sides: number };
  successIf: "lteStat" | "gteStat" | "equals";
  stat?: "skill" | "stamina" | "luck";
  targetValue?: number;
  onSuccess: number;
  onFailure: number;
  consumeLuckOnUse?: boolean;
  notes?: string;
}

export interface ParagraphIllustration {
  src: string;
  altHe: string;
  captionHe?: string;
  source?: "generated-remake" | "original-scan" | "custom";
}

export interface Paragraph {
  id: number;
  title?: string;
  locationId: string;
  textHe: string;
  textOriginal?: string;
  illustration?: ParagraphIllustration | null;
  choices: Choice[];
  effects?: Effect[];
  combat?: CombatTrigger | null;
  test?: TestDefinition | null;
  notes?: string;
}
