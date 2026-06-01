import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EnemyDefinition } from "../types/combat";
import type { Item } from "../types/item";
import type { Paragraph } from "../types/paragraph";

interface DeepResearchReport {
  characterAssetPlan: {
    hero: string[];
    enemyPortraits: string[];
    npcArchetypes: string[];
  };
  paragraphVisualPlan: Array<{
    paragraphId: number;
    locationId: string;
    title: string;
    sceneTier: "mandatory" | "high" | "optional";
    sceneImageType: "combat" | "dialogue" | "item" | "location" | "ending" | "narrative";
    linkedEnemyIds: string[];
    npcArchetypes: string[];
    linkedItemIds: string[];
  }>;
}

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

interface JsonlJob {
  prompt: string;
  out: string;
  use_case?: string;
  style?: string;
  composition?: string;
  lighting?: string;
  palette?: string;
  constraints?: string;
  negative?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
}

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const REPORT_PATH = path.join(ROOT, "reports", "deep-research-report.json");
const JOBS_DIR = path.join(ROOT, "scripts", "generated");
const JOBS_PATH = path.join(JOBS_DIR, "visual-jobs-medium.jsonl");
const VISUAL_PLAN_PATH = path.join(DATA_DIR, "visualPlan.json");
const NPC_PROFILES_PATH = path.join(DATA_DIR, "npcProfiles.json");

const SHARED_STYLE =
  "dark fantasy illustrated game art, hand-painted style, cohesive visual language across all assets, cinematic lighting, rich texture, no text overlay, no watermark";
const SHARED_NEGATIVE =
  "modern city, sci-fi, anime style, blurry details, low contrast, watermark, logo, UI labels, text";

const NPC_ID_BY_LABEL: Record<string, string> = {
  "שומרים": "npc_guards",
  "שודד": "npc_bandit",
  "אמן": "npc_artist",
  "זקן": "npc_elder",
  "אלוף זירה": "npc_arena_champion",
  "ברברי": "npc_barbarian",
  "גבר": "npc_common_man",
  "כוהן": "npc_priest",
  "מכשף": "npc_sorcerer",
  "קבצן": "npc_beggar",
  "אישה": "npc_common_woman",
  "ילד": "npc_child",
  "סוחר": "npc_merchant",
  "מלך": "npc_king",
  "בעל פונדק": "npc_innkeeper",
  "לוחם": "npc_fighter",
  "כרוז": "npc_herald",
};

const NPC_SUMMARY_BY_LABEL: Record<string, string> = {
  "שומרים": "שומרי העיר הממושטרים בשערים וברחובות, חשדניים אך ניתנים לשכנוע או שוחד.",
  "שודד": "עבריין רחוב ערמומי שפועל מהצללים ומחפש הזדמנות מהירה לרווח.",
  "אמן": "אמן מקומי עם כשרון יוצא דופן, לעיתים משלב קסם מסוכן בתוך יצירותיו.",
  "זקן": "זקן מקומי שמחזיק שמועות, עצות או מלכודות מוסריות בהתאם לדרך הפעולה שלך.",
  "אלוף זירה": "לוחם מנוסה שמייצג כוח, כבוד והימורים בזירת הקרבות של חאר.",
  "ברברי": "לוחם פראי וחזק שתוקף ישירות בלי תחכום, אך עם עוצמה גבוהה.",
  "גבר": "דמות אזרחית גברית מהעיר, לעיתים מועילה ולעיתים מסתירה כוונה אחרת.",
  "כוהן": "איש דת או פולחן שמציע ברכה, מידע או דרישה תמורת אמון ומשאבים.",
  "מכשף": "מטיל לחשים עם ידע מסוכן, עשוי לספק כוח או להכניס אותך לסיכון קסום.",
  "קבצן": "עני רחוב חד־עין שיודע יותר ממה שנראה, ולעיתים מחזיק רמז קריטי.",
  "אישה": "דמות אזרחית נשית בחאר, יכולה להיות מקור עזרה, פיתוי או הונאה.",
  "ילד": "ילד רחוב זריז שמבחין בפרטים קטנים ויכול להכווין אותך בדרכים לא צפויות.",
  "סוחר": "סוחר מקומי שמציע סחורה, עסקאות או מידע תמורת תשלום או שירות.",
  "מלך": "דמות סמכותית נדירה שמסמלת עוצמה פוליטית או איום אסטרטגי.",
  "בעל פונדק": "מנהל פונדק שמספק מנוחה, רכילות והזדמנויות מסוכנות מאחורי הקלעים.",
  "לוחם": "איש קרב מיומן שמבחן הכוח מולו קובע גורל התקדמות או נסיגה.",
  "כרוז": "מודיע רשמי בזירה או ברחוב שמכוון קהל, הימורים וסדר אירועים.",
};

