import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getFlywheelRules, ClaudeSettings } from './permissions';

const execAsync = promisify(exec);

export type WorkflowType = 'main' | 'worktree';

export interface LaunchConfig {
  projectPath: string;
  tmuxSessionName: string;
  initialPrompt: string;
  reuseSession?: boolean;
  workflow?: WorkflowType;
  workItemId?: string;
}

export interface LaunchResult {
  success: boolean;
  error?: string;
  reusedSession?: boolean;
  worktreePath?: string;
  tmuxSession?: string;
}

export interface WorktreeResult {
  success: boolean;
  worktreePath?: string;
  branchName?: string;
  error?: string;
}

/**
 * Rewrite a path-based permission rule to use the worktree path.
 * Only rewrites paths that match the project path, not flywheel-specific paths.
 *
 * @param rule - The permission rule string (e.g., "Read(~/personal/project/**)")
 * @param projectPath - The original project path (e.g., "/Users/foo/personal/project")
 * @param worktreePath - The worktree path (e.g., "/Users/foo/personal/project-worktrees/work-item-id")
 * @returns The rewritten rule, or the original if no rewrite needed
 */
function rewritePathInRule(rule: string, projectPath: string, worktreePath: string): string {
  const homeDir = os.homedir();

  // Convert project path to both formats: with ~ and expanded
  const projectWithTilde = projectPath.replace(homeDir, '~');
  const projectExpanded = projectPath.startsWith('~')
    ? projectPath.replace('~', homeDir)
    : projectPath;

  // Convert worktree path to both formats
  const worktreeWithTilde = worktreePath.replace(homeDir, '~');
  const worktreeExpanded = worktreePath.startsWith('~')
    ? worktreePath.replace('~', homeDir)
    : worktreePath;

  // Try to replace path in the rule (handle both ~ and expanded formats)
  let rewritten = rule;

  // Replace ~ format first (more specific)
  if (rewritten.includes(projectWithTilde)) {
    rewritten = rewritten.replace(projectWithTilde, worktreeWithTilde);
  }
  // Then try expanded format
  else if (rewritten.includes(projectExpanded)) {
    rewritten = rewritten.replace(projectExpanded, worktreeExpanded);
  }

  return rewritten;
}

/**
 * Rewrite permissions for a worktree, replacing project paths with worktree paths.
 * Flywheel-specific rules are NOT rewritten (they always reference the main flywheel-gsd repo).
 *
 * @param rules - Array of permission rules
 * @param projectPath - The original project path
 * @param worktreePath - The worktree path
 * @param flywheelRules - Set of flywheel rules that should not be rewritten
 * @returns Array of rewritten rules
 */
function rewritePermissionsForWorktree(
  rules: string[],
  projectPath: string,
  worktreePath: string,
  flywheelRules: Set<string>
): string[] {
  return rules.map((rule) => {
    // Don't rewrite flywheel-specific rules
    if (flywheelRules.has(rule)) {
      return rule;
    }
    return rewritePathInRule(rule, projectPath, worktreePath);
  });
}

/**
 * Read and parse a Claude settings JSON file.
 */
async function readClaudeSettingsFile(filePath: string): Promise<ClaudeSettings | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as ClaudeSettings;
  } catch {
    return null;
  }
}

/**
 * Write Claude settings to a JSON file.
 */
async function writeClaudeSettingsFile(filePath: string, settings: ClaudeSettings): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

/**
 * Copy the parent project's .claude settings to the worktree with path rewriting.
 * This allows the worktree to inherit Claude Code permissions from the parent,
 * with paths rewritten to reference the worktree location.
 *
 * - If parent has no .claude directory, silently skips (no error)
 * - If worktree already has .claude, doesn't overwrite
 * - Copies both settings.json and settings.local.json (if they exist)
 * - Rewrites path-based permissions to use worktree path
 * - Does NOT rewrite flywheel-specific permissions
 */
