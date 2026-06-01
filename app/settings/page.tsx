import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="page-shell mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-amber-100">הגדרות</h1>
        <Link href="/" className="text-sm text-amber-200/85 hover:text-amber-100">
          חזרה
        </Link>
      </header>

      <section className="ornate-card space-y-4 p-5 text-sm text-amber-50/90">
        <p>הגדרות מתקדמות נוספות מנוהלות כרגע בתוך מסך המשחק (למשל הצגת מספר פסקה).</p>
        <p>
          אם הוגדרה סיסמת גישה פרטית דרך `PRIVATE_GAME_PASSWORD`, ניתן להתחבר דרך עמוד
          <Link href="/unlock" className="mr-1 text-amber-200 underline">
            פתיחת גישה
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
