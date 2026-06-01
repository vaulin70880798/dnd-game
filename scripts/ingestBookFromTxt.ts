import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { Paragraph, Choice } from "../types/paragraph";
import type { MapNode } from "../types/map";

interface CandidateHeader {
  index: number;
  id: number;
}

interface ExtractResult {
  paragraphs: Paragraph[];
  unresolvedCombatParagraphIds: number[];
  unresolvedSpellParagraphIds: number[];
  suspiciousParagraphIds: number[];
}

const SOURCE_TXT = process.argv[2] ??
  path.join(process.cwd(), "data", "source", "khare-ru-ocr.txt");

const OUT_DIR = path.join(process.cwd(), "data");
const REVIEW_PATH = path.join(process.cwd(), "review-needed.md");
const QUESTIONS_PATH = path.join(process.cwd(), "questions-for-user.md");

function normalizeLine(line: string): string {
  return line
    .replace(/\u000c/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNumericLine(line: string): boolean {
  return /^\d{1,3}$/.test(line.trim());
}

function findNextNonEmpty(lines: string[], from: number): number {
  for (let i = from; i < lines.length; i += 1) {
    if (normalizeLine(lines[i]).length > 0) return i;
  }
  return -1;
}

function collectCandidateHeaders(lines: string[]): CandidateHeader[] {
  const candidates: CandidateHeader[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = normalizeLine(lines[i]);
    if (!isNumericLine(current)) continue;

    const id = Number(current);
    if (id < 1 || id > 999) continue;

    const nextIndex = findNextNonEmpty(lines, i + 1);
    if (nextIndex === -1) continue;

    const nextLine = normalizeLine(lines[nextIndex]);
    if (isNumericLine(nextLine)) {
      // Page number / OCR noise before real paragraph id.
      continue;
    }

    candidates.push({ index: i, id });
  }

  return candidates;
}

function longestIncreasingById(candidates: CandidateHeader[]): CandidateHeader[] {
  if (candidates.length === 0) return [];

  const n = candidates.length;
  const dp = Array(n).fill(1);
  const prev = Array(n).fill(-1);

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (candidates[j].id < candidates[i].id && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
  }

  let best = 0;
  for (let i = 1; i < n; i += 1) {
    if (dp[i] > dp[best]) best = i;
  }

  const chain: CandidateHeader[] = [];
  let cursor = best;
  while (cursor !== -1) {
    chain.push(candidates[cursor]);
    cursor = prev[cursor];
  }

  return chain.reverse();
}

function cleanParagraphText(raw: string): string {
  return raw
    .replace(/\u000c/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractReferenceTargets(raw: string, minId: number, maxId: number): number[] {
  const targets: number[] = [];

  const pushTarget = (value: number) => {
    if (value >= minId && value <= maxId) {
      targets.push(value);
    }
  };

  // (178)
  const parenPattern = /\((\d{1,3})\)/g;
  for (const match of raw.matchAll(parenPattern)) {
    pushTarget(Number(match[1]));
  }

  // -160 / – 237 / —105
  const dashPattern = /[\-–—]\s?(\d{1,3})(?=[\s\.,;:\)]|$)/g;
  for (const match of raw.matchAll(dashPattern)) {
    pushTarget(Number(match[1]));
  }

  // Single target in forms like "Если победите 105."
  const victoryPattern = /(Если\s+(?:победите|победишь|выиграете|выиграешь|уничтожите)[^\d]{0,20})(\d{1,3})/gi;
  for (const match of raw.matchAll(victoryPattern)) {
    pushTarget(Number(match[2]));
  }

  return targets;
}

function uniqOrdered(values: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function choicesFromTargets(paragraphId: number, targets: number[]): Choice[] {
  return targets.map((target, index) => ({
    id: `p${paragraphId}_c${index + 1}`,
    label: `Перейти к параграфу ${target}`,
    target,
  }));
}

function extractParagraphs(fullText: string): ExtractResult {
  const preprocessed = fullText
    .replace(/\r/g, "")
    .replace(/\u000c/g, "\n")
    // OCR часто склеивает номер параграфа и первую строку.
    .replace(/(^|\n)(\d{1,3})\s+(?=[^\s\d.\-])/g, "$1$2\n");

  const lines = preprocessed.split("\n");
  const candidates = collectCandidateHeaders(lines);
  const headers = longestIncreasingById(candidates);

  if (headers.length === 0) {
    throw new Error("Не удалось найти заголовки параграфов в исходном тексте.");
  }

  const minId = headers[0].id;
  const maxId = headers[headers.length - 1].id;

  const paragraphs: Paragraph[] = [];
  const unresolvedCombatParagraphIds: number[] = [];
  const unresolvedSpellParagraphIds: number[] = [];
  const suspiciousParagraphIds: number[] = [];

  for (let i = 0; i < headers.length; i += 1) {
    const current = headers[i];
    const next = headers[i + 1];

    const from = current.index + 1;
    const to = next ? next.index : lines.length;

    const body = lines.slice(from, to).join("\n");
    const cleaned = cleanParagraphText(body);

    const targets = uniqOrdered(extractReferenceTargets(cleaned, minId, maxId).filter((target) => target !== current.id));
    const choices = choicesFromTargets(current.id, targets);

    const title = cleaned.split("\n")[0]?.slice(0, 72) || `Параграф ${current.id}`;

    if (/МАСТЕРСТВО\s+ВЫНОСЛИВОСТЬ/i.test(cleaned) || /Сражайтесь|бой|битв/i.test(cleaned)) {
      unresolvedCombatParagraphIds.push(current.id);
    }

    if (/заклинани|spell|BAM|BIG|HUF|DOP|HOT|MAG|FAR|GOB|FOF|SUS|JIG|ROK|YOB|NIF|YAZ/i.test(cleaned)) {
      unresolvedSpellParagraphIds.push(current.id);
    }

    if (choices.length === 0 && !/умирает|погибли|кончается|заканчивается здесь/i.test(cleaned)) {
      suspiciousParagraphIds.push(current.id);
    }

    paragraphs.push({
      id: current.id,
      title,
      locationId: "khar_unknown",
      textHe: cleaned,
      textOriginal: cleaned,
      choices,
      effects: [],
      combat: null,
      test: null,
      notes: "auto-ingested-from-russian-ocr",
    });
  }

  const paragraphIdSet = new Set(paragraphs.map((paragraph) => paragraph.id));
  const referencedTargets = new Set<number>();
  for (const paragraph of paragraphs) {
    for (const choice of paragraph.choices) {
      referencedTargets.add(choice.target);
    }
  }

  for (const target of referencedTargets) {
    if (paragraphIdSet.has(target)) continue;
    paragraphIdSet.add(target);
    paragraphs.push({
      id: target,
      title: `Параграф ${target} (восстановление требуется)`,
      locationId: "khar_unknown",
      textHe: "Этот параграф не удалось извлечь из OCR-источника. Требуется ручная проверка по оригиналу.",
      textOriginal: "",
      choices: [],
      effects: [],
      combat: null,
      test: null,
      notes: "placeholder-missing-in-ocr",
    });
    suspiciousParagraphIds.push(target);
  }

  paragraphs.sort((a, b) => a.id - b.id);

  return {
    paragraphs,
    unresolvedCombatParagraphIds: uniqOrdered(unresolvedCombatParagraphIds),
    unresolvedSpellParagraphIds: uniqOrdered(unresolvedSpellParagraphIds),
    suspiciousParagraphIds: uniqOrdered(suspiciousParagraphIds),
  };
}

function buildMapNodes(paragraphs: Paragraph[]): MapNode[] {
  const ids = paragraphs.map((p) => p.id).sort((a, b) => a - b);
  const min = ids[0];
  const max = ids[ids.length - 1];

  const chunks: Array<{ id: string; nameHe: string; from: number; to: number; x: number; y: number }> = [
    { id: "khar_gate", nameHe: "Южные врата", from: min, to: Math.min(max, min + 79), x: 12, y: 52 },
    { id: "khar_streets", nameHe: "Улицы Хара", from: min + 80, to: Math.min(max, min + 199), x: 34, y: 45 },
    { id: "khar_markets", nameHe: "Рынки и трущобы", from: min + 200, to: Math.min(max, min + 319), x: 54, y: 36 },
    { id: "khar_walls", nameHe: "Северные кварталы", from: min + 320, to: Math.min(max, min + 429), x: 74, y: 26 },
    { id: "baklands_gate", nameHe: "Путь в Бакланд", from: min + 430, to: max, x: 90, y: 18 },
  ];

  const nodes: MapNode[] = chunks.map((chunk, index) => {
    const paragraphIds = ids.filter((id) => id >= chunk.from && id <= chunk.to);
    const connectedTo = [] as string[];
    if (index > 0) connectedTo.push(chunks[index - 1].id);
    if (index < chunks.length - 1) connectedTo.push(chunks[index + 1].id);

    return {
      id: chunk.id,
      nameHe: chunk.nameHe,
      world: "Кахабад",
      x: chunk.x,
      y: chunk.y,
      paragraphIds,
      connectedTo,
      descriptionHe: "Авторазметка. Уточнить по оригинальной карте.",
    };
  });

  return nodes.filter((node) => node.paragraphIds.length > 0);
}

async function main() {
  const raw = await readFile(SOURCE_TXT, "utf8");
  const result = extractParagraphs(raw);

  const mapNodes = buildMapNodes(result.paragraphs);
  const paragraphToNode = new Map<number, string>();
  for (const node of mapNodes) {
    for (const paragraphId of node.paragraphIds) {
      paragraphToNode.set(paragraphId, node.id);
    }
  }

  for (const paragraph of result.paragraphs) {
    paragraph.locationId = paragraphToNode.get(paragraph.id) ?? "khar_unknown";
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "paragraphs.json"), `${JSON.stringify(result.paragraphs, null, 2)}\n`, "utf8");
  await writeFile(path.join(OUT_DIR, "mapNodes.json"), `${JSON.stringify(mapNodes, null, 2)}\n`, "utf8");

  const reviewText = [
    "# נקודות שדורשות בדיקה ידנית",
    "",
    "1. המרת הפסקאות בוצעה אוטומטית מ-OCR רוסי. חובה לעבור ידנית על פסקאות עם ניסוח משובש.",
    `2. נמצאו ${result.paragraphs.length} פסקאות שנחצבו אוטומטית מתוך קובץ המקור.`,
    `3. פסקאות עם אינדיקציה לקרב ודורשות המרה ל-combat object: ${result.unresolvedCombatParagraphIds.join(", ") || "אין"}.`,
    `4. פסקאות עם אינדיקציה לקסמים ודורשות מודל spell-choices: ${result.unresolvedSpellParagraphIds.join(", ") || "אין"}.`,
    `5. פסקאות בלי הפניות מזוהות (לא סופי): ${result.suspiciousParagraphIds.join(", ") || "אין"}.`,
    "6. כרגע choices נוצרו אוטומטית מיעדי הפניה שזוהו בטקסט (סוגריים/מקפים). יש לאמת ידנית כל בחירה.",
    "7. mapNodes נבנה אוטומטית לפי טווחי פסקאות. יש למפות ידנית לפי המפה הרשמית.",
  ].join("\n");

  await writeFile(REVIEW_PATH, `${reviewText}\n`, "utf8");

  const questionsText = [
    "# שאלות להשלמת הטמעת הספר",
    "",
    "1. האם להשאיר UI בעברית בלבד, או להוסיף אפשרות ממשק רוסי בנוסף?",
    "2. האם תרצה לשמור גם את טקסט המקור הרוסי וגם תרגום עברי לכל פסקה בשלב זה?",
    "3. האם נרצה שמצב Wizard/Warrior יהיה בחירה מחייבת במסך יצירת דמות כבר עכשיו?",
    "4. האם לטעון גם רשימת קסמים מלאה מקובץ נפרד (Spellbook) כדי ליישם את מנגנון הקסם המתקדם?",
    "5. האם נרצה שאבצע עכשיו המרה ידנית ממוקדת לפסקאות הקרב הראשונות (למשל 11, 13, 151) ל-combat object מדויק?",
  ].join("\n");

  await writeFile(QUESTIONS_PATH, `${questionsText}\n`, "utf8");

  console.log(`INGEST_OK paragraphs=${result.paragraphs.length} range=${result.paragraphs[0].id}-${result.paragraphs[result.paragraphs.length - 1].id}`);
}

main().catch((error) => {
  console.error("INGEST_FAILED");
  console.error(error);
  process.exit(1);
});
