import { useState } from "react";
import { formatDistance, formatSpeed } from "../../utils/formatters";

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
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return `${directions[index]} (${Math.round(deg)}°)`;
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
  setSimulationSpeedMultiplier,
  startTrip,
  stopTrip,
  startSimulation,
  pauseSimulation,
  resetSimulation,
}) {
  const [showAllSteps, setShowAllSteps] = useState(false);

  const currentStep = steps[activeStepIndex] || steps[0] || null;
  const nextStep = steps[activeStepIndex + 1] || null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
      {/* Header & Main Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧭</span>
            <h3 className="text-base font-semibold text-white">Live Navigation & Guidance</h3>
            {navigationState.isActive && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time GPS tracking, turn-by-turn guidance, and route simulation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* GPS Live Button */}
          {!navigationState.isActive ? (
            <button
              type="button"
              onClick={startTrip}
              className="flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-300 shadow-md shadow-emerald-500/20"
            >
              <span>🛰️</span>
              <span>Start GPS</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => stopTrip("idle", "")}
              className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400 hover:bg-rose-500/20"
            >
              Stop Navigation
            </button>
          )}

          {/* Simulation Toggle Buttons */}
          {!isSimulating ? (
            <button
              type="button"
              onClick={startSimulation}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-400/20"
            >
              <span>▶️</span>
              <span>Simulate Route</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-400/20"
            >
              <span>⏸️</span>
              <span>Pause Sim</span>
            </button>
          )}

          {(isSimulating || navigationState.status === "paused" || navigationState.status === "arrived") && (
            <button
              type="button"
              onClick={resetSimulation}
              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* Simulation Speed Bar */}
      {(isSimulating || navigationState.status === "paused") && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-slate-900/90 px-4 py-2 border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Simulation Speed:</span>
          <div className="flex gap-1.5">
            {[1, 2, 5, 10].map((multiplier) => (
              <button
                key={multiplier}
                type="button"
                onClick={() => setSimulationSpeedMultiplier(multiplier)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                  simulationSpeedMultiplier === multiplier
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {multiplier}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Active Turn Maneuver Card */}
      {currentStep && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 p-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl border border-cyan-400/30">
              {getManeuverIcon(currentStep.type, currentStep.modifier)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white leading-snug">
                {currentStep.instruction}
              </p>
              {distanceToNextManeuver !== null && distanceToNextManeuver !== undefined && (
                <p className="mt-1 text-sm font-semibold text-cyan-300">
                  In {formatDistance(distanceToNextManeuver)}
                </p>
              )}
              {currentStep.roadName && (
                <p className="mt-0.5 text-xs text-slate-400">Road: {currentStep.roadName}</p>
              )}
            </div>
          </div>

          {/* Next Turn Preview */}
          {nextStep && (
            <div className="mt-3 flex items-center gap-2 border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Then:</span>
              <span>{getManeuverIcon(nextStep.type, nextStep.modifier)}</span>
              <span className="truncate">{nextStep.instruction}</span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Route Progress</span>
          <span className="font-semibold text-cyan-300">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Status</p>
          <p className="mt-1 text-sm font-semibold text-white capitalize">
            {navigationState.status === "tracking"
              ? "Live GPS"
              : navigationState.status === "simulating"
              ? "Simulating"
              : navigationState.status === "arrived"
              ? "Arrived 🏁"
              : navigationState.status === "paused"
              ? "Paused"
              : "Ready"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Speed</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {formatSpeed(navigationState.currentLocation?.speed)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Heading</p>
          <p className="mt-1 text-sm font-semibold text-white truncate">
            {navigationState.currentLocation?.heading !== undefined
              ? getCompassDirection(navigationState.currentLocation.heading)
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">To Destination</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {liveDistanceToDestination
              ? formatDistance(liveDistanceToDestination)
              : "—"}
          </p>
        </div>
      </div>

      {/* Turn-by-Turn Maneuvers List Accordion */}
      {steps.length > 0 && (
        <div className="border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowAllSteps(!showAllSteps)}
            className="flex w-full items-center justify-between rounded-xl px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <span>Turn-by-Turn Directions ({steps.length} steps)</span>
            <span>{showAllSteps ? "▲ Hide" : "▼ Show"}</span>
          </button>

          {showAllSteps && (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {steps.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                const isPassed = idx < activeStepIndex;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2.5 rounded-xl p-2.5 text-xs transition ${
                      isActive
                        ? "bg-cyan-500/15 border border-cyan-500/30 text-white"
                        : isPassed
                        ? "bg-slate-950/40 text-slate-500 opacity-60"
                        : "bg-slate-900/40 text-slate-300"
                    }`}
                  >
                    <span className="text-base">{getManeuverIcon(step.type, step.modifier)}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${isActive ? "text-cyan-200" : ""}`}>
                        {step.instruction}
                      </p>
                      {step.distance > 0 && (
                        <p className="text-[10px] text-slate-400">
                          {formatDistance(step.distance)}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {navigationState.error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
          ⚠️ {navigationState.error}
        </p>
      )}
    </div>
  );
}
