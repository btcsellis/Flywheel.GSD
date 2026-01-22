'use client';

import { useState, useRef, useEffect } from 'react';
import { getNextStatusLabel } from '@/lib/prompts';
import type { WorkItemStatus, WorkflowType } from '@/lib/work-items';

interface LaunchButtonProps {
  folder: string;
  filename: string;
  status: WorkItemStatus;
  existingWorkflow?: WorkflowType;
  compact?: boolean;
  fullHeight?: boolean;
}

export function LaunchButton({ folder, filename, status, existingWorkflow, compact = false, fullHeight = false }: LaunchButtonProps) {
  const [launching, setLaunching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<'workflow' | 'session' | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setWorkflowStep(null);
        setSelectedWorkflow(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenMenu = () => {
    setMenuOpen(true);
    // For new items without workflow, show workflow selection first
    // For items that already have a workflow, go straight to session selection
    if (status === 'new' && !existingWorkflow) {
      setWorkflowStep('workflow');
    } else {
      setWorkflowStep('session');
      setSelectedWorkflow(existingWorkflow || null);
    }
  };

  const handleSelectWorkflow = (workflow: WorkflowType) => {
    setSelectedWorkflow(workflow);
    setWorkflowStep('session');
  };

  const handleLaunch = async (reuseSession: boolean) => {
    setLaunching(true);
    setMenuOpen(false);
    setWorkflowStep(null);
    try {
      const res = await fetch('/api/launch-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder,
          filename,
          reuseSession,
          workflow: selectedWorkflow,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to launch Claude');
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (menuOpen) {
            setMenuOpen(false);
            setWorkflowStep(null);
            setSelectedWorkflow(null);
          } else {
            handleOpenMenu();
          }
        }}
        disabled={launching}
        className={`
          flex items-center justify-center bg-[#D97757] text-white
          hover:bg-[#c56a4d] transition-colors disabled:opacity-50
          ${fullHeight ? 'h-full rounded' : 'rounded-full'}
          ${compact ? 'w-7' : 'w-10'} ${!fullHeight && (compact ? 'h-7' : 'h-10')}
        `}
        title={actionLabel}
      >
        <svg className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {menuOpen && (
        <div className={`
          absolute mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden
          ${compact ? 'right-0' : 'left-0'}
        `}>
          <div className="px-3 py-2 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-700">
            {actionLabel}
          </div>

          {workflowStep === 'workflow' && (
            <>
              <div className="px-3 py-2 text-xs text-zinc-500 border-b border-zinc-700/50">
                Choose workflow type:
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectWorkflow('main'); }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors"
              >
                <div className="text-sm text-zinc-300">Main Branch</div>
                <div className="text-xs text-zinc-500">Work directly on main, commit & sync</div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectWorkflow('worktree'); }}
                className="w-full px-3 py-2 text-left hover:bg-zinc-700 transition-colors border-t border-zinc-700/50"
              >
                <div className="text-sm text-zinc-300">New Worktree</div>
                <div className="text-xs text-zinc-500">Isolated branch, creates PR on ship</div>
              </button>
            </>
          )}

          {workflowStep === 'session' && (
            <>
              {selectedWorkflow && (
                <div className="px-3 py-1.5 text-xs text-zinc-500 border-b border-zinc-700/50 flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                    selectedWorkflow === 'main' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {selectedWorkflow}
                  </span>
                  {status === 'new' && !existingWorkflow && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setWorkflowStep('workflow'); }}
                      className="text-zinc-500 hover:text-zinc-300 underline"
                    >
                      change
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleLaunch(false); }}
                disabled={launching}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                New session
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleLaunch(true); }}
                disabled={launching}
                className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50 border-t border-zinc-700/50"
              >
                Existing session
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
