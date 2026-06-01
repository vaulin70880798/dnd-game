export interface DiceResult {
  total: number;
  rolls: number[];
}

export function rollDie(sides: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}

export function rollDice(count: number, sides: number, rng: () => number = Math.random): DiceResult {
  const rolls = Array.from({ length: count }, () => rollDie(sides, rng));
  return {
    rolls,
    total: rolls.reduce((sum, value) => sum + value, 0),
  };
}

export function roll2d6(rng: () => number = Math.random): DiceResult {
  return rollDice(2, 6, rng);
}
