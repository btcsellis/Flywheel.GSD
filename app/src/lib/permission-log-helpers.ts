/**
 * Client-safe helper functions for permission log entries.
 * These functions do NOT use Node.js APIs (fs, os, path) so they can run in the browser.
 */

export interface PermissionLogEntry {
  id: number;
  timestamp: string;
  tool: string;
  input: Record<string, unknown>;
  cwd: string;
  project: string;
  session_id: string;
  raw_path: string;
  base_repo_path: string;
}

export const AREA_VALUES = ['personal', 'bellwether', 'sophia'] as const;
export type AreaValue = (typeof AREA_VALUES)[number];

/**
 * Derive a permission rule string from a log entry.
 * Returns { tool, pattern } where pattern may be null for bare tool permissions.
 */
export function deriveRuleFromLogEntry(entry: PermissionLogEntry): {
  tool: string;
  pattern: string | null;
} {
  const { tool, input } = entry;

  switch (tool) {
    case 'Bash': {
      // Extract command and create a pattern
      const command = (input.command as string) || '';
      // Extract the base command (first word or first word with arguments pattern)
      const match = command.match(/^(\S+)/);
      if (match) {
        const baseCmd = match[1];
        // For common commands, create a wildcard pattern
        if (['git', 'npm', 'npx', 'yarn', 'pnpm', 'cargo', 'go', 'pip', 'python', 'node', 'tmux', 'mkdir', 'rm', 'mv', 'cp', 'cat', 'ls', 'cd', 'find', 'grep'].includes(baseCmd)) {
          // Extract more specific pattern for git commands
          if (baseCmd === 'git') {
            const gitMatch = command.match(/^git\s+(\S+)/);
            if (gitMatch) {
              return { tool: 'Bash', pattern: `git ${gitMatch[1]}:*` };
            }
          }
          // For npm/npx with run/exec, include the script name
          if ((baseCmd === 'npm' || baseCmd === 'npx') && command.includes('run ')) {
            const runMatch = command.match(/(?:npm|npx)\s+run\s+(\S+)/);
            if (runMatch) {
              return { tool: 'Bash', pattern: `${baseCmd} run ${runMatch[1]}:*` };
            }
          }
          return { tool: 'Bash', pattern: `${baseCmd}:*` };
        }
        // For other commands, use the exact first word with wildcard
        return { tool: 'Bash', pattern: `${baseCmd}:*` };
      }
      return { tool: 'Bash', pattern: null };
    }

    case 'Read':
    case 'Edit':
    case 'Write': {
      // Extract file path and create a pattern
      const filePath = (input.file_path as string) || '';
      if (filePath) {
        // Suggest a directory-based pattern
        const suggestedPath = suggestSpecificPath(filePath, entry.cwd);
        return { tool, pattern: suggestedPath };
      }
      return { tool, pattern: null };
    }

    case 'Skill': {
      const skillName = (input.skill as string) || '';
      if (skillName) {
        return { tool: 'Skill', pattern: skillName };
      }
      return { tool: 'Skill', pattern: null };
    }

    case 'WebFetch':
    case 'WebSearch':
      return { tool, pattern: null };

    default:
      return { tool, pattern: null };
  }
}

/**
 * Suggest a specific path pattern based on a file path and working directory.
 * For overly broad patterns (like *), suggests a more specific path.
 */
export function suggestSpecificPath(filePath: string, cwd: string): string | null {
  if (!filePath) return null;

  // Known bases for pattern matching (using ~ as we can't use os.homedir in browser)
  const knownBases = [
    { prefix: '/Users/', areas: ['personal/', 'bellwether/', 'sophia/'] },
  ];

  // Try to find a meaningful directory pattern
  for (const { areas } of knownBases) {
    for (const area of areas) {
      const areaIndex = filePath.indexOf(area);
      if (areaIndex !== -1) {
        // Get the project name (first directory after the area)
        const afterArea = filePath.slice(areaIndex + area.length);
        const parts = afterArea.split('/');
        if (parts.length >= 1 && parts[0]) {
          // Return pattern like ~/personal/project-name/**
          return `~/${area}${parts[0]}/**`;
        }
      }
    }
  }

  // Check for .claude config paths
  if (filePath.includes('/.claude')) {
    return '~/.claude/**';
  }

  // If we have a cwd, try to make a pattern relative to it
  if (cwd && filePath.startsWith(cwd)) {
    const relativePath = filePath.slice(cwd.length + 1);
    const parts = relativePath.split('/');
    if (parts.length > 1) {
      // Return pattern like subdir/**
      return `${parts[0]}/**`;
    }
  }

  // Fallback: return directory pattern
  const lastSlash = filePath.lastIndexOf('/');
  if (lastSlash > 0) {
    return filePath.slice(0, lastSlash) + '/**';
  }

  return null;
}

/**
 * Derive the default scope for a rule based on where the request originated.
 * Returns 'global', 'area:<name>', or a project path.
 */
export function deriveDefaultScope(entry: PermissionLogEntry): {
  scope: string;
  label: string;
} {
  const { project, raw_path, base_repo_path } = entry;

  // Check if it's from a specific project
  if (base_repo_path && base_repo_path !== '') {
    // Try to find the full project path
    for (const area of AREA_VALUES) {
      // Check if this looks like a valid project path pattern
      if (raw_path.includes(`/${area}/`)) {
        // Extract the user home from raw_path
        const homeMatch = raw_path.match(/^(\/Users\/[^/]+)/);
        if (homeMatch) {
          const projectPath = `${homeMatch[1]}/${area}/${base_repo_path}`;
          return {
            scope: projectPath,
            label: `${area}/${base_repo_path}`,
          };
        }
      }
    }
  }

  // Check if the project field indicates an area config
  if (project.startsWith('.claude-')) {
    const areaName = project.replace('.claude-', '');
    if (AREA_VALUES.includes(areaName as AreaValue)) {
      return {
        scope: `area:${areaName}`,
        label: `${areaName.charAt(0).toUpperCase() + areaName.slice(1)} Area`,
      };
    }
  }

  // Check raw_path for area indicators
  for (const area of AREA_VALUES) {
    if (raw_path.includes(`/${area}/`) || raw_path.includes(`/.claude-${area}`)) {
      return {
        scope: `area:${area}`,
        label: `${area.charAt(0).toUpperCase() + area.slice(1)} Area`,
      };
    }
  }

  // Default to global
  return {
    scope: 'global',
    label: 'Global (~/.claude)',
  };
}

/**
 * Build a full rule string from tool and pattern
 */
export function buildRuleString(tool: string, pattern: string | null): string {
  if (pattern) {
    return `${tool}(${pattern})`;
  }
  return tool;
}