async function copyClaudeSettingsForWorktree(
  projectPath: string,
  worktreePath: string
): Promise<void> {
  const sourceClaudeDir = path.join(projectPath, '.claude');
  const targetClaudeDir = path.join(worktreePath, '.claude');

  try {
    // Check if source .claude directory exists
    await fs.access(sourceClaudeDir);
  } catch {
    // Parent has no .claude directory, nothing to copy
    return;
  }

  try {
    // Check if target already has .claude (don't overwrite)
    await fs.access(targetClaudeDir);
    // Target exists, don't overwrite
    return;
  } catch {
    // Target doesn't exist, proceed with copy
  }

  // Get flywheel rules that should not be rewritten
  const flywheelRules = new Set(getFlywheelRules());

  try {
    // Create target .claude directory
    await fs.mkdir(targetClaudeDir, { recursive: true });

    // Process settings.json
    const settingsPath = path.join(sourceClaudeDir, 'settings.json');
    const settings = await readClaudeSettingsFile(settingsPath);
    if (settings) {
      if (settings.permissions?.allow) {
        settings.permissions.allow = rewritePermissionsForWorktree(
          settings.permissions.allow,
          projectPath,
          worktreePath,
          flywheelRules
        );
      }
      if (settings.permissions?.deny) {
        settings.permissions.deny = rewritePermissionsForWorktree(
          settings.permissions.deny,
          projectPath,
          worktreePath,
          flywheelRules
        );
      }
      await writeClaudeSettingsFile(path.join(targetClaudeDir, 'settings.json'), settings);
    }

    // Process settings.local.json (if exists)
    const localSettingsPath = path.join(sourceClaudeDir, 'settings.local.json');
    const localSettings = await readClaudeSettingsFile(localSettingsPath);
    if (localSettings) {
      if (localSettings.permissions?.allow) {
        localSettings.permissions.allow = rewritePermissionsForWorktree(
          localSettings.permissions.allow,
          projectPath,
          worktreePath,
          flywheelRules
        );
      }
      if (localSettings.permissions?.deny) {
        localSettings.permissions.deny = rewritePermissionsForWorktree(
          localSettings.permissions.deny,
          projectPath,
          worktreePath,
          flywheelRules
        );
      }
      await writeClaudeSettingsFile(
        path.join(targetClaudeDir, 'settings.local.json'),
        localSettings
      );
    }
  } catch {
    // Copy failed - don't fail the worktree creation
    // This could happen due to permissions or other issues
  }
}

/**
 * Pre-approve workspace trust for a worktree in ~/.claude.json.
 * This sets hasTrustDialogAccepted=true so Claude Code doesn't prompt
 * "Do you trust the files in this folder?" when launching in the worktree.
 */
