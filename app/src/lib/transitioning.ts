import { promises as fs } from 'fs';
import path from 'path';
import { getAllWorkItems } from './work-items';

const FLYWHEEL_PATH = process.env.FLYWHEEL_GSD_PATH || path.join(process.env.HOME || '', 'personal', 'flywheel-gsd');
const WORKTREES_PATH = path.join(path.dirname(FLYWHEEL_PATH), 'flywheel-gsd-worktrees');

export interface TransitioningState {
  id: string;
  previousStatus: string;
  startedAt: string;
}

function getTransitioningFilePath(id: string): string {
  return path.join(FLYWHEEL_PATH, `.flywheel-transitioning-${id}`);
}

/**
 * Mark a work item as transitioning (Claude Code is working on it)
 */
export async function markAsTransitioning(id: string, previousStatus: string): Promise<void> {
  const filePath = getTransitioningFilePath(id);
  const state: TransitioningState = {
    id,
    previousStatus,
    startedAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Clear the transitioning state for a work item
 */
export async function clearTransitioning(id: string): Promise<void> {
  const filePath = getTransitioningFilePath(id);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Check if a work item is currently transitioning
 */
export async function isTransitioning(id: string): Promise<TransitioningState | null> {
  const filePath = getTransitioningFilePath(id);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as TransitioningState;
  } catch {
    return null;
  }
}

/**
 * Get all currently transitioning work items.
 * Checks both explicit .flywheel-transitioning-{id} files and .flywheel-prompt-{project}.txt files.
 * Validates markers against actual work items and cleans up stale ones.
 */
export async function getAllTransitioning(): Promise<TransitioningState[]> {
  try {
    const files = await fs.readdir(FLYWHEEL_PATH);
    const states: TransitioningState[] = [];

    // Load all work items for validation
    const { backlog, active, done } = await getAllWorkItems();
    const allWorkItems = [...backlog, ...active, ...done];

    // Check explicit transitioning marker files
    const transitioningFiles = files.filter(f => f.startsWith('.flywheel-transitioning-'));
    for (const file of transitioningFiles) {
      try {
        const content = await fs.readFile(path.join(FLYWHEEL_PATH, file), 'utf-8');
        const state = JSON.parse(content) as TransitioningState;

        const workItem = allWorkItems.find(item => item.metadata.id === state.id);
        if (!workItem) {
          // Work item doesn't exist — stale marker, clean up
          await fs.unlink(path.join(FLYWHEEL_PATH, file)).catch(() => {});
          continue;
        }

        if (workItem.metadata.status !== state.previousStatus) {
          // Status changed since marker was created — transition complete, clean up
          await fs.unlink(path.join(FLYWHEEL_PATH, file)).catch(() => {});
          continue;
        }

        states.push(state);
      } catch {
        // Skip invalid files
      }
    }

    // Collect prompt files from FLYWHEEL_PATH and all worktree directories
    const promptFilePaths: string[] = [];

    // Prompt files in FLYWHEEL_PATH
    const promptFiles = files.filter(f => f.startsWith('.flywheel-prompt-') && f.endsWith('.txt'));
    for (const file of promptFiles) {
      promptFilePaths.push(path.join(FLYWHEEL_PATH, file));
    }

    // Prompt files in worktree directories
    try {
      const worktreeDirs = await fs.readdir(WORKTREES_PATH);
      for (const dir of worktreeDirs) {
        try {
          const worktreeDir = path.join(WORKTREES_PATH, dir);
          const stat = await fs.stat(worktreeDir);
          if (!stat.isDirectory()) continue;
          const worktreeFiles = await fs.readdir(worktreeDir);
          for (const file of worktreeFiles) {
            if (file.startsWith('.flywheel-prompt-') && file.endsWith('.txt')) {
              promptFilePaths.push(path.join(worktreeDir, file));
            }
          }
        } catch {
          // Skip inaccessible worktree directories
        }
      }
    } catch {
      // Worktrees directory doesn't exist, skip
    }

    // Process all found prompt files
    for (const filePath of promptFilePaths) {
      try {
        const promptContent = await fs.readFile(filePath, 'utf-8');
        const filePathMatch = promptContent.match(/Work item file:\s*(.+\.md)/);
        const statusMatch = promptContent.match(/Current Status:\s*(\w+)/);

        if (filePathMatch) {
          let workItemId: string | null = null;
          try {
            const workItemContent = await fs.readFile(filePathMatch[1].trim(), 'utf-8');
            const idMatch = workItemContent.match(/^- id:\s*(.+)$/m);
            if (idMatch) {
              workItemId = idMatch[1].trim();
            }
          } catch {
            continue;
          }

          if (workItemId) {
            const existingState = states.find(s => s.id === workItemId);
            if (!existingState) {
              states.push({
                id: workItemId,
                previousStatus: statusMatch?.[1] || 'unknown',
                startedAt: new Date().toISOString(),
              });
            }
          }
        }
      } catch {
        // Skip invalid files
      }
    }

    return states;
  } catch {
    return [];
  }
}
