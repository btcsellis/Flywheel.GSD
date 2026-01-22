import { NextResponse } from 'next/server';
import { getWorkItem, getProjectPath } from '@/lib/work-items';
import { launchClaudeInITerm } from '@/lib/terminal';
import { generatePromptForStatus } from '@/lib/prompts';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folder, filename, reuseSession = false } = body;

    if (!folder || !filename) {
      return NextResponse.json(
        { error: 'Missing folder or filename' },
        { status: 400 }
      );
    }

    // Load work item
    const workItem = await getWorkItem(folder, filename);
    if (!workItem) {
      return NextResponse.json(
        { error: 'Work item not found' },
        { status: 404 }
      );
    }

    // Resolve project path
    const projectPath = getProjectPath(workItem.metadata.project);
    if (!projectPath) {
      return NextResponse.json(
        { error: `Unknown project: ${workItem.metadata.project}. Project must be under ~/bellwether, ~/sophia, or ~/personal.` },
        { status: 400 }
      );
    }

    // Generate tmux session name from work item ID
    const tmuxSessionName = `flywheel-${workItem.metadata.id}`.replace(/[^a-zA-Z0-9-]/g, '-');

    // Get the work item file path relative to the flywheel-gsd repo
    const workItemPath = path.join(process.cwd(), '..', 'work', folder, filename);

    // Generate prompt based on status
    const initialPrompt = generatePromptForStatus(workItem, workItemPath);

    // Launch iTerm2 with tmux and claude
    const result = await launchClaudeInITerm({
      projectPath,
      tmuxSessionName,
      initialPrompt,
      reuseSession,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        tmuxSession: tmuxSessionName,
        reusedSession: result.reusedSession,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to launch terminal' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error launching Claude:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
