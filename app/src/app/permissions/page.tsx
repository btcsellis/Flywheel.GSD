'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Loader2, AlertTriangle, ChevronRight, ChevronDown, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddRuleDialog } from '@/components/add-rule-dialog';
import { PermissionLogSection } from '@/components/permission-log-section';
import { AddRuleFromLogDialog } from '@/components/add-rule-from-log-dialog';
import { Button } from '@/components/ui/button';
import type { PermissionLogEntry } from '@/lib/permission-log-helpers';

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
  customCategories?: Record<string, Record<string, string>>;
}

interface EditingRule {
  tool: string;
  pattern: string | null;
  category: string;
  scope: string;
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

// Category definitions with display order
const CATEGORY_ORDER = [
  'File Operations',
  'Git Commands',
  'Testing',
  'Build & Lint',
  'Package Management',
  'GitHub CLI',
  'Flywheel Skills',
  'Other',
] as const;

type Category = (typeof CATEGORY_ORDER)[number];

/**
 * Categorize a rule into one of the predefined categories
 */
function categorizeRule(rule: string): Category {
  // File Operations: Read, Edit, Write
  if (rule.startsWith('Read') || rule.startsWith('Edit') || rule.startsWith('Write')) {
    return 'File Operations';
  }

  // Git Commands
  if (rule.startsWith('Bash(git ') || rule.startsWith('Bash(git:') || rule === 'Bash(git)') {
    return 'Git Commands';
  }

  // Testing
  if (
    rule.includes('npm test') ||
    rule.includes('npm run test') ||
    rule.includes('npx jest') ||
    rule.includes('pytest') ||
    rule.includes('cargo test') ||
    rule.includes('go test')
  ) {
    return 'Testing';
  }

  // Build & Lint
  if (
    rule.includes('npm run build') ||
    rule.includes('npx tsc') ||
    rule.includes('tsc:') ||
    rule.includes('npx next build') ||
    rule.includes('cargo build') ||
    rule.includes('go build') ||
    rule.includes('npm run lint') ||
    rule.includes('npx eslint') ||
    rule.includes('eslint:') ||
    rule.includes('npx prettier') ||
    rule.includes('prettier:') ||
    rule.includes('npm run format') ||
    rule.includes('npm run typecheck')
  ) {
    return 'Build & Lint';
  }

  // Package Management
  if (
    rule.includes('npm install') ||
    rule.includes('npm ci') ||
    rule.includes('npm i:') ||
    rule.includes('pip install') ||
    rule.includes('cargo add') ||
    rule.includes('go get') ||
    rule.includes('npm list') ||
    rule.includes('npm outdated') ||
    rule.includes('npm info') ||
    rule.includes('npm ls') ||
    rule.includes('npm view')
  ) {
    return 'Package Management';
  }

  // GitHub CLI
  if (rule.startsWith('Bash(gh ') || rule.startsWith('Bash(gh:')) {
    return 'GitHub CLI';
  }

  // Flywheel Skills
  if (rule.startsWith('Skill(flywheel-')) {
    return 'Flywheel Skills';
  }

  return 'Other';
}

// A set of known "built-in" rules (from PERMISSION_CATEGORIES in permissions.ts)
// These are rules that come predefined and shouldn't show edit/delete buttons
const BUILTIN_RULES = new Set([
  'Read', 'Edit', 'Write',
  'Bash(git status)', 'Bash(git status:*)', 'Bash(git log:*)', 'Bash(git diff:*)',
  'Bash(git branch:*)', 'Bash(git show:*)',
  'Bash(git add:*)', 'Bash(git commit:*)', 'Bash(git push)', 'Bash(git push:*)',
  'Bash(git checkout:*)', 'Bash(git switch:*)', 'Bash(git merge:*)', 'Bash(git rebase:*)',
  'Bash(git stash:*)', 'Bash(git worktree:*)',
  'Bash(npm test:*)', 'Bash(npm run test:*)', 'Bash(npx jest:*)', 'Bash(pytest:*)',
  'Bash(cargo test:*)', 'Bash(go test:*)',
  'Bash(npm run build:*)', 'Bash(npx tsc:*)', 'Bash(tsc:*)', 'Bash(npx next build:*)',
  'Bash(cargo build:*)', 'Bash(go build:*)',
  'Bash(npm run lint:*)', 'Bash(npx eslint:*)', 'Bash(eslint:*)', 'Bash(npx prettier:*)',
  'Bash(prettier:*)', 'Bash(npm run format:*)',
  'Bash(npm list:*)', 'Bash(npm outdated:*)', 'Bash(npm info:*)', 'Bash(npm ls:*)',
  'Bash(npm view:*)',
  'Bash(npm install:*)', 'Bash(npm ci:*)', 'Bash(npm i:*)', 'Bash(pip install:*)',
  'Bash(cargo add:*)', 'Bash(go get:*)',
  'Bash(tmux:*)', 'Bash(tmux list-sessions:*)', 'Bash(tmux new-session:*)',
  'Bash(tmux attach:*)', 'Bash(tmux kill-session:*)', 'Bash(tmux send-keys:*)',
  'Bash(tmux has-session:*)',
  'mcp__*', 'WebFetch', 'WebSearch',
  'Skill(flywheel-define)', 'Skill(flywheel-plan)', 'Skill(flywheel-execute)',
  'Skill(flywheel-done)', 'Skill(flywheel-new)',
]);

function isCustomRule(rule: string): boolean {
  return !BUILTIN_RULES.has(rule);
}

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

