'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LaunchButton } from '@/components/launch-button';
import type { WorkItem, WorkItemStatus, WorkflowType } from '@/lib/work-items';

type Area = 'bellwether' | 'sophia' | 'personal';

const AREAS: { key: Area; label: string; accent: string; bg: string }[] = [
  { key: 'bellwether', label: 'Bellwether', accent: '#3b82f6', bg: 'rgba(59, 130, 246, 0.06)' },
  { key: 'sophia', label: 'Sophia', accent: '#f97316', bg: 'rgba(249, 115, 22, 0.06)' },
  { key: 'personal', label: 'Personal', accent: '#22c55e', bg: 'rgba(34, 197, 94, 0.06)' },
];

const WORKFLOW_STEPS: { status: WorkItemStatus; label: string; num: string }[] = [
  { status: 'new', label: 'New', num: '01' },
  { status: 'defined', label: 'Defined', num: '02' },
  { status: 'planned', label: 'Planned', num: '03' },
  { status: 'executing', label: 'Executing', num: '04' },
  { status: 'review', label: 'Review', num: '05' },
];

function getArea(project: string): Area {
  if (project.startsWith('bellwether/')) return 'bellwether';
  if (project.startsWith('sophia/')) return 'sophia';
  return 'personal';
}

interface TransitioningState {
  id: string;
  previousStatus: string;
  startedAt: string;
}

interface DashboardClientProps {
  initialBacklog: WorkItem[];
  initialActive: WorkItem[];
}

