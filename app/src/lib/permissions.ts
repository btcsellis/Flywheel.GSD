import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { AREAS, discoverProjectsInArea } from './projects';

export const AREA_VALUES = ['personal', 'bellwether', 'sophia'] as const;
export type AreaValue = (typeof AREA_VALUES)[number];

export interface PermissionCategory {
  id: string;
  label: string;
  description: string;
  rules: string[];
}

export interface ClaudeSettings {
  permissions?: {
    allow?: string[];
    deny?: string[];
  };
  [key: string]: unknown;
}

export interface ProjectPermissionState {
  projectPath: string;
  projectName: string;
  area: string;
  enabledCategories: string[];
}

export interface AllPermissionsState {
  global: string[];
  projects: ProjectPermissionState[];
}

// Types for individual rule display
export interface ParsedRule {
  tool: string;
  pattern: string | null;
  raw: string;
}

export interface RuleWithSource {
  rule: ParsedRule;
  source: 'global' | 'project';
  isOverride: boolean;
  isCustom: boolean;
}

export interface AllRulesState {
  globalRules: string[];
  projectRules: Map<string, string[]>;
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  // File Operations
  {
    id: 'read-files',
    label: 'Read files',
    description: 'Read any file in the project',
    rules: ['Read'],
  },
  {
    id: 'edit-files',
    label: 'Edit files',
    description: 'Edit existing files',
    rules: ['Edit'],
  },
  {
    id: 'write-files',
    label: 'Create files',
    description: 'Create new files',
    rules: ['Write'],
  },
  // Git Operations
  {
    id: 'git-read',
    label: 'Git read ops',
    description: 'git status, log, diff, branch',
    rules: [
      'Bash(git status)',
      'Bash(git status:*)',
      'Bash(git log:*)',
      'Bash(git diff:*)',
      'Bash(git branch:*)',
      'Bash(git show:*)',
    ],
  },
  {
    id: 'git-write',
    label: 'Git write ops',
    description: 'git add, commit, push',
    rules: [
      'Bash(git add:*)',
      'Bash(git commit:*)',
      'Bash(git push)',
      'Bash(git push:*)',
      'Bash(git checkout:*)',
      'Bash(git switch:*)',
      'Bash(git merge:*)',
      'Bash(git rebase:*)',
      'Bash(git stash:*)',
      'Bash(git worktree:*)',
      'Bash(git branch:*)',
    ],
  },
  // Build & Test
  {
    id: 'run-tests',
    label: 'Run tests',
    description: 'npm test, pytest, jest, etc.',
    rules: [
      'Bash(npm test:*)',
      'Bash(npm run test:*)',
      'Bash(npx jest:*)',
      'Bash(pytest:*)',
      'Bash(cargo test:*)',
      'Bash(go test:*)',
    ],
  },
  {
    id: 'build',
    label: 'Build commands',
    description: 'npm run build, tsc, next build',
    rules: [
      'Bash(npm run build:*)',
      'Bash(npx tsc:*)',
      'Bash(tsc:*)',
      'Bash(npx next build:*)',
      'Bash(cargo build:*)',
      'Bash(go build:*)',
    ],
  },
  {
    id: 'lint-format',
    label: 'Lint & format',
    description: 'eslint, prettier, lint commands',
    rules: [
      'Bash(npm run lint:*)',
      'Bash(npx eslint:*)',
      'Bash(eslint:*)',
      'Bash(npx prettier:*)',
      'Bash(prettier:*)',
      'Bash(npm run format:*)',
    ],
  },
  // Package Management
  {
    id: 'package-info',
    label: 'Package info',
    description: 'npm list, outdated, info',
    rules: [
      'Bash(npm list:*)',
      'Bash(npm outdated:*)',
      'Bash(npm info:*)',
      'Bash(npm ls:*)',
      'Bash(npm view:*)',
    ],
  },
  {
    id: 'install-deps',
    label: 'Install dependencies',
    description: 'npm install, pip install',
    rules: [
      'Bash(npm install:*)',
      'Bash(npm ci:*)',
      'Bash(npm i:*)',
      'Bash(pip install:*)',
      'Bash(cargo add:*)',
      'Bash(go get:*)',
    ],
  },
  // Terminal
  {
    id: 'tmux',
    label: 'Tmux commands',
    description: 'tmux session management',
    rules: [
      'Bash(tmux:*)',
      'Bash(tmux list-sessions:*)',
      'Bash(tmux new-session:*)',
      'Bash(tmux attach:*)',
      'Bash(tmux kill-session:*)',
      'Bash(tmux send-keys:*)',
      'Bash(tmux has-session:*)',
    ],
  },
  // Other
  {
    id: 'mcp-tools',
    label: 'MCP tools',
    description: 'Model Context Protocol tools',
    rules: ['mcp__*'],
  },
  {
    id: 'web-fetch',
    label: 'Web fetches',
    description: 'Fetch URLs and web search',
    rules: ['WebFetch', 'WebSearch'],
  },
  // Flywheel
  {
    id: 'flywheel',
    label: 'Flywheel commands',
    description: '/flywheel-define, plan, execute, done',
    rules: [
      'Skill(flywheel-define)',
      'Skill(flywheel-plan)',
      'Skill(flywheel-execute)',
      'Skill(flywheel-done)',
      'Skill(flywheel-new)',
      'Read(~/personal/flywheel-gsd/**)',
      'Edit(~/personal/flywheel-gsd/work/**)',
      'Read(~/.claude/**)',
      'Read(.claude/**)',
      'Bash(ls ~/.claude/*)',
      'Bash(ls .claude/*)',
      'Bash(mv ~/personal/flywheel-gsd/work/*)',
      'Bash(rm *-worktrees/*)',
      'Bash(/bin/rm *-worktrees/*)',
      'Bash(cd ~/personal/flywheel-gsd*)',
      'Bash(ls *-worktrees/*)',
      'Bash(/bin/ls *-worktrees/*)',
      'Bash(cat > ~/personal/flywheel-gsd/.flywheel-*:*)',
      'Bash(rm -f ~/personal/flywheel-gsd/.flywheel-*:*)',
      'Bash(rm ~/personal/flywheel-gsd/.flywheel-*:*)',
    ],
  },
];

