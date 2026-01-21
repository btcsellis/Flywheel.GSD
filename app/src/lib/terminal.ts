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
}

export interface LaunchResult {
  success: boolean;
  error?: string;
}

export async function launchClaudeInITerm(config: LaunchConfig): Promise<LaunchResult> {
  const { projectPath, tmuxSessionName, initialPrompt } = config;

  // Write prompt to a temp file to avoid escaping issues
  const tempDir = os.tmpdir();
  const promptFile = path.join(tempDir, `flywheel-prompt-${tmuxSessionName}.txt`);
  await fs.writeFile(promptFile, initialPrompt, 'utf-8');

  // Simple command that references the prompt file
  const claudePrompt = `Read and follow the instructions in ${promptFile}`;

  // Create a shell script that will be executed
  const shellScript = `#!/bin/bash
cd "${projectPath}"
tmux new-session -d -s "${tmuxSessionName}" 2>/dev/null || true
tmux send-keys -t "${tmuxSessionName}" "claude '${claudePrompt}'" Enter
tmux attach -t "${tmuxSessionName}"
`;

  const scriptFile = path.join(tempDir, `flywheel-launch-${tmuxSessionName}.sh`);
  await fs.writeFile(scriptFile, shellScript, { mode: 0o755 });

  // AppleScript to open iTerm2 and run the script
  const appleScript = `
tell application "iTerm"
  activate
  create window with default profile
  tell current session of current window
    write text "${scriptFile}"
  end tell
end tell
`;

  try {
    const appleScriptFile = path.join(tempDir, `flywheel-applescript-${tmuxSessionName}.scpt`);
    await fs.writeFile(appleScriptFile, appleScript);

    await execAsync(`osascript "${appleScriptFile}"`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error launching terminal';
    return { success: false, error: message };
  }
}
