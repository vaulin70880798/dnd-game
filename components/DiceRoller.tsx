"use client";

import { useState } from "react";
import { rollDice } from "@/engine/dice";

interface DiceRollerProps {
  count?: number;
  sides?: number;
  label?: string;
}

const FACE_ROTATIONS: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(90deg) rotateY(0deg)",
  4: "rotateX(-90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)",
};

interface DieState {
  value: number;
  transform: string;
  rolling: boolean;
}

export default function DiceRoller({ count = 2, sides = 6, label = "גלגל קוביות" }: DiceRollerProps) {
  const [lastRoll, setLastRoll] = useState<number[] | null>(null);
  const [dice, setDice] = useState<DieState[]>(
    Array.from({ length: count }, () => ({
      value: 1,
      transform: FACE_ROTATIONS[1],
      rolling: false,
    })),
  );

  const handleRoll = () => {
    const result = rollDice(count, sides);
    setLastRoll(result.rolls);

    setDice((prev) =>
      prev.map(() => ({
        value: 1,
        transform: `rotateX(${720 + Math.floor(Math.random() * 380)}deg) rotateY(${760 + Math.floor(Math.random() * 280)}deg)`,
        rolling: true,
      })),
    );

    window.setTimeout(() => {
      setDice(
        result.rolls.map((value) => ({
          value,
          transform: FACE_ROTATIONS[value] ?? FACE_ROTATIONS[1],
          rolling: false,
        })),
      );
    }, 420);
  };

  return (
    <section className="ornate-card p-3">
      <button
        type="button"
        onClick={handleRoll}
        className="btn-gold w-full px-3 py-2 text-sm"
      >
        {label}
      </button>

      <div className="dice-arena mt-3 p-3">
        <div className="dice-stage flex items-center justify-center gap-4">
          {dice.map((die, index) => (
            <div key={`${index}_${die.value}`} className={`dice-cube ${die.rolling ? "rolling" : ""}`} style={{ transform: die.transform }}>
              <span className="dice-face front red">{die.value}</span>
              <span className="dice-face back red">{7 - die.value}</span>
              <span className="dice-face right red">{Math.max(1, die.value - 1)}</span>
              <span className="dice-face left red">{Math.min(6, die.value + 1)}</span>
              <span className="dice-face top red">{Math.min(6, die.value + 2)}</span>
              <span className="dice-face bottom red">{Math.max(1, die.value - 2)}</span>
            </div>
          ))}
        </div>
      </div>

      {lastRoll && (
        <p className="mt-3 text-center text-sm text-amber-100/95">
          תוצאה: {lastRoll.join(" + ")} = {lastRoll.reduce((a, b) => a + b, 0)}
        </p>
      )}
    </section>
  );
}
