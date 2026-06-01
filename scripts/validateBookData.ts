import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { EnemyDefinition } from "../types/combat";
import type { Item } from "../types/item";
import type { MapNode } from "../types/map";
import type { Condition, Effect, Paragraph } from "../types/paragraph";

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");

async function loadJson<T>(filename: string): Promise<T> {
  const fullPath = path.join(DATA_DIR, filename);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw) as T;
}

function addError(result: ValidationResult, message: string): void {
  result.errors.push(message);
}

function addWarning(result: ValidationResult, message: string): void {
  result.warnings.push(message);
}

function collectConditionRefs(condition: Condition, refs: { itemIds: string[]; paragraphIds: number[] }): void {
  switch (condition.type) {
    case "hasItem":
    case "missingItem":
      refs.itemIds.push(condition.itemId);
      break;
    case "paragraphVisited":
      refs.paragraphIds.push(condition.paragraphId);
      break;
    case "allOf":
    case "anyOf":
      for (const nested of condition.conditions) {
        collectConditionRefs(nested, refs);
      }
      break;
    case "not":
      collectConditionRefs(condition.condition, refs);
      break;
    default:
      break;
  }
}

function collectEffectRefs(effect: Effect, refs: { itemIds: string[]; enemyIds: string[]; paragraphIds: number[] }): void {
  switch (effect.type) {
    case "addItem":
    case "removeItem":
      refs.itemIds.push(effect.itemId);
      break;
    case "markEnemyDefeated":
      refs.enemyIds.push(effect.enemyId);
      break;
    case "setParagraph":
      refs.paragraphIds.push(effect.target);
      break;
    default:
      break;
  }
}

