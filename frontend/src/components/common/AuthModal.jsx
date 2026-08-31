import { useId } from "react";
import { X, Sparkles, Mail, Lock, ArrowRight, Loader } from "lucide-react";

export default function AuthModal({
  isOpen,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  authError,
  setAuthError,
  handleAuthentication,
  handleLogout,
  session,
}) {
  const emailId = useId();
  const passwordId = useId();

  if (!isOpen) return null;

  // Signed-in state
  if (session?.user) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl animate-fade-up">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-zinc-100">Signed in</h2>
            <p className="text-sm text-zinc-400">{session.user.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Sign out
          </button>
          <p className="mt-6 text-center text-[11px] text-zinc-700">
            Designed & engineered by <span className="text-zinc-600 font-medium">IRFAN ANSARI</span>
          </p>
        </div>
      </div>
    );
  }

  const isLogin = authMode === "login";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 border-b border-zinc-800/60 px-8 pb-6 pt-8 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-900/40">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-100">SmartTravel</span>
                <span className="text-lg font-bold text-brand-400">AI</span>
              </div>
              <p className="text-[11px] text-zinc-600 -mt-0.5">Intelligent journeys, planned around you.</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {isLogin
                ? "Sign in to plan, save and revisit your journeys."
                : "Join SmartTravel AI to save trips, build itineraries and more."}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAuthentication} className="px-8 py-6 space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-xs font-medium text-zinc-400">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
              <input
                id={emailId}
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={passwordId} className="block text-xs font-medium text-zinc-400">
                Password
              </label>
              <span className="text-[11px] text-zinc-600">min 12 characters</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
              <input
                id={passwordId}
                type="password"
                required
                minLength={12}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="At least 12 characters"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              />
            </div>
          </div>

          {/* Error */}
          {authError && (
            <div role="alert" aria-live="assertive" className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
              ⚠ {authError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={authLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {authLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Please wait…</span>
              </>
            ) : (
              <>
                <span>{isLogin ? "Sign in" : "Create account"}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Switch mode */}
          <div className="text-center text-sm text-zinc-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setAuthMode(isLogin ? "register" : "login"); setAuthError(""); }}
              className="font-semibold text-brand-400 hover:text-brand-300 transition"
            >
              {isLogin ? "Create one" : "Sign in"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-zinc-800/60 px-8 py-4 text-center text-[11px] text-zinc-700">
          Designed & engineered by <span className="text-zinc-600 font-medium">IRFAN ANSARI</span>
        </div>
      </div>
    </div>
  );
}

