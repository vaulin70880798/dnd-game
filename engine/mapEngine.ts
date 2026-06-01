import type { MapNode } from "@/types/map";

export function buildParagraphToNodeIndex(mapNodes: MapNode[]): Record<number, string> {
  const index: Record<number, string> = {};

  for (const node of mapNodes) {
    for (const paragraphId of node.paragraphIds) {
      index[paragraphId] = node.id;
    }
  }

  return index;
}

export function ensureVisitedNode(visitedNodes: string[], nodeId: string | undefined): string[] {
  if (!nodeId || visitedNodes.includes(nodeId)) {
    return visitedNodes;
  }
  return [...visitedNodes, nodeId];
}

export function getCurrentMapNodeId(
  paragraphId: number,
  paragraphToNode: Record<number, string>,
): string | undefined {
  return paragraphToNode[paragraphId];
}
