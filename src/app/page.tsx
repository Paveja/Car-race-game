import { getAuthenticatedUserId } from '@/lib/auth';
import { OrderConsole } from '@/components/order-console';

export default async function Home() {
  const userId = await getAuthenticatedUserId();

  return (
    <main className="min-h-screen bg-[var(--ink-950)] px-5 py-8 text-[var(--paper)] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex items-end justify-between border-b border-[var(--ink-700)] pb-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--cyan)]">Field order desk</p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Place the order. We’ll handle the rest.</h1>
          </div>
          <span className="hidden rounded-full border border-[var(--ink-600)] px-3 py-1.5 text-xs text-[var(--paper-muted)] sm:inline-flex">Durable processing</span>
        </header>
        {userId ? <OrderConsole /> : (
          <section className="grid gap-8 border border-[var(--ink-700)] bg-[var(--ink-900)] p-8 sm:grid-cols-[1.2fr_0.8fr] sm:p-12">
            <div>
              <p className="mb-4 text-sm font-medium text-[var(--cyan)]">Sign in required</p>
              <h2 className="max-w-md text-3xl font-semibold tracking-[-0.03em]">Your order history stays yours.</h2>
              <p className="mt-4 max-w-lg leading-7 text-[var(--paper-muted)]">Sign in with the configured identity provider to submit an order and follow its progress. Orders are scoped to your account and protected from duplicate submissions.</p>
            </div>
            <div className="flex items-end sm:justify-end">
              <p className="border-l-2 border-[var(--cyan)] pl-4 text-sm leading-6 text-[var(--paper-muted)]">Authentication is not configured in this environment yet. Add Clerk keys to enable the signed-in flow.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
