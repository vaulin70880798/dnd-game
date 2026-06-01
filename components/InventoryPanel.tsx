"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { InventoryEntry } from "@/types/game";
import type { Item } from "@/types/item";

interface InventoryPanelProps {
  inventory: InventoryEntry[];
  itemsById: Record<string, Item>;
  onUseItem: (itemId: string) => void;
}

export default function InventoryPanel({ inventory, itemsById, onUseItem }: InventoryPanelProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return itemsById[selectedItemId] ?? null;
  }, [itemsById, selectedItemId]);

  return (
    <section className="ornate-card p-4">
      <h3 className="mb-3 border-b border-amber-300/20 pb-2 text-lg font-semibold text-amber-100">מלאי וציוד</h3>

      {inventory.length === 0 ? (
        <p className="text-sm text-amber-100/70">אין חפצים כרגע.</p>
      ) : (
        <ul className="space-y-2.5">
          {inventory.map((entry) => {
            const item = itemsById[entry.itemId];
            if (!item) return null;

            return (
              <li key={entry.itemId} className="rounded-lg border border-amber-300/22 bg-zinc-900/72 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedItemId(item.id)}
                      className="shrink-0 rounded-md border border-amber-300/25 bg-zinc-950/60 p-1"
                    >
                      <Image
                        src={item.imageSrc ?? "/assets/generated/items/placeholder-item.png"}
                        alt={item.nameHe}
                        width={68}
                        height={68}
                        className="h-14 w-14 rounded object-cover"
                      />
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-50">
                        {item.nameHe} x{entry.quantity}
                      </p>
                      <p className="mt-1 text-xs text-amber-100/80">{item.descriptionHe}</p>
                    </div>
                  </div>
                  {item.oneTimeUse && (
                    <button
                      type="button"
                      onClick={() => onUseItem(item.id)}
                      className="btn-gold shrink-0 px-2 py-1 text-xs"
                    >
                      השתמש
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selectedItem && (
        <div className="mt-4 rounded-lg border border-amber-300/28 bg-zinc-950/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-amber-100">{selectedItem.nameHe}</p>
            <button
              type="button"
              onClick={() => setSelectedItemId(null)}
              className="btn-iron px-2 py-1 text-xs"
            >
              סגור
            </button>
          </div>

          <div className="flex gap-3">
            <Image
              src={selectedItem.imageSrc ?? "/assets/generated/items/placeholder-item.png"}
              alt={selectedItem.nameHe}
              width={100}
              height={100}
              className="h-20 w-20 rounded border border-amber-300/22 object-cover"
            />
            <div className="min-w-0 space-y-1 text-xs text-amber-100/90">
              <p>{selectedItem.descriptionHe}</p>
              {selectedItem.effectHe && <p className="text-amber-200/80">השפעה: {selectedItem.effectHe}</p>}
              <p className="text-amber-200/80">
                שימוש: {selectedItem.oneTimeUse ? "חד־פעמי (נעלם לאחר שימוש)" : "מתמשך/תנאי לפי פסקאות"}
              </p>
              {selectedItem.knownSourceParagraphIds && selectedItem.knownSourceParagraphIds.length > 0 && (
                <p className="text-amber-200/80">
                  אזכורים/מקורות אפשריים: {selectedItem.knownSourceParagraphIds.slice(0, 12).join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
