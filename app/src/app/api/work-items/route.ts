import { NextResponse } from 'next/server';
import { createWorkItem } from '@/lib/work-items';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, project, dueDate, important, description, successCriteria, notes } = body;

    if (!title || !project || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const filename = await createWorkItem({
      title,
      project,
      description,
      successCriteria: successCriteria || [],
      dueDate,
      important,
      notes,
    });

    if (filename) {
      return NextResponse.json({ success: true, filename });
    } else {
      return NextResponse.json(
        { error: 'Failed to create work item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating work item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
