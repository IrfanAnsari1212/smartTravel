import { useState } from "react";
import { formatDistance, formatSpeed } from "../../utils/formatters";
import { Navigation, Play, Pause, Square, RotateCcw, Zap, ChevronDown, ChevronUp } from "lucide-react";

const getManeuverIcon = (type = "", modifier = "") => {
  const t = type.toLowerCase();
  const m = modifier.toLowerCase();
  if (t === "arrive") return "🏁";
  if (t === "depart") return "🚗";
  if (t === "roundabout" || t === "rotary") return "🔄";
  if (t === "merge" || t === "on ramp" || t === "fork") return "🔀";
  if (m.includes("slight right") || m.includes("sharp right")) return "↗️";
  if (m.includes("slight left") || m.includes("sharp left")) return "↖️";
  if (m.includes("right")) return "➡️";
  if (m.includes("left")) return "⬅️";
  if (m.includes("uturn")) return "↩️";
  return "⬆️";
};

const getCompassDirection = (deg) => {
  if (deg === null || deg === undefined || Number.isNaN(deg)) return "";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return `${dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8]} (${Math.round(deg)}°)`;
};

export default function LiveNavigationPanel({
  navigationState,
  activeStepIndex = 0,
  steps = [],
  isSimulating = false,
  simulationSpeedMultiplier = 1,
  progressPercent = 0,
  distanceToNextManeuver,
  liveDistanceToDestination,
  deviationInfo = { isDeviated: false, distanceOffRouteMeters: 0 },
  dynamicEta = { etaFormatted: "—", etaTimestamp: "—" },
  setSimulationSpeedMultiplier,
  startTrip,
  stopTrip,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  onRecalculateRoute,
}) {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const currentStep = steps[activeStepIndex] || steps[0] || null;
  const nextStep = steps[activeStepIndex + 1] || null;
  const currLoc = navigationState.currentLocation;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className={`h-4 w-4 ${navigationState.isActive ? "text-success-400" : "text-zinc-500"}`} />
          <h3 className="text-sm font-semibold text-zinc-100">Live Navigation</h3>
          {navigationState.isActive && (
            <span className="h-2 w-2 rounded-full bg-success-400 animate-pulse" />
          )}
        </div>
        {/* Controls */}
        <div className="flex items-center gap-1.5">
          {!navigationState.isActive ? (
            <button type="button" onClick={startTrip}
              className="flex h-8 items-center gap-1.5 rounded-xl bg-success-500/20 border border-success-500/30 px-3 text-xs font-medium text-success-400 transition hover:bg-success-500/30">
              <Play className="h-3.5 w-3.5" /> GPS Trip
            </button>
          ) : (
            <button type="button" onClick={() => stopTrip("idle", "")}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-danger-500/30 bg-danger-500/10 px-3 text-xs font-medium text-danger-400 transition hover:bg-danger-500/20">
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          )}
          {!isSimulating ? (
            <button type="button" onClick={startSimulation}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 text-xs font-medium text-brand-400 transition hover:bg-brand-500/20">
              <Zap className="h-3.5 w-3.5" /> Simulate
            </button>
          ) : (
            <button type="button" onClick={pauseSimulation}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-warn-500/30 bg-warn-500/10 px-3 text-xs font-medium text-warn-400 transition hover:bg-warn-500/20">
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {(isSimulating || navigationState.status === "paused" || navigationState.status === "arrived") && (
            <button type="button" onClick={resetSimulation}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700 text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-400">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Deviation alert */}
      {deviationInfo?.isDeviated && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-warn-400">⚠ Route Deviation</p>
            <p className="text-[10px] text-warn-400/70">{deviationInfo.distanceOffRouteMeters}m off-course</p>
          </div>
          {onRecalculateRoute && (
            <button type="button" onClick={() => onRecalculateRoute({ optimize: true })}
              className="flex h-7 items-center gap-1 rounded-lg bg-warn-500/20 px-3 text-xs font-semibold text-warn-300 transition hover:bg-warn-500/30">
              <RotateCcw className="h-3 w-3" /> Recalculate
            </button>
          )}
        </div>
      )}

      {/* Sim speed */}
      {(isSimulating || navigationState.status === "paused") && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <span className="text-[11px] text-zinc-600">Speed:</span>
          {[1, 2, 5, 10].map((m) => (
            <button key={m} type="button" onClick={() => setSimulationSpeedMultiplier(m)}
              className={`h-6 rounded-lg px-2 text-[11px] font-semibold transition ${
                simulationSpeedMultiplier === m
                  ? "bg-brand-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}>
              {m}x
            </button>
          ))}
        </div>
      )}

      {/* Active guidance */}
      {currentStep && (
        <div className="rounded-2xl border border-brand-800/40 bg-brand-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand-800/40 bg-brand-950/50 text-xl">
              {getManeuverIcon(currentStep.type, currentStep.modifier)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100 leading-snug">{currentStep.instruction}</p>
              {distanceToNextManeuver != null && (
                <p className="mt-1 text-xs font-semibold text-brand-400">In {formatDistance(distanceToNextManeuver)}</p>
              )}
              {currentStep.roadName && (
                <p className="mt-0.5 text-[10px] text-zinc-600">Road: {currentStep.roadName}</p>
              )}
            </div>
          </div>
          {nextStep && (
            <div className="mt-3 flex items-center gap-2 border-t border-zinc-800/60 pt-2.5 text-xs text-zinc-500">
              <span className="font-medium text-zinc-400">Then:</span>
              <span>{getManeuverIcon(nextStep.type, nextStep.modifier)}</span>
              <span className="truncate">{nextStep.instruction}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span>Route Progress</span>
          <span className="text-brand-400 font-medium">{progressPercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Telemetry grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[
          {
            label: "Remaining",
            value: liveDistanceToDestination != null ? formatDistance(liveDistanceToDestination) : "—",
            sub: "To destination",
            accent: "text-brand-300",
          },
          {
            label: "ETA",
            value: dynamicEta.etaTimestamp !== "—" ? dynamicEta.etaTimestamp : dynamicEta.etaFormatted,
            sub: `~${dynamicEta.etaFormatted}`,
            accent: "text-success-400",
          },
          {
            label: "Speed",
            value: formatSpeed(currLoc?.speed),
            sub: currLoc?.heading != null ? getCompassDirection(currLoc.heading) : "—",
            accent: "text-zinc-200",
          },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">{m.label}</p>
            <p className={`mt-1 text-sm font-bold leading-none ${m.accent}`}>{m.value}</p>
            <p className="mt-1 text-[10px] text-zinc-700 truncate">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* GPS position + accuracy row */}
      {currLoc && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px]">
          <span className="text-zinc-600">GPS: {currLoc.lat.toFixed(4)}°, {currLoc.lon.toFixed(4)}°</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${
              (currLoc.accuracy || 10) < 15 ? "bg-success-400"
                : (currLoc.accuracy || 10) < 50 ? "bg-warn-400"
                : "bg-danger-400"
            }`} />
            <span className="text-zinc-600">±{Math.round(currLoc.accuracy || 10)}m</span>
          </div>
        </div>
      )}

      {/* Turn-by-turn accordion */}
      {steps.length > 0 && (
        <div className="border-t border-zinc-800/60 pt-3">
          <button type="button" onClick={() => setShowAllSteps(!showAllSteps)}
            className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-xs font-medium text-zinc-500 transition hover:text-zinc-300">
            <span>Directions ({steps.length} steps)</span>
            {showAllSteps ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showAllSteps && (
            <div className="mt-2 max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;
                return (
                  <div key={idx}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs transition ${
                      isActive ? "border border-brand-800/40 bg-brand-950/30 text-zinc-100"
                        : isPassed ? "opacity-40 text-zinc-600"
                        : "text-zinc-400"
                    }`}>
                    <span className="text-base shrink-0">{getManeuverIcon(step.type, step.modifier)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${isActive ? "text-brand-300" : ""}`}>{step.instruction}</p>
                      {step.distance > 0 && <p className="text-[10px] text-zinc-600 mt-0.5">{formatDistance(step.distance)}</p>}
                    </div>
                    {isActive && (
                      <span className="shrink-0 rounded-full border border-brand-500/30 bg-brand-950/50 px-2 py-0.5 text-[9px] font-bold text-brand-400">NOW</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {navigationState.error && (
        <div role="alert" className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-xs text-danger-400">
          ⚠ {navigationState.error}
        </div>
      )}
    </div>
  );
}
