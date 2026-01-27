'use client';

import { useState, useRef, useEffect } from 'react';
import { getNextStatusLabel } from '@/lib/prompts';
import type { WorkItemStatus, WorkflowType } from '@/lib/work-items';

interface LaunchButtonProps {
  folder: string;
  filename: string;
  status: WorkItemStatus;
  existingWorkflow?: WorkflowType;
  itemId?: string;
  onLaunch?: (itemId: string) => void;
  compact?: boolean;
}

export function LaunchButton({ folder, filename, status, existingWorkflow, itemId, onLaunch, compact = false }: LaunchButtonProps) {
  const [launching, setLaunching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; right?: number; left?: number }>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setSelectedWorkflow(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenMenu = () => {
    // Calculate fixed position for dropdown to escape overflow containers
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height of dropdown menu
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight;

      if (openUpward) {
        setMenuPosition({
          bottom: window.innerHeight - rect.top + 4,
          right: window.innerWidth - rect.right,
        });
      } else {
        setMenuPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    }

    setMenuOpen(true);
  };

  const handleSelectWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    // Launch immediately after selecting workflow - no session selection needed
    handleLaunch(workflow);
  };

  const handleLaunch = async (workflowOverride?: WorkflowType) => {
    const workflowToUse = workflowOverride || selectedWorkflow || existingWorkflow;
    setLaunching(true);
    setMenuOpen(false);
    try {
      const res = await fetch('/api/launch-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder,
          filename,
          workflow: workflowToUse,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to launch Claude');
      } else {
        // Mark item as transitioning and notify parent
        if (itemId) {
          try {
            await fetch('/api/transitioning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: itemId, previousStatus: status }),
            });
          } catch {
            // Non-critical, ignore errors
          }
          onLaunch?.(itemId);
        }
      }
    } catch {
      alert('Failed to launch Claude');
    } finally {
      setLaunching(false);
      setSelectedWorkflow(null);
    }
  };

  if (status === 'done') return null;

  const actionLabel = getNextStatusLabel(status);

  return (
    <div
      className="relative"
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (menuOpen) {
            setMenuOpen(false);
            setSelectedWorkflow(null);
          } else if (existingWorkflow || status !== 'new') {
            // Workflow already set or not a new item - launch directly
            handleLaunch();
          } else {
            // New item without workflow - show workflow selection menu
            handleOpenMenu();
          }
        }}
        disabled={launching}
        className={`
          flex items-center justify-center bg-[#D97757] text-white
          hover:bg-[#c56a4d] transition-colors disabled:opacity-50 rounded-full
          ${compact ? 'w-9 h-9' : 'w-10 h-10'}
        `}
        title={actionLabel}
      >
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {menuOpen && (
        <div
          className="fixed w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden"
          style={menuPosition}
        >
          <div className="px-3 py-2 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-700">
            {actionLabel}
          </div>

          <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-700/50">
            Choose workflow type:
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectWorkflow('main'); }}
            disabled={launching}
            className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <div className="text-sm text-zinc-300">Main Branch</div>
            <div className="text-xs text-zinc-400">Work directly on main, commit & sync</div>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleSelectWorkflow('worktree'); }}
            disabled={launching}
            className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors border-t border-zinc-700/50 disabled:opacity-50"
          >
            <div className="text-sm text-zinc-300">New Worktree</div>
            <div className="text-xs text-zinc-400">Isolated branch, creates PR on ship</div>
          </button>
        </div>
      )}
    </div>
  );
}
