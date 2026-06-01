import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EnemyDefinition } from "../types/combat";
import type { Item } from "../types/item";
import type { MapNode } from "../types/map";
import type { Paragraph } from "../types/paragraph";

interface ParagraphPlan {
  paragraphId: number;
  locationId: string;
  title: string;
  sceneTier: "mandatory" | "high" | "optional";
  sceneImageType: "combat" | "dialogue" | "item" | "location" | "ending" | "narrative";
  placement: {
    paragraphHeaderImage: boolean;
    characterPortraitRail: boolean;
    itemIconStrip: boolean;
  };
  reasons: string[];
  linkedEnemyIds: string[];
  npcArchetypes: string[];
  linkedItemIds: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const OUT_DIR = path.join(process.cwd(), "reports");

const dialogueKeywords = [
  "אומר",
  "שואל",
  "צועק",
  "לוחש",
  "עונה",
  "מבקש",
  "מסביר",
  "מצווה",
  "משיב",
  "מדבר",
  "ברוך הבא",
  "שלום",
];

const itemEventKeywords = [
  "אם יש לך",
  "אם יש ברשותך",
  "אם אין לך",
  "לקחת",
  "קח",
  "תקבל",
  "מקבל",
  "מצא",
  "מוצא",
  "קונה",
  "קנית",
  "מכר",
  "מוכר",
  "תמחק",
  "מחק",
  "שמור",
];

const locationKeywords = [
  "שער",
  "רחוב",
  "סמטה",
  "שוק",
  "פונדק",
  "טברנה",
  "גשר",
  "נהר",
  "מקדש",
  "מגדל",
  "בית",
  "ארמון",
  "מערה",
  "מבוך",
  "דלת",
  "חומה",
  "חדר",
  "קריפטה",
  "קבר",
  "מרתף",
  "צריף",
  "זירה",
  "נמל",
];

const npcArchetypeMap: Array<{ label: string; patterns: string[] }> = [
  { label: "שומרים", patterns: ["שומר", "שומרים"] },
  { label: "קבצן", patterns: ["קבצן"] },
  { label: "סוחר", patterns: ["סוחר", "רוכל"] },
  { label: "אמן", patterns: ["אמן", "אמנית"] },
  { label: "ברברי", patterns: ["ברברי"] },
  { label: "כרוז", patterns: ["כרוז"] },
  { label: "זקן", patterns: ["זקן", "זקנה"] },
  { label: "ילד", patterns: ["ילד", "ילדה"] },
  { label: "כוהן", patterns: ["כוהן", "כהן", "כומר"] },
  { label: "מכשף", patterns: ["מכשף", "קוסם"] },
  { label: "שודד", patterns: ["שודד", "פושע"] },
  { label: "בעל פונדק", patterns: ["בעל פונדק", "ברמן", "מלצר"] },
  { label: "אלוף זירה", patterns: ["אלוף", "זירה"] },
  { label: "לוחם", patterns: ["לוחם"] },
  { label: "אישה", patterns: ["אישה"] },
  { label: "גבר", patterns: ["גבר"] },
  { label: "מלך", patterns: ["מלך", "מלכה"] },
];

async function loadJson<T>(filename: string): Promise<T> {
  const mod = await import(path.join(DATA_DIR, filename), { with: { type: "json" } });
  return mod.default as T;
}

function includesAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function toShortTitle(paragraph: Paragraph): string {
  const title = paragraph.title?.trim();
  if (title) return title;
  const line = paragraph.textHe.split("\n")[0]?.trim() ?? "";
  return line.slice(0, 72);
}

function getNpcArchetypes(text: string): string[] {
  const hit: string[] = [];
  for (const archetype of npcArchetypeMap) {
    if (archetype.patterns.some((pattern) => text.includes(pattern))) {
      hit.push(archetype.label);
    }
  }
  return hit;
}

function getLinkedItems(text: string, items: Item[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (text.includes(item.nameHe)) {
      out.push(item.id);
      continue;
    }

    // Fallback by rough noun for weak OCR/translation consistency.
    if (item.id === "big_gate_key" && text.includes("מפתח")) out.push(item.id);
    if (item.id === "gold_coin" && (text.includes("זהב") || text.includes("מטבע"))) out.push(item.id);
    if (item.id === "provisions" && (text.includes("מזון") || text.includes("אספקה") || text.includes("אוכל"))) {
      out.push(item.id);
    }
    if (item.id === "sword" && (text.includes("חרב") || text.includes("נשק"))) out.push(item.id);
    if (item.id === "bow_and_arrows" && (text.includes("קשת") || text.includes("חצים"))) out.push(item.id);
  }

  return [...new Set(out)];
}

function getLinkedEnemyIdsFromText(text: string, enemies: EnemyDefinition[]): string[] {
  const out: string[] = [];
  for (const enemy of enemies) {
    // Avoid very short enemy names that generate false positives.
    if (enemy.nameHe.length < 4) continue;
    if (text.includes(enemy.nameHe)) out.push(enemy.id);
  }
  return out;
}

function chooseSceneType(
  hasCombat: boolean,
  hasDialogue: boolean,
  hasItemEvent: boolean,
  hasLocationSignal: boolean,
  isTerminalLike: boolean,
): ParagraphPlan["sceneImageType"] {
  if (hasCombat) return "combat";
  if (isTerminalLike) return "ending";
  if (hasDialogue) return "dialogue";
  if (hasItemEvent) return "item";
  if (hasLocationSignal) return "location";
  return "narrative";
}

function chooseTier(params: {
  hasCombat: boolean;
  hasDialogue: boolean;
  hasItemEvent: boolean;
  hasLocationSignal: boolean;
  hasIllustration: boolean;
  isAnchor: boolean;
  isTerminalLike: boolean;
  linkedEnemiesCount: number;
  linkedItemsCount: number;
  npcCount: number;
}): ParagraphPlan["sceneTier"] {
  const {
    hasCombat,
    hasDialogue,
    hasItemEvent,
    hasLocationSignal,
    hasIllustration,
    isAnchor,
    isTerminalLike,
    linkedEnemiesCount,
    linkedItemsCount,
    npcCount,
  } = params;

  if (
    hasCombat ||
    hasIllustration ||
    isAnchor ||
    isTerminalLike ||
    linkedEnemiesCount > 0 ||
    linkedItemsCount > 0 ||
    npcCount > 0
  ) {
    return "mandatory";
  }

  if (hasDialogue || hasItemEvent || hasLocationSignal) {
    return "high";
  }

  return "optional";
}

async function main() {
  const [paragraphs, items, enemies, mapNodes] = await Promise.all([
    loadJson<Paragraph[]>("paragraphs.json"),
    loadJson<Item[]>("items.json"),
    loadJson<EnemyDefinition[]>("enemies.json"),
    loadJson<MapNode[]>("mapNodes.json"),
  ]);

  const mapById = new Map(mapNodes.map((node) => [node.id, node.nameHe]));
  const anchorParagraphIds = new Set<number>([1, 81, 201, 321, 431, 511]);

  const plans: ParagraphPlan[] = [];

  for (const paragraph of paragraphs) {
    const text = paragraph.textHe ?? "";
    const hasCombat = Boolean(paragraph.combat);
    const hasDialogue = /[\"'״«»]/.test(text) || includesAny(text, dialogueKeywords);
    const hasItemEvent = includesAny(text, itemEventKeywords);
    const hasLocationSignal = includesAny(text, locationKeywords);
    const hasIllustration = Boolean(paragraph.illustration?.src);
    const isAnchor = anchorParagraphIds.has(paragraph.id);
    const isTerminalLike = !paragraph.choices?.length;

    const linkedEnemyIds = [
      ...(paragraph.combat?.enemies ?? []),
      ...getLinkedEnemyIdsFromText(text, enemies),
    ].filter((value, index, arr) => arr.indexOf(value) === index);

    const linkedItemIds = getLinkedItems(text, items);
    const npcArchetypes = getNpcArchetypes(text);

    const sceneImageType = chooseSceneType(hasCombat, hasDialogue, hasItemEvent, hasLocationSignal, isTerminalLike);
    const sceneTier = chooseTier({
      hasCombat,
      hasDialogue,
      hasItemEvent,
      hasLocationSignal,
      hasIllustration,
      isAnchor,
      isTerminalLike,
      linkedEnemiesCount: linkedEnemyIds.length,
      linkedItemsCount: linkedItemIds.length,
      npcCount: npcArchetypes.length,
    });

    const reasons: string[] = [];
    if (hasCombat) reasons.push("combat");
    if (hasDialogue) reasons.push("dialogue");
    if (hasItemEvent) reasons.push("item-event");
    if (hasLocationSignal) reasons.push("location-signal");
    if (hasIllustration) reasons.push("already-illustrated");
    if (isAnchor) reasons.push("map-anchor");
    if (isTerminalLike) reasons.push("terminal-or-auto");
    if (linkedEnemyIds.length) reasons.push(`enemies:${linkedEnemyIds.length}`);
    if (linkedItemIds.length) reasons.push(`items:${linkedItemIds.length}`);
    if (npcArchetypes.length) reasons.push(`npc:${npcArchetypes.length}`);

    plans.push({
      paragraphId: paragraph.id,
      locationId: paragraph.locationId,
      title: toShortTitle(paragraph),
      sceneTier,
      sceneImageType,
      placement: {
        paragraphHeaderImage: sceneTier !== "optional",
        characterPortraitRail: linkedEnemyIds.length > 0 || npcArchetypes.length > 0,
        itemIconStrip: linkedItemIds.length > 0,
      },
      reasons,
      linkedEnemyIds,
      npcArchetypes,
      linkedItemIds,
    });
  }

  const enemyUseByCombat = new Map<string, number[]>();
  for (const paragraph of paragraphs) {
    if (!paragraph.combat) continue;
    for (const enemyId of paragraph.combat.enemies) {
      const list = enemyUseByCombat.get(enemyId) ?? [];
      list.push(paragraph.id);
      enemyUseByCombat.set(enemyId, list);
    }
  }

  const itemMentionMap = new Map<string, number[]>();
  for (const item of items) {
    const ids = plans
      .filter((plan) => plan.linkedItemIds.includes(item.id))
      .map((plan) => plan.paragraphId);
    itemMentionMap.set(item.id, ids);
  }

  const mapCoverage = mapNodes.map((node) => ({
    id: node.id,
    nameHe: node.nameHe,
    paragraphCount: node.paragraphIds.length,
    from: Math.min(...node.paragraphIds),
    to: Math.max(...node.paragraphIds),
  }));

  const tierCounts = {
    mandatory: plans.filter((plan) => plan.sceneTier === "mandatory").length,
    high: plans.filter((plan) => plan.sceneTier === "high").length,
    optional: plans.filter((plan) => plan.sceneTier === "optional").length,
  };

  const strictMandatorySet = new Set<number>();
  for (const paragraph of paragraphs) {
    const isAnchor = anchorParagraphIds.has(paragraph.id);
    const hasIllustration = Boolean(paragraph.illustration?.src);
    const isTerminalLike = !paragraph.choices?.length;

    if (paragraph.combat || hasIllustration || isAnchor || isTerminalLike) {
      strictMandatorySet.add(paragraph.id);
    }
  }

  const sceneTypeCounts = {
    combat: plans.filter((plan) => plan.sceneImageType === "combat").length,
    dialogue: plans.filter((plan) => plan.sceneImageType === "dialogue").length,
    item: plans.filter((plan) => plan.sceneImageType === "item").length,
    location: plans.filter((plan) => plan.sceneImageType === "location").length,
    ending: plans.filter((plan) => plan.sceneImageType === "ending").length,
    narrative: plans.filter((plan) => plan.sceneImageType === "narrative").length,
  };

  const mandatoryParagraphIds = plans
    .filter((plan) => plan.sceneTier === "mandatory")
    .map((plan) => plan.paragraphId);

  const importantCharacterAssets = {
    hero: ["hero_warrior", "hero_wizard", "hero_neutral_sheet"],
    enemyPortraits: enemies.map((enemy) => enemy.id),
    npcArchetypes: [...new Set(plans.flatMap((plan) => plan.npcArchetypes))],
  };

  const totalCharacterPortraitsNeeded =
    importantCharacterAssets.hero.length +
    importantCharacterAssets.enemyPortraits.length +
    importantCharacterAssets.npcArchetypes.length;

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      paragraphs: paragraphs.length,
      enemies: enemies.length,
      items: items.length,
      mapNodes: mapNodes.length,
      uniqueLocationIdsInParagraphs: [...new Set(paragraphs.map((paragraph) => paragraph.locationId))].length,
      combatParagraphs: paragraphs.filter((paragraph) => Boolean(paragraph.combat)).length,
      uniqueEnemiesInCombatParagraphs: [...enemyUseByCombat.keys()].length,
      itemReferencesInData: paragraphs.filter((paragraph) => (paragraph.effects?.length ?? 0) > 0).length,
      testParagraphs: paragraphs.filter((paragraph) => Boolean(paragraph.test)).length,
      tierCounts,
      strictMandatorySceneImageParagraphs: strictMandatorySet.size,
      strictMandatoryParagraphIds: [...strictMandatorySet].sort((a, b) => a - b),
      sceneTypeCounts,
      totalCharacterPortraitsNeeded,
      totalItemIconsNeeded: items.length,
      mandatorySceneImageParagraphs: mandatoryParagraphIds.length,
      mandatoryParagraphIds,
    },
    mapCoverage,
    enemies: enemies.map((enemy) => ({
      id: enemy.id,
      nameHe: enemy.nameHe,
      skill: enemy.skill,
      stamina: enemy.stamina,
      specialRules: enemy.specialRules,
      combatParagraphs: enemyUseByCombat.get(enemy.id) ?? [],
      combatAppearances: (enemyUseByCombat.get(enemy.id) ?? []).length,
    })),
    items: items.map((item) => ({
      id: item.id,
      nameHe: item.nameHe,
      type: item.type,
      usableInCombat: item.usableInCombat,
      oneTimeUse: item.oneTimeUse ?? false,
      mentionedInParagraphs: itemMentionMap.get(item.id) ?? [],
      mentionCount: (itemMentionMap.get(item.id) ?? []).length,
      descriptionHe: item.descriptionHe,
    })),
    characterAssetPlan: importantCharacterAssets,
    paragraphVisualPlan: plans,
  };

