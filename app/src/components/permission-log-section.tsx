'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PermissionLogEntry } from '@/lib/permission-log-helpers';

interface PermissionLogSectionProps {
  entries: PermissionLogEntry[];
  loading: boolean;
  onAddRule: (entry: PermissionLogEntry) => void;
  onDismiss: (entryId: number) => Promise<void>;
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

function getCommandPreview(entry: PermissionLogEntry): string {
  const { tool, input } = entry;

  switch (tool) {
    case 'Bash': {
      const command = (input.command as string) || '';
      // Truncate long commands
      return command.length > 80 ? command.slice(0, 77) + '...' : command;
    }
    case 'Read':
    case 'Edit':
    case 'Write': {
      const filePath = (input.file_path as string) || '';
      // Show just the filename or last part of path
      const parts = filePath.split('/');
      if (parts.length > 3) {
        return '.../' + parts.slice(-2).join('/');
      }
      return filePath;
    }
    case 'Skill': {
      return (input.skill as string) || '';
    }
    default:
      return JSON.stringify(input).slice(0, 50);
  }
}

export function PermissionLogSection({
  entries,
  loading,
  onAddRule,
  onDismiss,
}: PermissionLogSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<Set<number>>(new Set());

  const handleDismiss = async (entryId: number) => {
    setDismissingIds((prev) => new Set([...prev, entryId]));
    try {
      await onDismiss(entryId);
    } finally {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  return (
    <div className="mb-6 border border-zinc-800 rounded-lg bg-zinc-900/50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          )}
          <span className="font-medium text-zinc-100">Permission Requests</span>
          <span className="text-sm text-zinc-500">
            ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
          </span>
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              <span className="ml-2 text-zinc-500">Loading...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No permission requests logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 px-2 text-zinc-400 font-medium">
                      Time
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-400 font-medium">
                      Tool
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-400 font-medium">
                      Command/Pattern
                    </th>
                    <th className="text-left py-2 px-2 text-zinc-400 font-medium">
                      Project
                    </th>
                    <th className="text-right py-2 px-2 text-zinc-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
                    >
                      <td className="py-2 px-2 text-zinc-400 whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/40 text-blue-300">
                          {entry.tool}
                        </span>
                      </td>
                      <td
                        className="py-2 px-2 font-mono text-zinc-300 max-w-md truncate"
                        title={
                          entry.tool === 'Bash'
                            ? (entry.input.command as string)
                            : undefined
                        }
                      >
                        {getCommandPreview(entry)}
                      </td>
                      <td className="py-2 px-2 text-zinc-400">
                        {entry.project || entry.base_repo_path || '-'}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAddRule(entry)}
                          className="h-7 px-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add Rule
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(entry.id)}
                          disabled={dismissingIds.has(entry.id)}
                          className="h-7 px-2 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 ml-1"
                        >
                          {dismissingIds.has(entry.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
