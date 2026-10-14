import { requireUser } from '@/lib/auth';
import { listRecentAudit } from '@/lib/audit';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default async function Audit() {
  await requireUser();
  const events = listRecentAudit(50);

  return (
    <main className="bg-background min-h-screen px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-[1120px]">
        <header className="border-border mb-10 border-b pb-7">
          <p className="text-amber font-mono text-xs tracking-[0.18em] uppercase">
            Audit trail / 03
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything leaves a signal.
          </h1>
          <p className="text-muted mt-2 max-w-xl text-sm">
            A chronological record of sign-ins and access changes.
          </p>
        </header>
        <div className="border-border bg-panel overflow-x-auto border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-border text-muted border-b font-mono text-[10px] tracking-wider uppercase">
              <tr>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="text-muted px-5 py-10" colSpan={4}>
                    No activity has been recorded yet.
                  </td>
                </tr>
              ) : (
                events.map(({ event, actor }) => (
                  <tr className="border-border border-b last:border-0" key={event.id}>
                    <td className="text-muted px-5 py-5 text-xs">{formatDate(event.createdAt)}</td>
                    <td className="px-5 py-5">
                      <p>{actor.name}</p>
                      <p className="text-muted mt-1 text-xs">{actor.email}</p>
                    </td>
                    <td className="text-amber px-5 py-5 font-mono text-xs">
                      {event.action.replaceAll('_', ' ')}
                    </td>
                    <td
                      className={
                        event.outcome === 'success'
                          ? 'text-teal px-5 py-5 font-mono text-xs uppercase'
                          : 'text-red px-5 py-5 font-mono text-xs uppercase'
                      }
                    >
                      {event.outcome}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