  // Collapse state for categories (rows) - start all collapsed
  const [expandedCategories, setExpandedCategories] = useState<Set<Category>>(new Set());

  // Collapse state for areas (columns) - start all collapsed
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  // Add rule dialog state
  const [addRuleDialogOpen, setAddRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EditingRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<{ rule: string; scope: string } | null>(null);

  // Permission log state
  const [logEntries, setLogEntries] = useState<PermissionLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [addRuleFromLogDialogOpen, setAddRuleFromLogDialogOpen] = useState(false);
  const [selectedLogEntry, setSelectedLogEntry] = useState<PermissionLogEntry | null>(null);

  const toggleCategory = useCallback((category: Category) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const toggleArea = useCallback((area: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(area)) {
        next.delete(area);
      } else {
        next.add(area);
      }
      return next;
    });
  }, []);

  const fetchPermissions = useCallback(async () => {
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
  }, []);

  const fetchLogEntries = useCallback(async () => {
    try {
      setLogLoading(true);
      const res = await fetch('/api/permissions/log');
      if (!res.ok) throw new Error('Failed to fetch permission log');
      const data = await res.json();
      setLogEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch permission log:', err);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
    fetchLogEntries();
  }, [fetchPermissions, fetchLogEntries]);

  const handleRuleAdded = useCallback(() => {
    fetchPermissions();
    setEditingRule(null);
  }, [fetchPermissions]);

  const handleAddRuleFromLog = useCallback((entry: PermissionLogEntry) => {
    setSelectedLogEntry(entry);
    setAddRuleFromLogDialogOpen(true);
  }, []);

  const handleDismissLogEntry = useCallback(async (entryId: number) => {
    try {
      const res = await fetch('/api/permissions/log', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [entryId] }),
      });
      if (!res.ok) throw new Error('Failed to dismiss entry');
      // Remove from local state
      setLogEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err) {
      console.error('Failed to dismiss log entry:', err);
    }
  }, []);

  const handleRuleAddedFromLog = useCallback((entryId: number) => {
    // Remove the entry from local state
    setLogEntries((prev) => prev.filter((e) => e.id !== entryId));
    // Refresh permissions to show the new rule
    fetchPermissions();
    setSelectedLogEntry(null);
  }, [fetchPermissions]);

  const handleEditRule = useCallback((rule: string, category: Category) => {
    const { tool, pattern } = parseRule(rule);
    setEditingRule({
      tool,
      pattern,
      category,
      scope: 'global', // Default to global for now
    });
    setAddRuleDialogOpen(true);
  }, []);

  const handleDeleteRule = useCallback(async (rule: string, scope: string) => {
    setDeletingRule({ rule, scope });
    try {
      const res = await fetch('/api/permissions/rule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule, scope }),
      });
      if (!res.ok) throw new Error('Failed to delete rule');
      await fetchPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    } finally {
      setDeletingRule(null);
    }
  }, [fetchPermissions]);

  const toggleGlobalRule = useCallback(
    async (rule: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`global-${rule}`);

      const newGlobalEnabled = enabled
        ? [...permissions.globalEnabled, rule]
        : permissions.globalEnabled.filter((r) => r !== rule);

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
        const newDrift = { ...prev.drift };
        for (const area of AREA_ORDER) {
          if (newDrift[area]) {
            newDrift[area] = newDrift[area].filter((r) => r !== rule);
            if (newDrift[area].length === 0) delete newDrift[area];
          }
        }
        const newProjects = prev.projects.map((project) => {
          if (enabled) {
            return project.enabledRules.includes(rule)
              ? project
              : { ...project, enabledRules: [...project.enabledRules, rule] };
          } else {
            return { ...project, enabledRules: project.enabledRules.filter((r) => r !== rule) };
          }
        });
        return {
          ...prev,
          globalEnabled: newGlobalEnabled,
          areaEnabled: newAreaEnabled,
          drift: newDrift,
          projects: newProjects,
        };
      });

      try {
        const res = await fetch('/api/permissions/rule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule, scope: 'global', enabled }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
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

      setPermissions((prev) => {
        if (!prev) return prev;
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
        setPermissions((prev) =>
          prev
            ? {
                ...prev,
                areaEnabled: {
                  ...prev.areaEnabled,
                  [areaValue]: enabled ? currentAreaRules : [...currentAreaRules, rule],
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

      const projectIndex = permissions.projects.findIndex((p) => p.projectPath === projectPath);
      if (projectIndex === -1) return;

      const project = permissions.projects[projectIndex];
      const newEnabledRules = enabled
        ? [...project.enabledRules, rule]
        : project.enabledRules.filter((r) => r !== rule);

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

  // Group rules by category
  const groupedRules = useMemo(() => {
    if (!permissions) return null;

    const groups: Record<Category, string[]> = {
      'File Operations': [],
      'Git Commands': [],
      Testing: [],
      'Build & Lint': [],
      'Package Management': [],
      'GitHub CLI': [],
      'Flywheel Skills': [],
      Other: [],
    };

    for (const rule of permissions.allRules) {
      const category = categorizeRule(rule);
      groups[category].push(rule);
    }

    return groups;
  }, [permissions]);

  // Calculate area summaries
  const areaSummaries = useMemo(() => {
    if (!permissions) return {};

    const summaries: Record<string, { projectCount: number; enabledCount: number }> = {};

    for (const area of AREA_ORDER) {
      const projects = permissions.projects.filter((p) => p.area === area);
      const enabledCount = projects.reduce((sum, p) => sum + p.enabledRules.length, 0);
      summaries[area] = {
        projectCount: projects.length,
        enabledCount,
      };
    }

    return summaries;
  }, [permissions]);

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

  if (!permissions || !groupedRules) {
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

  // Drift detection
  const driftSets: Record<string, Set<string>> = {};
  const totalDriftCount = Object.entries(permissions.drift || {}).reduce((count, [area, rules]) => {
    driftSets[area] = new Set(rules);
    return count + rules.length;
  }, 0);

  // Calculate column count for header spanning
  const getAreaColumnCount = (area: string) => {
    const isExpanded = expandedAreas.has(area);
    if (isExpanded) {
      return 1 + (projectsByArea[area]?.length || 0); // area col + project cols
    }
    return 1; // just area col
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Permissions</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure Claude Code auto-permissions for each project. Changes are saved immediately to each
            project&apos;s <code className="text-zinc-400">.claude/settings.local.json</code>. Global permissions
            apply to all projects.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setAddRuleDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Permission Log Section */}
      <PermissionLogSection
        entries={logEntries}
        loading={logLoading}
        onAddRule={handleAddRuleFromLog}
        onDismiss={handleDismissLogEntry}
      />

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
                  const isExpanded = expandedAreas.has(area);
                  const projects = projectsByArea[area] || [];
                  const summary = areaSummaries[area];

                  return (
                    <th
                      key={`area-header-${area}`}
                      colSpan={getAreaColumnCount(area)}
                      className="p-0 border-l-2 border-zinc-700/70"
                      style={{ borderLeftColor: `${AREA_COLORS[area]}40` }}
                    >
                      <div className="flex flex-col">
                        {/* Area header - always visible, clickable */}
                        <button
                          onClick={() => toggleArea(area)}
                          className="flex items-center justify-center gap-2 p-3 hover:bg-zinc-800/50 transition-colors w-full"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-500" />
                          )}
                          <span className="font-semibold" style={{ color: AREA_COLORS[area] }}>
                            {AREA_LABELS[area]}
                          </span>
                          {!isExpanded && summary && (
                            <span className="text-[10px] text-zinc-500 font-normal">
                              {summary.projectCount} proj · {summary.enabledCount} enabled
                            </span>
                          )}
                        </button>

                        {/* Project subheaders - only when expanded */}
                        {isExpanded && projects.length > 0 && (
                          <div className="flex border-t border-zinc-800/50">
                            <div className="flex-shrink-0 w-[80px] p-2 text-center border-r border-zinc-800/30">
                              <div className="text-[10px] text-zinc-500">~/.claude-{area}</div>
                            </div>
                            {projects.map((project) => (
                              <div
                                key={project.projectPath}
                                className="flex-1 min-w-[100px] p-2 text-center border-r border-zinc-800/30 last:border-r-0"
                              >
                                <div
                                  className="text-xs truncate font-medium"
                                  title={project.projectPath}
                                  style={{ color: AREA_COLORS[area] }}
                                >
                                  {project.projectName}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORY_ORDER.map((category) => {
                const rules = groupedRules[category];
                if (rules.length === 0) return null;

                const isCategoryExpanded = expandedCategories.has(category);

                // Calculate total columns for the category header row
                const totalColumns =
                  2 + AREA_ORDER.reduce((sum, area) => sum + getAreaColumnCount(area), 0);

                return (
                  <React.Fragment key={category}>
                    {/* Category header row */}
                    <tr
                      className="bg-zinc-800/60 cursor-pointer hover:bg-zinc-800/80 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <td
                        colSpan={totalColumns}
                        className="p-2 sticky left-0 bg-zinc-800/60 hover:bg-zinc-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isCategoryExpanded ? (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          )}
                          <span className="text-sm font-semibold text-zinc-200">{category}</span>
                          <span className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-0.5 rounded-full">
                            {rules.length} rule{rules.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Rules in this category - only render when expanded */}
                    {isCategoryExpanded &&
                      rules.map((rule, idx) => {
                        const isGlobalEnabled = globalEnabledSet.has(rule);
                        const isSavingGlobal = saving === `global-${rule}`;
                        const isCustom = isCustomRule(rule);
                        const isDeleting = deletingRule?.rule === rule;

                        return (
                          <tr
                            key={rule}
                            className={cn(
                              'border-b border-zinc-800/50 hover:bg-zinc-800/30 group',
                              idx % 2 === 0 && 'bg-zinc-900/20'
                            )}
                          >
                            <td className={cn(
                              "p-3 pl-8 sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-800",
                              idx % 2 === 0 && "bg-[#131316]"
                            )}>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-mono text-zinc-200" title={rule}>
                                  {formatRule(rule)}
                                </div>
                                {isCustom && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-purple-900/40 text-purple-300 border border-purple-700/40 rounded">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    custom
                                  </span>
                                )}
                                {isCustom && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditRule(rule, category);
                                      }}
                                      className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-colors"
                                      title="Edit rule"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete rule "${rule}"?`)) {
                                          handleDeleteRule(rule, 'global');
                                        }
                                      }}
                                      disabled={isDeleting}
                                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                                      title="Delete rule"
                                    >
                                      {isDeleting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                )}
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
                              const isAreaExpanded = expandedAreas.has(area);
                              const projects = projectsByArea[area] || [];
                              const isAreaEnabled = areaEnabledSets[area]?.has(rule) ?? false;
                              const isSavingArea = saving === `area:${area}-${rule}`;
                              const hasDrift = driftSets[area]?.has(rule) ?? false;

                              return (
                                <React.Fragment key={`rule-${rule}-area-${area}`}>
                                  {/* Area checkbox column - always visible */}
                                  <td
                                    className={cn(
                                      'p-3 text-center border-l-2',
                                      hasDrift && 'bg-amber-900/15'
                                    )}
                                    style={{ borderLeftColor: `${AREA_COLORS[area]}40` }}
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
                                  </td>

                                  {/* Project columns - only when area is expanded */}
                                  {isAreaExpanded &&
                                    projects.map((project) => {
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
                                    })}
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-zinc-500">{permissions.allRules.length} rules total</div>

      <AddRuleDialog
        open={addRuleDialogOpen}
        onOpenChange={setAddRuleDialogOpen}
        existingRules={permissions.globalEnabled}
        onRuleAdded={handleRuleAdded}
        editingRule={editingRule}
      />

      <AddRuleFromLogDialog
        open={addRuleFromLogDialogOpen}
        onOpenChange={setAddRuleFromLogDialogOpen}
        entry={selectedLogEntry}
        existingRules={permissions.allRules}
        onRuleAdded={handleRuleAddedFromLog}
      />
    </div>
  );
}
