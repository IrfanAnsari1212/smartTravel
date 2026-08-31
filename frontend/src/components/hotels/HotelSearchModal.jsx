import { useState, useEffect, useCallback, useId } from "react";
import { searchHotelsRequest } from "../../services/hotelService";
import { formatDistance } from "../../utils/formatters";
import { X, Search, MapPin, Phone, Star, Loader, Hotel } from "lucide-react";

export default function HotelSearchModal({ isOpen, onClose, currentLocation, route }) {
  const [targetType, setTargetType] = useState("destination");
  const [customQuery, setCustomQuery] = useState("");
  const [radius, setRadius] = useState(10000);
  const [checkIn, setCheckIn] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; });
  const [checkOut, setCheckOut] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0]; });
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hotelsData, setHotelsData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const checkInId = useId();
  const checkOutId = useId();
  const guestsId = useId();
  const roomsId = useId();

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      let payload = { radius, checkIn, checkOut, guests, rooms };
      if (targetType === "destination") {
        if (route?.destination?.lat) { payload.lat = route.destination.lat; payload.lon = route.destination.lon; }
        else { payload.query = route?.destination?.name || "Delhi"; }
      } else if (targetType === "current") {
        if (currentLocation?.lat) { payload.lat = currentLocation.lat; payload.lon = currentLocation.lon; }
        else if (route?.start?.lat) { payload.lat = route.start.lat; payload.lon = route.start.lon; }
        else { payload.query = "Delhi"; }
      } else {
        if (!customQuery.trim()) { setErrorMessage("Please enter a city name."); setLoading(false); return; }
        payload.query = customQuery.trim();
      }
      const res = await searchHotelsRequest(payload);
      setHotelsData(res);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Hotel search failed. Please try again.");
    } finally { setLoading(false); }
  }, [targetType, route, currentLocation, customQuery, radius, checkIn, checkOut, guests, rooms]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="hotel-title"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-800/40 bg-brand-950/50">
              <Hotel className="h-4 w-4 text-brand-400" />
            </div>
            <div>
              <h2 id="hotel-title" className="text-sm font-semibold text-zinc-100">Hotel Search</h2>
              <p className="text-xs text-zinc-600">Real-time accommodation directory</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search controls */}
        <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          {/* Location type */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "destination", label: `Near ${route?.destination?.name?.split(",")[0] || "Destination"}` },
              { id: "current", label: "Near My Location" },
              { id: "custom", label: "Custom City" },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setTargetType(t.id)}
                className={`flex h-8 items-center rounded-xl border px-3 text-xs font-medium transition ${
                  targetType === t.id
                    ? "border-brand-500/50 bg-brand-950/50 text-brand-300"
                    : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {targetType === "custom" && (
            <input type="text" placeholder="City, area or place…" value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-brand-500" />
          )}

          {/* Dates, guests, rooms */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: checkInId, label: "Check-in",  type: "date", value: checkIn,  onChange: setCheckIn },
              { id: checkOutId, label: "Check-out", type: "date", value: checkOut, onChange: setCheckOut },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-[10px] text-zinc-600 mb-1">{f.label}</label>
                <input id={f.id} type={f.type} value={f.value} onChange={(e) => f.onChange(e.target.value)}
                  className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none focus:border-brand-500" />
              </div>
            ))}
            <div>
              <label htmlFor={guestsId} className="block text-[10px] text-zinc-600 mb-1">Guests</label>
              <select id={guestsId} value={guests} onChange={(e) => setGuests(Number(e.target.value))}
                className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none">
                {[1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n} {n===1?"Guest":"Guests"}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={roomsId} className="block text-[10px] text-zinc-600 mb-1">Rooms</label>
              <select id={roomsId} value={rooms} onChange={(e) => setRooms(Number(e.target.value))}
                className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} {n===1?"Room":"Rooms"}</option>)}
              </select>
            </div>
          </div>

          {/* Radius + Search button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-600">Radius:</span>
              {[5000, 10000, 20000, 35000].map((r) => (
                <button key={r} type="button" onClick={() => setRadius(r)}
                  className={`h-7 rounded-lg border px-2.5 text-[11px] font-medium transition ${
                    radius === r
                      ? "border-brand-500/40 bg-brand-950/50 text-brand-300"
                      : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                  }`}>
                  {r/1000}km
                </button>
              ))}
            </div>
            <button type="button" onClick={handleSearch} disabled={loading}
              className="flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:opacity-50">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching…" : "Search Hotels"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {errorMessage && (
            <div role="alert" className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-xs text-danger-400">
              ⚠ {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm text-zinc-500">Searching accommodation providers…</p>
            </div>
          ) : !hotelsData ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Hotel className="h-10 w-10 text-zinc-800" />
              <p className="text-sm text-zinc-600">Set your preferences above and search</p>
            </div>
          ) : hotelsData.hotels?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-12 text-center">
              <p className="text-sm text-zinc-600">No hotels found within {radius/1000}km.</p>
              <p className="mt-1 text-xs text-zinc-700">Try expanding the radius or searching a different location.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>
                  <strong className="text-zinc-300">{hotelsData.totalFound}</strong> hotels near{" "}
                  <strong className="text-brand-400">{hotelsData.searchCenter?.name?.split(",")[0] || "location"}</strong>
                </span>
                <span>{checkIn} → {checkOut} · {guests}g {rooms}r</span>
              </div>

              <div className="space-y-2">
                {hotelsData.hotels.map((hotel) => (
                  <div key={hotel.id} className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-700">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-zinc-100">{hotel.name}</h3>
                          {hotel.stars && (
                            <span className="flex items-center gap-0.5 rounded-full border border-warn-500/30 bg-warn-500/10 px-2 py-0.5 text-[10px] font-medium text-warn-400">
                              <Star className="h-2.5 w-2.5 fill-warn-400" /> {hotel.stars}
                            </span>
                          )}
                          <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 capitalize">
                            {hotel.type}
                          </span>
                        </div>
                        {hotel.address && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{hotel.address}</span>
                          </p>
                        )}
                        {hotel.distanceMeters != null && (
                          <p className="mt-0.5 text-[11px] font-medium text-brand-400">
                            {formatDistance(hotel.distanceMeters)} away
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <a href={hotel.directBookingUrl} target="_blank" rel="noreferrer"
                          className="flex h-8 items-center justify-center rounded-xl bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-500">
                          Check Rates ↗
                        </a>
                        {hotel.phone && (
                          <a href={`tel:${hotel.phone.replace(/[^0-9+]/g, "")}`}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-400 transition hover:border-success-500/40 hover:text-success-400">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Amenities */}
                    {hotel.amenities?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-zinc-800/60 pt-3">
                        {hotel.amenities.map((a, i) => (
                          <span key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
                            ✓ {a}
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