  await mkdir(OUT_DIR, { recursive: true });

  const jsonPath = path.join(OUT_DIR, "deep-research-report.json");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines: string[] = [];
  lines.push("# דוח מחקר עומק - ספר המשחק (511 פסקאות)");
  lines.push("");
  lines.push(`- סה\"כ פסקאות: **${report.summary.paragraphs}**`);
  lines.push(`- סה\"כ אויבים: **${report.summary.enemies}**`);
  lines.push(`- סה\"כ קרבות (פסקאות combat): **${report.summary.combatParagraphs}**`);
  lines.push(`- סה\"כ אייטמים: **${report.summary.items}**`);
  lines.push(`- סה\"כ מקומות (map nodes): **${report.summary.mapNodes}**`);
  lines.push(`- סצנות שחובה תמונת פסקה (Tier חובה): **${report.summary.mandatorySceneImageParagraphs}**`);
  lines.push(`- סצנות חובה קשיחה (מבנה מנוע): **${report.summary.strictMandatorySceneImageParagraphs}**`);
  lines.push(`- סצנות חשובות (Tier גבוה): **${report.summary.tierCounts.high}**`);
  lines.push(`- סצנות אופציונליות: **${report.summary.tierCounts.optional}**`);
  lines.push(`- סה\"כ פורטרטים לדמויות (גיבור+אויבים+ארכיטיפי NPC): **${report.summary.totalCharacterPortraitsNeeded}**`);
  lines.push(`- סה\"כ אייקוני אייטמים: **${report.summary.totalItemIconsNeeded}**`);
  lines.push("");

