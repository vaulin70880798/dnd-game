import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { EnemyDefinition } from "../types/combat";
import type { Paragraph } from "../types/paragraph";

interface EnemyRecord extends EnemyDefinition {
  sourceParagraphIds: number[];
}

const PARAGRAPHS_PATH = path.join(process.cwd(), "data", "paragraphs.json");
const ENEMIES_PATH = path.join(process.cwd(), "data", "enemies.json");

function normalizeName(raw: string): string {
  return raw
    .replace(/[«»"'.,:;!?()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEnemyRows(text: string): Array<{ name: string; skill: number; stamina: number }> {
  const rows: Array<{ name: string; skill: number; stamina: number }> = [];

  if (!/МАСТЕРСТВО\s+ВЫНОСЛИВОСТЬ/i.test(text)) {
    return rows;
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  let tableStarted = false;

  for (const line of lines) {
    if (/МАСТЕРСТВО\s+ВЫНОСЛИВОСТЬ/i.test(line)) {
      tableStarted = true;
      continue;
    }

    if (!tableStarted) continue;

    const match = line.match(/^([A-ZА-ЯЁ0-9\-\s]+?)\s+(\d{1,2})\s+(\d{1,2})$/u);
    if (!match) {
      // Stop after first table block once it ends.
      if (rows.length > 0 && /[a-zа-яё]/iu.test(line)) {
        break;
      }
      continue;
    }

    const name = normalizeName(match[1]);
    const skill = Number(match[2]);
    const stamina = Number(match[3]);

    if (!name || Number.isNaN(skill) || Number.isNaN(stamina)) {
      continue;
    }

    rows.push({ name, skill, stamina });
  }

  return rows;
}

async function main() {
  const paragraphs = JSON.parse(await readFile(PARAGRAPHS_PATH, "utf8")) as Paragraph[];

  const map = new Map<string, EnemyRecord>();
  let seq = 1;

  for (const paragraph of paragraphs) {
    const rows = extractEnemyRows(paragraph.textHe);

    for (const row of rows) {
      const key = `${row.name}__${row.skill}__${row.stamina}`;
      if (!map.has(key)) {
        map.set(key, {
          id: `enemy_${String(seq).padStart(3, "0")}`,
          nameHe: row.name,
          skill: row.skill,
          stamina: row.stamina,
          armor: 0,
          damageOnHit: 2,
          specialRules: [],
          sourceParagraphIds: [paragraph.id],
        });
        seq += 1;
      } else {
        const existing = map.get(key)!;
        if (!existing.sourceParagraphIds.includes(paragraph.id)) {
          existing.sourceParagraphIds.push(paragraph.id);
        }
      }
    }
  }

  const enemies = Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(ENEMIES_PATH, `${JSON.stringify(enemies, null, 2)}\n`, "utf8");

  console.log(`ENEMIES_EXTRACTED count=${enemies.length}`);
}

main().catch((error) => {
  console.error("ENEMIES_EXTRACT_FAILED");
  console.error(error);
  process.exit(1);
});
