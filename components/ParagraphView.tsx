import Image from "next/image";
import type { Paragraph } from "@/types/paragraph";

interface SceneCharacter {
  id: string;
  nameHe: string;
  summaryHe: string;
  imageSrc: string;
  kind: "enemy" | "npc";
}

interface SceneItem {
  id: string;
  nameHe: string;
  descriptionHe: string;
  effectHe?: string;
  imageSrc: string;
}

interface ParagraphViewProps {
  paragraph: Paragraph;
  showParagraphId: boolean;
  sceneCharacters: SceneCharacter[];
  sceneItems: SceneItem[];
}

export default function ParagraphView({ paragraph, showParagraphId, sceneCharacters, sceneItems }: ParagraphViewProps) {
  return (
    <article className="ornate-card p-3 sm:p-4">
      <div className="parchment-panel p-4 sm:p-5">
        <header className="mb-4 flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-[#3c2818] sm:text-2xl">{paragraph.title ?? "ללא כותרת"}</h1>
          {showParagraphId && (
            <span className="rounded border border-amber-800/40 bg-amber-100/60 px-2 py-1 text-xs text-[#3d2a17]">
              פסקה {paragraph.id}
            </span>
          )}
        </header>

        {paragraph.illustration?.src && (
          <figure className="mb-4 overflow-hidden rounded-xl border border-amber-800/35 bg-black/15 p-2">
            <Image
              src={paragraph.illustration.src}
              alt={paragraph.illustration.altHe || "איור לפסקה"}
              width={1024}
              height={1024}
              className="h-auto w-full rounded-lg object-cover"
            />
            {paragraph.illustration.captionHe && (
              <figcaption className="mt-2 text-xs text-[#5d3d25]">{paragraph.illustration.captionHe}</figcaption>
            )}
          </figure>
        )}

        {(sceneCharacters.length > 0 || sceneItems.length > 0) && (
          <section className="mb-4 grid gap-3 md:grid-cols-2">
            {sceneCharacters.length > 0 && (
              <div className="rounded-xl border border-amber-800/30 bg-amber-50/40 p-2">
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#5c3f26]">דמויות בסצנה</h3>
                <div className="grid gap-2">
                  {sceneCharacters.map((character) => (
                    <article key={character.id} className="flex gap-2 rounded-lg border border-amber-900/25 bg-black/10 p-2">
                      <Image
                        src={character.imageSrc}
                        alt={character.nameHe}
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-md border border-amber-900/20 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3b2817]">
                          {character.nameHe}
                          <span className="mr-1 text-[10px] text-[#5d4126]/85">
                            ({character.kind === "enemy" ? "אויב" : "דמות"})
                          </span>
                        </p>
                        <p className="line-clamp-3 text-xs leading-5 text-[#4a321f]/90">{character.summaryHe}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {sceneItems.length > 0 && (
              <div className="rounded-xl border border-amber-800/30 bg-amber-50/40 p-2">
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-[#5c3f26]">חפצים קשורים לסצנה</h3>
                <div className="grid gap-2">
                  {sceneItems.map((item) => (
                    <article key={item.id} className="flex gap-2 rounded-lg border border-amber-900/25 bg-black/10 p-2">
                      <Image
                        src={item.imageSrc}
                        alt={item.nameHe}
                        width={72}
                        height={72}
                        className="h-16 w-16 rounded-md border border-amber-900/20 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#3b2817]">{item.nameHe}</p>
                        <p className="line-clamp-2 text-xs leading-5 text-[#4a321f]/90">{item.descriptionHe}</p>
                        {item.effectHe && <p className="line-clamp-1 text-[11px] text-[#5d4126]/85">{item.effectHe}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <p className="whitespace-pre-wrap text-[1.02rem] leading-8 text-[#3a2817]">{paragraph.textHe}</p>
      </div>
    </article>
  );
}
