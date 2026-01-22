import { NextResponse } from 'next/server';
import { discoverProjects, AREAS } from '@/lib/projects';
import {
  readProjectPermissions,
  readGlobalPermissions,
  AllPermissionsState,
  ProjectPermissionState,
} from '@/lib/permissions';

export async function GET() {
  try {
    const projectsByArea = await discoverProjects();
    const globalPermissions = await readGlobalPermissions();

    const projects: ProjectPermissionState[] = [];

    for (const area of AREAS) {
      const areaProjects = projectsByArea[area.value] || [];

      for (const project of areaProjects) {
        const enabledCategories = await readProjectPermissions(project.path);

        projects.push({
          projectPath: project.path,
          projectName: project.name,
          area: area.value,
          enabledCategories,
        });
      }
    }

    const result: AllPermissionsState = {
      global: globalPermissions,
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
