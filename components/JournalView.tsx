import type { JournalEntry } from "@/types/game";

interface JournalViewProps {
  entries: JournalEntry[];
}

export default function JournalView({ entries }: JournalViewProps) {
  return (
    <section className="ornate-card p-4">
      <h3 className="mb-3 border-b border-amber-300/20 pb-2 text-lg font-semibold text-amber-100">יומן מסע</h3>

      {entries.length === 0 ? (
        <p className="text-sm text-amber-100/70">היומן עדיין ריק.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, index) => (
            <li key={entry.id} className="rounded-lg border border-amber-300/18 bg-zinc-900/70 p-3">
              <p className="text-xs text-amber-100/70">פסקה {entry.paragraphId}</p>
              <p className="mt-1 text-sm text-amber-50">{entry.textHe}</p>
              <p className="mt-1 text-[0.68rem] text-amber-300/65">רשומה #{entries.length - index}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