function toThreeDigit(id: number): string {
  return String(id).padStart(3, "0");
}

function locationHeFromId(locationId: string): string {
  switch (locationId) {
    case "khar_gate":
      return "שער דרום של חאר";
    case "khar_streets":
      return "רחובות חאר";
    case "khar_markets":
      return "שווקים ושכונות עוני";
    case "khar_walls":
      return "השכונות הצפוניות";
    case "baklands_gate":
      return "הדרך לבאקלנד";
    default:
      return "אזור לא מזוהה בחאר";
  }
}

function pickScenePrompt(sceneType: VisualPlanEntry["sceneType"]): {
  composition: string;
  lighting: string;
  palette: string;
} {
  switch (sceneType) {
    case "combat":
      return {
        composition: "dynamic action scene, central confrontation, motion and impact visible",
        lighting: "high contrast dramatic torch and moon light",
        palette: "charcoal black, bronze, blood red accents, steel blue",
      };
    case "dialogue":
      return {
        composition: "two to three characters in interaction, clear facial expressions, medium shot",
        lighting: "moody warm side lighting with subtle ambient shadows",
        palette: "dark brown, amber highlights, muted olive",
      };
    case "item":
      return {
        composition: "narrative still life focused on key object in scene context",
        lighting: "focused spotlight over key object",
        palette: "parchment gold, deep brown, desaturated cyan accent",
      };
    case "location":
      return {
        composition: "wide establishing shot of environment and path choices",
        lighting: "cinematic dusk lighting with atmospheric fog",
        palette: "sepia parchment tones, dark stone gray, amber lamps",
      };
    case "ending":
      return {
        composition: "final decisive moment with symbolic gate or fate transition",
        lighting: "epic directional light with strong silhouettes",
        palette: "obsidian black, antique gold, pale moon gray",
      };
    case "narrative":
    default:
      return {
        composition: "focused narrative scene with strong central subject",
        lighting: "balanced dramatic fantasy light",
        palette: "earth brown, old parchment, dark teal shadows",
      };
  }
}

function safeEnemyName(enemyId: string, enemiesById: Record<string, EnemyDefinition>): string {
  return enemiesById[enemyId]?.nameHe ?? enemyId;
}