const GLOBAL_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.local.json');

function getAreaSettingsPath(areaValue: string): string {
  return path.join(os.homedir(), `.claude-${areaValue}`, 'settings.local.json');
}

function getProjectSettingsPath(projectPath: string): string {
  return path.join(projectPath, '.claude', 'settings.local.json');
}

/**
 * Read Claude settings from a JSON file
 */
async function readSettingsFile(filePath: string): Promise<ClaudeSettings | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return null;
  }
}

/**
 * Write Claude settings to a JSON file, creating directories if needed
 */
async function writeSettingsFile(filePath: string, settings: ClaudeSettings): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

/**
 * Extract enabled category IDs from a list of allowed rules
 */
export function getEnabledCategoriesFromRules(allowedRules: string[]): string[] {
  const enabled: string[] = [];

  for (const category of PERMISSION_CATEGORIES) {
    // A category is enabled if ALL its rules are in the allowed list
    const allRulesPresent = category.rules.every((rule) =>
      allowedRules.some((allowed) => allowed === rule)
    );
    if (allRulesPresent) {
      enabled.push(category.id);
    }
  }

  return enabled;
}

/**
 * Convert enabled category IDs to a list of permission rules
 */
export function getRulesFromEnabledCategories(categoryIds: string[]): string[] {
  const rules: string[] = [];

  for (const category of PERMISSION_CATEGORIES) {
    if (categoryIds.includes(category.id)) {
      rules.push(...category.rules);
    }
  }

  return [...new Set(rules)]; // Remove duplicates
}

/**
 * Read permissions for a specific project
 */
export async function readProjectPermissions(projectPath: string): Promise<string[]> {
  const settingsPath = getProjectSettingsPath(projectPath);
  const settings = await readSettingsFile(settingsPath);

  if (!settings?.permissions?.allow) {
    return [];
  }

  return getEnabledCategoriesFromRules(settings.permissions.allow);
}

/**
 * Write permissions for a specific project
 */
export async function writeProjectPermissions(
  projectPath: string,
  categoryIds: string[]
): Promise<void> {
  const settingsPath = getProjectSettingsPath(projectPath);
  const existingSettings = (await readSettingsFile(settingsPath)) || {};

  const rules = getRulesFromEnabledCategories(categoryIds);

  const newSettings: ClaudeSettings = {
    ...existingSettings,
    permissions: {
      ...existingSettings.permissions,
      allow: rules,
    },
  };

  // Remove empty allow array
  if (newSettings.permissions?.allow?.length === 0) {
    delete newSettings.permissions.allow;
  }

  // Remove empty permissions object
  if (
    newSettings.permissions &&
    Object.keys(newSettings.permissions).length === 0
  ) {
    delete newSettings.permissions;
  }

  await writeSettingsFile(settingsPath, newSettings);
}

