import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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
      'Bash(git push:*)',
      'Bash(git checkout:*)',
      'Bash(git switch:*)',
      'Bash(git merge:*)',
      'Bash(git rebase:*)',
      'Bash(git stash:*)',
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
    ],
  },
];

const GLOBAL_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');

function getProjectSettingsPath(projectPath: string): string {
  return path.join(projectPath, '.claude', 'settings.json');
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
}
