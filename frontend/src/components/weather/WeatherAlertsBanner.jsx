export default function WeatherAlertsBanner({ warnings = [] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warn, idx) => {
        const isHigh = warn.severity === "high";

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg backdrop-blur ${
              isHigh
                ? "border-rose-500/40 bg-rose-950/40 text-rose-100"
                : "border-amber-500/40 bg-amber-950/40 text-amber-100"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/30 text-lg">
              {warn.icon || "⚠️"}
            </span>

            <div className="flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    isHigh ? "bg-rose-500 text-slate-950 font-bold" : "bg-amber-400 text-slate-950 font-bold"
                  }`}
                >
                  {isHigh ? "Severe Weather Warning" : "Weather Alert"}
                </span>

                {warn.location && (
                  <span className="rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                    📍 {warn.location.split(",")[0]}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-xs pt-1">{warn.title}</h4>
              <p className="text-[11px] leading-relaxed opacity-90">{warn.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

