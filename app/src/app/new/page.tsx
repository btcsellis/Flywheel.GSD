'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AREAS = [
  { value: 'bellwether', label: 'Bellwether', color: '#3b82f6' },
  { value: 'sophia', label: 'Sophia', color: '#f97316' },
  { value: 'personal', label: 'Personal', color: '#22c55e' },
] as const;

type Area = typeof AREAS[number]['value'];

const PROJECTS: Record<Area, string[]> = {
  bellwether: ['BellwetherPlatform'],
  sophia: ['Sophia.Core', 'Sophia.Api'],
  personal: ['flywheel-gsd'],
};

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

export default function NewWorkItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [area, setArea] = useState<Area>('personal');
  const [project, setProject] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [important, setImportant] = useState(false);
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState([{ text: '', completed: false }]);
  const [plan, setPlan] = useState(['']);
  const [verification, setVerification] = useState('');
  const [context, setContext] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const currentArea = AREAS.find(a => a.value === area);
  const accent = currentArea?.color || '#6b7280';
  const projectOptions = PROJECTS[area] || [];

  // Criterion handlers
  const updateCriterion = (index: number, field: 'text' | 'completed', value: string | boolean) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const addCriterion = () => {
    setCriteria([...criteria, { text: '', completed: false }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  // Plan handlers
  const updatePlanStep = (index: number, value: string) => {
    const newPlan = [...plan];
    newPlan[index] = value;
    setPlan(newPlan);
  };

  const addPlanStep = () => {
    setPlan([...plan, '']);
  };

  const removePlanStep = (index: number) => {
    setPlan(plan.filter((_, i) => i !== index));
  };

  // File handlers
  const updateFile = (index: number, value: string) => {
    const newFiles = [...files];
    newFiles[index] = value;
    setFiles(newFiles);
  };

  const addFile = () => {
    setFiles([...files, '']);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalProject = project === 'custom' ? customProject : project;
    const fullProject = `${area}/${finalProject}`;
    const validCriteria = criteria.filter(c => c.text.trim()).map(c => c.text);
    const validPlan = plan.filter(p => p.trim());
    const validFiles = files.filter(f => f.trim());

    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          project: fullProject,
          dueDate: dueDate || undefined,
          important: important || undefined,
          description,
          successCriteria: validCriteria,
          plan: validPlan.length > 0 ? validPlan : undefined,
          verification: verification.trim() || undefined,
          context: context.trim() || undefined,
          files: validFiles.length > 0 ? validFiles : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        router.push('/');
      } else {
        alert('Failed to create work item');
      }
    } catch {
      alert('Failed to create work item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Board</Link>
        <span>/</span>
        <span className="text-zinc-400">New Work Item</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className={`w-full text-2xl font-bold bg-transparent border-none outline-none ${important ? 'text-red-400 placeholder-red-400/50' : 'text-zinc-100 placeholder-zinc-600'}`}
            placeholder="Work item title"
          />
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900 rounded border border-zinc-800">
          <div>
            <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Area
            </label>
            <select
              value={area}
              onChange={e => {
                setArea(e.target.value as Area);
                setProject('');
              }}
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
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="">Select...</option>
              {projectOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">Other...</option>
            </select>
            {project === 'custom' && (
              <input
                type="text"
                value={customProject}
                onChange={e => setCustomProject(e.target.value)}
                placeholder="ProjectName"
                required
                className="mt-2 w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={important}
                onChange={e => setImportant(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500"
              />
              <span className={`text-sm ${important ? 'text-red-400' : 'text-zinc-400'}`}>
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
            value={description}
            onChange={setDescription}
            placeholder="What needs to be done and why? Include background, constraints, and acceptance criteria."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={3}
          />
        </div>

        {/* Success Criteria */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Success Criteria
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Specific, verifiable outcomes that define when this work is complete.</p>
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
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
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    ×
                  </button>
                )}
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
            Plan <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Ordered steps to accomplish this work. Claude Code will follow these.</p>
          <div className="space-y-2">
            {plan.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-zinc-600 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updatePlanStep(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
                  placeholder="Step description"
                />
                {plan.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePlanStep(index)}
                    className="px-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    ×
                  </button>
                )}
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
            Verification <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">How to verify each success criterion is met. Commands, tests, manual checks.</p>
          <AutoResizeTextarea
            value={verification}
            onChange={setVerification}
            placeholder="Run `npm test` to verify tests pass&#10;Check /api/health returns 200&#10;Manually verify the UI renders correctly"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono"
            minRows={3}
          />
        </div>

        {/* Context */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Context <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Background info, dependencies, related issues, links, architectural decisions.</p>
          <AutoResizeTextarea
            value={context}
            onChange={setContext}
            placeholder="Related to issue #123&#10;Depends on the auth refactor being complete&#10;See design doc: https://..."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Files */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Files <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <p className="text-[11px] text-zinc-600 mb-2">Key files to modify or review. Helps Claude Code focus.</p>
          <div className="space-y-2">
            {files.map((file, index) => (
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
            Notes <span className="text-zinc-600 normal-case">(optional)</span>
          </label>
          <AutoResizeTextarea
            value={notes}
            onChange={setNotes}
            placeholder="Additional thoughts, considerations, open questions..."
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            minRows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-zinc-800">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-medium text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Work Item'}
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-medium text-sm hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
