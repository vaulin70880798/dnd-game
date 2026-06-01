import Link from "next/link";

export default function CreditsPage() {
  return (
    <main className="page-shell mx-auto w-full max-w-4xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-amber-100">קרדיטים והערות זכויות</h1>
        <Link href="/" className="text-sm text-amber-200/85 hover:text-amber-100">
          חזרה
        </Link>
      </header>

      <section className="ornate-card space-y-4 p-5 text-sm leading-7 text-amber-50/90">
        <p>
          המערכת מיועדת להמרת ספר משחק שנרכש כדין לשימוש דיגיטלי פרטי. אין לפרסם טקסטים/איורים מקוריים בלי אישור מפורש מבעלי הזכויות.
        </p>
        <p>
          אם הפרויקט נשאר לשימוש אישי בלבד, מומלץ להגדיר סיסמה דרך משתנה הסביבה
          <code className="mx-1 rounded bg-zinc-800 px-1 py-0.5">PRIVATE_GAME_PASSWORD</code>
          כדי להגביל גישה.
        </p>
      </section>
    </main>
  );
}
