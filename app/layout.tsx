import type { Metadata } from "next";
import bookMeta from "@/data/bookMeta.json";
import "./globals.css";

export const metadata: Metadata = {
  title: bookMeta.titleHe,
  description: "Digital gamebook engine with structured rules, combat, inventory, map and saves",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const direction = bookMeta.rtl ? "rtl" : "ltr";

  return (
    <html lang={bookMeta.language || "he"} dir={direction}>
      <body className="min-h-screen bg-zinc-950 text-amber-50">{children}</body>
    </html>
  );
}
