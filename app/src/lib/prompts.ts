import type { WorkItem, WorkItemStatus, WorkflowType } from './work-items';

export interface StatusAction {
  targetStatus: WorkItemStatus;
  label: string;
  mode: 'interactive' | 'autonomous';
}

export const STATUS_ACTIONS: Record<WorkItemStatus, StatusAction> = {
  'new': { targetStatus: 'defined', label: 'Define Goals', mode: 'interactive' },
  'defined': { targetStatus: 'planned', label: 'Create Plan', mode: 'interactive' },
  'planned': { targetStatus: 'executing', label: 'Execute', mode: 'autonomous' },
  'executing': { targetStatus: 'review', label: 'Continue', mode: 'autonomous' },
  'review': { targetStatus: 'done', label: 'Ship', mode: 'interactive' },
  'done': { targetStatus: 'done', label: 'Complete', mode: 'interactive' },
  'blocked': { targetStatus: 'executing', label: 'Unblock', mode: 'interactive' },
};

export function generatePromptForStatus(workItem: WorkItem, workItemPath: string, workflow?: WorkflowType): string {
  const status = workItem.metadata.status;
  const workflowInfo = workflow ? `\nWorkflow: ${workflow}` : '';
  const tmuxInfo = workItem.metadata.tmuxSession ? `\nTmux Session: ${workItem.metadata.tmuxSession}` : '';

  const baseContext = `You are working on a Flywheel.GSD work item.

Work item file: ${workItemPath}
Title: ${workItem.title}
Project: ${workItem.metadata.project}
Current Status: ${status}${workflowInfo}${tmuxInfo}

`;

  switch (status) {
    case 'new':
      // For new items, the workflow choice should be passed from the UI
      const workflowInstruction = workflow
        ? `\n\nIMPORTANT: The user has selected "${workflow}" workflow. Update the work item metadata to add:\n- workflow: ${workflow}`
        : '';
      return baseContext + `This work item needs definition. Your task:
1. Read the work item file to understand the request
2. Ask clarifying questions to understand scope, constraints, and requirements
3. Define clear, specific success criteria
4. Update the work item file with the success criteria
5. Change status from 'new' to 'defined'${workflowInstruction}

Start by reading the work item and asking questions.`;

    case 'defined':
      return baseContext + `This work item has defined goals and needs a plan. Your task:
1. Read the work item file to understand the success criteria
2. Explore the codebase to understand the current architecture
3. Design an implementation approach
4. Create a numbered plan with specific steps
5. Update the work item file with the plan
6. Change status from 'defined' to 'planned'

Start by reading the work item and exploring the relevant code.`;

    case 'planned':
      return baseContext + `This work item has a plan ready for execution. Your task:
1. Read the work item file to understand the plan
2. Execute each step in the plan
3. Check off success criteria as you complete them
4. Add entries to the execution log as you make progress
5. When all steps are done, change status from 'planned' to 'review'

Run /flywheel-execute to begin autonomous execution.`;

    case 'executing':
      return baseContext + `This work item is in progress. Your task:
1. Read the work item file to see what has been done
2. Check the execution log for the last completed step
3. Continue executing from where you left off
4. Check off success criteria as you complete them
5. When all steps are done, change status from 'executing' to 'review'

Run /flywheel-execute to continue autonomous execution.`;

    case 'review':
      return baseContext + `This work item is ready for review and shipping. Your task:
1. Read the work item file
2. Verify all success criteria are met
3. Run any verification commands specified
4. Summarize what was implemented
5. Run /flywheel-ship to commit, push, and create a PR
6. Change status from 'review' to 'done'

Start by reading the work item and verifying the implementation.`;

    case 'done':
      return baseContext + `This work item is complete. No action needed.`;

    case 'blocked':
      return baseContext + `This work item is blocked. Your task:
1. Read the work item file to understand what's blocking progress
2. Investigate the blocker
3. Ask questions if needed to understand how to proceed
4. Once unblocked, change status back to the appropriate workflow step

Start by reading the work item to understand the blocker.`;

    default:
      return baseContext + `Read the work item file and determine the appropriate next action.`;
  }
}

export function getNextStatusLabel(status: WorkItemStatus): string {
  return STATUS_ACTIONS[status]?.label ?? 'Continue';
}
