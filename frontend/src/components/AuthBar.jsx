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
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
      {session?.user ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-300">
            Signed in as <span className="font-medium text-white">{session.user.email}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300 hover:text-rose-100"
          >
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuthentication} className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              required
              minLength={12}
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
            />
          </div>
          <button
            disabled={authLoading}
            className="rounded-xl bg-cyan-400 px-5 py-2 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:bg-cyan-800"
          >
            {authLoading ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode((mode) => (mode === "login" ? "register" : "login"));
              setAuthError("");
            }}
            className="text-sm text-cyan-200 transition hover:text-cyan-100"
          >
            {authMode === "login" ? "Create account" : "Use existing account"}
          </button>
          {authError && <p className="text-sm text-rose-200">{authError}</p>}
        </form>
      )}
    </section>
  );
}
