import { useState, useEffect } from "react";
import { fetchPointWeather } from "../../services/weatherService";
import { Loader } from "lucide-react";

export default function WeatherWidget({ lat, lon, name = "Destination", initialWeather = null, compact = false }) {
  const [weather, setWeather] = useState(initialWeather);
  const [loading, setLoading] = useState(!initialWeather && Number.isFinite(lat) && Number.isFinite(lon));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialWeather || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
    let isMounted = true;
    fetchPointWeather({ lat, lon, name })
      .then((data) => { if (isMounted) { setWeather(data); setLoading(false); } })
      .catch((err) => { if (isMounted) { console.error("Weather fetch failed:", err); setError("Weather unavailable"); setLoading(false); } });
    return () => { isMounted = false; };
  }, [lat, lon, name, initialWeather]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-600">
        <Loader className="h-3.5 w-3.5 animate-spin" />
        Fetching weather…
      </div>
    );
  }

  if (error || !weather?.current) return null;

  const { current, daily = [] } = weather;

  // Compact chip mode (used in TopBar or inline)
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs text-zinc-100">
        <span className="text-sm">{current.icon}</span>
        <span className="font-bold text-brand-300 text-[11px]">{current.temperature}°C</span>
        <span className="text-zinc-500 capitalize text-[10px] hidden sm:inline">{current.description}</span>
      </div>
    );
  }

  const formatDay = (dateStr) => {
    try { return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }); }
    catch { return dateStr; }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      {/* Current */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{current.icon}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-100">{current.temperature}°C</span>
              <span className="text-xs text-zinc-500">Feels {current.apparentTemperature}°C</span>
            </div>
            <p className="text-xs font-medium text-brand-400 capitalize">{current.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-zinc-300">{name?.split(",")[0] || "Location"}</p>
          <span className="text-[10px] text-zinc-700">Open-Meteo</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Rain", value: current.precipitation > 0 ? `${current.precipitation}mm` : "0%" },
          { label: "Wind", value: `${current.windSpeed} km/h` },
          { label: "Humidity", value: `${current.humidity}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-center">
            <p className="text-[10px] text-zinc-600">{m.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-zinc-300">{m.value}</p>
          </div>
        ))}
      </div>

      {/* 5-day forecast */}
      {daily.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-700">5-Day Outlook</p>
          <div className="grid grid-cols-5 gap-1.5">
            {daily.slice(0, 5).map((d, idx) => (
              <div key={idx} className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-center gap-1">
                <span className="text-[10px] font-medium text-zinc-500">{idx === 0 ? "Today" : formatDay(d.date)}</span>
                <span className="text-base">{d.icon}</span>
                <div className="text-[10px] font-bold text-zinc-200">
                  {d.maxTemp}°<span className="font-normal text-zinc-600 ml-0.5">{d.minTemp}°</span>
                </div>
                {d.precipitationProbability > 20 && (
                  <span className="text-[9px] text-brand-400">💧{d.precipitationProbability}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
