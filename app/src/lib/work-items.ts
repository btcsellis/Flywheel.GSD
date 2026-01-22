import { promises as fs } from 'fs';
import path from 'path';
import { killTmuxSession } from './terminal';
import { getProjectPathFromIdentifier } from './projects';

export type WorkItemStatus =
  | 'new'        // New, needs definition
  | 'defined'    // Defined with success criteria, ready to plan
  | 'planned'    // Plan created, ready to execute
  | 'executing'  // Actively being worked on
  | 'review'     // For review - awaiting human approval
  | 'done'       // Approved, shipped, cleaned up
  | 'blocked';   // Stuck, needs intervention

// Normalize old status values to new ones
function normalizeStatus(status: string): WorkItemStatus {
  const mapping: Record<string, WorkItemStatus> = {
    'created': 'new',
    'goals-set': 'defined',
    'verifying': 'review',
  };
  return mapping[status] || (status as WorkItemStatus) || 'new';
}

export interface WorkItemMetadata {
  id: string;
  project: string;
  created: string;
  status: WorkItemStatus;
  dueDate?: string;
  important?: boolean;
  assignedSession?: string;
}

export interface SuccessCriterion {
  text: string;
  completed: boolean;
}

export interface WorkItem {
  filename: string;
  filepath: string;
  folder: 'backlog' | 'active' | 'done';
  title: string;
  metadata: WorkItemMetadata;
  description: string;
  successCriteria: SuccessCriterion[];
  notes: string;
  executionLog: string[];
  rawContent: string;
}

const WORK_DIR = path.join(process.cwd(), '..', 'work');

export async function getWorkItemsFromFolder(folder: 'backlog' | 'active' | 'done'): Promise<WorkItem[]> {
  const folderPath = path.join(WORK_DIR, folder);

  try {
    const files = await fs.readdir(folderPath);
    const mdFiles = files.filter(f => f.endsWith('.md') && f !== 'TEMPLATE.md' && !f.startsWith('.'));

    const items = await Promise.all(
      mdFiles.map(async (filename) => {
        const filepath = path.join(folderPath, filename);
        const content = await fs.readFile(filepath, 'utf-8');
        return parseWorkItem(content, filename, filepath, folder);
      })
    );

    return items.filter((item): item is WorkItem => item !== null);
  } catch {
    return [];
  }
}

export async function getAllWorkItems(): Promise<{
  backlog: WorkItem[];
  active: WorkItem[];
  done: WorkItem[];
}> {
  const [backlog, active, done] = await Promise.all([
    getWorkItemsFromFolder('backlog'),
    getWorkItemsFromFolder('active'),
    getWorkItemsFromFolder('done'),
  ]);

  return { backlog, active, done };
}

export async function getWorkItem(folder: 'backlog' | 'active' | 'done', filename: string): Promise<WorkItem | null> {
  const filepath = path.join(WORK_DIR, folder, filename);

  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return parseWorkItem(content, filename, filepath, folder);
  } catch {
    return null;
  }
}

function parseWorkItem(
  content: string,
  filename: string,
  filepath: string,
  folder: 'backlog' | 'active' | 'done'
): WorkItem | null {
  const lines = content.split('\n');

  // Extract title (first H1)
  const titleLine = lines.find(l => l.startsWith('# '));
  const title = titleLine ? titleLine.replace('# ', '').trim() : filename.replace('.md', '');

  // Extract metadata section
  const metadata = parseMetadata(content);
  if (!metadata) return null;

  // Extract description
  const description = extractSection(content, 'Description');

  // Extract success criteria
  const successCriteria = parseSuccessCriteria(content);

  // Extract notes
  const notes = extractSection(content, 'Notes');

  // Extract execution log
  const executionLog = parseExecutionLog(content);

  return {
    filename,
    filepath,
    folder,
    title,
    metadata,
    description,
    successCriteria,
    notes,
    executionLog,
    rawContent: content,
  };
}

