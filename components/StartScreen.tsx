"use client";

import Link from "next/link";
import { hasSavedGame } from "@/engine/saveSystem";

export default function StartScreen() {
  const canContinue = hasSavedGame();

  return (
    <section className="ornate-card mx-auto w-full max-w-[430px] overflow-hidden p-4 sm:max-w-[470px]">
      <div
        className="relative rounded-[18px] border border-amber-300/30 px-4 pb-4 pt-6"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(16,14,14,0.7), rgba(11,9,9,0.9)), url('/assets/generated/bg-home-castle.png')",
          backgroundPosition: "center top",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />
        <p className="text-center text-[0.68rem] tracking-[0.4em] text-amber-200/70">מנוע ספר־משחק</p>
        <h1 className="mt-3 text-center text-[2rem] font-semibold text-amber-100 sm:text-[2.3rem]">מסעי המבוכים</h1>
        <p className="mt-2 text-center text-sm leading-7 text-amber-50/90">ספר משחק דיגיטלי</p>

        <div className="menu-grid mt-5">
          <Link href="/game?mode=new" className="btn-gold px-4 py-3 text-center text-sm font-semibold">
            התחל משחק חדש
          </Link>
          <Link
            href={canContinue ? "/game?mode=continue" : "#"}
            className={`px-4 py-3 text-center text-sm font-semibold ${
              canContinue ? "btn-iron" : "btn-iron pointer-events-none opacity-45"
            }`}
          >
            המשך משחק
          </Link>
          <Link href="/rules" className="btn-iron px-4 py-3 text-center text-sm font-semibold">
            חוקים
          </Link>
          <Link href="/map" className="btn-iron px-4 py-3 text-center text-sm font-semibold">
            מפה
          </Link>
          <Link href="/journal" className="btn-iron px-4 py-3 text-center text-sm font-semibold">
            יומן מסע
          </Link>
          <Link href="/credits" className="btn-iron px-4 py-3 text-center text-sm font-semibold">
            הגדרות וזכויות
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-amber-300/20 pt-3 text-[0.7rem] text-amber-200/70">
          <span>RTL</span>
          <span>LOCAL SAVE</span>
          <span>2d6</span>
        </div>
      </div>
      <div className="mt-4 hidden grid-cols-2 gap-3 sm:grid">
        <Link href="/unlock" className="btn-iron px-3 py-2 text-center text-xs">
          פתיחת גישה
        </Link>
        <Link href="/settings" className="btn-iron px-3 py-2 text-center text-xs">
          הגדרות מערכת
        </Link>
      </div>
    </section>
  );
}