  lines.push("## חלוקת סצנות לפי סוג תמונה");
  lines.push(`- קרב: ${report.summary.sceneTypeCounts.combat}`);
  lines.push(`- דיאלוג: ${report.summary.sceneTypeCounts.dialogue}`);
  lines.push(`- אייטם: ${report.summary.sceneTypeCounts.item}`);
  lines.push(`- לוקיישן: ${report.summary.sceneTypeCounts.location}`);
  lines.push(`- סיום/קטע סגור: ${report.summary.sceneTypeCounts.ending}`);
  lines.push(`- נרטיבי כללי: ${report.summary.sceneTypeCounts.narrative}`);
  lines.push("");

  lines.push("## תמונות חובה לדמויות");
  lines.push(`- גיבורים: ${importantCharacterAssets.hero.join(", ")}`);
  lines.push(`- אויבים (${importantCharacterAssets.enemyPortraits.length}): ${importantCharacterAssets.enemyPortraits.join(", ")}`);
  lines.push(`- ארכיטיפי NPC (${importantCharacterAssets.npcArchetypes.length}): ${importantCharacterAssets.npcArchetypes.join(", ")}`);
  lines.push("");

  lines.push("## רשימת קרבות מלאה");
  for (const paragraph of paragraphs.filter((paragraph) => Boolean(paragraph.combat))) {
    const enemyNames = (paragraph.combat?.enemies ?? [])
      .map((enemyId) => enemies.find((enemy) => enemy.id === enemyId)?.nameHe ?? enemyId)
      .join(", ");
    lines.push(`- פסקה ${paragraph.id}: ${enemyNames} -> ניצחון: ${paragraph.combat?.onWin}, הפסד: ${paragraph.combat?.onLose}`);
  }
  lines.push("");

