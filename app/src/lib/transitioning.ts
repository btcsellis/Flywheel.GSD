import { promises as fs } from 'fs';
import path from 'path';

const FLYWHEEL_PATH = process.env.FLYWHEEL_GSD_PATH || path.join(process.env.HOME || '', 'personal', 'flywheel-gsd');

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
 * Get all currently transitioning work items
 * Checks both explicit .flywheel-transitioning-{id} files and .flywheel-prompt-{project}.txt files
 */
export async function getAllTransitioning(): Promise<TransitioningState[]> {
  try {
    const files = await fs.readdir(FLYWHEEL_PATH);
    const states: TransitioningState[] = [];

    // Check explicit transitioning marker files
    const transitioningFiles = files.filter(f => f.startsWith('.flywheel-transitioning-'));
    for (const file of transitioningFiles) {
      try {
        const content = await fs.readFile(path.join(FLYWHEEL_PATH, file), 'utf-8');
        states.push(JSON.parse(content) as TransitioningState);
      } catch {
        // Skip invalid files
      }
    }

    // Also check for prompt files - these indicate a skill is running
    const promptFiles = files.filter(f => f.startsWith('.flywheel-prompt-') && f.endsWith('.txt'));
    for (const file of promptFiles) {
      try {
        const content = await fs.readFile(path.join(FLYWHEEL_PATH, file), 'utf-8');
        // Parse the prompt file to get work item ID
        const idMatch = content.match(/Work item file:.*\/([^/]+)\.md/);
        const statusMatch = content.match(/Current Status:\s*(\w+)/);

        if (idMatch) {
          // Extract ID from filename
          const workItemFilename = idMatch[1];
          // Parse ID from the markdown metadata in work item (id: xxx)
          const idFromFilename = workItemFilename.replace(/^\d{4}-\d{2}-\d{2}-/, '');

          // Check if we already have this ID from transitioning files
          const existingState = states.find(s => s.id === idFromFilename || workItemFilename.includes(s.id));
          if (!existingState) {
            states.push({
              id: idFromFilename,
              previousStatus: statusMatch?.[1] || 'unknown',
              startedAt: new Date().toISOString(),
            });
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
