import { useEffect, useRef } from "react";
import { Wifi, WifiOff, MapPin, Loader, User, LogIn, Map, EyeOff } from "lucide-react";

export default function TopBar({
  session,
  isOnline,
  locationStatus,
  onAuthClick,
  isMapVisible = true,
  onToggleMap,
}) {
  return (
    <header
      role="banner"
      className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0d0d10]/90 px-4 backdrop-blur-md z-20"
    >
      {/* Skip to content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      {/* Brand — Mobile only */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
          <span className="text-xs font-bold text-white">ST</span>
        </div>
        <span className="text-sm font-bold tracking-tight text-zinc-100">
          SmartTravel <span className="text-brand-400">AI</span>
        </span>
      </div>

      {/* Desktop: tagline */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-600 font-medium tracking-wide" aria-hidden="true">
        <span>SMARTTRAVEL</span>
        <span className="text-brand-500 font-bold">AI</span>
        <span className="text-zinc-800 mx-1">·</span>
        <span>Intelligent journeys, planned around you.</span>
      </div>

      {/* Right: status + auth */}
      <div className="flex items-center gap-2" role="status" aria-live="polite" aria-label="Connection and location status">
        {/* Network */}
        <div
          aria-label={isOnline ? "Online" : "Offline — limited functionality"}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOnline ? "bg-success-500/10 text-success-400" : "bg-warn-500/10 text-warn-400"
          }`}
        >
          {isOnline ? <Wifi className="h-3 w-3" aria-hidden /> : <WifiOff className="h-3 w-3" aria-hidden />}
          <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* GPS status */}
        {locationStatus === "locating" && (
          <div aria-label="Detecting location" className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-400">
            <Loader className="h-3 w-3 animate-spin" aria-hidden /> <span className="hidden sm:inline">Locating</span>
          </div>
        )}
        {locationStatus === "found" && (
          <div aria-label="Location detected" className="flex items-center gap-1.5 rounded-full bg-success-500/10 px-2.5 py-1 text-xs font-medium text-success-400">
            <MapPin className="h-3 w-3" aria-hidden /> <span className="hidden sm:inline">Located</span>
          </div>
        )}

        {/* Map Toggle Button */}
        {onToggleMap && (
          <button
            type="button"
            onClick={onToggleMap}
            title={isMapVisible ? "Hide Map" : "Show Map"}
            aria-label={isMapVisible ? "Hide Map" : "Show Map"}
            className={`flex h-8 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition ${
              isMapVisible
                ? "border-brand-500/40 bg-brand-950/40 text-brand-300 hover:bg-brand-950/60"
                : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {isMapVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Map className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isMapVisible ? "Hide Map" : "Show Map"}</span>
          </button>
        )}

        {/* Auth */}
        {session?.user ? (
          <button
            type="button"
            onClick={onAuthClick}
            aria-label={`Account: ${session.user.email}. Click to manage account.`}
            className="flex h-8 items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600/30 text-[10px] font-bold text-brand-400"
              aria-hidden
            >
              {session.user.email[0].toUpperCase()}
            </span>
            <span className="hidden sm:inline max-w-[100px] truncate">
              {session.user.email.split("@")[0]}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onAuthClick}
            aria-label="Sign in to SmartTravel AI"
            className="flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
          >
            <LogIn className="h-3.5 w-3.5 lg:hidden" aria-hidden />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
}
