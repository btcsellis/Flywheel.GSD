import { NextRequest, NextResponse } from 'next/server';
import { readProjectPermissions, writeProjectPermissions } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('path');

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    const enabledCategories = await readProjectPermissions(projectPath);
    return NextResponse.json({ projectPath, enabledCategories });
  } catch (error) {
    console.error('Failed to read project permissions:', error);
    return NextResponse.json(
      { error: 'Failed to read project permissions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectPath, enabledCategories } = body as {
      projectPath: string;
      enabledCategories: string[];
    };

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(enabledCategories)) {
      return NextResponse.json(
        { error: 'enabledCategories must be an array' },
        { status: 400 }
      );
    }

    await writeProjectPermissions(projectPath, enabledCategories);

    return NextResponse.json({ success: true, projectPath, enabledCategories });
  } catch (error) {
    console.error('Failed to write project permissions:', error);
    return NextResponse.json(
      { error: 'Failed to write project permissions' },
      { status: 500 }
    );
  }
}
