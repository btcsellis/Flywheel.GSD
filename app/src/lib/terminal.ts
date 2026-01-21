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

  // Write prompt to a temp file
  const tempDir = os.tmpdir();
  const promptFile = path.join(tempDir, `flywheel-prompt-${tmuxSessionName}.txt`);
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

  // AppleScript: reuse frontmost iTerm window if available, otherwise create new
  const appleScript = `
tell application "iTerm"
  activate
  if (count of windows) > 0 then
    tell current session of current window
      write text "${scriptFile}"
    end tell
  else
    create window with default profile
    tell current session of current window
      write text "${scriptFile}"
    end tell
  end if
  -- Attach to tmux session
  delay 0.5
  tell current session of current window
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
