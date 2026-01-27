'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { WorkItem, WorkItemStatus, WorkflowType } from '@/lib/work-items';
import { getNextStatusLabel } from '@/lib/prompts';

const AREAS = [
  { value: 'bellwether', label: 'Bellwether', color: '#3b82f6' },
  { value: 'sophia', label: 'Sophia', color: '#f97316' },
  { value: 'personal', label: 'Personal', color: '#22c55e' },
] as const;

type Area = typeof AREAS[number]['value'];

const WORKFLOW_STEPS: { status: WorkItemStatus; label: string; num: string }[] = [
  { status: 'new', label: 'New', num: '1' },
  { status: 'defined', label: 'Defined', num: '2' },
  { status: 'planned', label: 'Planned', num: '3' },
  { status: 'review', label: 'Review', num: '4' },
  { status: 'done', label: 'Done', num: '✓' },
];


interface FormData {
  title: string;
  id: string;
  area: Area;
  project: string;
  created: string;
  status: WorkItemStatus;
  dueDate: string;
  important: boolean;
  unattended: boolean;
  assignedSession: string;
  workflow?: WorkflowType;
  tmuxSession?: string;
  description: string;
  successCriteria: { text: string; completed: boolean }[];
  plan: string[];
  verification: string;
  context: string;
  files: string[];
  notes: string;
  executionLog: string[];
}

function parseAreaAndProject(fullProject: string): { area: Area; project: string } {
  const parts = fullProject.split('/');
  const areaKey = parts[0] as Area;
  const isValidArea = AREAS.some(a => a.value === areaKey);
  return {
    area: isValidArea ? areaKey : 'personal',
    project: parts.slice(1).join('/') || parts[0],
  };
}

function serializeToMarkdown(data: FormData): string {
  const lines: string[] = [];
  const fullProject = `${data.area}/${data.project}`;

  lines.push(`# ${data.title}`);
  lines.push('');
  lines.push('## Metadata');
  lines.push(`- id: ${data.id}`);
  lines.push(`- project: ${fullProject}`);
  lines.push(`- created: ${data.created}`);
  lines.push(`- status: ${data.status}`);
  if (data.dueDate) lines.push(`- due: ${data.dueDate}`);
  if (data.important) lines.push(`- important: true`);
  if (data.unattended) lines.push(`- unattended: true`);
  if (data.workflow) lines.push(`- workflow: ${data.workflow}`);
  if (data.tmuxSession) lines.push(`- tmux-session: ${data.tmuxSession}`);
  lines.push(`- assigned-session: ${data.assignedSession}`);
  lines.push('');
  lines.push('## Description');
  lines.push('');
  lines.push(data.description);
  lines.push('');
  lines.push('## Success Criteria');
  lines.push('');
  for (const criterion of data.successCriteria) {
    if (criterion.text.trim()) {
      const checkbox = criterion.completed ? '[x]' : '[ ]';
      lines.push(`- ${checkbox} ${criterion.text}`);
    }
  }
  lines.push('');

  if (data.plan.some(p => p.trim())) {
    lines.push('## Plan');
    lines.push('');
    for (const step of data.plan) {
      if (step.trim()) {
        lines.push(`1. ${step}`);
      }
    }
    lines.push('');
  }

  if (data.verification.trim()) {
    lines.push('## Verification');
    lines.push('');
    lines.push(data.verification);
    lines.push('');
  }

  if (data.context.trim()) {
    lines.push('## Context');
    lines.push('');
    lines.push(data.context);
    lines.push('');
  }

  if (data.files.some(f => f.trim())) {
    lines.push('## Files');
    lines.push('');
    for (const file of data.files) {
      if (file.trim()) {
        lines.push(`- ${file}`);
      }
    }
    lines.push('');
  }

  if (data.notes.trim()) {
    lines.push('## Notes');
    lines.push('');
    lines.push(data.notes);
    lines.push('');
  }

  lines.push('## Execution Log');
  lines.push('');
  for (const entry of data.executionLog) {
    lines.push(`- ${entry}`);
  }
  lines.push('');

  return lines.join('\n');
}

