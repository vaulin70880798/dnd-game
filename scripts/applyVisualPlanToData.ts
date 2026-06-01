import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EnemyDefinition } from "../types/combat";
import type { Item } from "../types/item";
import type { Paragraph } from "../types/paragraph";

interface NpcProfile {
  id: string;
  labelHe: string;
  summaryHe: string;
  imageSrc: string;
}

interface VisualPlanEntry {
  paragraphId: number;
  tier: "mandatory" | "high" | "optional";
  sceneType: "combat" | "dialogue" | "item" | "location" | "ending" | "narrative";
  imageSrc?: string;
  imageAltHe?: string;
  captionHe?: string;
  enemyIds: string[];
  npcIds: string[];
  itemIds: string[];
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

function isGeneratedParagraphImage(src: string | undefined): boolean {
  return Boolean(src && src.startsWith("/assets/generated/paragraphs/"));
}

async function main() {
  const [
    paragraphsRaw,
    enemiesRaw,
    itemsRaw,
    visualPlanRaw,
    npcProfilesRaw,
  ] = await Promise.all([
    readFile(path.join(DATA_DIR, "paragraphs.json"), "utf8"),
    readFile(path.join(DATA_DIR, "enemies.json"), "utf8"),
    readFile(path.join(DATA_DIR, "items.json"), "utf8"),
    readFile(path.join(DATA_DIR, "visualPlan.json"), "utf8"),
    readFile(path.join(DATA_DIR, "npcProfiles.json"), "utf8"),
  ]);

  const paragraphs = JSON.parse(paragraphsRaw) as Paragraph[];
  const enemies = JSON.parse(enemiesRaw) as EnemyDefinition[];
  const items = JSON.parse(itemsRaw) as Item[];
  const visualPlan = JSON.parse(visualPlanRaw) as VisualPlanEntry[];
  const npcProfiles = JSON.parse(npcProfilesRaw) as NpcProfile[];

  const visualByParagraphId = new Map<number, VisualPlanEntry>(
    visualPlan.map((entry) => [entry.paragraphId, entry]),
  );

  for (const paragraph of paragraphs) {
    const plan = visualByParagraphId.get(paragraph.id);

    if (!plan?.imageSrc) {
      // Preserve non-generated custom scans if present.
      if (isGeneratedParagraphImage(paragraph.illustration?.src)) {
        paragraph.illustration = null;
      }
      continue;
    }

    paragraph.illustration = {
      src: plan.imageSrc,
      altHe: plan.imageAltHe ?? `איור לפסקה ${paragraph.id}`,
      captionHe: plan.captionHe,
      source: "generated-remake",
    };
  }

  const npcById = Object.fromEntries(npcProfiles.map((npc) => [npc.id, npc])) as Record<string, NpcProfile>;

  for (const enemy of enemies as Array<EnemyDefinition & { imageSrc?: string; summaryHe?: string }>) {
    enemy.imageSrc = `/assets/generated/characters/${enemy.id}.png`;
    const summaryFromRules = enemy.specialRules?.[0] ?? "אויב מסוכן בעיר המלכודות.";
    enemy.summaryHe = summaryFromRules;
  }

  for (const item of items as Array<
    Item & { imageSrc?: string; effectHe?: string; knownSourceParagraphIds?: number[] }
  >) {
    item.imageSrc = `/assets/generated/items/${item.id}.png`;
    item.effectHe =
      item.usableInCombat
        ? "ניתן לשימוש בהקשרי קרב בהתאם להוראות הפסקה והחוקים."
        : item.oneTimeUse
          ? "חד־פעמי: נצרך בעת שימוש ומוסר מהמלאי."
          : "משמש כתנאי בחירה/התקדמות או כחפץ מפתח בהתאם לפסקאות הספר.";

    // Pull mention hints from visual plan to assist UI explanations.
    item.knownSourceParagraphIds = visualPlan
      .filter((entry) => entry.itemIds.includes(item.id))
      .map((entry) => entry.paragraphId)
      .sort((a, b) => a - b);
  }

  await Promise.all([
    writeFile(path.join(DATA_DIR, "paragraphs.json"), `${JSON.stringify(paragraphs, null, 2)}\n`, "utf8"),
    writeFile(path.join(DATA_DIR, "enemies.json"), `${JSON.stringify(enemies, null, 2)}\n`, "utf8"),
    writeFile(path.join(DATA_DIR, "items.json"), `${JSON.stringify(items, null, 2)}\n`, "utf8"),
  ]);

  console.log(
    `APPLY_VISUAL_PLAN_OK paragraphsIllustrated=${paragraphs.filter((paragraph) => paragraph.illustration?.src).length} enemies=${enemies.length} items=${items.length} npcProfiles=${Object.keys(npcById).length}`,
  );
}

main().catch((error) => {
  console.error("APPLY_VISUAL_PLAN_FAIL");
  console.error(error);
  process.exit(1);
});
