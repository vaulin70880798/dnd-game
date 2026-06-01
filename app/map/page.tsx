import Link from "next/link";
import SavedMapSection from "@/components/SavedMapSection";
import bookMeta from "@/data/bookMeta.json";
import mapNodes from "@/data/mapNodes.json";
import type { MapNode } from "@/types/map";

export default function MapPage() {
  return (
    <main className="page-shell mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-amber-100">מפה</h1>
        <Link href="/" className="text-sm text-amber-200/85 hover:text-amber-100">
          חזרה
        </Link>
      </header>
      <SavedMapSection
        mapNodes={mapNodes as MapNode[]}
        mapImageSrc={bookMeta.assets?.worldMap}
      />
    </main>
  );
}
