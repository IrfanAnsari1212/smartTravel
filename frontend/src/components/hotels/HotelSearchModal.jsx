import { useState, useEffect, useCallback, useId } from "react";
import { searchHotelsRequest } from "../../services/hotelService";
import { formatDistance } from "../../utils/formatters";

export default function HotelSearchModal({
  isOpen,
  onClose,
  currentLocation,
  route,
}) {
  const [targetType, setTargetType] = useState("destination"); // 'destination' | 'current' | 'custom'
  const [customQuery, setCustomQuery] = useState("");
  const [radius, setRadius] = useState(10000); // 10 km default
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const checkInInputId = useId();
  const checkOutInputId = useId();
  const guestsInputId = useId();
  const roomsInputId = useId();

  const [loading, setLoading] = useState(false);
  const [hotelsData, setHotelsData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let payload = {
        radius,
        checkIn,
        checkOut,
        guests,
        rooms,
      };

      if (targetType === "destination") {
        if (route?.destination?.lat && route?.destination?.lon) {
          payload.lat = route.destination.lat;
          payload.lon = route.destination.lon;
        } else if (route?.destination?.name) {
          payload.query = route.destination.name;
        } else {
          payload.query = "Delhi";
        }
      } else if (targetType === "current") {
        if (currentLocation?.lat && currentLocation?.lon) {
          payload.lat = currentLocation.lat;
          payload.lon = currentLocation.lon;
        } else if (route?.start?.lat) {
          payload.lat = route.start.lat;
          payload.lon = route.start.lon;
        } else {
          payload.query = "Delhi";
        }
      } else {
        if (!customQuery.trim()) {
          setErrorMessage("Please enter a city or destination name to search.");
          setLoading(false);
          return;
        }
        payload.query = customQuery.trim();
      }

      const res = await searchHotelsRequest(payload);
      setHotelsData(res);
    } catch (err) {
      console.error("Hotel search failed:", err);
      setErrorMessage(
        err.response?.data?.message || "Failed to search hotels. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [targetType, route, currentLocation, customQuery, radius, checkIn, checkOut, guests, rooms]);

  useEffect(() => {
    if (isOpen) {
      handleSearch();
    }
  }, [isOpen, handleSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-indigo-500/40 bg-slate-950 shadow-2xl shadow-indigo-950/50 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-500/30 bg-indigo-500/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl border border-indigo-500/30">
              🏨
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Hotel & Room Search</h2>
              <p className="text-xs text-indigo-300">
                Live verified accommodation directory & direct provider availability
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search Controls Card */}
        <div className="border-b border-slate-800 bg-slate-900/80 p-5 space-y-4">
          {/* Target Location Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Search near:</span>
            <button
              type="button"
              onClick={() => setTargetType("destination")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                targetType === "destination"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🏁 Destination ({route?.destination?.name?.split(",")[0] || "Route End"})
            </button>

            <button
              type="button"
              onClick={() => setTargetType("current")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                targetType === "current"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              📍 My Location / Start
            </button>

            <button
              type="button"
              onClick={() => setTargetType("custom")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                targetType === "custom"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              🔍 Custom City
            </button>
          </div>

          {targetType === "custom" && (
            <div>
              <input
                type="text"
                placeholder="Enter city or area name (e.g. Manali, Goa, Jaipur)"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* Dates & Guests Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor={checkInInputId} className="block text-[10px] text-slate-400">Check-in</label>
              <input
                id={checkInInputId}
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor={checkOutInputId} className="block text-[10px] text-slate-400">Check-out</label>
              <input
                id={checkOutInputId}
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor={guestsInputId} className="block text-[10px] text-slate-400">Guests</label>
              <select
                id={guestsInputId}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={roomsInputId} className="block text-[10px] text-slate-400">Rooms</label>
              <select
                id={roomsInputId}
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "Room" : "Rooms"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Radius:</span>
              {[5000, 10000, 20000, 35000].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] border ${
                    radius === r
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-200 font-semibold"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {r / 1000} km
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:bg-indigo-900"
            >
              {loading ? "Searching Hotels..." : "🔍 Search Availability"}
            </button>
          </div>
        </div>

        {/* Results List Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              ⚠️ {errorMessage}
            </p>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <span className="inline-block text-3xl animate-bounce mb-2">🏨</span>
              <p>Searching verified accommodation providers and inventory...</p>
            </div>
          ) : !hotelsData || hotelsData.hotels?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-xs text-slate-500">
              No hotels found within {radius / 1000} km. Try expanding your search radius or selecting a different location.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Found <strong className="text-white">{hotelsData.totalFound}</strong> accommodations near{" "}
                  <strong className="text-indigo-300">{hotelsData.searchCenter?.name?.split(",")[0] || "Location"}</strong>
                </span>
                <span>
                  {checkIn} → {checkOut} ({guests} Guests, {rooms} Room)
                </span>
              </div>

              <div className="space-y-3">
                {hotelsData.hotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900/90"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{hotel.name}</h3>
                          {hotel.stars && (
                            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              {"⭐".repeat(hotel.stars)}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 capitalize">
                            {hotel.type}
                          </span>
                        </div>
                        {hotel.address && (
                          <p className="mt-1 text-xs text-slate-400">{hotel.address}</p>
                        )}
                        {hotel.distanceMeters && (
                          <p className="mt-0.5 text-[11px] font-semibold text-indigo-300">
                            📍 {formatDistance(hotel.distanceMeters)} away
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hotel.phone && (
                          <a
                            href={`tel:${hotel.phone.replace(/[^0-9+]/g, "")}`}
                            className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                          >
                            📞 Call
                          </a>
                        )}
                        <a
                          href={hotel.directBookingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500"
                        >
                          Check Rates ↗
                        </a>
                      </div>
                    </div>

                    {/* Amenities List */}
                    {hotel.amenities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-800/80 pt-2.5">
                        {hotel.amenities.map((amenity, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300"
                          >
                            ✔ {amenity}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

