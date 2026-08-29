import { useState, useEffect } from "react";
import { fetchPointWeather } from "../../services/weatherService";

export default function WeatherWidget({
  lat,
  lon,
  name = "Destination",
  initialWeather = null,
  compact = false,
}) {
  const [weather, setWeather] = useState(initialWeather);
  const [loading, setLoading] = useState(!initialWeather && Number.isFinite(lat) && Number.isFinite(lon));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialWeather || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

    let isMounted = true;

    fetchPointWeather({ lat, lon, name })
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Weather fetch failed:", err);
          setError("Weather unavailable");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lon, name, initialWeather]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-center text-xs text-slate-400 animate-pulse">
        Fetching live weather forecast...
      </div>
    );
  }

  if (error || !weather?.current) {
    return null;
  }

  const { current, daily = [] } = weather;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 border border-slate-800 px-2 py-0.5 text-xs text-white">
        <span className="text-sm">{current.icon}</span>
        <span className="font-bold text-cyan-300 text-[11px]">{current.temperature}°C</span>
        <span className="text-slate-400 capitalize text-[10px] hidden sm:inline">{current.description}</span>
      </div>
    );
  }

  const formatDayName = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur space-y-3">
      {/* Current Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">{current.icon}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{current.temperature}°C</span>
              <span className="text-xs text-slate-400">
                Feels like {current.apparentTemperature}°C
              </span>
            </div>
            <p className="text-xs font-semibold text-cyan-300 capitalize">{current.description}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[11px] font-bold text-slate-300">{name?.split(",")[0] || "Location"}</p>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            Open-Meteo
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 border-y border-slate-800/80 py-2.5 text-center">
        <div className="rounded-xl bg-slate-950/60 p-2">
          <span className="text-[10px] text-slate-400 block">💧 Precipitation</span>
          <span className="text-xs font-bold text-sky-300">
            {current.precipitation > 0 ? `${current.precipitation} mm` : "0% chance"}
          </span>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-2">
          <span className="text-[10px] text-slate-400 block">💨 Wind Speed</span>
          <span className="text-xs font-bold text-slate-200">{current.windSpeed} km/h</span>
        </div>

        <div className="rounded-xl bg-slate-950/60 p-2">
          <span className="text-[10px] text-slate-400 block">💧 Humidity</span>
          <span className="text-xs font-bold text-emerald-300">{current.humidity}%</span>
        </div>
      </div>

      {/* 5-Day Daily Forecast Strip */}
      {daily.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            5-Day Weather Outlook
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {daily.slice(0, 5).map((d, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-between rounded-xl bg-slate-950/70 p-2 text-center border border-slate-850"
              >
                <span className="text-[10px] font-semibold text-slate-400">
                  {idx === 0 ? "Today" : formatDayName(d.date)}
                </span>
                <span className="text-base my-1">{d.icon}</span>
                <div className="text-[10px] font-bold text-white">
                  <span>{d.maxTemp}°</span>
                  <span className="text-slate-500 font-normal ml-0.5">{d.minTemp}°</span>
                </div>
                {d.precipitationProbability > 20 && (
                  <span className="text-[9px] text-sky-400 mt-0.5">
                    💧{d.precipitationProbability}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