async function main(): Promise<void> {
  const [paragraphs, items, enemies, mapNodes] = await Promise.all([
    loadJson<Paragraph[]>("paragraphs.json"),
    loadJson<Item[]>("items.json"),
    loadJson<EnemyDefinition[]>("enemies.json"),
    loadJson<MapNode[]>("mapNodes.json"),
  ]);

  const result: ValidationResult = { errors: [], warnings: [] };

  const paragraphIds = new Set<number>();
  for (const paragraph of paragraphs) {
    if (paragraphIds.has(paragraph.id)) {
      addError(result, `Paragraph duplicate id: ${paragraph.id}`);
    }
    paragraphIds.add(paragraph.id);
  }

  const itemIds = new Set<string>();
  for (const item of items) {
    if (itemIds.has(item.id)) {
      addError(result, `Item duplicate id: ${item.id}`);
    }
    itemIds.add(item.id);
  }

  const enemyIds = new Set<string>();
  for (const enemy of enemies) {
    if (enemyIds.has(enemy.id)) {
      addError(result, `Enemy duplicate id: ${enemy.id}`);
    }
    enemyIds.add(enemy.id);
  }

  const nodeIds = new Set<string>();
  for (const node of mapNodes) {
    if (nodeIds.has(node.id)) {
      addError(result, `Map node duplicate id: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  for (const node of mapNodes) {
    for (const linkedNode of node.connectedTo) {
      if (!nodeIds.has(linkedNode)) {
        addError(result, `Map node '${node.id}' points to missing node '${linkedNode}'.`);
      }
    }
  }

  for (const paragraph of paragraphs) {
    if (!nodeIds.has(paragraph.locationId)) {
      addError(result, `Paragraph ${paragraph.id} uses missing locationId '${paragraph.locationId}'.`);
    }

    for (const choice of paragraph.choices) {
      if (!paragraphIds.has(choice.target)) {
        addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' points to missing target ${choice.target}.`);
      }

      if (choice.condition) {
        const refs = { itemIds: [] as string[], paragraphIds: [] as number[] };
        collectConditionRefs(choice.condition, refs);

        for (const itemId of refs.itemIds) {
          if (!itemIds.has(itemId)) {
            addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' condition references missing item '${itemId}'.`);
          }
        }

        for (const paragraphId of refs.paragraphIds) {
          if (!paragraphIds.has(paragraphId)) {
            addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' condition references missing paragraph ${paragraphId}.`);
          }
        }
      }

      if (choice.effects) {
        for (const effect of choice.effects) {
          const refs = { itemIds: [] as string[], enemyIds: [] as string[], paragraphIds: [] as number[] };
          collectEffectRefs(effect, refs);

          for (const itemId of refs.itemIds) {
            if (!itemIds.has(itemId)) {
              addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' effect references missing item '${itemId}'.`);
            }
          }

          for (const enemyId of refs.enemyIds) {
            if (!enemyIds.has(enemyId)) {
              addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' effect references missing enemy '${enemyId}'.`);
            }
          }

          for (const paragraphId of refs.paragraphIds) {
            if (!paragraphIds.has(paragraphId)) {
              addError(result, `Paragraph ${paragraph.id} choice '${choice.id}' effect jump references missing paragraph ${paragraphId}.`);
            }
          }
        }
      }
    }

    if (paragraph.effects) {
      for (const effect of paragraph.effects) {
        const refs = { itemIds: [] as string[], enemyIds: [] as string[], paragraphIds: [] as number[] };
        collectEffectRefs(effect, refs);

        for (const itemId of refs.itemIds) {
          if (!itemIds.has(itemId)) {
            addError(result, `Paragraph ${paragraph.id} effect references missing item '${itemId}'.`);
          }
        }

        for (const enemyId of refs.enemyIds) {
          if (!enemyIds.has(enemyId)) {
            addError(result, `Paragraph ${paragraph.id} effect references missing enemy '${enemyId}'.`);
          }
        }

        for (const paragraphId of refs.paragraphIds) {
          if (!paragraphIds.has(paragraphId)) {
            addError(result, `Paragraph ${paragraph.id} effect jump references missing paragraph ${paragraphId}.`);
          }
        }
      }
    }

    if (paragraph.combat) {
      for (const enemyId of paragraph.combat.enemies) {
        if (!enemyIds.has(enemyId)) {
          addError(result, `Paragraph ${paragraph.id} combat references missing enemy '${enemyId}'.`);
        }
      }

      if (!paragraphIds.has(paragraph.combat.onWin)) {
        addError(result, `Paragraph ${paragraph.id} combat onWin points to missing paragraph ${paragraph.combat.onWin}.`);
      }

      if (paragraph.combat.onLose !== "death" && !paragraphIds.has(paragraph.combat.onLose)) {
        addError(result, `Paragraph ${paragraph.id} combat onLose points to missing paragraph ${paragraph.combat.onLose}.`);
      }
    }

    if (paragraph.test) {
      if (!paragraphIds.has(paragraph.test.onSuccess)) {
        addError(result, `Paragraph ${paragraph.id} test onSuccess points to missing paragraph ${paragraph.test.onSuccess}.`);
      }
      if (!paragraphIds.has(paragraph.test.onFailure)) {
        addError(result, `Paragraph ${paragraph.id} test onFailure points to missing paragraph ${paragraph.test.onFailure}.`);
      }
    }

    if (paragraph.choices.length === 0 && !paragraph.combat && !paragraph.test) {
      addWarning(result, `Paragraph ${paragraph.id} has no choices/combat/test; make sure this is intentional.`);
    }
  }

  for (const node of mapNodes) {
    for (const paragraphId of node.paragraphIds) {
      if (!paragraphIds.has(paragraphId)) {
        addError(result, `Map node '${node.id}' references missing paragraph ${paragraphId}.`);
      }
    }
  }

  if (result.errors.length === 0) {
    console.log("validateBookData: PASS");
  } else {
    console.error("validateBookData: FAIL");
    for (const error of result.errors) {
      console.error(`ERROR: ${error}`);
    }
  }

  for (const warning of result.warnings) {
    console.warn(`WARN: ${warning}`);
  }

  if (result.errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("validateBookData: crashed");
  console.error(error);
  process.exit(1);
});
