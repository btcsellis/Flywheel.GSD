import { getWorkItem, type WorkItem, type WorkItemStatus } from '@/lib/work-items';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ folder: string; filename: string }>;
}

const WORKFLOW_STEPS: { status: WorkItemStatus; label: string; num: string }[] = [
  { status: 'created', label: 'Created', num: '01' },
  { status: 'goals-set', label: 'Goals Set', num: '02' },
  { status: 'planned', label: 'Planned', num: '03' },
  { status: 'executing', label: 'Executing', num: '04' },
  { status: 'verifying', label: 'Verifying', num: '05' },
  { status: 'done', label: 'Done', num: '✓' },
];

export default async function WorkItemPage({ params }: Props) {
  const { folder, filename } = await params;
  const validFolder = folder as 'backlog' | 'active' | 'done';
  const item = await getWorkItem(validFolder, decodeURIComponent(filename));

  if (!item) {
    notFound();
  }

  return <WorkItemDetail item={item} />;
}

function WorkItemDetail({ item }: { item: WorkItem }) {
  const areaColors: Record<string, string> = {
    bellwether: '#3b82f6',
    sophia: '#f97316',
    personal: '#22c55e',
  };

  const area = item.metadata.project.split('/')[0];
  const accent = areaColors[area] || '#6b7280';
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.status === item.metadata.status);

  // Check if due date is approaching or past
  const getDueDateStatus = () => {
    if (!item.metadata.dueDate) return null;
    const due = new Date(item.metadata.dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { label: 'Overdue', color: '#ef4444' };
    if (daysUntil <= 1) return { label: daysUntil === 0 ? 'Due today' : 'Due tomorrow', color: '#ef4444' };
    if (daysUntil <= 3) return { label: `Due in ${daysUntil} days`, color: '#eab308' };
    return { label: `Due ${item.metadata.dueDate}`, color: '#6b7280' };
  };

  const dueStatus = getDueDateStatus();
  const isImportant = item.metadata.important;

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Board</Link>
        <span>/</span>
        <span style={{ color: accent }}>{item.metadata.project}</span>
      </div>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className={`text-2xl font-bold leading-tight ${isImportant ? 'text-red-400' : 'text-zinc-100'}`}>
            {item.title}
          </h1>
          <div className="flex items-center gap-2">
            {isImportant && (
              <span className="px-2 py-1 rounded text-xs font-medium text-red-400 bg-red-500/15">
                Important
              </span>
            )}
            {dueStatus && (
              <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  color: dueStatus.color,
                  backgroundColor: `${dueStatus.color}15`,
                }}
              >
                {dueStatus.label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
          <span>ID: <code className="text-zinc-400">{item.metadata.id}</code></span>
          <span>•</span>
          <span>Created {item.metadata.created}</span>
        </div>
      </header>

      {/* Workflow Progress */}
      <div className="mb-8 p-4 bg-zinc-900 rounded border border-zinc-800">
        <div className="flex items-center gap-1">
          {WORKFLOW_STEPS.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isBlocked = item.metadata.status === 'blocked';

            return (
              <div key={step.status} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${isBlocked && isCurrent
                      ? 'bg-red-500 text-white'
                      : isCurrent
                        ? 'bg-zinc-100 text-zinc-900'
                        : isComplete
                          ? 'bg-zinc-700 text-zinc-400'
                          : 'bg-zinc-800 text-zinc-600'
                    }
                  `}
                >
                  {step.num}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      index < currentStepIndex ? 'bg-zinc-600' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Status:</span>
          <span className="text-sm text-zinc-300 font-medium">
            {item.metadata.status === 'blocked' ? (
              <span className="text-red-400">Blocked</span>
            ) : (
              WORKFLOW_STEPS.find(s => s.status === item.metadata.status)?.label || item.metadata.status
            )}
          </span>
        </div>
      </div>

      {/* Description */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Description
        </h2>
        <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
          <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {item.description || 'No description provided.'}
          </p>
        </div>
      </section>

      {/* Success Criteria */}
      <section className="mb-8">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Success Criteria
          {item.successCriteria.length > 0 && (
            <span className="ml-2 text-zinc-600">
              ({item.successCriteria.filter(c => c.completed).length}/{item.successCriteria.length})
            </span>
          )}
        </h2>
        <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
          {item.successCriteria.length === 0 ? (
            <p className="text-zinc-500 text-sm">No success criteria defined.</p>
          ) : (
            <ul className="space-y-3">
              {item.successCriteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div
                    className={`
                      w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                      ${criterion.completed
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'border-zinc-700'
                      }
                    `}
                  >
                    {criterion.completed && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={criterion.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                    {criterion.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Notes */}
      {item.notes && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Notes
          </h2>
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
            <p className="text-zinc-400 whitespace-pre-wrap text-sm leading-relaxed">
              {item.notes}
            </p>
          </div>
        </section>
      )}

      {/* Execution Log */}
      {item.executionLog.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Execution Log
          </h2>
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
            <ul className="space-y-1 text-sm font-mono">
              {item.executionLog.map((entry, index) => (
                <li key={index} className="text-zinc-500">
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Session Info */}
      {item.metadata.assignedSession && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Assigned Session
          </h2>
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
            <code className="text-xs text-zinc-400">{item.metadata.assignedSession}</code>
          </div>
        </section>
      )}
    </div>
  );
}