/**
 * Read global (user-level) permissions
 */
export async function readGlobalPermissions(): Promise<string[]> {
  const settings = await readSettingsFile(GLOBAL_SETTINGS_PATH);

  if (!settings?.permissions?.allow) {
    return [];
  }

  return getEnabledCategoriesFromRules(settings.permissions.allow);
}

/**
 * Write global (user-level) permissions
 */
export async function writeGlobalPermissions(categoryIds: string[]): Promise<void> {
  const existingSettings = (await readSettingsFile(GLOBAL_SETTINGS_PATH)) || {};

  const rules = getRulesFromEnabledCategories(categoryIds);

  const newSettings: ClaudeSettings = {
    ...existingSettings,
    permissions: {
      ...existingSettings.permissions,
      allow: rules,
    },
  };

  // Remove empty allow array
  if (newSettings.permissions?.allow?.length === 0) {
    delete newSettings.permissions.allow;
  }

  // Remove empty permissions object
  if (
    newSettings.permissions &&
    Object.keys(newSettings.permissions).length === 0
  ) {
    delete newSettings.permissions;
  }

  await writeSettingsFile(GLOBAL_SETTINGS_PATH, newSettings);

  // Sync global rules to all area settings files.
  // For each area: ensure all global rules are present, remove global rules
  // that were disabled, but preserve area-specific rules.
  const globalRulesSet = new Set(rules);
  const previousGlobalRules = new Set(existingSettings.permissions?.allow || []);

  await Promise.all(
    AREA_VALUES.map(async (area) => {
      const areaSettingsPath = getAreaSettingsPath(area);
      const areaSettings = (await readSettingsFile(areaSettingsPath)) || {};
      const areaRules = areaSettings.permissions?.allow || [];

      // Remove global rules that were disabled (were in previous global but not in new)
      const removedGlobalRules = [...previousGlobalRules].filter((r) => !globalRulesSet.has(r));
      let updatedRules = areaRules.filter((r) => !removedGlobalRules.includes(r));

      // Add new global rules that aren't already present
      for (const rule of rules) {
        if (!updatedRules.includes(rule)) {
          updatedRules.push(rule);
        }
      }

      const updatedSettings: ClaudeSettings = {
        ...areaSettings,
        permissions: {
          ...areaSettings.permissions,
          allow: updatedRules,
        },
      };

      if (updatedSettings.permissions?.allow?.length === 0) {
        delete updatedSettings.permissions.allow;
      }
      if (
        updatedSettings.permissions &&
        Object.keys(updatedSettings.permissions).length === 0
      ) {
        delete updatedSettings.permissions;
      }

      await writeSettingsFile(areaSettingsPath, updatedSettings);
    })
  );
}

/**
 * Parse a rule string into its components
 * Handles formats: "Tool", "Tool(pattern)", "Tool(pattern:*)", "mcp__*"
 */
export function parseRule(raw: string): ParsedRule {
  // Match "Tool(pattern)" format
  const match = raw.match(/^([A-Za-z_][A-Za-z0-9_]*)\((.+)\)$/);
  if (match) {
    return {
      tool: match[1],
      pattern: match[2],
      raw,
    };
  }

  // Plain tool name (no pattern)
  return {
    tool: raw,
    pattern: null,
    raw,
  };
}

/**
 * Check if a rule matches any category
 * Returns the category ID if found, null otherwise
 */
export function isRuleInCategory(rule: string): string | null {
  for (const category of PERMISSION_CATEGORIES) {
    if (category.rules.includes(rule)) {
      return category.id;
    }
  }
  return null;
}

/**
 * Read all raw permission rules from settings files
 */
export async function readAllRawRules(projectPaths: string[]): Promise<{
  globalRules: string[];
  projectRules: Record<string, string[]>;
}> {
  const globalSettings = await readSettingsFile(GLOBAL_SETTINGS_PATH);
  const globalRules = globalSettings?.permissions?.allow || [];

  const projectRules: Record<string, string[]> = {};
  for (const projectPath of projectPaths) {
    const settingsPath = getProjectSettingsPath(projectPath);
    const settings = await readSettingsFile(settingsPath);
    projectRules[projectPath] = settings?.permissions?.allow || [];
  }

  return { globalRules, projectRules };
}

