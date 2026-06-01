"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import { buildParagraphToNodeIndex, getCurrentMapNodeId } from "@/engine/mapEngine";
import { loadGameState } from "@/engine/saveSystem";
import type { GameState } from "@/types/game";
import type { MapNode } from "@/types/map";

interface SavedMapSectionProps {
  mapNodes: MapNode[];
  mapImageSrc?: string;
}

export default function SavedMapSection({ mapNodes, mapImageSrc }: SavedMapSectionProps) {
  const [state] = useState<GameState | null>(() => loadGameState());

  const paragraphToNode = useMemo(() => buildParagraphToNodeIndex(mapNodes), [mapNodes]);
  const currentNodeId = state
    ? getCurrentMapNodeId(state.currentParagraphId, paragraphToNode)
    : undefined;

  if (!state) {
    return (
      <div className="ornate-card p-5 text-sm text-amber-50/80">
        לא נמצאה שמירה מקומית. התחל משחק כדי למלא את המפה.
      </div>
    );
  }

  return (
    <MapView
      nodes={mapNodes}
      visitedNodeIds={state.mapVisitedNodeIds}
      currentNodeId={currentNodeId}
      mapImageSrc={mapImageSrc}
    />
  );
}
