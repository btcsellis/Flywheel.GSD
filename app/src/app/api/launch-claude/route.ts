import { NextResponse } from 'next/server';
import { getWorkItem, getProjectPath, updateWorkItemMetadata, WorkflowType } from '@/lib/work-items';
import { launchClaudeInITerm, generateTmuxSessionName } from '@/lib/terminal';
import { generatePromptForStatus } from '@/lib/prompts';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folder, filename, reuseSession = false, workflow } = body;

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

    // Determine workflow type:
    // 1. Use provided workflow from request (for new items where user selects)
    // 2. Fall back to stored workflow in metadata (for subsequent launches)
    // 3. Default to 'worktree' for backwards compatibility
    const effectiveWorkflow: WorkflowType = workflow || workItem.metadata.workflow || 'worktree';

    // Generate tmux session name based on workflow
    // - For new items without stored session: generate based on workflow type
    // - For existing items: use stored session name if available
    let tmuxSessionName: string;
    if (workItem.metadata.tmuxSession) {
      tmuxSessionName = workItem.metadata.tmuxSession;
    } else {
      tmuxSessionName = generateTmuxSessionName(projectPath, effectiveWorkflow, workItem.metadata.id);
    }

    // Get the work item file path relative to the flywheel-gsd repo
    const workItemPath = path.join(process.cwd(), '..', 'work', folder, filename);

    // Generate prompt based on status, passing workflow for new items
    const initialPrompt = generatePromptForStatus(workItem, workItemPath, workflow);

    // Launch iTerm2 with tmux and claude
    const result = await launchClaudeInITerm({
      projectPath,
      tmuxSessionName,
      initialPrompt,
      reuseSession,
      workflow: effectiveWorkflow,
      workItemId: workItem.metadata.id,
    });

    if (result.success) {
      // Update work item metadata with workflow and session info
      // This persists the session name for subsequent launches
      if (!workItem.metadata.tmuxSession || !workItem.metadata.workflow) {
        await updateWorkItemMetadata(folder, filename, {
          workflow: effectiveWorkflow,
          tmuxSession: tmuxSessionName,
        });
      }

      return NextResponse.json({
        success: true,
        tmuxSession: tmuxSessionName,
        reusedSession: result.reusedSession,
        worktreePath: result.worktreePath,
        workflow: effectiveWorkflow,
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
