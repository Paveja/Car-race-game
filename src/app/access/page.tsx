import { updateUserRole, updateUserStatus } from '../actions';
import { requireUser } from '@/lib/auth';
import { listUsers } from '@/lib/data';

export default async function Access({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const users = listUsers();
  const canManage = user.role === 'administrator';

  return (
    <main className="bg-background min-h-screen px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-[1120px]">
        <header className="border-border mb-10 border-b pb-7">
          <p className="text-amber font-mono text-xs tracking-[0.18em] uppercase">
            Access register / 02
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            People with access.
          </h1>
          <p className="text-muted mt-2 max-w-xl text-sm">
            Review identity state and keep privileged access deliberate.
          </p>
        </header>
        {params.updated && (
          <div className="border-teal/40 bg-teal/10 text-teal mb-6 border px-4 py-3 text-sm">
            Access change recorded successfully.
          </div>
        )}
        {params.error && (
          <div className="border-red/40 bg-red/10 text-red mb-6 border px-4 py-3 text-sm">
            That access change could not be applied. Check the target and your permissions.
          </div>
        )}
        <div className="border-border bg-panel overflow-x-auto border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-border text-muted border-b font-mono text-[10px] tracking-wider uppercase">
              <tr>
                <th className="px-5 py-4">Identity</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">State</th>
                <th className="px-5 py-4">Controls</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr className="border-border border-b last:border-0" key={entry.id}>
                  <td className="px-5 py-5">
                    <p>{entry.name}</p>
                    <p className="text-muted mt-1 text-xs">{entry.email}</p>
                  </td>
                  <td className="px-5 py-5">
                    <form action={updateUserRole} className="flex items-center gap-2">
                      <input name="userId" type="hidden" value={entry.id} />
                      <select
                        className="border-border bg-background text-amber border px-3 py-2 font-mono text-xs disabled:opacity-50"
                        defaultValue={entry.role}
                        disabled={!canManage || entry.id === user.id}
                        name="role"
                        aria-label={`Role for ${entry.name}`}
                      >
                        <option value="administrator">administrator</option>
                        <option value="viewer">viewer</option>
                      </select>
                      {canManage && entry.id !== user.id && (
                        <button
                          className="text-muted hover:text-foreground text-xs underline underline-offset-4"
                          type="submit"
                        >
                          Save
                        </button>
                      )}
                    </form>
                  </td>
                  <td className="px-5 py-5">
                    <span className={entry.active ? 'text-teal' : 'text-red'}>
                      {entry.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    {canManage && entry.id !== user.id ? (
                      <form action={updateUserStatus}>
                        <input name="userId" type="hidden" value={entry.id} />
                        <input
                          name="active"
                          type="hidden"
                          value={entry.active ? 'false' : 'true'}
                        />
                        <button
                          className="text-muted hover:text-foreground text-xs underline underline-offset-4"
                          type="submit"
                        >
                          {entry.active ? 'Suspend access' : 'Restore access'}
                        </button>
                      </form>
                    ) : (
                      <span className="text-muted text-xs">
                        {entry.id === user.id ? 'Your account' : 'View only'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted mt-5 font-mono text-[11px] tracking-wider uppercase">
          {canManage
            ? 'Changes require administrator privileges and create an audit event.'
            : 'Viewer access is read-only.'}
        </p>
      </div>
    </main>
  );
}
