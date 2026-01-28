'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectRulesState {
  projectPath: string;
  projectName: string;
  area: string;
  enabledRules: string[];
}

interface UnifiedPermissionsState {
  allRules: string[];
  globalEnabled: string[];
  areaEnabled: Record<string, string[]>;
  projects: ProjectRulesState[];
  drift: Record<string, string[]>;
}

const AREA_COLORS: Record<string, string> = {
  bellwether: '#3b82f6',
  sophia: '#f97316',
  personal: '#22c55e',
};

const AREA_LABELS: Record<string, string> = {
  bellwether: 'Bellwether',
  sophia: 'Sophia',
  personal: 'Personal',
};

const AREA_ORDER = ['bellwether', 'sophia', 'personal'];

/**
 * Parse a rule string into tool and pattern components
 */
function parseRule(raw: string): { tool: string; pattern: string | null } {
  const match = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.+)\)$/);
  if (match) {
    return { tool: match[1], pattern: match[2] };
  }
  return { tool: raw, pattern: null };
}

/**
 * Format a rule for display
 */
function formatRule(raw: string): string {
  const { tool, pattern } = parseRule(raw);
  if (pattern) {
    return `${tool}(${pattern})`;
  }
  return tool;
}

function Checkbox({
  checked,
  onChange,
  disabled,
  disabledChecked,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  disabledChecked?: boolean;
}) {
  // Special state: disabled but should appear checked (for global-enabled rules)
  const isDisabledChecked = disabled && disabledChecked;
  const isChecked = checked || isDisabledChecked;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center transition-colors',
        isChecked && !isDisabledChecked && 'bg-blue-600 border-blue-600 text-white',
        isDisabledChecked && 'bg-blue-600/40 border-blue-600/40 text-white/60 cursor-not-allowed',
        !isChecked && 'border-zinc-600 bg-zinc-800',
        disabled && !isDisabledChecked && 'cursor-not-allowed opacity-50'
      )}
    >
      {isChecked && <Check className="h-3 w-3" />}
    </button>
  );
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<UnifiedPermissionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/permissions');
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const data = await res.json();
        setPermissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  const toggleGlobalRule = useCallback(
    async (rule: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`global-${rule}`);

      const newGlobalEnabled = enabled
        ? [...permissions.globalEnabled, rule]
        : permissions.globalEnabled.filter((r) => r !== rule);

      // Optimistic update: update global, all area rules, AND all projects (backend cascades to all)
      setPermissions((prev) => {
        if (!prev) return prev;
        const newAreaEnabled = { ...prev.areaEnabled };
        for (const area of AREA_ORDER) {
          const current = newAreaEnabled[area] || [];
          if (enabled) {
            newAreaEnabled[area] = current.includes(rule) ? current : [...current, rule];
          } else {
            newAreaEnabled[area] = current.filter((r) => r !== rule);
          }
        }
        // Clear drift for this rule since we're syncing
        const newDrift = { ...prev.drift };
        for (const area of AREA_ORDER) {
          if (newDrift[area]) {
            newDrift[area] = newDrift[area].filter((r) => r !== rule);
            if (newDrift[area].length === 0) delete newDrift[area];
          }
        }
        // Update all projects' enabledRules
        const newProjects = prev.projects.map((project) => {
          if (enabled) {
            return project.enabledRules.includes(rule)
              ? project
              : { ...project, enabledRules: [...project.enabledRules, rule] };
          } else {
            return { ...project, enabledRules: project.enabledRules.filter((r) => r !== rule) };
          }
        });
        return { ...prev, globalEnabled: newGlobalEnabled, areaEnabled: newAreaEnabled, drift: newDrift, projects: newProjects };
      });

      try {
        const res = await fetch('/api/permissions/rule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule, scope: 'global', enabled }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
        // Rollback on error — refetch to get accurate state
        setPermissions((prev) =>
          prev
            ? {
                ...prev,
                globalEnabled: enabled
                  ? prev.globalEnabled.filter((r) => r !== rule)
                  : [...prev.globalEnabled, rule],
              }
            : prev
        );
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const toggleAreaRule = useCallback(
    async (areaValue: string, rule: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`area:${areaValue}-${rule}`);

      const currentAreaRules = permissions.areaEnabled[areaValue] || [];
      const newAreaRules = enabled
        ? [...currentAreaRules, rule]
        : currentAreaRules.filter((r) => r !== rule);

      // Optimistic update: update area AND projects in that area (backend cascades to projects)
      setPermissions((prev) => {
        if (!prev) return prev;
        // Update projects in this area
        const newProjects = prev.projects.map((project) => {
          if (project.area !== areaValue) return project;
          if (enabled) {
            return project.enabledRules.includes(rule)
              ? project
              : { ...project, enabledRules: [...project.enabledRules, rule] };
          } else {
            return { ...project, enabledRules: project.enabledRules.filter((r) => r !== rule) };
          }
        });
        return { ...prev, areaEnabled: { ...prev.areaEnabled, [areaValue]: newAreaRules }, projects: newProjects };
      });

      try {
        const res = await fetch('/api/permissions/rule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule, scope: `area:${areaValue}`, enabled }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
        // Rollback on error
        setPermissions((prev) =>
          prev
            ? {
                ...prev,
                areaEnabled: {
                  ...prev.areaEnabled,
                  [areaValue]: enabled
                    ? currentAreaRules
                    : [...currentAreaRules, rule],
                },
              }
            : prev
        );
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const toggleProjectRule = useCallback(
    async (projectPath: string, rule: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`${projectPath}-${rule}`);

      const projectIndex = permissions.projects.findIndex(
        (p) => p.projectPath === projectPath
      );
      if (projectIndex === -1) return;

      const project = permissions.projects[projectIndex];
      const newEnabledRules = enabled
        ? [...project.enabledRules, rule]
        : project.enabledRules.filter((r) => r !== rule);

      // Optimistic update
      setPermissions((prev) => {
        if (!prev) return prev;
        const newProjects = [...prev.projects];
        newProjects[projectIndex] = { ...project, enabledRules: newEnabledRules };
        return { ...prev, projects: newProjects };
      });

      try {
        const res = await fetch('/api/permissions/rule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule, scope: projectPath, enabled }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
        // Rollback on error
        setPermissions((prev) => {
          if (!prev) return prev;
          const newProjects = [...prev.projects];
          newProjects[projectIndex] = {
            ...project,
            enabledRules: enabled
              ? project.enabledRules.filter((r) => r !== rule)
              : [...project.enabledRules, rule],
          };
          return { ...prev, projects: newProjects };
        });
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const syncGlobalToAreas = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/permissions/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync');
      // Refetch permissions to get updated state
      const permRes = await fetch('/api/permissions');
      if (permRes.ok) {
        setPermissions(await permRes.json());
      }
    } catch {
      setError('Failed to sync permissions');
    } finally {
      setSyncing(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!permissions) {
    return null;
  }

  // Group projects by area for column ordering
  const projectsByArea = permissions.projects.reduce(
    (acc, project) => {
      if (!acc[project.area]) acc[project.area] = [];
      acc[project.area].push(project);
      return acc;
    },
    {} as Record<string, ProjectRulesState[]>
  );

  // Create Sets for fast lookup
  const globalEnabledSet = new Set(permissions.globalEnabled);
  const areaEnabledSets: Record<string, Set<string>> = {};
  for (const [area, rules] of Object.entries(permissions.areaEnabled || {})) {
    areaEnabledSets[area] = new Set(rules);
  }

  // Drift detection: global rules missing from areas
  const driftSets: Record<string, Set<string>> = {};
  const totalDriftCount = Object.entries(permissions.drift || {}).reduce((count, [area, rules]) => {
    driftSets[area] = new Set(rules);
    return count + rules.length;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Permissions</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure Claude Code auto-permissions for each project. Changes are saved immediately to
          each project&apos;s <code className="text-zinc-400">.claude/settings.local.json</code>.
          Global permissions apply to all projects.
        </p>
      </div>

      {/* Drift Warning Banner */}
      {totalDriftCount > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-900/20 border border-amber-700/40 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {totalDriftCount} global permission{totalDriftCount !== 1 ? 's' : ''} missing from area settings
            </span>
          </div>
          <button
            onClick={syncGlobalToAreas}
            disabled={syncing}
            className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>
      )}

      {/* Unified Permissions Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-200px)]">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-zinc-800 bg-zinc-900">
                <th className="text-left p-3 text-sm font-medium text-zinc-400 sticky left-0 bg-zinc-900 z-20 min-w-[280px]">
                  Rule
                </th>
                <th className="p-3 text-sm font-medium text-zinc-400 text-center min-w-[80px]">
                  <div className="text-zinc-300">Global</div>
                  <div className="text-[10px] text-zinc-500">~/.claude</div>
                </th>
                {AREA_ORDER.map((area) => {
                  const projects = projectsByArea[area] || [];
                  return [
                    <th
                      key={`area-${area}`}
                      className="p-3 text-sm font-medium text-center min-w-[80px] border-l border-zinc-700/50"
                    >
                      <div className="font-semibold" style={{ color: AREA_COLORS[area] }}>
                        {AREA_LABELS[area]}
                      </div>
                      <div className="text-[10px] text-zinc-500">~/.claude-{area}</div>
                    </th>,
                    ...projects.map((project) => (
                      <th
                        key={project.projectPath}
                        className="p-3 text-sm font-medium text-center min-w-[100px]"
                      >
                        <div
                          className="text-zinc-300 truncate"
                          title={project.projectPath}
                          style={{ color: AREA_COLORS[area] }}
                        >
                          {project.projectName}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase">{area}</div>
                      </th>
                    )),
                  ];
                })}
              </tr>
            </thead>
            <tbody>
              {permissions.allRules.map((rule, idx) => {
                const isGlobalEnabled = globalEnabledSet.has(rule);
                const isSavingGlobal = saving === `global-${rule}`;

                return (
                  <tr
                    key={rule}
                    className={cn(
                      'border-b border-zinc-800/50 hover:bg-zinc-800/30',
                      idx % 2 === 0 && 'bg-zinc-900/20'
                    )}
                  >
                    <td className="p-3 sticky left-0 bg-inherit">
                      <div className="text-sm font-mono text-zinc-200" title={rule}>
                        {formatRule(rule)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        {isSavingGlobal ? (
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        ) : (
                          <Checkbox
                            checked={isGlobalEnabled}
                            onChange={(checked) => toggleGlobalRule(rule, checked)}
                          />
                        )}
                      </div>
                    </td>
                    {AREA_ORDER.map((area) => {
                      const projects = projectsByArea[area] || [];
                      const isAreaEnabled = areaEnabledSets[area]?.has(rule) ?? false;
                      const isSavingArea = saving === `area:${area}-${rule}`;
                      const hasDrift = driftSets[area]?.has(rule) ?? false;

                      return [
                        <td
                          key={`area-${area}`}
                          className={cn(
                            'p-3 text-center border-l border-zinc-700/50',
                            hasDrift && 'bg-amber-900/15'
                          )}
                        >
                          <div className="flex justify-center items-center gap-1">
                            {isSavingArea ? (
                              <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                            ) : (
                              <>
                                <Checkbox
                                  checked={isAreaEnabled}
                                  onChange={(checked) => toggleAreaRule(area, rule, checked)}
                                />
                                {hasDrift && (
                                  <span title="Missing from area — set globally but not synced">
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>,
                        ...projects.map((project) => {
                          const isProjectEnabled = project.enabledRules.includes(rule);
                          const isSavingProject = saving === `${project.projectPath}-${rule}`;

                          return (
                            <td key={project.projectPath} className="p-3 text-center">
                              <div className="flex justify-center">
                                {isSavingProject ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                                ) : (
                                  <Checkbox
                                    checked={isProjectEnabled}
                                    onChange={(checked) =>
                                      toggleProjectRule(project.projectPath, rule, checked)
                                    }
                                  />
                                )}
                              </div>
                            </td>
                          );
                        }),
                      ];
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        {permissions.allRules.length} rules total
      </div>
    </div>
  );
}
