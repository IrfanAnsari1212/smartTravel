import { useState, useEffect, useCallback, useId } from "react";
import {
  fetchEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  fetchNearbyEmergencyServices,
} from "../../services/emergencyService";

const RELATIONSHIPS = [
  "Family",
  "Friend",
  "Emergency Contact",
  "Travel Partner",
  "Doctor",
  "Other",
];

export default function EmergencyHubModal({
  isOpen,
  onClose,
  currentLocation,
  route,
  session,
}) {
  const [activeTab, setActiveTab] = useState("location"); // 'location' | 'contacts' | 'services'
  const [serviceCategory, setServiceCategory] = useState("police"); // 'police' | 'hospitals' | 'pharmacies' | 'fuel' | 'mechanics'
  const [contacts, setContacts] = useState([]);
  const [nearbyData, setNearbyData] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [shareSuccess, setShareSuccess] = useState("");
  const nameInputId = useId();
  const phoneInputId = useId();
  const relInputId = useId();
  const notesInputId = useId();

  // New Contact Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "Family",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Safety Call Countdown State
  const [callCountdown, setCallCountdown] = useState(null); // { targetName, phone, count }
  const [countdownTimer, setCountdownTimer] = useState(null);

  // Load Contacts when open
  const loadContacts = useCallback(async () => {
    if (!session) return;
    try {
      setLoadingContacts(true);
      const list = await fetchEmergencyContacts();
      setContacts(list);
    } catch (err) {
      console.error("Failed to load emergency contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  }, [session]);

  // Load Nearby Services
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
    } finally {
      setLoadingServices(false);
    }
  }, [currentLocation, route]);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      loadServices();
    }
  }, [isOpen, loadContacts, loadServices]);

  // Handle Safety Call Trigger
  const triggerSafetyCall = (targetName, phone) => {
    setCallCountdown({ targetName, phone, count: 3 });
  };

  const cancelSafetyCall = () => {
    if (countdownTimer) clearInterval(countdownTimer);
    setCallCountdown(null);
  };

  useEffect(() => {
    if (!callCountdown) return;

    if (callCountdown.count === 0) {
      const cleanPhone = callCountdown.phone.replace(/[^0-9+]/g, "");
      window.location.href = `tel:${cleanPhone}`;
      setCallCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCallCountdown((prev) => (prev ? { ...prev, count: prev.count - 1 } : null));
    }, 1000);

    setCountdownTimer(timer);

    return () => clearTimeout(timer);
  }, [callCountdown]);

  // Handle Share Location
  const handleShareLocation = async (contactPhone = null) => {
    const lat = currentLocation?.lat || route?.start?.lat || 0;
    const lon = currentLocation?.lon || route?.start?.lon || 0;
    const address = nearbyData?.location?.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const mapsUrl = `https://maps.google.com/?q=${lat},${lon}`;
    const text = `🚨 EMERGENCY ALERT: I need assistance. My current location is: ${address} (${lat.toFixed(5)}, ${lon.toFixed(5)}). Maps link: ${mapsUrl}`;

    if (contactPhone) {
      // SMS URI
      const cleanPhone = contactPhone.replace(/[^0-9+]/g, "");
      window.open(`sms:${cleanPhone}?body=${encodeURIComponent(text)}`, "_blank");
      setShareSuccess(`Opened SMS for ${contactPhone}`);
      setTimeout(() => setShareSuccess(""), 4000);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "🚨 My Emergency Location",
          text,
          url: mapsUrl,
        });
        setShareSuccess("Location shared successfully!");
        setTimeout(() => setShareSuccess(""), 4000);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setShareSuccess("Emergency coordinates & link copied to clipboard!");
      setTimeout(() => setShareSuccess(""), 4000);
    }
  };

  // Add Contact Handler
  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      setFormError("Name and phone number are required.");
      return;
    }

    try {
      setFormError("");
      const created = await addEmergencyContact(newContact);
      setContacts((prev) => [created, ...prev]);
      setNewContact({ name: "", phone: "", relationship: "Family", notes: "" });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save emergency contact.");
    }
  };

  // Delete Contact Handler
  const handleDeleteContact = async (id) => {
    try {
      await deleteEmergencyContact(id);
      setContacts((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Failed to delete contact:", err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lat = currentLocation?.lat || route?.start?.lat || 0;
  const lon = currentLocation?.lon || route?.start?.lon || 0;
  const currentAddress = nearbyData?.location?.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-hub-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 p-2 sm:p-4 backdrop-blur-md"
    >
      <div className="relative flex max-h-[92vh] max-sm:h-full max-sm:max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl max-sm:rounded-2xl border border-rose-500/40 bg-slate-950 shadow-2xl shadow-rose-950/50 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rose-500/30 bg-rose-500/10 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl border border-rose-500/30 animate-pulse">
              🚨
            </span>
            <div>
              <h2 id="emergency-hub-title" className="text-base sm:text-lg font-bold text-white">Emergency Support Hub</h2>
              <p className="text-[11px] sm:text-xs text-rose-300">
                Immediate safety access, contacts, and emergency calling
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close emergency hub"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Safety Call Countdown Overlay */}
        {callCountdown && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-rose-950/95 p-6 text-center backdrop-blur-md">
            <span className="text-5xl animate-bounce">📞</span>
            <h3 className="mt-4 text-xl font-bold text-white">
              Calling {callCountdown.targetName}
            </h3>
            <p className="mt-1 text-sm text-rose-200">
              Connecting via phone ({callCountdown.phone}) in:
            </p>
            <div className="my-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500 text-4xl font-extrabold text-white shadow-xl shadow-rose-500/50 animate-ping">
              {callCountdown.count}
            </div>
            <button
              type="button"
              onClick={cancelSafetyCall}
              className="rounded-full bg-slate-900 border border-slate-700 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              🛑 Cancel Call
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          {[
            { id: "location", label: "📍 Live Location & Share" },
            { id: "contacts", label: `👥 Emergency Contacts (${contacts.length})` },
            { id: "services", label: "🏥 Nearby Services" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === tab.id
                  ? "border-rose-500 text-rose-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {shareSuccess && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200 text-center font-medium">
              ✅ {shareSuccess}
            </div>
          )}

          {/* TAB 1: Live Emergency Location */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <p className="text-xs uppercase tracking-wider text-rose-300 font-semibold">
                  Your Current GPS Position
                </p>
                <p className="mt-1 text-base font-bold text-white">
                  {lat.toFixed(5)}° N, {lon.toFixed(5)}° E
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  {currentAddress}
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleShareLocation()}
                    className="flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-500/30 hover:bg-rose-400"
                  >
                    <span>📤</span>
                    <span>Share Location Alert</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
                      setShareSuccess("Coordinates copied to clipboard!");
                      setTimeout(() => setShareSuccess(""), 3000);
                    }}
                    className="rounded-full border border-slate-700 bg-slate-850 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    📋 Copy Coordinates
                  </button>
                </div>
              </div>

              {/* Direct Emergency Dispatch Helplines */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Official Emergency Helplines
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => triggerSafetyCall("National Emergency Dispatch", "112")}
                    className="flex flex-col items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center transition hover:bg-rose-500/20"
                  >
                    <span className="text-2xl">🚨</span>
                    <span className="mt-1 text-xs font-bold text-white">Emergency</span>
                    <span className="text-[10px] text-rose-300">Dial 112</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSafetyCall("Police Dispatch", "100")}
                    className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center transition hover:bg-cyan-500/20"
                  >
                    <span className="text-2xl">👮</span>
                    <span className="mt-1 text-xs font-bold text-white">Police</span>
                    <span className="text-[10px] text-cyan-300">Dial 100</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerSafetyCall("Ambulance Service", "102")}
                    className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center transition hover:bg-emerald-500/20"
                  >
                    <span className="text-2xl">🚑</span>
                    <span className="mt-1 text-xs font-bold text-white">Ambulance</span>
                    <span className="text-[10px] text-emerald-300">Dial 102</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Emergency Contacts */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Save trusted personal contacts for fast calling and location alerts.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/30"
                >
                  {showAddForm ? "✕ Cancel" : "➕ Add Contact"}
                </button>
              </div>

              {/* Add Contact Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddContactSubmit}
                  className="rounded-2xl border border-slate-700 bg-slate-900 p-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-white">New Emergency Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={nameInputId} className="block text-[10px] text-slate-400">Name</label>
                      <input
                        id={nameInputId}
                        type="text"
                        required
                        placeholder="e.g. Alex Morgan"
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={phoneInputId} className="block text-[10px] text-slate-400">Phone Number</label>
                      <input
                        id={phoneInputId}
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor={relInputId} className="block text-[10px] text-slate-400">Relationship</label>
                      <select
                        id={relInputId}
                        value={newContact.relationship}
                        onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      >
                        {RELATIONSHIPS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={notesInputId} className="block text-[10px] text-slate-400">Notes (Optional)</label>
                      <input
                        id={notesInputId}
                        type="text"
                        placeholder="e.g. Speaks Hindi & English"
                        value={newContact.notes}
                        onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {formError && <p className="text-xs text-rose-300">{formError}</p>}

                  <button
                    type="submit"
                    className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-400"
                  >
                    Save Contact
                  </button>
                </form>
              )}

              {/* Contacts List */}
              {loadingContacts ? (
                <p className="py-4 text-center text-xs text-slate-400">Loading contacts...</p>
              ) : contacts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  No emergency contacts saved yet. Click &quot;➕ Add Contact&quot; above.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {contacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{contact.name}</p>
                          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                            {contact.relationship}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{contact.phone}</p>
                        {contact.notes && (
                          <p className="text-[10px] text-slate-500">{contact.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => triggerSafetyCall(contact.name, contact.phone)}
                          className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                        >
                          <span>📞</span>
                          <span>Call</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareLocation(contact.phone)}
                          className="flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
                        >
                          <span>💬</span>
                          <span>SMS Alert</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact._id)}
                          className="rounded-lg p-1 text-slate-500 hover:text-rose-400"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Nearby Emergency Services */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "police", label: "👮 Police", count: nearbyData?.services?.police?.length || 0 },
                  { id: "hospitals", label: "🏥 Hospitals", count: nearbyData?.services?.hospitals?.length || 0 },
                  { id: "pharmacies", label: "💊 Pharmacies", count: nearbyData?.services?.pharmacies?.length || 0 },
                  { id: "fuel", label: "⛽ Fuel & EV", count: nearbyData?.services?.fuel?.length || 0 },
                  { id: "mechanics", label: "🔧 Mechanics", count: nearbyData?.services?.mechanics?.length || 0 },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setServiceCategory(cat.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      serviceCategory === cat.id
                        ? "border-rose-500 bg-rose-500/20 text-rose-200"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {loadingServices ? (
                <p className="py-6 text-center text-xs text-slate-400">Discovering nearby safety facilities...</p>
              ) : (nearbyData?.services?.[serviceCategory] || []).length === 0 ? (
                <div className="rounded-2xl border border-slate-800 p-6 text-center text-xs text-slate-500">
                  No verified {serviceCategory} detected within 8 km.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {(nearbyData?.services?.[serviceCategory] || []).map((place, idx) => (
                    <div
                      key={place.id || idx}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-white text-xs">{place.name || "Emergency Facility"}</p>
                        {place.address && (
                          <p className="mt-0.5 text-[10px] text-slate-400">{place.address}</p>
                        )}
                        {place.phone && (
                          <p className="mt-0.5 text-[10px] text-cyan-300">📞 {place.phone}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {place.phone && (
                          <button
                            type="button"
                            onClick={() => triggerSafetyCall(place.name, place.phone)}
                            className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/30"
                          >
                            Call
                          </button>
                        )}
                        <a
                          href={`https://maps.google.com/?q=${place.lat},${place.lon}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white"
                        >
                          Directions ↗
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