async function preApproveWorktreeTrust(worktreePath: string): Promise<void> {
  const claudeJsonPath = path.join(os.homedir(), '.claude.json');

  try {
    let data: Record<string, unknown> = {};
    try {
      const content = await fs.readFile(claudeJsonPath, 'utf-8');
      data = JSON.parse(content) as Record<string, unknown>;
    } catch {
      // File doesn't exist or isn't valid JSON — start fresh
    }

    if (!data.projects || typeof data.projects !== 'object') {
      data.projects = {};
    }

    const projects = data.projects as Record<string, Record<string, unknown>>;
    projects[worktreePath] = {
      ...projects[worktreePath],
      hasTrustDialogAccepted: true,
    };

    await fs.writeFile(claudeJsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  } catch {
    // Don't block worktree creation if trust pre-approval fails
  }
}

/**
 * Create a git worktree for isolated work on a feature/work item.
 * Worktree is created at ../{repo-name}-worktrees/{workItemId}/
 * Branch is created with name {workItemId}
 */
export async function createWorktree(projectPath: string, workItemId: string): Promise<WorktreeResult> {
  try {
    // Get the repo name from the project path
    const repoName = path.basename(projectPath);
    const parentDir = path.dirname(projectPath);
    const worktreesDir = path.join(parentDir, `${repoName}-worktrees`);
    const worktreePath = path.join(worktreesDir, workItemId);
    const branchName = workItemId;

    // Create worktrees directory if it doesn't exist
    await fs.mkdir(worktreesDir, { recursive: true });

    // Check if worktree already exists
    try {
      await fs.access(worktreePath);
      // Worktree exists, return it
      return { success: true, worktreePath, branchName };
    } catch {
      // Worktree doesn't exist, create it
    }

    // Create the worktree with a new branch
    await execAsync(`cd "${projectPath}" && git worktree add -b "${branchName}" "${worktreePath}"`, {
      timeout: 30000,
    });

    // Copy Claude Code settings from parent project with path rewriting
    await copyClaudeSettingsForWorktree(projectPath, worktreePath);

    // Pre-approve workspace trust so Claude Code doesn't prompt on launch
    await preApproveWorktreeTrust(worktreePath);

    return { success: true, worktreePath, branchName };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error creating worktree';
    return { success: false, error: message };
  }
}

/**
 * Delete a git worktree and its branch.
 */
export async function deleteWorktree(projectPath: string, workItemId: string): Promise<boolean> {
  try {
    const repoName = path.basename(projectPath);
    const parentDir = path.dirname(projectPath);
    const worktreePath = path.join(parentDir, `${repoName}-worktrees`, workItemId);
    const branchName = workItemId;

    // Remove the worktree
    try {
      await execAsync(`cd "${projectPath}" && git worktree remove "${worktreePath}" --force`, {
        timeout: 30000,
      });
    } catch {
      // Worktree might not exist, continue to try deleting branch
    }

    // Delete the branch
    try {
      await execAsync(`cd "${projectPath}" && git branch -D "${branchName}"`, {
        timeout: 10000,
      });
    } catch {
      // Branch might not exist or might have been merged
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Generate appropriate tmux session name based on workflow type.
 * - main: uses project name (e.g., "flywheel-gsd")
 * - worktree: uses "flywheel-{project}-{workItemId}"
 */
export function generateTmuxSessionName(
  projectPath: string,
  workflow: WorkflowType,
  workItemId: string
): string {
  const projectName = path.basename(projectPath).replace(/[^a-zA-Z0-9-]/g, '-');

  if (workflow === 'main') {
    return projectName;
  } else {
    return `flywheel-${projectName}-${workItemId}`.replace(/[^a-zA-Z0-9-]/g, '-');
  }
}

export async function tmuxSessionExists(sessionName: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t "${sessionName}" 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

export async function killTmuxSession(sessionName: string): Promise<boolean> {
  try {
    await execAsync(`tmux kill-session -t "${sessionName}" 2>/dev/null`);
    return true;
  } catch {
    // Session doesn't exist or already killed - that's fine
    return false;
  }
}

async function isClaudeRunningInSession(sessionName: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `tmux list-panes -t "${sessionName}" -F "#{pane_current_command}" 2>/dev/null`
    );
    const commands = stdout.trim().toLowerCase();
    return commands.includes('claude') || commands.includes('node');
  } catch {
    return false;
  }
}

export async function launchClaudeInITerm(config: LaunchConfig): Promise<LaunchResult> {
  const { projectPath, tmuxSessionName, initialPrompt, reuseSession = false, workflow, workItemId } = config;

  // Determine working directory based on workflow
  let workingPath = projectPath;
  let worktreePath: string | undefined;

  if (workflow === 'worktree' && workItemId) {
    // Create worktree for isolated work
    const worktreeResult = await createWorktree(projectPath, workItemId);
    if (worktreeResult.success && worktreeResult.worktreePath) {
      workingPath = worktreeResult.worktreePath;
      worktreePath = worktreeResult.worktreePath;
    } else {
      return { success: false, error: worktreeResult.error || 'Failed to create worktree' };
    }
  }

  // Write prompt to working directory with task-specific name (so Claude Code has read access)
  const promptFile = path.join(workingPath, `.flywheel-prompt-${tmuxSessionName}.txt`);
  const tempDir = os.tmpdir();
  await fs.writeFile(promptFile, initialPrompt, 'utf-8');

  const sessionExists = await tmuxSessionExists(tmuxSessionName);

  if (reuseSession && sessionExists) {
    // Reuse mode: send prompt directly to existing tmux session
    // No new pane - just send keys to the existing session
    const promptText = `Read and follow the instructions in ${promptFile}`;

    try {
      // Send text and Enter separately for reliable submission
      await execAsync(`tmux send-keys -t "${tmuxSessionName}" -- "${promptText}"`);
      await execAsync(`tmux send-keys -t "${tmuxSessionName}" Enter`);
      return { success: true, reusedSession: true, worktreePath, tmuxSession: tmuxSessionName };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send to existing session';
      return { success: false, error: message };
    }
  }

  // Fresh mode: create new session or start Claude
  const claudePrompt = `Read and follow the instructions in ${promptFile}`;
  let shellScript: string;

  if (await tmuxSessionExists(tmuxSessionName)) {
    // Session exists but we want fresh - kill it first
    shellScript = `#!/bin/bash
tmux kill-session -t "${tmuxSessionName}" 2>/dev/null || true
cd "${workingPath}"
tmux new-session -d -s "${tmuxSessionName}"
tmux send-keys -t "${tmuxSessionName}" "claude '${claudePrompt}'" Enter
`;
  } else {
    shellScript = `#!/bin/bash
cd "${workingPath}"
tmux new-session -d -s "${tmuxSessionName}"
tmux send-keys -t "${tmuxSessionName}" "claude '${claudePrompt}'" Enter
`;
  }

  const scriptFile = path.join(tempDir, `flywheel-launch-${tmuxSessionName}.sh`);
  await fs.writeFile(scriptFile, shellScript, { mode: 0o755 });

  // AppleScript: create a new pane (horizontal split) in current window
  const appleScript = `
tell application "iTerm"
  activate
  tell current session of current window
    set newSession to (split horizontally with default profile)
  end tell
  tell newSession
    write text "bash ${scriptFile}"
    delay 0.5
    write text "tmux attach -t ${tmuxSessionName}"
  end tell
end tell
`;

  try {
    const appleScriptFile = path.join(tempDir, `flywheel-applescript-${tmuxSessionName}.scpt`);
    await fs.writeFile(appleScriptFile, appleScript);

    await execAsync(`osascript "${appleScriptFile}"`);
    return { success: true, reusedSession: false, worktreePath, tmuxSession: tmuxSessionName };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error launching terminal';
    return { success: false, error: message };
  }
}
