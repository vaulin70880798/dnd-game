export interface EnemyDefinition {
  id: string;
  nameHe: string;
  skill: number;
  stamina: number;
  armor?: number;
  damageOnHit?: number;
  specialRules: string[];
  imageSrc?: string;
  summaryHe?: string;
}

export interface CombatEnemyState {
  enemyId: string;
  nameHe: string;
  skill: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  alive: boolean;
}

export interface CombatRoundLog {
  round: number;
  playerRolls: number[];
  enemyRolls: number[];
  playerRoll: number;
  enemyRoll: number;
  playerAttackStrength: number;
  enemyAttackStrength: number;
  playerDamageTaken: number;
  enemyDamageTaken: number;
  textHe: string;
}

export interface CombatState {
  paragraphId: number;
  enemies: CombatEnemyState[];
  round: number;
  logs: CombatRoundLog[];
  onWin: number;
  onLose: number | "death";
  canTestLuck: boolean;
  ended: boolean;
  winner: "player" | "enemies" | null;
}
