import type { WorkItem, WorkItemStatus, WorkflowType } from './work-items';

export interface StatusAction {
  targetStatus: WorkItemStatus;
  label: string;
  command: string;
  mode: 'interactive' | 'autonomous';
}

/**
 * Maps each status to the command that should be run to progress the work item.
 * Commands are the source of truth for workflow logic.
 */
export const STATUS_ACTIONS: Record<WorkItemStatus, StatusAction> = {
  'new': { targetStatus: 'defined', label: 'Define', command: '/flywheel-define', mode: 'interactive' },
  'defined': { targetStatus: 'planned', label: 'Plan', command: '/flywheel-plan', mode: 'interactive' },
  'planned': { targetStatus: 'review', label: 'Execute', command: '/flywheel-execute', mode: 'autonomous' },
  'review': { targetStatus: 'done', label: 'Done', command: '/flywheel-done', mode: 'interactive' },
  'done': { targetStatus: 'done', label: 'Complete', command: '', mode: 'interactive' },
  'blocked': { targetStatus: 'planned', label: 'Unblock', command: '/flywheel-execute', mode: 'interactive' },
};

/**
 * Generates a minimal prompt that tells Claude which command to run.
 * The actual workflow logic lives in the command files, not here.
 */
export function generatePromptForStatus(workItem: WorkItem, workItemPath: string, workflow?: WorkflowType): string {
  const status = workItem.metadata.status;
  const action = STATUS_ACTIONS[status];
  const workflowInfo = workflow ? `\nWorkflow: ${workflow}` : '';
  const tmuxInfo = workItem.metadata.tmuxSession ? `\nTmux Session: ${workItem.metadata.tmuxSession}` : '';

  const baseContext = `You are working on a Flywheel.GSD work item.

Work item file: ${workItemPath}
Title: ${workItem.title}
Project: ${workItem.metadata.project}
Current Status: ${status}${workflowInfo}${tmuxInfo}

`;

  // For new items, include workflow selection instruction if provided
  const workflowInstruction = status === 'new' && workflow
    ? `\n\nIMPORTANT: The user has selected "${workflow}" workflow. Update the work item metadata to add:\n- workflow: ${workflow}`
    : '';

  switch (status) {
    case 'new':
      return baseContext + `This work item needs its goals and success criteria defined.${workflowInstruction}

Run ${action.command} to define the work item.`;

    case 'defined':
      return baseContext + `This work item has defined goals and needs an implementation plan.

Run ${action.command} to create the plan.`;

    case 'planned':
      return baseContext + `This work item has a plan ready for execution.

Run ${action.command} to begin autonomous execution.`;

    case 'review':
      return baseContext + `This work item is ready for review and shipping.

Run ${action.command} to commit, push, create PR, and archive.`;

    case 'done':
      return baseContext + `This work item is complete. No action needed.`;

    case 'blocked':
      return baseContext + `This work item is blocked.

Run ${action.command} to investigate and unblock.`;

    default:
      return baseContext + `Read the work item file and determine the appropriate next action.`;
  }
}

export function getNextStatusLabel(status: WorkItemStatus): string {
  return STATUS_ACTIONS[status]?.label ?? 'Continue';
}