  lines.push("## כיסוי מקומות (Map)");
  for (const coverage of mapCoverage) {
    lines.push(`- ${coverage.nameHe} (${coverage.id}): פסקאות ${coverage.from}-${coverage.to} (${coverage.paragraphCount})`);
  }
  lines.push("");

  lines.push("## פסקאות חובה לתמונה (Tier חובה)");
  lines.push(mandatoryParagraphIds.join(", "));
  lines.push("");

  lines.push("## פסקאות חובה קשיחה (מבנה מנוע)");
  lines.push(report.summary.strictMandatoryParagraphIds.join(", "));
  lines.push("");

  lines.push("## תוכנית ויזואלית מלאה לכל 511 פסקאות");
  lines.push("| פסקה | מקום | Tier | סוג תמונה | דמויות | אייטמים | מיקום UI | סיבות | כותרת | ");
  lines.push("|---|---|---|---|---|---|---|---|---|");

  for (const plan of plans) {
    const nodeName = mapById.get(plan.locationId) ?? plan.locationId;
    const charList = [...plan.linkedEnemyIds, ...plan.npcArchetypes].join(", ") || "-";
    const itemList = plan.linkedItemIds.join(", ") || "-";
    const placement = [
      plan.placement.paragraphHeaderImage ? "header" : "-",
      plan.placement.characterPortraitRail ? "characters" : "-",
      plan.placement.itemIconStrip ? "items" : "-",
    ]
      .filter((value) => value !== "-")
      .join("+") || "-";

    lines.push(
      `| ${plan.paragraphId} | ${nodeName} | ${plan.sceneTier} | ${plan.sceneImageType} | ${charList} | ${itemList} | ${placement} | ${plan.reasons.join(", ")} | ${plan.title.replace(/\|/g, "\\|")} |`,
    );
  }

  const mdPath = path.join(OUT_DIR, "deep-research-report-he.md");
  await writeFile(mdPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`DEEP_RESEARCH_OK json=${jsonPath} md=${mdPath}`);
}

main().catch((error) => {
  console.error("DEEP_RESEARCH_FAIL");
  console.error(error);
  process.exit(1);
});
