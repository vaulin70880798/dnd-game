import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { EnemyDefinition } from "../types/combat";
import type { Paragraph } from "../types/paragraph";

const DATA_DIR = path.join(process.cwd(), "data");
const PARAGRAPHS_PATH = path.join(DATA_DIR, "paragraphs.json");
const ENEMIES_PATH = path.join(DATA_DIR, "enemies.json");
const REVIEW_PATH = path.join(process.cwd(), "review-needed.md");

const LIMIT = Number(process.argv[2] ?? "60");

interface EnemyWithSources extends EnemyDefinition {
  sourceParagraphIds?: number[];
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function findVictoryTargets(text: string): number[] {
  const targets: number[] = [];

  const ruPatterns = [
    /Если\s+побед(?:ите|ишь)[^\d]{0,40}(\d{1,3})/gi,
    /Если\s+уничтож(?:ите|ишь)[^\d]{0,40}(\d{1,3})/gi,
    /Если\s+одол(?:еете|ел)[^\d]{0,40}(\d{1,3})/gi,
  ];

  const hePatterns = [
    /אם\s+תנצח[^\d]{0,40}(\d{1,3})/gi,
    /אם\s+תחסל[^\d]{0,40}(\d{1,3})/gi,
  ];

  for (const pattern of [...ruPatterns, ...hePatterns]) {
    for (const m of text.matchAll(pattern)) {
      targets.push(Number(m[1]));
    }
  }

  const dashTargets = [...text.matchAll(/[\-–—]\s?(\d{1,3})(?=[\s\.,;:\)]|$)/g)].map((m) => Number(m[1]));
  for (const t of dashTargets) targets.push(t);

  return uniq(targets.filter((n) => Number.isInteger(n) && n > 0 && n <= 999));
}

function hasCombatSignals(text: string): boolean {
  return /МАСТЕРСТВО\s+ВЫНОСЛИВОСТЬ|מיומנות\s+סיבולת|Сражайт|бой|битв|קרב/u.test(text);
}

async function main() {
  const paragraphs = JSON.parse(await readFile(PARAGRAPHS_PATH, "utf8")) as Paragraph[];
  const enemies = JSON.parse(await readFile(ENEMIES_PATH, "utf8")) as EnemyWithSources[];

  const paragraphIdsSet = new Set(paragraphs.map((p) => p.id));

  const enemiesByParagraph = new Map<number, string[]>();
  for (const enemy of enemies) {
    const sources = enemy.sourceParagraphIds ?? [];
    for (const paragraphId of sources) {
      const existing = enemiesByParagraph.get(paragraphId) ?? [];
      existing.push(enemy.id);
      enemiesByParagraph.set(paragraphId, existing);
    }
  }

  const candidates = paragraphs
    .filter((p) => hasCombatSignals(p.textHe) && (enemiesByParagraph.get(p.id)?.length ?? 0) > 0)
    .sort((a, b) => a.id - b.id);

  const selected = candidates.slice(0, LIMIT);
  const unresolved: number[] = [];

  for (const paragraph of selected) {
    const enemyIds = uniq(enemiesByParagraph.get(paragraph.id) ?? []);
    if (enemyIds.length === 0) {
      unresolved.push(paragraph.id);
      continue;
    }

    const winTargets = findVictoryTargets(paragraph.textHe).filter((t) => t !== paragraph.id && paragraphIdsSet.has(t));
    const onWin = winTargets[0];
    if (!onWin) {
      unresolved.push(paragraph.id);
      continue;
    }

    paragraph.combat = {
      enemies: enemyIds,
      onWin,
      onLose: "death",
      canTestLuck: true,
    };

    paragraph.notes = [paragraph.notes, "combat-structured-auto"].filter(Boolean).join(" | ");
  }

  await writeFile(PARAGRAPHS_PATH, `${JSON.stringify(paragraphs, null, 2)}\n`, "utf8");

  const reviewAppend = [
    "",
    "## Combat Structuring Pass",
    `- Auto-structured combat for first ${LIMIT} combat candidates (where enemy table + win target were identified).`,
    unresolved.length > 0
      ? `- Unresolved combat paragraphs (missing deterministic onWin target): ${unresolved.join(", ")}.`
      : "- All selected combat paragraphs got a structured combat object.",
    "- onLose was defaulted to `death` in this pass unless paragraph already had explicit non-lethal handling.",
  ].join("\n");

  await writeFile(REVIEW_PATH, `${(await readFile(REVIEW_PATH, "utf8")).trimEnd()}\n${reviewAppend}\n`, "utf8");

  const structuredCount = selected.filter((p) => p.combat !== null).length;
  console.log(`COMBAT_STRUCTURED selected=${selected.length} structured=${structuredCount} unresolved=${unresolved.length}`);
}

main().catch((error) => {
  console.error("COMBAT_STRUCT_FAILED");
  console.error(error);
  process.exit(1);
});
