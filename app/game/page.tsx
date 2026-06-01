import GameRuntime from "@/components/GameRuntime";
import bookMeta from "@/data/bookMeta.json";
import enemies from "@/data/enemies.json";
import items from "@/data/items.json";
import mapNodes from "@/data/mapNodes.json";
import npcProfiles from "@/data/npcProfiles.json";
import paragraphs from "@/data/paragraphs.json";
import rules from "@/data/rules.json";
import visualPlan from "@/data/visualPlan.json";
import type { EnemyDefinition } from "@/types/combat";
import type { RuleSet } from "@/types/game";
import type { Item } from "@/types/item";
import type { MapNode } from "@/types/map";
import type { Paragraph } from "@/types/paragraph";
import type { NpcProfile, VisualPlanEntry } from "@/types/visual";

interface GamePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function toMode(value: string | string[] | undefined): "new" | "continue" | "auto" {
  const resolved = Array.isArray(value) ? value[0] : value;
  if (resolved === "new" || resolved === "continue") return resolved;
  return "auto";
}

export default async function GamePage({ searchParams }: GamePageProps) {
  const params = searchParams ? await searchParams : undefined;
  const mode = toMode(params?.mode);

  return (
    <main className="page-shell px-3 py-4 sm:px-8 sm:py-8">
      <GameRuntime
        paragraphs={paragraphs as Paragraph[]}
        items={items as Item[]}
        enemies={enemies as EnemyDefinition[]}
        mapNodes={mapNodes as MapNode[]}
        visualPlan={visualPlan as VisualPlanEntry[]}
        npcProfiles={npcProfiles as NpcProfile[]}
        rules={rules as RuleSet}
        bookMeta={
          bookMeta as {
            startParagraphId: number;
            titleHe: string;
            assets?: { worldMap?: string };
          }
        }
        mode={mode}
      />
    </main>
  );
}
