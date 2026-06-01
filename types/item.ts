export type ItemType = "weapon" | "armor" | "key" | "consumable" | "quest" | "currency" | "misc";

export interface Item {
  id: string;
  nameHe: string;
  nameOriginal?: string;
  descriptionHe: string;
  type: ItemType;
  usableInCombat: boolean;
  oneTimeUse?: boolean;
  maxStack?: number;
  grantsChoiceTags?: string[];
  imageSrc?: string;
  effectHe?: string;
  knownSourceParagraphIds?: number[];
}
