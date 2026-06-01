"use client";

import { useState } from "react";
import JournalView from "@/components/JournalView";
import { loadGameState } from "@/engine/saveSystem";
import type { GameState } from "@/types/game";

export default function SavedJournalSection() {
  const [state] = useState<GameState | null>(() => loadGameState());

  if (!state) {
    return (
      <div className="ornate-card p-5 text-sm text-amber-50/80">
        לא נמצאה שמירה מקומית. התחל משחק כדי לראות את יומן המסע.
      </div>
    );
  }

  return <JournalView entries={state.journal} />;
}
