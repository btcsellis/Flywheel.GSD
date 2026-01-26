import { NextResponse } from 'next/server';
import { discoverProjects, AREAS } from '@/lib/projects';
import {
  getAllKnownRules,
  readGlobalRawRules,
  readProjectRawRules,
} from '@/lib/permissions';

export interface ProjectRulesState {
  projectPath: string;
  projectName: string;
  area: string;
  enabledRules: string[];
}

export interface UnifiedPermissionsResponse {
  allRules: string[];
  globalEnabled: string[];
  projects: ProjectRulesState[];
}

export async function GET() {
  try {
    const projectsByArea = await discoverProjects();
    const globalEnabledRules = await readGlobalRawRules();

    // Collect all known rules from categories
    const knownRules = new Set(getAllKnownRules());

    // Add any custom rules from global settings
    for (const rule of globalEnabledRules) {
      knownRules.add(rule);
    }

    const projects: ProjectRulesState[] = [];

    for (const area of AREAS) {
      const areaProjects = projectsByArea[area.value] || [];

      for (const project of areaProjects) {
        const enabledRules = await readProjectRawRules(project.path);

        // Add any custom rules from this project
        for (const rule of enabledRules) {
          knownRules.add(rule);
        }

        projects.push({
          projectPath: project.path,
          projectName: project.name,
          area: area.value,
          enabledRules,
        });
      }
    }

    const result: UnifiedPermissionsResponse = {
      allRules: Array.from(knownRules).sort(),
      globalEnabled: globalEnabledRules,
      projects,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to read permissions:', error);
    return NextResponse.json(
      { error: 'Failed to read permissions' },
      { status: 500 }
    );
  }
}