function parseMetadata(content: string): WorkItemMetadata | null {
  const metadataMatch = content.match(/## Metadata\n([\s\S]*?)(?=\n##|$)/);
  if (!metadataMatch) return null;

  const metadataText = metadataMatch[1];

  const getValue = (key: string): string => {
    const match = metadataText.match(new RegExp(`- ${key}:\\s*(.*)`, 'i'));
    return match ? match[1].trim() : '';
  };

  const importantValue = getValue('important');

  return {
    id: getValue('id') || 'unknown',
    project: getValue('project') || 'unknown',
    created: getValue('created') || new Date().toISOString().split('T')[0],
    status: normalizeStatus(getValue('status')),
    dueDate: getValue('due') || getValue('due-date') || undefined,
    important: importantValue === 'true' || importantValue === 'yes',
    assignedSession: getValue('assigned-session') || undefined,
  };
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`## ${sectionName}\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

function parseSuccessCriteria(content: string): SuccessCriterion[] {
  const section = extractSection(content, 'Success Criteria');
  const lines = section.split('\n').filter(l => l.trim().startsWith('- ['));

  return lines.map(line => {
    const completed = line.includes('[x]') || line.includes('[X]');
    const text = line.replace(/- \[[ xX]\]\s*/, '').trim();
    return { text, completed };
  });
}

function parseExecutionLog(content: string): string[] {
  const section = extractSection(content, 'Execution Log');
  return section
    .split('\n')
    .filter(l => l.trim().startsWith('-'))
    .map(l => l.replace(/^-\s*/, '').trim());
}

export async function moveWorkItem(
  filename: string,
  from: 'backlog' | 'active' | 'done',
  to: 'backlog' | 'active' | 'done'
): Promise<boolean> {
  const sourcePath = path.join(WORK_DIR, from, filename);
  const destPath = path.join(WORK_DIR, to, filename);

  try {
    await fs.rename(sourcePath, destPath);
    return true;
  } catch {
    return false;
  }
}

export async function updateWorkItemContent(
  folder: 'backlog' | 'active' | 'done',
  filename: string,
  content: string
): Promise<boolean> {
  const filepath = path.join(WORK_DIR, folder, filename);

  try {
    await fs.writeFile(filepath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function createWorkItem(
  data: {
    title: string;
    project: string;
    description: string;
    successCriteria: string[];
    dueDate?: string;
    important?: boolean;
    plan?: string[];
    verification?: string;
    context?: string;
    files?: string[];
    notes?: string;
  }
): Promise<string | null> {
  const date = new Date().toISOString().split('T')[0];
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const filename = `${date}-${slug}.md`;
  const id = `${slug}-${Math.floor(Math.random() * 900) + 100}`;

  const planSection = data.plan && data.plan.length > 0
    ? `\n## Plan\n\n${data.plan.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n`
    : '';

  const verificationSection = data.verification
    ? `\n## Verification\n\n${data.verification}\n`
    : '';

  const contextSection = data.context
    ? `\n## Context\n\n${data.context}\n`
    : '';

  const filesSection = data.files && data.files.length > 0
    ? `\n## Files\n\n${data.files.map(f => `- ${f}`).join('\n')}\n`
    : '';

  const notesSection = data.notes
    ? `\n## Notes\n\n${data.notes}\n`
    : '';

  const content = `# ${data.title}

## Metadata
- id: ${id}
- project: ${data.project}
- created: ${date}
- status: new${data.dueDate ? `\n- due: ${data.dueDate}` : ''}${data.important ? `\n- important: true` : ''}
- assigned-session:

## Description

${data.description}

## Success Criteria

${data.successCriteria.map(c => `- [ ] ${c}`).join('\n')}
${planSection}${verificationSection}${contextSection}${filesSection}${notesSection}
## Execution Log

- ${new Date().toISOString()} Work item created
`;

  const filepath = path.join(WORK_DIR, 'backlog', filename);

  try {
    await fs.writeFile(filepath, content, 'utf-8');
    return filename;
  } catch {
    return null;
  }
}

export function getStatusColor(status: WorkItemStatus): string {
  switch (status) {
    case 'new': return 'bg-zinc-500';
    case 'defined': return 'bg-blue-500';
    case 'planned': return 'bg-indigo-500';
    case 'executing': return 'bg-purple-500';
    case 'review': return 'bg-yellow-500';
    case 'done': return 'bg-green-500';
    case 'blocked': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export function getProjectPath(projectIdentifier: string): string | null {
  return getProjectPathFromIdentifier(projectIdentifier);
}

export async function deleteWorkItem(
  folder: 'backlog' | 'active' | 'done',
  filename: string
): Promise<boolean> {
  const filepath = path.join(WORK_DIR, folder, filename);

  try {
    await fs.unlink(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function cleanupWorkItemResources(workItem: WorkItem): Promise<void> {
  const projectPath = getProjectPath(workItem.metadata.project);
  if (!projectPath) {
    return;
  }

  const workItemId = workItem.metadata.id;

  // Delete .flywheel-prompt-* files matching the work item id
  try {
    const files = await fs.readdir(projectPath);
    const promptFiles = files.filter(f =>
      f.startsWith('.flywheel-prompt-') &&
      f.includes(workItemId) &&
      f.endsWith('.txt')
    );
    for (const file of promptFiles) {
      try {
        await fs.unlink(path.join(projectPath, file));
      } catch {
        // Ignore errors for individual files
      }
    }
  } catch {
    // Ignore directory read errors
  }

  // Kill tmux session if running
  const sessionName = `flywheel-${workItemId}`;
  await killTmuxSession(sessionName);

  // Delete PLAN.md from project directory if it exists
  const planPath = path.join(projectPath, 'PLAN.md');
  try {
    await fs.unlink(planPath);
  } catch {
    // PLAN.md doesn't exist - that's fine
  }
}
