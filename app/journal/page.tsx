import Link from "next/link";
import SavedJournalSection from "@/components/SavedJournalSection";

export default function JournalPage() {
  return (
    <main className="page-shell mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-amber-100">יומן מסע</h1>
        <Link href="/" className="text-sm text-amber-200/85 hover:text-amber-100">
          חזרה
        </Link>
      </header>
      <SavedJournalSection />
    </main>
  );
}