export function DashboardClient({ initialBacklog, initialActive }: DashboardClientProps) {
  const [backlog, setBacklog] = useState<WorkItem[]>(initialBacklog);
  const [active, setActive] = useState<WorkItem[]>(initialActive);
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());

  const allItems = [...backlog, ...active];

  // Fetch transitioning states and work items
  const fetchData = useCallback(async () => {
    try {
      // Fetch work items and transitioning states in parallel
      const [workItemsRes, transitioningRes] = await Promise.all([
        fetch('/api/work-items'),
        fetch('/api/transitioning'),
      ]);

      if (workItemsRes.ok) {
        const data = await workItemsRes.json();
        setBacklog(data.backlog || []);
        setActive(data.active || []);
      }

      if (transitioningRes.ok) {
        const data = await transitioningRes.json();
        const transitioning = data.transitioning as TransitioningState[];
        const newTransitioningIds = new Set(transitioning.map(t => t.id));

        // Check for completed transitions (status changed)
        for (const t of transitioning) {
          const item = [...(backlog || []), ...(active || [])].find(
            i => i.metadata.id === t.id
          );
          if (item && item.metadata.status !== t.previousStatus) {
            // Status changed, clear the transitioning state
            await fetch(`/api/transitioning?id=${encodeURIComponent(t.id)}`, {
              method: 'DELETE',
            });
            newTransitioningIds.delete(t.id);
          }
        }

        setTransitioningIds(newTransitioningIds);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [backlog, active]);

  // Initial fetch of transitioning states
  useEffect(() => {
    const fetchInitialTransitioning = async () => {
      try {
        const res = await fetch('/api/transitioning');
        if (res.ok) {
          const data = await res.json();
          const transitioning = data.transitioning as TransitioningState[];
          setTransitioningIds(new Set(transitioning.map(t => t.id)));
        }
      } catch (error) {
        console.error('Failed to fetch transitioning states:', error);
      }
    };
    fetchInitialTransitioning();
  }, []);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Callback for when launch button is clicked
  const handleLaunch = useCallback((itemId: string) => {
    setTransitioningIds(prev => new Set([...prev, itemId]));
  }, []);

  // Build a matrix: area -> project -> status -> items[]
  const matrix: Record<Area, Record<string, Record<WorkItemStatus, WorkItem[]>>> = {
    bellwether: {},
    sophia: {},
    personal: {},
  };

  const emptyStatusRecord = (): Record<WorkItemStatus, WorkItem[]> => ({
    new: [], defined: [], planned: [], executing: [], review: [], done: [], blocked: []
  });

  for (const item of allItems) {
    const area = getArea(item.metadata.project);
    const projectName = item.metadata.project.split('/')[1] || 'unknown';
    const status = item.metadata.status;

    if (!matrix[area][projectName]) {
      matrix[area][projectName] = emptyStatusRecord();
    }
    matrix[area][projectName][status].push(item);
  }

  // Helper to get sorted projects for an area (only those with items)
  const getProjectsForArea = (area: Area): string[] => {
    return Object.keys(matrix[area]).sort((a, b) => a.localeCompare(b));
  };

  // Helper to count items in a project across all workflow statuses
  const getProjectItemCount = (area: Area, project: string): number => {
    return WORKFLOW_STEPS.reduce(
      (sum, { status }) => sum + (matrix[area][project]?.[status]?.length || 0),
      0
    );
  };

  // Helper to count total items in an area across all projects
  const getAreaItemCount = (area: Area): number => {
    return getProjectsForArea(area).reduce(
      (sum, project) => sum + getProjectItemCount(area, project),
      0
    );
  };

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
        {/* Stats */}
        <div className="mb-6 flex items-center gap-4 text-sm text-zinc-400">
          <span>{allItems.length} items</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400">{allItems.filter(i => i.metadata.status === 'executing').length} executing</span>
          {transitioningIds.size > 0 && (
            <>
              <span className="text-zinc-600">|</span>
              <span className="text-blue-400">{transitioningIds.size} transitioning</span>
            </>
          )}
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="min-w-[1200px] w-full">
            {/* Column Headers */}
            <div className="grid grid-cols-[160px_repeat(5,1fr)] gap-px bg-zinc-800 mb-px">
              <div className="p-3 bg-zinc-950" /> {/* Empty corner */}
              {WORKFLOW_STEPS.map(({ label, num }) => (
                <div
                  key={num}
                  className="p-3 bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-zinc-500 tabular-nums">
                      {num}
                    </span>
                    <span className="text-sm font-medium text-zinc-300 uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Swimlanes */}
            {AREAS.map(({ key, label, accent, bg }, areaIndex) => {
              const projects = getProjectsForArea(key);
              const totalInArea = getAreaItemCount(key);

              return (
                <div key={key} className={areaIndex > 0 ? 'mt-6' : ''}>
                  {/* Area Header */}
                  <div
                    className="relative p-3 rounded-t flex items-center gap-3"
                    style={{ backgroundColor: bg }}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-tl"
                      style={{ backgroundColor: accent }}
                    />
                    <span
                      className="text-lg font-semibold tracking-wide pl-2"
                      style={{ color: accent }}
                    >
                      {label}
                    </span>
                    <span className="text-[13px] text-zinc-500">
                      {totalInArea} {totalInArea === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Project Sub-Swimlanes */}
                  {projects.length === 0 ? (
                    <div className="grid grid-cols-[160px_repeat(5,1fr)] gap-px bg-zinc-800">
                      <div className="p-3 text-zinc-600 text-sm italic bg-zinc-950/50">
                        No items
                      </div>
                      {WORKFLOW_STEPS.map(({ status }, stepIndex) => (
                        <div
                          key={status}
                          className={`min-h-[60px] p-3 bg-zinc-950/50 ${stepIndex === WORKFLOW_STEPS.length - 1 ? 'rounded-br' : ''}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-px bg-zinc-800">
                      {projects.map((projectName, projectIndex) => {
                        const projectItems = matrix[key][projectName];
                        const projectTotal = getProjectItemCount(key, projectName);
                        const isLastProject = projectIndex === projects.length - 1;

                        return (
                          <div
                            key={projectName}
                            className="grid grid-cols-[160px_repeat(5,1fr)] gap-px"
                          >
                            {/* Project Label */}
                            <div
                              className={`p-3 flex items-center justify-between ${isLastProject ? 'rounded-bl' : ''}`}
                              style={{ backgroundColor: `${bg}` }}
                            >
                              <div className="flex flex-col justify-center min-w-0">
                                <span
                                  className="text-sm font-medium truncate"
                                  style={{ color: `${accent}cc` }}
                                >
                                  {projectName}
                                </span>
                                <span className="text-[12px] text-zinc-500">
                                  {projectTotal} {projectTotal === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <Link
                                href={`/new?project=${key}/${projectName}`}
                                className="flex-shrink-0 p-1 rounded hover:bg-zinc-800/50 transition-colors"
                                title={`Add new item to ${projectName}`}
                              >
                                <Plus
                                  className="w-4 h-4"
                                  style={{ color: `${accent}99` }}
                                />
                              </Link>
                            </div>

                            {/* Cells for each workflow step */}
                            {WORKFLOW_STEPS.map(({ status }, stepIndex) => {
                              const items = projectItems?.[status] || [];
                              const isLast = stepIndex === WORKFLOW_STEPS.length - 1;
                              return (
                                <div
                                  key={status}
                                  className={`min-h-[100px] min-w-0 p-3 bg-zinc-900/50 ${isLast && isLastProject ? 'rounded-br' : ''}`}
                                  style={{ backgroundColor: items.length > 0 ? bg : undefined }}
                                >
                                  <div className="space-y-3 min-w-0">
                                    {items.map(item => (
                                      <KanbanCard
                                        key={item.filename}
                                        item={item}
                                        accent={accent}
                                        isTransitioning={transitioningIds.has(item.metadata.id)}
                                        onLaunch={handleLaunch}
                                      />
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                    </div>
                  )}
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
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-400 uppercase tracking-wider">
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
                      isTransitioning={transitioningIds.has(item.metadata.id)}
                      onLaunch={handleLaunch}
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
  showLaunchButton = true,
  isTransitioning = false,
  onLaunch,
}: {
  item: WorkItem;
  accent: string;
  blocked?: boolean;
  showLaunchButton?: boolean;
  isTransitioning?: boolean;
  onLaunch?: (itemId: string) => void;
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
    <div className="group flex gap-1 min-w-0 items-center">
      <Link
        href={`/item/${item.folder}/${encodeURIComponent(item.filename)}`}
        className="flex flex-1 min-w-0"
      >
        <div
          className={`
            relative p-4 rounded bg-zinc-900 border transition-all duration-150
            ${blocked || isImportant
              ? 'border-red-500/30 hover:border-red-500/50'
              : 'border-zinc-800 hover:border-zinc-700'
            }
            ${isTransitioning ? 'transitioning-card' : ''}
            hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20
          `}
          style={{
            ['--transitioning-accent' as string]: accent,
          }}
        >
          {/* Important indicator */}
          {isImportant && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
          )}

          {/* Content */}
          <div className="space-y-2.5">
            {/* Title */}
            <p className={`text-[17px] font-medium leading-tight line-clamp-2 transition-colors ${isImportant ? 'text-red-300 group-hover:text-red-200' : 'text-zinc-200 group-hover:text-white'}`}>
              {item.title}
            </p>

            {/* Meta row */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-[14px] uppercase tracking-wide truncate min-w-0"
                  style={{ color: accent }}
                >
                  {item.metadata.project.split('/')[1]}
                </span>
                {item.metadata.workflow && (
                  <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                    item.metadata.workflow === 'main'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {item.metadata.workflow}
                  </span>
                )}
              </div>
              {dueStatus && (
                <span
                  className="text-[13px] font-medium px-2 py-1 rounded flex-shrink-0"
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
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedCriteria / totalCriteria) * 100}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
                <span className="text-[14px] text-zinc-400 tabular-nums">
                  {completedCriteria}/{totalCriteria}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Launch button outside the card, to the right */}
      {showLaunchButton && item.metadata.status !== 'done' && (
        <div className="flex-shrink-0">
          <LaunchButton
            folder={item.folder}
            filename={item.filename}
            status={item.metadata.status}
            existingWorkflow={item.metadata.workflow}
            itemId={item.metadata.id}
            onLaunch={onLaunch}
            compact
          />
        </div>
      )}
    </div>
  );
}
