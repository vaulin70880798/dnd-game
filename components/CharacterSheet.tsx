import Image from "next/image";
import type { CharacterSheetState, RuleSet } from "@/types/game";

interface CharacterSheetProps {
  character: CharacterSheetState;
  rules: RuleSet;
}

export default function CharacterSheet({ character, rules }: CharacterSheetProps) {
  return (
    <aside className="ornate-card p-3">
      <h2 className="mb-3 border-b border-amber-300/20 pb-2 text-lg font-semibold text-amber-100">דמותך</h2>
      <div className="mb-3 overflow-hidden rounded-lg border border-amber-300/25">
        <Image
          src="/assets/generated/characters/hero_neutral_sheet.png"
          alt="פורטרט דמות"
          width={1024}
          height={1024}
          className="h-28 w-full object-cover"
        />
      </div>
      <p className="mb-3 text-sm font-semibold text-amber-200/90">{character.name}</p>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="stat-chip p-2">
          <dt className="faint-label">{rules.statsLabels.skill}</dt>
          <dd className="strong-value">{character.stats.skill}</dd>
        </div>
        <div className="stat-chip p-2">
          <dt className="faint-label">{rules.statsLabels.stamina}</dt>
          <dd className="strong-value">
            {character.stats.stamina}/{character.stats.maxStamina}
          </dd>
        </div>
        <div className="stat-chip p-2">
          <dt className="faint-label">{rules.statsLabels.luck}</dt>
          <dd className="strong-value">
            {character.stats.luck}/{character.stats.maxLuck}
          </dd>
        </div>
        <div className="stat-chip p-2">
          <dt className="faint-label">{rules.statsLabels.gold}</dt>
          <dd className="strong-value">{character.stats.gold}</dd>
        </div>
        <div className="stat-chip col-span-2 p-2">
          <dt className="faint-label">{rules.statsLabels.food}</dt>
          <dd className="strong-value">{character.stats.food}</dd>
        </div>
      </dl>

      {character.notes.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm text-amber-100/85">השפעות פעילות</h3>
          <ul className="space-y-1 text-xs text-amber-50/90">
            {character.notes.map((note) => (
              <li key={note} className="rounded border border-amber-300/15 bg-zinc-900/70 px-2 py-1">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
