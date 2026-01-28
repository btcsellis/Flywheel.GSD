'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type PermissionLogEntry,
  deriveRuleFromLogEntry,
  deriveDefaultScope,
  buildRuleString,
} from '@/lib/permission-log-helpers';

const CATEGORY_OPTIONS = [
  { value: 'File Operations', label: 'File Operations' },
  { value: 'Git Commands', label: 'Git Commands' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Build & Lint', label: 'Build & Lint' },
  { value: 'Package Management', label: 'Package Management' },
  { value: 'GitHub CLI', label: 'GitHub CLI' },
  { value: 'Flywheel Skills', label: 'Flywheel Skills' },
  { value: 'Other', label: 'Other' },
] as const;

interface ScopeOption {
  value: string;
  label: string;
}

export interface AddRuleFromLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: PermissionLogEntry | null;
  existingRules: string[];
  onRuleAdded: (entryId: number) => void;
}

export function AddRuleFromLogDialog({
  open,
  onOpenChange,
  entry,
  existingRules,
  onRuleAdded,
}: AddRuleFromLogDialogProps) {
  const [tool, setTool] = useState('');
  const [pattern, setPattern] = useState('');
  const [category, setCategory] = useState('Other');
  const [scope, setScope] = useState('global');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeOptions, setScopeOptions] = useState<ScopeOption[]>([]);
  const [suggestedPattern, setSuggestedPattern] = useState<string | null>(null);

  // Derive values from entry when dialog opens
  useEffect(() => {
    if (open && entry) {
      const derived = deriveRuleFromLogEntry(entry);
      const defaultScope = deriveDefaultScope(entry);

      setTool(derived.tool);
      setPattern(derived.pattern || '');
      setSuggestedPattern(derived.pattern);
      setCategory(guessCategory(derived.tool, derived.pattern));
      setScope(defaultScope.scope);
      setError(null);

      // Build scope options based on the entry
      const options: ScopeOption[] = [
        { value: 'global', label: 'Global (~/.claude)' },
        { value: 'area:bellwether', label: 'Bellwether Area' },
        { value: 'area:sophia', label: 'Sophia Area' },
        { value: 'area:personal', label: 'Personal Area' },
      ];

      // Add project-specific option if we detected one
      if (
        defaultScope.scope !== 'global' &&
        !defaultScope.scope.startsWith('area:')
      ) {
        options.unshift({
          value: defaultScope.scope,
          label: defaultScope.label + ' (Project)',
        });
      }

      setScopeOptions(options);
    }
  }, [open, entry]);

  const rulePreview = buildRuleString(tool.trim(), pattern.trim() || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tool.trim()) {
      setError('Tool name is required');
      return;
    }

    if (existingRules.includes(rulePreview)) {
      setError('This rule already exists');
      return;
    }

    setSaving(true);

    try {
      // Create the rule
      const response = await fetch('/api/permissions/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool.trim(),
          pattern: pattern.trim() || null,
          category,
          scope,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create rule');
      }

      // Delete the log entry
      if (entry) {
        await fetch('/api/permissions/log', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [entry.id] }),
        });
      }

      if (entry) {
        onRuleAdded(entry.id);
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const handleUseSuggestion = () => {
    if (suggestedPattern) {
      setPattern(suggestedPattern);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Create Rule from Request
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Create a permission rule based on this logged request.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Original request info */}
          {entry && (
            <div className="p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
              <p className="text-xs text-zinc-500 mb-1">Original Request:</p>
              <code className="text-xs text-zinc-300 font-mono break-all">
                {entry.tool === 'Bash'
                  ? (entry.input.command as string)
                  : entry.tool === 'Skill'
                    ? `Skill: ${entry.input.skill}`
                    : `${entry.tool}: ${entry.input.file_path || JSON.stringify(entry.input)}`}
              </code>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Tool Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              placeholder="e.g., Bash, Read, Edit, Skill"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">
              Pattern <span className="text-zinc-500">(optional)</span>
            </label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g., git commit:*, npm run build:*"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            {suggestedPattern && pattern !== suggestedPattern && (
              <button
                type="button"
                onClick={handleUseSuggestion}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 mt-1"
              >
                <Lightbulb className="h-3 w-3" />
                Suggestion: {suggestedPattern}
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Scope</label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {scopeOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">Rule Preview:</p>
            <code className="text-sm text-zinc-200 font-mono">
              {tool.trim() ? rulePreview : '(enter tool name)'}
            </code>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-md">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !tool.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Rule'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Guess the category based on tool and pattern
 */
function guessCategory(tool: string, pattern: string | null): string {
  if (tool === 'Read' || tool === 'Edit' || tool === 'Write') {
    return 'File Operations';
  }

  if (tool === 'Skill') {
    if (pattern?.startsWith('flywheel')) {
      return 'Flywheel Skills';
    }
    return 'Other';
  }

  if (tool === 'WebFetch' || tool === 'WebSearch') {
    return 'Other';
  }

  if (tool === 'Bash' && pattern) {
    if (pattern.startsWith('git ')) {
      return 'Git Commands';
    }
    if (
      pattern.startsWith('npm test') ||
      pattern.startsWith('npm run test') ||
      pattern.startsWith('pytest') ||
      pattern.startsWith('jest')
    ) {
      return 'Testing';
    }
    if (
      pattern.startsWith('npm run build') ||
      pattern.startsWith('tsc') ||
      pattern.startsWith('npm run lint') ||
      pattern.startsWith('eslint') ||
      pattern.startsWith('prettier')
    ) {
      return 'Build & Lint';
    }
    if (
      pattern.startsWith('npm install') ||
      pattern.startsWith('npm i') ||
      pattern.startsWith('pip install')
    ) {
      return 'Package Management';
    }
    if (pattern.startsWith('gh ')) {
      return 'GitHub CLI';
    }
    if (pattern.startsWith('tmux')) {
      return 'Other';
    }
  }

  return 'Other';
}
