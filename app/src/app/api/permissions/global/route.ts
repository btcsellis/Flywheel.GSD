import { NextRequest, NextResponse } from 'next/server';
import { readGlobalPermissions, writeGlobalPermissions } from '@/lib/permissions';

export async function GET() {
  try {
    const enabledCategories = await readGlobalPermissions();
    return NextResponse.json({ enabledCategories });
  } catch (error) {
    console.error('Failed to read global permissions:', error);
    return NextResponse.json(
      { error: 'Failed to read global permissions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabledCategories } = body as { enabledCategories: string[] };

    if (!Array.isArray(enabledCategories)) {
      return NextResponse.json(
        { error: 'enabledCategories must be an array' },
        { status: 400 }
      );
    }

    await writeGlobalPermissions(enabledCategories);

    return NextResponse.json({ success: true, enabledCategories });
  } catch (error) {
    console.error('Failed to write global permissions:', error);
    return NextResponse.json(
      { error: 'Failed to write global permissions' },
      { status: 500 }
    );
  }
}