/**
 * Compute the display list of rules with source info, deduplication, and override detection
 */
export function computeRuleDisplayList(
  globalRules: string[],
  projectRules: string[]
): RuleWithSource[] {
  const result: RuleWithSource[] = [];
  const globalRulesSet = new Set(globalRules);

  // Build a map of tool -> pattern for global rules (for override detection)
  const globalToolPatterns = new Map<string, string | null>();
  for (const rule of globalRules) {
    const parsed = parseRule(rule);
    globalToolPatterns.set(parsed.tool, parsed.pattern);
  }

  // Add global rules
  for (const rule of globalRules) {
    const parsed = parseRule(rule);
    result.push({
      rule: parsed,
      source: 'global',
      isOverride: false,
      isCustom: isRuleInCategory(rule) === null,
    });
  }

  // Add project rules (with deduplication and override detection)
  for (const rule of projectRules) {
    // Skip if exact same rule exists at global level (deduplication)
    if (globalRulesSet.has(rule)) {
      continue;
    }

    const parsed = parseRule(rule);

    // Check if this is an override (same tool but different pattern)
    const globalPattern = globalToolPatterns.get(parsed.tool);
    const isOverride = globalPattern !== undefined && globalPattern !== parsed.pattern;

    result.push({
      rule: parsed,
      source: 'project',
      isOverride,
      isCustom: isRuleInCategory(rule) === null,
    });
  }

  return result;
}

// ============================================================================
// Rule-based API functions (for granular permission management)
// ============================================================================

/**
 * Get all known rules from all categories (deduplicated)
 */
export function getAllKnownRules(): string[] {
  const rules = new Set<string>();
  for (const category of PERMISSION_CATEGORIES) {
    for (const rule of category.rules) {
      rules.add(rule);
    }
  }
  return Array.from(rules);
}

/**
 * Read raw rules from global settings (not converted to categories)
 */
export async function readGlobalRawRules(): Promise<string[]> {
  const settings = await readSettingsFile(GLOBAL_SETTINGS_PATH);
  return settings?.permissions?.allow || [];
}

/**
 * Read raw rules from project settings (not converted to categories)
 */
export async function readProjectRawRules(projectPath: string): Promise<string[]> {
  const settingsPath = getProjectSettingsPath(projectPath);
  const settings = await readSettingsFile(settingsPath);
  return settings?.permissions?.allow || [];
}

/**
 * Read raw rules from area settings (not converted to categories)
 */
export async function readAreaRawRules(areaValue: string): Promise<string[]> {
  const settingsPath = getAreaSettingsPath(areaValue);
  const settings = await readSettingsFile(settingsPath);
  return settings?.permissions?.allow || [];
}

/**
 * Sync a rule to all projects in an area.
 * Called after writing to area settings so projects inherit the rule.
 */
async function syncRuleToAreaProjects(areaValue: string, rule: string, enabled: boolean): Promise<void> {
  const area = AREAS.find((a) => a.value === areaValue);
  if (!area) return;

  const projects = await discoverProjectsInArea(area.basePath);
  await Promise.all(
    projects.map((project) => writeProjectRule(project.path, rule, enabled))
  );
}

/**
 * Toggle a single rule in area settings
 */
export async function writeAreaRule(areaValue: string, rule: string, enabled: boolean): Promise<void> {
  const settingsPath = getAreaSettingsPath(areaValue);
  const existingSettings = (await readSettingsFile(settingsPath)) || {};
  const currentRules = existingSettings.permissions?.allow || [];

  let newRules: string[];
  if (enabled) {
    newRules = currentRules.includes(rule) ? currentRules : [...currentRules, rule];
  } else {
    newRules = currentRules.filter((r) => r !== rule);
  }

  const newSettings: ClaudeSettings = {
    ...existingSettings,
    permissions: {
      ...existingSettings.permissions,
      allow: newRules,
    },
  };

  if (newSettings.permissions?.allow?.length === 0) {
    delete newSettings.permissions.allow;
  }

  if (
    newSettings.permissions &&
    Object.keys(newSettings.permissions).length === 0
  ) {
    delete newSettings.permissions;
  }

  await writeSettingsFile(settingsPath, newSettings);

  // Cascade to all projects in this area
  await syncRuleToAreaProjects(areaValue, rule, enabled);
}

