import { signIn } from '../actions';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-6 py-12">
      <section className="border-border bg-panel w-full max-w-md border p-8 shadow-2xl shadow-black/20">
        <div className="mb-10 flex items-center gap-3">
          <span className="bg-amber h-3 w-3 rounded-full shadow-[0_0_18px_var(--amber)]" />
          <span className="font-mono text-xs font-bold tracking-[0.22em] uppercase">
            Control Room
          </span>
        </div>
        <p className="text-amber font-mono text-xs tracking-[0.18em] uppercase">
          Restricted access
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to continue.</h1>
        <p className="text-muted mt-3 text-sm leading-6">
          Use your administrator or viewer credentials to access the control plane.
        </p>
        {params.error === 'invalid' && (
          <p className="border-red/40 bg-red/10 text-red mt-6 border px-4 py-3 text-sm">
            The email or password is not valid.
          </p>
        )}
        <form action={signIn} className="mt-8 space-y-5">
          <label className="block text-sm">
            <span className="text-muted mb-2 block">Email address</span>
            <input
              className="border-border bg-background text-foreground placeholder:text-muted focus:border-amber w-full border px-4 py-3 text-sm"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted mb-2 block">Password</span>
            <input
              className="border-border bg-background text-foreground placeholder:text-muted focus:border-amber w-full border px-4 py-3 text-sm"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button
            className="bg-amber hover:bg-amber-strong focus-visible:ring-amber w-full px-4 py-3 text-sm font-semibold text-[#17110a] transition focus-visible:ring-2 disabled:cursor-not-allowed"
            type="submit"
          >
            Enter control room
          </button>
        </form>
        <p className="border-border text-muted mt-8 border-t pt-5 font-mono text-[11px] tracking-wider uppercase">
          Session activity is recorded.
        </p>
      </section>
    </main>
  );
}
