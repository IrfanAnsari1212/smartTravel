import {
  Compass,
  Map,
  History,
  WifiOff,
  Hotel,
  TriangleAlert,
  Sparkles,
  User,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "plan",    icon: Map,           label: "Plan Trip",  section: "main" },
  { id: "trips",   icon: History,       label: "My Trips",   section: "main" },
  { id: "offline", icon: WifiOff,       label: "Offline",    section: "main" },
];

const ACTION_ITEMS = [
  { id: "hotels",    icon: Hotel,          label: "Hotels",    section: "action" },
  { id: "emergency", icon: TriangleAlert,  label: "Emergency", section: "action", danger: true },
];

export default function SideNav({
  activeView,
  setActiveView,
  session,
  onEmergency,
  onHotels,
  onAIToggle,
  isAIOpen,
}) {
  const handleNavClick = (id) => {
    if (id === "hotels") { onHotels(); return; }
    if (id === "emergency") { onEmergency(); return; }
    setActiveView(id);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col h-full w-[72px] bg-[#0d0d10] border-r border-zinc-800/70 z-20"
        aria-label="Primary navigation"
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-center border-b border-zinc-800/70 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
            <Compass className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Main Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <SideNavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}

          <div className="my-2 border-t border-zinc-800/60" />

          {ACTION_ITEMS.map((item) => (
            <SideNavButton
              key={item.id}
              item={item}
              active={false}
              onClick={() => handleNavClick(item.id)}
            />
          ))}

          {/* AI Toggle */}
          <div className="mt-auto mb-1 border-t border-zinc-800/60 pt-2">
            <button
              type="button"
              onClick={onAIToggle}
              aria-label="Toggle AI Copilot"
              aria-pressed={isAIOpen}
              className={`group relative flex w-full flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-medium transition-all duration-150 ${
                isAIOpen
                  ? "bg-brand-600/20 text-brand-400"
                  : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200"
              }`}
            >
              <Sparkles
                className={`h-5 w-5 transition-transform duration-150 ${isAIOpen ? "scale-110" : "group-hover:scale-105"}`}
              />
              <span>AI</span>
              {isAIOpen && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-400" />
              )}
            </button>
          </div>
        </nav>

        {/* Footer: Auth */}
        <div className="border-t border-zinc-800/70 p-2 shrink-0">
          <div className="flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] text-zinc-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800">
              <User className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <span className="truncate w-full text-center">
              {session?.user?.email?.split("@")[0] || "Guest"}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch border-t border-zinc-800/80 bg-[#0d0d10]/95 backdrop-blur-lg"
        aria-label="Mobile navigation"
      >
        {[...NAV_ITEMS, { id: "ai", icon: Sparkles, label: "AI", section: "ai" }].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => {
              if (item.id === "ai") { onAIToggle(); return; }
              handleNavClick(item.id);
            }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
              (item.id === "ai" ? isAIOpen : activeView === item.id)
                ? "text-brand-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          aria-label="Emergency"
          onClick={onEmergency}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-zinc-500 hover:text-danger-400 transition-colors"
        >
          <TriangleAlert className="h-5 w-5" />
          <span>Emergency</span>
        </button>
      </nav>
    </>
  );
}

function SideNavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={`group relative flex w-full flex-col items-center gap-1 rounded-xl p-2.5 text-[10px] font-medium transition-all duration-150 ${
        active
          ? "bg-brand-600/20 text-brand-400"
          : item.danger
            ? "text-zinc-500 hover:bg-danger-500/10 hover:text-danger-400"
            : "text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-200"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-brand-500" />
      )}
      <Icon className={`h-5 w-5 transition-transform duration-150 ${active ? "scale-110" : "group-hover:scale-105"}`} />
      <span>{item.label}</span>
    </button>
  );
}

