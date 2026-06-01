"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { CombatState } from "@/types/combat";

interface CombatPanelProps {
  combat: CombatState;
  onRollRound: (options?: { useLuck?: boolean; luckIntent?: "attack" | "defense" }) => void;
  disabled?: boolean;
}

const FACE_ROTATIONS: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(90deg) rotateY(0deg)",
  4: "rotateX(-90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

interface DieViewState {
  value: number;
  transform: string;
  rolling: boolean;
}

function DieCube({ value, color, rolling, transform }: { value: number; color: "red" | "blue"; rolling: boolean; transform: string }) {
  return (
    <div className={`dice-cube ${rolling ? "rolling" : ""}`} style={{ transform }}>
      <span className={`dice-face front ${color}`}>{value}</span>
      <span className={`dice-face back ${color}`}>{7 - value}</span>
      <span className={`dice-face right ${color}`}>{Math.max(1, value - 1)}</span>
      <span className={`dice-face left ${color}`}>{Math.min(6, value + 1)}</span>
      <span className={`dice-face top ${color}`}>{Math.min(6, value + 2)}</span>
      <span className={`dice-face bottom ${color}`}>{Math.max(1, value - 2)}</span>
    </div>
  );
}

export default function CombatPanel({ combat, onRollRound, disabled = false }: CombatPanelProps) {
  const latestLog = combat.logs[0];
  const [playerDice, setPlayerDice] = useState<DieViewState[]>([
    { value: 1, transform: FACE_ROTATIONS[1], rolling: false },
    { value: 1, transform: FACE_ROTATIONS[1], rolling: false },
  ]);
  const [enemyDice, setEnemyDice] = useState<DieViewState[]>([
    { value: 1, transform: FACE_ROTATIONS[1], rolling: false },
    { value: 1, transform: FACE_ROTATIONS[1], rolling: false },
  ]);

  const aliveEnemies = useMemo(() => combat.enemies.filter((enemy) => enemy.alive), [combat.enemies]);

  useEffect(() => {
    if (!latestLog || latestLog.round <= 0) return;
    if (!latestLog.playerRolls.length || !latestLog.enemyRolls.length) return;

    const randomize = () =>
      `rotateX(${720 + Math.floor(Math.random() * 380)}deg) rotateY(${760 + Math.floor(Math.random() * 280)}deg)`;

    const warmup = window.setTimeout(() => {
      setPlayerDice((prev) =>
        prev.map(() => ({
          value: 1,
          transform: randomize(),
          rolling: true,
        })),
      );
      setEnemyDice((prev) =>
        prev.map(() => ({
          value: 1,
          transform: randomize(),
          rolling: true,
        })),
      );
    }, 30);

    const timer = window.setTimeout(() => {
      setPlayerDice(
        latestLog.playerRolls.map((value) => ({
          value,
          transform: FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1],
          rolling: false,
        })),
      );
      setEnemyDice(
        latestLog.enemyRolls.map((value) => ({
          value,
          transform: FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1],
          rolling: false,
        })),
      );
    }, 400);

    return () => {
      window.clearTimeout(warmup);
      window.clearTimeout(timer);
    };
  }, [latestLog]);

  return (
    <section className="ornate-card p-4">
      <div className="mb-3 flex items-center justify-between border-b border-amber-300/20 pb-2">
        <h3 className="text-lg font-semibold text-amber-100">קרב</h3>
        <span className="text-xs text-amber-200/80">סיבוב {combat.round}</span>
      </div>

      <div className="mb-3 grid gap-2">
        {combat.enemies.map((enemy) => (
          <div
            key={enemy.enemyId}
            className={`rounded-lg border p-2 text-sm ${
              enemy.alive
                ? "border-amber-300/24 bg-zinc-900/70"
                : "border-zinc-700/80 bg-zinc-950/60 opacity-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Image
                src={`/assets/generated/characters/${enemy.enemyId}.png`}
                alt={enemy.nameHe}
                width={64}
                height={64}
                className="h-12 w-12 rounded-md border border-amber-300/30 object-cover"
              />
              <div>
                <p className="text-amber-50">{enemy.nameHe}</p>
                <p className="text-amber-100/80">
                  סיבולת: {enemy.stamina}/{enemy.maxStamina}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dice-arena mb-3 p-3">
        <div className="dice-stage grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-center text-xs text-amber-200/80">גלגול שלך</p>
            <div className="flex items-center justify-center gap-3">
              {playerDice.map((die, index) => (
                <DieCube key={`p_${index}_${die.value}`} value={die.value} color="red" rolling={die.rolling} transform={die.transform} />
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-amber-100/90">סכום: {latestLog?.playerRoll ?? 0}</p>
          </div>
          <div>
            <p className="mb-2 text-center text-xs text-amber-200/80">גלגול אויב</p>
            <div className="flex items-center justify-center gap-3">
              {enemyDice.map((die, index) => (
                <DieCube key={`e_${index}_${die.value}`} value={die.value} color="blue" rolling={die.rolling} transform={die.transform} />
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-amber-100/90">סכום: {latestLog?.enemyRoll ?? 0}</p>
          </div>
        </div>

        {latestLog && latestLog.round > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-amber-300/20 bg-black/25 p-2 text-amber-100/90">
              עוצמתך: {latestLog.playerAttackStrength}
            </div>
            <div className="rounded border border-amber-300/20 bg-black/25 p-2 text-amber-100/90">
              עוצמת אויב: {latestLog.enemyAttackStrength}
            </div>
            <div className="rounded border border-amber-300/20 bg-black/25 p-2 text-amber-100/90">
              נזק שקיבלת: {latestLog.playerDamageTaken}
            </div>
            <div className="rounded border border-amber-300/20 bg-black/25 p-2 text-amber-100/90">
              נזק שגרמת: {latestLog.enemyDamageTaken}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRollRound()}
          className="btn-gold px-3 py-2 text-sm disabled:opacity-50"
        >
          גלגל סיבוב
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRollRound({ useLuck: true, luckIntent: "attack" })}
          className="btn-iron px-3 py-2 text-sm disabled:opacity-50"
        >
          גלגול + מזל התקפה
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onRollRound({ useLuck: true, luckIntent: "defense" })}
          className="btn-iron px-3 py-2 text-sm disabled:opacity-50"
        >
          גלגול + מזל הגנה
        </button>
      </div>

      {combat.logs.length > 0 && (
        <div className="mt-4 max-h-44 space-y-2 overflow-auto rounded-lg border border-amber-300/20 bg-zinc-900/70 p-2 text-sm">
          {combat.logs.map((log) => (
            <p key={`${log.round}_${log.playerRoll}_${log.enemyRoll}`} className="text-amber-50/90">
              {log.textHe}
            </p>
          ))}
        </div>
      )}

      {aliveEnemies.length === 0 && <p className="mt-3 text-sm text-green-300">כל האויבים הובסו.</p>}
    </section>
  );
}
