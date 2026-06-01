export type SceneTier = "mandatory" | "high" | "optional";

export type SceneImageType = "combat" | "dialogue" | "item" | "location" | "ending" | "narrative";

export interface VisualPlanEntry {
  paragraphId: number;
  tier: SceneTier;
  sceneType: SceneImageType;
  imageSrc?: string;
  imageAltHe?: string;
  captionHe?: string;
  enemyIds: string[];
  npcIds: string[];
  itemIds: string[];
}

export interface NpcProfile {
  id: string;
  labelHe: string;
  summaryHe: string;
  imageSrc: string;
}
