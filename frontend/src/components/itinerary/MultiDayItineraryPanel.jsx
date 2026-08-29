import { useState, useEffect } from "react";
import { updateTripItineraryRequest } from "../../services/tripService";

export default function MultiDayItineraryPanel({
  route,
  isOnline,
  session,
  onItineraryUpdated,
  onRecalculateRoute,
}) {
  const [days, setDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [editingStopId, setEditingStopId] = useState(null);
  const [editingStopData, setEditingStopData] = useState({});
  const [showAddStopModal, setShowAddStopModal] = useState(false);
  const [newStop, setNewStop] = useState({
    name: "",
    category: "attraction",
    durationMinutes: 90,
    notes: "",
  });

  useEffect(() => {
    if (Array.isArray(route?.days) && route.days.length > 0) {
      setDays(route.days);
    } else if (route?.start && route?.destination) {
      // Fallback default single day
      setDays([
        {
          dayNumber: 1,
          title: `Day 1: ${route.start.name?.split(",")[0] || "Start"} to ${route.destination.name?.split(",")[0] || "Destination"}`,
          date: new Date().toISOString().split("T")[0],
          totalDistanceKm: Number((route.distance / 1000).toFixed(1)),
          totalDurationMinutes: Math.round(route.duration / 60),
          stops: [
            {
              id: "stop-start",
              name: `Departure: ${route.start.name?.split(",")[0] || "Start"}`,
              lat: route.start.lat,
              lon: route.start.lon,
              category: "departure",
              estimatedArrival: "09:00",
              departureTime: "09:30",
              durationMinutes: 30,
              distanceFromPrevKm: 0,
            },
            ...(route.waypoints || []).map((wp, idx) => ({
              id: `stop-wp-${idx}`,
              name: wp.name,
              lat: wp.lat,
              lon: wp.lon,
              category: "waypoint",
              estimatedArrival: `${10 + idx}:00`,
              departureTime: `${11 + idx}:30`,
              durationMinutes: 90,
              distanceFromPrevKm: 25,
            })),
            {
              id: "stop-dest",
              name: `Arrival: ${route.destination.name?.split(",")[0] || "Destination"}`,
              lat: route.destination.lat,
              lon: route.destination.lon,
              category: "arrival",
              estimatedArrival: "16:00",
              departureTime: "17:00",
              durationMinutes: 60,
              distanceFromPrevKm: 30,
            },
          ],
        },
      ]);
    }
  }, [route]);

  if (!route || days.length === 0) return null;

  const currentDay = days[activeDayIndex] || days[0];

  // Save full itinerary to backend
  const handleSaveItinerary = async () => {
    if (!route.tripId) return;
    if (!session || !isOnline) {
      setSaveMessage("Offline: Itinerary saved locally.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }

    try {
      setIsSaving(true);
      setSaveMessage("");
      const res = await updateTripItineraryRequest(route.tripId, days);
      if (res.days) {
        setDays(res.days);
        if (onItineraryUpdated) onItineraryUpdated(res.days);
      }
      setSaveMessage("Itinerary updated & synced to cloud!");
      setTimeout(() => setSaveMessage(""), 3500);
    } catch (err) {
      console.error("Failed to update itinerary:", err);
      setSaveMessage("Failed to save itinerary changes.");
      setTimeout(() => setSaveMessage(""), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Day
  const handleAddDay = () => {
    const nextNum = days.length + 1;
    const newDay = {
      dayNumber: nextNum,
      title: `Day ${nextNum}: Route & Exploration`,
      date: new Date().toISOString().split("T")[0],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      stops: [],
      notes: "",
    };
    setDays([...days, newDay]);
    setActiveDayIndex(days.length);
  };

  // Delete Day
  const handleDeleteDay = (dayIdx) => {
    if (days.length <= 1) return;
    const updated = days
      .filter((_, idx) => idx !== dayIdx)
      .map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setDays(updated);
    setActiveDayIndex(Math.max(0, dayIdx - 1));
  };

  // Move Stop Up within current day
  const moveStopUp = (stopIdx) => {
    if (stopIdx <= 0) return;
    const updatedDays = [...days];
    const day = { ...updatedDays[activeDayIndex] };
    const stops = [...day.stops];
    const temp = stops[stopIdx - 1];
    stops[stopIdx - 1] = stops[stopIdx];
    stops[stopIdx] = temp;
    day.stops = stops;
    updatedDays[activeDayIndex] = day;
    setDays(updatedDays);
  };

  // Move Stop Down within current day
  const moveStopDown = (stopIdx) => {
    const updatedDays = [...days];
    const day = { ...updatedDays[activeDayIndex] };
    const stops = [...day.stops];
    if (stopIdx >= stops.length - 1) return;
    const temp = stops[stopIdx + 1];
    stops[stopIdx + 1] = stops[stopIdx];
    stops[stopIdx] = temp;
    day.stops = stops;
    updatedDays[activeDayIndex] = day;
    setDays(updatedDays);
  };

  // Delete Stop from current day
  const deleteStop = (stopIdx) => {
    const updatedDays = [...days];
    const day = { ...updatedDays[activeDayIndex] };
    day.stops = day.stops.filter((_, idx) => idx !== stopIdx);
    updatedDays[activeDayIndex] = day;
    setDays(updatedDays);
  };

  // Move Stop to another Day
  const moveStopToDay = (stopIdx, targetDayIdx) => {
    if (targetDayIdx === activeDayIndex) return;
    const updatedDays = [...days];
    const sourceDay = { ...updatedDays[activeDayIndex] };
    const targetDay = { ...updatedDays[targetDayIdx] };

    const [moved] = sourceDay.stops.splice(stopIdx, 1);
    targetDay.stops = [...targetDay.stops, moved];

    updatedDays[activeDayIndex] = sourceDay;
    updatedDays[targetDayIdx] = targetDay;
    setDays(updatedDays);
  };

  // Save Stop Edit
  const saveStopEdit = (stopIdx) => {
    const updatedDays = [...days];
    const day = { ...updatedDays[activeDayIndex] };
    day.stops[stopIdx] = {
      ...day.stops[stopIdx],
      ...editingStopData,
    };
    updatedDays[activeDayIndex] = day;
    setDays(updatedDays);
    setEditingStopId(null);
  };

  // Add new Stop
  const handleAddStopSubmit = (e) => {
    e.preventDefault();
    if (!newStop.name.trim()) return;

    const updatedDays = [...days];
    const day = { ...updatedDays[activeDayIndex] };
    day.stops = [
      ...day.stops,
      {
        id: `custom-stop-${Date.now()}`,
        name: newStop.name,
        category: newStop.category,
        durationMinutes: Number(newStop.durationMinutes) || 60,
        notes: newStop.notes,
        estimatedArrival: "12:00",
        departureTime: "13:30",
        distanceFromPrevKm: 15,
      },
    ];
    updatedDays[activeDayIndex] = day;
    setDays(updatedDays);
    setNewStop({ name: "", category: "attraction", durationMinutes: 90, notes: "" });
    setShowAddStopModal(false);
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur space-y-4">
      {/* Header & Days Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
            📅
          </span>
          <div>
            <h2 className="text-base font-bold text-white">Multi-Day Trip Itinerary</h2>
            <p className="text-xs text-slate-400">
              {days.length} {days.length === 1 ? "Day" : "Days"} Planned • Reorder, Schedule & Move Stops
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRecalculateRoute && (
            <button
              type="button"
              onClick={() => onRecalculateRoute({ optimize: true })}
              className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              <span>⚡</span>
              <span>Recalculate & Optimize</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveItinerary}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 hover:bg-cyan-300 disabled:bg-cyan-800"
          >
            <span>💾</span>
            <span>{isSaving ? "Saving..." : "Save Itinerary"}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-2.5 text-center text-xs font-medium text-cyan-200">
          ✨ {saveMessage}
        </div>
      )}

      {/* Days Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {days.map((day, idx) => (
          <button
            key={day.dayNumber || idx}
            type="button"
            onClick={() => setActiveDayIndex(idx)}
            className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${
              activeDayIndex === idx
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold"
                : "bg-slate-850 text-slate-300 border border-slate-800 hover:bg-slate-800"
            }`}
          >
            Day {day.dayNumber || idx + 1}
            <span className="ml-1.5 opacity-75 text-[10px]">({day.stops?.length || 0} stops)</span>
          </button>
        ))}

        {days.length < 7 && (
          <button
            type="button"
            onClick={handleAddDay}
            className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-400 hover:border-cyan-400 hover:text-cyan-300"
          >
            ➕ Add Day
          </button>
        )}
      </div>

      {/* Current Day Details Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            type="text"
            value={currentDay.title || ""}
            onChange={(e) => {
              const updated = [...days];
              updated[activeDayIndex] = { ...currentDay, title: e.target.value };
              setDays(updated);
            }}
            placeholder="Day Title (e.g. Day 1: Heritage Sightseeing)"
            className="rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-white hover:border-slate-700 focus:border-cyan-400 focus:bg-slate-900 outline-none"
          />

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-cyan-300">
              ⏱️ ~{Math.round(currentDay.totalDurationMinutes / 60) || 4} hrs
            </span>
            <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-emerald-300">
              🚗 {currentDay.totalDistanceKm || 0} km
            </span>
            {days.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteDay(activeDayIndex)}
                className="rounded-lg p-1 text-slate-500 hover:text-rose-400 text-xs"
                title="Delete this day"
              >
                🗑️ Delete Day
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Day Stops Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Day {currentDay.dayNumber || activeDayIndex + 1} Schedule & Timeline
          </p>
          <button
            type="button"
            onClick={() => setShowAddStopModal(true)}
            className="flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-slate-700"
          >
            <span>➕</span>
            <span>Add Stop</span>
          </button>
        </div>

        {/* Add Stop Inline Modal */}
        {showAddStopModal && (
          <form
            onSubmit={handleAddStopSubmit}
            className="rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white">Add Stop to Day {activeDayIndex + 1}</p>
              <button
                type="button"
                onClick={() => setShowAddStopModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400">Stop Name / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amber Fort"
                  value={newStop.name}
                  onChange={(e) => setNewStop({ ...newStop, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400">Category</label>
                <select
                  value={newStop.category}
                  onChange={(e) => setNewStop({ ...newStop, category: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                >
                  <option value="attraction">Attraction / Sightseeing</option>
                  <option value="restaurant">Restaurant / Dining</option>
                  <option value="hotel">Hotel / Stay</option>
                  <option value="viewpoint">Scenic Viewpoint</option>
                  <option value="other">Other Stop</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400">Duration at Stop (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={newStop.durationMinutes}
                  onChange={(e) => setNewStop({ ...newStop, durationMinutes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Photography spot, buy tickets online"
                  value={newStop.notes}
                  onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-cyan-400 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              Add to Itinerary
            </button>
          </form>
        )}

        {/* Stops Cards List */}
        {(!currentDay.stops || currentDay.stops.length === 0) ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
            No stops added for Day {activeDayIndex + 1} yet. Click &quot;➕ Add Stop&quot; to plan this day.
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentDay.stops.map((stop, idx) => {
              const isEditing = editingStopId === stop.id;

              return (
                <div
                  key={stop.id || idx}
                  className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-2 transition hover:border-slate-700"
                >
                  {/* Segment driving distance badge */}
                  {idx > 0 && stop.distanceFromPrevKm > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pb-1 border-b border-slate-850">
                      <span>🚗 Segment drive:</span>
                      <strong className="text-cyan-300 font-semibold">{stop.distanceFromPrevKm} km</strong>
                    </div>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
                        {idx + 1}
                      </span>
                      <div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingStopData.name || ""}
                              onChange={(e) =>
                                setEditingStopData({ ...editingStopData, name: e.target.value })
                              }
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-xs text-white w-full"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Arrival (e.g. 10:00)"
                                value={editingStopData.estimatedArrival || ""}
                                onChange={(e) =>
                                  setEditingStopData({
                                    ...editingStopData,
                                    estimatedArrival: e.target.value,
                                  })
                                }
                                className="rounded-lg border border-slate-700 bg-slate-900 p-1 text-[11px] text-white w-24"
                              />
                              <input
                                type="text"
                                placeholder="Departure (e.g. 11:30)"
                                value={editingStopData.departureTime || ""}
                                onChange={(e) =>
                                  setEditingStopData({
                                    ...editingStopData,
                                    departureTime: e.target.value,
                                  })
                                }
                                className="rounded-lg border border-slate-700 bg-slate-900 p-1 text-[11px] text-white w-24"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => saveStopEdit(idx)}
                              className="rounded-lg bg-emerald-500 px-3 py-1 text-[10px] font-bold text-slate-950 hover:bg-emerald-400"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-white">{stop.name}</h4>
                              {stop.category && (
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-medium text-slate-400 capitalize">
                                  {stop.category}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              <span>🕒 Arrival: <strong className="text-cyan-300">{stop.estimatedArrival || "09:00"}</strong></span>
                              <span>•</span>
                              <span>Departure: <strong className="text-amber-300">{stop.departureTime || "10:30"}</strong></span>
                              <span>•</span>
                              <span>Stay: <strong className="text-slate-200">{stop.durationMinutes || 90}m</strong></span>
                            </div>
                            {stop.notes && (
                              <p className="mt-0.5 text-[10px] text-slate-400">{stop.notes}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions: Reorder, Move Day, Edit, Delete */}
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveStopUp(idx)}
                          title="Move Up"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          ⬆️
                        </button>
                      )}
                      {idx < currentDay.stops.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveStopDown(idx)}
                          title="Move Down"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                        >
                          ⬇️
                        </button>
                      )}

                      {/* Move to another day selector */}
                      {days.length > 1 && (
                        <select
                          title="Move to Day..."
                          value=""
                          onChange={(e) => moveStopToDay(idx, Number(e.target.value))}
                          className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-cyan-300 outline-none hover:border-slate-700"
                        >
                          <option value="" disabled>👉 Move Day</option>
                          {days.map((d, dIdx) => (
                            <option key={dIdx} value={dIdx} disabled={dIdx === activeDayIndex}>
                              Day {dIdx + 1}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingStopId(null);
                          } else {
                            setEditingStopId(stop.id);
                            setEditingStopData(stop);
                          }
                        }}
                        title="Edit Stop"
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 text-xs"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteStop(idx)}
                        title="Delete Stop"
                        className="rounded-lg p-1 text-slate-500 hover:text-rose-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

