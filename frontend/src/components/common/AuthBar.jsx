import { useId } from "react";

export default function AuthBar({
  session,
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
}) {
  const emailInputId = useId();
  const passwordInputId = useId();

  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg backdrop-blur">
      {session?.user ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-300">
            Signed in as <span className="font-semibold text-white">{session.user.email}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out of account"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 transition hover:border-rose-400 hover:text-rose-200 min-h-[44px] flex items-center justify-center"
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuthentication} className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor={emailInputId} className="mb-1 block text-xs sm:text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              id={emailInputId}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none focus:border-cyan-400 min-h-[44px]"
            />
          </div>
          <div className="flex-1">
            <label htmlFor={passwordInputId} className="mb-1 block text-xs sm:text-sm font-medium text-slate-300">
              Password <span className="text-[11px] text-cyan-300 font-normal">(min 12 characters)</span>
            </label>
            <input
              id={passwordInputId}
              type="password"
              required
              minLength={12}
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              placeholder="At least 12 characters"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 outline-none focus:border-cyan-400 min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="rounded-2xl bg-cyan-400 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:bg-cyan-800 min-h-[44px] flex items-center justify-center shadow-md shadow-cyan-500/20"
          >
            {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode((mode) => (mode === "login" ? "register" : "login"));
              setAuthError("");
            }}
            className="px-2 py-2 text-xs sm:text-sm font-semibold text-cyan-300 transition hover:text-cyan-200 min-h-[44px] flex items-center"
          >
            {authMode === "login" ? "Create account" : "Use existing account"}
          </button>
          {authError && (
            <p role="alert" aria-live="assertive" className="text-xs sm:text-sm text-rose-300 font-medium">
              ⚠️ {authError}
            </p>
          )}
        </form>
      )}
    </header>
  );
}
