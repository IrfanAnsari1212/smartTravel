import { Wifi, WifiOff, MapPin, Loader, Bell, Moon } from "lucide-react";

export default function TopBar({
  session,
  isOnline,
  locationStatus,
  onAuthClick,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/70 bg-[#0d0d10]/80 px-4 backdrop-blur-md z-20">
      {/* Brand — Mobile only (desktop shows in sidebar) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
          <span className="text-xs font-bold text-white">ST</span>
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">SmartTravel</span>
          <span className="ml-1 text-sm font-semibold text-brand-400">AI</span>
        </div>
      </div>

      {/* Desktop center: tagline */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-600 font-medium tracking-wide">
        <span>SMARTTRAVEL</span>
        <span className="text-brand-500 font-bold">AI</span>
        <span className="text-zinc-800 mx-1">·</span>
        <span>Intelligent journeys, planned around you.</span>
      </div>

      {/* Right: Status indicators + Auth */}
      <div className="flex items-center gap-2">
        {/* Network status */}
        <div
          title={isOnline ? "Online" : "Offline"}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isOnline
              ? "bg-success-500/10 text-success-400"
              : "bg-warn-500/10 text-warn-400"
          }`}
        >
          {isOnline
            ? <Wifi className="h-3 w-3" />
            : <WifiOff className="h-3 w-3" />
          }
          <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
        </div>

        {/* GPS status — only when active */}
        {locationStatus === "locating" && (
          <div className="flex items-center gap-1.5 rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-400">
            <Loader className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Locating</span>
          </div>
        )}
        {locationStatus === "found" && (
          <div className="flex items-center gap-1.5 rounded-full bg-success-500/10 px-2.5 py-1 text-xs font-medium text-success-400">
            <MapPin className="h-3 w-3" />
            <span className="hidden sm:inline">Located</span>
          </div>
        )}

        {/* Auth */}
        {session?.user ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAuthClick}
              className="flex h-8 items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-900 px-3 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600/30 text-[10px] font-bold text-brand-400">
                {session.user.email[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {session.user.email.split("@")[0]}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAuthClick}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-xs font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
