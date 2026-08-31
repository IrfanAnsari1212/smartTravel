import { TriangleAlert, CloudLightning } from "lucide-react";

export default function WeatherAlertsBanner({ warnings = [] }) {
  if (!warnings?.length) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warn, idx) => {
        const isHigh = warn.severity === "high";
        return (
          <div
            key={idx}
            role="alert"
            className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
              isHigh
                ? "border-danger-500/40 bg-danger-500/10"
                : "border-warn-500/40 bg-warn-500/10"
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isHigh ? "bg-danger-500/20" : "bg-warn-500/20"
            }`}>
              {isHigh
                ? <CloudLightning className="h-4 w-4 text-danger-400" />
                : <TriangleAlert className="h-4 w-4 text-warn-400" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  isHigh ? "bg-danger-500/20 text-danger-400" : "bg-warn-500/20 text-warn-400"
                }`}>
                  {isHigh ? "Severe Warning" : "Weather Alert"}
                </span>
                {warn.location && (
                  <span className="text-[10px] text-zinc-500">📍 {warn.location.split(",")[0]}</span>
                )}
              </div>
              <h4 className={`mt-1.5 text-xs font-semibold ${isHigh ? "text-danger-300" : "text-warn-300"}`}>
                {warn.title}
              </h4>
              <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">{warn.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
