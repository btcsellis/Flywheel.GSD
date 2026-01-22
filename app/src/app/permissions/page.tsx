'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PermissionCategory {
  id: string;
  label: string;
  description: string;
}

interface ProjectPermissionState {
  projectPath: string;
  projectName: string;
  area: string;
  enabledCategories: string[];
}

interface AllPermissionsState {
  global: string[];
  projects: ProjectPermissionState[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  { id: 'read-files', label: 'Read files', description: 'Read any file in the project' },
  { id: 'edit-files', label: 'Edit files', description: 'Edit existing files' },
  { id: 'write-files', label: 'Create files', description: 'Create new files' },
  { id: 'git-read', label: 'Git read ops', description: 'git status, log, diff, branch' },
  { id: 'git-write', label: 'Git write ops', description: 'git add, commit, push' },
  { id: 'run-tests', label: 'Run tests', description: 'npm test, pytest, jest, etc.' },
  { id: 'build', label: 'Build commands', description: 'npm run build, tsc, next build' },
  { id: 'lint-format', label: 'Lint & format', description: 'eslint, prettier, lint commands' },
  { id: 'package-info', label: 'Package info', description: 'npm list, outdated, info' },
  { id: 'install-deps', label: 'Install dependencies', description: 'npm install, pip install' },
  { id: 'mcp-tools', label: 'MCP tools', description: 'Model Context Protocol tools' },
  { id: 'web-fetch', label: 'Web fetches', description: 'Fetch URLs and web search' },
];

const AREA_COLORS: Record<string, string> = {
  bellwether: '#3b82f6',
  sophia: '#f97316',
  personal: '#22c55e',
};

function Checkbox({
  checked,
  indeterminate,
  onChange,
  disabled,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const state = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors',
        state === 'checked' && 'bg-blue-600 border-blue-600 text-white',
        state === 'indeterminate' && 'bg-blue-600/50 border-blue-600/50 text-white',
        state === 'unchecked' && 'border-zinc-600 bg-zinc-800'
      )}
    >
      {state === 'checked' && <Check className="h-3 w-3" />}
      {state === 'indeterminate' && <Minus className="h-3 w-3" />}
    </button>
  );
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<AllPermissionsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
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

  const updateGlobalPermission = useCallback(
    async (categoryId: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`global-${categoryId}`);

      const newGlobal = enabled
        ? [...permissions.global, categoryId]
        : permissions.global.filter((id) => id !== categoryId);

      // Optimistic update
      setPermissions((prev) => (prev ? { ...prev, global: newGlobal } : prev));

      try {
        const res = await fetch('/api/permissions/global', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabledCategories: newGlobal }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
        // Rollback on error
        setPermissions((prev) =>
          prev
            ? {
                ...prev,
                global: enabled
                  ? prev.global.filter((id) => id !== categoryId)
                  : [...prev.global, categoryId],
              }
            : prev
        );
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const updateProjectPermission = useCallback(
    async (projectPath: string, categoryId: string, enabled: boolean) => {
      if (!permissions) return;

      setSaving(`${projectPath}-${categoryId}`);

      const projectIndex = permissions.projects.findIndex(
        (p) => p.projectPath === projectPath
      );
      if (projectIndex === -1) return;

      const project = permissions.projects[projectIndex];
      const newCategories = enabled
        ? [...project.enabledCategories, categoryId]
        : project.enabledCategories.filter((id) => id !== categoryId);

      // Optimistic update
      setPermissions((prev) => {
        if (!prev) return prev;
        const newProjects = [...prev.projects];
        newProjects[projectIndex] = { ...project, enabledCategories: newCategories };
        return { ...prev, projects: newProjects };
      });

      try {
        const res = await fetch('/api/permissions/project', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectPath, enabledCategories: newCategories }),
        });

        if (!res.ok) throw new Error('Failed to save');
      } catch {
        // Rollback on error
        setPermissions((prev) => {
          if (!prev) return prev;
          const newProjects = [...prev.projects];
          newProjects[projectIndex] = {
            ...project,
            enabledCategories: enabled
              ? project.enabledCategories.filter((id) => id !== categoryId)
              : [...project.enabledCategories, categoryId],
          };
          return { ...prev, projects: newProjects };
        });
      } finally {
        setSaving(null);
      }
    },
    [permissions]
  );

  const toggleAllForCategory = useCallback(
    async (categoryId: string) => {
      if (!permissions) return;

      // Check if all projects have this category enabled
      const allEnabled = permissions.projects.every((p) =>
        p.enabledCategories.includes(categoryId)
      );

      // Toggle all projects to the opposite state
      const newEnabled = !allEnabled;

      for (const project of permissions.projects) {
        const hasCategory = project.enabledCategories.includes(categoryId);
        if (hasCategory !== newEnabled) {
          await updateProjectPermission(project.projectPath, categoryId, newEnabled);
        }
      }
    },
    [permissions, updateProjectPermission]
  );

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

  // Group projects by area
  const projectsByArea = permissions.projects.reduce(
    (acc, project) => {
      if (!acc[project.area]) acc[project.area] = [];
      acc[project.area].push(project);
      return acc;
    },
    {} as Record<string, ProjectPermissionState[]>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Permissions</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Configure Claude Code auto-permissions for each project. Changes are saved immediately to
          each project&apos;s <code className="text-zinc-400">.claude/settings.json</code>.
        </p>
      </div>

      {/* Global Permissions */}
      <div className="border border-zinc-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">
          Global Permissions
          <span className="text-sm font-normal text-zinc-500 ml-2">
            (~/.claude/settings.json)
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PERMISSION_CATEGORIES.map((category) => {
            const enabled = permissions.global.includes(category.id);
            const isSaving = saving === `global-${category.id}`;

            return (
              <label
                key={category.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors',
                  enabled && 'bg-zinc-800/50 border-zinc-700'
                )}
              >
                <div className="pt-0.5">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  ) : (
                    <Checkbox
                      checked={enabled}
                      onChange={(checked) => updateGlobalPermission(category.id, checked)}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200">{category.label}</div>
                  <div className="text-xs text-zinc-500 truncate">{category.description}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Project Permissions Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left p-3 text-sm font-medium text-zinc-400 sticky left-0 bg-zinc-900/50 min-w-[200px]">
                  Permission
                </th>
                <th className="p-3 text-sm font-medium text-zinc-400 text-center min-w-[80px]">
                  All
                </th>
                {Object.entries(projectsByArea).map(([area, projects]) =>
                  projects.map((project) => (
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
                      <div className="text-[10px] text-zinc-600 uppercase">{area}</div>
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_CATEGORIES.map((category, idx) => {
                // Calculate "All" checkbox state
                const allProjects = permissions.projects;
                const enabledCount = allProjects.filter((p) =>
                  p.enabledCategories.includes(category.id)
                ).length;
                const allChecked = enabledCount === allProjects.length;
                const someChecked = enabledCount > 0 && enabledCount < allProjects.length;

                return (
                  <tr
                    key={category.id}
                    className={cn(
                      'border-b border-zinc-800/50 hover:bg-zinc-800/30',
                      idx % 2 === 0 && 'bg-zinc-900/20'
                    )}
                  >
                    <td className="p-3 sticky left-0 bg-inherit">
                      <div className="text-sm font-medium text-zinc-200">{category.label}</div>
                      <div className="text-xs text-zinc-500">{category.description}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={() => toggleAllForCategory(category.id)}
                        />
                      </div>
                    </td>
                    {Object.entries(projectsByArea).map(([, projects]) =>
                      projects.map((project) => {
                        const enabled = project.enabledCategories.includes(category.id);
                        const isSaving = saving === `${project.projectPath}-${category.id}`;

                        return (
                          <td key={project.projectPath} className="p-3 text-center">
                            <div className="flex justify-center">
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                              ) : (
                                <Checkbox
                                  checked={enabled}
                                  onChange={(checked) =>
                                    updateProjectPermission(
                                      project.projectPath,
                                      category.id,
                                      checked
                                    )
                                  }
                                />
                              )}
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
