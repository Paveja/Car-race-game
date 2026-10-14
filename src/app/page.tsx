import Link from 'next/link';
import { signOut } from './actions';
import { requireUser } from '@/lib/auth';
import { listRecentAudit } from '@/lib/audit';
import { countByRole, listUsers } from '@/lib/data';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const [users, audit] = [listUsers(), listRecentAudit(6)];

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 lg:grid-cols-[248px_1fr]">
        <aside className="border-border bg-panel border-b px-6 py-7 lg:border-r lg:border-b-0">
          <div className="mb-12 flex items-center gap-3">
            <div className="bg-amber h-3 w-3 rounded-full shadow-[0_0_18px_var(--amber)]" />
            <span className="font-mono text-xs font-bold tracking-[0.22em] uppercase">
              Control Room
            </span>
          </div>
          <nav className="space-y-2 text-sm">
            <Link
              className="border-amber bg-panel-raised text-foreground block border-l-2 px-4 py-3"
              href="/"
            >
              Overview <span className="text-amber float-right">01</span>
            </Link>
            <Link
              className="text-muted hover:border-amber hover:text-foreground block border-l-2 border-transparent px-4 py-3 transition"
              href="/access"
            >
              Access <span className="float-right font-mono text-xs">02</span>
            </Link>
            <Link
              className="text-muted hover:border-amber hover:text-foreground block border-l-2 border-transparent px-4 py-3 transition"
              href="/audit"
            >
              Audit <span className="float-right font-mono text-xs">03</span>
            </Link>
          </nav>
          <div className="border-border text-muted mt-16 border-t pt-5 text-xs">
            <p className="mb-2 font-mono tracking-[0.16em] uppercase">System state</p>
            <p className="text-teal flex items-center gap-2">
              <span className="bg-teal h-2 w-2 rounded-full" /> All services nominal
            </p>
          </div>
          <form action={signOut} className="mt-8">
            <button
              className="text-muted decoration-border hover:text-foreground text-xs underline underline-offset-4 transition"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </aside>
        <section className="px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
          <header className="border-border mb-10 flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-amber mb-3 font-mono text-xs tracking-[0.18em] uppercase">
                Operational overview / 01
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Good to see you, {user.name.split(' ')[0]}.
              </h1>
              <p className="text-muted mt-2 max-w-xl text-sm">
                A quiet view of access, activity, and the health of your control plane.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-muted font-mono text-xs tracking-wider uppercase">Current role</p>
              <p className="text-amber mt-1 text-sm font-medium">{user.role}</p>
            </div>
          </header>
          {params.error === 'forbidden' && (
            <div className="border-red/40 bg-red/10 text-red mb-6 border px-4 py-3 text-sm">
              Your role does not permit that action.
            </div>
          )}
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="border-border bg-panel border p-5">
              <p className="text-muted text-xs">Total identities</p>
              <p className="mt-3 text-3xl font-semibold">
                {users.length.toString().padStart(2, '0')}
              </p>
              <p className="text-muted mt-2 font-mono text-xs">
                {countByRole('administrator')} admin / {countByRole('viewer')} viewer
              </p>
            </div>
            <div className="border-border bg-panel border p-5">
              <p className="text-muted text-xs">Control plane</p>
              <p className="text-teal mt-3 flex items-center gap-2 text-xl font-semibold">
                <span className="bg-teal h-2 w-2 rounded-full" /> Nominal
              </p>
              <p className="text-muted mt-2 font-mono text-xs">database / session / audit</p>
            </div>
            <div className="border-amber/40 bg-amber/10 border p-5">
              <p className="text-amber text-xs">Your access</p>
              <p className="mt-3 text-xl font-semibold">
                {user.role === 'administrator' ? 'Privileged' : 'Read only'}
              </p>
              <p className="text-amber/70 mt-2 font-mono text-xs">
                {user.role === 'administrator' ? 'mutations enabled' : 'inspection only'}
              </p>
            </div>
          </div>
          <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-muted font-mono text-xs tracking-[0.16em] uppercase">
                    Identity register
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">People with access</h2>
                </div>
                <Link className="text-amber text-xs underline underline-offset-4" href="/access">
                  Manage access
                </Link>
              </div>
              <div className="border-border bg-panel overflow-x-auto border">
                <table className="w-full text-left text-sm">
                  <thead className="border-border text-muted border-b font-mono text-[10px] tracking-wider uppercase">
                    <tr>
                      <th className="px-5 py-4">Identity</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">State</th>
                      <th className="px-5 py-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((entry) => (
                      <tr className="border-border border-b last:border-0" key={entry.id}>
                        <td className="px-5 py-4">
                          <p>{entry.name}</p>
                          <p className="text-muted mt-1 text-xs">{entry.email}</p>
                        </td>
                        <td className="text-amber px-5 py-4 font-mono text-xs">{entry.role}</td>
                        <td className="px-5 py-4">
                          <span className={entry.active ? 'text-teal' : 'text-red'}>
                            {entry.active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="text-muted px-5 py-4 text-xs">
                          {formatDate(entry.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-muted font-mono text-xs tracking-[0.16em] uppercase">
                    Recent activity
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Audit signal</h2>
                </div>
                <Link className="text-amber text-xs underline underline-offset-4" href="/audit">
                  Full trail
                </Link>
              </div>
              <div className="divide-border border-border bg-panel divide-y border">
                {audit.map(({ event, actor }) => (
                  <div className="px-5 py-4" key={event.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm">{event.action.replaceAll('_', ' ')}</p>
                      <span
                        className={
                          event.outcome === 'success'
                            ? 'text-teal font-mono text-[10px] uppercase'
                            : 'text-red font-mono text-[10px] uppercase'
                        }
                      >
                        {event.outcome}
                      </span>
                    </div>
                    <p className="text-muted mt-2 text-xs">
                      {actor.name} · {formatDate(event.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
