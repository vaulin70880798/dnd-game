import StartScreen from "@/components/StartScreen";

export default function HomePage() {
  return (
    <main className="page-shell flex items-start justify-center pt-8 sm:pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(162,112,49,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-800/10 blur-[120px]" />
      <div className="relative w-full max-w-[560px]">
        <StartScreen />
      </div>
    </main>
  );
}
