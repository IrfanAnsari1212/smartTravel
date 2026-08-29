export default function HeroHeader() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
        Route Planning Platform
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">
        Build routes online, then take the essential trip data with you
        when the mountains take your signal away.
      </h1>
      <p className="max-w-2xl text-sm text-slate-300 md:text-base">
        This offline-first MVP lets you save routes to the device, export
        them as packs, import them later, and keep a readable route view
        even when map tiles are unavailable.
      </p>
    </div>
  );
}

