import { NextResponse } from 'next/server';
import { discoverProjects, AREAS } from '@/lib/projects';
import {
  readGlobalRawRules,
  readAreaRawRules,
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
  areaEnabled: Record<string, string[]>;
  projects: ProjectRulesState[];
}

export async function GET() {
  try {
    const projectsByArea = await discoverProjects();
    const globalEnabledRules = await readGlobalRawRules();

    // Collect rules only from settings files (global, area, project)
    const knownRules = new Set<string>();
    for (const rule of globalEnabledRules) {
      knownRules.add(rule);
    }

    // Read area-level rules
    const areaEnabled: Record<string, string[]> = {};
    for (const area of AREAS) {
      const areaRules = await readAreaRawRules(area.value);
      areaEnabled[area.value] = areaRules;
      for (const rule of areaRules) {
        knownRules.add(rule);
      }
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

    // Build sets for sorting by scope tier
    const globalSet = new Set(globalEnabledRules);
    const areaSet = new Set(Object.values(areaEnabled).flat());
    const projectSet = new Set(projects.flatMap(p => p.enabledRules));

    function ruleTier(rule: string): number {
      if (globalSet.has(rule)) return 0;
      if (areaSet.has(rule)) return 1;
      if (projectSet.has(rule)) return 2;
      return 3;
    }

    const result: UnifiedPermissionsResponse = {
      allRules: Array.from(knownRules).sort((a, b) => {
        const tierDiff = ruleTier(a) - ruleTier(b);
        if (tierDiff !== 0) return tierDiff;
        return a.localeCompare(b);
      }),
      globalEnabled: globalEnabledRules,
      areaEnabled,
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
