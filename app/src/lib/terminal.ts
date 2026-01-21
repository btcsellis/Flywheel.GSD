import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface LaunchConfig {
  projectPath: string;
  tmuxSessionName: string;
  initialPrompt: string;
  reuseSession?: boolean;
}

export interface LaunchResult {
  success: boolean;
  error?: string;
  reusedSession?: boolean;
}

async function tmuxSessionExists(sessionName: string): Promise<boolean> {
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
    return stdout.trim().toLowerCase().includes('claude');
  } catch {
    return false;
  }
}

export async function launchClaudeInITerm(config: LaunchConfig): Promise<LaunchResult> {
  const { projectPath, tmuxSessionName, initialPrompt, reuseSession = false } = config;

  // Write prompt to project directory with task-specific name (so Claude Code has read access)
  const promptFile = path.join(projectPath, `.flywheel-prompt-${tmuxSessionName}.txt`);
  const tempDir = os.tmpdir();
  await fs.writeFile(promptFile, initialPrompt, 'utf-8');

  const sessionExists = await tmuxSessionExists(tmuxSessionName);
  const claudeRunning = sessionExists && await isClaudeRunningInSession(tmuxSessionName);

  let shellScript: string;
  let reusedSession = false;

  if (reuseSession && claudeRunning) {
    // Reuse mode: send prompt directly to running Claude
    reusedSession = true;
    const promptText = `Read and follow the instructions in ${promptFile}`;
    shellScript = `#!/bin/bash
tmux send-keys -t "${tmuxSessionName}" "${promptText}" Enter
`;
  } else {
    // Fresh mode: create new session or restart Claude
    const claudePrompt = `Read and follow the instructions in ${promptFile}`;

    if (sessionExists) {
      // Session exists but we want fresh - kill it first
      shellScript = `#!/bin/bash
tmux kill-session -t "${tmuxSessionName}" 2>/dev/null || true
cd "${projectPath}"
tmux new-session -d -s "${tmuxSessionName}"
tmux send-keys -t "${tmuxSessionName}" "claude '${claudePrompt}'" Enter
`;
    } else {
      shellScript = `#!/bin/bash
cd "${projectPath}"
tmux new-session -d -s "${tmuxSessionName}"
tmux send-keys -t "${tmuxSessionName}" "claude '${claudePrompt}'" Enter
`;
    }
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
    return { success: true, reusedSession };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error launching terminal';
    return { success: false, error: message };
  }
}
