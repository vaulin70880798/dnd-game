import Image from "next/image";
import type { MapNode } from "@/types/map";

interface MapViewProps {
  nodes: MapNode[];
  visitedNodeIds: string[];
  currentNodeId?: string;
  mapImageSrc?: string;
}

export default function MapView({ nodes, visitedNodeIds, currentNodeId, mapImageSrc }: MapViewProps) {
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));

  return (
    <section className="ornate-card p-4">
      <h3 className="mb-3 border-b border-amber-300/20 pb-2 text-lg font-semibold text-amber-100">מפת מסע</h3>
      {mapImageSrc && (
        <div className="mb-4 overflow-hidden rounded-xl border border-amber-300/30 bg-zinc-900/80 p-2">
          <Image
            src={mapImageSrc}
            alt="מפת קהאבאד"
            width={1200}
            height={900}
            className="mx-auto w-full max-w-[720px] rounded-lg object-contain"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 100 70" className="min-w-[560px] rounded-xl bg-zinc-900/80 p-2">
          {nodes.flatMap((node) =>
            node.connectedTo.map((target) => {
              const targetNode = nodeById[target];
              if (!targetNode) return null;
              return (
                <line
                  key={`${node.id}_${target}`}
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="rgba(228,188,109,0.28)"
                  strokeWidth="0.6"
                />
              );
            }),
          )}

          {nodes.map((node) => {
            const visited = visitedNodeIds.includes(node.id);
            const isCurrent = currentNodeId === node.id;

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCurrent ? 3.2 : 2.2}
                  fill={isCurrent ? "#f5dd9e" : visited ? "#b9852f" : "#3f3f46"}
                  stroke={isCurrent ? "#fef3c7" : "#27272a"}
                  strokeWidth="0.6"
                />
                <text x={node.x + 2.6} y={node.y - 2.6} fill="#f7e8c5" fontSize="3">
                  {node.nameHe}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
