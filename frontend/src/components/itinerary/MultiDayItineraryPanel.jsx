import { useState, useEffect } from "react";
import { updateTripItineraryRequest } from "../../services/tripService";
import { AIBadge } from "../ai/AIBadge";
import { Plus, Trash2, ArrowUp, ArrowDown, Zap, Save, Loader, X, GripVertical } from "lucide-react";

const STOP_ICONS = {
  departure:   { icon: "🚀", color: "bg-success-500/20 text-success-400 border-success-500/30" },
  arrival:     { icon: "🏁", color: "bg-danger-500/20 text-danger-400 border-danger-500/30" },
  waypoint:    { icon: "📍", color: "bg-zinc-700 text-zinc-300 border-zinc-600" },
  attraction:  { icon: "🏛️", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  restaurant:  { icon: "🍽️", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  hotel:       { icon: "🏨", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  viewpoint:   { icon: "🌄", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  fuel:        { icon: "⛽", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  hospital:    { icon: "🏥", color: "bg-danger-500/20 text-danger-400 border-danger-500/30" },
  rest:        { icon: "☕", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  other:       { icon: "📌", color: "bg-zinc-700 text-zinc-300 border-zinc-600" },
};

export default function MultiDayItineraryPanel({ route, isOnline, session, onItineraryUpdated, onRecalculateRoute }) {
  const [days, setDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingStopId, setEditingStopId] = useState(null);
  const [editingStopData, setEditingStopData] = useState({});
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStop, setNewStop] = useState({ name: "", category: "attraction", durationMinutes: 90, notes: "" });

  useEffect(() => {
    if (Array.isArray(route?.days) && route.days.length > 0) {
      setDays(route.days);
    } else if (route?.start && route?.destination) {
      setDays([{
        dayNumber: 1,
        title: `Day 1: ${route.start.name?.split(",")[0] || "Start"} → ${route.destination.name?.split(",")[0] || "Destination"}`,
        date: new Date().toISOString().split("T")[0],
        totalDistanceKm: Number((route.distance / 1000).toFixed(1)),
        totalDurationMinutes: Math.round(route.duration / 60),
        stops: [
          { id: "stop-start", name: `Departure: ${route.start.name?.split(",")[0] || "Start"}`, lat: route.start.lat, lon: route.start.lon, category: "departure", estimatedArrival: "09:00", departureTime: "09:30", durationMinutes: 30, distanceFromPrevKm: 0 },
          ...(route.waypoints || []).map((wp, idx) => ({ id: `stop-wp-${idx}`, name: wp.name, lat: wp.lat, lon: wp.lon, category: "waypoint", estimatedArrival: `${10 + idx}:00`, departureTime: `${11 + idx}:30`, durationMinutes: 90, distanceFromPrevKm: 25 })),
          { id: "stop-dest", name: `Arrival: ${route.destination.name?.split(",")[0] || "Destination"}`, lat: route.destination.lat, lon: route.destination.lon, category: "arrival", estimatedArrival: "16:00", departureTime: "17:00", durationMinutes: 60, distanceFromPrevKm: 30 },
        ],
      }]);
    }
  }, [route]);

  if (!route || days.length === 0) return null;
  const currentDay = days[activeDayIndex] || days[0];

  const handleSaveItinerary = async () => {
    if (!route.tripId) return;
    if (!session || !isOnline) { setSaveMessage("Itinerary saved locally."); setTimeout(() => setSaveMessage(""), 3000); return; }
    try {
      setIsSaving(true);
      const res = await updateTripItineraryRequest(route.tripId, days);
      if (res.days) { setDays(res.days); if (onItineraryUpdated) onItineraryUpdated(res.days); }
      setSaveMessage("Synced to cloud ✓");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch { setSaveMessage("Save failed. Try again."); setTimeout(() => setSaveMessage(""), 3000); }
    finally { setIsSaving(false); }
  };

  const handleAddDay = () => {
    const n = days.length + 1;
    setDays([...days, { dayNumber: n, title: `Day ${n}`, date: new Date().toISOString().split("T")[0], totalDistanceKm: 0, totalDurationMinutes: 0, stops: [], notes: "" }]);
    setActiveDayIndex(days.length);
  };

  const handleDeleteDay = (idx) => {
    if (days.length <= 1) return;
    setDays(days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1 })));
    setActiveDayIndex(Math.max(0, idx - 1));
  };

  const mutateStops = (fn) => {
    const updated = [...days];
    updated[activeDayIndex] = { ...updated[activeDayIndex], stops: fn([...updated[activeDayIndex].stops]) };
    setDays(updated);
  };

  const moveStopUp   = (i) => mutateStops((s) => { if (i > 0) { [s[i-1], s[i]] = [s[i], s[i-1]]; } return s; });
  const moveStopDown = (i) => mutateStops((s) => { if (i < s.length-1) { [s[i], s[i+1]] = [s[i+1], s[i]]; } return s; });
  const deleteStop   = (i) => mutateStops((s) => s.filter((_, idx) => idx !== i));

  const saveStopEdit = (i) => {
    mutateStops((s) => { s[i] = { ...s[i], ...editingStopData }; return s; });
    setEditingStopId(null);
  };

  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    if (!newStop.name.trim()) return;
    mutateStops((s) => [...s, { id: `custom-${Date.now()}`, name: newStop.name, category: newStop.category, durationMinutes: Number(newStop.durationMinutes) || 60, notes: newStop.notes, estimatedArrival: "12:00", departureTime: "13:30", distanceFromPrevKm: 15 }]);
    setNewStop({ name: "", category: "attraction", durationMinutes: 90, notes: "" });
    setShowAddStopModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <AIBadge>AI Itinerary</AIBadge>
            <span className="text-xs text-zinc-600">{days.length} {days.length === 1 ? "day" : "days"}</span>
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-zinc-100">Trip Itinerary</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {onRecalculateRoute && (
            <button type="button" onClick={() => onRecalculateRoute({ optimize: true })}
              className="flex h-8 items-center gap-1 rounded-xl border border-success-500/30 bg-success-500/10 px-3 text-xs font-medium text-success-400 transition hover:bg-success-500/20">
              <Zap className="h-3.5 w-3.5" /> Optimize
            </button>
          )}
          <button type="button" onClick={handleSaveItinerary} disabled={isSaving}
            className="flex h-8 items-center gap-1 rounded-xl bg-brand-600 px-3 text-xs font-medium text-white transition hover:bg-brand-500 disabled:opacity-50">
            {isSaving ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-400">
          ✦ {saveMessage}
        </div>
      )}

      {/* Day tabs */}
      <div role="tablist" className="scrollbar-none flex gap-1.5 overflow-x-auto">
        {days.map((day, idx) => (
          <button key={day.dayNumber || idx} type="button" role="tab"
            aria-selected={activeDayIndex === idx}
            onClick={() => setActiveDayIndex(idx)}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition min-h-[36px] ${
              activeDayIndex === idx
                ? "bg-brand-600/20 text-brand-300 border border-brand-500/30"
                : "border border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
            }`}>
            Day {day.dayNumber || idx + 1}
            <span className="ml-1 text-[10px] opacity-60">({day.stops?.length || 0})</span>
          </button>
        ))}
        {days.length < 7 && (
          <button type="button" onClick={handleAddDay}
            className="flex items-center gap-1 whitespace-nowrap rounded-xl border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-600 transition hover:border-brand-500/40 hover:text-brand-400 min-h-[36px]">
            <Plus className="h-3 w-3" /> Day
          </button>
        )}
      </div>

      {/* Current day header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <input
            type="text"
            value={currentDay.title || ""}
            onChange={(e) => { const u = [...days]; u[activeDayIndex] = { ...currentDay, title: e.target.value }; setDays(u); }}
            placeholder="Day title…"
            className="flex-1 bg-transparent text-sm font-medium text-zinc-100 placeholder-zinc-700 outline-none"
          />
          <div className="flex items-center gap-2 text-xs text-zinc-600 shrink-0">
            <span>~{Math.round((currentDay.totalDurationMinutes || 0) / 60) || "?"}h</span>
            <span>·</span>
            <span>{currentDay.totalDistanceKm || "?"}km</span>
            {days.length > 1 && (
              <button type="button" onClick={() => handleDeleteDay(activeDayIndex)}
                className="ml-1 rounded-lg p-1 text-zinc-700 transition hover:text-danger-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {/* Add stop */}
        <div className="flex items-center justify-between pb-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-700">Schedule</p>
          <button type="button" onClick={() => setShowAddStopModal(true)}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-600 transition hover:border-brand-500/40 hover:text-brand-400">
            <Plus className="h-3 w-3" /> Add Stop
          </button>
        </div>

        {/* Add stop inline form */}
        {showAddStopModal && (
          <form onSubmit={handleAddStopSubmit} className="mb-3 rounded-2xl border border-brand-800/40 bg-brand-950/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-brand-300">Add stop to Day {activeDayIndex + 1}</p>
              <button type="button" onClick={() => setShowAddStopModal(false)} className="text-zinc-600 hover:text-zinc-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <input type="text" required placeholder="Stop name or landmark" value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  className="h-9 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-500" />
              </div>
              <select value={newStop.category} onChange={(e) => setNewStop({ ...newStop, category: e.target.value })}
                className="h-9 rounded-xl border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none focus:border-brand-500">
                <option value="attraction">Attraction</option>
                <option value="restaurant">Restaurant</option>
                <option value="hotel">Hotel</option>
                <option value="viewpoint">Viewpoint</option>
                <option value="rest">Rest Stop</option>
                <option value="fuel">Fuel</option>
                <option value="other">Other</option>
              </select>
              <input type="number" min="15" step="15" value={newStop.durationMinutes}
                onChange={(e) => setNewStop({ ...newStop, durationMinutes: e.target.value })}
                placeholder="Duration (min)"
                className="h-9 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddStopModal(false)}
                className="h-8 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
              <button type="submit"
                className="h-8 rounded-xl bg-brand-600 px-4 text-xs font-medium text-white hover:bg-brand-500">Add</button>
            </div>
          </form>
        )}

        {currentDay.stops?.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center text-xs text-zinc-700">
            No stops yet. Add stops to build your itinerary.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-5 bottom-5 w-px bg-zinc-800" aria-hidden />

            {currentDay.stops.map((stop, idx) => {
              const meta = STOP_ICONS[stop.category] || STOP_ICONS.other;
              const isEditing = editingStopId === stop.id;

              return (
                <div key={stop.id} className="relative flex gap-3 pb-3 last:pb-0 animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  {/* Icon bubble */}
                  <div className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base ${meta.color}`}>
                    {meta.icon}
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="rounded-2xl border border-brand-800/40 bg-brand-950/20 p-3 space-y-2">
                        <input type="text" value={editingStopData.name ?? stop.name}
                          onChange={(e) => setEditingStopData({ ...editingStopData, name: e.target.value })}
                          className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus:border-brand-500" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="time" value={editingStopData.estimatedArrival ?? stop.estimatedArrival ?? ""}
                            onChange={(e) => setEditingStopData({ ...editingStopData, estimatedArrival: e.target.value })}
                            className="h-8 rounded-xl border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none" />
                          <input type="number" min="15" step="15" value={editingStopData.durationMinutes ?? stop.durationMinutes ?? 60}
                            onChange={(e) => setEditingStopData({ ...editingStopData, durationMinutes: e.target.value })}
                            className="h-8 rounded-xl border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 outline-none" placeholder="Duration (min)" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => saveStopEdit(idx)} className="h-7 rounded-lg bg-brand-600 px-3 text-xs text-white hover:bg-brand-500">Save</button>
                          <button type="button" onClick={() => setEditingStopId(null)} className="h-7 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 transition hover:border-zinc-700">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-100 truncate">{stop.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
                              {stop.estimatedArrival && <span>🕐 {stop.estimatedArrival}</span>}
                              {stop.durationMinutes && <span>⏱ {stop.durationMinutes}m</span>}
                              {stop.distanceFromPrevKm > 0 && <span>📍 {stop.distanceFromPrevKm}km</span>}
                            </div>
                          </div>
                          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                            {idx > 0 && (
                              <button type="button" onClick={() => moveStopUp(idx)} className="rounded-lg p-1 text-zinc-700 hover:text-zinc-400">
                                <ArrowUp className="h-3 w-3" />
                              </button>
                            )}
                            {idx < currentDay.stops.length - 1 && (
                              <button type="button" onClick={() => moveStopDown(idx)} className="rounded-lg p-1 text-zinc-700 hover:text-zinc-400">
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            )}
                            <button type="button" onClick={() => { setEditingStopId(stop.id); setEditingStopData({}); }}
                              className="rounded-lg px-2 py-1 text-[10px] text-zinc-700 hover:text-brand-400">Edit</button>
                            <button type="button" onClick={() => deleteStop(idx)} className="rounded-lg p-1 text-zinc-700 hover:text-danger-400">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        {stop.notes && <p className="mt-1 text-[10px] text-zinc-600 italic">{stop.notes}</p>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
