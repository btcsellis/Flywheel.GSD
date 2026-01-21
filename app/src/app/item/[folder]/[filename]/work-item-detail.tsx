'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { WorkItem, WorkItemStatus } from '@/lib/work-items';
import { getNextStatusLabel } from '@/lib/prompts';

const AREAS = [
  { value: 'bellwether', label: 'Bellwether', color: '#3b82f6' },
  { value: 'sophia', label: 'Sophia', color: '#f97316' },
  { value: 'personal', label: 'Personal', color: '#22c55e' },
] as const;

type Area = typeof AREAS[number]['value'];

const WORKFLOW_STEPS: { status: WorkItemStatus; label: string; num: string }[] = [
  { status: 'created', label: 'New', num: '1' },
  { status: 'goals-set', label: 'Defined', num: '2' },
  { status: 'planned', label: 'Planned', num: '3' },
  { status: 'executing', label: 'Executing', num: '4' },
  { status: 'verifying', label: 'Review', num: '5' },
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
  assignedSession: string;
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
    assignedSession: item.metadata.assignedSession || '',
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

  const handleLaunchClaude = async () => {
    setLaunching(true);
    try {
      const res = await fetch('/api/launch-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: item.folder, filename: item.filename }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to launch Claude');
      }
    } catch {
      alert('Failed to launch Claude');
    } finally {
      setLaunching(false);
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
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Board</Link>
        <span>/</span>
        <span style={{ color: accent }}>{formData.area}/{formData.project}</span>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className={`w-full text-2xl font-bold bg-transparent border-none outline-none ${formData.important ? 'text-red-400 placeholder-red-400/50' : 'text-zinc-100 placeholder-zinc-600'}`}
            placeholder="Work item title"
          />
        </div>

        {/* Status Stepper */}
        <div className="p-4 bg-zinc-900 rounded border border-zinc-800">
          <div className="flex items-center justify-between">
            {WORKFLOW_STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.status} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => setStatus(step.status)}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${isBlocked && isCurrent
                        ? 'bg-red-500 text-white'
                        : isCurrent
                          ? 'bg-zinc-100 text-zinc-900 ring-2 ring-zinc-100/50'
                          : isComplete
                            ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-400'
                      }
                    `}
                    title={step.label}
                  >
                    {step.num}
                  </button>
                  {index < WORKFLOW_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 ${
                        index < currentStepIndex ? 'bg-zinc-600' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.status} className="flex-1 text-center">
                <span className="text-[10px] text-zinc-500">{step.label}</span>
              </div>
            ))}
          </div>
          {/* Blocked toggle */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setStatus(isBlocked ? 'created' : 'blocked')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                isBlocked
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-800 text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {isBlocked ? 'Blocked' : 'Mark Blocked'}
            </button>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900 rounded border border-zinc-800">
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
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
            <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
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
            <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-end">
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
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Description
          </label>
          <AutoResizeTextarea
            value={formData.description}
            onChange={v => setFormData({ ...formData, description: v })}
            placeholder="What needs to be done and why? Include background, constraints, and acceptance criteria."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={3}
          />
        </div>

        {/* Success Criteria */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Success Criteria
            <span className="ml-2 text-zinc-600 normal-case">
              ({formData.successCriteria.filter(c => c.completed && c.text.trim()).length}/{formData.successCriteria.filter(c => c.text.trim()).length})
            </span>
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Specific, verifiable outcomes that define when this work is complete.</p>
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
                  className={`flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm focus:outline-none focus:border-zinc-600 ${criterion.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
                  placeholder="Success criterion"
                />
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCriterion}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Add criterion
            </button>
          </div>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Plan
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Ordered steps to accomplish this work. Claude Code will follow these.</p>
          <div className="space-y-2">
            {formData.plan.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updatePlanStep(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Step description"
                />
                <button
                  type="button"
                  onClick={() => removePlanStep(index)}
                  className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPlanStep}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Add step
            </button>
          </div>
        </div>

        {/* Verification */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Verification
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">How to verify each success criterion is met. Commands, tests, manual checks.</p>
          <AutoResizeTextarea
            value={formData.verification}
            onChange={v => setFormData({ ...formData, verification: v })}
            placeholder="Run `npm test` to verify tests pass&#10;Check /api/health returns 200&#10;Manually verify the UI renders correctly"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            minRows={3}
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Context
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Background info, dependencies, related issues, links, architectural decisions.</p>
          <AutoResizeTextarea
            value={formData.context}
            onChange={v => setFormData({ ...formData, context: v })}
            placeholder="Related to issue #123&#10;Depends on the auth refactor being complete&#10;See design doc: https://..."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Files */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Files
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Key files to modify or review. Helps Claude Code focus.</p>
          <div className="space-y-2">
            {formData.files.map((file, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={file}
                  onChange={e => updateFile(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-400 focus:outline-none focus:border-zinc-600"
                  placeholder="src/components/Button.tsx"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addFile}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Add file
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Notes
          </label>
          <AutoResizeTextarea
            value={formData.notes}
            onChange={v => setFormData({ ...formData, notes: v })}
            placeholder="Additional thoughts, considerations, open questions..."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Execution Log */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Execution Log
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Timestamped record of work done. Claude Code appends entries here.</p>
          <div className="space-y-2">
            {formData.executionLog.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={entry}
                  onChange={e => updateLogEntry(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm font-mono text-zinc-500 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => removeLogEntry(index)}
                  className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addLogEntry}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              + Add log entry
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-medium text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {formData.status !== 'done' && (
            <button
              onClick={handleLaunchClaude}
              disabled={launching}
              className="px-4 py-2 bg-purple-600 text-white rounded font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              {launching ? 'Launching...' : `Launch Claude → ${getNextStatusLabel(formData.status)}`}
            </button>
          )}
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-medium text-sm hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