// Auto-resize textarea hook
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return ref;
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className,
  minRows = 2,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
}) {
  const ref = useAutoResize(value);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
      rows={minRows}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}

export function WorkItemDetail({ item }: { item: WorkItem }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMenuOpen, setLaunchMenuOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const launchMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (launchMenuRef.current && !launchMenuRef.current.contains(event.target as Node)) {
        setLaunchMenuOpen(false);
        setSelectedWorkflow(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for transitioning state and status changes
  useEffect(() => {
    const checkTransitioning = async () => {
      try {
        const res = await fetch('/api/transitioning');
        if (res.ok) {
          const data = await res.json();
          const transitioning = data.transitioning as { id: string; previousStatus: string }[];
          const itemTransition = transitioning.find(t => t.id === item.metadata.id);

          if (itemTransition) {
            setIsTransitioning(true);

            // Check if status changed - if so, clear transitioning
            const workItemsRes = await fetch('/api/work-items');
            if (workItemsRes.ok) {
              const workItemsData = await workItemsRes.json();
              const allItems = [...(workItemsData.backlog || []), ...(workItemsData.active || [])];
              const currentItem = allItems.find((i: WorkItem) => i.metadata.id === item.metadata.id);

              if (currentItem && currentItem.metadata.status !== itemTransition.previousStatus) {
                // Status changed, clear transitioning and refresh
                await fetch(`/api/transitioning?id=${encodeURIComponent(item.metadata.id)}`, {
                  method: 'DELETE',
                });
                setIsTransitioning(false);
                router.refresh();
              }
            }
          } else {
            setIsTransitioning(false);
          }
        }
      } catch {
        // Ignore errors
      }
    };

    // Check immediately
    checkTransitioning();

    // Then poll every 5 seconds
    const interval = setInterval(checkTransitioning, 5000);
    return () => clearInterval(interval);
  }, [item.metadata.id, router]);

  const { area: initialArea, project: initialProject } = parseAreaAndProject(item.metadata.project);

  // Parse additional sections from raw content
  const extractSection = (content: string, sectionName: string): string => {
    const regex = new RegExp(`## ${sectionName}\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  };

  const extractListItems = (content: string, sectionName: string): string[] => {
    const section = extractSection(content, sectionName);
    return section
      .split('\n')
      .filter(l => l.trim().match(/^[-\d.]/))
      .map(l => l.replace(/^[-\d.]\s*/, '').trim())
      .filter(Boolean);
  };

  const [formData, setFormData] = useState<FormData>({
    title: item.title,
    id: item.metadata.id,
    area: initialArea,
    project: initialProject,
    created: item.metadata.created,
    status: item.metadata.status,
    dueDate: item.metadata.dueDate || '',
    important: item.metadata.important || false,
    unattended: item.metadata.unattended || false,
    assignedSession: item.metadata.assignedSession || '',
    workflow: item.metadata.workflow,
    tmuxSession: item.metadata.tmuxSession,
    description: item.description,
    successCriteria: item.successCriteria.length > 0
      ? item.successCriteria
      : [{ text: '', completed: false }],
    plan: extractListItems(item.rawContent, 'Plan').length > 0
      ? extractListItems(item.rawContent, 'Plan')
      : [''],
    verification: extractSection(item.rawContent, 'Verification'),
    context: extractSection(item.rawContent, 'Context'),
    files: extractListItems(item.rawContent, 'Files').length > 0
      ? extractListItems(item.rawContent, 'Files')
      : [],
    notes: item.notes,
    executionLog: item.executionLog,
  });

  const currentArea = AREAS.find(a => a.value === formData.area);
  const accent = currentArea?.color || '#6b7280';
  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.status === formData.status);
  const isBlocked = formData.status === 'blocked';

  const handleSave = async () => {
    setSaving(true);
    try {
      const content = serializeToMarkdown(formData);
      const response = await fetch(
        `/api/work-items/${item.folder}/${encodeURIComponent(item.filename)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        router.refresh();
        router.push('/');
      } else {
        alert('Failed to save changes');
      }
    } catch {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = (status: WorkItemStatus) => {
    setFormData({ ...formData, status });
  };

  const handleOpenLaunchMenu = () => {
    setLaunchMenuOpen(true);
  };

  const handleSelectWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    // Launch immediately after selecting workflow - no session selection needed
    handleLaunchClaude(workflow);
  };

  const handleLaunchClaude = async (workflowOverride?: WorkflowType) => {
    const workflowToUse = workflowOverride || selectedWorkflow || formData.workflow;
    setLaunching(true);
    setLaunchMenuOpen(false);
    try {
      const res = await fetch('/api/launch-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: item.folder,
          filename: item.filename,
          workflow: workflowToUse,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to launch Claude');
      } else {
        // Mark item as transitioning
        try {
          await fetch('/api/transitioning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.metadata.id, previousStatus: formData.status }),
          });
          setIsTransitioning(true);
        } catch {
          // Non-critical, ignore errors
        }
      }
    } catch {
      alert('Failed to launch Claude');
    } finally {
      setLaunching(false);
      setSelectedWorkflow(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/work-items/${item.folder}/${encodeURIComponent(item.filename)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        alert(data.error || 'Failed to delete work item');
      }
    } catch {
      alert('Failed to delete work item');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const updateCriterion = (index: number, field: 'text' | 'completed', value: string | boolean) => {
    const newCriteria = [...formData.successCriteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setFormData({ ...formData, successCriteria: newCriteria });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      successCriteria: [...formData.successCriteria, { text: '', completed: false }],
    });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      successCriteria: formData.successCriteria.filter((_, i) => i !== index),
    });
  };

  const updatePlanStep = (index: number, value: string) => {
    const newPlan = [...formData.plan];
    newPlan[index] = value;
    setFormData({ ...formData, plan: newPlan });
  };

  const addPlanStep = () => {
    setFormData({ ...formData, plan: [...formData.plan, ''] });
  };

  const removePlanStep = (index: number) => {
    setFormData({ ...formData, plan: formData.plan.filter((_, i) => i !== index) });
  };

  const updateFile = (index: number, value: string) => {
    const newFiles = [...formData.files];
    newFiles[index] = value;
    setFormData({ ...formData, files: newFiles });
  };

  const addFile = () => {
    setFormData({ ...formData, files: [...formData.files, ''] });
  };

  const removeFile = (index: number) => {
    setFormData({ ...formData, files: formData.files.filter((_, i) => i !== index) });
  };

  const addLogEntry = () => {
    const timestamp = new Date().toISOString();
    setFormData({
      ...formData,
      executionLog: [...formData.executionLog, `${timestamp} `],
    });
  };

  const updateLogEntry = (index: number, value: string) => {
    const newLog = [...formData.executionLog];
    newLog[index] = value;
    setFormData({ ...formData, executionLog: newLog });
  };

  const removeLogEntry = (index: number) => {
    setFormData({
      ...formData,
      executionLog: formData.executionLog.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/" className="hover:text-zinc-200 transition-colors">Board</Link>
        <span>/</span>
        <span style={{ color: accent }}>{formData.area}/{formData.project}</span>
      </div>

      <div className="space-y-8">
        {/* Title + Save/Cancel */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className={`flex-1 text-2xl font-bold bg-transparent border-none outline-none ${formData.important ? 'text-red-400 placeholder-red-400/50' : 'text-zinc-100 placeholder-zinc-600'}`}
            placeholder="Work item title"
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-medium text-sm hover:bg-white transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-medium text-sm hover:border-zinc-700 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>

        {/* Status Stepper */}
        <div
          className={`p-4 bg-zinc-900 rounded border border-zinc-800 flex justify-center ${isTransitioning ? 'transitioning-card' : ''}`}
          style={{ ['--transitioning-accent' as string]: accent }}
        >
          <div className="flex items-start">
            {WORKFLOW_STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const showActionButton = isCurrent && formData.status !== 'done';

              return (
                <div key={step.status} className="flex items-start">
                  {/* Step circle and label */}
                  <button
                    type="button"
                    onClick={() => setStatus(step.status)}
                    className="flex flex-col items-center gap-1.5 min-w-[60px]"
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                        ${isBlocked && isCurrent
                          ? 'bg-red-500 text-white'
                          : isCurrent
                            ? 'bg-zinc-100 text-zinc-900'
                            : isComplete
                              ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-400'
                        }
                      `}
                    >
                      {step.num}
                    </div>
                    <span className={`text-sm ${isCurrent ? 'text-zinc-200' : 'text-zinc-400'}`}>
                      {step.label}
                    </span>
                  </button>

                  {/* Connector or Action Button */}
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div className="flex items-center h-10">
                      {showActionButton ? (
                        /* Action button between current and next */
                        <div className="relative flex justify-center" ref={launchMenuRef}>
                          <button
                            onClick={() => {
                              if (launchMenuOpen) {
                                setLaunchMenuOpen(false);
                                setSelectedWorkflow(null);
                              } else if (formData.workflow || formData.status !== 'new') {
                                // Workflow already set or not a new item - launch directly
                                handleLaunchClaude();
                              } else {
                                // New item without workflow - show workflow selection menu
                                handleOpenLaunchMenu();
                              }
                            }}
                            disabled={launching}
                            className="flex items-center justify-center w-10 h-10 bg-[#D97757] text-white rounded-full hover:bg-[#c56a4d] transition-colors disabled:opacity-50"
                            title={getNextStatusLabel(formData.status)}
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>

                          {launchMenuOpen && (
                            <div className="absolute left-0 mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                              <div className="px-3 py-2 text-[14px] uppercase tracking-wider text-zinc-400 border-b border-zinc-700">
                                {getNextStatusLabel(formData.status)}
                              </div>

                              <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700/50">
                                Choose workflow type:
                              </div>
                              <button
                                onClick={() => handleSelectWorkflow('main')}
                                disabled={launching}
                                className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors disabled:opacity-50"
                              >
                                <div className="text-sm text-zinc-300">Main Branch</div>
                                <div className="text-xs text-zinc-400">Work directly on main, commit & sync</div>
                              </button>
                              <button
                                onClick={() => handleSelectWorkflow('worktree')}
                                disabled={launching}
                                className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors border-t border-zinc-700/50 disabled:opacity-50"
                              >
                                <div className="text-sm text-zinc-300">New Worktree</div>
                                <div className="text-xs text-zinc-400">Isolated branch, creates PR on ship</div>
                              </button>

                              <div className="border-t border-zinc-700">
                                <button
                                  onClick={() => {
                                    setLaunchMenuOpen(false);
                                    setSelectedWorkflow(null);
                                    setStatus(isBlocked ? 'new' : 'blocked');
                                  }}
                                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                    isBlocked
                                      ? 'text-green-400 hover:bg-zinc-700'
                                      : 'text-red-400 hover:bg-zinc-700'
                                  }`}
                                >
                                  {isBlocked ? 'Unblock' : 'Mark as Blocked'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular connector line */
                        <div
                          className={`w-8 h-0.5 mx-2 ${
                            index < currentStepIndex ? 'bg-zinc-600' : 'bg-zinc-800'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5 bg-zinc-900 rounded border border-zinc-800">
          <div>
            <label className="block text-[14px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Area
            </label>
            <select
              value={formData.area}
              onChange={e => setFormData({ ...formData, area: e.target.value as Area })}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              {AREAS.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Project
            </label>
            <input
              type="text"
              value={formData.project}
              onChange={e => setFormData({ ...formData, project: e.target.value })}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
              placeholder="ProjectName"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.important}
                onChange={e => setFormData({ ...formData, important: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500"
              />
              <span className={`text-sm ${formData.important ? 'text-red-400' : 'text-zinc-400'}`}>
                Important
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.unattended}
                onChange={e => setFormData({ ...formData, unattended: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
              />
              <span className={`text-sm ${formData.unattended ? 'text-blue-400' : 'text-zinc-400'}`}>
                Run Unattended
              </span>
            </label>
          </div>
        </div>

        {/* Workflow Info (if set) */}
        {(formData.workflow || formData.tmuxSession) && (
          <div className="flex items-center gap-4 px-4 py-3 bg-zinc-900/50 rounded border border-zinc-800/50 text-sm">
            {formData.workflow && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Workflow:</span>
                <span className={`px-2 py-0.5 rounded text-xs uppercase ${
                  formData.workflow === 'main'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {formData.workflow}
                </span>
              </div>
            )}
            {formData.tmuxSession && (
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Session:</span>
                <code className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono text-xs">
                  {formData.tmuxSession}
                </code>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Description
          </label>
          <AutoResizeTextarea
            value={formData.description}
            onChange={v => setFormData({ ...formData, description: v })}
            placeholder="What needs to be done and why? Include background, constraints, and acceptance criteria."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            minRows={3}
          />
        </div>

        {/* Success Criteria */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Success Criteria
            <span className="ml-2 text-zinc-400 normal-case">
              ({formData.successCriteria.filter(c => c.completed && c.text.trim()).length}/{formData.successCriteria.filter(c => c.text.trim()).length})
            </span>
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">Specific, verifiable outcomes that define when this work is complete.</p>
          <div className="space-y-2">
            {formData.successCriteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={criterion.completed}
                  onChange={e => updateCriterion(index, 'completed', e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={criterion.text}
                  onChange={e => updateCriterion(index, 'text', e.target.value)}
                  className={`flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600 ${criterion.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
                  placeholder="Success criterion"
                />
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="px-2 py-2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCriterion}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              + Add criterion
            </button>
          </div>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Plan
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">Ordered steps to accomplish this work. Claude Code will follow these.</p>
          <div className="space-y-2">
            {formData.plan.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-zinc-400 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updatePlanStep(index, e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Step description"
                />
                <button
                  type="button"
                  onClick={() => removePlanStep(index)}
                  className="px-2 py-2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlanStep}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              + Add step
            </button>
          </div>
        </div>

        {/* Verification */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Verification
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">How to verify each success criterion is met. Commands, tests, manual checks.</p>
          <AutoResizeTextarea
            value={formData.verification}
            onChange={v => setFormData({ ...formData, verification: v })}
            placeholder="Run `npm test` to verify tests pass&#10;Check /api/health returns 200&#10;Manually verify the UI renders correctly"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
            minRows={3}
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Context
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">Background info, dependencies, related issues, links, architectural decisions.</p>
          <AutoResizeTextarea
            value={formData.context}
            onChange={v => setFormData({ ...formData, context: v })}
            placeholder="Related to issue #123&#10;Depends on the auth refactor being complete&#10;See design doc: https://..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Files */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Files
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">Key files to modify or review. Helps Claude Code focus.</p>
          <div className="space-y-2">
            {formData.files.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={file}
                  onChange={e => updateFile(index, e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="src/components/Button.tsx"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="px-2 py-2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFile}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              + Add file
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Notes
          </label>
          <AutoResizeTextarea
            value={formData.notes}
            onChange={v => setFormData({ ...formData, notes: v })}
            placeholder="Additional thoughts, considerations, open questions..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Execution Log */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Execution Log
          </label>
          <p className="text-[15px] text-zinc-400 mb-2">Timestamped record of work done. Claude Code appends entries here.</p>
          <div className="space-y-2">
            {formData.executionLog.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={entry}
                  onChange={e => updateLogEntry(index, e.target.value)}
                  className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-400 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => removeLogEntry(index)}
                  className="px-2 py-2 text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLogEntry}
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              + Add log entry
            </button>
          </div>
        </div>

        {/* Delete */}
        {formData.status !== 'done' && (
          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleting}
              className="px-4 py-2 bg-red-900/30 border border-red-800/50 text-red-400 rounded font-medium text-sm hover:bg-red-900/50 hover:border-red-700 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}

      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Delete Work Item</h3>
            <p className="text-zinc-400 mb-4">
              Are you sure you want to delete &quot;{formData.title}&quot;? This will also remove any associated prompt files and kill any running tmux sessions.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleting}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-medium text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded font-medium text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