async function main() {
  const [reportRaw, paragraphsRaw, enemiesRaw, itemsRaw] = await Promise.all([
    readFile(REPORT_PATH, "utf8"),
    readFile(path.join(DATA_DIR, "paragraphs.json"), "utf8"),
    readFile(path.join(DATA_DIR, "enemies.json"), "utf8"),
    readFile(path.join(DATA_DIR, "items.json"), "utf8"),
  ]);

  const report = JSON.parse(reportRaw) as DeepResearchReport;
  const paragraphs = JSON.parse(paragraphsRaw) as Paragraph[];
  const enemies = JSON.parse(enemiesRaw) as EnemyDefinition[];
  const items = JSON.parse(itemsRaw) as Item[];

  const paragraphById = Object.fromEntries(paragraphs.map((paragraph) => [paragraph.id, paragraph])) as Record<number, Paragraph>;
  const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>;

  const jobs: JsonlJob[] = [];
  const visualPlan: VisualPlanEntry[] = [];

  const tiersForHeader = new Set<VisualPlanEntry["tier"]>(["mandatory", "high"]);

  for (const planEntry of report.paragraphVisualPlan) {
    const paragraph = paragraphById[planEntry.paragraphId];
    if (!paragraph) continue;

    const npcIds = planEntry.npcArchetypes
      .map((label) => NPC_ID_BY_LABEL[label])
      .filter((value): value is string => Boolean(value));

    const imageSrc = tiersForHeader.has(planEntry.sceneTier)
      ? `/assets/generated/paragraphs/p${toThreeDigit(planEntry.paragraphId)}-scene.png`
      : undefined;

    visualPlan.push({
      paragraphId: planEntry.paragraphId,
      tier: planEntry.sceneTier,
      sceneType: planEntry.sceneImageType,
      imageSrc,
      imageAltHe: `איור לפסקה ${planEntry.paragraphId}`,
      captionHe: `${planEntry.title}`,
      enemyIds: planEntry.linkedEnemyIds,
      npcIds,
      itemIds: planEntry.linkedItemIds,
    });

    if (!imageSrc) continue;

    const sceneFlavor = pickScenePrompt(planEntry.sceneImageType);
    const enemyNames = planEntry.linkedEnemyIds.map((enemyId) => safeEnemyName(enemyId, enemiesById)).join(", ");
    const npcNames = planEntry.npcArchetypes.join(", ");
    const itemNames = planEntry.linkedItemIds
      .map((itemId) => items.find((item) => item.id === itemId)?.nameHe ?? itemId)
      .join(", ");

    const excerpt = (paragraph.textHe || "").replace(/\s+/g, " ").slice(0, 260);

    jobs.push({
      out: `paragraphs/p${toThreeDigit(planEntry.paragraphId)}-scene.png`,
      size: "1024x1024",
      prompt: [
        `Gamebook paragraph ${planEntry.paragraphId} scene in ${locationHeFromId(planEntry.locationId)}.`,
        `Title idea: ${planEntry.title}.`,
        enemyNames ? `Characters/enemies present: ${enemyNames}.` : "",
        npcNames ? `NPC archetypes present: ${npcNames}.` : "",
        itemNames ? `Important items in scene: ${itemNames}.` : "",
        excerpt ? `Narrative excerpt: ${excerpt}` : "",
        "Keep the mood dangerous, adventurous, and medieval fantasy.",
      ]
        .filter(Boolean)
        .join("\n"),
      use_case: "illustration-story",
      style: SHARED_STYLE,
      composition: sceneFlavor.composition,
      lighting: sceneFlavor.lighting,
      palette: sceneFlavor.palette,
      constraints:
        "single coherent scene, no text in image, no UI chrome, must fit Hebrew fantasy game atmosphere",
      negative: SHARED_NEGATIVE,
    });
  }

  const npcProfiles: NpcProfile[] = report.characterAssetPlan.npcArchetypes
    .map((labelHe) => {
      const id = NPC_ID_BY_LABEL[labelHe];
      if (!id) return null;

      const imageSrc = `/assets/generated/characters/${id}.png`;
      return {
        id,
        labelHe,
        summaryHe: NPC_SUMMARY_BY_LABEL[labelHe] ?? `דמות משנה מסוג ${labelHe} בעולם חאר.`,
        imageSrc,
      } as NpcProfile;
    })
    .filter((profile): profile is NpcProfile => Boolean(profile));

  for (const enemy of enemies) {
    jobs.push({
      out: `characters/${enemy.id}.png`,
      size: "1024x1024",
      prompt: [
        `Portrait of enemy from a dark fantasy gamebook: ${enemy.nameHe}.`,
        `Combat profile: skill ${enemy.skill}, stamina ${enemy.stamina}.`,
        enemy.specialRules.length ? `Traits: ${enemy.specialRules.join(" ")}` : "",
        "Head and shoulders portrait, menacing but clear silhouette, black background vignette for UI card.",
      ]
        .filter(Boolean)
        .join("\n"),
      use_case: "stylized-concept",
      style: SHARED_STYLE,
      composition: "portrait bust, centered, readable expression",
      lighting: "dramatic rim lighting with shadow depth",
      palette: "dark neutrals with controlled color accent",
      constraints: "single character portrait, no text, no watermark",
      negative: SHARED_NEGATIVE,
    });
  }

  for (const npc of npcProfiles) {
    jobs.push({
      out: `characters/${npc.id}.png`,
      size: "1024x1024",
      prompt: [
        `Portrait of NPC archetype for a dark fantasy city game: ${npc.labelHe}.`,
        npc.summaryHe,
        "Head and shoulders portrait suitable for dialogue side panel.",
      ].join("\n"),
      use_case: "stylized-concept",
      style: SHARED_STYLE,
      composition: "portrait bust, centered, clear facial storytelling",
      lighting: "cinematic portrait lighting with warm and cold contrast",
      palette: "aged bronze, charcoal, muted skin tones",
      constraints: "single character only, no text, no watermark",
      negative: SHARED_NEGATIVE,
    });
  }

  const heroPrompts: Array<{ id: string; prompt: string }> = [
    {
      id: "hero_warrior",
      prompt:
        "Portrait of the player hero as a seasoned warrior from Analand, rugged cloak, steel sword hilt visible, determined eyes, dark fantasy style.",
    },
    {
      id: "hero_wizard",
      prompt:
        "Portrait of the player hero as a battle wizard from Analand, hooded robe, faint rune glow around hands, intelligent focused expression, dark fantasy style.",
    },
    {
      id: "hero_neutral_sheet",
      prompt:
        "Neutral character portrait for gamebook character sheet, adventurer with balanced warrior-wizard aesthetic, ready for choices and danger.",
    },
  ];

  for (const hero of heroPrompts) {
    jobs.push({
      out: `characters/${hero.id}.png`,
      size: "1024x1024",
      prompt: hero.prompt,
      use_case: "stylized-concept",
      style: SHARED_STYLE,
      composition: "portrait bust, centered, clean frame for UI",
      lighting: "dramatic but readable warm-cool mixed light",
      palette: "earth brown, steel gray, antique gold",
      constraints: "single hero portrait, no text, no watermark",
      negative: SHARED_NEGATIVE,
    });
  }

  for (const item of items) {
    jobs.push({
      out: `items/${item.id}.png`,
      size: "1024x1024",
      prompt: [
        `Single-item icon illustration for dark fantasy game inventory: ${item.nameHe}.`,
        item.descriptionHe,
        "Object centered, clean transparent-friendly background feel, strong silhouette for small icon usage.",
      ].join("\n"),
      use_case: "product-mockup",
      style: SHARED_STYLE,
      composition: "single centered object, icon readability",
      lighting: "controlled studio-like fantasy lighting",
      palette: "antique metal and leather tones",
      constraints: "one item only, no text, no watermark, clear icon",
      negative: SHARED_NEGATIVE,
    });
  }

  await mkdir(JOBS_DIR, { recursive: true });

  const jsonl = jobs.map((job) => JSON.stringify(job)).join("\n") + "\n";
  await writeFile(JOBS_PATH, jsonl, "utf8");

  await writeFile(VISUAL_PLAN_PATH, `${JSON.stringify(visualPlan, null, 2)}\n`, "utf8");
  await writeFile(NPC_PROFILES_PATH, `${JSON.stringify(npcProfiles, null, 2)}\n`, "utf8");

  const paragraphImages = visualPlan.filter((entry) => entry.imageSrc).length;
  const portraits = enemies.length + npcProfiles.length + heroPrompts.length;
  const itemIcons = items.length;

  console.log(
    `VISUAL_PLAN_OK paragraphImages=${paragraphImages} portraits=${portraits} itemIcons=${itemIcons} total=${jobs.length} jobs=${JOBS_PATH}`,
  );
}

main().catch((error) => {
  console.error("VISUAL_PLAN_FAIL");
  console.error(error);
  process.exit(1);
});
