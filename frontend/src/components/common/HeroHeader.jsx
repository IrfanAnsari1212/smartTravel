import { Sparkles, MapPin, Loader, CheckCircle, XCircle } from "lucide-react";

const SUGGESTION_CHIPS = [
  { label: "Plan a weekend trip", prompt: "Plan a weekend trip" },
  { label: "Find attractions nearby", prompt: "Find top attractions" },
  { label: "Find hotels", prompt: "Find hotels near my destination" },
  { label: "Road trip route", prompt: "Plan a road trip" },
  { label: "Food stops", prompt: "Find food stops on my route" },
  { label: "Emergency services", prompt: "Find emergency services near me" },
];

export default function HeroHeader({
  locationStatus,
  locationMessage,
  detectCurrentLocation,
  start,
  onChipSelect,
  session,
}) {
  const greeting = getGreeting();

  return (
    <div className="space-y-4">
      {/* Greeting + Location status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-zinc-600">
            {greeting}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100 leading-tight md:text-3xl">
            Where do you want to{" "}
            <span className="text-brand-400">go?</span>
          </h1>
        </div>

        {/* Location pill */}
        <button
          type="button"
          onClick={() => detectCurrentLocation(false)}
          disabled={locationStatus === "locating"}
          aria-label="Detect my current location"
          className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
            locationStatus === "found"
              ? "border-success-500/40 bg-success-500/10 text-success-400 hover:bg-success-500/15"
              : locationStatus === "locating"
                ? "border-brand-500/40 bg-brand-500/10 text-brand-400 cursor-wait"
                : locationStatus === "denied" || locationStatus === "error"
                  ? "border-warn-500/40 bg-warn-500/10 text-warn-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          {locationStatus === "locating" ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : locationStatus === "found" ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : locationStatus === "denied" || locationStatus === "error" ? (
            <XCircle className="h-3.5 w-3.5" />
          ) : (
            <MapPin className="h-3.5 w-3.5" />
          )}
          <span className="max-w-[140px] truncate">
            {locationStatus === "locating"
              ? "Detecting…"
              : locationStatus === "found" && start
                ? start.split(",")[0]
                : locationStatus === "denied"
                  ? "Permission denied"
                  : locationStatus === "error"
                    ? "Location unavailable"
                    : "Use my location"}
          </span>
        </button>
      </div>

      {/* AI Copilot teaser */}
      <div className="flex items-center gap-3 rounded-2xl border border-brand-800/40 bg-brand-950/30 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600/20">
          <Sparkles className="h-4 w-4 text-brand-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-brand-300">✦ SmartTravel AI Copilot</p>
          <p className="mt-0.5 text-xs text-zinc-500 truncate">
            {session
              ? "Tell me where you're going. I'll help plan the journey."
              : "Sign in to unlock AI-powered trip planning."}
          </p>
        </div>
      </div>

      {/* Quick suggestion chips */}
      {onChipSelect && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onChipSelect(chip.prompt)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-brand-500/40 hover:bg-brand-950/30 hover:text-brand-300"
            >
              <span className="text-brand-500">✦</span>
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
