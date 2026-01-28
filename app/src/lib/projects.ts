import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface Area {
  value: string;
  label: string;
  color: string;
  basePath: string;
}

export interface Project {
  name: string;
  path: string;
}

export interface ProjectsByArea {
  [area: string]: Project[];
}

export const AREAS: Area[] = [
  { value: 'bellwether', label: 'Bellwether', color: '#3b82f6', basePath: path.join(os.homedir(), 'bellwether') },
  { value: 'sophia', label: 'Sophia', color: '#f97316', basePath: path.join(os.homedir(), 'sophia') },
  { value: 'personal', label: 'Personal', color: '#22c55e', basePath: path.join(os.homedir(), 'personal') },
];

/**
 * Discovers projects by scanning the filesystem folders under ~/bellwether, ~/sophia, and ~/personal.
 * Only visible folders (not starting with '.') are included.
 */
export async function discoverProjects(): Promise<ProjectsByArea> {
  const result: ProjectsByArea = {};

  for (const area of AREAS) {
    result[area.value] = await discoverProjectsInArea(area.basePath);
  }

  return result;
}

/**
 * Discovers projects in a specific area directory.
 * Returns only visible directories (excludes hidden folders starting with '.' and worktree folders containing '-worktree').
 */
export async function discoverProjectsInArea(basePath: string): Promise<Project[]> {
  try {
    const entries = await fs.readdir(basePath, { withFileTypes: true });

    const projects: Project[] = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.includes('-worktree'))
      .map(entry => ({
        name: entry.name,
        path: path.join(basePath, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return projects;
  } catch {
    // Directory doesn't exist or isn't accessible
    return [];
  }
}

/**
 * Gets the full filesystem path for a project identifier.
 * @param projectIdentifier - The project identifier in format "area/projectName" (e.g., "bellwether/BellwetherPlatform")
 * @returns The full path to the project, or null if the area is unknown
 */
export function getProjectPathFromIdentifier(projectIdentifier: string): string | null {
  const [areaName, projectName] = projectIdentifier.split('/');

  if (!areaName || !projectName) {
    return null;
  }

  const area = AREAS.find(a => a.value === areaName);
  if (!area) {
    return null;
  }

  return path.join(area.basePath, projectName);
}