/**
 * Toggle a single rule in global settings
 */
export async function writeGlobalRule(rule: string, enabled: boolean): Promise<void> {
  const existingSettings = (await readSettingsFile(GLOBAL_SETTINGS_PATH)) || {};
  const currentRules = existingSettings.permissions?.allow || [];

  let newRules: string[];
  if (enabled) {
    // Add rule if not present
    newRules = currentRules.includes(rule) ? currentRules : [...currentRules, rule];
  } else {
    // Remove rule
    newRules = currentRules.filter((r) => r !== rule);
  }

  const newSettings: ClaudeSettings = {
    ...existingSettings,
    permissions: {
      ...existingSettings.permissions,
      allow: newRules,
    },
  };

  // Remove empty allow array
  if (newSettings.permissions?.allow?.length === 0) {
    delete newSettings.permissions.allow;
  }

  // Remove empty permissions object
  if (
    newSettings.permissions &&
    Object.keys(newSettings.permissions).length === 0
  ) {
    delete newSettings.permissions;
  }

  await writeSettingsFile(GLOBAL_SETTINGS_PATH, newSettings);

  // Also write to all area settings files so the rule is available
  // when CLAUDE_CONFIG_DIR overrides ~/.claude/
  await Promise.all(
    AREA_VALUES.map((area) => writeAreaRule(area, rule, enabled))
  );
}

/**
 * Toggle a single rule in project settings
 */
export async function writeProjectRule(
  projectPath: string,
  rule: string,
  enabled: boolean
): Promise<void> {
  const settingsPath = getProjectSettingsPath(projectPath);
  const existingSettings = (await readSettingsFile(settingsPath)) || {};
  const currentRules = existingSettings.permissions?.allow || [];

  let newRules: string[];
  if (enabled) {
    // Add rule if not present
    newRules = currentRules.includes(rule) ? currentRules : [...currentRules, rule];
  } else {
    // Remove rule
    newRules = currentRules.filter((r) => r !== rule);
  }

  const newSettings: ClaudeSettings = {
    ...existingSettings,
    permissions: {
      ...existingSettings.permissions,
      allow: newRules,
    },
  };

  // Remove empty allow array
  if (newSettings.permissions?.allow?.length === 0) {
    delete newSettings.permissions.allow;
  }

  // Remove empty permissions object
  if (
    newSettings.permissions &&
    Object.keys(newSettings.permissions).length === 0
  ) {
    delete newSettings.permissions;
  }

  await writeSettingsFile(settingsPath, newSettings);
}

/**
 * Get all rules from the flywheel category.
 * These rules should NOT be rewritten when copying permissions to worktrees,
 * as they always reference the main flywheel-gsd repo.
 */
export function getFlywheelRules(): string[] {
  const flywheelCategory = PERMISSION_CATEGORIES.find((c) => c.id === 'flywheel');
  return flywheelCategory?.rules || [];
}

/**
 * Detect global permissions that are missing from area settings files.
 * Returns a map of area name → array of global rules missing from that area.
 */
export async function getGlobalDrift(): Promise<Record<string, string[]>> {
  const globalRules = await readGlobalRawRules();
  const globalSet = new Set(globalRules);
  const drift: Record<string, string[]> = {};

  for (const area of AREA_VALUES) {
    const areaRules = await readAreaRawRules(area);
    const areaSet = new Set(areaRules);
    const missing = [...globalSet].filter((rule) => !areaSet.has(rule));
    if (missing.length > 0) {
      drift[area] = missing;
    }
  }

  return drift;
}

/**
 * Sync all missing global permissions to area settings files.
 * Adds any global rules that are missing from each area.
 * Batches writes per area file to avoid race conditions.
 */
export async function syncGlobalToAreas(): Promise<void> {
  const drift = await getGlobalDrift();

  await Promise.all(
    Object.entries(drift).map(async ([area, missingRules]) => {
      const settingsPath = getAreaSettingsPath(area);
      const existingSettings = (await readSettingsFile(settingsPath)) || {};
      const currentRules = existingSettings.permissions?.allow || [];

      // Add all missing rules at once
      const newRules = [...currentRules, ...missingRules.filter((r) => !currentRules.includes(r))];

      const newSettings: ClaudeSettings = {
        ...existingSettings,
        permissions: {
          ...existingSettings.permissions,
          allow: newRules,
        },
      };

      await writeSettingsFile(settingsPath, newSettings);
    })
  );
}

