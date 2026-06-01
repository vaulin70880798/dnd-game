import Link from "next/link";
import Image from "next/image";
import bookMeta from "@/data/bookMeta.json";
import rules from "@/data/rules.json";

export default function RulesPage() {
  return (
    <main className="page-shell mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-amber-100">חוקי המשחק</h1>
        <Link href="/" className="text-sm text-amber-200/85 hover:text-amber-100">
          חזרה
        </Link>
      </header>

      <section className="ornate-card space-y-4 p-5">
        <p className="text-sm text-amber-50/85">{rules.titleHe}</p>
        <p className="text-sm text-amber-50/80">מקור: {rules.sourceEdition}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="stat-chip p-3 text-sm">
            <p className="text-amber-200">קוביות קרב</p>
            <p className="text-amber-50">
              {rules.dice.combat.count}d{rules.dice.combat.sides}
            </p>
          </div>
          <div className="stat-chip p-3 text-sm">
            <p className="text-amber-200">נזק בסיסי</p>
            <p className="text-amber-50">{rules.combat.baseDamageToLoser}</p>
          </div>
          <div className="stat-chip p-3 text-sm">
            <p className="text-amber-200">בדיקת מזל</p>
            <p className="text-amber-50">
              {rules.dice.luckTest.count}d{rules.dice.luckTest.sides}
            </p>
          </div>
          <div className="stat-chip p-3 text-sm">
            <p className="text-amber-200">צריכת מזל לשימוש</p>
            <p className="text-amber-50">{rules.luck.consumeOnUse}</p>
          </div>
        </div>

        <ul className="list-disc space-y-1 pr-5 text-sm text-amber-50/85">
          {rules.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {bookMeta.assets?.characterSheet && (
          <figure className="ornate-card p-3">
            <Image
              src={bookMeta.assets.characterSheet}
              alt="דף דמות"
              width={760}
              height={1080}
              className="w-full rounded-lg object-contain"
            />
            <figcaption className="mt-2 text-xs text-amber-100/70">דף דמות (סריקת מקור)</figcaption>
          </figure>
        )}
        {bookMeta.assets?.combatSheet && (
          <figure className="ornate-card p-3">
            <Image
              src={bookMeta.assets.combatSheet}
              alt="דף קרבות"
              width={760}
              height={1080}
              className="w-full rounded-lg object-contain"
            />
            <figcaption className="mt-2 text-xs text-amber-100/70">דף קרבות (סריקת מקור)</figcaption>
          </figure>
        )}
      </section>
    </main>
  );
}
