export interface MapNode {
  id: string;
  nameHe: string;
  world?: string;
  x: number;
  y: number;
  paragraphIds: number[];
  connectedTo: string[];
  descriptionHe?: string;
}
