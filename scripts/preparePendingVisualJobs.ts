import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

interface JsonlJob {
  prompt: string;
  out: string;
}

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "assets", "generated");
const SOURCE_JOBS = path.join(ROOT, "scripts", "generated", "visual-jobs-medium.jsonl");
const PENDING_JOBS = path.join(ROOT, "scripts", "generated", "visual-jobs-medium.pending.jsonl");

async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function moveIfFlatExists(jobOut: string): Promise<boolean> {
  const flatPath = path.join(OUT_DIR, path.basename(jobOut));
  const targetPath = path.join(OUT_DIR, jobOut);

  const hasFlat = await exists(flatPath);
  if (!hasFlat) return false;

  const hasTarget = await exists(targetPath);
  if (hasTarget) return true;

  await mkdir(path.dirname(targetPath), { recursive: true });
  await rename(flatPath, targetPath);
  return true;
}

async function main() {
  const raw = await readFile(SOURCE_JOBS, "utf8");
  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as JsonlJob);

  const pending: JsonlJob[] = [];
  let movedFromFlat = 0;

  for (const row of rows) {
    const targetPath = path.join(OUT_DIR, row.out);
    if (await exists(targetPath)) {
      continue;
    }

    const moved = await moveIfFlatExists(row.out);
    if (moved) {
      movedFromFlat += 1;
      continue;
    }

    pending.push(row);
  }

  await writeFile(PENDING_JOBS, pending.map((row) => JSON.stringify(row)).join("\n") + (pending.length ? "\n" : ""), "utf8");

  console.log(`PENDING_JOBS_OK total=${rows.length} pending=${pending.length} movedFromFlat=${movedFromFlat} file=${PENDING_JOBS}`);
}

main().catch((error) => {
  console.error("PENDING_JOBS_FAIL");
  console.error(error);
  process.exit(1);
});
