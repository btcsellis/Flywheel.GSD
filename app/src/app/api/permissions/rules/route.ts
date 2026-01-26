import { NextResponse } from 'next/server';
import { discoverProjects, AREAS } from '@/lib/projects';
import {
  readAllRawRules,
  computeRuleDisplayList,
  RuleWithSource,
} from '@/lib/permissions';

export interface RulesApiResponse {
  globalRules: RuleWithSource[];
  projectRules: Record<string, {
    projectName: string;
    area: string;
    rules: RuleWithSource[];
  }>;
}

export async function GET() {
  try {
    const projectsByArea = await discoverProjects();

    // Collect all project paths and info
    const projectInfo: Record<string, { name: string; area: string }> = {};
    const projectPaths: string[] = [];

    for (const area of AREAS) {
      const areaProjects = projectsByArea[area.value] || [];
      for (const project of areaProjects) {
        projectPaths.push(project.path);
        projectInfo[project.path] = { name: project.name, area: area.value };
      }
    }

    // Read all raw rules
    const { globalRules, projectRules } = await readAllRawRules(projectPaths);

    // Compute global rules display list (no project rules for comparison)
    const globalRulesDisplay = computeRuleDisplayList(globalRules, []);

    // Compute project rules display list for each project
    const projectRulesResponse: RulesApiResponse['projectRules'] = {};
    for (const [projectPath, rules] of Object.entries(projectRules)) {
      const info = projectInfo[projectPath];
      const rulesDisplay = computeRuleDisplayList(globalRules, rules);
      // Filter to only show project-sourced rules (not global)
      const projectOnlyRules = rulesDisplay.filter(r => r.source === 'project');

      projectRulesResponse[projectPath] = {
        projectName: info.name,
        area: info.area,
        rules: projectOnlyRules,
      };
    }

    const result: RulesApiResponse = {
      globalRules: globalRulesDisplay,
      projectRules: projectRulesResponse,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to read rules:', error);
    return NextResponse.json(
      { error: 'Failed to read rules' },
      { status: 500 }
    );
  }
}
