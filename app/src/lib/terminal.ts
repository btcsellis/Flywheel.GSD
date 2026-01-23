import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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

    // Copy .claude/settings.json from main project if it exists
    // This preserves Claude Code permissions in the worktree
    const sourceSettings = path.join(projectPath, '.claude', 'settings.json');
    const targetClaudeDir = path.join(worktreePath, '.claude');
    const targetSettings = path.join(targetClaudeDir, 'settings.json');

    try {
      await fs.access(sourceSettings);
      await fs.mkdir(targetClaudeDir, { recursive: true });
      await fs.copyFile(sourceSettings, targetSettings);
    } catch {
      // Source settings don't exist or copy failed - that's fine, continue without
    }

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
