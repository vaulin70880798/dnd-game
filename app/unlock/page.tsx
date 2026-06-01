"use client";

import { useState } from "react";

export default function UnlockPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("סיסמה שגויה או שהגישה הפרטית אינה פעילה.");
        return;
      }

      const payload = (await response.json()) as { ok: boolean; redirectTo?: string };
      if (payload.ok) {
        window.location.href = payload.redirectTo ?? "/";
      }
    } catch {
      setError("אירעה שגיאה באימות הסיסמה.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell mx-auto flex w-full max-w-md items-center px-4 py-8">
      <form onSubmit={handleSubmit} className="ornate-card w-full p-6">
        <h1 className="text-2xl font-semibold text-amber-100">גישה פרטית</h1>
        <p className="mt-2 text-sm text-amber-50/80">הזן סיסמה כדי להמשיך.</p>

        <label className="mt-4 block text-sm text-amber-50">
          סיסמה
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-amber-300/30 bg-zinc-900/80 px-3 py-2 text-amber-50"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold mt-4 w-full px-4 py-2 disabled:opacity-60"
        >
          {loading ? "מאמת..." : "כניסה"}
        </button>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </form>
    </main>
  );
}
