import { getWorkItemsFromFolder, type WorkItem } from '@/lib/work-items';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const items = await getWorkItemsFromFolder('done');

  // Sort by date descending (most recent first)
  const sortedItems = items.sort((a, b) =>
    b.metadata.created.localeCompare(a.metadata.created)
  );

  // Group by month
  const byMonth: Record<string, WorkItem[]> = {};
  for (const item of sortedItems) {
    const date = new Date(item.metadata.created);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(item);
  }

  const months = Object.keys(byMonth).sort().reverse();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Archive</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {items.length} completed work items
        </p>
      </header>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500">No completed work items yet.</p>
          <p className="text-zinc-600 text-sm mt-1">Ship some work to see it here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {months.map(month => {
            const [year, mon] = month.split('-');
            const monthName = new Date(parseInt(year), parseInt(mon) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

            return (
              <div key={month}>
                <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
                  {monthName}
                </h2>
                <div className="space-y-2">
                  {byMonth[month].map(item => (
                    <ArchiveCard key={item.filename} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArchiveCard({ item }: { item: WorkItem }) {
  const areaColors: Record<string, string> = {
    bellwether: '#3b82f6',
    sophia: '#f97316',
    personal: '#22c55e',
  };

  const area = item.metadata.project.split('/')[0];
  const accent = areaColors[area] || '#6b7280';

  return (
    <Link
      href={`/item/done/${encodeURIComponent(item.filename)}`}
      className="group block"
    >
      <div className="relative p-4 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
          style={{ backgroundColor: accent }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-zinc-200 group-hover:text-white transition-colors">
              {item.title}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
              <span style={{ color: accent }}>{item.metadata.project}</span>
              <span>•</span>
              <span>{item.metadata.created}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-emerald-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Done</span>
          </div>
        </div>

        {item.successCriteria.length > 0 && (
          <div className="mt-2 text-xs text-zinc-500">
            {item.successCriteria.filter(c => c.completed).length}/{item.successCriteria.length} criteria completed
          </div>
        )}
      </div>
    </Link>
  );
}
