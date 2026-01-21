'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROJECTS = [
  'bellwether/BellwetherPlatform',
  'sophia/Sophia.Core',
  'sophia/Sophia.Api',
  'personal/flywheel-gsd',
];

export default function NewWorkItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [customProject, setCustomProject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [important, setImportant] = useState(false);
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState(['']);
  const [notes, setNotes] = useState('');

  const addCriterion = () => {
    setCriteria([...criteria, '']);
  };

  const updateCriterion = (index: number, value: string) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalProject = project === 'custom' ? customProject : project;
    const validCriteria = criteria.filter(c => c.trim());

    try {
      const response = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          project: finalProject,
          dueDate: dueDate || undefined,
          important: important || undefined,
          description,
          successCriteria: validCriteria,
          notes,
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
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">New Work Item</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Create a new work item for the backlog
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief description of the work"
            required
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        {/* Project & Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Project
            </label>
            <select
              value={project}
              onChange={e => setProject(e.target.value)}
              required
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
            >
              <option value="">Select project...</option>
              {PROJECTS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="custom">Other...</option>
            </select>
            {project === 'custom' && (
              <input
                type="text"
                value={customProject}
                onChange={e => setCustomProject(e.target.value)}
                placeholder="workspace/project"
                required
                className="mt-2 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Due Date <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        </div>

        {/* Important Flag */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={important}
              onChange={e => setImportant(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500 focus:ring-offset-0 focus:ring-offset-zinc-950"
            />
            <span className={`text-sm font-medium ${important ? 'text-red-400' : 'text-zinc-400 group-hover:text-zinc-300'} transition-colors`}>
              Mark as important
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What needs to be done and why?"
            rows={4}
            required
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
          />
        </div>

        {/* Success Criteria */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Success Criteria
          </label>
          <p className="text-xs text-zinc-600 mb-3">
            Specific, verifiable outcomes that define completion
          </p>
          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={criterion}
                  onChange={e => updateCriterion(index, e.target.value)}
                  placeholder={`Criterion ${index + 1}`}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                />
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Notes <span className="text-zinc-600">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Additional context, links, considerations..."
            rows={3}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded font-medium text-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Work Item'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded font-medium text-sm hover:border-zinc-700 hover:text-zinc-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
