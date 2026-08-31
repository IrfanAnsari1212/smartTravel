import { useState, useEffect, useCallback, useId } from "react";
import {
  fetchEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  fetchNearbyEmergencyServices,
} from "../../services/emergencyService";
import { X, MapPin, Phone, MessageSquare, Plus, Trash2, Loader, ChevronRight, AlertTriangle } from "lucide-react";

const RELATIONSHIPS = ["Family", "Friend", "Emergency Contact", "Travel Partner", "Doctor", "Other"];

export default function EmergencyHubModal({ isOpen, onClose, currentLocation, route, session }) {
  const [activeTab, setActiveTab] = useState("location");
  const [serviceCategory, setServiceCategory] = useState("police");
  const [contacts, setContacts] = useState([]);
  const [nearbyData, setNearbyData] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const nameInputId = useId();
  const phoneInputId = useId();
  const relInputId = useId();
  const notesInputId = useId();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relationship: "Family", notes: "" });
  const [formError, setFormError] = useState("");
  const [callCountdown, setCallCountdown] = useState(null);
  const [countdownTimer, setCountdownTimer] = useState(null);

  const loadContacts = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingContacts(true);
      const list = await fetchEmergencyContacts();
      setContacts(list);
    } catch (err) {
      console.error("Failed to load emergency contacts:", err);
    } finally { setLoadingContacts(false); }
  }, [session]);

  const loadServices = useCallback(async () => {
    const lat = currentLocation?.lat || route?.start?.lat;
    const lon = currentLocation?.lon || route?.start?.lon;
    if (!lat || !lon) return;
    try {
      setLoadingServices(true);
      const data = await fetchNearbyEmergencyServices(lat, lon, 8000);
      setNearbyData(data);
    } catch (err) {
      console.error("Failed to load nearby emergency services:", err);
    } finally { setLoadingServices(false); }
  }, [currentLocation, route]);

  useEffect(() => {
    if (isOpen) { loadContacts(); loadServices(); }
  }, [isOpen, loadContacts, loadServices]);

  const triggerSafetyCall = (targetName, phone) => setCallCountdown({ targetName, phone, count: 3 });
  const cancelSafetyCall = () => { if (countdownTimer) clearInterval(countdownTimer); setCallCountdown(null); };

  useEffect(() => {
    if (!callCountdown) return;
    if (callCountdown.count === 0) {
      window.location.href = `tel:${callCountdown.phone.replace(/[^0-9+]/g, "")}`;
      setCallCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCallCountdown((prev) => prev ? { ...prev, count: prev.count - 1 } : null), 1000);
    setCountdownTimer(timer);
    return () => clearTimeout(timer);
  }, [callCountdown]);

  const handleShareLocation = async (contactPhone = null) => {
    const lat = currentLocation?.lat || route?.start?.lat || 0;
    const lon = currentLocation?.lon || route?.start?.lon || 0;
    const address = nearbyData?.location?.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    const text = `🚨 EMERGENCY ALERT: I need assistance. Location: ${address} (${lat.toFixed(5)}, ${lon.toFixed(5)}). Maps: ${mapsUrl}`;
    if (contactPhone) {
      window.open(`sms:${contactPhone.replace(/[^0-9+]/g, "")}?body=${encodeURIComponent(text)}`, "_blank");
      setShareSuccess(`Opened SMS for ${contactPhone}`);
      setTimeout(() => setShareSuccess(""), 4000);
      return;
    }
    if (navigator.share) {
      try { await navigator.share({ title: "🚨 My Emergency Location", text, url: mapsUrl }); setShareSuccess("Location shared!"); setTimeout(() => setShareSuccess(""), 4000); return; } catch {}
    }
    if (navigator.clipboard) { await navigator.clipboard.writeText(text); setShareSuccess("Copied to clipboard!"); setTimeout(() => setShareSuccess(""), 4000); }
  };

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) { setFormError("Name and phone are required."); return; }
    try {
      setFormError("");
      const created = await addEmergencyContact(newContact);
      setContacts((prev) => [created, ...prev]);
      setNewContact({ name: "", phone: "", relationship: "Family", notes: "" });
      setShowAddForm(false);
    } catch (err) { setFormError(err.response?.data?.message || "Failed to save contact."); }
  };

  const handleDeleteContact = async (id) => {
    try { await deleteEmergencyContact(id); setContacts((prev) => prev.filter((c) => c._id !== id)); }
    catch (err) { console.error("Failed to delete contact:", err); }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && isOpen) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lat = currentLocation?.lat || route?.start?.lat || 0;
  const lon = currentLocation?.lon || route?.start?.lon || 0;
  const currentAddress = nearbyData?.location?.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  const SERVICE_CATS = [
    { id: "police",     label: "👮 Police" },
    { id: "hospitals",  label: "🏥 Hospitals" },
    { id: "pharmacies", label: "💊 Pharmacies" },
    { id: "fuel",       label: "⛽ Fuel" },
    { id: "mechanics",  label: "🔧 Mechanics" },
  ];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="emergency-hub-title"
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-danger-800/60 bg-zinc-950 shadow-2xl shadow-danger-950/50 max-h-[90vh]">

        {/* Call countdown overlay */}
        {callCountdown && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-danger-950/95 text-center backdrop-blur-md p-6">
            <Phone className="h-12 w-12 text-danger-400 animate-bounce" />
            <h3 className="mt-4 text-xl font-bold text-zinc-100">Calling {callCountdown.targetName}</h3>
            <p className="mt-1 text-sm text-zinc-400">Connecting in…</p>
            <div className="my-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-danger-500 bg-danger-500/20 text-4xl font-extrabold text-danger-400 animate-pulse">
              {callCountdown.count}
            </div>
            <button type="button" onClick={cancelSafetyCall}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800">
              Cancel
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-danger-800/40 bg-danger-950/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-danger-700/40 bg-danger-500/20 animate-pulse">
              <AlertTriangle className="h-4.5 w-4.5 text-danger-400" />
            </div>
            <div>
              <h2 id="emergency-hub-title" className="text-sm font-semibold text-zinc-100">Emergency Hub</h2>
              <p className="text-[11px] text-danger-400/80">Quick access · Contacts · Nearby services</p>
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-zinc-800 bg-zinc-900/60 px-4 pt-2">
          {[
            { id: "location", label: "Location & Call" },
            { id: "contacts", label: `Contacts (${contacts.length})` },
            { id: "services", label: "Nearby Services" },
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-xs font-medium transition ${
                activeTab === tab.id
                  ? "border-danger-500 text-danger-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {shareSuccess && (
            <div className="rounded-xl border border-success-500/30 bg-success-500/10 px-4 py-2.5 text-xs text-success-400 text-center">
              ✓ {shareSuccess}
            </div>
          )}

          {/* TAB 1: Location */}
          {activeTab === "location" && (
            <div className="space-y-4">
              {/* GPS position card */}
              <div className="rounded-2xl border border-danger-800/40 bg-danger-950/20 p-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-danger-500/80 mb-1">GPS Position</p>
                <p className="text-base font-bold text-zinc-100">{lat.toFixed(5)}° N, {lon.toFixed(5)}° E</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />{currentAddress}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleShareLocation()}
                    className="flex h-9 items-center gap-2 rounded-xl bg-danger-600 px-4 text-xs font-semibold text-white transition hover:bg-danger-500">
                    📤 Share Location Alert
                  </button>
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`); setShareSuccess("Coordinates copied!"); setTimeout(() => setShareSuccess(""), 3000); }}
                    className="flex h-9 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-xs text-zinc-400 transition hover:text-zinc-200">
                    📋 Copy Coordinates
                  </button>
                </div>
              </div>

              {/* Emergency helplines */}
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-700">Emergency Helplines (India)</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Emergency", number: "112", icon: "🚨", color: "border-danger-800/40 bg-danger-950/30 hover:bg-danger-950/50 text-danger-400" },
                    { label: "Police",    number: "100", icon: "👮", color: "border-brand-800/40 bg-brand-950/30 hover:bg-brand-950/50 text-brand-400" },
                    { label: "Ambulance", number: "102", icon: "🚑", color: "border-success-800/40 bg-success-950/30 hover:bg-success-950/50 text-success-400" },
                  ].map((h) => (
                    <button key={h.number} type="button"
                      onClick={() => triggerSafetyCall(h.label, h.number)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-center transition ${h.color}`}>
                      <span className="text-2xl">{h.icon}</span>
                      <span className="text-xs font-semibold text-zinc-200">{h.label}</span>
                      <span className="text-[10px] font-bold">{h.number}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contacts */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600">Trusted contacts for quick calling and SMS alerts.</p>
                <button type="button" onClick={() => setShowAddForm(!showAddForm)}
                  className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-300">
                  {showAddForm ? <><X className="h-3 w-3" /> Cancel</> : <><Plus className="h-3 w-3" /> Add</>}
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddContactSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-200">New Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={nameInputId} className="block text-[10px] text-zinc-600 mb-1">Name</label>
                      <input id={nameInputId} type="text" required placeholder="Alex Morgan"
                        value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-danger-500" />
                    </div>
                    <div>
                      <label htmlFor={phoneInputId} className="block text-[10px] text-zinc-600 mb-1">Phone</label>
                      <input id={phoneInputId} type="tel" required placeholder="+91 98765 43210"
                        value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-danger-500" />
                    </div>
                    <div>
                      <label htmlFor={relInputId} className="block text-[10px] text-zinc-600 mb-1">Relationship</label>
                      <select id={relInputId} value={newContact.relationship}
                        onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                        className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100 outline-none">
                        {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={notesInputId} className="block text-[10px] text-zinc-600 mb-1">Notes (optional)</label>
                      <input id={notesInputId} type="text" placeholder="e.g. Speaks Hindi"
                        value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                        className="h-8 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-danger-500" />
                    </div>
                  </div>
                  {formError && <p className="text-xs text-danger-400">{formError}</p>}
                  <button type="submit"
                    className="h-8 rounded-xl bg-danger-600 px-4 text-xs font-semibold text-white transition hover:bg-danger-500">
                    Save Contact
                  </button>
                </form>
              )}

              {loadingContacts ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-600">
                  <Loader className="h-4 w-4 animate-spin" /> Loading contacts…
                </div>
              ) : contacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-xs text-zinc-700">
                  No emergency contacts saved. Add one above.
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c._id} className="group flex items-start justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-zinc-100">{c.name}</p>
                          <span className="rounded-full border border-danger-800/40 bg-danger-950/30 px-2 py-0.5 text-[9px] text-danger-400">{c.relationship}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">{c.phone}</p>
                        {c.notes && <p className="text-[10px] text-zinc-700 italic">{c.notes}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button type="button" onClick={() => triggerSafetyCall(c.name, c.phone)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-success-800/40 bg-success-950/30 px-2.5 text-[10px] font-medium text-success-400 transition hover:bg-success-950/50">
                          <Phone className="h-3 w-3" /> Call
                        </button>
                        <button type="button" onClick={() => handleShareLocation(c.phone)}
                          className="flex h-7 items-center gap-1 rounded-lg border border-brand-800/40 bg-brand-950/30 px-2.5 text-[10px] font-medium text-brand-400 transition hover:bg-brand-950/50">
                          <MessageSquare className="h-3 w-3" /> SMS
                        </button>
                        <button type="button" onClick={() => handleDeleteContact(c._id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-700 transition hover:text-danger-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Nearby Services */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5">
                {SERVICE_CATS.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => setServiceCategory(cat.id)}
                    className={`flex h-8 items-center gap-1 rounded-xl border px-3 text-xs font-medium transition ${
                      serviceCategory === cat.id
                        ? "border-danger-500/40 bg-danger-950/30 text-danger-400"
                        : "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}>
                    {cat.label}
                    <span className="ml-1 text-[10px] opacity-60">({nearbyData?.services?.[cat.id]?.length || 0})</span>
                  </button>
                ))}
              </div>

              {loadingServices ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-zinc-600">
                  <Loader className="h-4 w-4 animate-spin" /> Discovering nearby facilities…
                </div>
              ) : (nearbyData?.services?.[serviceCategory] || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center text-xs text-zinc-700">
                  No {serviceCategory} found within 8 km.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {(nearbyData?.services?.[serviceCategory] || []).map((place, idx) => (
                    <div key={place.id || idx}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200">{place.name || "Emergency Facility"}</p>
                        {place.address && <p className="mt-0.5 text-[10px] text-zinc-500">{place.address}</p>}
                        {place.phone && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-brand-400">
                            <Phone className="h-2.5 w-2.5" /> {place.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        {place.phone && (
                          <button type="button" onClick={() => triggerSafetyCall(place.name, place.phone)}
                            className="flex h-7 items-center gap-1 rounded-lg border border-success-800/40 bg-success-950/30 px-2.5 text-[10px] font-medium text-success-400 hover:bg-success-950/50">
                            <Phone className="h-3 w-3" /> Call
                          </button>
                        )}
                        <a href={`https://maps.google.com/?q=${place.lat},${place.lon}`}
                          target="_blank" rel="noreferrer"
                          className="flex h-7 items-center gap-1 rounded-lg border border-zinc-700 px-2.5 text-[10px] text-zinc-500 hover:text-zinc-300">
                          Directions <ChevronRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
