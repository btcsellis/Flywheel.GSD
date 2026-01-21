import { getAllWorkItems, type WorkItem, type WorkItemStatus } from '@/lib/work-items';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Area = 'bellwether' | 'sophia' | 'personal';

const AREAS: { key: Area; label: string; accent: string; bg: string }[] = [
  { key: 'bellwether', label: 'Bellwether', accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.06)' },
  { key: 'sophia', label: 'Sophia', accent: '#f97316', bg: 'rgba(249, 115, 22, 0.06)' },
  { key: 'personal', label: 'Personal', accent: '#22c55e', bg: 'rgba(34, 197, 94, 0.06)' },
];

const WORKFLOW_STEPS: { status: WorkItemStatus; label: string; num: string }[] = [
  { status: 'created', label: 'Created', num: '01' },
  { status: 'goals-set', label: 'Goals Set', num: '02' },
  { status: 'planned', label: 'Planned', num: '03' },
  { status: 'executing', label: 'Executing', num: '04' },
  { status: 'verifying', label: 'Verifying', num: '05' },
];

function getArea(project: string): Area {
  if (project.startsWith('bellwether/')) return 'bellwether';
  if (project.startsWith('sophia/')) return 'sophia';
  return 'personal';
}

export default async function Dashboard() {
  const { backlog, active } = await getAllWorkItems();
  const allItems = [...backlog, ...active];

  // Build a matrix: area -> status -> items[]
  const matrix: Record<Area, Record<WorkItemStatus, WorkItem[]>> = {
    bellwether: { created: [], 'goals-set': [], planned: [], executing: [], verifying: [], done: [], blocked: [] },
    sophia: { created: [], 'goals-set': [], planned: [], executing: [], verifying: [], done: [], blocked: [] },
    personal: { created: [], 'goals-set': [], planned: [], executing: [], verifying: [], done: [], blocked: [] },
  };

  for (const item of allItems) {
    const area = getArea(item.metadata.project);
    const status = item.metadata.status;
    matrix[area][status].push(item);
  }

  return (
    <div>
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              FLYWHEEL
            </h1>
            <span className="text-xs text-zinc-500 uppercase tracking-widest">
              Work Pipeline
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
            <span>{allItems.length} items</span>
            <span className="text-zinc-700">|</span>
            <span className="text-emerald-500">{allItems.filter(i => i.metadata.status === 'executing').length} executing</span>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Column Headers */}
            <div className="grid grid-cols-[140px_repeat(5,1fr)] gap-px mb-px">
              <div className="p-3" /> {/* Empty corner */}
              {WORKFLOW_STEPS.map(({ label, num }) => (
                <div
                  key={num}
                  className="p-3 bg-zinc-900/50 border-b border-zinc-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      {num}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Swimlanes */}
            {AREAS.map(({ key, label, accent, bg }, areaIndex) => {
              const areaItems = matrix[key];
              const totalInArea = WORKFLOW_STEPS.reduce(
                (sum, { status }) => sum + (areaItems[status]?.length || 0),
                0
              );

              return (
                <div
                  key={key}
                  className={`grid grid-cols-[140px_repeat(5,1fr)] gap-px ${areaIndex > 0 ? 'mt-4' : ''}`}
                >
                  {/* Swimlane Label */}
                  <div
                    className="relative p-3 flex flex-col justify-center rounded-l"
                    style={{ backgroundColor: bg }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                      style={{ backgroundColor: accent }}
                    />
                    <span
                      className="text-sm font-semibold tracking-wide"
                      style={{ color: accent }}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {totalInArea} items
                    </span>
                  </div>

                  {/* Cells for each workflow step */}
                  {WORKFLOW_STEPS.map(({ status }, stepIndex) => {
                    const items = areaItems[status] || [];
                    const isLast = stepIndex === WORKFLOW_STEPS.length - 1;
                    return (
                      <div
                        key={status}
                        className={`min-h-[100px] p-2 bg-zinc-900/20 border-l border-zinc-800/30 ${isLast ? 'rounded-r' : ''}`}
                        style={{ backgroundColor: items.length > 0 ? bg : undefined }}
                      >
                        <div className="space-y-2">
                          {items.map(item => (
                            <KanbanCard key={item.filename} item={item} accent={accent} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked Items (if any) */}
        {(() => {
          const blockedItems = allItems.filter(i => i.metadata.status === 'blocked');
          if (blockedItems.length === 0) return null;

          return (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">
                  Blocked ({blockedItems.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {blockedItems.map(item => {
                  const area = AREAS.find(a => a.key === getArea(item.metadata.project));
                  return (
                    <KanbanCard
                      key={item.filename}
                      item={item}
                      accent={area?.accent || '#ef4444'}
                      blocked
                    />
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function KanbanCard({
  item,
  accent,
  blocked,
}: {
  item: WorkItem;
  accent: string;
  blocked?: boolean;
}) {
  const completedCriteria = item.successCriteria.filter(c => c.completed).length;
  const totalCriteria = item.successCriteria.length;
  const isExecuting = item.metadata.status === 'executing';

  // Check if due date is approaching or past
  const getDueDateStatus = () => {
    if (!item.metadata.dueDate) return null;
    const due = new Date(item.metadata.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { label: 'Overdue', color: '#ef4444' };
    if (daysUntil <= 1) return { label: daysUntil === 0 ? 'Today' : 'Tomorrow', color: '#ef4444' };
    if (daysUntil <= 3) return { label: `${daysUntil}d`, color: '#eab308' };
    return { label: item.metadata.dueDate, color: '#6b7280' };
  };

  const dueStatus = getDueDateStatus();
  const isImportant = item.metadata.important;

  return (
    <Link
      href={`/item/${item.folder}/${encodeURIComponent(item.filename)}`}
      className="group block"
    >
      <div
        className={`
          relative p-2.5 rounded bg-zinc-900 border transition-all duration-150
          ${blocked || isImportant
            ? 'border-red-500/30 hover:border-red-500/50'
            : 'border-zinc-800 hover:border-zinc-700'
          }
          hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20
        `}
      >
        {/* Important indicator */}
        {isImportant && (
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
        )}

        {/* Content */}
        <div className="space-y-1.5">
          {/* Title */}
          <p className={`text-[13px] font-medium leading-tight line-clamp-2 transition-colors ${isImportant ? 'text-red-300 group-hover:text-red-200' : 'text-zinc-200 group-hover:text-white'}`}>
            {item.title}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] uppercase tracking-wide"
              style={{ color: accent }}
            >
              {item.metadata.project.split('/')[1]}
            </span>
            {dueStatus && (
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  color: dueStatus.color,
                  backgroundColor: `${dueStatus.color}15`,
                }}
              >
                {dueStatus.label}
              </span>
            )}
          </div>

          {/* Progress bar for executing items */}
          {isExecuting && totalCriteria > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedCriteria / totalCriteria) * 100}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 tabular-nums">
                {completedCriteria}/{totalCriteria}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
