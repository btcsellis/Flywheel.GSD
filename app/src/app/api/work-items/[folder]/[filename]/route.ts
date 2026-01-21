import { NextResponse } from 'next/server';
import { updateWorkItemContent, getWorkItem, deleteWorkItem, cleanupWorkItemResources } from '@/lib/work-items';

interface Props {
  params: Promise<{ folder: string; filename: string }>;
}

export async function PUT(request: Request, { params }: Props) {
  try {
    const { folder, filename } = await params;
    const validFolder = folder as 'backlog' | 'active' | 'done';

    if (!['backlog', 'active', 'done'].includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const success = await updateWorkItemContent(
      validFolder,
      decodeURIComponent(filename),
      content
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to update work item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating work item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const { folder, filename } = await params;
    const validFolder = folder as 'backlog' | 'active' | 'done';

    if (!['backlog', 'active', 'done'].includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder' },
        { status: 400 }
      );
    }

    const decodedFilename = decodeURIComponent(filename);

    // Load work item to get metadata for cleanup
    const workItem = await getWorkItem(validFolder, decodedFilename);
    if (!workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      );
    }

    // Clean up associated resources (prompt files, tmux session, PLAN.md)
    await cleanupWorkItemResources(workItem);

    // Delete the work item file
    const success = await deleteWorkItem(validFolder, decodedFilename);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete work item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting work item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
