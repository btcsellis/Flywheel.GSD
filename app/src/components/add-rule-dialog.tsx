'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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

// Category options for the dropdown (matching page.tsx categories)
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

// Scope options
const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global (~/.claude)' },
  { value: 'area:bellwether', label: 'Bellwether Area' },
  { value: 'area:sophia', label: 'Sophia Area' },
  { value: 'area:personal', label: 'Personal Area' },
] as const;

export interface AddRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRules: string[];
  onRuleAdded: () => void;
  editingRule?: {
    tool: string;
    pattern: string | null;
    category: string;
    scope: string;
  } | null;
}

export function AddRuleDialog({
  open,
  onOpenChange,
  existingRules,
  onRuleAdded,
  editingRule,
}: AddRuleDialogProps) {
  const [tool, setTool] = useState('');
  const [pattern, setPattern] = useState('');
  const [category, setCategory] = useState('Other');
  const [scope, setScope] = useState('global');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editingRule;

  // Reset form when dialog opens/closes or editingRule changes
  useEffect(() => {
    if (open) {
      if (editingRule) {
        setTool(editingRule.tool);
        setPattern(editingRule.pattern || '');
        setCategory(editingRule.category);
        setScope(editingRule.scope);
      } else {
        setTool('');
        setPattern('');
        setCategory('Other');
        setScope('global');
      }
      setError(null);
    }
  }, [open, editingRule]);

  const buildRuleString = () => {
    if (pattern.trim()) {
      return `${tool.trim()}(${pattern.trim()})`;
    }
    return tool.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTool = tool.trim();
    if (!trimmedTool) {
      setError('Tool name is required');
      return;
    }

    const ruleString = buildRuleString();

    // Check for duplicates (skip if editing the same rule)
    if (!isEditMode && existingRules.includes(ruleString)) {
      setError('This rule already exists at the selected scope');
      return;
    }

    setSaving(true);

    try {
      // If editing, delete old rule first
      if (isEditMode && editingRule) {
        const oldRule = editingRule.pattern
          ? `${editingRule.tool}(${editingRule.pattern})`
          : editingRule.tool;

        await fetch('/api/permissions/rule', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rule: oldRule,
            scope: editingRule.scope,
          }),
        });
      }

      // Create the new rule
      const response = await fetch('/api/permissions/rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: trimmedTool,
          pattern: pattern.trim() || null,
          category,
          scope,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save rule');
      }

      onRuleAdded();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {isEditMode ? 'Edit Rule' : 'Add New Rule'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isEditMode
              ? 'Modify the permission rule settings.'
              : 'Create a new permission rule for Claude Code.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-xs text-zinc-500">
              Leave empty for bare tool permission (e.g., &quot;Read&quot;)
            </p>
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
            <Select value={scope} onValueChange={setScope} disabled={isEditMode}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {SCOPE_OPTIONS.map((opt) => (
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
            {isEditMode && (
              <p className="text-xs text-zinc-500">Scope cannot be changed when editing</p>
            )}
          </div>

          {/* Preview */}
          <div className="p-3 bg-zinc-800/50 rounded-md border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-1">Rule Preview:</p>
            <code className="text-sm text-zinc-200 font-mono">
              {tool.trim() ? buildRuleString() : '(enter tool name)'}
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
                  Saving...
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Add Rule'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
