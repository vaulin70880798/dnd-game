import { rollDice } from "@/engine/dice";
import type { CombatEnemyState, CombatRoundLog, CombatState, EnemyDefinition } from "@/types/combat";
import type { CharacterStats, RuleSet } from "@/types/game";
import type { CombatTrigger } from "@/types/paragraph";

export interface CombatRoundOptions {
  useLuck?: boolean;
  luckIntent?: "attack" | "defense";
  rng?: () => number;
}

export interface CombatRoundResult {
  combat: CombatState;
  updatedStats: CharacterStats;
  roundLog: CombatRoundLog;
  usedLuck: boolean;
}

function getComparatorSuccess(comparator: "lte" | "gte", value: number, threshold: number): boolean {
  return comparator === "lte" ? value <= threshold : value >= threshold;
}

export function createCombatState(
  paragraphId: number,
  combat: CombatTrigger,
  enemiesById: Record<string, EnemyDefinition>,
): CombatState {
  const enemies: CombatEnemyState[] = combat.enemies.map((enemyId) => {
    const enemy = enemiesById[enemyId];
    if (!enemy) {
      throw new Error(`Enemy '${enemyId}' לא קיים ב-enemies.json`);
    }

    return {
      enemyId: enemy.id,
      nameHe: enemy.nameHe,
      skill: enemy.skill,
      stamina: enemy.stamina,
      maxStamina: enemy.stamina,
      armor: enemy.armor ?? 0,
      alive: true,
    };
  });

  return {
    paragraphId,
    enemies,
    round: 0,
    logs: [],
    onWin: combat.onWin,
    onLose: combat.onLose,
    canTestLuck: combat.canTestLuck ?? true,
    ended: false,
    winner: null,
  };
}

function applyLuckToDamage(
  incomingDamage: number,
  isPlayerAttacking: boolean,
  luckSuccess: boolean,
): number {
  if (isPlayerAttacking) {
    return luckSuccess ? incomingDamage + 1 : Math.max(0, incomingDamage - 1);
  }
  return luckSuccess ? Math.max(0, incomingDamage - 1) : incomingDamage + 1;
}

export function resolveCombatRound(
  combat: CombatState,
  stats: CharacterStats,
  rules: RuleSet,
  options: CombatRoundOptions = {},
): CombatRoundResult {
  if (combat.ended) {
    return {
      combat,
      updatedStats: stats,
      roundLog: {
        round: combat.round,
        playerRolls: [],
        enemyRolls: [],
        playerRoll: 0,
        enemyRoll: 0,
        playerAttackStrength: 0,
        enemyAttackStrength: 0,
        playerDamageTaken: 0,
        enemyDamageTaken: 0,
        textHe: "הקרב כבר הסתיים.",
      },
      usedLuck: false,
    };
  }

  const rng = options.rng ?? Math.random;
  const nextCombat = structuredClone(combat);
  const nextStats = structuredClone(stats);

  const activeEnemy = nextCombat.enemies.find((enemy) => enemy.alive);
  if (!activeEnemy) {
    nextCombat.ended = true;
    nextCombat.winner = "player";
    return {
      combat: nextCombat,
      updatedStats: nextStats,
      roundLog: {
        round: nextCombat.round,
        playerRolls: [],
        enemyRolls: [],
        playerRoll: 0,
        enemyRoll: 0,
        playerAttackStrength: 0,
        enemyAttackStrength: 0,
        playerDamageTaken: 0,
        enemyDamageTaken: 0,
        textHe: "כל האויבים כבר הובסו.",
      },
      usedLuck: false,
    };
  }

  nextCombat.round += 1;
  const round = nextCombat.round;
  const playerRoll = rollDice(rules.dice.combat.count, rules.dice.combat.sides, rng);
  const enemyRoll = rollDice(rules.dice.combat.count, rules.dice.combat.sides, rng);

  const playerAttackStrength = nextStats.skill + playerRoll.total;
  const enemyAttackStrength = activeEnemy.skill + enemyRoll.total;

  let playerDamageTaken = 0;
  let enemyDamageTaken = 0;
  let textHe = `סיבוב ${round}: `;

  if (playerAttackStrength > enemyAttackStrength) {
    enemyDamageTaken = Math.max(0, rules.combat.baseDamageToLoser - activeEnemy.armor);
    textHe += `פגעת ב-${activeEnemy.nameHe}.`;
  } else if (enemyAttackStrength > playerAttackStrength) {
    playerDamageTaken = rules.combat.baseDamageToLoser;
    textHe += `${activeEnemy.nameHe} פגע בך.`;
  } else {
    textHe += "תיקו, אין פגיעה.";
  }

  let usedLuck = false;
  if (
    options.useLuck &&
    nextCombat.canTestLuck &&
    nextStats.luck > 0 &&
    ((enemyDamageTaken > 0 && options.luckIntent === "attack") ||
      (playerDamageTaken > 0 && options.luckIntent === "defense"))
  ) {
    usedLuck = true;
    const luckRoll = rollDice(rules.dice.luckTest.count, rules.dice.luckTest.sides, rng);
    const luckSuccess = getComparatorSuccess(
      rules.luck.successComparator,
      luckRoll.total,
      nextStats.luck,
    );

    nextStats.luck = Math.max(0, nextStats.luck - rules.luck.consumeOnUse);

    if (options.luckIntent === "attack") {
      enemyDamageTaken = applyLuckToDamage(enemyDamageTaken, true, luckSuccess);
    } else {
      playerDamageTaken = applyLuckToDamage(playerDamageTaken, false, luckSuccess);
    }

    textHe += luckSuccess
      ? ` בדיקת מזל הצליחה (${luckRoll.total}).`
      : ` בדיקת מזל נכשלה (${luckRoll.total}).`;
  }

  activeEnemy.stamina = Math.max(0, activeEnemy.stamina - enemyDamageTaken);
  activeEnemy.alive = activeEnemy.stamina > 0;

  nextStats.stamina = Math.max(0, nextStats.stamina - playerDamageTaken);

  if (!nextCombat.enemies.some((enemy) => enemy.alive)) {
    nextCombat.ended = true;
    nextCombat.winner = "player";
    textHe += " כל האויבים הובסו.";
  } else if (nextStats.stamina <= rules.staminaFloor) {
    nextCombat.ended = true;
    nextCombat.winner = "enemies";
    textHe += " הדמות קרסה בקרב.";
  }

  const roundLog: CombatRoundLog = {
    round,
    playerRolls: playerRoll.rolls,
    enemyRolls: enemyRoll.rolls,
    playerRoll: playerRoll.total,
    enemyRoll: enemyRoll.total,
    playerAttackStrength,
    enemyAttackStrength,
    playerDamageTaken,
    enemyDamageTaken,
    textHe,
  };

  nextCombat.logs.unshift(roundLog);
  return {
    combat: nextCombat,
    updatedStats: nextStats,
    roundLog,
    usedLuck,
  };
}
